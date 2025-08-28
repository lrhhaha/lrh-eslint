#!/usr/bin/env node

const { program } = require("commander");
const path = require("path");
import run from "./linter";

program
  .name("lrh-eslint")
  .option("--global", "是否扫描当前目录")
  .argument("[path]", "文件路径");

program.parse();

const options = program.opts();

// 是否是global模式
const isGlobal = options.global === true;
// 文件路径
const inputPath = program.args[0];

// 两个参数都不传
if (!isGlobal && inputPath === undefined) {
  process.exit(1);
} else if (isGlobal && inputPath !== undefined) {
  // 两个参数都传
  process.exit(1);
} else if (inputPath !== undefined) {
  // 只传了路径

  // 根据当前工作目录（process.cwd()）进行计算得到绝对路径
  const absolutePath = path.resolve(inputPath);
  run({ path: absolutePath });
} else {
  // 只传了global
  run({ isGlobal: true });
}
