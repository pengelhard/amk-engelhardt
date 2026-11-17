import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  KNOWN_MISSING,
  collectInvariantIssues,
  collectLintIssues,
  secretHits,
} from "./lib.mjs";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function write(dir, rel, text) {
  const abs = path.join(dir, ...rel.split("/"));
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, text);
}

function page(options = {}) {
  const href = options.href ?? "./";
  const label = options.label ?? "Startseite";
  const robots = options.robots ?? '<meta name="robots" content="noindex, nofollow">';
  const extra = options.extra ?? "";
  const doctype = options.doctype ?? "<!DOCTYPE html>";
  return `${doctype}
<html lang="${options.lang ?? "de"}">
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
${robots}
<title>${options.title ?? "Beispiel"}</title>
</head>
<body>
<nav id="nav"><a href="${href}">${label}</a></nav>
<nav class="menu-nav"><a href="${href}">${label}</a></nav>
<ul class="footer-links"><li><a href="${href}">${label}</a></li></ul>
<nav class="tabbar"><a href="tel:+499082921777">Anrufen</a></nav>
${extra}
</body>
</html>`;
}

function fixture(files = {}, robots = "User-agent: *\nDisallow: /\n") {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "amk-verify-"));
  write(dir, "robots.txt", robots);
  write(dir, ".nojekyll", "");
  for (const [rel, text] of Object.entries(files)) write(dir, rel, text);
  return dir;
}

test("das Repo bleibt grün", () => {
  assert.deepEqual(collectLintIssues(repo), []);
  const live = collectInvariantIssues(repo);
  assert.deepEqual(live.issues, []);
  assert.equal(live.exceptions.length, KNOWN_MISSING.length);
  for (const item of KNOWN_MISSING) {
    assert.ok(live.exceptions.some((line) => line.includes(item.target)));
  }
});

test("Negativkontrolle: fehlendes noindex fällt auf", () => {
  const dir = fixture({ "index.html": page({ robots: "" }) });
  const { issues } = collectInvariantIssues(dir);
  assert.ok(issues.some((issue) => issue.includes("noindex")));
});

test("Negativkontrolle: fehlender Doctype fällt auf", () => {
  const dir = fixture({ "index.html": page({ doctype: "" }) });
  assert.ok(collectLintIssues(dir).some((issue) => issue.includes("Doctype")));
});

test("Negativkontrolle: JavaScript-Syntaxfehler fällt auf", () => {
  const dir = fixture({
    "index.html": page(),
    "js/kaputt.js": "const = ;\n",
  });
  assert.ok(collectLintIssues(dir).some((issue) => issue.startsWith("js/kaputt.js")));
});

test("Negativkontrolle: fehlendes Bild fällt auf", () => {
  const dir = fixture({
    "index.html": page({ extra: '<img src="images/fehlt.webp" alt="">' }),
  });
  const { issues } = collectInvariantIssues(dir);
  assert.ok(issues.some((issue) => issue.includes("images/fehlt.webp")));
});

test("Negativkontrolle: abweichende Navigation fällt auf", () => {
  const dir = fixture({
    "index.html": page(),
    "andere.html": page({ label: "Anders" }),
  });
  const { issues } = collectInvariantIssues(dir);
  assert.ok(issues.some((issue) => issue.includes("Navigation weicht")));
});

test("Negativkontrolle: robots.txt ohne Disallow fällt auf", () => {
  const dir = fixture({ "index.html": page() }, "User-agent: *\nAllow: /\n");
  const { issues } = collectInvariantIssues(dir);
  assert.ok(issues.some((issue) => issue.includes("Disallow")));
});

test("Negativkontrolle: javascript-Link und Pfad aus dem Projekt fallen auf", () => {
  const dir = fixture({
    "index.html": page({ extra: '<a href="javascript:alert(1)">x</a><a href="../../geheim.txt">y</a>' }),
  });
  const { issues } = collectInvariantIssues(dir);
  assert.ok(issues.some((issue) => issue.includes("javascript:")));
  assert.ok(issues.some((issue) => issue.includes("verlässt das Projekt")));
});

test("Weiterleitung ohne Menü ist keine abweichende Navigation", () => {
  const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Weiter</title>
<meta http-equiv="refresh" content="0; url=./">
</head>
<body><p><a href="./">Weiter</a></p></body>
</html>`;
  const dir = fixture({ "index.html": page(), "alt/index.html": html });
  const { issues } = collectInvariantIssues(dir);
  assert.deepEqual(issues, []);
});

test("bekannte Leaflet-Lücke bleibt dokumentierte Ausnahme", () => {
  const dir = fixture({
    "index.html": page(),
    "assets/leaflet/leaflet.css": "a{background:url(images/layers.png)}b{background:url(images/layers-2x.png)}c{background:url(images/marker-icon.png)}",
    "assets/leaflet/images/marker-icon.png": "png",
  });
  const { issues, exceptions } = collectInvariantIssues(dir);
  assert.deepEqual(issues, []);
  assert.equal(exceptions.length, 2);
});

test("eine Ausnahme ohne Treffer fällt auf", () => {
  const dir = fixture({
    "index.html": page(),
    "assets/leaflet/leaflet.css": "/* kein Ebenen-Sprite */",
  });
  const { issues } = collectInvariantIssues(dir);
  assert.ok(issues.some((issue) => issue.includes("Ausnahme ohne Treffer")));
});

test("Telefon, Mail und die Testdatei selbst sind keine Secrets", () => {
  const token = ["ghp", "_", "a".repeat(20)].join("");
  const assigned = ["api", "_key"].join("") + ": " + ["'", "abcdef", "'"].join("");
  assert.ok(secretHits(token).includes("GitHub-Token"));
  assert.ok(secretHits(assigned).includes("zugewiesenes Geheimnis"));
  assert.deepEqual(secretHits("tel:+499082921777"), []);
  assert.deepEqual(secretHits("09082 921777"), []);
  assert.deepEqual(secretHits("info@bauzaun-mieten.net"), []);
  assert.deepEqual(secretHits('accessKey: ""'), []);
  const self = fs.readFileSync(fileURLToPath(import.meta.url), "utf8");
  assert.deepEqual(secretHits(self), []);
});
