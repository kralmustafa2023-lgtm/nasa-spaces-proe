import test from 'node:test';
import assert from 'node:assert/strict';
import { extractAssetLinks, normalizeAssetUrl, fileInfo } from './asset-utils.mjs';

const page = 'https://science.nasa.gov/3d-resources/jason-1/';

test('real anchors, parentheses, entities, emrc removal, and URL deduplication', () => {
  const html = `
    <a href="https://assets.science.nasa.gov/model(1).GLB?emrc=123&amp;download=1">GLB</a>
    <a href='https://assets.science.nasa.gov/model%281%29.GLB?download=1'>same GLB</a>
    <a href=https://assets.science.nasa.gov/model.zip?emrc=2>ZIP</a>
    <a href="//assets.science.nasa.gov/stars.tif">texture</a>
    <img src="https://assets.science.nasa.gov/never.png">
    <!-- <a href="https://assets.science.nasa.gov/comment.obj"> -->
    <script>const x = '<a href="https://assets.science.nasa.gov/fake.obj">';</script>
    <a href="https://other.nasa.gov/skip.glb">other host</a>
    <a href="https://assets.science.nasa.gov.evil.example/skip.glb">spoof</a>
    <a href="https://assets.science.nasa.gov/readme.pdf">unsupported</a>
  `;
  assert.deepEqual(extractAssetLinks(html, page), [
    'https://assets.science.nasa.gov/model%281%29.GLB?download=1',
    'https://assets.science.nasa.gov/model.zip',
    'https://assets.science.nasa.gov/stars.tif',
  ]);
});

test('existing URL encoding survives without double encoding or guessed names', () => {
  const url = normalizeAssetUrl('https://assets.science.nasa.gov/My%20Model%282%29.glb?emrc=7', page);
  assert.equal(url, 'https://assets.science.nasa.gov/My%20Model%282%29.glb');
  assert.deepEqual(fileInfo(url), { fileName: 'My Model(2).glb', format: 'glb' });
  assert.equal(normalizeAssetUrl('/missing.glb', page), null);
  assert.equal(normalizeAssetUrl('https://assets.science.nasa.gov/bad%ZZ.glb', page), null);
});

test('encoded path traversal is rejected without renaming files', () => {
  assert.throws(() => fileInfo('https://assets.science.nasa.gov/bad%2Fname.glb'));
  assert.throws(() => fileInfo('https://assets.science.nasa.gov/bad%5Cname.glb'));
});

import { mkdtemp, mkdir, writeFile, copyFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

test('fetch command downloads actual links, copies GLB, reports failures and preserves local GLB', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'mission180-fetch-test-'));
  try {
    await mkdir(path.join(root, 'scripts'));
    await mkdir(path.join(root, 'data'));
    await mkdir(path.join(root, 'public', 'models'), { recursive: true });
    for (const file of ['fetch-assets.mjs', 'asset-utils.mjs']) {
      await copyFile(new URL('./' + file, import.meta.url), path.join(root, 'scripts', file));
    }
    await writeFile(path.join(root, 'package.json'), '{"type":"module"}');
    await writeFile(path.join(root, 'data', 'assets.ts'), `export const assets = [
      {id:'working',label:'Working',sourcePage:'https://science.nasa.gov/good/',localPath:'/models/working.glb'},
      {id:'offline',label:'Offline',sourcePage:'https://science.nasa.gov/offline/',localPath:'/models/offline.glb'},
      {id:'after',label:'After',sourcePage:'https://science.nasa.gov/after/',localPath:'/models/after.glb'}
    ];`);
    const glb = Buffer.alloc(24);
    glb.write('glTF'); glb.writeUInt32LE(2,4); glb.writeUInt32LE(24,8);
    glb.writeUInt32LE(4,12); glb.writeUInt32LE(0x4e4f534a,16); glb.write('{}  ',20);
    await writeFile(path.join(root,'public','models','offline.glb'),glb);
    await writeFile(path.join(root, 'mock.mjs'), `
      const glb = Buffer.from('${glb.toString('base64')}', 'base64');
      globalThis.fetch = async (input) => {
        const url = new URL(input);
        if(url.pathname==='/offline/')throw new Error('fixture network failure');
        if(url.hostname==='science.nasa.gov')return new Response('<a href="https://assets.science.nasa.gov/Real(1).glb?emrc=42">GLB</a><a href="https://assets.science.nasa.gov/texture.png">PNG</a>');
        if(url.searchParams.has('emrc'))throw new Error('emrc was not stripped');
        const isGLB=url.pathname.endsWith('.glb');
        const body=isGLB?glb:Buffer.from([1,2,3]);
        return new Response(body,{headers:{'content-length':String(body.length),'content-type':isGLB?'model/gltf-binary':'image/png'}});
      };
    `);
    const run = spawnSync(process.execPath, ['--import', pathToFileURL(path.join(root,'mock.mjs')).href, path.join(root,'scripts','fetch-assets.mjs')], { cwd:root, encoding:'utf8', timeout:30000 });
    assert.equal(run.status,0,run.stderr);
    const report=JSON.parse(await readFile(path.join(root,'public','models','asset-report.json'),'utf8'));
    assert.equal(report.assets.length,3);
    for(const item of report.assets)assert.equal(item.hasGLB,true);
    assert.deepEqual(report.assets[0].formats,['glb','png']);
    assert.equal(report.assets[1].errors.length,1);
    assert.equal(report.assets[1].files[0].status,'local');
    assert.equal(report.assets[2].errors.length,0);
    assert.deepEqual(await readFile(path.join(root,'public','models','working.glb')),glb);
    assert.deepEqual(await readFile(path.join(root,'public','models','raw','working','Real(1).glb')),glb);
  } finally {
    const resolved=path.resolve(root);
    assert.equal(path.dirname(resolved),path.resolve(tmpdir()));
    assert.ok(path.basename(resolved).startsWith('mission180-fetch-test-'));
    await rm(resolved,{recursive:true,force:true});
  }
});
