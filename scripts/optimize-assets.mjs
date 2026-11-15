import { access, copyFile, readFile, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import {
  FORMAT_BUDGETS, ROOT, TOTAL_BUDGET_MB, discoverTool, fileSizeMB,
  readReport, updateManifest, writeReport,
} from './asset-workflow.mjs';

const run = (tool, args) => new Promise((resolve) => {
  const child = spawn(tool.executable, [...(tool.prefixArgs ?? []), ...args], { cwd: ROOT, windowsHide: true });
  let output = '';
  child.stdout?.on('data', (chunk) => { output += chunk; });
  child.stderr?.on('data', (chunk) => { output += chunk; });
  child.on('error', (error) => resolve({ code: 1, output: output + error.message }));
  child.on('close', (code) => resolve({ code: code ?? 1, output }));
});

async function exists(file) {
  try { await access(file); return true; } catch { return false; }
}

async function glbSize(file) {
  if (!(await exists(file))) return null;
  return fileSizeMB((await stat(file)).size);
}

function hasFlags(help) {
  const required = ['--compress', '--texture-compress', '--texture-size', '--simplify-ratio'];
  return required.every((flag) => help.includes(flag));
}

async function main() {
  const report = await readReport();
  const cli = await discoverTool('gltf-transform', ['--version']);
  let help = null;
  if (cli.available) {
    const result = await run(cli, ['optimize', '--help']);
    help = result.output;
    report.gltfTransformOptimizeHelp = help.slice(0, 12000);
  }
  report.optimizationTool = {
    available: cli.available,
    executable: cli.executable,
    version: cli.output,
    optimizeHelpChecked: Boolean(help),
    requiredFlagsFound: Boolean(help && hasFlags(help)),
  };
  const updates = {};
  let projectedBytes = 0;
  for (const entry of report.assets) {
    const file = path.join(ROOT, 'public', 'models', entry.id + '.glb');
    if (await exists(file)) projectedBytes += (await stat(file)).size;
  }

  for (const item of report.assets) {
    const input = path.join(ROOT, 'public', 'models', item.id + '.glb');
    if (!(await exists(input))) {
      if (!item.hasGLB) updates[item.id] = { status: 'missing' };
      item.optimization = { status: item.hasGLB ? 'needs-manual' : 'missing', note: 'Optimize edilecek GLB yok.' };
      continue;
    }
    const inputSize = (await stat(input)).size;
    let final = input;
    let outputSize = inputSize;
    const budget = FORMAT_BUDGETS[item.id] * 1024 * 1024;
    item.optimization = { sourceMB: fileSizeMB(inputSize), budgetMB: FORMAT_BUDGETS[item.id], status: 'needs-manual' };

    if (!cli.available || !help || !hasFlags(help)) {
      item.optimization.note = !cli.available
        ? '@gltf-transform/cli bulunamadı; npm install sonrasında tekrar çalıştırın.'
        : 'optimize --help içinde gerekli bayraklar doğrulanamadı; güvenli otomatik dönüşüm atlandı.';
    } else {
      const textureSize = ['issInternal', 'missionControlRoom'].includes(item.id) ? 2048 : 1024;
      const simplify = inputSize > budget;
      const simplifyRatios = item.id === 'issInternal' ? [0.7, 0.1] : simplify ? [0.7, 0.4, 0.2, 0.1] : [1];
      const candidates = [];
      for (const ratio of simplifyRatios) {
        const output = path.join(os.tmpdir(), 'mission180-' + item.id + '-' + String(ratio).replace('.', '') + '.glb');
        const args = ['optimize', input, output, '--compress', 'meshopt', '--texture-compress', 'webp', '--texture-size', String(textureSize), '--simplify', String(simplify), '--weld', 'true'];
        if (simplify) args.push('--simplify-ratio', String(ratio));
        const result = await run(cli, args);
        if (result.code || !(await exists(output))) {
          item.optimization.attempts ??= [];
          item.optimization.attempts.push({ simplifyRatio: ratio, error: result.output.slice(-2000) });
          continue;
        }
        candidates.push({ path: output, bytes: (await stat(output)).size, ratio });
        if (candidates.at(-1).bytes <= budget) break;
        if (item.id === 'issInternal' && candidates.length >= 2) break;
      }
      const acceptable = candidates.find((candidate) => candidate.bytes <= budget);
      if (acceptable) {
        final = acceptable.path;
        outputSize = acceptable.bytes;
        item.optimization = { ...item.optimization, status: 'optimized', simplifyRatio: acceptable.ratio, outputMB: fileSizeMB(outputSize), textureSize, compression: 'meshopt', textureCompression: 'webp' };
      } else if (item.id === 'issInternal' && candidates.length >= 2) {
        item.optimization.status = 'fallback';
        item.optimization.note = 'İki simplify denemesinden sonra 15 MB sınırına sığmadı; ISS iç modeli devre dışı bırakıldı.';
        item.optimization.attempts ??= [];
        item.optimization.attempts.push(...candidates.map((candidate) => ({ simplifyRatio: candidate.ratio, outputMB: fileSizeMB(candidate.bytes) })));
      } else {
        item.optimization.note = 'Bütçeye uygun çıktı üretilemedi; GLB ve ham kaynak değiştirilmedi.';
      }
    }

    if (final !== input) {
      const temp = input + '.optimized';
      await copyFile(final, temp);
      await writeFile(input, await readFile(temp));
      await rm(temp, { force: true });
      projectedBytes = projectedBytes - inputSize + outputSize;
    }
    item.sizeMB = fileSizeMB(final === input ? inputSize : outputSize);
    item.optimization.finalMB = fileSizeMB(final === input ? inputSize : outputSize);
    updates[item.id] = { status: item.optimization.status === 'optimized' ? 'ok' : item.optimization.status };
    console.log(item.id + ': ' + item.optimization.status + ', ' + fileSizeMB(outputSize) + ' MiB (bütçe ' + FORMAT_BUDGETS[item.id] + ' MiB)');
  }

  report.manualSteps = report.assets
    .filter((item) => ['needs-manual', 'fallback', 'missing'].includes(item.optimization?.status))
    .map((item) => {
      const previous = report.manualSteps?.find((step) => step.id === item.id);
      const steps = item.optimization.status === 'needs-manual'
        ? ['npm install ile @gltf-transform/cli paketini kurun.', 'gltf-transform optimize --help çıktısında bayrakları doğrulayın.', 'Model hedef boyutuna inene kadar simplify oranını kademeli azaltıp WebP doku ve MESHOPT sıkıştırmasını deneyin.']
        : item.optimization.status === 'fallback'
          ? ['ISS iç modelinde iki simplify denemesi bütçeyi karşılamadı.', 'Modeli dışarıda bırakın veya daha sade bir GLB üretip yeniden deneyin.']
          : ['NASA kaynak sayfasından modeli indirin.', 'Modeli Blender ile GLB biçiminde dışa aktarın.'];
      return { id: item.id, status: item.optimization.status, steps: [...new Set([...(previous?.steps ?? []), ...steps])] };
    });
  report.finalTotalMB = fileSizeMB(projectedBytes);
  report.totalBudgetMB = TOTAL_BUDGET_MB;
  if (report.finalTotalMB > TOTAL_BUDGET_MB) report.budgetWarning = 'Toplam GLB boyutu 30 MiB sınırını aşıyor.';
  try { await updateManifest(updates); }
  catch (error) { report.manifestUpdateError = error.message; console.warn(error.message); }
  await writeReport(report);
  console.log('Toplam: ' + report.finalTotalMB + ' / ' + TOTAL_BUDGET_MB + ' MiB');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
