import { mkdir, writeFile, copyFile, stat, rename, rm, open } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import { extractAssetLinks, fileInfo, mb } from './asset-utils.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const modelsDir = path.join(root, 'public', 'models');
const rawDir = path.join(modelsDir, 'raw');
const pageTimeout = positiveNumber('ASSET_PAGE_TIMEOUT_MS', 20000);
const downloadTimeout = positiveNumber('ASSET_DOWNLOAD_TIMEOUT_MS', 600000);

function positiveNumber(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function message(error) {
  return error instanceof Error
    ? error.message + (error.cause?.code ? ' (' + error.cause.code + ')' : '')
    : String(error);
}

async function get(url, timeout) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(timeout),
    headers: { 'User-Agent': 'Mission180-AssetFetcher/0.1', Accept: '*/*' },
  });
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error('HTTP ' + response.status + ': ' + url);
  }
  return response;
}

async function validateGLB(filePath, size) {
  const file = await open(filePath, 'r');
  try {
    const header = Buffer.alloc(12);
    await file.read(header, 0, 12, 0);
    if (header.toString('ascii', 0, 4) !== 'glTF' || header.readUInt32LE(4) !== 2 || header.readUInt32LE(8) !== size) {
      throw new Error('Geçerli GLB 2.0 başlığı/boyutu bulunamadı');
    }
  } finally { await file.close(); }
}

async function download(url, target, format) {
  const response = await get(url, downloadTimeout);
  const mime = response.headers.get('content-type') ?? '';
  if (mime.toLowerCase().includes('text/html')) {
    await response.body?.cancel();
    throw new Error('Dosya yerine HTML döndü: ' + url);
  }
  const lengthHeader = response.headers.get('content-length');
  const expected = lengthHeader === null ? null : Number(lengthHeader);
  const encoded = response.headers.get('content-encoding');
  const existing = await stat(target).catch(() => null);
  if (existing?.isFile() && existing.size > 0 && !encoded && expected === existing.size) {
    await response.body?.cancel();
    if (format === 'glb') await validateGLB(target, existing.size);
    return { sizeBytes: existing.size, status: 'cached' };
  }
  if (!response.body) throw new Error('Yanıt gövdesi boş');
  const temporary = target + '.part';
  let sizeBytes = 0;
  try {
    const counter = new Transform({
      transform(chunk, _encoding, callback) { sizeBytes += chunk.length; callback(null, chunk); },
    });
    await pipeline(Readable.fromWeb(response.body), counter, createWriteStream(temporary));
    if (!sizeBytes) throw new Error('İndirilen dosya boş');
    if (!encoded && expected !== null && sizeBytes !== expected) throw new Error('İndirme boyutu eşleşmiyor');
    if (format === 'glb') await validateGLB(temporary, sizeBytes);
    await rename(temporary, target);
    return { sizeBytes, status: 'downloaded' };
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
}

async function processAsset(asset) {
  const result = {
    id: asset.id, label: asset.label, sourcePage: asset.sourcePage,
    files: [], formats: [], sizeMB: 0, hasGLB: false, glbPath: null,
    warnings: [], errors: [],
  };
  console.log('[' + asset.id + '] NASA kaynak sayfası okunuyor…');
  try {
    const response = await get(asset.sourcePage, pageTimeout);
    const links = extractAssetLinks(await response.text(), asset.sourcePage);
    if (!links.length) result.warnings.push('İndirilebilir dosya bulunamadı');
    const names = new Map();
    for (const url of links) {
      let record = { url, fileName: null, format: null, localPath: null, sizeBytes: 0, sizeMB: 0, status: 'failed', error: null };
      result.files.push(record);
      try {
        const info = fileInfo(url);
        Object.assign(record, info);
        // Different source URLs with the same real filename get separate folders.
        const nameKey = info.fileName.toLowerCase();
        const duplicate = names.get(nameKey) ?? 0;
        names.set(nameKey, duplicate + 1);
        const directory = path.join(rawDir, asset.id, ...(duplicate ? ['source-' + (duplicate + 1)] : []));
        await mkdir(directory, { recursive: true });
        const target = path.join(directory, info.fileName);
        console.log('[' + asset.id + '] İndiriliyor: ' + info.fileName);
        Object.assign(record, await download(url, target, info.format));
        record.localPath = '/' + path.relative(path.join(root, 'public'), target).split(path.sep).join('/');
        record.sizeMB = mb(record.sizeBytes);
        if (record.sizeBytes > 250 * 1024 * 1024) result.warnings.push(info.fileName + ': 250 MB’tan büyük');
        if (info.format === 'glb' && !result.hasGLB) {
          await copyFile(target, path.join(modelsDir, asset.id + '.glb'));
          result.hasGLB = true;
          result.glbPath = asset.localPath;
        }
        console.log('[' + asset.id + '] ' + record.sizeMB + ' MB · ' + record.status);
      } catch (error) {
        record.error = message(error);
        result.errors.push(url + ': ' + record.error);
        console.warn('[' + asset.id + '] ' + record.error);
      }
    }
  } catch (error) {
    result.errors.push(message(error));
    console.warn('[' + asset.id + '] ' + message(error));
  }
  // Keep valid user-provided models visible in the report even if NASA is offline.
  if (!result.hasGLB) {
    const local = path.join(modelsDir, asset.id + '.glb');
    try {
      const info = await stat(local);
      await validateGLB(local, info.size);
      result.hasGLB = true;
      result.glbPath = asset.localPath;
      result.files.push({
        url: null, fileName: asset.id + '.glb', format: 'glb',
        localPath: asset.localPath, sizeBytes: info.size, sizeMB: mb(info.size),
        status: 'local', origin: 'existing-local', error: null,
      });
    } catch (error) {
      if (error.code !== 'ENOENT') result.warnings.push('Yerel GLB doğrulanamadı: ' + message(error));
    }
  }
  const successful = result.files.filter((file) => file.status !== 'failed');
  result.formats = [...new Set(successful.map((file) => file.format))];
  result.sizeMB = mb(successful.reduce((sum, file) => sum + file.sizeBytes, 0));
  if (!result.hasGLB) result.warnings.push('GLB yok, dönüştürme gerekir (veya kaynak indirmesi tamamlanmalı)');
  if (result.formats.includes('gltf')) result.warnings.push('GLTF dış .bin/doku bağımlılıkları içerebilir; bağlantısız bağımlılıklar otomatik indirilmez');
  return result;
}

async function main() {
  await mkdir(rawDir, { recursive: true });
  const { assets } = await import(pathToFileURL(path.join(root, 'data', 'assets.ts')).href);
  const results = new Array(assets.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(3, assets.length) }, async () => {
    while (cursor < assets.length) {
      const index = cursor++;
      results[index] = await processAsset(assets[index]);
    }
  }));
  const report = {
    generatedAt: new Date().toISOString(),
    sizeUnit: 'MiB (bytes / 1048576)',
    note: 'Yalnız kaynak HTML içindeki gerçek NASA indirme bağlantıları. ZIP çıkarma ve format dönüştürme yapılmaz.',
    assets: results,
  };
  const reportPath = path.join(modelsDir, 'asset-report.json');
  await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
  console.table(results.map(({ id, formats, sizeMB, hasGLB, errors }) => ({
    id, format: formats.join(', ') || 'bulunamadı', MB: sizeMB, GLB: hasGLB ? 'evet' : 'hayır', hata: errors.length,
  })));
  console.log('Rapor: ' + reportPath);
}

main().catch((error) => {
  console.error('Rapor yazılamadı / betik başlatılamadı:', message(error));
  process.exitCode = 1;
});
