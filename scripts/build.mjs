import fs from "node:fs";
import path from "node:path";
import { root } from "./lib.mjs";

const issues = [];
for (const rel of ["index.html", "robots.txt", ".nojekyll"]) {
  if (!fs.existsSync(path.join(root, rel))) issues.push(`Build: ${rel} fehlt`);
}
if (fs.existsSync(path.join(root, "_config.yml"))) {
  issues.push("Build: _config.yml darf nicht liegen");
}

if (issues.length > 0) {
  for (const issue of issues) console.error(issue);
  console.error("Build: fehlgeschlagen");
  process.exit(1);
}
console.log("Build: ok (statische Seiten, nichts zu kompilieren, ohne Umgebungsvariablen und ohne Secrets)");
