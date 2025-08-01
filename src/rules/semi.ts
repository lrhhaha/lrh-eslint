import type {
  Node as ESTreeNode,
  Identifier,
  VariableDeclarator,
  VariableDeclaration,
} from "estree";
import type { Report } from "../types";

export default {
  meta: {
    docs: "semi",
  },

  create(ctx: any) {
    const reports: Report[] = [];

    return {
      // 返回报告
      report: function () {
        // const reports: Report[] = [];
        return reports;
      },
      Program: function (
        node: ESTreeNode,
        parent: ESTreeNode | null
      ) {
        const { tokens, body } = node as any
        body.forEach((node: ESTreeNode) => {
          const { end } = node as any;

          const token = tokens.find((it: any) => it.end === end)

          if (token) {
            const { type, value } = token
            if (type !== 'Punctuator' || value !== ';') {
              reports.push({
                // node,
                message: `line:${token.loc.start.line} - column:${token.loc.end.column} => semi`
              })
            } 
          } else {
            console.error('can not find target token')
          }

        })
      },
    };
  },
};
