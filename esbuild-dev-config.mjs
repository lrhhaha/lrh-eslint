import * as esbuild from 'esbuild'

let ctx = await esbuild.context({
  platform: 'node',
   entryPoints: ['src/linter.ts'],
  outfile: 'dist/out.js',
  bundle: true,
  // packages: 'external',
})

await ctx.watch()
console.log('watching...')