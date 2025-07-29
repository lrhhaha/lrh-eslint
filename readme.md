# 依赖库

## esbuild
- 项目打包
- 提供开发环境实时打包功能
[官方文档]()
## espree

将 js 代码片段解析为符合 ESTree 规范的 AST。

[官方文档](https://github.com/eslint/js/blob/main/packages/espree/README.md)

### ESTree

`ESTree 是一个JavaScript 抽象语法树（Abstract Syntax Tree）的标准规范`

ESTree 定义了各种节点类型，比如：

- Program - 程序根节点
- VariableDeclaration - 变量声明
- FunctionDeclaration - 函数声明
- ExpressionStatement - 表达式语句
- Identifier - 标识符
- Literal - 字面量

[ESTree 的 type 说明](https://rain120.github.io/study-notes/fe/babel/ast/estree-spec/)

## estraverse
`用于遍历符合ESTree规范的AST`

[官方文档](https://www.npmjs.com/package/estraverse)
