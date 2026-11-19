import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const katalog = JSON.parse(readFileSync(path.join(root, "data/katalog.json"), "utf8"));

const miete = [
  ["10075", "bauzaun-10075", "Bauzaun Profi 3,5 × 2,0 m"],
  ["10012", "plane-10012", "Sichtschutzplane"],
  ["10002.1", "zubehoer-10002-1", "Verbindungsschelle 2,5 mm"],
  ["10006", "fuss-10006", "Kunststofffuß schwer 23 kg"],
  ["10024.1", "schranke-10024-1", "Kunststoff Schrankenzaun mit Folie RA1"],
  ["10024.3", "schranke-10024-3", "Kunststoff Schrankenzaun mit Folie RA2"],
  ["10026", "absperrung-10026", "Absperrgitter leicht"],
  ["", "hochlader", "Hochlader"],
  ["", "planenanhaenger", "Planenanhänger"],
  ["", "kofferanhaenger", "Kofferanhänger"],
  ["", "fahrzeugtransporter", "Fahrzeugtransporter"],
  ["", "kuehlanhaenger", "Kühlanhänger"],
  ["", "kuehlanhaenger-events", "Kühlanhänger für Events"]
];

test("jedes Katalogprodukt ist kaufbar, die Testauswahl zusätzlich mietbar", () => {
  assert.ok(katalog.length > 13);
  const bySlug = new Map(katalog.map((product) => [product.slug, product]));
  for (const product of katalog) {
    assert.deepEqual(product.modi.includes("kauf"), true, product.slug);
    assert.equal(product.preis, null, product.slug);
  }
  const marked = katalog.filter((product) => product.modi.includes("miete")).map((product) => product.slug).sort();
  assert.deepEqual(marked, miete.map((row) => row[1]).sort());
  for (const [code, slug, name] of miete) {
    const product = bySlug.get(slug);
    assert.equal(product.name, name);
    assert.equal(product.code || "", code);
    assert.deepEqual(product.modi, ["kauf", "miete"]);
  }
  assert.equal(bySlug.get("bauzaun-10075-1").modi.includes("miete"), false);
  assert.equal(bySlug.get("schranke-10024-4").modi.includes("miete"), false);
  assert.equal(bySlug.get("absperrung-10025-0").modi.includes("miete"), false);
});
