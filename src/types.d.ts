export type Rules = {
  [key: string]: {
    state: "on" | "off";
    testRule: 'default' | 'hello'
  };
};

export type Config = {
  rules: Rule;
};
