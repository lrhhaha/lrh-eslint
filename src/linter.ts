import * as espree from "espree";
import estraverse from "estraverse";
import type { Node as ESTreeNode } from "estree";
// import listenersMap from "./rules";
import initListenersMap from "./rules";
import fs from "node:fs";
import nodePath from "node:path";
import chalk from "chalk";
import type { NodeType, ListenersMap } from "./types";

let errorFlag = false;

// 入口函数
export default function run({ path, isGlobal }: { path?: string; isGlobal?: boolean }) {
  if (path) {
    worker(path);
  } else if (isGlobal) {
    const files = getAllJsFile(process.cwd());
    files.forEach((filePath) => worker(filePath));
  }

  process.exit(errorFlag ? 1 : 0);
}

// 单个文件的检查流程
export function worker(path: string) {
  // 读取代码
  const text = getCode(path)!;

  // code -> AST
  const ast = getAST(text);

  // 初始化回调函数
  const listenersMap = initListenersMap();

  // 遍历AST，调用回调函数
  traverseAST(listenersMap, ast as ESTreeNode, path);
}

// 读取代码
export function getCode(path: string) {
  // 读取文本文件
  try {
    const data = fs.readFileSync(path, "utf8");
    return data;
  } catch (err) {
    console.error("读取文件失败:", err);
  }
}

// code -> AST
export function getAST(code: string) {
  const ast = espree.parse(code, {
    ecmaVersion: 2022,
    tokens: true,
    loc: true,
  });
  // console.dir(ast, { depth: null });
  return ast;
}

// 遍历AST，调用回调函数
export function traverseAST(
  listenersMap: ListenersMap,
  ast: ESTreeNode,
  filePath: string
) {
  estraverse.traverse(ast as ESTreeNode, {
    enter: function (node, parent) {
      if (listenersMap.has("all" as any)) {
        const fns = listenersMap.get("all" as any);
        // console.log('>>', fns);
        fns?.forEach((fn) => fn(node, parent));
      }

      if (listenersMap.has(node.type as NodeType)) {
        const funs = listenersMap.get(node.type as NodeType);
        funs?.forEach((fn) => fn(node, parent));
      }
    },
    leave: function (node) {
      if (node.type === "Program") {
        const leaveFns = listenersMap.get("report" as NodeType);
        leaveFns?.forEach((fn) => {
          errorFlag = true;
          const report = fn();

          report.forEach(({ message }: any) => {
            // console.log(node)
            // const { start } = node.loc
            // const { line, column } = start
            // console.log(chalk.red(`Position: line:${line} - column:${column} - ${message}`));
            console.log(chalk.red(`${filePath} - ${message}`));
          });
        });
      }
    },
  });
}

// 全局模式，获取当前工作目录所有JS文件
export function getAllJsFile(dirPath: string) {
  try {
    const files = fs.readdirSync(dirPath);
    const allFiles: string[] = [];

    files.forEach((file) => {
      const filePath = nodePath.join(dirPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isFile()) {
        // console.log(filePath, '???');
        if (filePath.endsWith(".js")) allFiles.push(filePath);
      } else if (stat.isDirectory()) {
        // 排除node_modules目录
        if (file !== "node_modules") {
          // 递归读取子目录
          const subFiles = getAllJsFile(filePath);
          allFiles.push(...subFiles);
        }
      }
    });

    return allFiles;
  } catch (error) {
    console.error("读取目录时出错:", error);
    return [];
  }
}
