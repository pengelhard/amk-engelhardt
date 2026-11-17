import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  covers,
  declaredPaths,
  githubValue,
  parseNumstat,
  prContext,
  readDiff,
  scopeReport,
} from "./check-scope.mjs";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const heading = "## Peters Sollverhalten (wörtlich)";

function body(files = ["scripts/check-scope.mjs"]) {
  const list = files.map((file, index) => `- \`${file}\` → Punkt ${index + 1}`).join("\n");
  return `${heading}\n\n> Zitat\n\n## Abnahmepunkte\n\n1. Beispiel. Beleg: Test.\n\n## Dateien\n\n${list}\n\n## Offen\n\n- Nichts.\n`;
}

test("Vorlage beginnt mit Peters Sollverhalten", () => {
  const text = fs.readFileSync(path.join(repo, ".github/pull_request_template.md"), "utf8");
  assert.ok(text.startsWith(`${heading}\n`));
  assert.ok(text.includes("## Abnahmepunkte"));
  assert.ok(text.includes("## Dateien"));
  assert.ok(text.includes("## Funktionsinventar"));
  assert.ok(text.includes("## Gefunden, nicht geändert"));
  assert.ok(text.includes("## Was und warum"));
  assert.ok(text.includes("## Selbstprüfung"));
  assert.ok(text.includes("## Offen"));
});

test("Warnung erst über 500 Zeilen und über 15 Dateien", () => {
  const atLimit = scopeReport({
    files: Array.from({ length: 15 }, (_, i) => `datei-${i}.txt`),
    lineCount: 500,
    body: null,
    requireQuote: false,
  });
  assert.deepEqual(atLimit.warnings, []);
  assert.deepEqual(atLimit.failures, []);
  const over = scopeReport({
    files: Array.from({ length: 16 }, (_, i) => `datei-${i}.txt`),
    lineCount: 501,
    body: null,
    requireQuote: false,
  });
  assert.equal(over.warnings.length, 2);
  assert.deepEqual(over.failures, []);
});

test("Negativkontrolle: fehlendes Sollverhalten fällt nur mit PR-Kontext auf", () => {
  const files = ["AGENTS.md"];
  const local = scopeReport({ files, lineCount: 1, body: "", requireQuote: false });
  assert.deepEqual(local.failures, []);
  assert.deepEqual(local.warnings, []);
  const remote = scopeReport({ files, lineCount: 1, body: "## Abnahmepunkte\n", requireQuote: true });
  assert.equal(remote.failures.length, 1);
  assert.ok(remote.failures[0].includes(heading));
  assert.ok(remote.warnings.some((warning) => warning.includes("AGENTS.md")));
});

test("Pfade im Abschnitt Dateien decken den Diff", () => {
  const text = body(["scripts/", "AGENTS.md"]);
  assert.deepEqual(declaredPaths(text), ["scripts/", "AGENTS.md"]);
  assert.equal(covers("scripts/", "scripts/check-scope.mjs"), true);
  assert.equal(covers("AGENTS.md", "AGENTS.md"), true);
  assert.equal(covers("scripts/", "package.json"), false);
  const report = scopeReport({
    files: ["scripts/check-scope.mjs", "package.json"],
    lineCount: 10,
    body: text,
    requireQuote: true,
  });
  assert.deepEqual(report.failures, []);
  assert.deepEqual(report.warnings, ["außerhalb des erklärten Umfangs: package.json"]);
});

test("ohne Ereignis gibt es keinen PR-Kontext", () => {
  assert.deepEqual(prContext({}), {
    requireQuote: false,
    body: null,
    baseSha: "",
    headSha: "",
  });
});

test("Ereignisdatei liefert Text und Commits", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "amk-scope-"));
  const file = path.join(dir, "event.json");
  fs.writeFileSync(file, JSON.stringify({
    pull_request: { body: body(["AGENTS.md"]), base: { sha: "aaa" }, head: { sha: "bbb" } },
  }));
  const context = prContext({ GITHUB_EVENT_NAME: "pull_request", GITHUB_EVENT_PATH: file });
  assert.equal(context.requireQuote, true);
  assert.ok(context.body.includes(heading));
  assert.equal(context.baseSha, "aaa");
  assert.equal(context.headSha, "bbb");
});

test("Negativkontrolle: andere Namen als GITHUB_ sind gesperrt", () => {
  assert.equal(githubValue({ GITHUB_EVENT_NAME: "push" }, "GITHUB_EVENT_NAME"), "push");
  assert.throws(() => githubValue({}, ["SE", "CRET"].join("")), /GITHUB_/);
  const marker = ["process", "env"].join(".");
  const src = fs.readFileSync(new URL("./check-scope.mjs", import.meta.url), "utf8");
  assert.equal(src.split(marker).length - 1, 1);
});

test("numstat zählt Zeilen und lässt Binärdateien aus", () => {
  const parsed = parseNumstat("10\t2\tscripts/a.mjs\n-\t-\tbild.png\n");
  assert.deepEqual(parsed.files, ["scripts/a.mjs", "bild.png"]);
  assert.equal(parsed.lineCount, 12);
});

test("Diff gegen main ist lesbar", () => {
  const text = readDiff({});
  assert.equal(typeof text, "string");
  const parsed = parseNumstat(text);
  assert.ok(Array.isArray(parsed.files));
});
