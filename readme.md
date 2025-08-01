# 简介

一个简易的 Javascript 编码格式检查工具。

# 安装及使用

## 全局安装

```bash
npm install -g lrh-eslint
```

### 指定检查目标

```bash
lrh-eslint <path>
```

### 自动扫描并检测当前工作目录

```bash
lrh-eslint --global
```

## 安装至项目

```bash
npm install -D lrh-eslint
```

### 指定检查目标

```bash
npx lrh-eslint <path>
```

### 自动扫描并检测当前工作目录

```bash
npx lrh-eslint --global
```

# 自定义配置

在工作目录下添加 `.lrh-lintrc.json` 配置文件，对规则进行配置。

现支持规则的开/关，使用state配置项，配置'on'或'off'。
```json
{
  "rules": {
    "no_unused_vars": {
      "state": "on"
    }
  }
}
```

# 添加自定义规则

例：添加`不允许使用setInterval函数`的规则。

## step1： 创建规则文件

在 `src/rules` 目录中创建 `no_setInterval.ts` 文件。

程序会使用 [espree](https://github.com/eslint/js/tree/main/packages/espree) 库，将对应代码转换为符合 ESTree 规范的 AST，并使用 [estraverse](https://github.com/estools/estraverse) 进行遍历。

遍历过程中，会调用 [节点类型](https://github.com/estree/estree) 对应的钩子函数，如下文中的 CallExpression 钩子函数。

在 AST 遍历结束时，会调用 report 钩子函数，函数需将错误列表返回，无检查出错误则返回空数组。

```typescript
import type { Node as ESTreeNode } from "estree";
import type { Report } from "../types";

export default {
  meta: {
    docs: "no_setInterval",
  },

  create(ctx: any) {
    const reports: Report[] = [];

    return {
      // 返回报告
      report: function () {
        // const reports: Report[] = [];
        return reports;
      },
      // CallExpression监听器
      CallExpression: function (node: ESTreeNode, parent: ESTreeNode | null) {
        const { callee, loc } = node as any;
        if (callee.type === "Identifier" && callee.name === "setInterval") {
          reports.push({
            message: `line:${loc.start.line} - column:${loc.start.column} => no_setInterval`,
          });
        }
      },
    };
  },
};
```

## step2: 注册规则

在 `src/rules/index.ts` 文件中将编写好的 `no_setInterval.ts` 文件引入并注册

```typescript
import no_setInterval from "./no_setInterval";

const ruleCreators: { [k: string]: any } = {
  // some rules....

  // 注册
  no_setInterval,
};

// some code...
```

## step3： 构建

在项目根目录下，执行以下命令构建代码

```bash
npm run build
```
