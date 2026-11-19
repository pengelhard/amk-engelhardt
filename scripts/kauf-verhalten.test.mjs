import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const chrome = ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find((file) => existsSync(file));
const playwrightPkg = ["/tmp/pw/node_modules/playwright-core/package.json", path.join(root, "node_modules/playwright-core/package.json")].find((file) => existsSync(file));
const skip = !chrome || !playwrightPkg ? "Chrome oder Playwright fehlt, Lauf übersprungen" : false;

function box(el) {
  const r = el.getBoundingClientRect();
  return { w: Math.round(r.width), h: Math.round(r.height) };
}

test("Kaufbereich, Funktionsliste", { skip, timeout: 180000 }, async () => {
  const { chromium } = createRequire(playwrightPkg)("playwright-core");
  const port = 8899;
  const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], { cwd: root, stdio: "ignore" });
  const base = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch({ executablePath: chrome, headless: true, args: ["--no-sandbox"] });
  const points = [];
  function point(name, ok, detail) {
    points.push({ name, ok, detail: detail || "" });
  }
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Server startet nicht")), 8000);
      const ask = () => {
        const req = http.get(base + "/kaufen/", (res) => {
          res.resume();
          if (res.statusCode === 200) {
            clearTimeout(timer);
            resolve();
          } else setTimeout(ask, 150);
        });
        req.on("error", () => setTimeout(ask, 150));
      };
      ask();
    });

    async function open(width, url) {
      const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 1100 } });
      const errors = [];
      page.on("pageerror", (error) => errors.push(String(error)));
      page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
      if (width === 390) {
        const client = await page.context().newCDPSession(page);
        await client.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
        await client.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
        await client.send("Emulation.setEmulatedMedia", { media: "", features: [{ name: "hover", value: "none" }, { name: "pointer", value: "coarse" }] });
      }
      await page.goto(base + url, { waitUntil: "networkidle" });
      return { page, errors };
    }

    async function measureCards(page, kind) {
      return page.evaluate((kind) => {
        function size(el) {
          const r = el.getBoundingClientRect();
          return { w: Math.round(r.width), h: Math.round(r.height) };
        }
        function spanne(values) {
          return { min: Math.min(...values), max: Math.max(...values) };
        }
        const wurzel = {
          zaun: ["#kauf-liste", "article.tile:not(.kauf-produkt)"],
          gitter: ["#kauf-teil-gitter", "article.kauf-produkt"],
          schwellen: ["#kauf-teil-schwellen", "article.kauf-produkt"],
          schleuse: ["#kauf-teil-schleuse", "article.kauf-produkt"],
          buehne: ["#kauf-teil-buehne", "article.kauf-produkt"],
          schild: ["#kauf-teil-vorschrift", "article.kauf-produkt"],
          schranken: ["#kauf-teil-schranken", "article.kauf-produkt"],
          anh: ["#kauf-teil-hochlader", "article.kauf-produkt"]
        }[kind];
        const root = document.querySelector(wurzel[0]);
        const sel = wurzel[1];
        const cards = [...root.querySelectorAll(sel)].filter((el) => !el.hidden && !el.closest("[hidden]") && el.getBoundingClientRect().height);
        const grid = kind === "zaun" ? root : root.querySelector(".tiles");
        const kacheln = cards.map(size);
        const bilder = cards.map((card) => size(card.querySelector("img")));
        const kw = spanne(kacheln.map((item) => item.w));
        const kh = spanne(kacheln.map((item) => item.h));
        const bw = spanne(bilder.map((item) => item.w));
        const bh = spanne(bilder.map((item) => item.h));
        const scrolls = [...document.querySelectorAll("body *")].filter((el) => {
          const value = getComputedStyle(el).overflowY;
          return (value === "auto" || value === "scroll") && el.scrollHeight > el.clientHeight + 2;
        }).map((el) => el.id || String(el.className).slice(0, 40));
        return {
          n: cards.length,
          spalten: getComputedStyle(grid).gridTemplateColumns.split(" ").length,
          kachel: kacheln[0],
          bild: bilder[0],
          gleich: kw.min === kw.max && kh.min === kh.max && bw.min === bw.max && bh.min === bh.max,
          fit: getComputedStyle(cards[0].querySelector("img")).objectFit,
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          scrolls,
          name: cards[0].querySelector("h3").textContent
        };
      }, kind);
    }

    const gruppen = [
      ["Bauzaun", "/kaufen/?gruppe=zaun&kat=bauzaune", "zaun"],
      ["Absperrgitter", "/kaufen/?gruppe=zaun&kat=gitter", "gitter"],
      ["Schwellen", "/kaufen/?gruppe=zaun&kat=schwellen", "schwellen"],
      ["Schleusen", "/kaufen/?gruppe=zaun&kat=schleuse", "schleuse"],
      ["Bühnen", "/kaufen/?gruppe=zaun&kat=buehne", "buehne"],
      ["Schilder", "/kaufen/?gruppe=verkehr&teil=vorschrift", "schild"],
      ["Absperrschranken", "/kaufen/?gruppe=verkehr&teil=schranken", "schranken"],
      ["Anhänger", "/kaufen/?gruppe=anhaenger&teil=hochlader", "anh"]
    ];
    const masse = {};

    for (const width of [1280, 1920, 390]) {
      const { page, errors } = await open(width, gruppen[0][1]);
      const robots = await page.locator('meta[name="robots"]').getAttribute("content");
      const tops = await page.locator("#kauf-gruppen .kauf-karte").count();
      point(`Oberkacheln ${width}`, tops === 3, String(tops));
      point(`noindex ${width}`, /noindex/i.test(robots || ""), robots || "");
      const gemessen = {};
      for (const [name, url, kind] of gruppen) {
        if (url !== gruppen[0][1] || name !== "Bauzaun") await page.goto(base + url, { waitUntil: "networkidle" });
        gemessen[name] = await measureCards(page, kind);
      }
      masse[width] = gemessen;
      const basis = gemessen.Bauzaun;
      const gleich = gruppen.every(([name]) => {
        const probe = gemessen[name];
        return probe.gleich && probe.n > 0 && probe.fit === "contain" && probe.overflow <= 1 && probe.scrolls.length === 0
          && probe.kachel.w === basis.kachel.w && probe.kachel.h === basis.kachel.h
          && probe.bild.w === basis.bild.w && probe.bild.h === basis.bild.h && probe.spalten === basis.spalten;
      });
      const spaltenOk = width < 900 ? basis.spalten === 1 && basis.kachel.w > 300 : basis.spalten === 3 && basis.kachel.w > 200 && basis.kachel.w < 360;
      const text = gruppen.map(([name]) => {
        const probe = gemessen[name];
        return `${name} ${probe.kachel.w}×${probe.kachel.h} Bild ${probe.bild.w}×${probe.bild.h} ${probe.spalten} Spalten n=${probe.n}`;
      }).join("; ");
      point(`Produktkacheln gleich ${width}`, gleich && spaltenOk && basis.n > 3 && gemessen.Schilder.n > 3, text);
      point(`kein Quer-Scroll ${width}`, gruppen.every(([name]) => gemessen[name].overflow <= 1), gruppen.map(([name]) => `${name} ${gemessen[name].overflow}`).join(", "));
      point(`ein Scrollbalken ${width}`, gruppen.every(([name]) => gemessen[name].scrolls.length === 0), gruppen.map(([name]) => `${name}: ${gemessen[name].scrolls.join("|") || "—"}`).join("; "));
      point(`Konsole ${width}`, errors.length === 0, errors.join(" | "));
      if (width >= 980) {
        await page.goto(base + "/kaufen/?gruppe=zaun&kat=bauzaune", { waitUntil: "networkidle" });
        await page.locator("#kauf-verkehr-summe").scrollIntoViewIfNeeded();
        const bauBox = await page.evaluate(() => {
          const summary = document.getElementById("kauf-verkehr-summe");
          const list = document.querySelector("#kauf-liste .tile");
          const sr = summary.getBoundingClientRect();
          const lr = list.getBoundingClientRect();
          const hit = document.elementFromPoint(sr.left + Math.min(40, sr.width / 2), Math.min(sr.top + 40, sr.bottom - 4));
          return {
            sticky: getComputedStyle(summary).position,
            neben: sr.left >= lr.right - 8,
            bündig: Math.abs(sr.top - lr.top) < 40,
            hoehe: Math.round(sr.height),
            treffer: !!(hit && hit.closest("#kauf-verkehr-summe"))
          };
        });
        await page.goto(base + "/kaufen/?gruppe=verkehr&teil=vorschrift", { waitUntil: "networkidle" });
        const verkehrBox = await page.evaluate(() => {
          const summary = document.getElementById("kauf-verkehr-summe");
          const list = document.querySelector("#kauf-teil-vorschrift .tiles");
          const sr = summary.getBoundingClientRect();
          const lr = list.getBoundingClientRect();
          const hit = document.elementFromPoint(sr.left + Math.min(40, sr.width / 2), Math.min(sr.top + 40, sr.bottom - 4));
          return {
            sticky: getComputedStyle(summary).position,
            neben: sr.left >= lr.right - 8,
            oben: sr.top > 40 && sr.top < 180 && sr.top < lr.bottom,
            hoehe: Math.round(sr.height),
            treffer: !!(hit && hit.closest("#kauf-verkehr-summe"))
          };
        });
        await page.evaluate(() => window.scrollTo(0, 900));
        const haengt = await page.evaluate(() => {
          const summary = document.getElementById("kauf-verkehr-summe");
          const top = summary.getBoundingClientRect().top;
          const header = document.querySelector(".top").getBoundingClientRect().bottom;
          return { top: Math.round(top), header: Math.round(header) };
        });
        await page.goto(base + "/kaufen/?gruppe=anhaenger&teil=hochlader", { waitUntil: "networkidle" });
        const anhBox = await page.evaluate(() => {
          const summary = document.getElementById("kauf-verkehr-summe");
          const list = document.querySelector("#kauf-teil-hochlader .tiles");
          const sr = summary.getBoundingClientRect();
          const lr = list.getBoundingClientRect();
          const hit = document.elementFromPoint(sr.left + sr.width / 2, sr.top + 40);
          return {
            sticky: getComputedStyle(summary).position,
            neben: sr.left >= lr.right - 8 && sr.top < lr.bottom,
            oben: Math.abs(sr.top - lr.top) < 80,
            hoehe: Math.round(sr.height),
            treffer: !!(hit && hit.closest("#kauf-verkehr-summe"))
          };
        });
        point(`Auswahl rechts ${width}`, bauBox.sticky === "sticky" && bauBox.neben && bauBox.bündig && bauBox.hoehe > 40 && bauBox.treffer && verkehrBox.sticky === "sticky" && verkehrBox.neben && verkehrBox.oben && verkehrBox.hoehe > 40 && verkehrBox.treffer && haengt.top > 40 && haengt.top < haengt.header + 40 && anhBox.sticky === "sticky" && anhBox.neben && anhBox.oben && anhBox.hoehe > 40 && anhBox.treffer, JSON.stringify({ bauBox, verkehrBox, haengt, anhBox }));
      }
      await page.close();
    }
    const desktopGleich = ["kachel", "bild"].every((teil) => masse[1280].Bauzaun[teil].w === masse[1920].Bauzaun[teil].w && masse[1280].Bauzaun[teil].h === masse[1920].Bauzaun[teil].h) && masse[1280].Bauzaun.spalten === masse[1920].Bauzaun.spalten;
    point("gleiche Maße 1280 und 1920", desktopGleich, `${masse[1280].Bauzaun.kachel.w}×${masse[1280].Bauzaun.kachel.h} / ${masse[1920].Bauzaun.kachel.w}×${masse[1920].Bauzaun.kachel.h}`);

    const desktop = await open(1280, "/kaufen/?gruppe=zaun&kat=bauzaune");
    const html = await desktop.page.content();
    point("Cache-Busting", /styles\.css\?v=/.test(html) && /kauf\.js\?v=/.test(html), "");
    const namesBefore = await desktop.page.locator("#kauf-liste article.tile:not(.kauf-produkt) h3").allTextContents();
    await desktop.page.locator("#kauf-sort").selectOption("name");
    await desktop.page.waitForTimeout(50);
    const namesAfter = await desktop.page.locator("#kauf-liste article.tile:not(.kauf-produkt):not([hidden]) h3").allTextContents();
    const sorted = await desktop.page.evaluate((names) => names.join("\n") === names.slice().sort((a, b) => a.localeCompare(b, "de")).join("\n"), namesAfter);
    point("Sortierung", sorted && namesAfter.join("\n") !== namesBefore.join("\n"), namesAfter.slice(0, 3).join(", "));
    await desktop.page.locator("#kauf-q").fill("engmaschig");
    await desktop.page.waitForTimeout(300);
    const found = await desktop.page.locator("#kauf-liste article.tile:not(.kauf-produkt):not([hidden]) h3").allTextContents();
    point("Suche", found.length > 0 && found.every((name) => /engmaschig/i.test(name)), found.join(", "));
    const url = new URL(desktop.page.url());
    point("URL-Parameter", url.searchParams.get("gruppe") === "zaun" && url.searchParams.get("kat") === "bauzaune", url.search);

    const card = desktop.page.locator('#kauf-gruppen a[data-gruppe="verkehr"]');
    const cardBox = await card.boundingBox();
    await desktop.page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + 30);
    await desktop.page.waitForTimeout(80);
    const panel = await desktop.page.evaluate(() => {
      const nav = document.getElementById("kauf-ebene-verkehr");
      const cs = getComputedStyle(nav);
      const nr = nav.getBoundingClientRect();
      const top = document.querySelector('#kauf-gruppen a[data-gruppe="verkehr"]').getBoundingClientRect();
      const hit = document.elementFromPoint(nr.left + 8, nr.top + 8);
      return {
        open: !nav.hidden,
        bg: cs.backgroundColor,
        gap: Math.round(nr.top - top.bottom),
        hit: !!(hit && hit.closest(".kauf-ebene")),
        n: nav.querySelectorAll(".kauf-karte").length
      };
    });
    point("Hover-Panel", panel.open && panel.bg === "rgb(255, 255, 255)" && panel.gap >= 0 && panel.hit && panel.n === 6, JSON.stringify(panel));
    await desktop.page.locator("#kauf-ebene-verkehr a[data-teil='gefahr']").click();
    await desktop.page.waitForTimeout(40);
    const closed = await desktop.page.locator("#kauf-ebene-verkehr").evaluate((el) => el.hidden);
    const teil = new URL(desktop.page.url()).searchParams.get("teil");
    point("Klick schließt Panel", closed && teil === "gefahr", teil || "");
    const expanded = await desktop.page.locator('#kauf-gruppen a[data-gruppe="zaun"]').getAttribute("aria-expanded");
    point("Barrierefreiheit", expanded === "false" || expanded === "true", expanded || "");
    await desktop.page.close();

    const wide = await open(1920, "/kaufen/?gruppe=anhaenger&teil=hochlader");
    const wideCard = wide.page.locator('#kauf-gruppen a[data-gruppe="anhaenger"]');
    await wideCard.scrollIntoViewIfNeeded();
    const wideBox = await wideCard.boundingBox();
    await wide.page.mouse.move(wideBox.x + 40, wideBox.y + 30);
    await wide.page.waitForTimeout(80);
    const wideOpen = await wide.page.locator("#kauf-ebene-anhaenger").evaluate((el) => !el.hidden);
    point("Hover-Panel 1920", wideOpen, "");
    await wide.page.keyboard.press("Escape");
    await wide.page.waitForTimeout(40);
    const wideClosed = await wide.page.locator("#kauf-ebene-anhaenger").evaluate((el) => el.hidden);
    point("Escape schließt Panel", wideClosed, "");
    await wide.page.close();

    const phone = await open(390, "/kaufen/?gruppe=zaun");
    await phone.page.evaluate(() => { sessionStorage.removeItem("amk-kauf-unter"); if (document.activeElement) document.activeElement.blur(); });
    await phone.page.locator('#kauf-gruppen a[data-gruppe="anhaenger"]').click();
    await phone.page.waitForTimeout(900);
    const tapped = await phone.page.evaluate(() => {
      const nav = document.getElementById("kauf-ebene-anhaenger");
      const leiste = document.getElementById("kauf-leiste");
      const ziel = document.getElementById("kauf-teil-hochlader");
      const kopf = document.querySelector(".top").getBoundingClientRect().bottom;
      const zr = ziel.getBoundingClientRect();
      const adresse = new URL(location.href);
      const aktuell = leiste.querySelector("[aria-current='true']");
      return {
        panelZu: nav.hidden,
        gruppe: adresse.searchParams.get("gruppe"),
        teil: adresse.searchParams.get("teil"),
        leiste: !leiste.hidden && getComputedStyle(leiste).position === "sticky",
        marke: aktuell ? aktuell.textContent.replace(/\s+/g, " ").trim() : "",
        kopfFrei: zr.top >= kopf - 2
      };
    });
    point("Tap springt zur Überschrift", tapped.panelZu && tapped.gruppe === "anhaenger" && tapped.teil === "hochlader" && tapped.leiste && /Hochlader/.test(tapped.marke) && tapped.kopfFrei, JSON.stringify(tapped));
    await phone.page.close();

    const sprache = await open(1280, "/kaufen/");
    await sprache.page.evaluate(() => sessionStorage.removeItem("amk-kauf-unter"));
    await sprache.page.locator('#kauf-gruppen a[data-gruppe="zaun"]').click();
    await sprache.page.waitForTimeout(40);
    const erste = new URL(sprache.page.url());
    point("Oberkachel erste Unterkategorie", erste.searchParams.get("gruppe") === "zaun" && erste.searchParams.get("kat") === "bauzaune", erste.search);
    const zaunKarte = sprache.page.locator('#kauf-gruppen a[data-gruppe="zaun"]');
    await sprache.page.mouse.move(20, 700);
    await zaunKarte.scrollIntoViewIfNeeded();
    const zaunBox = await zaunKarte.boundingBox();
    await sprache.page.mouse.move(zaunBox.x + zaunBox.width / 2, zaunBox.y + 30);
    await sprache.page.waitForTimeout(80);
    await sprache.page.locator('#kauf-ebene a[data-kat="gitter"]').click();
    await sprache.page.waitForTimeout(40);
    await sprache.page.locator('#kauf-gruppen a[data-gruppe="zaun"]').click();
    await sprache.page.waitForTimeout(40);
    const letzte = new URL(sprache.page.url());
    point("Oberkachel letzte Unterkategorie", letzte.searchParams.get("kat") === "gitter", letzte.search);
    await sprache.page.close();

    async function namen(url) {
      const view = await open(1280, url);
      const info = await view.page.evaluate(() => {
        function sichtbar(el) {
          return !el.hidden && !el.closest("[hidden]") && el.getBoundingClientRect().height > 0;
        }
        function texte(sel) {
          return [...document.querySelectorAll(sel)].filter(sichtbar).map((el) => el.querySelector("h3").textContent);
        }
        function titel(sel) {
          return [...document.querySelectorAll(sel)].filter((el) => !el.closest("[hidden]")).map((el) => el.textContent.replace(/\s+/g, " ").trim());
        }
        return {
          geraete: texte("#kauf-stapel article.kauf-produkt"),
          schilder: texte("#schilder-bereich article"),
          schranken: texte("#kauf-teil-schranken article.kauf-produkt"),
          baken: texte("#kauf-teil-baken article.kauf-produkt"),
          ueberschriften: titel("#kauf-stapel h2, #schilder-bereich h2")
        };
      });
      await view.page.close();
      return info;
    }
    const verkehrSeite = await namen("/kaufen/?gruppe=verkehr&teil=vorschrift");
    const hochlader = await namen("/kaufen/?gruppe=anhaenger&teil=hochlader");
    const zaunSeite = await namen("/kaufen/?gruppe=zaun&kat=gitter");
    const katalog = await namen("/kaufen/?gruppe=zaun&kat=bauzaune");
    const folieNurSchranken = verkehrSeite.schranken.length === 2 && verkehrSeite.schranken.every((name) => /Folie/.test(name)) && verkehrSeite.baken.length === 1 && verkehrSeite.baken.every((name) => !/Folie/.test(name)) && verkehrSeite.schilder.length > 3 && verkehrSeite.schilder.every((name) => !/Folie/.test(name));
    point("Schranken nur bei Absperrschranken", folieNurSchranken, JSON.stringify({ schranken: verkehrSeite.schranken, baken: verkehrSeite.baken, schilder: verkehrSeite.schilder.length }));
    point("Verkehr untereinander", ["Absperrschranken", "Leitbaken", "Gefahrzeichen", "Vorschriftzeichen", "Richtzeichen", "Verkehrseinrichtungen"].every((name) => verkehrSeite.ueberschriften.indexOf(name) !== -1), verkehrSeite.ueberschriften.join(", "));
    point("Anhänger untereinander", ["Hochlader", "Planenanhänger", "Kofferanhänger", "Fahrzeugtransporter", "Kühlanhänger"].every((name) => hochlader.ueberschriften.indexOf(name) !== -1) && hochlader.geraete.some((name) => /Hochlader/.test(name)), hochlader.ueberschriften.join(", "));
    point("Zaun ohne Bauzaun untereinander", ["Absperrgitter", "Bodenleitschwellen", "Schleusen", "Bühnen"].every((name) => zaunSeite.ueberschriften.indexOf(name) !== -1), zaunSeite.ueberschriften.join(", "));
    point("Bauzaun-Katalog eigenständig", katalog.ueberschriften.length === 0 && katalog.geraete.length === 0, String(katalog.ueberschriften.length));

    const sprung = await open(1280, "/kaufen/?gruppe=verkehr");
    await sprung.page.locator("#kauf-leiste a[data-teil='einrichtung']").click();
    await sprung.page.waitForTimeout(900);
    const lage = await sprung.page.evaluate(() => {
      const ziel = document.getElementById("kauf-teil-einrichtung");
      const kopf = document.querySelector(".top").getBoundingClientRect().bottom;
      const bar = document.getElementById("kauf-leiste").getBoundingClientRect();
      const zr = ziel.getBoundingClientRect();
      const aktuell = document.querySelector("#kauf-leiste [aria-current='true']");
      return {
        teil: new URL(location.href).searchParams.get("teil"),
        frei: zr.top >= kopf - 2 && zr.top >= bar.bottom - 8,
        marke: aktuell ? aktuell.getAttribute("data-teil") : ""
      };
    });
    point("Klick springt zur Überschrift", lage.teil === "einrichtung" && lage.frei && lage.marke === "einrichtung", JSON.stringify(lage));
    await sprung.page.locator("#kauf-q").fill("Folie");
    await sprung.page.waitForTimeout(350);
    const sucheStapel = await sprung.page.evaluate(() => {
      function offen(id) {
        const el = document.getElementById(id);
        return !!(el && !el.hidden && !el.closest("[hidden]"));
      }
      const n = [...document.querySelectorAll("article.kauf-produkt")].filter((el) => !el.hidden && !el.closest("[hidden]")).length;
      return { schranken: offen("kauf-teil-schranken"), gefahr: offen("kauf-teil-gefahr"), n };
    });
    point("Suche blendet leere Abschnitte aus", sucheStapel.schranken && !sucheStapel.gefahr && sucheStapel.n === 2, JSON.stringify(sucheStapel));
    await sprung.page.goBack();
    await sprung.page.waitForTimeout(200);
    const zurueck = new URL(sprung.page.url()).searchParams.get("teil");
    point("Zurück", zurueck === "schranken", sprung.page.url());
    await sprung.page.close();

    const leiste = await open(390, "/kaufen/?gruppe=anhaenger&teil=hochlader");
    await leiste.page.locator("[data-teil-karte]:not([hidden]) article.kauf-produkt .beispiel-wahl").first().click();
    const handyLeiste = await leiste.page.evaluate(() => {
      const summary = document.getElementById("kauf-verkehr-summe");
      const rect = summary.getBoundingClientRect();
      return {
        position: getComputedStyle(summary).position,
        unten: rect.top > window.innerHeight * 0.45 && rect.bottom <= window.innerHeight + 1
      };
    });
    point("Auswahl Handy unten", handyLeiste.position === "fixed" && handyLeiste.unten, JSON.stringify(handyLeiste));
    await leiste.page.close();

    const pick = await open(1280, "/kaufen/?gruppe=anhaenger&teil=hochlader");
    await pick.page.locator("[data-teil-karte]:not([hidden]) article.kauf-produkt .beispiel-wahl").first().click();
    const kreis = await pick.page.evaluate(() => {
      const card = document.querySelector("[data-teil-karte]:not([hidden]) article.kauf-produkt");
      const field = card.querySelector("[data-menge]");
      return {
        checked: card.querySelector('input[type="checkbox"]').checked,
        menge: !card.querySelector(".pick-menge").hidden,
        max: field.getAttribute("max"),
        kreis: getComputedStyle(card.querySelector(".beispiel-kreis")).borderRadius
      };
    });
        point("Auswahlkreis", kreis.checked && kreis.menge && kreis.kreis !== "0px" && kreis.max === "9999", JSON.stringify(kreis));
    const baustein = await pick.page.evaluate(() => {
      const card = document.querySelector("[data-teil-karte]:not([hidden]) article.kauf-produkt");
      const ober = document.querySelector("#kauf-gruppen .kachel--ober");
      return {
        produkt: !!(card && card.classList.contains("kachel--produkt")),
        ober: !!ober,
        kreis: !!(card && card.querySelector(".kachel-kreis"))
      };
    });
    point("gemeinsame Kachel", baustein.produkt && baustein.ober && baustein.kreis, JSON.stringify(baustein));
    await pick.page.close();

    const schnell = await open(1280, "/kaufen/?gruppe=zaun&kat=bauzaune");
    await schnell.page.evaluate(() => localStorage.removeItem("amk-wunsch"));
    await schnell.page.reload({ waitUntil: "networkidle" });
    const schnellKarte = schnell.page.locator("#kauf-liste article.tile").first();
    const schnellInfo = await schnell.page.evaluate(() => {
      const block = document.querySelector("#kauf-liste .kauf-schnell[data-slug]");
      const stand = block.querySelector("[data-schnell='staender']");
      const feld = block.querySelector("[data-schnell='felder']");
      const link = block.querySelector(".kauf-schnell-details");
      return {
        slug: block.getAttribute("data-slug"),
        max: stand.getAttribute("max"),
        min: stand.getAttribute("min"),
        link: link.getAttribute("href"),
        text: link.textContent.trim(),
        felder: feld.getAttribute("max")
      };
    });
    point("Schnellauswahl", schnellInfo.slug === "bauzaun-10075" && schnellInfo.max === "9999" && schnellInfo.min === "0" && schnellInfo.felder === "9999" && /bauzaun-10075\/$/.test(schnellInfo.link) && schnellInfo.text === "Details anpassen", JSON.stringify(schnellInfo));
    await schnellKarte.locator("[data-schnell='staender']").fill("2");
    await schnellKarte.locator("[data-schnell='felder']").fill("3");
    await schnell.page.waitForTimeout(100);
    const korb = await schnell.page.evaluate(() => JSON.parse(localStorage.getItem("amk-wunsch") || "[]").map((item) => item.id + ":" + item.qty + ":" + (item.note || "")));
    point("Korb aus der Liste", korb.indexOf("kauf:bauzaun-10075:im:staender:2:im Komplett-Ständer") !== -1 && korb.indexOf("kauf:bauzaun-10075:im:zaun:60:im Komplett-Ständer") !== -1 && korb.indexOf("kauf:bauzaun-10075:im:fuss:fuss-10006:62:im Komplett-Ständer") !== -1 && korb.indexOf("kauf:bauzaun-10075:im:schelle:zubehoer-10002-1:60:im Komplett-Ständer") !== -1 && korb.indexOf("kauf:bauzaun-10075:zusatz:felder:3:zusätzlich") !== -1, korb.join(" | "));
    await schnell.page.goto(base + "/produkt/bauzaun-10075/", { waitUntil: "networkidle" });
    await schnell.page.waitForFunction(() => document.getElementById("menge-staender") && document.getElementById("menge-staender").value === "2" && document.getElementById("menge-felder") && document.getElementById("menge-felder").value === "3");
    await schnell.page.selectOption("#wahl-fuss", "fuss-10004");
    await schnell.page.waitForTimeout(150);
    await schnell.page.goto(base + "/kaufen/?gruppe=zaun&kat=bauzaune", { waitUntil: "networkidle" });
    const angepasst = await schnell.page.evaluate(() => {
      const block = document.querySelector(".kauf-schnell[data-slug='bauzaun-10075']");
      const hint = block.querySelector(".kauf-schnell-hinweis");
      return {
        stand: block.querySelector("[data-schnell='staender']").value,
        feld: block.querySelector("[data-schnell='felder']").value,
        hinweis: hint && !hint.hidden && hint.textContent.trim()
      };
    });
    point("Angepasst bleibt", angepasst.stand === "2" && angepasst.feld === "3" && angepasst.hinweis === "angepasst", JSON.stringify(angepasst));
    await schnell.page.locator(".kauf-schnell[data-slug='bauzaun-10075'] [data-schnell='staender']").fill("3");
    await schnell.page.waitForTimeout(100);
    const bewahrt = await schnell.page.evaluate(() => JSON.parse(localStorage.getItem("amk-wunsch") || "[]").filter((item) => String(item.id).indexOf("kauf:bauzaun-10075:im:fuss:") === 0).map((item) => item.id + ":" + item.qty));
    point("Liste überschreibt den Fuß nicht", bewahrt.length === 1 && bewahrt[0] === "kauf:bauzaun-10075:im:fuss:fuss-10004:93", bewahrt.join(", "));
    await schnell.page.locator(".kauf-schnell[data-slug='bauzaun-10075'] [data-schnell='staender']").fill("10000");
    const begrenzt = await schnell.page.locator(".kauf-schnell[data-slug='bauzaun-10075'] [data-schnell='staender']").inputValue();
    point("Schnellauswahl Grenze 9999", begrenzt === "9999", begrenzt);
    await schnell.page.evaluate(() => localStorage.removeItem("amk-wunsch"));
    await schnell.page.close();

    const detail = await open(1280, "/produkt/bauzaun-10075/");
    await detail.page.waitForSelector("#menge-staender");
    await detail.page.locator("#menge-staender").fill("1");
    await detail.page.locator("#menge-felder").fill("1");
    await detail.page.waitForSelector("#block-im");
    await detail.page.waitForSelector("#block-zusatz");
    const detailInfo = await detail.page.evaluate(() => {
      const liste = document.getElementById("beispiel-liste");
      const scrolls = [...document.querySelectorAll(".beispiel-korb *")].filter((el) => {
        const value = getComputedStyle(el).overflowY;
        return value === "auto" || value === "scroll";
      }).map((el) => el.id || el.className);
      const fuss = document.getElementById("wahl-fuss");
      const schelle = document.getElementById("wahl-schelle");
      return {
        im: !!document.getElementById("block-im"),
        extra: !!document.getElementById("block-zusatz"),
        felder: !!document.getElementById("menge-felder"),
        staender: !!document.getElementById("menge-staender"),
        fuss: fuss ? fuss.options.length : 0,
        schelle: schelle ? schelle.options.length : 0,
        zubehoer: document.querySelectorAll("#beispiel-zubehoer article").length,
        galerie: document.querySelectorAll(".galerie, .galerie-thumbs button, figure.scene img").length,
        scrolls,
        liste: liste ? getComputedStyle(liste).overflowY : "",
        max: document.getElementById("menge-staender").getAttribute("max"),
        robots: document.querySelector('meta[name="robots"]').content
      };
    });
    point("Komplett-Ständer und Einzelfelder", detailInfo.staender && detailInfo.felder, "");
    point("Fuß- und Schellentausch", detailInfo.fuss > 1 && detailInfo.schelle > 1, `${detailInfo.fuss}/${detailInfo.schelle}`);
    point("Blöcke enthalten und zusätzlich", detailInfo.im && detailInfo.extra, "");
    point("Zubehör", detailInfo.zubehoer > 0, String(detailInfo.zubehoer));
    point("Galerie", detailInfo.galerie > 0, String(detailInfo.galerie));
    point("ein Scrollbalken", detailInfo.liste === "auto" && detailInfo.scrolls.length === 1, detailInfo.scrolls.join(", "));
    point("Grenze 9999", detailInfo.max === "9999", detailInfo.max || "");
    point("noindex Detail", /noindex/i.test(detailInfo.robots), "");
    await detail.page.locator("#menge-staender").fill("10000");
    await detail.page.locator("#menge-staender").dispatchEvent("input");
    const capped = await detail.page.locator("#menge-staender").inputValue();
    const count = await detail.page.locator("[data-wunsch-count]").first().textContent();
    point("Automatischer Korb", capped === "9999" && count.trim() !== "0", `${capped} / ${count.trim()}`);
    await detail.page.goto(base + "/anfrage/", { waitUntil: "networkidle" });
    const cartText = await detail.page.locator("body").innerText();
    point("Korb-Gruppe Ständer", /Komplett-Ständer/.test(cartText) && /Kauf/.test(cartText), "");
    const cartRobots = await detail.page.locator('meta[name="robots"]').getAttribute("content");
    point("noindex Korb", /noindex/i.test(cartRobots || ""), cartRobots || "");
    point("Konsole Detail", detail.errors.length === 0, detail.errors.join(" | "));
    const detailOverflow = await detail.page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    point("kein Quer-Scroll Detail", detailOverflow <= 1, String(detailOverflow));
    await detail.page.close();

    const beispiel = await open(1280, "/produkt/beispiel/");
    await beispiel.page.waitForSelector("#beispiel-thumbs button, #beispiel-bild");
    const thumbs = await beispiel.page.locator("#beispiel-thumbs button, #beispiel-thumbs img").count();
    point("Galerie Beispielseite", thumbs > 0 || await beispiel.page.locator("#beispiel-bild").count() === 1, String(thumbs));
    await beispiel.page.close();

    const miete = await open(1280, "/mieten/");
    const mieteInfo = await miete.page.evaluate(() => ({
      kachel: document.querySelectorAll(".kauf-produkt").length,
      zeile: document.querySelectorAll(".pick, .chip").length,
      spalten: document.querySelector(".konfig-layout") ? getComputedStyle(document.querySelector(".konfig-layout")).gridTemplateColumns : ""
    }));
    point("Mieten unverändert", mieteInfo.kachel === 0 && mieteInfo.zeile > 0 && /320px/.test(mieteInfo.spalten), JSON.stringify(mieteInfo));
    point("Konsole Mieten", miete.errors.length === 0, miete.errors.join(" | "));
    await miete.page.close();

    const bad = points.filter((entry) => !entry.ok);
    console.log(points.map((entry) => `${entry.ok ? "ok" : "FEHLER"}  ${entry.name}${entry.detail ? " — " + entry.detail : ""}`).join("\n"));
    assert.equal(bad.length, 0, bad.map((entry) => `${entry.name}: ${entry.detail}`).join("\n"));
  } catch (error) {
    if (points.length) console.log(points.map((entry) => `${entry.ok ? "ok" : "FEHLER"}  ${entry.name}${entry.detail ? " — " + entry.detail : ""}`).join("\n"));
    throw error;
  } finally {
    await browser.close();
    server.kill();
  }
});
