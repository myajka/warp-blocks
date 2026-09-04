"use strict";

const fs = require("node:fs");
const html = fs.readFileSync("./index.html", "utf8");
const knownIds = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
const rootRelativeAsset = html.match(/\b(?:src|href)="\/(?!\/)/);
if (rootRelativeAsset) {
  throw new Error("root-relative asset URL breaks path-based GitLab Pages deployment");
}
const values = {
  participation: "95", interval: "300", hashrate: "100",
  propagation: "50", fill: "90", txWeight: "900", elasticity: "100"
};

const noop = () => {};
const context = new Proxy({}, {
  get(target, property) {
    if (!(property in target)) target[property] = noop;
    return target[property];
  },
  set(target, property, value) { target[property] = value; return true; }
});

function element(id) {
  if (!knownIds.has(id)) throw new Error(`app.js references missing DOM id: ${id}`);
  return {
    id,
    value: values[id] ?? "",
    checked: false,
    textContent: "",
    style: {},
    width: 0,
    height: 0,
    addEventListener: noop,
    getBoundingClientRect: () => ({ width: 900, height: id === "heroClock" ? 580 : 360 }),
    getContext: () => context
  };
}

const elements = new Map();
global.document = {
  getElementById(id) {
    if (!elements.has(id)) elements.set(id, element(id));
    return elements.get(id);
  }
};
global.window = { devicePixelRatio: 1, addEventListener: noop };

require("./app.js");

setTimeout(() => {
  const expected = ["capacityMetric", "cleanMetric", "lagMetric", "tpsMetric"];
  for (const id of expected) {
    if (!document.getElementById(id).textContent) throw new Error(`${id} was not populated`);
  }
  process.stdout.write("frontend smoke test passed\n");
}, 250);
