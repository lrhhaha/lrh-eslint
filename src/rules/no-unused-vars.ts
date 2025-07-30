import type {
  Node as ESTreeNode,
  Identifier,
  VariableDeclarator,
  VariableDeclaration,
} from "estree";

export default {
  meta: {
    docs: "disallow unused variables",
  },

  create(ctx: any) {
    // 已声明变量列表
    const declared: Map<
      string,
      {
        kind: "let" | "var" | "const" | "using" | "await using";
        node: ESTreeNode;
      }
    > = new Map();

    const report: {
      start: number;
      message: string;
    }[] = [];

    return {
      // 返回报告
      output: function (): {
        start: number;
        message: string;
      }[] {
        const report = []
        declared.forEach(({ node }, varName) => {
          report.push({
            start: node.start,
            message: `unused var: ${varName}`
          })
        })
        return report
      },
      VariableDeclarator: function (
        node: ESTreeNode,
        parent: ESTreeNode | null
      ) {
        if (node.type === "VariableDeclarator") {
          // Identifier - 标识符，变量名
          const name = (node.id as Identifier).name;
          // VariableDeclaration - 变量声明语句最外层，可获取声明方式（let、var、const）
          const kind = (parent as VariableDeclaration)!.kind;
          declared.set(name, { kind, node });
        }
      },
      Identifier: function (node: ESTreeNode, parent: ESTreeNode | null) {
        // 标识符，包含global上的属性和自定义变量（即console、log、a都在）
        if (
          node.type === "Identifier" &&
          parent?.type !== "VariableDeclarator"
        ) {
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
    };
  },
};
