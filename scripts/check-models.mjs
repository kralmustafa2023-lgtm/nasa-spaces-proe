import { readFile } from 'node:fs/promises';
import { assets } from '../data/assets.ts';

let available = 0;
for (const asset of assets) {
  try {
    const bytes = await readFile('public' + asset.localPath);
    if (bytes.toString('ascii', 0, 4) !== 'glTF' || bytes.readUInt32LE(4) !== 2 || bytes.readUInt32LE(8) !== bytes.length) throw new Error('Geçersiz GLB');
    const gltf = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString('utf8').trim());
    const external = [...(gltf.buffers ?? []), ...(gltf.images ?? [])].filter(item => item.uri && !item.uri.startsWith('data:'));
    if (external.length) throw new Error('Dış bağımlılıklar var: ' + external.map(item => item.uri).join(', '));
    console.log(asset.id + ': GLB 2.0 doğrulandı; ' + (bytes.length / 1048576).toFixed(2) + ' MB');
    available++;
  } catch (error) {
    if (error.code === 'ENOENT') console.log(asset.id + ': eksik — yer tutucu kullanılacak');
    else { console.error(asset.id + ': ' + error.message); process.exitCode = 1; }
  }
}
console.log(available + '/' + assets.length + ' model mevcut.');
