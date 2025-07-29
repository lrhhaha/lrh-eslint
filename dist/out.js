"use strict";
import * as espree from "espree";
const code = `
  let a = 1;
  let b = 2;
  let c = 3;
  console.log(a + b + 1);

`;
const ast = espree.parse(code, { ecmaVersion: 2020 });
console.log(ast);
