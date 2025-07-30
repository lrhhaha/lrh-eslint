#!/usr/bin/env node

const { program } = require('commander');
const path = require('path');
import { run } from "./linter";

program
  .name('mini-eslint')
  .argument('<path>')

program.parse();

const inputPath = program.args[0];
// 根据当前工作目录（process.cwd()）进行计算得到绝对路径
const absolutePath = path.resolve(inputPath);


run(absolutePath)

