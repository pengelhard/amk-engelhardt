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

test("Kaufbereich, Funktionsliste", { skip, timeout: 240000 }, async () => {
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

    async function open(width, url, opts) {
      const height = width >= 980 ? 1100 : (width <= 360 ? 740 : 844);
      const page = await browser.newPage({ viewport: { width, height } });
      const errors = [];
      page.on("pageerror", (error) => errors.push(String(error)));
      page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
      if (width < 980) {
        const client = await page.context().newCDPSession(page);
        await client.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: true });
        await client.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
        await client.send("Emulation.setEmulatedMedia", { media: "", features: [{ name: "hover", value: "none" }, { name: "pointer", value: "coarse" }] });
      }
      if (opts && opts.modus) await page.addInitScript((value) => sessionStorage.setItem("amk-modus", value), opts.modus);
      else await page.addInitScript(() => sessionStorage.removeItem("amk-modus"));
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
      const tops = await page.locator("#kauf-gruppen a[data-gruppe]").count();
      point(`Oberkacheln ${width}`, tops === 3, String(tops));
      const kompakt = await page.evaluate(() => {
        const bar = document.getElementById("kauf-gruppen");
        const links = [...bar.querySelectorAll("a[data-gruppe]")].filter((el) => !el.hidden && el.getBoundingClientRect().height > 0);
        const zeile = links.map((el) => Math.round(el.getBoundingClientRect().top));
        const bilder = links.map((el) => {
          const img = el.querySelector("img");
          return img ? Math.round(img.getBoundingClientRect().height) : 0;
        });
        const aktiv = links.find((el) => el.getAttribute("aria-current") === "true");
        const rand = aktiv ? getComputedStyle(aktiv, "::after") : null;
        const schatten = links.map((el) => getComputedStyle(el).boxShadow);
        return {
          h: Math.round(bar.getBoundingClientRect().height),
          zeile: zeile.length === 3 && Math.max(...zeile) - Math.min(...zeile) <= 2,
          bilder,
          rand: rand ? [rand.borderTopColor, rand.borderRightColor, rand.borderBottomColor, rand.borderLeftColor].join("|") : "",
          schatten,
          quer: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          gross: links.some((el) => el.getBoundingClientRect().height > 180)
        };
      });
      const bildOk = width <= 767
        ? kompakt.bilder.every((h) => h >= 34 && h <= 56)
        : kompakt.bilder.every((h) => h >= 120);
      const ring = kompakt.rand === "rgb(118, 183, 41)|rgb(118, 183, 41)|rgb(118, 183, 41)|rgb(118, 183, 41)";
      const ruhig = kompakt.schatten.every((wert) => wert === "none" || /inset/.test(wert));
      const hoeheOk = width <= 767 ? kompakt.h > 0 && kompakt.h <= 160 && !kompakt.gross : kompakt.gross && kompakt.h <= 520;
      const telefon = width <= 767;
      point(`Kategorieleiste ${width}`, kompakt.zeile && hoeheOk && bildOk && kompakt.quer <= 1 && (!telefon || (ring && ruhig)), JSON.stringify(kompakt));
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
          const bar = document.getElementById("kauf-gruppen");
          const band = bar.getBoundingClientRect().bottom;
          return {
            top: Math.round(top),
            header: Math.round(header),
            band: Math.round(band),
            schrift: document.getElementById("kauf-schrift").getBoundingClientRect().bottom,
            unter: (() => {
              const schrift = document.getElementById("kauf-schrift");
              const kante = schrift.getBoundingClientRect().bottom;
              return getComputedStyle(schrift).visibility === "visible" && top >= kante - 4 && top < kante + 48;
            })()
          };
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
        point(`Auswahl rechts ${width}`, bauBox.sticky === "sticky" && bauBox.neben && bauBox.bündig && bauBox.hoehe > 40 && bauBox.treffer && verkehrBox.sticky === "sticky" && verkehrBox.neben && verkehrBox.oben && verkehrBox.hoehe > 40 && verkehrBox.treffer && haengt.unter && anhBox.sticky === "sticky" && anhBox.neben && anhBox.oben && anhBox.hoehe > 40 && anhBox.treffer, JSON.stringify({ bauBox, verkehrBox, haengt, anhBox }));
      }
      await page.close();
    }
    const desktopGleich = ["kachel", "bild"].every((teil) => masse[1280].Bauzaun[teil].w === masse[1920].Bauzaun[teil].w && masse[1280].Bauzaun[teil].h === masse[1920].Bauzaun[teil].h) && masse[1280].Bauzaun.spalten === masse[1920].Bauzaun.spalten;
    point("gleiche Maße 1280 und 1920", desktopGleich, `${masse[1280].Bauzaun.kachel.w}×${masse[1280].Bauzaun.kachel.h} / ${masse[1920].Bauzaun.kachel.w}×${masse[1920].Bauzaun.kachel.h}`);

    const desktop = await open(1280, "/kaufen/?gruppe=zaun&kat=bauzaune");
    const html = await desktop.page.content();
    point("Cache-Busting", /styles\.css\?v=/.test(html) && /kauf\.js\?v=/.test(html), "");
    const werkzeug = await desktop.page.evaluate(() => ({
      suche: !!document.getElementById("kauf-q"),
      sort: !!document.getElementById("kauf-sort"),
      reset: !!document.getElementById("kauf-reset"),
      zahl: !!document.getElementById("kauf-count")
    }));
    point("Suche und Sortierung weg", !werkzeug.suche && !werkzeug.sort && !werkzeug.reset && !werkzeug.zahl, JSON.stringify(werkzeug));
    const url = new URL(desktop.page.url());
    point("URL-Parameter", url.searchParams.get("gruppe") === "zaun" && url.searchParams.get("kat") === "bauzaune" && !url.searchParams.get("q") && !url.searchParams.get("sort"), url.search);

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
        n: nav.querySelectorAll(".kauf-karte").length,
        bild: Math.round(nav.querySelector("img").getBoundingClientRect().height)
      };
    });
    point("Hover-Panel", panel.open && panel.bg === "rgb(255, 255, 255)" && panel.gap >= 0 && panel.gap <= 12 && panel.hit && panel.n === 6 && panel.bild >= 40, JSON.stringify(panel));
    await desktop.page.evaluate(() => {
      window.__cls = 0;
      if (!window.__clsWatch) {
        window.__clsWatch = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (!entry.hadRecentInput) window.__cls += entry.value;
          });
        });
        window.__clsWatch.observe({ type: "layout-shift", buffered: false });
      }
    });
    const vorherRuhe = await desktop.page.evaluate(() => {
      window.__cls = 0;
      return {
        y: window.scrollY,
        kacheln: [...document.querySelectorAll("#kauf-gruppen a[data-gruppe]")].map((el) => {
          const r = el.getBoundingClientRect();
          return { id: el.getAttribute("data-gruppe"), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
        })
      };
    });
    for (let runde = 0; runde < 2; runde += 1) {
      for (const id of ["zaun", "verkehr", "anhaenger"]) {
        const ziel = desktop.page.locator(`#kauf-gruppen a[data-gruppe="${id}"]`);
        const kasten = await ziel.boundingBox();
        await desktop.page.mouse.move(kasten.x + 40, kasten.y + 36);
        await desktop.page.waitForTimeout(90);
        const offenId = id === "zaun" ? "kauf-ebene" : `kauf-ebene-${id}`;
        const auf = await desktop.page.locator(`#${offenId}`).evaluate((el) => !el.hidden);
        if (!auf) point("Hover stabil", false, `${id} Runde ${runde}`);
      }
    }
    const nachRuhe = await desktop.page.evaluate(() => ({
      y: window.scrollY,
      cls: window.__cls,
      kacheln: [...document.querySelectorAll("#kauf-gruppen a[data-gruppe]")].map((el) => {
        const r = el.getBoundingClientRect();
        return { id: el.getAttribute("data-gruppe"), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
      })
    }));
    const kachelnStill = JSON.stringify(vorherRuhe.kacheln) === JSON.stringify(nachRuhe.kacheln);
    point("Hover ohne Ruckeln", kachelnStill && Math.abs(nachRuhe.y - vorherRuhe.y) < 2 && nachRuhe.cls < 0.05, JSON.stringify({ y: [vorherRuhe.y, nachRuhe.y], cls: nachRuhe.cls, vorher: vorherRuhe.kacheln, nachher: nachRuhe.kacheln }));
    await desktop.page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + 30);
    await desktop.page.waitForTimeout(80);
    await desktop.page.locator("#kauf-ebene-verkehr a[data-teil='gefahr']").click();
    await desktop.page.waitForTimeout(40);
    const closed = await desktop.page.locator("#kauf-ebene-verkehr").evaluate((el) => el.hidden);
    const teil = new URL(desktop.page.url()).searchParams.get("teil");
    point("Klick schließt Panel", closed && teil === "gefahr", teil || "");
    const nachbar = desktop.page.locator('#kauf-gruppen a[data-gruppe="zaun"]');
    await nachbar.scrollIntoViewIfNeeded();
    const nachbarBox = await nachbar.boundingBox();
    await desktop.page.mouse.move(nachbarBox.x + 40, nachbarBox.y + 30);
    await desktop.page.waitForTimeout(80);
    const nachWahl = await desktop.page.locator("#kauf-ebene").evaluate((el) => !el.hidden);
    const desktopRand = await desktop.page.evaluate(() => {
      const karten = [...document.querySelectorAll("#kauf-gruppen a[data-gruppe]")];
      const aktiv = karten.find((el) => el.getAttribute("aria-current") === "true");
      return {
        gruppe: aktiv ? aktiv.getAttribute("data-gruppe") : "",
        schatten: karten.map((el) => getComputedStyle(el).boxShadow)
      };
    });
    point("Hover nach Auswahl", nachWahl, JSON.stringify({ nachWahl, desktopRand }));
    await desktop.page.mouse.move(20, 20);
    await desktop.page.waitForTimeout(350);
    const gleiche = desktop.page.locator('#kauf-gruppen a[data-gruppe="zaun"]');
    await gleiche.scrollIntoViewIfNeeded();
    const gleicheBox = await gleiche.boundingBox();
    await desktop.page.mouse.move(gleicheBox.x + gleicheBox.width / 2, gleicheBox.y + 40);
    await desktop.page.waitForTimeout(80);
    const menueNamen = await desktop.page.evaluate(() => [...document.querySelectorAll("#kauf-ebene a:not([hidden]) strong")].map((el) => el.textContent.replace(/\s+/g, " ").trim()));
    await desktop.page.mouse.move(gleicheBox.x + 24, gleicheBox.y + gleicheBox.height + 28);
    await desktop.page.waitForTimeout(300);
    const imMenue = await desktop.page.locator("#kauf-ebene").evaluate((el) => !el.hidden);
    await desktop.page.mouse.move(gleicheBox.x + gleicheBox.width / 2, gleicheBox.y + 40);
    await desktop.page.locator("#kauf-ebene a[data-kat='gitter']").click();
    await desktop.page.waitForTimeout(80);
    async function obenHovern(selector) {
      await desktop.page.evaluate(() => {
        const root = document.documentElement;
        const previous = root.style.scrollBehavior;
        root.style.scrollBehavior = "auto";
        window.scrollTo(0, 0);
        root.style.scrollBehavior = previous;
      });
      await desktop.page.waitForFunction(() => window.scrollY < 2);
      const karte = desktop.page.locator(selector);
      const box = await karte.boundingBox();
      await desktop.page.mouse.move(box.x + 40, box.y + 36);
      await desktop.page.waitForTimeout(120);
      return box;
    }
    await obenHovern('#kauf-gruppen a[data-gruppe="zaun"]');
    const erneut = await desktop.page.locator("#kauf-ebene").evaluate((el) => !el.hidden);
    await obenHovern('#kauf-gruppen a[data-gruppe="verkehr"]');
    const dritte = await desktop.page.locator("#kauf-ebene-verkehr").evaluate((el) => !el.hidden);
    const ankerBox = await obenHovern('#kauf-gruppen a[data-gruppe="anhaenger"]');
    const vierte = await desktop.page.locator("#kauf-ebene-anhaenger").evaluate((el) => !el.hidden);
    await desktop.page.mouse.move(ankerBox.x + 40, ankerBox.y + ankerBox.height + 36);
    await desktop.page.waitForTimeout(320);
    const ankerOffen = await desktop.page.locator("#kauf-ebene-anhaenger").evaluate((el) => !el.hidden);
    point("Hover mehrfach", imMenue && erneut && dritte && vierte && ankerOffen && menueNamen.indexOf("Bauzaun") !== -1 && menueNamen.indexOf("Absperrgitter") !== -1, JSON.stringify({ menueNamen, imMenue, erneut, dritte, vierte, ankerOffen }));
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
    const vorTipp = phone.page.url();
    await phone.page.locator('#kauf-gruppen a[data-gruppe="anhaenger"]').click();
    await phone.page.waitForFunction(() => !document.getElementById("kauf-ebene-anhaenger").hidden);
    const menuOffen = await phone.page.evaluate(() => ({
      url: location.href,
      offen: !document.getElementById("kauf-ebene-anhaenger").hidden,
      namen: [...document.querySelectorAll("#kauf-ebene-anhaenger a:not([hidden]) strong")].map((el) => el.textContent.replace(/\s+/g, " ").trim())
    }));
    point("Antippen öffnet das Menü", menuOffen.offen && menuOffen.url === vorTipp && menuOffen.namen.indexOf("Hochlader") !== -1, JSON.stringify(menuOffen));
    await phone.page.locator("#kauf-ebene-anhaenger a[data-teil='hochlader']").click();
    await phone.page.waitForFunction(() => {
      const adresse = new URL(location.href);
      const name = document.querySelector(".kauf-leiste-name");
      const aktiv = document.querySelector("#kauf-gruppen a[aria-current='true']");
      const ziel = document.getElementById("kauf-teil-hochlader");
      return adresse.searchParams.get("gruppe") === "anhaenger"
        && adresse.searchParams.get("teil") === "hochlader"
        && aktiv && aktiv.getAttribute("data-gruppe") === "anhaenger"
        && name && /Hochlader/.test(name.textContent)
        && ziel && ziel.getBoundingClientRect().top < window.innerHeight;
    });
    const tipp = await phone.page.evaluate(() => {
      const karten = [...document.querySelectorAll("#kauf-gruppen a[data-gruppe]")];
      const aktiv = karten.find((el) => el.getAttribute("aria-current") === "true");
      const rand = aktiv ? getComputedStyle(aktiv, "::after") : null;
      const seiten = rand ? [rand.borderTopColor, rand.borderRightColor, rand.borderBottomColor, rand.borderLeftColor] : [];
      return {
        gruppe: aktiv ? aktiv.getAttribute("data-gruppe") : "",
        label: document.querySelector(".kauf-leiste-name").textContent.replace(/\s+/g, " ").trim(),
        ring: seiten.every((farbe) => farbe === "rgb(118, 183, 41)"),
        nurEine: karten.filter((el) => el.getAttribute("aria-current") === "true").length === 1,
        schatten: karten.every((el) => {
          const wert = getComputedStyle(el).boxShadow;
          return wert === "none" || /inset/.test(wert);
        }),
        panelZu: document.getElementById("kauf-ebene-anhaenger").hidden
      };
    });
    point("Antippen wechselt Rand und Dropdown", tipp.gruppe === "anhaenger" && /Hochlader/.test(tipp.label) && tipp.ring && tipp.nurEine && tipp.schatten && tipp.panelZu, JSON.stringify(tipp));
    const tapped = await phone.page.evaluate(() => {
      const nav = document.getElementById("kauf-ebene-anhaenger");
      const leiste = document.getElementById("kauf-leiste");
      const ziel = document.getElementById("kauf-teil-hochlader");
      const zr = ziel.getBoundingClientRect();
      const adresse = new URL(location.href);
      const knopf = leiste.querySelector(".kauf-leiste-wahl");
      const karten = [...document.querySelectorAll("#kauf-gruppen a[data-gruppe]")].filter((el) => !el.hidden);
      const breiten = karten.map((el) => Math.round(el.getBoundingClientRect().width));
      const zeile = karten.map((el) => Math.round(el.getBoundingClientRect().top));
      const schrift = document.getElementById("kauf-schrift");
      const band = leiste.getBoundingClientRect();
      return {
        panelZu: nav.hidden,
        gruppe: adresse.searchParams.get("gruppe"),
        teil: adresse.searchParams.get("teil"),
        leiste: !leiste.hidden && getComputedStyle(leiste).position === "sticky",
        marke: knopf ? knopf.textContent.replace(/\s+/g, " ").trim() : "",
        kopfFrei: zr.top >= band.bottom - 8,
        bilder: leiste.querySelectorAll("img").length,
        pills: leiste.querySelectorAll(".kauf-leiste-gruppe, .kauf-leiste-row, .kauf-leiste-link").length,
        gleich: breiten.length === 3 && Math.max(...breiten) - Math.min(...breiten) <= 2,
        zeile: zeile.length === 3 && Math.max(...zeile) - Math.min(...zeile) <= 2,
        hoehe: Math.round(band.height),
        imBild: band.right <= window.innerWidth + 1 && band.left >= -1,
        schriftWeg: schrift && getComputedStyle(schrift).display === "none"
      };
    });
    point("Tap springt zur Überschrift", tapped.panelZu && tapped.gruppe === "anhaenger" && tapped.teil === "hochlader" && tapped.leiste && /Hochlader/.test(tapped.marke) && tapped.marke.indexOf("▾") !== -1 && tapped.kopfFrei && tapped.bilder === 0 && tapped.pills === 0 && tapped.gleich && tapped.zeile && tapped.hoehe <= 100 && tapped.imBild && tapped.schriftWeg, JSON.stringify(tapped));
    await phone.page.close();

    async function handyNav(width) {
      const view = await open(width, "/kaufen/?gruppe=zaun&kat=gitter");
      const ruhe = await view.page.evaluate(() => {
        const leiste = document.getElementById("kauf-leiste");
        const gruppen = [...document.querySelectorAll("#kauf-gruppen a[data-gruppe]")].filter((el) => !el.hidden);
        const breiten = gruppen.map((el) => Math.round(el.getBoundingClientRect().width));
        const zeile = gruppen.map((el) => Math.round(el.getBoundingClientRect().top));
        const aktiv = gruppen.find((el) => el.getAttribute("aria-current") === "true");
        const rand = aktiv ? getComputedStyle(aktiv, "::after") : null;
        const stark = aktiv ? getComputedStyle(aktiv.querySelector("strong")) : null;
        const knopf = leiste.querySelector(".kauf-leiste-wahl");
        const menu = document.getElementById("kauf-leiste-menu");
        const scrolls = [...document.querySelectorAll("body *")].filter((el) => {
          const value = getComputedStyle(el).overflowY;
          return (value === "auto" || value === "scroll") && el.scrollHeight > el.clientHeight + 2;
        }).map((el) => el.id || String(el.className).slice(0, 40));
        return {
          n: gruppen.length,
          gleich: breiten.length === 3 && Math.max(...breiten) - Math.min(...breiten) <= 2,
          zeile: zeile.length === 3 && Math.max(...zeile) - Math.min(...zeile) <= 2,
          gruen: rand ? rand.borderTopColor : "",
          rand: rand ? rand.borderTopWidth : "",
          fuellung: stark ? stark.backgroundColor : "",
          label: knopf ? knopf.textContent.replace(/\s+/g, " ").trim() : "",
          menuZu: !!(menu && menu.hidden),
          hoehe: Math.round(leiste.getBoundingClientRect().height),
          bilder: leiste.querySelectorAll("img").length,
          kacheln: document.querySelectorAll("#kauf-gruppen > a[data-gruppe] img").length,
          kachelFest: getComputedStyle(document.getElementById("kauf-gruppen")).position === "sticky",
          barHoch: Math.round(document.getElementById("kauf-gruppen").getBoundingClientRect().height),
          pills: leiste.querySelectorAll(".kauf-leiste-gruppe, .kauf-leiste-row").length,
          quer: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          scrolls,
          unten: !!document.querySelector("#kauf-verkehr-summe .beispiel-leiste-wahl"),
          schriftWeg: getComputedStyle(document.getElementById("kauf-schrift")).display === "none"
        };
      });
      await view.page.locator(".kauf-leiste-wahl").click();
      const offen = await view.page.evaluate(() => {
        const menu = document.getElementById("kauf-leiste-menu");
        const links = [...menu.querySelectorAll("a")];
        const ebenen = document.querySelectorAll("#kauf-ebene a").length;
        const hoehen = links.map((el) => el.getBoundingClientRect().height);
        const deckend = getComputedStyle(menu).backgroundColor === "rgb(255, 255, 255)";
        return {
          auf: menu && !menu.hidden && document.querySelector(".kauf-leiste-wahl").getAttribute("aria-expanded") === "true",
          n: links.length,
          ebenen,
          tast: hoehen.length > 0 && Math.min(...hoehen) >= 44,
          deckend,
          ebeneZu: document.getElementById("kauf-ebene").hidden
        };
      });
      await view.page.keyboard.press("Escape");
      const esc = await view.page.evaluate(() => document.getElementById("kauf-leiste-menu").hidden);
      await view.page.locator(".kauf-leiste-wahl").click();
      await view.page.locator("h1").click();
      const aussen = await view.page.evaluate(() => document.getElementById("kauf-leiste-menu").hidden);
      await view.page.locator(".kauf-leiste-wahl").click();
      await view.page.locator("#kauf-leiste-menu a[data-kat='schleuse']").click();
      await view.page.waitForFunction(() => {
        const ziel = document.getElementById("kauf-teil-schleuse");
        const band = document.getElementById("kauf-leiste").getBoundingClientRect();
        const top = ziel.getBoundingClientRect().top;
        return new URL(location.href).searchParams.get("kat") === "schleuse" && top >= band.bottom - 8 && top < window.innerHeight * 0.7;
      });
      const sprung = await view.page.evaluate(() => {
        const ziel = document.getElementById("kauf-teil-schleuse");
        const band = document.getElementById("kauf-leiste").getBoundingClientRect();
        const zr = ziel.getBoundingClientRect();
        return {
          kat: new URL(location.href).searchParams.get("kat"),
          zu: document.getElementById("kauf-leiste-menu").hidden,
          frei: zr.top >= band.bottom - 8 && zr.top < window.innerHeight * 0.7,
          label: document.querySelector(".kauf-leiste-name").textContent.replace(/\s+/g, " ").trim()
        };
      });
      await view.page.waitForTimeout(1600);
      await view.page.evaluate(() => {
        const root = document.documentElement;
        const previous = root.style.scrollBehavior;
        root.style.scrollBehavior = "auto";
        document.getElementById("kauf-teil-buehne").scrollIntoView({ block: "start", behavior: "auto" });
        root.style.scrollBehavior = previous;
      });
      await view.page.waitForTimeout(400);
      const scroll = await view.page.evaluate(() => {
        const leiste = document.getElementById("kauf-leiste");
        const gruppen = document.getElementById("kauf-gruppen").getBoundingClientRect();
        const kopf = document.querySelector(".top").getBoundingClientRect().bottom;
        const band = leiste.getBoundingClientRect();
        return {
          label: document.querySelector(".kauf-leiste-name").textContent.replace(/\s+/g, " ").trim(),
          haengt: Math.abs(gruppen.top - kopf) <= 4 && Math.abs(band.top - gruppen.bottom) <= 8,
          quer: document.documentElement.scrollWidth - document.documentElement.clientWidth
        };
      });
      const ok = ruhe.n === 3 && ruhe.gleich && ruhe.zeile && ruhe.gruen === "rgb(118, 183, 41)" && ruhe.rand === "2px" && ruhe.fuellung !== "rgb(118, 183, 41)" && /Absperrgitter/.test(ruhe.label) && ruhe.label.indexOf("▾") !== -1 && ruhe.menuZu && ruhe.hoehe <= 100 && ruhe.barHoch <= 120 && ruhe.bilder === 0 && ruhe.kacheln === 3 && ruhe.kachelFest && ruhe.pills === 0 && ruhe.quer <= 1 && ruhe.scrolls.length === 0 && ruhe.unten && ruhe.schriftWeg && offen.auf && offen.n === offen.ebenen && offen.n >= 6 && offen.tast && offen.deckend && offen.ebeneZu && esc && aussen && sprung.kat === "schleuse" && sprung.zu && sprung.frei && /Schleusen/.test(sprung.label) && /Bühnen/.test(scroll.label) && scroll.haengt && scroll.quer <= 1;
      point(`Handy-Leiste ${width}`, ok, JSON.stringify({ ruhe, offen, esc, aussen, sprung, scroll, fehler: view.errors }));
      point(`Konsole Handy ${width}`, view.errors.length === 0, view.errors.join(" | "));
      await view.page.close();
    }
    await handyNav(390);
    await handyNav(360);
    await handyNav(320);

    for (const modus of ["kauf", "miete"]) {
      const wechsel = await open(390, modus === "miete" ? "/kaufen/?modus=miete&gruppe=zaun&kat=bauzaune" : "/kaufen/?gruppe=zaun&kat=bauzaune");
      const vorher = await wechsel.page.locator(".kauf-leiste-name").innerText();
      await wechsel.page.locator("#kauf-gruppen a[data-gruppe='verkehr']").click();
      await wechsel.page.waitForFunction(() => !document.getElementById("kauf-ebene-verkehr").hidden);
      await wechsel.page.locator("#kauf-ebene-verkehr a[data-teil='schranken']").click();
      await wechsel.page.waitForFunction(() => {
        const name = document.querySelector(".kauf-leiste-name");
        const aktiv = document.querySelector("#kauf-gruppen a[aria-current='true']");
        const kopf = document.querySelector("#kauf-teil-schranken h2");
        return new URL(location.href).searchParams.get("gruppe") === "verkehr" && aktiv && aktiv.getAttribute("data-gruppe") === "verkehr" && name && /schranken/i.test(name.textContent) && kopf && /schranken/i.test(kopf.textContent);
      });
      const nach = await wechsel.page.evaluate(() => {
        const karten = [...document.querySelectorAll("#kauf-gruppen a[data-gruppe]")].filter((el) => !el.hidden);
        const aktiv = karten.find((el) => el.getAttribute("aria-current") === "true");
        const rand = getComputedStyle(aktiv, "::after");
        const tops = karten.map((el) => Math.round(el.getBoundingClientRect().top));
        const menu = [...document.querySelectorAll("#kauf-leiste-menu a")].map((el) => el.textContent.replace(/\s+/g, " ").trim());
        return {
          modus: new URL(location.href).searchParams.get("modus") || "kauf",
          label: document.querySelector(".kauf-leiste-name").textContent.replace(/\s+/g, " ").trim(),
          menu,
          ring: [rand.borderTopColor, rand.borderRightColor, rand.borderBottomColor, rand.borderLeftColor].every((farbe) => farbe === "rgb(118, 183, 41)"),
          schatten: karten.every((el) => {
            const wert = getComputedStyle(el).boxShadow;
            return wert === "none" || /inset/.test(wert);
          }),
          zeile: Math.max(...tops) - Math.min(...tops) <= 2,
          quer: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          bild: Math.round(aktiv.querySelector("img").getBoundingClientRect().height),
          h2: document.querySelector("#kauf-teil-schranken h2").textContent.replace(/\s+/g, " ").trim()
        };
      });
      const listeOk = modus === "miete"
        ? nach.menu.includes("Absperrschranken") && !nach.menu.some((name) => /Gefahrzeichen|Bauzaun/.test(name))
        : nach.menu.includes("Absperrschranken") && nach.menu.includes("Gefahrzeichen") && !nach.menu.some((name) => /Bauzaun/.test(name));
      const ok = nach.ring && nach.schatten && nach.zeile && nach.quer <= 1 && nach.bild >= 34 && nach.bild <= 56 && /schranken/i.test(nach.label) && /schranken/i.test(nach.h2) && nach.modus === modus && listeOk;
      point(`Wechsel ${modus}`, ok, JSON.stringify({ vorher, nach }));
      await wechsel.page.close();
    }

    const sprache = await open(1280, "/kaufen/");
    await sprache.page.evaluate(() => sessionStorage.removeItem("amk-kauf-unter"));
    await sprache.page.locator('#kauf-gruppen a[data-gruppe="zaun"]').click();
    await sprache.page.waitForTimeout(80);
    const erste = new URL(sprache.page.url());
    const alleZaun = await sprache.page.evaluate(() => {
      function sichtbar(sel) {
        const el = document.querySelector(sel);
        return !!(el && !el.hidden && !el.closest("[hidden]") && el.getBoundingClientRect().height > 0);
      }
      return {
        bauzaun: sichtbar("#kauf-liste article.tile h3"),
        gitter: sichtbar("#kauf-teil-gitter h2"),
        kat: new URL(location.href).searchParams.get("kat") || ""
      };
    });
    point("Kachel wählt die gemerkte Unterkategorie", erste.searchParams.get("gruppe") === "zaun" && erste.searchParams.get("kat") === "bauzaune" && alleZaun.bauzaun && !alleZaun.gitter, JSON.stringify({ search: erste.search, alleZaun }));
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
    point("Kachel merkt die Unterkategorie", letzte.searchParams.get("gruppe") === "zaun" && letzte.searchParams.get("kat") === "gitter", letzte.search);
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

    const sprung = await open(1280, "/kaufen/");
    await sprung.page.evaluate(() => sessionStorage.removeItem("amk-kauf-unter"));
    const ruhe = await sprung.page.evaluate(() => {
      const schrift = document.getElementById("kauf-schrift");
      const bar = document.getElementById("kauf-gruppen").getBoundingClientRect();
      const kopf = document.querySelector(".top").getBoundingClientRect().bottom;
      return {
        schrift: getComputedStyle(schrift).display,
        unterKopf: bar.top >= kopf - 2,
        bilder: document.querySelectorAll("#kauf-gruppen > a[data-gruppe] img").length
      };
    });
    await sprung.page.evaluate(() => {
      const root = document.documentElement;
      const previous = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      window.scrollTo(0, 1400);
      root.style.scrollBehavior = previous;
    });
    await sprung.page.waitForFunction(() => getComputedStyle(document.getElementById("kauf-schrift")).visibility === "visible");
    const band = await sprung.page.evaluate(() => {
      const schrift = document.getElementById("kauf-schrift");
      const kopf = document.querySelector(".top").getBoundingClientRect().bottom;
      const oben = schrift.getBoundingClientRect().top;
      const link = schrift.querySelector("a[aria-current='true']");
      return {
        haengt: Math.abs(oben - kopf) <= 4,
        text: link ? link.textContent.replace(/\s+/g, " ").trim() : schrift.textContent.replace(/\s+/g, " ").trim(),
        leiste: getComputedStyle(document.getElementById("kauf-leiste")).display,
        schrift: getComputedStyle(schrift).position,
        sichtbar: getComputedStyle(schrift).visibility
      };
    });
    point("Kategorieleiste bleibt", ruhe.unterKopf && ruhe.bilder === 3 && band.haengt && band.schrift === "fixed" && band.sichtbar === "visible" && /Bauzaun/.test(band.text) && band.leiste === "none", JSON.stringify({ ruhe, band }));
    await sprung.page.locator("#kauf-gruppen").scrollIntoViewIfNeeded();
    const schriftKarte = sprung.page.locator("#kauf-gruppen a[data-gruppe='verkehr']");
    const schriftBox = await schriftKarte.boundingBox();
    await sprung.page.mouse.move(schriftBox.x + schriftBox.width / 2, schriftBox.y + schriftBox.height / 2);
    await sprung.page.waitForTimeout(80);
    const schriftPanel = await sprung.page.evaluate(() => {
      const nav = document.getElementById("kauf-ebene-verkehr");
      const bar = document.querySelector("#kauf-gruppen a[data-gruppe='verkehr']").getBoundingClientRect();
      const nr = nav.getBoundingClientRect();
        return { open: !nav.hidden, n: nav.querySelectorAll("a").length, unter: Math.abs(nr.top - bar.bottom) <= 8, bg: getComputedStyle(nav).backgroundColor };
    });
    point("Leisten-Panel", schriftPanel.open && schriftPanel.n === 6 && schriftPanel.unter && schriftPanel.bg === "rgb(255, 255, 255)", JSON.stringify(schriftPanel));
    await sprung.page.locator("#kauf-ebene-verkehr a[data-teil='einrichtung']").click();
    await sprung.page.waitForFunction(() => {
      const ziel = document.getElementById("kauf-teil-einrichtung");
      const bar = document.getElementById("kauf-gruppen").getBoundingClientRect();
      const zr = ziel.getBoundingClientRect();
      return new URL(location.href).searchParams.get("teil") === "einrichtung" && document.getElementById("kauf-ebene-verkehr").hidden && zr.top >= bar.bottom - 8;
    });
    const lage = await sprung.page.evaluate(() => {
      const ziel = document.getElementById("kauf-teil-einrichtung");
      const bar = document.getElementById("kauf-gruppen").getBoundingClientRect();
      const zr = ziel.getBoundingClientRect();
      return {
        teil: new URL(location.href).searchParams.get("teil"),
        frei: zr.top >= bar.bottom - 8,
        panelZu: document.getElementById("kauf-ebene-verkehr").hidden
      };
    });
    point("Klick springt zur Überschrift", lage.teil === "einrichtung" && lage.frei && lage.panelZu, JSON.stringify(lage));
    await sprung.page.goBack();
    await sprung.page.waitForTimeout(200);
    const zurueck = new URL(sprung.page.url());
    point("Zurück", zurueck.searchParams.get("gruppe") === "zaun" && !zurueck.searchParams.get("teil"), sprung.page.url());
    await sprung.page.evaluate(() => {
      const root = document.documentElement;
      const previous = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      window.scrollTo(0, 0);
      root.style.scrollBehavior = previous;
    });
    await sprung.page.waitForFunction(() => window.scrollY < 2);
    const wieder = await sprung.page.evaluate(() => {
      const bar = document.getElementById("kauf-gruppen").getBoundingClientRect();
      const kopf = document.querySelector(".top").getBoundingClientRect().bottom;
      const titel = document.querySelector("main h1").getBoundingClientRect();
      return { titel: Math.round(titel.top), leiste: Math.round(bar.top), kopf: Math.round(kopf) };
    });
    point("Leiste im Fluss", wieder.titel >= wieder.kopf - 2 && wieder.leiste >= wieder.titel, JSON.stringify(wieder));
    await sprung.page.locator("#kauf-gruppen a[data-gruppe='zaun']").click();
    await sprung.page.waitForTimeout(40);
    const wieKachel = new URL(sprung.page.url());
    point("Leiste wählt die Kategorie", wieKachel.searchParams.get("gruppe") === "zaun" && !!wieKachel.searchParams.get("kat"), wieKachel.search);
    await sprung.page.close();

    const start = await open(1280, "/");
    await start.page.locator("a[data-ober='anhaenger']").click();
    await start.page.waitForURL(/gruppe=anhaenger/);
    const ankunft = await start.page.evaluate(() => {
      const link = document.querySelector("#kauf-gruppen a[data-gruppe='anhaenger']");
      const r = link.getBoundingClientRect();
      return {
        gruppe: new URL(location.href).searchParams.get("gruppe"),
        current: link.getAttribute("aria-current"),
        sichtbar: r.top < window.innerHeight && r.bottom > 0 && r.width > 40
      };
    });
    point("Startkachel Desktop", ankunft.gruppe === "anhaenger" && ankunft.current === "true" && ankunft.sichtbar, JSON.stringify(ankunft));
    await start.page.close();
    const startHandy = await open(390, "/");
    await startHandy.page.locator("a[data-ober='zaun']").click();
    await startHandy.page.waitForURL(/gruppe=zaun/);
    const ankunftHandy = await startHandy.page.evaluate(() => {
      const link = document.querySelector("#kauf-gruppen a[data-gruppe='zaun']");
      const r = link.getBoundingClientRect();
      const links = [...document.querySelectorAll("#kauf-gruppen a[data-gruppe]")].filter((el) => !el.hidden);
      const tops = links.map((el) => Math.round(el.getBoundingClientRect().top));
      return {
        gruppe: new URL(location.href).searchParams.get("gruppe"),
        current: link.getAttribute("aria-current"),
        sichtbar: r.bottom > 0 && r.top < window.innerHeight,
        zeile: tops.length === 3 && Math.max(...tops) - Math.min(...tops) <= 2,
        quer: document.documentElement.scrollWidth - document.documentElement.clientWidth
      };
    });
    point("Startkachel Handy", ankunftHandy.gruppe === "zaun" && ankunftHandy.current === "true" && ankunftHandy.sichtbar && ankunftHandy.zeile && ankunftHandy.quer <= 1, JSON.stringify(ankunftHandy));
    await startHandy.page.close();

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
      const step = card.querySelector(".beispiel-step");
      const sichtbar = [...document.querySelectorAll("article.kauf-produkt, #kauf-liste .kauf-schnell")].filter((el) => {
        return !el.hidden && !el.closest("[hidden]") && el.getBoundingClientRect().height > 0;
      });
      return {
        checked: card.querySelector('input[type="checkbox"]').checked,
        menge: !!(step && getComputedStyle(step).display !== "none" && field && field.value === "1"),
        max: field.getAttribute("max"),
        kreis: getComputedStyle(card.querySelector(".beispiel-kreis")).borderRadius,
        plus: (() => {
          const karten = [...document.querySelectorAll("article.kauf-produkt")].filter((el) => !el.hidden && !el.closest("[hidden]") && el.getBoundingClientRect().height > 0);
          return karten.length > 1 && karten.every((el) => {
            const step = el.querySelector(".beispiel-step");
            const an = el.querySelector('input[type="checkbox"]').checked;
            if (!step) return !an;
            const cs = getComputedStyle(step);
            const offen = cs.visibility !== "hidden" && Number(cs.opacity) > 0.9;
            return an ? offen : !offen;
          });
        })()
      };
    });
        point("Auswahlkreis", kreis.checked && kreis.menge && kreis.plus && kreis.kreis !== "0px" && kreis.max === "9999", JSON.stringify(kreis));
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

    const rundwege = [
      ["Absperrgitter", "/kaufen/?gruppe=zaun&kat=gitter", "#kauf-teil-gitter article.kauf-produkt a"],
      ["Schilder", "/kaufen/?gruppe=verkehr&teil=gefahr", "#kauf-teil-gefahr article.kauf-produkt a"],
      ["Anhänger", "/kaufen/?gruppe=anhaenger&teil=hochlader", "#kauf-teil-hochlader article.kauf-produkt a"],
      ["Bauzaun", "/kaufen/?gruppe=zaun&kat=bauzaune", "#kauf-liste article.tile a"]
    ];
    for (const [name, url, selector] of rundwege) {
      const lauf = await open(1280, url);
      await lauf.page.evaluate(() => localStorage.removeItem("amk-wunsch"));
      await lauf.page.reload({ waitUntil: "networkidle" });
      const ziel = lauf.page.locator(selector).first();
      await ziel.click();
      await lauf.page.waitForURL(/\/produkt\//);
      const feld = lauf.page.locator("#menge-einfach, #menge-staender").first();
      await feld.waitFor({ state: "visible" });
      await feld.fill("2");
      await feld.dispatchEvent("input");
      await lauf.page.waitForTimeout(200);
      await lauf.page.goBack({ waitUntil: "networkidle" });
      await lauf.page.waitForTimeout(250);
      const stand = await lauf.page.evaluate(() => {
        const cards = [...document.querySelectorAll("article.kauf-produkt, #kauf-liste article.tile")].filter((el) => !el.hidden && !el.closest("[hidden]") && el.getBoundingClientRect().height > 0);
        const hit = cards.find((card) => {
          const field = card.querySelector("[data-menge], [data-schnell='staender']");
          if (field && field.value === "2") return true;
          const kreis = card.querySelector("[data-kreis='bauzaun']");
          const ausBox = [...document.querySelectorAll("#kauf-verkehr-summe .beispiel-step input")].some((input) => input.value === "2");
          return !!(kreis && kreis.checked && ausBox && !card.querySelector("[data-schnell='staender']"));
        });
        const box = hit ? hit.querySelector('input[type="checkbox"]') : null;
        const step = hit ? hit.querySelector(".beispiel-step") : null;
        const direkt = hit ? hit.querySelector("[data-menge], [data-schnell='staender']") : null;
        const summe = document.getElementById("kauf-verkehr-summe");
        const text = summe ? summe.innerText : "";
        const karte = summe ? summe.querySelector(".beispiel-post") : null;
        const steuer = karte ? karte.querySelector(".beispiel-step") : null;
        const weg = karte ? karte.querySelector(".beispiel-weg") : null;
        const titel = summe ? summe.querySelector("h2") : null;
        const knopf = summe ? summe.querySelector(".beispiel-senden .btn") : null;
        return {
          checked: !!(box && box.checked),
          menge: direkt && direkt.value === "2" ? "2" : ([...document.querySelectorAll("#kauf-verkehr-summe .beispiel-step input")].some((input) => input.value === "2") ? "2" : (direkt ? direkt.value : "")),
          plus: !!(step && getComputedStyle(step).display !== "none"),
          box: text.replace(/\s+/g, " ").trim(),
          platzhalter: /Typ\s*[–-]/.test(text),
          titel: titel ? titel.textContent.trim() : "",
          karte: !!(karte && getComputedStyle(karte).borderTopWidth !== "0px" && getComputedStyle(karte).borderRadius !== "0px"),
          weg: !!(weg && getComputedStyle(weg).borderRadius !== "0px"),
          schritt: !!(steuer && getComputedStyle(steuer).display !== "none"),
          korb: knopf ? knopf.textContent.trim() : ""
        };
      });
      point("Rundlauf " + name, stand.checked && stand.menge === "2" && stand.plus && stand.box.length > 0 && !stand.platzhalter && stand.titel === "Deine Auswahl" && stand.karte && stand.weg && stand.schritt && stand.korb === "Zum Anfragekorb", JSON.stringify(stand));
      await lauf.page.close();
    }

    const schnell = await open(1280, "/kaufen/?gruppe=zaun&kat=bauzaune");
    await schnell.page.evaluate(() => localStorage.removeItem("amk-wunsch"));
    await schnell.page.reload({ waitUntil: "networkidle" });
    const schnellKarte = schnell.page.locator("#kauf-liste article.tile").first();
    const schnellInfo = await schnell.page.evaluate(() => {
      const block = document.querySelector("#kauf-liste .kauf-schnell[data-slug]");
      const stand = block.querySelector("[data-schnell='staender']");
      const feld = block.querySelector("[data-schnell='felder']");
      const link = block.querySelector(".kauf-schnell-details");
      const zeilen = block.querySelectorAll(".kauf-schnell-zeile").length;
      return {
        slug: block.getAttribute("data-slug"),
        stand: !!stand,
        zeilen,
        max: feld.getAttribute("max"),
        min: feld.getAttribute("min"),
        link: link.getAttribute("href"),
        text: link.textContent.trim(),
        label: block.querySelector(".kauf-schnell-zeile span").textContent.trim()
      };
    });
    point("Schnellauswahl", schnellInfo.slug === "bauzaun-10075" && !schnellInfo.stand && schnellInfo.zeilen === 1 && schnellInfo.label === "Einzelfelder" && schnellInfo.max === "9999" && schnellInfo.min === "0" && /bauzaun-10075\/$/.test(schnellInfo.link) && schnellInfo.text === "Details anpassen", JSON.stringify(schnellInfo));
    await schnellKarte.locator("[data-kreis]").check();
    await schnellKarte.locator("[data-schnell='felder']").fill("3");
    await schnell.page.waitForTimeout(100);
    const korb = await schnell.page.evaluate(() => JSON.parse(localStorage.getItem("amk-wunsch") || "[]").map((item) => item.id + ":" + item.qty + ":" + (item.note || "")));
    point("Korb aus der Liste", korb.indexOf("kauf:bauzaun-10075:zusatz:felder:3:zusätzlich") !== -1 && !korb.some((line) => line.indexOf(":im:") !== -1), korb.join(" | "));
    await schnell.page.goto(base + "/produkt/bauzaun-10075/", { waitUntil: "networkidle" });
    await schnell.page.locator("#menge-staender").fill("2");
    await schnell.page.locator("#menge-staender").dispatchEvent("input");
    await schnell.page.waitForFunction(() => document.getElementById("menge-staender") && document.getElementById("menge-staender").value === "2" && document.getElementById("menge-felder") && document.getElementById("menge-felder").value === "3");
    await schnell.page.selectOption("#wahl-fuss", "fuss-10004");
    await schnell.page.waitForTimeout(150);
    await schnell.page.goto(base + "/kaufen/?gruppe=zaun&kat=bauzaune", { waitUntil: "networkidle" });
    const angepasst = await schnell.page.evaluate(() => {
      const block = document.querySelector(".kauf-schnell[data-slug='bauzaun-10075']");
      const hint = block.querySelector(".kauf-schnell-hinweis");
      const kreis = block.parentElement.querySelector("[data-kreis='bauzaun']");
      const box = document.getElementById("kauf-verkehr-summe").innerText;
      return {
        standFeld: !!block.querySelector("[data-schnell='staender']"),
        feld: block.querySelector("[data-schnell='felder']").value,
        kreis: !!(kreis && kreis.checked),
        hinweis: hint && !hint.hidden && hint.textContent.trim(),
        box: /Im Komplett-Ständer enthalten/.test(box) && /2/.test(box)
      };
    });
    point("Angepasst bleibt", !angepasst.standFeld && angepasst.feld === "3" && angepasst.kreis && angepasst.hinweis === "angepasst" && angepasst.box, JSON.stringify(angepasst));
    await schnell.page.locator(".kauf-schnell[data-slug='bauzaun-10075'] [data-schnell='felder']").fill("4");
    await schnell.page.waitForTimeout(100);
    const bewahrt = await schnell.page.evaluate(() => JSON.parse(localStorage.getItem("amk-wunsch") || "[]").filter((item) => String(item.id).indexOf("kauf:bauzaun-10075:im:fuss:") === 0).map((item) => item.id + ":" + item.qty));
    point("Liste überschreibt den Fuß nicht", bewahrt.length === 1 && bewahrt[0] === "kauf:bauzaun-10075:im:fuss:fuss-10004:62", bewahrt.join(", "));
    await schnell.page.locator(".kauf-schnell[data-slug='bauzaun-10075'] [data-schnell='felder']").fill("10000");
    const begrenzt = await schnell.page.locator(".kauf-schnell[data-slug='bauzaun-10075'] [data-schnell='felder']").inputValue();
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
        robots: document.querySelector('meta[name="robots"]').content,
        titel: (document.getElementById("beispiel-auswahl-titel") || {}).textContent || "",
        standKarte: !!document.querySelector("#block-im .beispiel-post .beispiel-step"),
        zusatzKarte: !!document.querySelector("#block-zusatz .beispiel-post .beispiel-weg")
      };
    });
    point("Komplett-Ständer und Einzelfelder", detailInfo.staender && detailInfo.felder, "");
    point("Fuß- und Schellentausch", detailInfo.fuss > 1 && detailInfo.schelle > 1, `${detailInfo.fuss}/${detailInfo.schelle}`);
    point("Blöcke enthalten und zusätzlich", detailInfo.im && detailInfo.extra && detailInfo.titel.trim() === "Deine Auswahl" && detailInfo.standKarte && detailInfo.zusatzKarte, detailInfo.titel.trim());
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
    await detail.page.evaluate(() => {
      const items = JSON.parse(localStorage.getItem("amk-wunsch") || "[]");
      items.push(
        { id: "kauf:schild:z123", name: "Arbeitsstelle", qty: 1, kat: "verkehrssicherung", bild: "images/schilder/z123.svg" },
        { id: "kauf:hochlader", name: "Hochlader", qty: 1, kat: "anhaenger", bild: "images/anhaenger-offen.webp" },
        { id: "miete:bauzaun-standard", name: "Bauzaun Standard", qty: 2, kat: "bauzaun" },
        { id: "miete:schild:z123", name: "Gefahrstelle", qty: 1, kat: "verkehrssicherung", bild: "images/schilder/z123.svg" }
      );
      localStorage.setItem("amk-wunsch", JSON.stringify(items));
    });
    await detail.page.reload({ waitUntil: "networkidle" });
    const korbLinks = await detail.page.evaluate(() => {
      const rows = [...document.querySelectorAll("li.cart-row")].map((row) => {
        const name = row.querySelector(".cart-main > strong > a.cart-link");
        const bild = row.querySelector(":scope > a.cart-bild");
        const img = row.querySelector(":scope > a.cart-bild img, :scope > img");
        return {
          name: name ? name.getAttribute("href") : "",
          bild: bild ? bild.getAttribute("href") : "",
          lose: !!(img && !img.closest("a"))
        };
      });
      const teile = [...document.querySelectorAll(".cart-stand-teile a")].map((a) => a.getAttribute("href"));
      const controls = [...document.querySelectorAll(".cart-row input, .cart-row button")];
      const nameLink = document.querySelector("[data-stand-title] a");
      return {
        rows,
        teile,
        steuern: controls.every((el) => !el.closest("a")),
        unterstrichen: nameLink ? getComputedStyle(nameLink).textDecorationLine : "",
        rahmen: nameLink ? getComputedStyle(nameLink).outlineStyle : ""
      };
    });
    const korbHref = korbLinks.rows.map((row) => row.name).concat(korbLinks.rows.map((row) => row.bild), korbLinks.teile).filter(Boolean);
    const korbStatus = await detail.page.evaluate(async (hrefs) => {
      const seen = {};
      const out = [];
      for (const href of hrefs) {
        if (seen[href]) continue;
        seen[href] = true;
        const res = await fetch(new URL(href, location.href), { method: "GET" });
        out.push(href + ":" + res.status);
      }
      return out;
    }, korbHref);
    const standZeile = korbLinks.rows.find((row) => (row.name || "").indexOf("/produkt/bauzaun-10075/") !== -1) || {};
    point("Korb-Zeilen verlinkt", korbLinks.rows.length > 0 && korbLinks.rows.every((row) => row.name && !row.lose && row.bild === row.name), JSON.stringify(korbLinks.rows));
    point("Ständer zur Bauzaunseite", (standZeile.name || "").endsWith("/produkt/bauzaun-10075/") && standZeile.bild === standZeile.name, standZeile.name || "");
    point("Fuß und Schelle eigene Seite", korbLinks.teile.some((href) => href.endsWith("/produkt/fuss-10006/")) && korbLinks.teile.some((href) => href.endsWith("/produkt/zubehoer-10002-1/")) && korbLinks.teile.filter((href) => href.indexOf("/produkt/bauzaun-10075/") === -1).every((href) => /\/produkt\/(fuss-|zubehoer-)/.test(href)), korbLinks.teile.join(" | "));
    point("Schild, Anhänger, Miete", korbLinks.rows.some((row) => (row.name || "").endsWith("/produkt/schild-z123/")) && korbLinks.rows.some((row) => (row.name || "").endsWith("/produkt/hochlader/")) && korbLinks.rows.some((row) => (row.name || "").endsWith("/produkt/bauzaun-standard/")) && korbLinks.rows.some((row) => (row.name || "").indexOf("/mieten/?gruppe=schilder") !== -1), korbLinks.rows.map((row) => row.name).join(" | "));
    point("Korb-Links vorhanden", korbStatus.every((entry) => entry.endsWith(":200")), korbStatus.join(" | "));
    point("Menge und Löschen ohne Link", korbLinks.steuern, "");
    point("Link erkennbar", korbLinks.unterstrichen.indexOf("underline") !== -1, korbLinks.unterstrichen);
    await detail.page.locator("[data-stand-title] a").focus();
    const fokus = await detail.page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
    point("Link-Fokus", fokus !== "none", fokus);
    const korbUrl = detail.page.url();
    await detail.page.locator("input[data-stand-key]").fill("2");
    await detail.page.locator("input[data-stand-key]").dispatchEvent("change");
    const nachMenge = await detail.page.evaluate(() => ({
      url: location.pathname,
      titel: (document.querySelector("[data-stand-title] a") || {}).textContent || "",
      fuss: (document.querySelector('.cart-stand-teile a[href$="/produkt/fuss-10006/"]') || {}).textContent || "",
      menge: (document.querySelector(".cart-stand-teile [data-teil-menge]") || {}).textContent || ""
    }));
    point("Menge bleibt im Korb", nachMenge.url.endsWith("/anfrage/") && /2 × Komplett-Ständer/.test(nachMenge.titel) && nachMenge.fuss.length > 0, JSON.stringify(nachMenge));
    await detail.page.locator("[data-stand-title] a").click();
    await detail.page.waitForURL(/\/produkt\/bauzaun-10075\//);
    await detail.page.goBack({ waitUntil: "networkidle" });
    const korbZurueck = await detail.page.locator("[data-stand-title]").innerText();
    const gespeichert = await detail.page.evaluate(() => JSON.parse(localStorage.getItem("amk-wunsch") || "[]").length);
    point("Korb bleibt beim Zurück", /Komplett-Ständer/.test(korbZurueck) && gespeichert > 0 && detail.page.url() === korbUrl, korbZurueck);
    const korbRoh = await detail.page.evaluate(() => localStorage.getItem("amk-wunsch"));
    const telefon = await open(390, "/anfrage/");
    await telefon.page.evaluate((raw) => localStorage.setItem("amk-wunsch", raw), korbRoh);
    await telefon.page.reload({ waitUntil: "networkidle" });
    const telefonLinks = await telefon.page.locator("li.cart-row .cart-main > strong > a.cart-link").count();
    const telefonUrl = telefon.page.url();
    await telefon.page.locator("[data-stand-step='-1']").click();
    const telefonNach = await telefon.page.evaluate(() => ({
      url: location.href,
      titel: (document.querySelector("[data-stand-title] a") || {}).textContent || ""
    }));
    point("Korb Telefon", telefonLinks > 0 && telefonNach.url === telefonUrl && /1 × Komplett-Ständer/.test(telefonNach.titel), telefonLinks + " " + telefonNach.titel);
    point("Konsole Korb Telefon", telefon.errors.length === 0, telefon.errors.join(" | "));
    await telefon.page.close();
    point("Konsole Detail", detail.errors.length === 0, detail.errors.join(" | "));
    const detailOverflow = await detail.page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    point("kein Quer-Scroll Detail", detailOverflow <= 1, String(detailOverflow));
    await detail.page.close();

    const beispiel = await open(1280, "/produkt/beispiel/");
    await beispiel.page.waitForSelector("#beispiel-thumbs button, #beispiel-bild");
    const thumbs = await beispiel.page.locator("#beispiel-thumbs button, #beispiel-thumbs img").count();
    point("Galerie Beispielseite", thumbs > 0 || await beispiel.page.locator("#beispiel-bild").count() === 1, String(thumbs));
    await beispiel.page.close();

    const miete = await open(1280, "/mieten/?gruppe=zaun&teil=gitter");
    await miete.page.waitForURL(/modus=miete/);
    const mieteUrl = new URL(miete.page.url());
    const mieteQuelle = await miete.page.evaluate(async () => (await fetch("/mieten/")).text());
    point("Alte Mieten-Adresse", mieteUrl.searchParams.get("modus") === "miete" && mieteUrl.searchParams.get("gruppe") === "zaun" && mieteUrl.searchParams.get("kat") === "gitter" && mieteQuelle.includes("bauzaun-konfig") && mieteQuelle.includes("location.replace"), mieteUrl.search);
    point("Konsole Mieten", miete.errors.length === 0, miete.errors.join(" | "));
    await miete.page.close();

    async function modusBild(page) {
      return page.evaluate(() => {
        function sichtbar(el) {
          return !!el && !el.hidden && !el.closest("[hidden]") && el.getBoundingClientRect().height > 0;
        }
        const schalter = [...document.querySelectorAll(".modus-schalter a")];
        const aktiv = schalter.find((el) => el.getAttribute("aria-current") === "true");
        const stil = aktiv ? getComputedStyle(aktiv) : null;
        const kacheln = [...document.querySelectorAll("#kauf-liste article.tile")].filter(sichtbar).map((el) => el.querySelector("h3").textContent.replace(/\s+/g, " ").trim());
        const produkte = [...document.querySelectorAll("#kauf-stapel article.kauf-produkt")].filter(sichtbar).map((el) => el.querySelector("h3").textContent.replace(/\s+/g, " ").trim());
        const versteckt = [...document.querySelectorAll(".kauf-ebene a")].filter((el) => el.hidden).map((el) => el.getAttribute("data-kat") || el.getAttribute("data-teil"));
        const sichtbarNav = [...document.querySelectorAll(".kauf-ebene a")].filter((el) => !el.hidden).map((el) => el.getAttribute("data-kat") || el.getAttribute("data-teil"));
        const adresse = new URL(location.href);
        return {
          n: schalter.length,
          texte: schalter.map((el) => el.textContent.trim()),
          hoehe: schalter.length ? Math.round(Math.min(...schalter.map((el) => el.getBoundingClientRect().height))) : 0,
          gruen: stil ? stil.backgroundColor : "",
          aktiv: aktiv ? aktiv.getAttribute("data-modus") : "",
          h1: document.querySelector("main h1").textContent.trim(),
          modus: adresse.searchParams.get("modus") || "",
          gruppe: adresse.searchParams.get("gruppe") || "",
          kat: adresse.searchParams.get("kat") || "",
          teil: adresse.searchParams.get("teil") || "",
          kacheln,
          produkte,
          versteckt,
          sichtbarNav,
          schilder: !!(document.getElementById("schilder-bereich") && !document.getElementById("schilder-bereich").hidden),
          quer: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          scrolls: [...document.querySelectorAll("body *")].filter((el) => {
            const value = getComputedStyle(el).overflowY;
            return (value === "auto" || value === "scroll") && el.scrollHeight > el.clientHeight + 2;
          }).map((el) => el.id || String(el.className).slice(0, 40))
        };
      });
    }
    for (const width of [1280, 1920, 390]) {
      const view = await open(width, "/kaufen/?gruppe=zaun&kat=bauzaune");
      const kauf = await modusBild(view.page);
      await view.page.locator(".modus-schalter a[data-modus='miete']").click();
      await view.page.waitForFunction(() => new URL(location.href).searchParams.get("modus") === "miete");
      const miet = await modusBild(view.page);
      await view.page.locator(".modus-schalter a[data-modus='kauf']").click();
      await view.page.waitForFunction(() => !new URL(location.href).searchParams.get("modus"));
      const zurueck = await modusBild(view.page);
      const ok = kauf.n === 2 && kauf.texte.join("|") === "Mieten|Kaufen" && kauf.hoehe >= 44 && kauf.aktiv === "kauf" && kauf.gruen === "rgb(118, 183, 41)" && kauf.h1 === "Kaufen" && kauf.modus === "" && kauf.kacheln.length === 22 && kauf.quer <= 1 && kauf.scrolls.length === 0
        && miet.aktiv === "miete" && miet.h1 === "Mieten" && miet.modus === "miete" && miet.gruppe === "zaun" && miet.kat === "bauzaune" && miet.kacheln.length === 1 && /3,5 × 2,0 m/.test(miet.kacheln[0]) && miet.versteckt.indexOf("schwellen") !== -1 && miet.versteckt.indexOf("schleuse") !== -1 && miet.versteckt.indexOf("buehne") !== -1 && miet.versteckt.indexOf("tore") !== -1 && miet.sichtbarNav.indexOf("bauzaune") !== -1 && miet.sichtbarNav.indexOf("gitter") !== -1 && miet.sichtbarNav.indexOf("zubehoer") !== -1 && miet.sichtbarNav.indexOf("sichtschutz") !== -1 && miet.quer <= 1 && miet.scrolls.length === 0
        && zurueck.modus === "" && zurueck.kacheln.length === 22 && zurueck.aktiv === "kauf";
      point(`Umschalter ${width}`, ok, JSON.stringify({ kauf: { n: kauf.n, hoehe: kauf.hoehe, aktiv: kauf.aktiv, gruen: kauf.gruen, kacheln: kauf.kacheln.length, quer: kauf.quer, scrolls: kauf.scrolls }, miet: { modus: miet.modus, kat: miet.kat, kacheln: miet.kacheln, versteckt: miet.versteckt, sichtbarNav: miet.sichtbarNav, quer: miet.quer, scrolls: miet.scrolls }, zurueck: zurueck.kacheln.length, fehler: view.errors }));
      point(`Konsole Umschalter ${width}`, view.errors.length === 0, view.errors.join(" | "));
      await view.page.close();
    }
    const schwelle = await open(1280, "/kaufen/?gruppe=zaun&kat=schwellen");
    await schwelle.page.locator(".modus-schalter a[data-modus='miete']").click();
    await schwelle.page.waitForFunction(() => new URL(location.href).searchParams.get("modus") === "miete");
    const nachSchwelle = await modusBild(schwelle.page);
    point("Wechsel von leerer Kategorie", nachSchwelle.kat !== "schwellen" && nachSchwelle.gruppe === "zaun" && (nachSchwelle.kacheln.length > 0 || nachSchwelle.produkte.length > 0), JSON.stringify({ kat: nachSchwelle.kat, kacheln: nachSchwelle.kacheln, produkte: nachSchwelle.produkte }));
    await schwelle.page.close();
    const verkehr = await open(1280, "/kaufen/?modus=miete&gruppe=verkehr&teil=baken");
    await verkehr.page.waitForFunction(() => new URL(location.href).searchParams.get("teil") === "schranken");
    const verkehrBild = await modusBild(verkehr.page);
    point("Miete Verkehr", verkehrBild.teil === "schranken" && verkehrBild.produkte.length === 2 && verkehrBild.produkte.every((name) => /Folie/.test(name)) && verkehrBild.versteckt.indexOf("baken") !== -1 && verkehrBild.versteckt.indexOf("gefahr") !== -1 && !verkehrBild.schilder, JSON.stringify({ teil: verkehrBild.teil, produkte: verkehrBild.produkte, versteckt: verkehrBild.versteckt, schilder: verkehrBild.schilder }));
    await verkehr.page.close();
    const anhaenger = await open(1280, "/kaufen/?modus=miete&gruppe=anhaenger");
    const anhaengerBild = await modusBild(anhaenger.page);
    const kuehl = await anhaenger.page.locator("#kauf-teil-kuehl article.kauf-produkt").count();
    point("Miete Anhänger", anhaengerBild.sichtbarNav.filter((id) => ["hochlader", "plane", "koffer", "transporter", "kuehl"].indexOf(id) !== -1).length === 5 && kuehl === 2, JSON.stringify({ nav: anhaengerBild.sichtbarNav, kuehl }));
    await anhaenger.page.close();
    const gitter = await open(390, "/kaufen/?modus=miete&gruppe=zaun&kat=gitter");
    const gitterBild = await modusBild(gitter.page);
    await gitter.page.locator(".kauf-leiste-wahl").click();
    const menu = await gitter.page.evaluate(() => [...document.querySelectorAll("#kauf-leiste-menu a")].map((el) => el.textContent.replace(/\s+/g, " ").trim()));
    point("Miete Handy filtert", gitterBild.produkte.length === 1 && /leicht/.test(gitterBild.produkte[0]) && menu.indexOf("Bodenleitschwellen") === -1 && menu.some((name) => /Absperrgitter/.test(name)) && gitterBild.quer <= 1, JSON.stringify({ produkte: gitterBild.produkte, menu, quer: gitterBild.quer }));
    await gitter.page.close();
    const gemerkt = await open(1280, "/kaufen/?gruppe=zaun&kat=bauzaune", { modus: "miete" });
    await gemerkt.page.waitForFunction(() => new URL(location.href).searchParams.get("modus") === "miete");
    const gemerktBild = await modusBild(gemerkt.page);
    point("Modus gemerkt", gemerktBild.modus === "miete" && gemerktBild.kacheln.length === 1 && gemerktBild.aktiv === "miete", JSON.stringify({ modus: gemerktBild.modus, n: gemerktBild.kacheln.length }));
    await gemerkt.page.close();

    const bauMiete = await open(1280, "/kaufen/?modus=miete&gruppe=zaun&kat=bauzaune");
    await bauMiete.page.locator("#schnell-felder-bauzaun-10075").locator("xpath=ancestor::article[1]").locator("[data-kreis]").check();
    await bauMiete.page.locator("#schnell-felder-bauzaun-10075").fill("3");
    await bauMiete.page.locator("#schnell-felder-bauzaun-10075").dispatchEvent("input");
    const bauKorb = await bauMiete.page.evaluate(() => JSON.parse(localStorage.getItem("amk-wunsch") || "[]").map((item) => item.id + ":" + item.qty + ":" + (item.note || "")));
    const bauBox = await bauMiete.page.locator("#kauf-verkehr-summe").innerText();
    const bauHinweis = await bauMiete.page.locator("#kauf-miete-bauzaun").innerText();
    const bauFest = await bauMiete.page.evaluate(() => {
      const block = document.getElementById("kauf-verkehr-summe");
      const posten = [...block.querySelectorAll(".beispiel-post--fest")];
      return {
        n: posten.length,
        texte: posten.map((el) => el.innerText.replace(/\s+/g, " ").trim()),
        eingabe: posten.some((el) => el.querySelector("input, button"))
      };
    });
    point("Bauzaun mieten", bauKorb.indexOf("miete:bauzaun-10075:3:") !== -1 && bauKorb.indexOf("miete:bauzaun-10075:auto:zubehoer-10002-1:3:automatisch") !== -1 && bauKorb.indexOf("miete:bauzaun-10075:auto:fuss-10006:4:automatisch") !== -1 && bauKorb.every((id) => id.indexOf(":im:") === -1) && !/Komplett-Ständer/.test(bauBox) && /Verbindungsschellen/.test(bauHinweis) && /Automatisch dazu/.test(bauBox) && bauFest.n === 2 && !bauFest.eingabe, bauKorb.join(", ") + " | " + bauBox.replace(/\s+/g, " ") + " | " + JSON.stringify(bauFest));
    await bauMiete.page.locator("#schnell-felder-bauzaun-10075").fill("5");
    await bauMiete.page.locator("#schnell-felder-bauzaun-10075").dispatchEvent("input");
    const fuenf = await bauMiete.page.evaluate(() => JSON.parse(localStorage.getItem("amk-wunsch") || "[]").map((item) => item.id + ":" + item.qty));
    await bauMiete.page.locator("#schnell-felder-bauzaun-10075").fill("3");
    await bauMiete.page.locator("#schnell-felder-bauzaun-10075").dispatchEvent("input");
    const drei = await bauMiete.page.evaluate(() => JSON.parse(localStorage.getItem("amk-wunsch") || "[]").map((item) => item.id + ":" + item.qty));
    await bauMiete.page.locator("#schnell-felder-bauzaun-10075").fill("0");
    await bauMiete.page.locator("#schnell-felder-bauzaun-10075").dispatchEvent("input");
    const nullWeg = await bauMiete.page.evaluate(() => JSON.parse(localStorage.getItem("amk-wunsch") || "[]").map((item) => item.id));
    point("Miete passt Schelle und Fuß an", fuenf.indexOf("miete:bauzaun-10075:auto:zubehoer-10002-1:5") !== -1 && fuenf.indexOf("miete:bauzaun-10075:auto:fuss-10006:6") !== -1 && drei.indexOf("miete:bauzaun-10075:auto:zubehoer-10002-1:3") !== -1 && drei.indexOf("miete:bauzaun-10075:auto:fuss-10006:4") !== -1 && nullWeg.every((id) => id.indexOf("miete:bauzaun-10075") !== 0), JSON.stringify({ fuenf, drei, nullWeg }));
    const bauQuer = await bauMiete.page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    point("Konsole Bauzaun mieten", bauMiete.errors.length === 0 && bauQuer <= 1, bauMiete.errors.join(" | ") + " quer " + bauQuer);
    await bauMiete.page.close();
    const bauHandy = await open(390, "/kaufen/?modus=miete&gruppe=zaun&kat=bauzaune");
    await bauHandy.page.locator("#schnell-felder-bauzaun-10075").locator("xpath=ancestor::article[1]").locator("[data-kreis]").check();
    await bauHandy.page.locator("#schnell-felder-bauzaun-10075").fill("5");
    await bauHandy.page.locator("#schnell-felder-bauzaun-10075").dispatchEvent("input");
    await bauHandy.page.locator("#kauf-verkehr-summe [data-sum='kurz']").click();
    const handyBild = await bauHandy.page.evaluate(() => ({
      quer: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      text: document.getElementById("kauf-verkehr-summe").innerText.replace(/\s+/g, " "),
      korb: JSON.parse(localStorage.getItem("amk-wunsch") || "[]").map((item) => item.id + ":" + item.qty)
    }));
    point("Miete Handy", handyBild.quer <= 1 && /Automatisch dazu/.test(handyBild.text) && /Kunststofffuß/.test(handyBild.text) && handyBild.korb.indexOf("miete:bauzaun-10075:auto:fuss-10006:6") !== -1 && bauHandy.errors.length === 0, JSON.stringify(handyBild) + " " + bauHandy.errors.join(" | "));
    await bauHandy.page.close();

    const kreisSeiten = [
      ["/kaufen/?gruppe=zaun&kat=bauzaune", "Kauf Bauzaun"],
      ["/kaufen/?gruppe=zaun&kat=zubehoer", "Kauf Zubehör"],
      ["/kaufen/?gruppe=zaun&kat=sichtschutz", "Kauf Sichtschutz"],
      ["/kaufen/?gruppe=zaun&kat=tore", "Kauf Tore"],
      ["/kaufen/?modus=miete&gruppe=zaun&kat=zubehoer", "Miete Zubehör"],
      ["/kaufen/?modus=miete&gruppe=zaun&kat=sichtschutz", "Miete Sichtschutz"]
    ];
    for (const [url, name] of kreisSeiten) {
      const seite = await open(1280, url);
      const bild = await seite.page.evaluate(() => {
        const kacheln = [...document.querySelectorAll("#kauf-liste article.tile")].filter((el) => !el.hidden && !el.closest("[hidden]") && el.getBoundingClientRect().height > 0);
        const ohne = kacheln.filter((el) => {
          const kreis = el.querySelector(".beispiel-kreis");
          const plus = el.querySelector(".beispiel-step button[data-step='1']");
          const minus = el.querySelector(".beispiel-step button[data-step='-1']");
          return !(kreis && plus && minus && getComputedStyle(kreis).borderRadius !== "0px");
        }).map((el) => (el.querySelector("h3") || {}).textContent || "");
        return { n: kacheln.length, ohne };
      });
      point("Kreis " + name, bild.n > 0 && bild.ohne.length === 0, JSON.stringify(bild));
      await seite.page.close();
    }

    const plane = await open(1280, "/kaufen/?modus=miete&gruppe=zaun&kat=sichtschutz");
    await plane.page.evaluate(() => localStorage.removeItem("amk-wunsch"));
    await plane.page.reload({ waitUntil: "networkidle" });
    await plane.page.locator("#kauf-liste article.tile:has(#schnell-menge-plane-10012) [data-kreis]").check();
    await plane.page.locator("#schnell-menge-plane-10012").fill("2");
    await plane.page.locator("#schnell-menge-plane-10012").dispatchEvent("input");
    const planeKorb = await plane.page.evaluate(() => JSON.parse(localStorage.getItem("amk-wunsch") || "[]").map((item) => item.id + ":" + item.qty));
    const planeKreis = await plane.page.locator("#kauf-liste article.tile:not([hidden]) [data-kreis='kachel']").first().isChecked();
    point("Plane bleibt frei", planeKorb.length === 1 && planeKorb[0] === "miete:plane-10012:2" && planeKreis, planeKorb.join(", "));
    await plane.page.close();

    const anhMiete = await open(1280, "/kaufen/?modus=miete&gruppe=anhaenger&teil=hochlader");
    const anhFeld = await anhMiete.page.locator("#kauf-teil-hochlader [data-menge]").count();
    await anhMiete.page.locator("#kauf-teil-hochlader input[name='typ']").check();
    const anhKorb = await anhMiete.page.evaluate(() => JSON.parse(localStorage.getItem("amk-wunsch") || "[]").filter((item) => item.id === "miete:hochlader"));
    point("Anhänger mieten", anhFeld === 0 && anhKorb.length === 1 && anhKorb[0].sammel === true && anhKorb[0].qty === 1, JSON.stringify(anhKorb));
    await anhMiete.page.close();

    const gitterMiete = await open(1280, "/kaufen/?modus=miete&gruppe=zaun&kat=gitter");
    await gitterMiete.page.locator("#kauf-teil-gitter article.kauf-produkt input[name='typ']").first().check();
    await gitterMiete.page.locator("#kauf-teil-gitter [data-menge]").fill("2");
    await gitterMiete.page.locator("#kauf-teil-gitter [data-menge]").dispatchEvent("input");
    const gitterKorb = await gitterMiete.page.evaluate(() => JSON.parse(localStorage.getItem("amk-wunsch") || "[]").map((item) => item.id + ":" + item.qty));
    point("Gitter mieten", gitterKorb.indexOf("miete:absperrung-10026:2") !== -1, gitterKorb.join(", "));
    await gitterMiete.page.close();

    const genehmigung = await open(1280, "/kaufen/?modus=miete&gruppe=verkehr&teil=schranken");
    await genehmigung.page.locator("#kauf-genehmigung").check();
    const genehmigungKorb = await genehmigung.page.evaluate(() => JSON.parse(localStorage.getItem("amk-wunsch") || "[]").some((item) => item.id === "miete:genehmigung" && item.name === "Anordnung durch AMK beantragen lassen"));
    const genehmigungKauf = await open(1280, "/kaufen/?gruppe=verkehr&teil=schranken");
    const genehmigungWeg = await genehmigungKauf.page.locator("#kauf-genehmigung-zeile").isHidden();
    point("Genehmigung nur bei Miete", genehmigungKorb && genehmigungWeg, String(genehmigungKorb));
    await genehmigung.page.close();
    await genehmigungKauf.page.close();

    const detailMiete = await open(1280, "/produkt/bauzaun-10075/?modus=miete");
    await detailMiete.page.waitForSelector("#menge-felder");
    const staenderKarte = await detailMiete.page.locator("#menge-staender").count();
    await detailMiete.page.locator("#menge-felder").fill("2");
    await detailMiete.page.locator("#menge-felder").dispatchEvent("input");
    const detailKorb = await detailMiete.page.evaluate(() => JSON.parse(localStorage.getItem("amk-wunsch") || "[]").map((item) => item.id + ":" + item.qty));
    const detailAuto = await detailMiete.page.evaluate(() => {
      const block = document.getElementById("block-auto");
      const fest = block ? [...block.querySelectorAll(".beispiel-post--fest")] : [];
      return {
        da: !!block,
        texte: fest.map((el) => el.innerText.replace(/\s+/g, " ").trim()),
        eingabe: fest.some((el) => el.querySelector("input, button"))
      };
    });
    point("Detail mieten", staenderKarte === 1 && detailKorb.indexOf("miete:bauzaun-10075:2") !== -1 && detailKorb.indexOf("miete:bauzaun-10075:auto:zubehoer-10002-1:2") !== -1 && detailKorb.indexOf("miete:bauzaun-10075:auto:fuss-10006:3") !== -1 && detailKorb.every((id) => id.indexOf(":im:") === -1) && detailAuto.da && !detailAuto.eingabe && detailAuto.texte.length === 2, detailKorb.join(", ") + " | " + JSON.stringify(detailAuto));
    point("Konsole Detail mieten", detailMiete.errors.length === 0, detailMiete.errors.join(" | "));
    await detailMiete.page.close();

    const detailAnh = await open(390, "/produkt/hochlader/?modus=miete");
    await detailAnh.page.waitForSelector("#miete-anhaenger");
    const detailFeld = await detailAnh.page.locator("#menge-einfach").count();
    await detailAnh.page.locator("#miete-anhaenger").check();
    const detailAnhKorb = await detailAnh.page.evaluate(() => JSON.parse(localStorage.getItem("amk-wunsch") || "[]").filter((item) => item.id === "miete:hochlader"));
    const detailQuer = await detailAnh.page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    point("Anhänger-Detail mieten", detailFeld === 0 && detailAnhKorb.length === 1 && detailAnhKorb[0].sammel === true && detailQuer <= 1, JSON.stringify({ korb: detailAnhKorb, quer: detailQuer, fehler: detailAnh.errors }));
    await detailAnh.page.close();

    const korbModus = await open(1280, "/anfrage/");
    await korbModus.page.evaluate(() => {
      localStorage.setItem("amk-wunsch", JSON.stringify([
        { id: "miete:bauzaun-10075", name: "Bauzaun Profi 3,5 × 2,0 m", qty: 2, kat: "bauzaun" },
        { id: "kauf:fuss-10006", name: "Kunststofffuß schwer 23 kg", qty: 1, kat: "bauzaun" },
        { id: "miete:schild:z123", name: "Gefahrstelle", qty: 1, kat: "verkehrssicherung" }
      ]));
    });
    await korbModus.page.reload({ waitUntil: "networkidle" });
    const korbModusLinks = await korbModus.page.evaluate(() => [...document.querySelectorAll("a.cart-link")].map((el) => el.getAttribute("href")));
    const korbText = await korbModus.page.locator("body").innerText();
    point("Korb trennt Modus", korbModusLinks.some((href) => href.endsWith("/produkt/bauzaun-10075/?modus=miete")) && korbModusLinks.some((href) => href.endsWith("/produkt/fuss-10006/")) && korbModusLinks.some((href) => href.indexOf("/mieten/?gruppe=schilder") !== -1) && /Miete/.test(korbText) && /Kauf/.test(korbText), korbModusLinks.join(" | "));
    await korbModus.page.close();

    const autoKorb = await open(390, "/anfrage/");
    await autoKorb.page.evaluate(() => {
      localStorage.setItem("amk-wunsch", JSON.stringify([
        { id: "miete:bauzaun-10075", name: "Bauzaun Profi 3,5 × 2,0 m", qty: 5, kat: "bauzaun", bild: "images/kk/bauzaun-10075.webp" },
        { id: "miete:bauzaun-10075:auto:zubehoer-10002-1", name: "Verbindungsschelle 2,5 mm", qty: 5, kat: "bauzaun", note: "automatisch", herkunft: "auto", bild: "images/kk/zubehoer-10002.webp" },
        { id: "miete:bauzaun-10075:auto:fuss-10006", name: "Kunststofffuß schwer 23 kg", qty: 6, kat: "bauzaun", note: "automatisch", herkunft: "auto", bild: "images/kk/fuss-10006.webp" },
        { id: "miete:plane-10012", name: "Sichtschutzplane", qty: 2, kat: "bauzaun", bild: "images/kk/plane-10012.webp" }
      ]));
    });
    await autoKorb.page.reload({ waitUntil: "networkidle" });
    const autoAnsicht = await autoKorb.page.evaluate(() => {
      const zeilen = [...document.querySelectorAll("#anfrage-liste .cart-row")];
      const zaun = zeilen.find((el) => /Bauzaun Profi/.test(el.innerText));
      const teile = zaun ? [...zaun.querySelectorAll("[data-auto]")].map((el) => el.innerText.replace(/\s+/g, " ").trim()) : [];
      return {
        zeilen: zeilen.length,
        teile,
        schelleWeg: !!(zaun && zaun.querySelector("[data-auto='schelle'] button")),
        fussFeld: !!(zaun && zaun.querySelector("[data-auto='fuss'] input")),
        plane: zeilen.some((el) => /Sichtschutzplane/.test(el.innerText) && el.querySelector("input")),
        quer: document.documentElement.scrollWidth - document.documentElement.clientWidth
      };
    });
    await autoKorb.page.locator("input[aria-label='Menge Bauzaun Profi 3,5 × 2,0 m']").fill("3");
    await autoKorb.page.locator("input[aria-label='Menge Bauzaun Profi 3,5 × 2,0 m']").dispatchEvent("change");
    const autoNach = await autoKorb.page.evaluate(() => JSON.parse(localStorage.getItem("amk-wunsch") || "[]").map((item) => item.id + ":" + item.qty));
    await autoKorb.page.locator("button[data-index]", { hasText: "Entfernen" }).first().click();
    const autoWeg = await autoKorb.page.evaluate(() => JSON.parse(localStorage.getItem("amk-wunsch") || "[]").map((item) => item.id));
    point("Korb Automatik", autoAnsicht.zeilen === 2 && autoAnsicht.teile.length === 2 && /5×/.test(autoAnsicht.teile[0]) && /6×/.test(autoAnsicht.teile[1]) && !autoAnsicht.schelleWeg && !autoAnsicht.fussFeld && autoAnsicht.plane && autoAnsicht.quer <= 1 && autoNach.indexOf("miete:bauzaun-10075:3") !== -1 && autoNach.indexOf("miete:bauzaun-10075:auto:zubehoer-10002-1:3") !== -1 && autoNach.indexOf("miete:bauzaun-10075:auto:fuss-10006:4") !== -1 && autoNach.indexOf("miete:plane-10012:2") !== -1 && autoWeg.indexOf("miete:bauzaun-10075") === -1 && autoWeg.indexOf("miete:bauzaun-10075:auto:fuss-10006") === -1 && autoWeg.indexOf("miete:plane-10012") !== -1, JSON.stringify({ autoAnsicht, autoNach, autoWeg, fehler: autoKorb.errors }));
    point("Konsole Korb Automatik", autoKorb.errors.length === 0, autoKorb.errors.join(" | "));
    await autoKorb.page.close();

    const sprungAlt = await open(1280, "/mieten/bauzaun/");
    await sprungAlt.page.waitForURL(/modus=miete/);
    const sprungUrl = new URL(sprungAlt.page.url());
    point("Bauzaun-Adresse", sprungUrl.pathname.endsWith("/kaufen/") && sprungUrl.searchParams.get("kat") === "bauzaune" && sprungUrl.searchParams.get("modus") === "miete", sprungUrl.pathname + sprungUrl.search);
    await sprungAlt.page.close();

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
