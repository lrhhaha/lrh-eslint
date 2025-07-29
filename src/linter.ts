import * as espree from "espree";
import estraverse from "estraverse";
import type {
  Node as ESTreeNode,
  Identifier,
  VariableDeclarator,
  VariableDeclaration,
} from "estree";
import noUnusedVarsRule from "./rules/no-unused-vars";

const code1 = `
  let a = 1;
  let b = 2
  console.log(a)
`;

const code2 = `
  let a = 'b';
  let obj = {
    b: 2
  }
  console.log(obj.b)
`;

const code3 = `
  let a = 'b';
  let obj = {
    b: 2
  }
  console.log(obj[a])
`;

const code4 = `
  let a = 'b';
  let obj = {
    b: 2
  }
  if (1) {
    console.log(obj[a])
  }
`;



const ast = espree.parse(code4, { ecmaVersion: 2022 });
// console.dir(ast, { depth: null });


const noUnusedVarsListeners = noUnusedVarsRule.create(null)

estraverse.traverse(ast as ESTreeNode, {
  enter: function (node, parent) {
    worker(node, parent, noUnusedVarsListeners)
  }
})

function worker(node: ESTreeNode, parent: ESTreeNode | null, listeners: any) {
  const arr = Object.keys(listeners)
  if (arr.includes(node.type)) {
    const fn = listeners[node.type];
    fn(node, parent)
  }
}

noUnusedVarsListeners.output()