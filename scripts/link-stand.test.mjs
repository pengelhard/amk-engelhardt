import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { listHtmlFiles, locate, root } from "./lib.mjs";

const STALE = new Set([
  "bauzaun",
  "bauzaun/konfigurator",
  "absperrung",
  "verkehrssicherung",
  "anhaenger",
  "mieten/bauzaun",
  "mieten/absperrung",
  "mieten/verkehrssicherung",
  "mieten/mietpark",
  "kaufen/anhaenger",
  "kaufen/anhaenger/fahrzeugtransporter",
  "kaufen/anhaenger/hochlader",
  "kaufen/anhaenger/kofferanhaenger",
  "produkt/bauzaun-f1",
  "produkt/bauzaun-plane",
  "produkt/bauzaun-secure",
  "produkt/bauzaun-standard",
  "produkt/bauzaun-tor",
  "produkt/bauzaun-tuer",
  "produkt/bauzaun-xxl",
  "produkt/betonfuss",
  "produkt/exklusivtuer",
  "produkt/gitterzaun",
  "produkt/hsschelle",
  "produkt/polizeigitter",
  "produkt/polizeigitter-solid",
  "produkt/schelle",
  "produkt/sichtschutz-holz",
  "produkt/sichtschutz-trapez",
  "produkt/strebe",
  "produkt/barriere",
  "produkt/absperrschranke",
  "produkt/kuehlanhaenger-13",
  "produkt/kuehlanhaenger-20",
]);

const STALE_HASH = new Set(["verkehrssicherung", "anhaenger", "bauzaun"]);

function decodeAttr(value) {
  return String(value)
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

function refsOf(html) {
  const values = [];
  for (const tag of html.matchAll(/<([a-zA-Z][\w:-]*)\b([^>]*)>/g)) {
    const attrs = tag[2];
    for (const match of attrs.matchAll(/\b(href|content)\s*=\s*"([^"]*)"/gi)) {
      const raw = decodeAttr(match[2]);
      if (match[1].toLowerCase() === "content") {
        const url = /url\s*=\s*([^;]+)/i.exec(raw);
        if (url) values.push(url[1].trim());
      } else values.push(raw);
    }
  }
  return values;
}

function projectPath(fromFile, raw) {
  const value = String(raw || "").trim();
  if (!value || /^(?:[a-z][a-z0-9+.-]*:|#)/i.test(value)) return null;
  const hashAt = value.indexOf("#");
  const hash = hashAt >= 0 ? value.slice(hashAt + 1) : "";
  let pathPart = hashAt >= 0 ? value.slice(0, hashAt) : value;
  pathPart = pathPart.split("?")[0];
  if (!pathPart) {
    const folder = path.posix.dirname(fromFile);
    return { file: folder === "." ? "" : folder, hash };
  }
  const decoded = decodeURIComponent(pathPart);
  const file = path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), decoded)).replace(/\/+$/, "");
  return { file, hash };
}

function staleReason(fromFile, raw) {
  const located = projectPath(fromFile, raw);
  if (!located || located.file.startsWith("..")) return "";
  if (STALE.has(located.file)) return located.file;
  if ((located.file === "kaufen" || located.file.endsWith("/kaufen")) && STALE_HASH.has(located.hash)) {
    return `${located.file}#${located.hash}`;
  }
  return "";
}

test("Inhaltsseiten verlinken keine alten Zwischenseiten", () => {
  const problems = [];
  for (const rel of listHtmlFiles()) {
    const html = fs.readFileSync(path.join(root, rel), "utf8");
    const redirect = /http-equiv\s*=\s*"refresh"/i.test(html);
    for (const raw of refsOf(html)) {
      const reason = staleReason(rel, raw);
      if (!reason) continue;
      if (redirect) problems.push(`${rel} leitet noch auf ${reason} (${raw})`);
      else problems.push(`${rel} verlinkt ${reason} (${raw})`);
    }
    if (redirect) {
      for (const raw of refsOf(html)) {
        if (/^(?:[a-z][a-z0-9+.-]*:|#)/i.test(raw)) continue;
        const found = locate(root, rel, raw.split("#")[0]);
        if (!found.ok) problems.push(`${rel} Ziel fehlt: ${raw}`);
      }
    }
  }
  assert.deepEqual(problems, []);
});

test("Neuheiten nutzen dieselben Katalogprodukte", () => {
  const entries = JSON.parse(fs.readFileSync(path.join(root, "data/aktuelles.json"), "utf8"));
  const slugs = entries.filter((entry) => entry.sichtbar !== false).map((entry) => entry.slug);
  assert.deepEqual(slugs, ["bauzaun-10075", "plane-10012", "schranke-10024-1", "fahrzeugtransporter"]);
  const katalog = JSON.parse(fs.readFileSync(path.join(root, "data/katalog.json"), "utf8"));
  const mietbar = new Set(katalog.filter((item) => Array.isArray(item.modi) && item.modi.includes("miete")).map((item) => item.slug));
  for (const entry of entries) {
    assert.ok(entry.typ === "Neu" || entry.typ === "Angebot");
    assert.ok(entry.art === "miete" || entry.art === "kauf" || entry.art === "beides", entry.slug);
    if (entry.art === "miete") assert.ok(mietbar.has(entry.slug), entry.slug);
    if (entry.badge != null) assert.equal(typeof entry.badge, "string", entry.slug);
    assert.equal(entry.preis, "");
    assert.equal(fs.existsSync(path.join(root, "produkt", entry.slug, "index.html")), true, entry.slug);
  }
  const kauf = fs.readFileSync(path.join(root, "kaufen/index.html"), "utf8");
  const entwurf = fs.readFileSync(path.join(root, "entwurf/katalog-modern.html"), "utf8");
  assert.doesNotMatch(kauf, /data-aktuelles/);
  assert.doesNotMatch(entwurf, /data-aktuelles/);
  assert.doesNotMatch(entwurf, /Neuheiten/);
  const home = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const news = fs.readFileSync(path.join(root, "aktuelles/index.html"), "utf8");
  const bySlug = Object.fromEntries(entries.map((entry) => [entry.slug, entry]));
  assert.equal(bySlug["bauzaun-10075"].art, "miete");
  assert.equal(bySlug["bauzaun-10075"].badge, "VDE-zertifiziert");
  assert.equal(bySlug["fahrzeugtransporter"].art, "kauf");
  assert.equal(bySlug["plane-10012"].art, "beides");
  assert.equal(bySlug["schranke-10024-1"].art, "beides");
  assert.equal(bySlug["plane-10012"].badge, undefined);
  const script = fs.readFileSync(path.join(root, "js/aktuelles.js"), "utf8");
  assert.match(script, /entry\.badge/);
  assert.match(home, /data-aktuelles/);
  assert.match(news, /data-aktuelles/);
  assert.match(home, /Beispiel aus dem Katalog\. Keine Preise\./);
  assert.match(news, /Beispiel aus dem Katalog\. Keine Preise\./);
  assert.doesNotMatch(home, /href="bauzaun\//);
  assert.doesNotMatch(news, /href="[^"]*bauzaun\/"/);
});
