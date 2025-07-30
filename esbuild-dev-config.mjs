import * as esbuild from "esbuild";

let ctx = await esbuild.context({
  platform: "node",
  entryPoints: ["src/cli.ts"],
  outfile: "bin/mini-eslint.js",
  bundle: true,
  // packages: 'external',
});

await ctx.watch();
console.log("watching...");
