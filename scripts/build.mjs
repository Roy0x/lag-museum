import { build } from 'esbuild';
import { resolve } from 'node:path';
await build({
  entryPoints: [resolve('src/renderer.js')],
  outfile: resolve('dist/renderer.js'),
  bundle: true,
  platform: 'browser',
  format: 'iife',
  target: 'chrome120',
  sourcemap: true,
  logLevel: 'info',
});
