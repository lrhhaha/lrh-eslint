import * as esbuild from "esbuild";

let ctx = await esbuild.context({
  platform: "node",
  entryPoints: ["src/cli.ts"],
  outfile: "dist/out.js",
  bundle: true,
  packages: 'external', //  不要打包外部依赖
});

await ctx.watch();
console.log("watching...");
