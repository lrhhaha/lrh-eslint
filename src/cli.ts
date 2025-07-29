import * as espree from "espree";
import estraverse from "estraverse";
import type {
  Node as ESTreeNode,
  Identifier,
  VariableDeclarator,
  VariableDeclaration,
} from "estree";

// 已声明变量列表
const declared: Map<
  string,
  { kind: "let" | "var" | "const" | "using" | "await using" }
> = new Map();

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

// 收集变量声明
estraverse.traverse(ast as ESTreeNode, {
  enter: function (node, parent) {
    // VariableDeclarator - 包含变量声明的"变量名"和"变量值"
    if (node.type === "VariableDeclarator") {
      // Identifier - 标识符，变量名
      const name = (node.id as Identifier).name;
      // VariableDeclaration - 变量声明语句最外层，可获取声明方式（let、var、const）
      const kind = (parent as VariableDeclaration)!.kind;
      declared.set(name, { kind });
    }
  },
  leave: function (node, parent) {},
});

console.log('已声明的变量列表', declared);


// 遍历所有标识符，从已声明的变量列表中剔除
estraverse.traverse(ast as ESTreeNode, {
  enter: function (node, parent) {
    // 标识符，包含global上的属性和自定义变量（即console、log、a都在）
    if (node.type === "Identifier" && parent?.type !== "VariableDeclarator") {
      // node为对象本身或其属性
      if (parent?.type === "MemberExpression") {
        // node为对象本身
        if (parent.object === node) {
          // 判断它是否为全局对象的属性
          if (Object.hasOwn(global, node.name)) {
            return;
          } else {
            if (declared.has(node.name)) {
              console.log("删除1");
              declared.delete(node.name);
            }
          }
        } else {
          // node为属性
          // 判断属性是如何使用的：obj.a 还是 obj[a]
          if (parent.computed) {
            // obj[a] 形式
            if (declared.has(node.name)) {
              console.log("删除2");
              declared.delete(node.name);
            }
          } else {
            // obj.a 形式，不处理
          }
        }
      } else {
        // 全局对象上的非对象属性
        if (Object.hasOwn(global, node.name)) {
          return;
        } else {
          if (declared.has(node.name)) {
            console.log("删除3");
            declared.delete(node.name);
          }
        }
      }
    }
  },
  leave: function (node, parent) {},
});

console.log('未使用的变量', declared);
