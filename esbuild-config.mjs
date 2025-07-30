import * as esbuild from 'esbuild'

await esbuild.build({
  platform: 'node',
  entryPoints: ['src/cli.ts'],
  bundle: true,
  outfile: 'bin/mini-eslint.js',
  packages: 'external',
})