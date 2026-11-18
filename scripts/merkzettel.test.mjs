import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadCart() {
  const counts = [];
  function node() {
    return {
      className: "",
      hidden: true,
      innerHTML: "",
      textContent: "",
      setAttribute() {},
      getAttribute() { return "anfrage/"; },
      removeAttribute() {},
      addEventListener() {},
      focus() {},
      querySelector() { return node(); },
    };
  }
  const document = {
    body: { appendChild() {} },
    addEventListener() {},
    createElement() { return node(); },
    querySelector() { return null; },
    querySelectorAll(selector) {
      if (selector === "[data-wunsch-count]") return counts;
      return [];
    },
  };
  const store = {};
  const context = {
    document,
    localStorage: {
      getItem(key) { return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null; },
      setItem(key, value) { store[key] = String(value); },
      removeItem(key) { delete store[key]; },
    },
    setTimeout,
    clearTimeout,
    window: null,
  };
  context.window = context;
  counts.push(node());
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(repo, "js/merkzettel.js"), "utf8"), context);
  return { wunsch: context.AMK_WUNSCH, badge: counts[0] };
}

test("der Korbzähler zählt Positionen, nicht die Stückzahlen", () => {
  const { wunsch, badge } = loadCart();
  assert.equal(badge.textContent, "0");
  wunsch.save([
    { id: "miete:schild:z123", name: "Z 123 Arbeitsstelle", qty: 4, kat: "verkehrssicherung" },
    { id: "miete:hochlader", name: "Hochlader", qty: 1, sammel: true, kat: "anhaenger" },
  ], true);
  assert.equal(badge.textContent, "2");
  assert.equal(wunsch.load().reduce((sum, item) => sum + item.qty, 0), 5);
});
