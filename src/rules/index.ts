import no_unused_vars from "./no_unused_vars";
import semi from "./semi";
import type { Rules, NodeType } from "../types";
import fs from "node:fs";
import nodePath from "node:path";

// 所有规则
const ruleCreators: { [k: string]: any } = {
  no_unused_vars,
  semi
};

const listenersMap: Map<NodeType, [Function]> = new Map();

initRules();

// 根据传入配置初始化rules
function initRules() {
  // 获取配置文件配置
  const configRules = getConfig();

  // 所有在配置文件中配置了的规则名称
  const ruleNames = configRules ? Object.keys(configRules) : [];

  // 默认规则
  const rules = generateDefaultRules();

  // 规则融合
  ruleNames.forEach((ruleName) => {
    rules[ruleName] = {
      ...rules[ruleName],
      ...configRules[ruleName],
    };
  });

  // 根据融合后的规则，执行规则
  // console.log("融合a", rules);

  // 根据规则生成listen集合
  handleByRules(rules);
}

function getConfig(): Rules {
  const filePath = nodePath.join(process.cwd(), ".lrh-lintrc.json");

  try {
    if (fs.existsSync(filePath)) {
      const text = fs.readFileSync(filePath, "utf8");
      const obj = JSON.parse(text);
      return obj.rules;
    }
    return {};
  } catch (e) {
    return {};
  }
}

function handleByRules(mergeRules: Rules) {
  const ruleNames = Object.keys(mergeRules);
  const listenerList: { NodeType: Function }[] = [];

  ruleNames.forEach((name) => {
    const rule = mergeRules[name];

    const { state, testRule } = rule;

    // 校验state规则
    if (state === "on") {
      const obj = ruleCreators[name].create();
      listenerList.push(obj);
    }
  });

  listenerList.forEach((item) => {
    const keyArr = Object.entries(item) as Array<[NodeType, Function]>;

    keyArr.forEach(([type, fun]) => {
      if (listenersMap.has(type)) {
        listenersMap.get(type)!.push(fun);
      } else {
        listenersMap.set(type, [fun]);
      }
    });
  });
}

// 生成所有默认规则
function generateDefaultRules() {
  const defaultRules: Rules = {};

  const allRules = Object.keys(ruleCreators);

  allRules.map((ruleName) => {
    defaultRules[ruleName] = {
      state: "on",
      testRule: "default",
    };
  });
  // console.log(defaultRules);
  return defaultRules;
}

export default listenersMap;
