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
1. 全局安装：npm install -g lrh-eslint。用户可以任意位置的命令行中执行lrh-eslint，等同于执行node xx/xx/lrh-eslint.js
2. 安装至项目：npm install lrh-eslint。用户则需要使用npx lrh-eslint，npx会自动向上寻找，直至找到配置了lrh-eslint的库，并执行对应文件。

当然，调用此工具库时，还可以传入参数，以表明需要检查的文件等信息。为了更简便地提取命令行中传入的参数，使用commander库作为辅助（注：commander库只是方便了参数提取等功能，原则上为项目配置命令行工具是不需要使用到它的）。

> 将本地项目注册为全局命令：\
> 在开发环境中，注册为全局依赖，模拟全局安装的效果。\
> 注册为全局依赖：npm link\
> 撤销安装：npm unlink -g lrh-eslint


### 打包

项目使用的打包工具是esbuild，之所以选择它，是因为其内置对typescript的支持，且构建速度快(因其使用go编写)。

值得展开说说的是，vite使用`esbuild` + `rollup`作为代码转换、打包工具。

> esbuild特点：
> 1. 使用go编写，构建速度快。
> 2. 原生支持ts、jsx、tsx，无需依靠插件，可直接**转换**为js。
> 3. 具有**打包**能力（注意**代码转换**与**打包**的区别，转换是一比一的转换，而打包通常会减少文件数，并且执行代码分割等相关能力），但原生能力不突出，插件生态相对不丰富。

> rollup特点：
> 1. 构建速度不如esbuild，原生不支持ts、jsx、ts等格式。
> 2. 重点是打包能力强大，如代码分割能力，且插件生态丰富，有能力构建出更优秀的生产环境文件。

它们分别承担的任务如下：

> 在开发环境中：
> 
> esbuild：
> 1. 对代码进行转换而无需打包（这就是vite作为开发服务器的核心思想）
> 2. 依赖预构建：
>     1. 将CommonJS等模块形式的依赖转换为ES模块。
>     2. 将多依赖项的模块转换为单个模块，以便减少HTTP请求。
> 3. 热模块替换（HMR）支持：只处理发生变化的模块，而不是重新构建整个应用


> 生产环境：\
> 生产环境主要由rollup承担，因为rollup拥有更强的打包构建能力，且插件生态更加丰富。即使构建速度相比esbuild慢，但强大的能力比构建速度更加重要。
> 
> rollup：
> 1. 进行代码打包(代码分割，tree shaking等)，配合丰富的插件生态，完成更多性能优化操作，
> 
> esbuild：
> 1. 承担代码压缩的任务

esbuild + rollup存在的问题：
1. 开发环境和生产环境使用不同工具对代码进行处理，可能导致开发环境与生产环境有差异
2. 使用两套工具，增加了复杂度

所以vite团队在使用rust开发rolldown，以代替esbuild + rollup的组合。力求拥有esbuild的性能和rollup丰富的打包能力。

# 测试
测试方面使用vitest进行单元测试。
主要使用vi、describe、test（别名it）、expect模块

首先是使用describe来进行分类，表明以下测试的内容范围是什么（或者测试的是哪个函数），然后就是调用test和expect函数去做具体的测试，并使用多个test函数测试各种情况。

其次就是使用vi模块进行模拟，vi模块提供各种模拟工具（主要使用vi.mock、vi.mocked、vi.fn）。

vi.mock 模拟模块的导入，对应的模块不会导入，并且后续涉及此模块的函数调用都不会执行且返回值为 undefined。

vi.mocked 模拟函数的执行，并提供对应的数据如返回值。与 vi.mock 搭配使用，mock 模拟某个模块，使其不导入，然后使用 vi.mocked 模拟此模块的函数执行，并获取期望的数据。
```javascript
import { vi } from 'vitest'
import * as fs from 'node:fs';
// 模拟模块导入，使node:fs不会真正导入
vi.mock('node:fs');

// 第三步：使用 vi.mocked 设置模拟行为
describe('getCode', () => {
  it('应该成功读取文件内容', () => {
    const mockContent = 'const a = 1;';
    
    // 使用 vi.mocked 设置返回值，如果不设置，fs.readFileSync将返回undefined
    vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

    // getCode为需要测试的函数，里面包含了调用fs.readFileSync并返回文本
    const result = getCode('test.js');
    
    // 使用 vi.mocked 验证调用
    expect(vi.mocked(fs.readFileSync)).toHaveBeenCalledWith('test.js', 'utf8');
    expect(result).toBe(mockContent);
  });
});
```

vi.fn
用于创建一个函数，并且控制他的返回值，调用次数、参数等（而不必编写代码体，要它返回什么就返回什么）
```javascript
// 创建模拟函数
const mockFn = vi.fn();
// 设置其返回值，而无需编写函数体
mockFn.mockReturnValue('fixed value');

// 可直接调用
const result = mockFn();
console.log(result); // 'fixed value'
```

# 发布为npm包
发布命令如下
```bash
npm publish
```
但因为 npm 一般使用的是淘宝源，所以发布时需要登录 cnpm 账号，但是 cnpm 账号是不允许公开注册的，所以只能将源切换为官方源，再发布（后续需要安装依赖时，切换为淘宝源）。
```bash
// 查看当前源
npm config get registry

// 设置源地址
npm congif set registry xxxxxxx

// 官方源：https://registry.npmjs.org/
// 淘宝源：https://registry.npmmirror.com/
```

