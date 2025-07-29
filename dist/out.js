"use strict";
import * as espree from "espree";
import estraverse from "estraverse";
const declared = /* @__PURE__ */ new Map();
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
estraverse.traverse(ast, {
  enter: function(node, parent) {
    if (node.type === "VariableDeclarator") {
      const name = node.id.name;
      const kind = parent.kind;
      declared.set(name, { kind });
    }
  },
  leave: function(node, parent) {
  }
});
console.log("\u5DF2\u58F0\u660E\u7684\u53D8\u91CF\u5217\u8868", declared);
estraverse.traverse(ast, {
  enter: function(node, parent) {
    if (node.type === "Identifier" && parent?.type !== "VariableDeclarator") {
      if (parent?.type === "MemberExpression") {
        if (parent.object === node) {
          if (Object.hasOwn(global, node.name)) {
            return;
          } else {
            if (declared.has(node.name)) {
              console.log("\u5220\u96641");
              declared.delete(node.name);
            }
          }
        } else {
          if (parent.computed) {
            if (declared.has(node.name)) {
              console.log("\u5220\u96642");
              declared.delete(node.name);
            }
          } else {
          }
        }
      } else {
        if (Object.hasOwn(global, node.name)) {
          return;
        } else {
          if (declared.has(node.name)) {
            console.log("\u5220\u96643");
            declared.delete(node.name);
          }
        }
      }
    }
  },
  leave: function(node, parent) {
  }
});
console.log("\u672A\u4F7F\u7528\u7684\u53D8\u91CF", declared);
