import { build } from 'esbuild';
await build({
  entryPoints: ['src/renderer.js'],
  outfile: 'dist/renderer.js',
  bundle: true,
  platform: 'browser',
  format: 'iife',
  target: 'chrome120',
  sourcemap: true,
  logLevel: 'info',
});
