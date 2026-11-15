import path from 'node:path';

export const ALLOWED_FORMATS = new Set(['glb', 'gltf', 'fbx', 'obj', '3ds', 'blend', 'zip', 'jpg', 'png', 'tif']);

function decodeEntities(text) {
  return text.replace(/&(?:amp|quot|apos|lt|gt|#x[0-9a-f]+|#\d+);/gi, (entity) => {
    const named = { '&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>' };
    const lower = entity.toLowerCase();
    if (named[lower]) return named[lower];
    const hex = lower.startsWith('&#x');
    const code = Number.parseInt(lower.slice(hex ? 3 : 2, -1), hex ? 16 : 10);
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : entity;
  });
}

export function normalizeAssetUrl(href, sourcePage) {
  try {
    const url = new URL(decodeEntities(href), sourcePage);
    if (url.protocol !== 'https:' || url.hostname !== 'assets.science.nasa.gov') return null;
    const format = path.posix.extname(decodeURIComponent(url.pathname)).slice(1).toLowerCase();
    if (!ALLOWED_FORMATS.has(format)) return null;
    for (const key of [...url.searchParams.keys()]) {
      if (key.toLowerCase() === 'emrc') url.searchParams.delete(key);
    }
    url.hash = '';
    url.pathname = url.pathname.replace(/\(/g, '%28').replace(/\)/g, '%29')
      .replace(/%28/gi, '%28').replace(/%29/gi, '%29');
    return url.href;
  } catch { return null; }
}

export function extractAssetLinks(html, sourcePage) {
  // Only actual anchor hrefs: no guessed URLs or script/image source attributes.
  const anchors = html.replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
  const links = new Set();
  for (const anchor of anchors.matchAll(/<a\b[^>]*>/gi)) {
    const match = anchor[0].match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>\x60]+))/i);
    if (!match) continue;
    const url = normalizeAssetUrl(match[1] ?? match[2] ?? match[3], sourcePage);
    if (url) links.add(url);
  }
  return [...links].sort();
}

export function fileInfo(url) {
  const parsed = new URL(url);
  const fileName = decodeURIComponent(path.posix.basename(parsed.pathname));
  // Keep the real filename; do not silently invent a replacement.
  if (!fileName || fileName === '.' || fileName === '..' || /[<>:"|?*\\/\x00-\x1f]/.test(fileName) || /[. ]$/.test(fileName)) {
    throw new Error('Dosya adı bu dosya sisteminde güvenle saklanamıyor: ' + fileName);
  }
  return { fileName, format: path.posix.extname(fileName).slice(1).toLowerCase() };
}

export function mb(bytes) { return Number((bytes / (1024 * 1024)).toFixed(2)); }
