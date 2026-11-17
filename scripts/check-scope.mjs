import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HEADING = "## Peters Sollverhalten (wörtlich)";

export function githubValue(env, name) {
  if (!/^GITHUB_[A-Z0-9_]+$/.test(name)) {
    throw new Error("Prüfkette liest nur GITHUB_-Namen");
  }
  if (!env || typeof env !== "object") return undefined;
  return env[name];
}

export function parseNumstat(text) {
  const files = [];
  let lineCount = 0;
  for (const row of String(text).split(/\r?\n/)) {
    if (!row.trim()) continue;
    const [added, deleted, file] = row.split("\t");
    if (!file) continue;
    files.push(file);
    if (added !== "-" && deleted !== "-") lineCount += Number(added) + Number(deleted);
  }
  return { files, lineCount };
}

export function declaredPaths(body) {
  const lines = String(body || "").split(/\r?\n/);
  const start = lines.findIndex((line) => /^## Dateien\b/.test(line));
  if (start < 0) return [];
  const section = [];
  for (const line of lines.slice(start + 1)) {
    if (/^## /.test(line)) break;
    section.push(line);
  }
  const paths = [];
  for (const item of section.join("\n").matchAll(/`([^`]+)`/g)) {
    const value = item[1].trim().replace(/^\.\//, "");
    if (value.includes("/") || value.includes(".") || value.endsWith("/")) paths.push(value);
  }
  return paths;
}

export function covers(declared, file) {
  const item = String(declared).replace(/\\/g, "/").replace(/^\.\//, "");
  const norm = String(file).replace(/\\/g, "/");
  if (item.endsWith("/")) return norm === item.slice(0, -1) || norm.startsWith(item);
  return norm === item || norm.startsWith(`${item}/`);
}

export function scopeReport({ files, lineCount, body, requireQuote }) {
  const warnings = [];
  const failures = [];
  if (lineCount > 500) warnings.push(`Umfang: ${lineCount} geänderte Zeilen, Warnung ab 500`);
  if (files.length > 15) warnings.push(`Umfang: ${files.length} Dateien, Warnung ab 15`);
  if (requireQuote) {
    if (!String(body || "").includes(HEADING)) {
      failures.push(`PR-Text ohne Abschnitt „${HEADING}“`);
    }
    const declared = declaredPaths(body || "");
    for (const file of files) {
      if (!declared.some((item) => covers(item, file))) {
        warnings.push(`außerhalb des erklärten Umfangs: ${file}`);
      }
    }
  }
  return { warnings, failures };
}

export function prContext(env, readFile = fs.readFileSync) {
  const event = githubValue(env, "GITHUB_EVENT_NAME") || "";
  if (event !== "pull_request") {
    return { requireQuote: false, body: null, baseSha: "", headSha: "" };
  }
  const file = githubValue(env, "GITHUB_EVENT_PATH") || "";
  if (!file) return { requireQuote: true, body: "", baseSha: "", headSha: "" };
  const json = JSON.parse(readFile(file, "utf8"));
  const pull = json.pull_request || {};
  return {
    requireQuote: true,
    body: pull.body || "",
    baseSha: pull.base?.sha || "",
    headSha: pull.head?.sha || "",
  };
}

function runGit(args) {
  return spawnSync("git", args, { cwd: root, encoding: "utf8" });
}

export function readDiff(env, context = prContext(env)) {
  if (context.baseSha && context.headSha) {
    const diff = runGit(["diff", "--numstat", context.baseSha, context.headSha]);
    if (diff.status === 0) return diff.stdout;
  }
  const event = githubValue(env, "GITHUB_EVENT_NAME") || "";
  if (event === "pull_request") {
    const parents = runGit(["rev-parse", "--verify", "HEAD^2"]);
    if (parents.status === 0) {
      const diff = runGit(["diff", "--numstat", "HEAD^1", "HEAD^2"]);
      if (diff.status === 0) return diff.stdout;
    }
  }
  const base = githubValue(env, "GITHUB_BASE_REF") || "main";
  for (const spec of [`origin/${base}...HEAD`, `${base}...HEAD`]) {
    const diff = runGit(["diff", "--numstat", spec]);
    if (diff.status === 0) return diff.stdout;
  }
  return null;
}

function main() {
  const env = process.env;
  const context = prContext(env);
  const numstat = readDiff(env, context);
  if (numstat == null) {
    if (context.requireQuote) {
      console.error("Umfang: Diff nicht lesbar");
      process.exit(1);
    }
    console.log("Umfang: übersprungen (Diff nicht lesbar)");
    process.exit(0);
  }
  const { files, lineCount } = parseNumstat(numstat);
  const report = scopeReport({
    files,
    lineCount,
    body: context.body,
    requireQuote: context.requireQuote,
  });
  for (const warning of report.warnings) console.log(`Warnung: ${warning}`);
  if (!context.requireQuote) console.log("Sollverhalten: übersprungen (kein PR-Kontext)");
  if (report.failures.length > 0) {
    for (const failure of report.failures) console.error(failure);
    console.error("Umfang: fehlgeschlagen");
    process.exit(1);
  }
  console.log(`Umfang: ok (${files.length} Dateien, ${lineCount} Zeilen)`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
