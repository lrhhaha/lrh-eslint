# ESLint 的原理

eslint 功能主要分为：

1. 检查代码格式
2. 自动修复格式问题

本文只分析如何实现对代码的检查，以及如何实现多种检查规则。

> eslint 检查代码的原理：
>
> 1. 将代码转换为 AST（符合 ESTree 规范的 AST。ESTree 是社区公认的 JS 代码的 AST 标准格式，而非官方规范）。
> 2. 遍历 AST，在迭代具体类型的节点时，调用所有使用到此类节点的规则的回调函数。

对上述原理展开来说就是，eslint 的核心其实是遍历 AST 的“调度器”。\
而每个规则，只需专注于自己需要在哪类节点上执行什么操作，在适当的使用调用 report 函数将错误报告出去，将这些操作编写成函数，并存放在对应的同名属性上。\
而 eslint 的调度器在遍历整个 AST 时，会迭代所有节点，并且在迭代节点时，调用所有规则中定义了的与节点类型同名的回调函数。

# lrh-eslint 设计及实现

lrh-eslint 基本上遵循上述 ESLint 的设计思路。

## 核心功能

1. 使用 espree 库，将 JS 代码解析成符合 ESTree 规范的 AST，以及对代码进行 token 分词。（获得 AST 和 token 分词数组。主要产物为 AST，token 分词只是为了能提供更多关于代码的信息，以便能实现更多规则）。
2. 然后使用 estraverse 库对 AST 进行解析：递归遍历 AST，对每个节点调用回调函数，并传入 currentNode 和 parent 作为参数。在进入节点和离开节点时，分别调用 enter 和 leave 的回调函数（且符合洋葱模型的调用顺序，即最外层的 leave 函数在最后调用）。

## 辅助功能

### 设置为可在命令行中使用

因为 lrh-eslint 为工具类库，如果用户在使用时，每次都要`node ../xx/lrh-eslint/dist/out.js`执行命令的话，就会显得非常繁琐。

所以我们需要为此项目配置`命令行工具`，即使用“别名”来代替上述对 out.js 的调用。

配置方式如下，在 package.json 中：

```json
{
  "bin": {
    "lrh-eslint": "./bin/lrh-eslint.js"
  }
}
```
这意味着：命令名称：`lrh-eslint` => 对应的可执行文件：`./bin/lrh-eslint.js`（注意路径是相对于package.json的位置）。

然后在lrh-eslint.js文件开头添加Shebang：`#!/usr/bin/env node`，意思为告诉计算机使用node执行此文件。

至此，当此项目库发布为npm包时，其他用户有两种安装方式：
1. 全局安装：npm install -g your-package。用户可以任意位置的命令行中执行lrh-eslint，等同于执行node xx/xx/lrh-eslint.js
2. 安装至项目：npm install your-package。用户则需要使用npx lrh-eslint，npx会自动向上寻找，直至找到配置了lrh-eslint的库，并执行对应文件。

当然，调用此工具库时，还可以传入参数，以表明需要检查的文件等信息。为了更简便地提取命令行中传入的参数，使用commander库作为辅助（注：commander库只是方便了参数提取等功能，原则上为项目配置命令行工具是不需要使用到它的）。

### 打包
esbuild 与 rollup

### 测试
