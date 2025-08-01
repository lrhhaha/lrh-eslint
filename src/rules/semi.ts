import type { Node as ESTreeNode } from "estree";
import type { Report } from "../types";

export default {
  meta: {
    docs: "semi",
  },

  create(ctx: any) {
    const reports: Report[] = [];
    let tokens: any = null;
    return {
      // 返回报告
      report: function () {
        // const reports: Report[] = [];
        return reports;
      },
      // 所有节点
      all: function (node: ESTreeNode, parent: ESTreeNode | null) {
        const { body, type } = node as any;
        if (body === undefined) return;

        if (type === "Program") tokens = (node as any).tokens;

        body.forEach((node: ESTreeNode) => {
          const { end } = node as any;

          const token = tokens.find((it: any) => it.end === end);

          if (token) {
            const { type, value } = token;
            if (type !== "Punctuator" || value !== ";") {
              reports.push({
                // node,
                message: `line:${token.loc.start.line} - column:${token.loc.end.column} => semi`,
              });
            }
          } else {
            console.error("can not find target token");
          }
        });
      },
      // Program: function (node: ESTreeNode, parent: ESTreeNode | null) {
      //   const { tokens, body } = node as any;

      //   body.forEach((node: ESTreeNode) => {
      //     const { end } = node as any;

      //     const token = tokens.find((it: any) => it.end === end);

      //     if (token) {
      //       const { type, value } = token;
      //       if (type !== "Punctuator" || value !== ";") {
      //         reports.push({
      //           // node,
      //           message: `line:${token.loc.start.line} - column:${token.loc.end.column} => semi`,
      //         });
      //       }
      //     } else {
      //       console.error("can not find target token");
      //     }
      //   });
      // },
    };
  },
};
