import type { NodeMap, Node as ESTreeNode, } from "estree";

export type Rules = {
  [key: string]: {
    state: "on" | "off";
    testRule: 'default' | 'hello'
  };
};

export type Config = {
  rules: Rule;
};

export type Report = {
  // start: number;
  node: ESTreeNode;
  message: string;
}

export type NodeType = keyof NodeMap;