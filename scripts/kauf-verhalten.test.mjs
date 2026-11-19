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
          const bar = document.getElementById("kauf-schrift");
          const band = bar.getBoundingClientRect().bottom;
          return {
            top: Math.round(top),
            header: Math.round(header),
            band: Math.round(band),
            unter: !bar.classList.contains("is-weg") && top >= band - 2 && top < band + 40
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
      const zr = ziel.getBoundingClientRect();
      const adresse = new URL(location.href);
      const knopf = leiste.querySelector(".kauf-leiste-wahl");
      const gruppen = [...leiste.querySelectorAll(".kauf-leiste-gruppe")];
      const breiten = gruppen.map((el) => Math.round(el.getBoundingClientRect().width));
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
        pills: leiste.querySelectorAll(".kauf-leiste-row, .kauf-leiste-link").length,
        gleich: breiten.length === 3 && Math.max(...breiten) - Math.min(...breiten) <= 1,
        hoehe: Math.round(band.height),
        imBild: band.right <= window.innerWidth + 1 && band.left >= -1,
        schriftWeg: schrift && getComputedStyle(schrift).display === "none"
      };
    });
    point("Tap springt zur Überschrift", tapped.panelZu && tapped.gruppe === "anhaenger" && tapped.teil === "hochlader" && tapped.leiste && /Hochlader/.test(tapped.marke) && tapped.marke.indexOf("▾") !== -1 && tapped.kopfFrei && tapped.bilder === 0 && tapped.pills === 0 && tapped.gleich && tapped.hoehe <= 100 && tapped.imBild && tapped.schriftWeg, JSON.stringify(tapped));
    await phone.page.close();

    async function handyNav(width) {
      const view = await open(width, "/kaufen/?gruppe=zaun&kat=gitter");
      const ruhe = await view.page.evaluate(() => {
        const leiste = document.getElementById("kauf-leiste");
        const gruppen = [...leiste.querySelectorAll(".kauf-leiste-gruppe")];
        const breiten = gruppen.map((el) => Math.round(el.getBoundingClientRect().width));
        const aktiv = gruppen.find((el) => el.getAttribute("aria-current") === "true");
        const ober = getComputedStyle(document.querySelector("#kauf-gruppen a strong"));
        const stil = aktiv ? getComputedStyle(aktiv) : null;
        const knopf = leiste.querySelector(".kauf-leiste-wahl");
        const menu = document.getElementById("kauf-leiste-menu");
        const scrolls = [...document.querySelectorAll("body *")].filter((el) => {
          const value = getComputedStyle(el).overflowY;
          return (value === "auto" || value === "scroll") && el.scrollHeight > el.clientHeight + 2;
        }).map((el) => el.id || String(el.className).slice(0, 40));
        return {
          n: gruppen.length,
          gleich: breiten.length === 3 && Math.max(...breiten) - Math.min(...breiten) <= 1,
          gruen: stil ? stil.backgroundColor : "",
          schrift: !!(stil && stil.fontFamily === ober.fontFamily && stil.fontWeight === ober.fontWeight && stil.letterSpacing !== "normal"),
          schriftWerte: stil ? { familie: stil.fontFamily === ober.fontFamily, gewicht: stil.fontWeight + "/" + ober.fontWeight, abstand: stil.letterSpacing } : null,
          label: knopf ? knopf.textContent.replace(/\s+/g, " ").trim() : "",
          menuZu: !!(menu && menu.hidden),
          hoehe: Math.round(leiste.getBoundingClientRect().height),
          bilder: leiste.querySelectorAll("img").length,
          kacheln: document.querySelectorAll("#kauf-gruppen img").length,
          kachelFest: ["sticky", "fixed"].indexOf(getComputedStyle(document.getElementById("kauf-gruppen")).position) === -1,
          pills: leiste.querySelectorAll(".kauf-leiste-row").length,
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
        const kopf = document.querySelector(".top").getBoundingClientRect().bottom;
        const band = leiste.getBoundingClientRect();
        return {
          label: document.querySelector(".kauf-leiste-name").textContent.replace(/\s+/g, " ").trim(),
          haengt: Math.abs(band.top - kopf) <= 4,
          quer: document.documentElement.scrollWidth - document.documentElement.clientWidth
        };
      });
      const ok = ruhe.n === 3 && ruhe.gleich && ruhe.gruen === "rgb(118, 183, 41)" && ruhe.schrift && /Absperrgitter/.test(ruhe.label) && ruhe.label.indexOf("▾") !== -1 && ruhe.menuZu && ruhe.hoehe <= 100 && ruhe.bilder === 0 && ruhe.kacheln === 3 && ruhe.kachelFest && ruhe.pills === 0 && ruhe.quer <= 1 && ruhe.scrolls.length === 0 && ruhe.unten && ruhe.schriftWeg && offen.auf && offen.n === offen.ebenen && offen.n >= 6 && offen.tast && offen.deckend && offen.ebeneZu && esc && aussen && sprung.kat === "schleuse" && sprung.zu && sprung.frei && /Schleusen/.test(sprung.label) && /Bühnen/.test(scroll.label) && scroll.haengt && scroll.quer <= 1;
      point(`Handy-Leiste ${width}`, ok, JSON.stringify({ ruhe, offen, esc, aussen, sprung, scroll, fehler: view.errors }));
      point(`Konsole Handy ${width}`, view.errors.length === 0, view.errors.join(" | "));
      await view.page.close();
    }
    await handyNav(390);
    await handyNav(360);

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

    const sprung = await open(1280, "/kaufen/");
    await sprung.page.evaluate(() => sessionStorage.removeItem("amk-kauf-unter"));
    const ruhe = await sprung.page.evaluate(() => {
      const bar = document.getElementById("kauf-schrift");
      const tiles = document.getElementById("kauf-gruppen").getBoundingClientRect();
      return { weg: bar.classList.contains("is-weg"), kacheln: tiles.bottom > 80, bilder: bar.querySelectorAll("img").length };
    });
    await sprung.page.evaluate(() => window.scrollTo(0, 1400));
    await sprung.page.waitForTimeout(40);
    const band = await sprung.page.evaluate(() => {
      const bar = document.getElementById("kauf-schrift");
      const link = bar.querySelector("a[aria-current='true']");
      const schrift = link ? link.querySelector("strong") : null;
      const ober = document.querySelector("#kauf-gruppen a[data-gruppe='zaun']");
      const kopf = ober ? ober.querySelector("strong") : null;
      const ss = schrift ? getComputedStyle(schrift) : null;
      const os = kopf ? getComputedStyle(kopf) : null;
      const sl = link ? getComputedStyle(link) : null;
      const ol = ober ? getComputedStyle(ober) : null;
      const gleich = !!(ss && os && sl && ol && ss.fontFamily === os.fontFamily && ss.fontSize === os.fontSize && ss.fontWeight === os.fontWeight && ss.letterSpacing === os.letterSpacing && ss.color === os.color && sl.borderTopWidth === ol.borderTopWidth && sl.borderRadius === ol.borderRadius && sl.boxShadow === ol.boxShadow && Math.abs(link.getBoundingClientRect().width - ober.getBoundingClientRect().width) < 2);
      return {
        weg: bar.classList.contains("is-weg"),
        n: bar.querySelectorAll("a").length,
        bilder: bar.querySelectorAll("img").length,
        gruen: ss ? ss.backgroundColor : "",
        text: link ? link.textContent.replace(/\s+/g, " ").trim() : "",
        leiste: getComputedStyle(document.getElementById("kauf-leiste")).display,
        gleich
      };
    });
    point("Schriftzug-Leiste", ruhe.weg && ruhe.kacheln && ruhe.bilder === 0 && !band.weg && band.n === 3 && band.bilder === 0 && band.gruen === "rgb(118, 183, 41)" && band.gleich && /Bauzaun/.test(band.text) && band.leiste === "none", JSON.stringify({ ruhe, band }));
    const schriftKarte = sprung.page.locator("#kauf-schrift a[data-gruppe='verkehr']");
    const schriftBox = await schriftKarte.boundingBox();
    await sprung.page.mouse.move(schriftBox.x + schriftBox.width / 2, schriftBox.y + schriftBox.height / 2);
    await sprung.page.waitForTimeout(80);
    const schriftPanel = await sprung.page.evaluate(() => {
      const nav = document.getElementById("kauf-ebene-verkehr");
      const bar = document.getElementById("kauf-schrift").getBoundingClientRect();
      const nr = nav.getBoundingClientRect();
      return { open: !nav.hidden, n: nav.querySelectorAll("a").length, unter: Math.abs(nr.top - bar.bottom) <= 2, bg: getComputedStyle(nav).backgroundColor };
    });
    point("Schriftzug-Panel", schriftPanel.open && schriftPanel.n === 6 && schriftPanel.unter && schriftPanel.bg === "rgb(255, 255, 255)", JSON.stringify(schriftPanel));
    await sprung.page.locator("#kauf-ebene-verkehr a[data-teil='einrichtung']").click();
    await sprung.page.waitForTimeout(900);
    const lage = await sprung.page.evaluate(() => {
      const ziel = document.getElementById("kauf-teil-einrichtung");
      const bar = document.getElementById("kauf-schrift").getBoundingClientRect();
      const zr = ziel.getBoundingClientRect();
      const nav = document.getElementById("kauf-ebene-verkehr");
      return {
        teil: new URL(location.href).searchParams.get("teil"),
        frei: zr.top >= bar.bottom - 8,
        panelZu: nav.hidden
      };
    });
    point("Klick springt zur Überschrift", lage.teil === "einrichtung" && lage.frei && lage.panelZu, JSON.stringify(lage));
    await sprung.page.goBack();
    await sprung.page.waitForTimeout(200);
    const zurueck = new URL(sprung.page.url());
    point("Zurück", zurueck.searchParams.get("gruppe") === "zaun" && !zurueck.searchParams.get("teil"), sprung.page.url());
    await sprung.page.evaluate(() => window.scrollTo(0, 0));
    await sprung.page.waitForTimeout(40);
    const wieder = await sprung.page.evaluate(() => document.getElementById("kauf-schrift").classList.contains("is-weg"));
    point("Leiste verschwindet", wieder, "");
    await sprung.page.evaluate(() => window.scrollTo(0, 1400));
    await sprung.page.waitForTimeout(40);
    await sprung.page.locator("#kauf-schrift a[data-gruppe='zaun']").click();
    await sprung.page.waitForTimeout(40);
    const wieKachel = new URL(sprung.page.url());
    point("Schriftzug wie Oberkachel", wieKachel.searchParams.get("gruppe") === "zaun" && wieKachel.searchParams.get("kat") === "bauzaune", wieKachel.search);
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
      const step = card.querySelector(".beispiel-step");
      const sichtbar = [...document.querySelectorAll("article.kauf-produkt, #kauf-liste .kauf-schnell")].filter((el) => {
        return !el.hidden && !el.closest("[hidden]") && el.getBoundingClientRect().height > 0;
      });
      return {
        checked: card.querySelector('input[type="checkbox"]').checked,
        menge: !!(step && getComputedStyle(step).display !== "none" && field && field.value === "1"),
        max: field.getAttribute("max"),
        kreis: getComputedStyle(card.querySelector(".beispiel-kreis")).borderRadius,
        plus: sichtbar.length > 0 && sichtbar.every((el) => {
          const steuer = el.querySelector(".beispiel-step");
          return steuer && getComputedStyle(steuer).display !== "none";
        })
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

    const miete = await open(1280, "/mieten/");
    const mieteInfo = await miete.page.evaluate(() => ({
      kachel: document.querySelectorAll(".kauf-produkt").length,
      zeile: document.querySelectorAll(".pick, .chip").length,
      spalten: document.querySelector(".konfig-layout") ? getComputedStyle(document.querySelector(".konfig-layout")).gridTemplateColumns : ""
    }));
    point("Mieten unverändert", mieteInfo.kachel === 0 && mieteInfo.zeile > 0 && /320px/.test(mieteInfo.spalten), JSON.stringify(mieteInfo));
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
