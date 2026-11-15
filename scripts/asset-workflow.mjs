import { readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const REPORT_PATH = path.join(ROOT, 'public', 'models', 'asset-report.json');
export const MANIFEST_PATH = path.join(ROOT, 'data', 'assets.ts');
export const FORMAT_BUDGETS = {
  shuttle: 5, issInternal: 15, missionControlRoom: 5, vab: 3, headquarters: 2,
  astronaut: 3, markIIISuit: 3, landsat8: 2, jason1: 2, starMap: 3,
};
export const TOTAL_BUDGET_MB = 30;
export const TARGET_EXTENTS_M = {
  shuttle: 37, issInternal: 4, missionControlRoom: 25, vab: 160, headquarters: 25,
  astronaut: 1.8, markIIISuit: 2.1, landsat8: 9, jason1: 7, starMap: 100,
};

export async function readReport() {
  try {
    return JSON.parse(await readFile(REPORT_PATH, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error('asset-report.json bulunamadı. Önce npm run fetch-assets çalıştırın.');
    }
    throw error;
  }
}

export async function writeReport(report) {
  report.updatedAt = new Date().toISOString();
  await writeFile(REPORT_PATH, JSON.stringify(report, null, 2) + '\n', 'utf8');
}

export async function updateManifest(updates) {
  let source = await readFile(MANIFEST_PATH, 'utf8');
  for (const [id, update] of Object.entries(updates)) {
    const lines = source.split(/\r?\n/);
    const index = lines.findIndex((line) => line.includes("id: '" + id + "'"));
    if (index < 0) throw new Error('Manifest kaydı bulunamadı: ' + id);
    let line = lines[index];
    if (update.scale !== undefined) {
      if (/\bscale:\s*[0-9.]+/.test(line)) line = line.replace(/\bscale:\s*[0-9.]+/, 'scale: ' + update.scale);
    }
    if (update.position !== undefined) {
      const value = '[' + update.position.map((entry) => Number(entry.toFixed(5))).join(', ') + ']';
      if (/\bposition:\s*\[[^\]]*\]/.test(line)) line = line.replace(/\bposition:\s*\[[^\]]*\]/, 'position: ' + value);
    }
    if (/\bstatus:\s*'[^']*'/.test(line)) line = line.replace(/\bstatus:\s*'[^']*'/, "status: '" + update.status + "'");
    else line = line.replace(/,\s*optional:\s*(true|false)(\s*},?)$/, (whole, optional, ending) => ', optional: ' + optional + ", status: '" + update.status + "'" + ending);
    lines[index] = line;
    source = lines.join('\n');
  }
  await writeFile(MANIFEST_PATH, source, 'utf8');
}

export function reportAsset(report, id) {
  const asset = report.assets.find((entry) => entry.id === id);
  if (!asset) throw new Error('Varlık raporunda kayıt yok: ' + id);
  return asset;
}

export function fileSizeMB(bytes) {
  return Number((bytes / (1024 * 1024)).toFixed(2));
}

export async function discoverTool(name, args = ['--version']) {
  if (name === 'gltf-transform') {
    const scripts = [
      path.join(ROOT, 'node_modules', '@gltf-transform', 'cli', 'bin', 'cli.js'),
      ...(process.env.APPDATA ? [path.join(process.env.APPDATA, 'npm', 'node_modules', '@gltf-transform', 'cli', 'bin', 'cli.js')] : []),
    ];
    for (const script of scripts) {
      try {
        await readFile(script);
        const result = await new Promise((resolve) => {
          const child = spawn(process.execPath, [script, ...args], { cwd: ROOT, windowsHide: true });
          let output = '';
          child.stdout.on('data', (chunk) => { output += chunk; });
          child.stderr.on('data', (chunk) => { output += chunk; });
          child.on('error', (error) => resolve({ code: 1, output: error.message }));
          child.on('close', (code) => resolve({ code: code ?? 1, output }));
        });
        if (result.code === 0) return { available: true, executable: process.execPath, prefixArgs: [script], output: result.output.trim() };
      } catch {}
    }
  }
  const executable = process.platform === 'win32' ? name + '.cmd' : name;
  const local = path.join(ROOT, 'node_modules', '.bin', executable);
  const global = process.platform === 'win32' && process.env.APPDATA
    ? path.join(process.env.APPDATA, 'npm', executable) : executable;
  const candidates = [local, global, executable, name];
  for (const candidate of candidates) {
    try {
      const result = await new Promise((resolve) => {
        const child = process.platform === 'win32' && candidate.toLowerCase().endsWith('.cmd')
          ? spawn('cmd.exe', ['/d', '/s', '/c', '"' + candidate + '" ' + args.map((arg) => '"' + arg.replace(/"/g, '""') + '"').join(' ')], { cwd: ROOT, windowsHide: true })
          : spawn(candidate, args, { cwd: ROOT, windowsHide: true });
        let output = '';
        child.stdout.on('data', (chunk) => { output += chunk; });
        child.stderr.on('data', (chunk) => { output += chunk; });
        child.on('error', (error) => resolve({ code: 1, output: error.message }));
        child.on('close', (code) => resolve({ code: code ?? 1, output }));
      });
      if (result.code === 0) return { available: true, executable: candidate, output: result.output.trim() };
    } catch {}
  }
  return { available: false, executable: null, output: null };
}
