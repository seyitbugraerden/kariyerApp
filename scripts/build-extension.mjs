import { build } from 'esbuild';
import { mkdir, copyFile } from 'node:fs/promises';
const out = 'outputs/pusula-extension';
await mkdir(out, { recursive: true });
await build({ entryPoints: ['extension/background.js', 'extension/reader.js'], bundle: true, platform: 'browser', format: 'iife', target: 'chrome120', outdir: out, minify: true });
for (const file of ['manifest.json', 'bridge.js', 'popup.html', 'popup.js']) await copyFile('extension/' + file, out + '/' + file);
console.log('Extension built: ' + out);
