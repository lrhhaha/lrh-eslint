import * as espree from "espree";
import estraverse from 'estraverse'


const code = `
  let a = 1;
  let b = 2;
  let c = 3;
  console.log(a + b + 1);

`

const ast = espree.parse(code, { ecmaVersion: 2020 });

console.log(ast)

// estraverse.traverse(ast, {
//     enter: function (node, parent) {
//         if (node.type == 'FunctionExpression' || node.type == 'FunctionDeclaration')
//             return estraverse.VisitorOption.Skip;
//     },
//     leave: function (node, parent) {
//         if (node.type == 'VariableDeclarator')
//           console.log(node.id.name);
//     }
// });