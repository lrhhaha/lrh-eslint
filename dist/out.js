#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/linter.ts
var espree = __toESM(require("espree"));
var import_estraverse = __toESM(require("estraverse"));

// src/rules/no_unused_vars.ts
var no_unused_vars_default = {
  meta: {
    docs: "disallow unused variables"
  },
  create(ctx) {
    const declared = /* @__PURE__ */ new Map();
    return {
      // 返回报告
      report: function() {
        const reports = [];
        declared.forEach(({ node }, varName) => {
          const { start } = node.loc;
          const { line, column } = start;
          reports.push({
            // start: (node as any).start,
            // node,
            message: `line:${line} - column:${column} => unused var: ${varName}`
          });
        });
        return reports;
      },
      VariableDeclarator: function(node, parent) {
        if (node.type === "VariableDeclarator") {
          const name = node.id.name;
          const kind = parent.kind;
          declared.set(name, { kind, node });
        }
      },
      Identifier: function(node, parent) {
        if (node.type === "Identifier" && parent?.type !== "VariableDeclarator") {
          if (parent?.type === "MemberExpression") {
            if (parent.object === node) {
              if (Object.hasOwn(global, node.name)) {
                return;
              } else {
                if (declared.has(node.name)) {
                  console.log("\u5220\u96641");
                  declared.delete(node.name);
                }
              }
            } else {
              if (parent.computed) {
                if (declared.has(node.name)) {
                  console.log("\u5220\u96642");
                  declared.delete(node.name);
                }
              } else {
              }
            }
          } else {
            if (Object.hasOwn(global, node.name)) {
              return;
            } else {
              if (declared.has(node.name)) {
                console.log("\u5220\u96643");
                declared.delete(node.name);
              }
            }
          }
        }
      }
    };
  }
};

// src/rules/semi.ts
var semi_default = {
  meta: {
    docs: "semi"
  },
  create(ctx) {
    const reports = [];
    return {
      // 返回报告
      report: function() {
        return reports;
      },
      Program: function(node, parent) {
        const { tokens, body } = node;
        body.forEach((node2) => {
          const { end } = node2;
          const token = tokens.find((it) => it.end === end);
          if (token) {
            const { type, value } = token;
            if (type !== "Punctuator" || value !== ";") {
              reports.push({
                // node,
                message: `line:${token.loc.start.line} - column:${token.loc.end.column} => semi`
              });
            }
          } else {
            console.error("can not find target token");
          }
        });
      }
    };
  }
};

// src/rules/index.ts
var import_node_fs = __toESM(require("node:fs"));
var import_node_path = __toESM(require("node:path"));
var ruleCreators = {
  no_unused_vars: no_unused_vars_default,
  semi: semi_default
};
var listenersMap = /* @__PURE__ */ new Map();
initRules();
function initRules() {
  const configRules = getConfig();
  const ruleNames = configRules ? Object.keys(configRules) : [];
  const rules = generateDefaultRules();
  ruleNames.forEach((ruleName) => {
    rules[ruleName] = {
      ...rules[ruleName],
      ...configRules[ruleName]
    };
  });
  handleByRules(rules);
}
function getConfig() {
  const filePath = import_node_path.default.join(process.cwd(), ".lrh-lintrc.json");
  try {
    if (import_node_fs.default.existsSync(filePath)) {
      const text = import_node_fs.default.readFileSync(filePath, "utf8");
      const obj = JSON.parse(text);
      return obj.rules;
    }
    return {};
  } catch (e) {
    return {};
  }
}
function handleByRules(mergeRules) {
  const ruleNames = Object.keys(mergeRules);
  const listenerList = [];
  ruleNames.forEach((name) => {
    const rule = mergeRules[name];
    const { state } = rule;
    if (state === "on") {
      const obj = ruleCreators[name].create();
      listenerList.push(obj);
    }
  });
  listenerList.forEach((item) => {
    const keyArr = Object.entries(item);
    keyArr.forEach(([type, fun]) => {
      if (listenersMap.has(type)) {
        listenersMap.get(type).push(fun);
      } else {
        listenersMap.set(type, [fun]);
      }
    });
  });
}
function generateDefaultRules() {
  const defaultRules = {};
  const allRules = Object.keys(ruleCreators);
  allRules.map((ruleName) => {
    defaultRules[ruleName] = {
      state: "on"
    };
  });
  return defaultRules;
}
var rules_default = listenersMap;

// src/linter.ts
var import_node_fs2 = __toESM(require("node:fs"));
var import_node_path2 = __toESM(require("node:path"));
var import_chalk = __toESM(require("chalk"));
var errorFlag = false;
function run({ path: path2, isGlobal: isGlobal2 }) {
  if (path2) {
    worker(path2);
  } else if (isGlobal2) {
    const files = getAllJsFile(process.cwd());
    files.forEach((filePath) => worker(filePath));
  }
  process.exit(errorFlag ? 1 : 0);
}
function worker(path2) {
  const text = getCode(path2);
  const ast = getAST(text);
  traverseAST(ast);
}
function getCode(path2) {
  try {
    const data = import_node_fs2.default.readFileSync(path2, "utf8");
    return data;
  } catch (err) {
    console.error("\u8BFB\u53D6\u6587\u4EF6\u5931\u8D25:", err);
  }
}
function getAST(code) {
  const ast = espree.parse(code, {
    ecmaVersion: 2022,
    tokens: true,
    loc: true
  });
  return ast;
}
function traverseAST(ast) {
  import_estraverse.default.traverse(ast, {
    enter: function(node, parent) {
      if (rules_default.has(node.type)) {
        const funs = rules_default.get(node.type);
        funs?.forEach((fn) => fn(node, parent));
      }
    },
    leave: function(node) {
      if (node.type === "Program") {
        const leaveFns = rules_default.get("report");
        leaveFns?.forEach((fn) => {
          errorFlag = true;
          const report = fn();
          report.forEach(({ message }) => {
            console.log(import_chalk.default.red(`${message}`));
          });
        });
      }
    }
  });
}
function getAllJsFile(dirPath) {
  try {
    const files = import_node_fs2.default.readdirSync(dirPath);
    const allFiles = [];
    files.forEach((file) => {
      const filePath = import_node_path2.default.join(dirPath, file);
      const stat = import_node_fs2.default.statSync(filePath);
      if (stat.isFile()) {
        if (filePath.endsWith(".js")) allFiles.push(filePath);
      } else if (stat.isDirectory()) {
        if (file !== "node_modules") {
          const subFiles = getAllJsFile(filePath);
          allFiles.push(...subFiles);
        }
      }
    });
    return allFiles;
  } catch (error) {
    console.error("\u8BFB\u53D6\u76EE\u5F55\u65F6\u51FA\u9519:", error);
    return [];
  }
}

// src/cli.ts
var { program } = require("commander");
var path = require("path");
program.name("lrh-eslint").option("--global", "\u662F\u5426\u626B\u63CF\u5F53\u524D\u76EE\u5F55").argument("[path]", "\u6587\u4EF6\u8DEF\u5F84");
program.parse();
var options = program.opts();
var isGlobal = options.global === true;
var inputPath = program.args[0];
if (!isGlobal && inputPath === void 0) {
  process.exit(1);
} else if (isGlobal && inputPath !== void 0) {
  process.exit(1);
} else if (inputPath !== void 0) {
  const absolutePath = path.resolve(inputPath);
  run({ path: absolutePath });
} else {
  run({ isGlobal: true });
}
