import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const BINARY_EXT = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".ico",
  ".woff", ".woff2", ".ttf", ".eot", ".otf", ".pdf", ".zip",
]);

const SECRET_PATTERNS = [
  { name: "privater Schlüssel", re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: "AWS-Access-Key", re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: "GitHub-Token", re: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b/ },
  { name: "GitHub-PAT", re: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/ },
  { name: "Slack-Token", re: /\bxox[baprs]-[A-Za-z0-9-]{10,}/ },
  { name: "Stripe-Live-Key", re: /\bsk_live_[A-Za-z0-9]{10,}\b/ },
  { name: "Google-API-Key", re: /\bAIza[0-9A-Za-z\-_]{35}\b/ },
  { name: "OpenAI-Key", re: /\bsk-[A-Za-z0-9]{20,}\b/ },
  { name: "npm-Token", re: /\bnpm_[A-Za-z0-9]{36}\b/ },
  { name: "Bearer-Token", re: /\bBearer\s+[A-Za-z0-9\-._~+/]{20,}/ },
  {
    name: "zugewiesenes Geheimnis",
    re: /\b(?:api[_-]?key|apikey|secret|token|password|passwd)\b\s*[:=]\s*['"][^'"]{6,}['"]/i,
  },
];

const ALLOWED_SCHEMES = new Set(["http:", "https:", "tel:", "mailto:", "data:"]);

/** Leaflet-CSS verweist darauf, die Dateien liegen nicht im Repo. Nicht ergänzt. */
export const KNOWN_MISSING = [
  {
    from: "assets/leaflet/leaflet.css",
    target: "assets/leaflet/images/layers.png",
    note: "Leaflet-Ebenen-Sprite. Die Kontaktkarte nutzt einen eigenen Marker, keinen Ebenen-Schalter.",
  },
  {
    from: "assets/leaflet/leaflet.css",
    target: "assets/leaflet/images/layers-2x.png",
    note: "Leaflet-Ebenen-Sprite für hohe Auflösung. Dieselbe Lücke, nicht ergänzt.",
  },
];

const NAV_BLOCKS = [
  { name: "Kopf", open: /<nav\b[^>]*\bid\s*=\s*["']nav["'][^>]*>/i, close: "</nav>" },
  { name: "Menü", open: /<nav\b[^>]*\bclass\s*=\s*["'][^"']*\bmenu-nav\b[^"']*["'][^>]*>/i, close: "</nav>" },
  { name: "Fuß", open: /<ul\b[^>]*\bclass\s*=\s*["'][^"']*\bfooter-links\b[^"']*["'][^>]*>/i, close: "</ul>" },
  { name: "Leiste", open: /<nav\b[^>]*\bclass\s*=\s*["'][^"']*\btabbar\b[^"']*["'][^>]*>/i, close: "</nav>" },
];

function posix(rel) {
  return rel.split(path.sep).join("/");
}

export function walkFiles(start = root) {
  const out = [];
  function walk(abs, rel) {
    if (!fs.existsSync(abs)) return;
    for (const ent of fs.readdirSync(abs, { withFileTypes: true })) {
      if (ent.name === ".git" || ent.name === "node_modules") continue;
      const childRel = rel ? `${rel}/${ent.name}` : ent.name;
      const childAbs = path.join(abs, ent.name);
      if (ent.isDirectory()) walk(childAbs, childRel);
      else out.push({ abs: childAbs, rel: childRel, name: ent.name });
    }
  }
  walk(start, "");
  return out.sort((a, b) => a.rel.localeCompare(b.rel));
}

export function listHtmlFiles(start = root) {
  return walkFiles(start).map((file) => file.rel).filter((rel) => rel.endsWith(".html"));
}

function scriptFiles(start) {
  return walkFiles(start)
    .map((file) => file.rel)
    .filter((rel) => {
      if (rel.endsWith(".mjs")) return true;
      if (!rel.endsWith(".js")) return false;
      return rel.startsWith("js/") || rel.startsWith("data/") || rel === "assets/leaflet/leaflet.js";
    });
}

export function secretHits(text) {
  const names = [];
  for (const pattern of SECRET_PATTERNS) {
    pattern.re.lastIndex = 0;
    if (pattern.re.test(text)) names.push(pattern.name);
  }
  return names;
}

export function forbiddenFilename(name) {
  if (name === ".env" || name.startsWith(".env.")) return true;
  if (/^(id_rsa|id_dsa|id_ecdsa|id_ed25519)/.test(name)) return true;
  if (name === "credentials.json") return true;
  return /\.(pem|p12|pfx|key)$/i.test(name);
}

export function classifyRef(fromFile, raw) {
  const value = String(raw).trim();
  if (!value) return { error: "leer" };
  if (value.startsWith("//")) return { error: "protokollrelativ" };
  const scheme = /^([a-z][a-z0-9+.-]*:)/i.exec(value);
  if (scheme) {
    const name = scheme[1].toLowerCase();
    if (!ALLOWED_SCHEMES.has(name)) return { error: `Schema ${name} nicht erlaubt` };
    return { external: true, scheme: name };
  }
  let pathPart = value;
  const hashAt = pathPart.indexOf("#");
  if (hashAt >= 0) pathPart = pathPart.slice(0, hashAt);
  pathPart = pathPart.split("?")[0];
  if (!pathPart) return { hashOnly: true };
  let decoded;
  try {
    decoded = decodeURIComponent(pathPart);
  } catch {
    return { error: "kaputte Prozentkodierung" };
  }
  if (decoded.startsWith("/") || decoded.includes("\\")) return { error: "Pfad ist nicht relativ" };
  const file = path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), decoded));
  if (!file || file.startsWith("..") || path.posix.isAbsolute(file)) {
    return { error: "Pfad verlässt das Projekt" };
  }
  return { file: file === "." ? "" : file };
}

function absJoin(start, rel) {
  return path.join(start, ...rel.split("/"));
}

export function locate(start, fromFile, raw) {
  const ref = classifyRef(fromFile, raw);
  if (ref.external) return { ok: true, external: true, target: String(raw).trim() };
  if (ref.error) return { ok: false, reason: ref.error, target: String(raw).trim() };
  if (ref.hashOnly) return { ok: true, target: fromFile };
  const base = ref.file;
  if (!base) {
    const target = "index.html";
    return { ok: fs.existsSync(absJoin(start, target)), target };
  }
  const direct = absJoin(start, base);
  if (fs.existsSync(direct)) {
    if (fs.statSync(direct).isFile()) return { ok: true, target: base };
    const target = `${base}/index.html`;
    return { ok: fs.existsSync(absJoin(start, target)), target };
  }
  if (!path.posix.extname(base)) {
    const target = `${base}/index.html`;
    if (fs.existsSync(absJoin(start, target))) return { ok: true, target };
    return { ok: false, target };
  }
  return { ok: false, target: base };
}

function knownMissing(fromFile, target) {
  return KNOWN_MISSING.find((item) => item.from === fromFile && item.target === target);
}

function readText(abs) {
  const buf = fs.readFileSync(abs);
  if (buf.includes(0)) return null;
  return buf.toString("utf8");
}

function stripNoise(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");
}

function parseAttrs(source) {
  const attrs = new Map();
  const re = /([^\s=\/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+)))?/g;
  for (const match of source.matchAll(re)) {
    attrs.set(match[1].toLowerCase(), match[2] ?? match[3] ?? match[4] ?? "");
  }
  return attrs;
}

function metaContent(html, pred) {
  const found = [];
  for (const tag of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs = parseAttrs(tag[0]);
    if (pred(attrs)) found.push(attrs.get("content") || "");
  }
  return found;
}

export function isRedirect(html) {
  return metaContent(html, (attrs) => (attrs.get("http-equiv") || "").toLowerCase() === "refresh").length > 0;
}

export function skeletonIssues(rel, html) {
  const issues = [];
  if (!/^\s*<!doctype html\s*>/i.test(html)) issues.push(`${rel}: Doctype fehlt`);
  const lang = /<html\b[^>]*>/i.exec(html);
  const langValue = lang ? (parseAttrs(lang[0].slice(5)).get("lang") || "") : "";
  if (langValue.toLowerCase() !== "de") issues.push(`${rel}: html lang ist "${langValue || "leer"}"`);
  const titles = [...html.matchAll(/<title>([\s\S]*?)<\/title>/gi)].map((match) => match[1].trim());
  if (titles.length !== 1 || !titles[0]) issues.push(`${rel}: genau ein Titel erwartet`);
  const viewport = metaContent(html, (attrs) => (attrs.get("name") || "").toLowerCase() === "viewport");
  if (viewport.length !== 1 || !viewport[0].includes("width=device-width")) {
    issues.push(`${rel}: Viewport fehlt`);
  }
  return issues;
}

function refreshTargets(html) {
  const targets = [];
  for (const content of metaContent(html, (attrs) => (attrs.get("http-equiv") || "").toLowerCase() === "refresh")) {
    const url = /url\s*=\s*([^;]+)/i.exec(content);
    if (url) targets.push(url[1].trim().replace(/^['"]|['"]$/g, ""));
  }
  return targets;
}

function srcsetUrls(value) {
  return String(value)
    .split(",")
    .map((part) => part.trim().split(/\s+/)[0])
    .filter(Boolean);
}

function cssUrls(css) {
  const urls = [];
  const re = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)'"\s]*))\s*\)/gi;
  for (const match of css.matchAll(re)) urls.push(match[1] ?? match[2] ?? match[3] ?? "");
  return urls;
}

function quotedAssetPaths(text) {
  const paths = [];
  const re = /["']((?:images|assets)\/[^"'\\\s]+)["']/g;
  for (const match of text.matchAll(re)) {
    const value = match[1].split("?")[0].split("#")[0];
    if (/\.[A-Za-z0-9]{2,5}$/.test(value)) paths.push(value);
  }
  return paths;
}

function linkValues(html) {
  const values = [];
  const clean = stripNoise(html);
  for (const tag of clean.matchAll(/<([a-zA-Z][\w:-]*)\b([^>]*)>/g)) {
    const attrs = parseAttrs(tag[2]);
    for (const name of ["href", "src", "poster"]) {
      if (attrs.has(name)) values.push(attrs.get(name));
    }
    for (const name of ["srcset", "imagesrcset"]) {
      if (attrs.has(name)) values.push(...srcsetUrls(attrs.get(name)));
    }
  }
  values.push(...refreshTargets(html));
  return values;
}

function recordRef(issues, exceptions, seenKnown, start, fromFile, raw, resolveFrom = fromFile) {
  const found = locate(start, resolveFrom, raw);
  if (found.ok) return;
  const known = knownMissing(resolveFrom, found.target);
  if (known) {
    seenKnown.add(`${known.from} -> ${known.target}`);
    exceptions.push(`${known.from} → ${known.target}: ${known.note}`);
    return;
  }
  const why = found.reason ? ` (${found.reason})` : "";
  issues.push(`${fromFile}: Ziel fehlt für "${raw}" (${found.target})${why}`);
}

function decode(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

function innerBlock(html, openRe, closeTag) {
  const open = openRe.exec(html);
  if (!open) return null;
  const start = open.index + open[0].length;
  const lower = html.toLowerCase();
  const end = lower.indexOf(closeTag, start);
  if (end < 0) return { error: "nicht geschlossen" };
  const again = openRe.exec(html.slice(end + closeTag.length));
  if (again) return { error: "mehrfach" };
  return { html: html.slice(start, end) };
}

export function navSignature(html, fromFile, start = root) {
  const clean = stripNoise(html);
  const parts = [];
  for (const block of NAV_BLOCKS) {
    const found = innerBlock(clean, block.open, block.close);
    if (!found) return { error: `${block.name} fehlt` };
    if (found.error) return { error: `${block.name} ${found.error}` };
    const links = [];
    for (const anchor of found.html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
      const href = parseAttrs(anchor[1]).get("href") || "";
      const label = decode(anchor[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
      const located = locate(start, fromFile, href);
      const target = located.target || href.trim();
      links.push(`${label} => ${target}`);
    }
    parts.push(`${block.name}: ${links.join(" | ")}`);
  }
  return { signature: parts.join("\n") };
}

export function robotsIssues(text) {
  const lines = String(text).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length !== 2 || lines[0] !== "User-agent: *" || lines[1] !== "Disallow: /") {
    return ["robots.txt soll genau „User-agent: *“ und „Disallow: /“ enthalten"];
  }
  return [];
}

export function collectLintIssues(start = root) {
  const issues = [];
  for (const rel of scriptFiles(start)) {
    const result = spawnSync(process.execPath, ["--check", absJoin(start, rel)], { encoding: "utf8" });
    if (result.status !== 0) {
      const detail = (result.stderr || result.stdout || "Syntaxfehler").trim().split("\n")[0];
      issues.push(`${rel}: ${detail}`);
    }
  }
  for (const rel of listHtmlFiles(start)) {
    const html = fs.readFileSync(absJoin(start, rel), "utf8");
    issues.push(...skeletonIssues(rel, html));
  }
  return issues;
}

export function collectInvariantIssues(start = root) {
  const issues = [];
  const exceptions = [];
  const seenKnown = new Set();
  const pages = new Map();

  for (const rel of listHtmlFiles(start)) {
    pages.set(rel, fs.readFileSync(absJoin(start, rel), "utf8"));
  }

  let reference = null;
  for (const [rel, html] of pages) {
    for (const raw of linkValues(html)) recordRef(issues, exceptions, seenKnown, start, rel, raw);

    const robots = metaContent(html, (attrs) => (attrs.get("name") || "").toLowerCase() === "robots");
    if (robots.length !== 1 || !/^noindex\s*,\s*nofollow$/i.test(robots[0].trim())) {
      issues.push(`${rel}: robots soll „noindex, nofollow“ sein`);
    }

    if (isRedirect(html)) continue;
    const nav = navSignature(html, rel, start);
    if (nav.error) {
      issues.push(`${rel}: Navigation ${nav.error}`);
      continue;
    }
    if (!reference) reference = { rel, signature: nav.signature };
    else if (nav.signature !== reference.signature) {
      issues.push(`${rel}: Navigation weicht von ${reference.rel} ab`);
    }
  }

  for (const file of walkFiles(start)) {
    if (!file.rel.endsWith(".css")) continue;
    const css = readText(file.abs);
    if (css == null) continue;
    for (const raw of cssUrls(css)) recordRef(issues, exceptions, seenKnown, start, file.rel, raw);
  }

  for (const file of walkFiles(start)) {
    if (!file.rel.startsWith("js/") && !file.rel.startsWith("data/")) continue;
    if (!file.rel.endsWith(".js") && !file.rel.endsWith(".json")) continue;
    const text = readText(file.abs);
    if (text == null) continue;
    for (const raw of quotedAssetPaths(text)) {
      recordRef(issues, exceptions, seenKnown, start, file.rel, raw, "site.html");
    }
  }

  if (fs.existsSync(absJoin(start, "assets/leaflet/leaflet.css"))) {
    for (const item of KNOWN_MISSING) {
      const key = `${item.from} -> ${item.target}`;
      if (!seenKnown.has(key)) issues.push(`Bekannte Ausnahme ohne Treffer: ${item.target}`);
    }
  }

  const robotsPath = absJoin(start, "robots.txt");
  if (!fs.existsSync(robotsPath)) issues.push("robots.txt fehlt");
  else issues.push(...robotsIssues(fs.readFileSync(robotsPath, "utf8")));

  if (!fs.existsSync(absJoin(start, ".nojekyll"))) {
    issues.push(".nojekyll fehlt: GitHub Pages würde den Branch nicht unverändert ausliefern");
  }
  if (fs.existsSync(absJoin(start, "_config.yml"))) {
    issues.push("_config.yml darf nicht liegen: Jekyll würde die Testseite umbauen");
  }

  const envRead = ["process", "env"].join(".");
  const secretExpr = ["${{", " secrets."].join("");
  for (const file of walkFiles(start)) {
    if (forbiddenFilename(file.name)) {
      issues.push(`${file.rel}: Dateiname sieht nach Zugangsdaten aus`);
      continue;
    }
    if (BINARY_EXT.has(path.extname(file.name).toLowerCase())) continue;
    const text = readText(file.abs);
    if (text == null) continue;
    for (const hit of secretHits(text)) issues.push(`${file.rel}: mögliches Geheimnis (${hit})`);
    if (file.rel.startsWith(".github/") && text.includes(secretExpr)) {
      issues.push(`${file.rel}: Workflow liest GitHub-Secrets`);
    }
    if (file.rel.startsWith("scripts/") && file.rel.endsWith(".mjs") && !file.rel.endsWith(".test.mjs")) {
      if (text.includes(envRead)) {
        if (file.rel !== "scripts/check-scope.mjs") {
          issues.push(`${file.rel}: Prüfkette liest Umgebungsvariablen`);
        } else if (text.split(envRead).length - 1 !== 1 || text.includes(["process", "env."].join("."))) {
          issues.push(`${file.rel}: Umfangs-Check darf nur die GITHUB_-Felder des Ereignisses lesen`);
        }
      }
    }
  }

  return { issues, exceptions: [...new Set(exceptions)] };
}

export function posixRel(file) {
  return posix(file);
}
