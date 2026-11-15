import { access, mkdir, readdir, stat, copyFile, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import {
  ROOT, REPORT_PATH, discoverTool, readReport, reportAsset, updateManifest, writeReport,
} from './asset-workflow.mjs';

const run = (command, args, options = {}) => new Promise((resolve) => {
  const child = spawn(command, args, { cwd: ROOT, windowsHide: true, ...options });
  let output = '';
  child.stdout?.on('data', (chunk) => { output += chunk; });
  child.stderr?.on('data', (chunk) => { output += chunk; });
  child.on('error', (error) => resolve({ code: 1, output: output + error.message }));
  child.on('close', (code) => resolve({ code: code ?? 1, output }));
});

async function exists(file) {
  try { await access(file); return true; } catch { return false; }
}

async function walk(directory) {
  const output = [];
  if (!(await exists(directory))) return output;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await walk(file));
    else output.push(file);
  }
  return output;
}

function isSceneFile(file) {
  return ['.blend', '.fbx', '.gltf', '.glb', '.obj', '.3ds'].includes(path.extname(file).toLowerCase());
}

async function unpackArchives(files, temp) {
  const archives = files.filter((file) => path.extname(file).toLowerCase() === '.zip');
  const extracted = [];
  const tar = process.platform === 'win32' ? 'tar.exe' : 'tar';
  for (const [index, archive] of archives.entries()) {
    const directory = path.join(temp, 'zip-' + index);
    await mkdir(directory, { recursive: true });
    const result = await run(tar, ['-xf', archive, '-C', directory]);
    if (result.code) console.warn('[convert] ZIP açılamadı: ' + archive + '\n' + result.output);
    else extracted.push(...(await walk(directory)).filter(isSceneFile));
  }
  return extracted;
}

async function findSources(asset) {
  const raw = path.join(ROOT, 'public', 'models', 'raw', asset.id);
  const files = await walk(raw);
  const extracted = await unpackArchives(files, path.join(os.tmpdir(), 'mission180-' + asset.id));
  return [...files.filter(isSceneFile), ...extracted];
}

async function validateGlb(file) {
  const bytes = await readFile(file);
  if (bytes.toString('ascii', 0, 4) !== 'glTF' || bytes.readUInt32LE(4) !== 2 || bytes.readUInt32LE(8) !== bytes.length) {
    throw new Error('Çıktı geçerli GLB 2.0 değil');
  }
}

async function main() {
  const report = await readReport();
  const blender = await discoverTool('blender', ['--version']);
  const assimp = await discoverTool('assimp', ['version']);
  const fbx2gltf = await discoverTool('FBX2glTF', ['--help']);
  report.conversionTools = { blender, assimp, fbx2gltf };
  const updates = {};

  for (const item of report.assets) {
    try {
      const manifest = reportAsset(report, item.id);
      const final = path.join(ROOT, 'public', 'models', item.id + '.glb');
      if (await exists(final)) {
        await validateGlb(final);
        updates[item.id] = { status: 'needs-manual' };
        item.conversion = { status: 'not-needed', note: 'GLB zaten vardı; dönüşüm atlandı.' };
        continue;
      }

      const sources = (await findSources(manifest)).sort(async (a, b) => (await stat(b)).size - (await stat(a)).size);
      const sourceStats = await Promise.all(sources.map(async (file) => ({ file, size: (await stat(file)).size })));
      sourceStats.sort((a, b) => b.size - a.size);
      item.zipSceneCandidates = sourceStats.map(({ file, size }) => ({ file: path.relative(ROOT, file), sizeBytes: size }));
      if (!sourceStats.length) {
        updates[item.id] = { status: 'missing' };
        item.conversion = { status: 'missing', note: 'Rapor ve raw klasöründe dönüştürülebilir kaynak dosya yok.' };
        continue;
      }

      const source = sourceStats[0].file;
      item.conversion = { selectedSource: path.relative(ROOT, source), sceneCandidates: item.zipSceneCandidates };
      if (path.extname(source).toLowerCase() === '.glb') {
        await validateGlb(source);
        await copyFile(source, final);
        item.hasGLB = true;
        item.glbPath = '/models/' + item.id + '.glb';
        item.conversion.status = 'copied-glb';
        item.conversion.note = 'Ham klasördeki GLB doğrulandı ve model yoluna kopyalandı; Blender gerekmedi.';
        updates[item.id] = { status: 'needs-manual' };
        continue;
      }
      if (blender.available) {
        const output = path.join(os.tmpdir(), 'mission180-' + item.id + '.glb');
        const result = await run(blender.executable, ['--background', '--python', path.join(ROOT, 'scripts', 'blender-convert.py'), '--', source, output]);
        item.conversion.log = result.output;
        const textureWarning = result.output.match(/MISSING_TEXTURES=(.*)/)?.[1];
        if (textureWarning) item.warnings.push('Eksik doku: ' + textureWarning);
        if (result.code === 0 && await exists(output)) {
          await validateGlb(output);
          await copyFile(output, final);
          item.hasGLB = true;
          item.glbPath = '/models/' + item.id + '.glb';
          item.conversion.status = 'converted';
          updates[item.id] = { status: 'needs-manual' };
          continue;
        }
        item.conversion.error = result.output || 'Blender GLB çıktısı üretmedi.';
      } else if (assimp.available && path.extname(source).toLowerCase() !== '.blend') {
        const output = path.join(os.tmpdir(), 'mission180-' + item.id + '.glb');
        const result = await run(assimp.executable, ['export', source, output, '-f', 'glb2']);
        item.conversion.log = result.output;
        if (result.code === 0 && await exists(output)) {
          await validateGlb(output);
          await copyFile(output, final);
          item.hasGLB = true;
          item.glbPath = '/models/' + item.id + '.glb';
          item.conversion.status = 'converted';
          updates[item.id] = { status: 'needs-manual' };
          continue;
        }
        item.conversion.error = result.output || 'Assimp GLB çıktısı üretmedi.';
      } else if (fbx2gltf.available && path.extname(source).toLowerCase() === '.fbx') {
        item.conversion.error = 'FBX2glTF bulundu ancak doğrulanmış çıktı bayrakları belirlenemedi.';
      }
      item.conversion.status = 'needs-manual';
      item.conversion.note = 'Blender, Assimp veya desteklenen FBX2glTF dönüştürücüsü kurup kaynak sahneyi GLB olarak dışa aktarın.';
      updates[item.id] = { status: 'needs-manual' };
    } catch (error) {
      const item = report.assets.find((entry) => entry.id === item.id);
      item.conversion = { status: 'error', error: error.message };
      updates[item.id] = { status: item.hasGLB ? 'needs-manual' : 'missing' };
      console.error('[' + item.id + '] ' + error.message);
    }
  }

  report.manualSteps = report.assets.filter((item) => item.conversion?.status === 'missing' || item.conversion?.status === 'needs-manual')
    .map((item) => ({
      id: item.id,
      status: item.conversion.status,
      steps: item.conversion.status === 'missing'
        ? ['NASA kaynak sayfasından model dosyasını indirin.', 'Özgün dosya adını koruyarak public/models/raw/' + item.id + '/ içine koyun.', 'Blender ile GLB olarak dışa aktarın.']
        : ['Blender kurun veya ilgili format için Assimp/FBX2glTF kurun.', 'Kaynak dosyayı Blender ile açın; eksik dokuları yeniden bağlayın.', 'GLB (Binary), dokular gömülü biçimde dışa aktarın.'],
    }));
  try { await updateManifest(updates); }
  catch (error) { report.manifestUpdateError = error.message; console.warn(error.message); }
  await writeReport(report);
  console.log('Dönüştürme aşaması tamamlandı: ' + report.assets.length + ' varlık incelendi.');
}

main().catch(async (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
