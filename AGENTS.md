# AGENTS.md

本文档为在 `lrh-eslint` 代码库工作的 AI Agent 提供上下文和指令。

## 项目概览

`lrh-eslint` 是一个简易的 JavaScript 代码风格检查工具（Linter）。它使用 `espree` 将 JavaScript 代码解析为 AST（抽象语法树），使用 `estraverse` 进行遍历，并检查规则违规情况。

- **语言**: TypeScript
- **运行时**: Node.js
- **构建工具**: esbuild
- **测试框架**: Vitest

## 常用命令

| 命令 | 描述 |
|---------|-------------|
| `npm run build` | 使用 `esbuild` 构建项目到 `dist/` 目录。 |
| `npm run dev` | 使用 `esbuild` 以开发模式运行。 |
| `npm test` | 使用 `vitest` 运行所有测试。 |
| `npm run test:coverage` | 运行测试并生成覆盖率报告。 |
| `npx vitest run <file>` | 运行指定的测试文件。 |

## 代码库结构

- `src/cli.ts`: CLI 入口点。使用 `commander` 处理参数解析。
- `src/linter.ts`: Linter 核心逻辑。处理文件读取、AST 解析、遍历和错误报告。
- `src/rules/`: 包含 Linter 规则的目录。
  - 规则文件命名采用 `snake_case`（如 `no_unused_vars.ts`）或简单名称（如 `semi.ts`）。
  - `src/rules/index.ts`: 注册所有规则。
- `src/tests/`: 包含测试文件（`*.test.ts`）。

## 编码规范

### 1. 语言与类型
- 所有新代码使用 **TypeScript**。
- 使用严格类型。除非绝对必要（例如处理类型缺失的复杂 AST 节点），否则避免使用 `any`。
- 导入 `estree` 类型用于 AST 节点：`import type { Node as ESTreeNode } from "estree";`。

### 2. 导入 (Imports)
- 使用 `import` / `export` 语法 (ES Modules)。
- Node.js 内置模块使用 `node:` 前缀（例如 `import fs from "node:fs";`）。
- 导入分组：先外部依赖，后内部模块。

### 3. 命名约定
- **变量/函数**: `camelCase`（例如 `run`, `listenersMap`, `traverseAST`）。
- **文件**:
  - 核心文件：`camelCase` 或小写（例如 `cli.ts`, `linter.ts`）。
  - 规则文件：`snake_case`，以符合标准 ESLint 规则命名（例如 `no_unused_vars.ts`）。
- **目录**: `kebab-case` 或小写。

### 4. 格式化与风格
- **缩进**: 2 个空格。
- **引号**: 优先使用双引号 `"`。
- **分号**: 必须使用。
- **注释**: 代码注释优先使用**简体中文**（与现有文件保持一致）。

### 5. 错误处理
- 文件 I/O 操作使用 `try...catch`。
- 使用 `console.error` 记录错误。
- CLI 中的致命错误使用 `process.exit(1)`。

## 规则开发指南

添加新规则的步骤：
1.  **创建规则文件**: 在 `src/rules/` 中创建文件（例如 `src/rules/my_rule.ts`）。
2.  **结构**:
    ```typescript
    import type { Node as ESTreeNode } from "estree";
    import type { Report } from "../types";

    export default {
      meta: {
        docs: "rule_name", // 规则名称
      },
      create(ctx: any) {
        const reports: Report[] = [];
        return {
          report: function () {
            return reports;
          },
          // 为 AST 节点类型添加监听器
          Identifier: function (node: ESTreeNode, parent: ESTreeNode | null) {
            // 逻辑代码
            reports.push({ message: "错误信息" });
          },
        };
      },
    };
    ```
3.  **注册**: 在 `src/rules/index.ts` 中导入并添加该规则。
4.  **测试**: 在 `src/tests/` 中添加测试用例以验证规则逻辑。

## AI Agent 行为准则

- **综合分析**: 当被要求实现功能时，首先检查 `src/` 中的现有实现以匹配风格。
- **测试**: 修改核心逻辑或规则后，务必运行测试。
- **本地化**: 遵守现有的语言选择（中文注释），并使用用户发起对话时的语言（英文/中文）与用户交流。
