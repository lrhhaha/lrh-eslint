import * as espree from "espree";
import estraverse from "estraverse";
import type {
  Node as ESTreeNode,
  Identifier,
  VariableDeclarator,
  VariableDeclaration,
} from "estree";
import listenersMap from "./rules";
import fs from "node:fs";
import type { NodeMap } from "estree";
type NodeType = keyof NodeMap;

function getCode(path: string) {
  // 读取文本文件
  try {
    const data = fs.readFileSync(path, "utf8");
    return data;
  } catch (err) {
    console.error("读取文件失败:", err);
  }
}

function getAST(code: string) {
  const ast = espree.parse(code, { ecmaVersion: 2022 });
  // console.dir(ast, { depth: null });
  return ast;
}

function traverseAST(ast: ESTreeNode) {
  estraverse.traverse(ast as ESTreeNode, {
    enter: function (node, parent) {
      if (listenersMap.has(node.type as NodeType)) {
        const funs = listenersMap.get(node.type as NodeType);
        funs?.forEach((fn) => fn(node, parent));
      }
    },
    leave: function (node) {
      if (node.type === "Program") {
        const leaveFns = listenersMap.get("output" as NodeType);
        leaveFns?.forEach((fn) => fn());
      }
    },
  });
}

export function run(path: string) {
  const text = getCode(path)!;
  const ast = getAST(text);
  traverseAST(ast as ESTreeNode);
}
