import { access, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  ROOT, TARGET_EXTENTS_M, fileSizeMB, readReport, updateManifest, writeReport,
} from './asset-workflow.mjs';

const report = await readReport();
const manifestSource = await readFile(path.join(ROOT, 'data', 'assets.ts'), 'utf8');

function manifestValues(id) {
  const line = manifestSource.split(/\r?\n/).find((entry) => entry.includes("id: '" + id + "'"));
  if (!line) throw new Error('Manifest kaydı yok: ' + id);
  const rotation = line.match(/rotation:\s*\[([^\]]+)\]/)?.[1].split(',').map((value) => value.trim() === 'Math.PI / 2' ? Math.PI / 2 : Number(value)) ?? [0, 0, 0];
  const position = line.match(/position:\s*\[([^\]]+)\]/)?.[1].split(',').map(Number) ?? [0, 0, 0];
  return { rotation, position };
}

function readGlb(bytes) {
  if (bytes.toString('ascii', 0, 4) !== 'glTF' || bytes.readUInt32LE(4) !== 2 || bytes.readUInt32LE(8) !== bytes.length) {
    throw new Error('Geçerli GLB 2.0 başlığı/boyutu bulunamadı');
  }
  let offset = 12;
  let json = null;
  let binary = null;
  while (offset + 8 <= bytes.length) {
    const length = bytes.readUInt32LE(offset);
    const type = bytes.readUInt32LE(offset + 4);
    const data = bytes.subarray(offset + 8, offset + 8 + length);
    if (type === 0x4e4f534a) json = JSON.parse(data.toString('utf8').trim());
    if (type === 0x004e4942) binary = data;
    offset += 8 + length;
  }
  if (!json) throw new Error('GLB içinde JSON chunk bulunamadı');
  return { json, binary };
}

function localMatrix(node) {
  if (node.matrix) return node.matrix;
  const [x, y, z, w] = node.rotation ?? [0, 0, 0, 1];
  const [sx, sy, sz] = node.scale ?? [1, 1, 1];
  const [tx, ty, tz] = node.translation ?? [0, 0, 0];
  const x2 = x + x, y2 = y + y, z2 = z + z;
  const xx = x * x2, xy = x * y2, xz = x * z2, yy = y * y2, yz = y * z2, zz = z * z2;
  const wx = w * x2, wy = w * y2, wz = w * z2;
  return [
    (1 - (yy + zz)) * sx, (xy + wz) * sx, (xz - wy) * sx, 0,
    (xy - wz) * sy, (1 - (xx + zz)) * sy, (yz + wx) * sy, 0,
    (xz + wy) * sz, (yz - wx) * sz, (1 - (xx + yy)) * sz, 0,
    tx, ty, tz, 1,
  ];
}

function multiply(a, b) {
  const out = Array(16).fill(0);
  for (let column = 0; column < 4; column++) for (let row = 0; row < 4; row++) {
    out[column * 4 + row] = a[row] * b[column * 4] + a[4 + row] * b[column * 4 + 1] + a[8 + row] * b[column * 4 + 2] + a[12 + row] * b[column * 4 + 3];
  }
  return out;
}

function transform(point, matrix) {
  const [x, y, z] = point;
  const w = matrix[3] * x + matrix[7] * y + matrix[11] * z + matrix[15];
  return [
    (matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12]) / w,
    (matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13]) / w,
    (matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14]) / w,
  ];
}

function rotated(point, rotation) {
  let [x, y, z] = point;
  const [rx, ry, rz] = rotation;
  let nextY = y * Math.cos(rx) - z * Math.sin(rx);
  let nextZ = y * Math.sin(rx) + z * Math.cos(rx);
  y = nextY; z = nextZ;
  let nextX = x * Math.cos(ry) + z * Math.sin(ry);
  nextZ = -x * Math.sin(ry) + z * Math.cos(ry);
  x = nextX; z = nextZ;
  nextX = x * Math.cos(rz) - y * Math.sin(rz);
  nextY = x * Math.sin(rz) + y * Math.cos(rz);
  return [nextX, nextY, z];
}

function accessorBounds(gltf, binary, accessor) {
  if (accessor.min && accessor.max) return [accessor.min, accessor.max];
  const view = gltf.bufferViews?.[accessor.bufferView];
  if (!view || !binary || accessor.type !== 'VEC3' || accessor.componentType !== 5126) return null;
  const stride = view.byteStride ?? 12;
  const start = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < accessor.count; i++) for (let axis = 0; axis < 3; axis++) {
    const value = binary.readFloatLE(start + i * stride + axis * 4);
    min[axis] = Math.min(min[axis], value); max[axis] = Math.max(max[axis], value);
  }
  return [min, max];
}

function measure(gltf, binary, rotation) {
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  let triangles = 0;
  const meshes = gltf.meshes ?? [];
  for (const mesh of meshes) for (const primitive of mesh.primitives ?? []) {
    const index = primitive.indices == null ? null : gltf.accessors?.[primitive.indices];
    const position = gltf.accessors?.[primitive.attributes?.POSITION];
    const count = index?.count ?? position?.count ?? 0;
    if ((primitive.mode ?? 4) === 4) triangles += Math.floor(count / 3);
    else if ((primitive.mode ?? 4) === 5 || (primitive.mode ?? 4) === 6) triangles += Math.max(0, count - 2);
  }
  const nodes = gltf.nodes ?? [];
  const roots = gltf.scenes?.[gltf.scene ?? 0]?.nodes ?? nodes.map((_node, index) => index).filter((index) => !nodes.some((node) => node.children?.includes(index)));
  const visit = (index, parent, visited = new Set()) => {
    if (visited.has(index)) return;
    visited.add(index);
    const node = nodes[index];
    if (!node) return;
    const matrix = multiply(parent, localMatrix(node));
    const mesh = meshes[node.mesh];
    for (const primitive of mesh?.primitives ?? []) {
      const accessor = gltf.accessors?.[primitive.attributes?.POSITION];
      const bounds = accessor && accessorBounds(gltf, binary, accessor);
      if (!bounds) continue;
      for (let x = 0; x < 2; x++) for (let y = 0; y < 2; y++) for (let z = 0; z < 2; z++) {
        const point = transform([bounds[x][0], bounds[y][1], bounds[z][2]], matrix);
        const value = rotated(point, rotation);
        for (let axis = 0; axis < 3; axis++) { min[axis] = Math.min(min[axis], value[axis]); max[axis] = Math.max(max[axis], value[axis]); }
      }
    }
    for (const child of node.children ?? []) visit(child, matrix, visited);
  };
  for (const root of roots) visit(root, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  if (!Number.isFinite(min[0])) return { triangleCount: triangles, rawBounds: null };
  return { triangleCount: triangles, rawBounds: { min, max, size: min.map((value, axis) => max[axis] - value) } };
}

function imageDimensions(bytes, mimeType = '') {
  if (bytes.length >= 24 && bytes.toString('ascii', 1, 4) === 'PNG') return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), format: 'png' };
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) { offset++; continue; }
      const marker = bytes[offset + 1], length = bytes.readUInt16BE(offset + 2);
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) return { width: bytes.readUInt16BE(offset + 7), height: bytes.readUInt16BE(offset + 5), format: 'jpeg' };
      offset += Math.max(2, length + 2);
    }
  }
  if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') {
    const chunk = bytes.toString('ascii', 12, 16);
    if (chunk === 'VP8X' && bytes.length >= 30) return { width: 1 + bytes.readUIntLE(24, 3), height: 1 + bytes.readUIntLE(27, 3), format: 'webp' };
    if (chunk === 'VP8L' && bytes.length >= 25) return { width: 1 + (((bytes[22] & 0x3f) << 8) | bytes[21]), height: 1 + (((bytes[24] & 0x0f) << 10) | (bytes[23] << 2) | ((bytes[22] & 0xc0) >> 6)), format: 'webp' };
  }
  return { width: null, height: null, format: mimeType || 'unknown' };
}

async function textures(gltf, binary) {
  const output = [];
  for (const [index, image] of (gltf.images ?? []).entries()) {
    let bytes = null;
    if (image.bufferView != null && binary) {
      const view = gltf.bufferViews[image.bufferView];
      bytes = binary.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength);
    } else if (image.uri?.startsWith('data:')) {
      bytes = Buffer.from(image.uri.slice(image.uri.indexOf(',') + 1), image.uri.includes(';base64') ? 'base64' : 'utf8');
    }
    const dimensions = bytes ? imageDimensions(bytes, image.mimeType) : { width: null, height: null, format: image.mimeType ?? 'external/missing' };
    output.push({ index, name: image.name ?? image.uri ?? 'Gömülü görsel ' + (index + 1), ...dimensions });
  }
  return output;
}

async function inspect(entry) {
  const file = path.join(ROOT, 'public', 'models', entry.id + '.glb');
  try {
    const bytes = await readFile(file);
    let offset = 12, gltf = null, binary = null;
    if (bytes.toString('ascii', 0, 4) !== 'glTF' || bytes.readUInt32LE(4) !== 2 || bytes.readUInt32LE(8) !== bytes.length) throw new Error('Geçersiz GLB 2.0');
    while (offset + 8 <= bytes.length) {
      const length = bytes.readUInt32LE(offset), type = bytes.readUInt32LE(offset + 4);
      const chunk = bytes.subarray(offset + 8, offset + 8 + length);
      if (type === 0x4e4f534a) gltf = JSON.parse(chunk.toString('utf8').trim());
      if (type === 0x004e4942) binary = chunk;
      offset += 8 + length;
    }
    if (!gltf) throw new Error('GLB JSON chunk eksik');
    const { rotation, position } = manifestValues(entry.id);
    const measured = measure(gltf, binary, rotation);
    const rawSize = measured.rawBounds?.size ?? [0, 0, 0];
    const extent = Math.max(...rawSize);
    const targetExtent = TARGET_EXTENTS_M[entry.id] ?? 1;
    const scale = extent > 0 ? targetExtent / extent : 1;
    const min = measured.rawBounds?.min.map((value) => value * scale) ?? [0, 0, 0];
    const max = measured.rawBounds?.max.map((value) => value * scale) ?? [0, 0, 0];
    const centerOffset = [-((min[0] + max[0]) / 2), -min[1], -((min[2] + max[2]) / 2)];
    return {
      id: entry.id, sourceFormat: entry.formats?.join(', ') || 'glb (yerel)',
      file: '/models/' + entry.id + '.glb', sizeBytes: bytes.length, sizeMB: fileSizeMB(bytes.length),
      triangleCount: measured.triangleCount, textureCount: (gltf.images ?? []).length,
      textures: await textures(gltf, binary),
      boundingBoxMeters: { min, max, size: min.map((value, axis) => max[axis] - value) },
      rawBoundingBox: measured.rawBounds, nodeNames: (gltf.nodes ?? []).slice(0, 40).map((node, index) => node.name || 'Düğüm ' + index),
      hasAnimations: (gltf.animations ?? []).length > 0, animationCount: (gltf.animations ?? []).length,
      recommendedScale: targetExtent, recommendedCenterOffset: centerOffset,
      manifestPosition: position, status: entry.optimization?.status ?? entry.conversion?.status ?? (entry.hasGLB ? 'needs-manual' : 'missing'),
      warnings: entry.warnings ?? [],
    };
  } catch (error) {
    return {
      id: entry.id, sourceFormat: entry.formats?.join(', ') || 'bulunamadı', file: null,
      sizeBytes: 0, sizeMB: 0, triangleCount: 0, textureCount: 0, textures: [],
      boundingBoxMeters: null, rawBoundingBox: null, nodeNames: [], hasAnimations: false,
      animationCount: 0, recommendedScale: TARGET_EXTENTS_M[entry.id] ?? 1,
      recommendedCenterOffset: [0, 0, 0], manifestPosition: null,
      status: entry.optimization?.status ?? 'missing', warnings: [error.code === 'ENOENT' ? 'GLB bulunamadı' : error.message],
    };
  }
}

const metas = await Promise.all(report.assets.map(inspect));
const updates = {};
for (const meta of metas) {
  updates[meta.id] = {
    status: meta.status === 'optimized' ? 'ok' : meta.status,
    scale: meta.recommendedScale,
    ...(meta.manifestPosition ? { position: meta.manifestPosition } : {}),
  };
}
try { await updateManifest(updates); }
catch (error) { report.manifestUpdateError = error.message; console.warn(error.message); }
const models = Object.fromEntries(metas.map((meta) => [meta.id, meta]));
await writeFile(path.join(ROOT, 'public', 'models', 'model-meta.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  sizeUnit: 'MiB (bytes / 1048576)',
  boundingBoxUnit: 'metre; extents normalized to recommended real-world maximum dimension',
  note: 'Önerilen scale hedef en uzun kenardır. ModelLoader modeli merkeze alır; position manifestte sahne yerleşimi olarak korunur.',
  models,
}, null, 2) + '\n', 'utf8');
report.modelInspection = metas.map(({ id, sizeMB, triangleCount, textureCount, status, warnings }) => ({ id, sizeMB, triangleCount, textureCount, status, warnings }));
report.finalTotalMB = fileSizeMB(metas.reduce((sum, model) => sum + model.sizeBytes, 0));
await writeReport(report);
console.table(metas.map((model) => ({ id: model.id, MB: model.sizeMB, triangles: model.triangleCount, textures: model.textureCount, status: model.status })));
console.log('model-meta.json yazıldı. Toplam GLB: ' + report.finalTotalMB + ' MiB.');
