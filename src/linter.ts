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

export function run({ path, isGlobal }: { path?: string; isGlobal?: boolean }) {
  if (path) {
    worker(path);
  } else if (isGlobal) {
    const files = getAllJsFile(process.cwd());
    files.forEach((filePath) => worker(filePath));
  }

  process.exit(errorFlag ? 1 : 0);
}

export function worker(path: string) {
  // console.log(path);
  const text = getCode(path)!;
  const ast = getAST(text);

  const listenersMap = initListenersMap()

  traverseAST(listenersMap, ast as ESTreeNode, path);
}

export function getCode(path: string) {
  // 读取文本文件
  try {
    const data = fs.readFileSync(path, "utf8");
    return data;
  } catch (err) {
    console.error("读取文件失败:", err);
  }
}

export function getAST(code: string) {
  const ast = espree.parse(code, {
    ecmaVersion: 2022,
    tokens: true,
    loc: true,
  });
  // console.dir(ast, { depth: null });
  return ast;
}

export function traverseAST(listenersMap:  ListenersMap,ast: ESTreeNode, filePath: string) {
  estraverse.traverse(ast as ESTreeNode, {
    enter: function (node, parent) {
      if (listenersMap.has('all' as any)) {
        const fns = listenersMap.get('all' as any)
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
