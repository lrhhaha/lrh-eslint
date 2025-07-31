import type { NodeMap } from "estree";

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
  start: number;
  message: string;
}

export type NodeType = keyof NodeMap;