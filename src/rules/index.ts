import type { NodeMap } from "estree";
import noUnusedVars from "./no-unused-vars";
type NodeType = keyof NodeMap;

const noUnusedVarsListeners = noUnusedVars.create(null);

const array = [noUnusedVarsListeners];

const listenersMap: Map<NodeType, [Function]> = new Map();

array.forEach((item) => {
  const keyArr = Object.entries(item) as Array<[NodeType, Function]>;

  keyArr.forEach(([type, fun]) => {
    if (listenersMap.has(type)) {
      listenersMap.get(type)!.push(fun);
    } else {
      listenersMap.set(type, [fun]);
    }
  });
});

export default listenersMap;