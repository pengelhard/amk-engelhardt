(function () {
  /* Navigation und Liste: Oberkacheln, Schriftzug-Leiste, Hover-Panel, Adresse. */
  var board = document.querySelector(".kauf-board");
  var liste = document.getElementById("kauf-liste");
  var empty = document.getElementById("kauf-empty");
  if (!board || !liste) return;

  var GRUPPEN = {};
  (window.AMK_GRUPPEN ? window.AMK_GRUPPEN.list : [
    { id: "zaun", shops: ["bauzaune", "zubehoer", "tore", "sichtschutz", "gitter"] },
    { id: "verkehr", shops: ["schilder", "verkehr"] },
    { id: "anhaenger", shops: ["anhaenger"] }
  ]).forEach(function (gruppe) { GRUPPEN[gruppe.id] = gruppe.shops.slice(); });
  var KAT_GRUPPE = {};
  Object.keys(GRUPPEN).forEach(function (gruppe) {
    GRUPPEN[gruppe].forEach(function (kat) { KAT_GRUPPE[kat] = gruppe; });
  });
  function canonGruppe(id) {
    if (window.AMK_GRUPPEN && typeof window.AMK_GRUPPEN.canon === "function") return window.AMK_GRUPPEN.canon(id);
    if (id === "schilder" || id === "absperrung") return "verkehr";
    return id || "";
  }
  var MERK = "amk-kauf-unter";
  function merkeUnter(id, value) {
    if (!id || !value) return;
    var all = {};
    try { all = JSON.parse(sessionStorage.getItem(MERK) || "{}"); } catch (error) { all = {}; }
    all[id] = value;
    try { sessionStorage.setItem(MERK, JSON.stringify(all)); } catch (error) { /* Speicher kann gesperrt sein */ }
  }
  function unterVon(link) {
    return { kat: link.getAttribute("data-kat") || "", teil: link.getAttribute("data-teil") || "" };
  }
  function ersteUnter(id) {
    var link = document.querySelector('.kauf-ebene[data-fuer="' + id + '"] a');
    return link ? unterVon(link) : { kat: "", teil: "" };
  }
  function gemerkteUnter(id) {
    var saved = "";
    try { saved = (JSON.parse(sessionStorage.getItem(MERK) || "{}"))[id] || ""; } catch (error) { saved = ""; }
    if (saved) {
      var links = document.querySelectorAll('.kauf-ebene[data-fuer="' + id + '"] a');
      var i;
      for (i = 0; i < links.length; i++) {
        if (links[i].getAttribute("data-kat") === saved || links[i].getAttribute("data-teil") === saved) return unterVon(links[i]);
      }
    }
    return ersteUnter(id);
  }
  var EBENE = { schwellen: 1, schleuse: 1, buehne: 1 };
  var ZAUN_STAPEL = { gitter: 1, schwellen: 1, schleuse: 1, buehne: 1 };
  var HASH = {
    bauzaun: { gruppe: "zaun", kat: "bauzaune" },
    verkehrssicherung: { gruppe: "verkehr", kat: "" },
    anhaenger: { gruppe: "anhaenger", kat: "" }
  };

  var vorlage = document.getElementById("kauf-vorlage");
  var nodes = Array.prototype.slice.call((vorlage ? vorlage.content : document).querySelectorAll(vorlage ? "article.tile" : "section.copy article.tile"));
  var items = nodes.map(function (el, index) {
    var order = el.querySelector("form[data-order]");
    return {
      el: el,
      index: index,
      slug: order ? order.getAttribute("data-slug") || "" : "",
      name: order ? order.getAttribute("data-name") || "" : "",
      code: "",
      shop: "",
      attr: {}
    };
  });
  var bySlug = {};
  items.forEach(function (item) { if (item.slug) bySlug[item.slug] = item; });
  nodes.forEach(function (el) {
    var form = el.querySelector("form.order");
    if (form) form.remove();
  });

  var state = { gruppe: "", kat: "" };
  var schilder = document.getElementById("schilder-bereich");
  var wahl = document.getElementById("kauf-wahl");
  var spalte = document.getElementById("kauf-spalte");
  var verkehrSumme = document.getElementById("kauf-verkehr-summe");

  function readUrl() {
    var params = new URLSearchParams(location.search);
    var gruppe = canonGruppe(params.get("gruppe") || "");
    if (!GRUPPEN[gruppe]) gruppe = "";
    var kat = params.get("kat") || "";
    var teil = params.get("teil") || "";
    if (kat === "verkehr") kat = "";
    if (kat === "leit") {
      kat = EBENE[teil] ? teil : "schwellen";
      teil = "";
      if (!gruppe) gruppe = "zaun";
    }
    if (gruppe === "verkehr" && EBENE[teil]) {
      gruppe = "zaun";
      kat = teil;
      teil = "";
    }
    if (EBENE[kat]) {
      if (!gruppe) gruppe = "zaun";
      if (gruppe !== "zaun") kat = "";
    } else if (!KAT_GRUPPE[kat]) kat = "";
    if (!gruppe && location.hash && HASH[location.hash.slice(1)]) {
      var mapped = HASH[location.hash.slice(1)];
      gruppe = mapped.gruppe;
      if (!kat) kat = mapped.kat;
    }
    if (kat && !gruppe) gruppe = EBENE[kat] ? "zaun" : (KAT_GRUPPE[kat] || "");
    if (gruppe && kat && !EBENE[kat] && GRUPPEN[gruppe].indexOf(kat) === -1) kat = "";
    if (!gruppe) gruppe = "zaun";
    var signs = window.AMK_SCHILDER_TEILE || [];
    var zeichen = "";
    if (gruppe === "verkehr" && signs.indexOf(teil) !== -1) {
      zeichen = teil;
      if (window.AMK_SCHILDER_UI && window.AMK_SCHILDER_UI.open) window.AMK_SCHILDER_UI.open(teil);
      teil = "";
    }
    state = {
      gruppe: gruppe,
      kat: kat,
      teil: teil,
      zeichen: zeichen
    };
    if (state.gruppe === "verkehr" && !state.zeichen && !state.teil) state.teil = "schranken";
    if (state.gruppe === "anhaenger" && !state.teil) state.teil = "hochlader";
    if (state.gruppe === "zaun" && state.kat) merkeUnter("zaun", state.kat);
    if (state.gruppe === "verkehr" && (state.zeichen || state.teil)) merkeUnter("verkehr", state.zeichen || state.teil);
    if (state.gruppe === "anhaenger" && state.teil) merkeUnter("anhaenger", state.teil);
  }

  function teilList() {
    var map = window.AMK_AUSWAHL && window.AMK_AUSWAHL.teile;
    if (state.gruppe === "verkehr") return (map && map.absperrung) || [];
    if (state.gruppe === "zaun" && (state.kat === "gitter" || EBENE[state.kat])) return [];
    return (map && map[state.gruppe]) || [];
  }

  function writeUrl(mode) {
    var params = new URLSearchParams();
    if (state.gruppe) params.set("gruppe", state.gruppe);
    if (state.kat) params.set("kat", state.kat);
    if (state.gruppe === "verkehr" && state.zeichen) params.set("teil", state.zeichen);
    else if (state.teil && teilList().indexOf(state.teil) !== -1) params.set("teil", state.teil);
    var qs = params.toString();
    var url = location.pathname + (qs ? "?" + qs : "");
    if (mode === "push") history.pushState({ kauf: 1 }, "", url);
    else history.replaceState({ kauf: 1 }, "", url);
  }

  function inGruppe(item) {
    if (!state.gruppe) return false;
    if (item.shop === "gitter" || item.shop === "verkehr" || item.shop === "anhaenger") return false;
    if (item.slug === "verkehrsschilder") return false;
    var shops = GRUPPEN[state.gruppe] || [];
    if (shops.indexOf(item.shop) === -1) return false;
    return true;
  }

  function matches(item) {
    if (!inGruppe(item)) return false;
    if (state.kat && item.shop !== state.kat) return false;
    return true;
  }

  function renderEbene() {
    var signs = window.AMK_SCHILDER_TEILE || [];
    document.querySelectorAll(".kauf-ebene").forEach(function (nav) {
      var fuer = nav.getAttribute("data-fuer") || "";
      nav.querySelectorAll("a").forEach(function (link) {
        var kat = link.getAttribute("data-kat") || "";
        var teil = link.getAttribute("data-teil") || "";
        var on = false;
        if (fuer === "zaun") on = !!state.kat && kat === state.kat;
        else if (signs.indexOf(teil) !== -1) on = state.zeichen === teil || (!state.zeichen && !state.teil && teil === signs[0]);
        else if (teil) on = state.teil === teil || (!state.teil && !state.zeichen && teil === (teilList()[0] || ""));
        if (on) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    });
  }

  function textOf(el) {
    var strong = el && el.querySelector("strong");
    return strong ? strong.textContent.replace(/\u00ad/g, "").replace(/\s+/g, " ").trim() : "";
  }

  function renderHinweis() {
    var hinweis = document.getElementById("kauf-hinweis");
    var crumbKauf = document.getElementById("crumb-kauf");
    var crumbWahl = document.getElementById("crumb-wahl");
    var gLink = document.querySelector('#kauf-gruppen a[data-gruppe="' + state.gruppe + '"]');
    var gName = textOf(gLink);
    var uName = "";
    var nav = document.querySelector('.kauf-ebene[data-fuer="' + state.gruppe + '"]');
    if (nav) {
      var sub = null;
      var key = state.gruppe === "zaun" ? state.kat : (state.zeichen || state.teil);
      var attr = state.gruppe === "zaun" ? "data-kat" : "data-teil";
      if (/^[a-z0-9-]+$/.test(key || "")) sub = nav.querySelector('a[' + attr + '="' + key + '"]');
      uName = textOf(sub);
    }
    if (hinweis) {
      hinweis.textContent = "";
      if (gName && uName) {
        hinweis.hidden = false;
        hinweis.appendChild(document.createTextNode(gName + " · "));
        var mark = document.createElement("strong");
        mark.textContent = uName;
        hinweis.appendChild(mark);
      } else hinweis.hidden = true;
    }
    if (crumbKauf) {
      if (gName) crumbKauf.removeAttribute("aria-current");
      else crumbKauf.setAttribute("aria-current", "page");
    }
    if (crumbWahl) {
      crumbWahl.textContent = "";
      if (gName) crumbWahl.appendChild(crumbSep(uName ? "" : "page", gName));
      if (uName) crumbWahl.appendChild(crumbSep("page", uName));
    }
  }

  function crumbSep(current, name) {
    var wrap = document.createDocumentFragment();
    var sep = document.createElement("span");
    sep.setAttribute("aria-hidden", "true");
    sep.textContent = " › ";
    var label = document.createElement("span");
    if (current) label.setAttribute("aria-current", current);
    label.textContent = name;
    wrap.appendChild(sep);
    wrap.appendChild(label);
    return wrap;
  }

  function renderGruppen() {
    document.querySelectorAll("[data-gruppe]").forEach(function (link) {
      var on = link.getAttribute("data-gruppe") === state.gruppe;
      if (on) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  }

  function ordered(list) {
    return list.slice().sort(function (a, b) { return a.index - b.index; });
  }

  var sprung = false;
  var pendingSprung = "";
  var beobachter = null;

  function stapelAn() {
    return state.gruppe === "verkehr" || state.gruppe === "anhaenger" || (state.gruppe === "zaun" && !!ZAUN_STAPEL[state.kat]);
  }

  function katalogAn() {
    return state.gruppe === "zaun" && state.kat === "bauzaune";
  }

  function zielId() {
    if (state.gruppe === "zaun") return ZAUN_STAPEL[state.kat] ? state.kat : "";
    if (state.gruppe === "verkehr") return state.zeichen || state.teil || "";
    if (state.gruppe === "anhaenger") return state.teil || "";
    return "";
  }

  function kopfAbstand() {
    var kopf = document.querySelector(".top");
    var bar = document.getElementById("kauf-leiste");
    var schrift = document.getElementById("kauf-schrift");
    var schriftHoch = schrift && window.matchMedia("(min-width: 980px)").matches ? schrift.offsetHeight : 0;
    return (kopf ? kopf.offsetHeight : 0) + (bar && !bar.hidden ? bar.offsetHeight : 0) + schriftHoch + 8;
  }

  function elternVersteckt(el) {
    var parent = el.parentElement;
    while (parent) {
      if (parent.hidden) return true;
      parent = parent.parentElement;
    }
    return false;
  }

  function maleLeiste() {
    var bar = document.getElementById("kauf-leiste");
    if (!bar) return;
    if (!state.gruppe) { bar.hidden = true; return; }
    bar.hidden = false;
    var nav = document.querySelector('.kauf-ebene[data-fuer="' + state.gruppe + '"]');
    if (!nav) return;
    function an(kat, teil) {
      return (kat && kat === state.kat) || (teil && (teil === state.teil || teil === state.zeichen));
    }
    if (bar.getAttribute("data-fuer") === state.gruppe && bar.querySelector("a")) {
      bar.querySelectorAll("a").forEach(function (link) {
        if (an(link.getAttribute("data-kat") || "", link.getAttribute("data-teil") || "")) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    } else {
      var row = document.createElement("div");
      row.className = "kauf-leiste-row";
      nav.querySelectorAll("a").forEach(function (link) {
        var a = document.createElement("a");
        var kat = link.getAttribute("data-kat") || "";
        var teil = link.getAttribute("data-teil") || "";
        a.className = "kauf-leiste-link";
        a.href = link.getAttribute("href") || "#";
        if (kat) a.setAttribute("data-kat", kat);
        if (teil) a.setAttribute("data-teil", teil);
        if (an(kat, teil)) a.setAttribute("aria-current", "true");
        var img = link.querySelector("img");
        if (img) {
          var copy = document.createElement("img");
          copy.src = img.getAttribute("src") || "";
          copy.alt = "";
          a.appendChild(copy);
        }
        var name = document.createElement("span");
        name.textContent = textOf(link);
        a.appendChild(name);
        row.appendChild(a);
      });
      bar.textContent = "";
      bar.appendChild(row);
      bar.setAttribute("data-fuer", state.gruppe);
    }
    document.documentElement.style.setProperty("--kauf-leiste", bar.offsetHeight + "px");
  }

  function aktuelle() {
    if (sprung || pendingSprung || !stapelAn()) return;
    var nodes = [];
    document.querySelectorAll("#kauf-stapel .kauf-abschnitt, #schilder-bereich .kauf-abschnitt").forEach(function (section) {
      if (!section.hidden && !elternVersteckt(section)) nodes.push(section);
    });
    if (!nodes.length) return;
    var margin = parseFloat(getComputedStyle(nodes[0]).scrollMarginTop) || 0;
    var pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    var line = Math.max(margin + pad, kopfAbstand()) + 16;
    var best = null;
    var bestTop = -Infinity;
    nodes.forEach(function (node) {
      var top = node.getBoundingClientRect().top;
      if (top <= line && top > bestTop) {
        bestTop = top;
        best = node;
      }
    });
    if (best) markiere(best.getAttribute("data-abschnitt") || "");
  }

  function springe(id, mode) {
    var ziel = document.getElementById("kauf-teil-" + id);
    if (!ziel || ziel.hidden || elternVersteckt(ziel)) return false;
    sprung = true;
    var last = window.scrollY;
    var still = 0;
    var seen = false;
    var fertig = false;
    var ende = function () {
      if (fertig) return;
      fertig = true;
      var top = ziel.getBoundingClientRect().top;
      var line = kopfAbstand() + 24;
      if (Math.abs(top - line) > 90) {
        var root = document.documentElement;
        var previous = root.style.scrollBehavior;
        root.style.scrollBehavior = "auto";
        ziel.scrollIntoView({ behavior: "auto", block: "start" });
        root.style.scrollBehavior = previous;
      }
      sprung = false;
      aktuelle();
    };
    var watch = function () {
      if (fertig) return;
      var y = window.scrollY;
      if (Math.abs(y - last) > 1) {
        seen = true;
        last = y;
        still = 0;
      } else still += 1;
      if ((seen && still < 4) || (!seen && still < 8)) {
        window.requestAnimationFrame(watch);
        return;
      }
      ende();
    };
    window.requestAnimationFrame(watch);
    window.setTimeout(ende, 1500);
    ziel.scrollIntoView({ behavior: mode === "smooth" ? "smooth" : "auto", block: "start" });
    return true;
  }

  function beobachte() {
    if (beobachter) beobachter.disconnect();
    beobachter = null;
    if (!stapelAn() || !window.IntersectionObserver) return;
    var nodes = [];
    document.querySelectorAll("#kauf-stapel .kauf-abschnitt, #schilder-bereich .kauf-abschnitt").forEach(function (section) {
      if (!section.hidden && !elternVersteckt(section)) nodes.push(section);
    });
    if (!nodes.length) return;
    var abstand = kopfAbstand();
    beobachter = new IntersectionObserver(function () {
      aktuelle();
    }, { rootMargin: "-" + abstand + "px 0px -40% 0px", threshold: [0, 0.25, 0.6] });
    nodes.forEach(function (node) { beobachter.observe(node); });
  }

  function markiere(id) {
    if (!id || sprung) return;
    if (state.gruppe === "zaun") {
      if (!ZAUN_STAPEL[id] || state.kat === id) return;
      state.kat = id;
    } else if (state.gruppe === "verkehr") {
      var signs = window.AMK_SCHILDER_TEILE || [];
      if (signs.indexOf(id) !== -1) {
        if (state.zeichen === id) return;
        state.zeichen = id;
        state.teil = "";
      } else if (state.teil === id && !state.zeichen) return;
      else {
        state.teil = id;
        state.zeichen = "";
      }
    } else if (state.gruppe === "anhaenger") {
      if (state.teil === id) return;
      state.teil = id;
    } else return;
    merkeUnter(state.gruppe, state.kat || state.zeichen || state.teil);
    writeUrl("replace");
    renderEbene();
    renderHinweis();
    maleLeiste();
  }

  function nachPaint() {
    if (stapelAn()) {
      var n = 0;
      document.querySelectorAll("#kauf-stapel article.kauf-produkt, #schilder-bereich article.kauf-produkt").forEach(function (el) {
        if (!el.hidden && !elternVersteckt(el)) n += 1;
      });
      if (empty) empty.hidden = n !== 0;
    }
    maleLeiste();
    schriftSync();
    if (pendingSprung) {
      var id = pendingSprung.id;
      var mode = pendingSprung.mode;
      var ziel = id ? document.getElementById("kauf-teil-" + id) : null;
      if (ziel && !ziel.hidden && !elternVersteckt(ziel)) {
        pendingSprung = "";
        springe(id, mode);
      } else if (!id) {
        pendingSprung = "";
        if (mode === "smooth") zeigeAnsicht();
      }
    }
    beobachte();
    kaufLeiste();
  }

  function render(opts) {
    var overview = !state.gruppe;
    var verkehr = state.gruppe === "verkehr";
    var signs = verkehr;
    var stapel = stapelAn();
    var picker = stapel;
    if (opts && opts.sprung) pendingSprung = { mode: opts.sanft ? "smooth" : "auto", id: zielId() };
    var auswahl = document.getElementById("kauf-auswahl");
    var hinweis = document.getElementById("kauf-verkehr-hinweis");
    board.classList.toggle("is-gruppe", !overview);
    board.classList.toggle("is-schilder", false);
    board.classList.toggle("is-auswahl", false);
    board.classList.toggle("is-anhaenger", state.gruppe === "anhaenger");
    board.classList.toggle("is-verkehr", false);
    board.classList.toggle("is-stapel", stapel);
    if (hinweis) hinweis.hidden = !verkehr;
    var auswahlOffen = stapel || katalogAn();
    if (wahl) wahl.classList.toggle("konfig-layout", auswahlOffen);
    if (spalte) spalte.classList.toggle("konfig-main", auswahlOffen);
    if (verkehrSumme) verkehrSumme.hidden = !auswahlOffen;
    renderGruppen();
    renderEbene();
    renderHinweis();
    schriftMarke();
    if (auswahl) auswahl.hidden = true;
    var stapelBox = document.getElementById("kauf-stapel");
    if (stapelBox) stapelBox.hidden = !stapel;
    ["zaun", "verkehr", "anhaenger"].forEach(function (name) {
      var block = document.getElementById("kauf-stapel-" + name);
      if (!block) return;
      var on = stapel && ((name === "zaun" && state.gruppe === "zaun") || (name === "verkehr" && verkehr) || (name === "anhaenger" && state.gruppe === "anhaenger"));
      block.hidden = !on;
    });
    var shown = 0;
    ordered(items).forEach(function (item) {
      var on = !overview && !signs && !picker && matches(item);
      item.el.hidden = !on;
      liste.appendChild(item.el);
      if (on) shown += 1;
    });
    if (schilder) schilder.hidden = !verkehr;
    empty.hidden = overview || stapel || shown !== 0;
    if (window.AMK_AUSWAHL) window.AMK_AUSWAHL.sync();
    document.querySelectorAll("main section.copy").forEach(function (section) {
      section.hidden = true;
    });
    board.hidden = false;
    nachPaint();
  }

  function kaufZeilen() {
    var lines = [];
    var zeile = window.AMK_AUSWAHL && window.AMK_AUSWAHL.zeileVon;
    if (zeile) {
      document.querySelectorAll("#kauf-stapel [data-auswahl]").forEach(function (geraete) {
        if (geraete.hidden || elternVersteckt(geraete)) return;
        geraete.querySelectorAll('input[name="typ"]:checked').forEach(function (box) {
          lines.push(zeile(box));
        });
      });
    }
    if (katalogAn()) {
      document.querySelectorAll("#kauf-liste .kauf-schnell[data-slug]").forEach(function (block) {
        if (block.hidden || elternVersteckt(block)) return;
        var titel = block.parentElement ? block.parentElement.querySelector("h3") : null;
        var name = titel ? titel.textContent.replace(/\s+/g, " ").trim() : "";
        var stand = schnellZahl(block, "staender");
        var felder = schnellZahl(block, "felder");
        var details = block.querySelector(".kauf-schnell-details");
        var href = details ? details.getAttribute("href") : "";
        if (stand > 0) lines.push({ name: name, menge: stand + " Ständer", block: "Im Komplett-Ständer enthalten", href: href });
        if (felder > 0) lines.push({ name: name, menge: felder + " Einzelfelder", block: "Zusätzlich", href: href });
      });
    }
    if (schilder && zeile) {
      schilder.querySelectorAll('input[name="schild"]:checked').forEach(function (box) {
        lines.push(zeile(box));
      });
      var note = schilder.elements.hinweis;
      var text = note ? String(note.value || "").trim() : "";
      if (text) lines.push({ name: "Größe, Folie, Ständer", menge: text });
    }
    return lines;
  }

  function kaufLeiste() {
    if (!verkehrSumme || !window.AMK_AUSWAHL || !window.AMK_AUSWAHL.fillLeiste) return;
    window.AMK_AUSWAHL.fillLeiste(verkehrSumme, kaufZeilen());
  }

  function setzeUnter(id, spec) {
    var signs = window.AMK_SCHILDER_TEILE || [];
    var kat = spec.kat || "";
    var teil = spec.teil || "";
    state.gruppe = id || state.gruppe;
    if (kat) {
      state.kat = kat;
      state.teil = "";
      state.zeichen = "";
    } else if (signs.indexOf(teil) !== -1) {
      state.kat = "";
      state.teil = "";
      state.zeichen = teil;
      if (window.AMK_SCHILDER_UI && window.AMK_SCHILDER_UI.open) window.AMK_SCHILDER_UI.open(teil);
    } else {
      state.kat = "";
      state.zeichen = "";
      state.teil = teil;
    }
    merkeUnter(state.gruppe, kat || state.zeichen || state.teil);
  }

  document.querySelectorAll(".kauf-ebene").forEach(function (nav) {
    nav.addEventListener("click", function (event) {
      var link = event.target.closest("a");
      if (!link || !nav.contains(link)) return;
      event.preventDefault();
      setzeUnter(nav.getAttribute("data-fuer") || state.gruppe, unterVon(link));
      auswahlHalt = true;
      closePanel();
      writeUrl("push");
      render({ sprung: true, sanft: true });
    });
  });

  var drops = document.getElementById("kauf-drops");
  var gruppen = document.getElementById("kauf-gruppen");
  var offen = "";
  var panelAnker = "kachel";
  var closeTimer = 0;
  var focusQuiet = false;
  var fromPointer = false;
  var auswahlHalt = false;

  function hoverFein() {
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  }

  function placePanel(id) {
    if (!drops) return;
    var nav = document.querySelector('.kauf-ebene[data-fuer="' + id + '"]');
    if (!nav) return;
    if (panelAnker === "schrift") {
      var bar = document.getElementById("kauf-schrift");
      var wrap = document.querySelector(".kauf-board .wrap");
      if (!bar || !wrap) return;
      var band = bar.getBoundingClientRect();
      var box = wrap.getBoundingClientRect();
      nav.style.position = "fixed";
      nav.style.top = band.bottom + "px";
      nav.style.left = box.left + "px";
      nav.style.right = "auto";
      nav.style.width = box.width + "px";
      nav.style.zIndex = "37";
      return;
    }
    var link = document.querySelector('#kauf-gruppen a[data-gruppe="' + id + '"]');
    if (!link) return;
    nav.style.position = "";
    nav.style.left = "";
    nav.style.right = "";
    nav.style.width = "";
    nav.style.zIndex = "";
    nav.style.top = (link.offsetTop + link.offsetHeight + 4) + "px";
  }

  function paintPanel() {
    document.querySelectorAll(".kauf-ebene").forEach(function (nav) {
      var on = nav.getAttribute("data-fuer") === offen;
      nav.hidden = !on;
      if (on) placePanel(offen);
    });
    document.querySelectorAll("#kauf-gruppen a[data-gruppe], #kauf-schrift a[data-gruppe]").forEach(function (link) {
      link.setAttribute("aria-expanded", link.getAttribute("data-gruppe") === offen ? "true" : "false");
    });
  }

  function openPanel(id, anker) {
    window.clearTimeout(closeTimer);
    if (anker) panelAnker = anker;
    else if (offen !== id) panelAnker = "kachel";
    offen = id;
    paintPanel();
  }

  function scheduleClose() {
    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(function () {
      offen = "";
      paintPanel();
    }, 250);
  }

  function closePanel() {
    window.clearTimeout(closeTimer);
    if (!offen) return;
    offen = "";
    paintPanel();
  }

  function zeigeAnsicht() {
    var ziel = document.getElementById("kauf-wahl");
    if (!ziel) return;
    var root = document.documentElement;
    var previous = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, Math.max(0, ziel.getBoundingClientRect().top + window.scrollY - kopfAbstand()));
    root.style.scrollBehavior = previous;
  }

  if (gruppen) {
    gruppen.addEventListener("click", function (event) {
      var link = event.target.closest("a[data-gruppe]");
      if (!link) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      var id = canonGruppe(link.getAttribute("data-gruppe") || "");
      setzeUnter(id, gemerkteUnter(id));
      auswahlHalt = true;
      closePanel();
      writeUrl("push");
      render({ sprung: true, sanft: true });
    });
    gruppen.querySelectorAll("a[data-gruppe]").forEach(function (link) {
      var id = link.getAttribute("data-gruppe") || "";
      link.addEventListener("pointerdown", function () { fromPointer = true; });
      link.addEventListener("pointerup", function () { fromPointer = false; });
      link.addEventListener("pointercancel", function () { fromPointer = false; });
      link.addEventListener("mouseenter", function () {
        if (auswahlHalt || !hoverFein()) return;
        openPanel(id);
      });
      link.addEventListener("mouseleave", function () {
        if (hoverFein()) scheduleClose();
      });
      link.addEventListener("focus", function () {
        if (focusQuiet || fromPointer) return;
        openPanel(id);
      });
      link.addEventListener("keydown", function (event) {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        openPanel(id);
        var first = document.querySelector('.kauf-ebene[data-fuer="' + id + '"] a');
        if (first) first.focus();
      });
    });
  }

  document.querySelectorAll(".kauf-ebene").forEach(function (nav) {
    var id = nav.getAttribute("data-fuer") || "";
    nav.addEventListener("mouseenter", function () {
      if (auswahlHalt || !hoverFein()) return;
      openPanel(id);
    });
    nav.addEventListener("mouseleave", function () {
      if (hoverFein()) scheduleClose();
    });
  });

  if (drops) {
    drops.addEventListener("focusout", function (event) {
      var next = event.relatedTarget;
      if (next && drops.contains(next)) return;
      closePanel();
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape" || !offen) return;
    event.preventDefault();
    var id = offen;
    var trigger = document.querySelector((panelAnker === "schrift" ? "#kauf-schrift" : "#kauf-gruppen") + ' a[data-gruppe="' + id + '"]');
    focusQuiet = true;
    closePanel();
    if (trigger) trigger.focus();
    focusQuiet = false;
  });

  document.addEventListener("pointerdown", function (event) {
    if (!offen || !drops || drops.contains(event.target)) return;
    closePanel();
  });

  document.addEventListener("mousemove", function (event) {
    if (!auswahlHalt || !drops) return;
    var ziel = event.target;
    if (ziel && ziel.closest && ziel.closest("#kauf-drops")) return;
    auswahlHalt = false;
  });

  window.addEventListener("resize", function () {
    if (offen) placePanel(offen);
  });

  document.addEventListener("amk-teil", function (event) {
    var teil = String(event.detail || "");
    if (teilList().indexOf(teil) === -1) return;
    state.zeichen = "";
    state.teil = teil;
    writeUrl("push");
    render();
  });

  function schriftMarke() {
    var bar = document.getElementById("kauf-schrift");
    if (!bar) return;
    bar.querySelectorAll("a[data-gruppe]").forEach(function (link) {
      if (link.getAttribute("data-gruppe") === state.gruppe) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  }

  function schriftSync() {
    var bar = document.getElementById("kauf-schrift");
    if (!bar) return;
    var desktop = window.matchMedia("(min-width: 980px)").matches;
    var tiles = document.getElementById("kauf-gruppen");
    var header = document.querySelector(".top");
    var limit = header ? header.getBoundingClientRect().bottom : 0;
    var show = !!(desktop && tiles && tiles.getBoundingClientRect().bottom <= limit + 1);
    bar.classList.toggle("is-weg", !show);
    bar.setAttribute("aria-hidden", show ? "false" : "true");
    bar.querySelectorAll("a").forEach(function (link) {
      if (show) link.removeAttribute("tabindex");
      else link.setAttribute("tabindex", "-1");
    });
    if (!show && panelAnker === "schrift" && offen) closePanel();
    var hoch = bar.offsetHeight;
    if (hoch) document.documentElement.style.setProperty("--kauf-schrift", hoch + "px");
    if (show && offen && panelAnker === "schrift") placePanel(offen);
  }

  var schrift = document.getElementById("kauf-schrift");
  if (schrift) {
    schrift.addEventListener("click", function (event) {
      var link = event.target.closest("a[data-gruppe]");
      if (!link || !schrift.contains(link)) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      var id = canonGruppe(link.getAttribute("data-gruppe") || "");
      setzeUnter(id, gemerkteUnter(id));
      auswahlHalt = true;
      closePanel();
      writeUrl("push");
      render({ sprung: true, sanft: true });
    });
    schrift.querySelectorAll("a[data-gruppe]").forEach(function (link) {
      var id = link.getAttribute("data-gruppe") || "";
      link.addEventListener("mouseenter", function () {
        if (auswahlHalt || !hoverFein()) return;
        openPanel(id, "schrift");
      });
      link.addEventListener("mouseleave", function () {
        if (hoverFein()) scheduleClose();
      });
      link.addEventListener("focus", function () {
        if (focusQuiet || fromPointer) return;
        openPanel(id, "schrift");
      });
      link.addEventListener("keydown", function (event) {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        openPanel(id, "schrift");
        var first = document.querySelector('.kauf-ebene[data-fuer="' + id + '"] a');
        if (first) first.focus();
      });
    });
  }
  window.addEventListener("scroll", schriftSync, { passive: true });
  window.addEventListener("resize", schriftSync);

  document.addEventListener("amk-wunsch-frisch", function () {
    if (window.AMK_AUSWAHL && window.AMK_AUSWAHL.lies) window.AMK_AUSWAHL.lies();
    if (window.AMK_SCHILDER_UI && window.AMK_SCHILDER_UI.lies) window.AMK_SCHILDER_UI.lies();
    liesSchnell();
    kaufLeiste();
  });

  window.addEventListener("popstate", function () {
    readUrl();
    render({ sprung: true, sanft: false });
  });

  if (wahl) {
    wahl.addEventListener("change", kaufLeiste);
    wahl.addEventListener("input", kaufLeiste);
  }
  document.addEventListener("amk-auswahl", nachPaint);
  var leiste = document.getElementById("kauf-leiste");
  if (leiste) {
    leiste.addEventListener("click", function (event) {
      var link = event.target.closest("a");
      if (!link || !leiste.contains(link)) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      setzeUnter(state.gruppe, unterVon(link));
      auswahlHalt = true;
      closePanel();
      writeUrl("push");
      render({ sprung: true, sanft: true });
    });
  }
  var kaufKorb = document.getElementById("kauf-verkehr-korb");
  if (kaufKorb) {
    var korbLink = document.createElement("a");
    korbLink.className = "btn";
    korbLink.href = "../anfrage/";
    korbLink.textContent = "Zum Anfragekorb";
    kaufKorb.replaceWith(korbLink);
  }

  document.addEventListener("amk-zeichen", function (event) {
    if (state.gruppe !== "verkehr") return;
    var id = String(event.detail || "");
    var signs = window.AMK_SCHILDER_TEILE || [];
    if (signs.indexOf(id) === -1) return;
    state.kat = "";
    state.zeichen = id;
    state.teil = "";
    merkeUnter("verkehr", id);
    writeUrl("push");
    render();
  });

  var IM = "im Komplett-Ständer";
  var ZU = "zusätzlich";
  var schnellStill = false;
  var staenderPaket = {
    felderJe: 30,
    stand: { slug: "transportstaender-10059", name: "Transportständer" },
    wahl: [
      { id: "fuss", je: 31, standard: "fuss-10006" },
      { id: "schelle", je: 30, standard: "zubehoer-10002-1" }
    ]
  };

  function wahlEintrag(id) {
    var found = null;
    (staenderPaket.wahl || []).forEach(function (entry) { if (entry.id === id) found = entry; });
    return found || { id: id, je: 1, standard: "" };
  }

  function mal(je, n) {
    var qty = (je || 1) * n;
    return qty > 9999 ? 9999 : qty;
  }

  function schnellFeld(block, merk) {
    return block ? block.querySelector('[data-schnell="' + merk + '"]') : null;
  }

  function schnellZahl(block, merk) {
    var field = schnellFeld(block, merk);
    var qty = field ? parseInt(field.value, 10) : 0;
    if (!qty || qty < 0) return 0;
    return qty > 9999 ? 9999 : qty;
  }

  function mengeAus(field) {
    if (!field || field.value === "") return null;
    var qty = parseInt(field.value, 10);
    if (!qty || qty < 0) qty = 0;
    if (qty > 9999) qty = 9999;
    if (String(qty) !== field.value) field.value = String(qty);
    return qty;
  }

  function zeigeHinweis(block, an) {
    var hint = block.querySelector(".kauf-schnell-hinweis");
    if (hint) hint.hidden = !an;
  }

  function wahlTreffer(items, prefix, id) {
    var mark = prefix + "im:" + id + ":";
    var found = "";
    items.forEach(function (line) {
      if (String(line.id || "").indexOf(mark) === 0) found = line.id;
    });
    return found;
  }

  function zeileMenge(items, id) {
    var qty = 0;
    items.forEach(function (line) { if (line.id === id) qty = line.qty; });
    return qty || 0;
  }

  function skaliere(items, id, qty) {
    items.forEach(function (line) { if (line.id === id && qty > 0) line.qty = qty; });
    return items;
  }

  function setzeZeile(items, id, name, qty, bild, kat) {
    var found = null;
    items.forEach(function (line) { if (line.id === id) found = line; });
    if (!qty) return items.filter(function (line) { return line.id !== id; });
    if (found) {
      found.qty = qty;
      found.name = name;
      found.bild = bild || "";
      found.kat = kat || "";
      found.note = id.indexOf(":zusatz:") !== -1 ? ZU : IM;
      return items;
    }
    items.push({ id: id, name: name, qty: qty, bild: bild || "", kat: kat || "", note: id.indexOf(":zusatz:") !== -1 ? ZU : IM });
    return items;
  }

  function produktVon(slug, fallback) {
    return bySlug[slug] || fallback || { name: slug, bild: "", kat: "bauzaun" };
  }

  function schreibSchnell(block) {
    if (schnellStill || !block || !window.AMK_WUNSCH || !window.AMK_WUNSCH.load) return;
    var slug = block.getAttribute("data-slug") || "";
    var item = bySlug[slug];
    if (!item) return;
    var stand = mengeAus(schnellFeld(block, "staender"));
    var felder = mengeAus(schnellFeld(block, "felder"));
    if (stand == null || felder == null) return;
    var prefix = "kauf:" + slug + ":";
    var items = window.AMK_WUNSCH.load();
    var fuss = wahlEintrag("fuss");
    var schelle = wahlEintrag("schelle");
    var fussId = wahlTreffer(items, prefix, "fuss");
    var schelleId = wahlTreffer(items, prefix, "schelle");
    var fussAnders = !!(fussId && fussId !== prefix + "im:fuss:" + fuss.standard);
    var schelleAnders = !!(schelleId && schelleId !== prefix + "im:schelle:" + schelle.standard);
    if (stand > 0) {
      items = setzeZeile(items, prefix + "im:zaun", item.name, mal(staenderPaket.felderJe || 30, stand), item.bild, item.kat);
      var standItem = produktVon(staenderPaket.stand.slug, staenderPaket.stand);
      items = setzeZeile(items, prefix + "im:staender", standItem.name || staenderPaket.stand.name, stand, standItem.bild, standItem.kat || item.kat);
      if (fussAnders) items = skaliere(items, fussId, mal(fuss.je, stand));
      else {
        items = items.filter(function (line) { return String(line.id).indexOf(prefix + "im:fuss:") !== 0; });
        var fussItem = produktVon(fuss.standard, { name: fuss.standard });
        items = setzeZeile(items, prefix + "im:fuss:" + fuss.standard, fussItem.name, mal(fuss.je, stand), fussItem.bild, fussItem.kat || item.kat);
      }
      if (schelleAnders) items = skaliere(items, schelleId, mal(schelle.je, stand));
      else {
        items = items.filter(function (line) { return String(line.id).indexOf(prefix + "im:schelle:") !== 0; });
        var schelleItem = produktVon(schelle.standard, { name: schelle.standard });
        items = setzeZeile(items, prefix + "im:schelle:" + schelle.standard, schelleItem.name, mal(schelle.je, stand), schelleItem.bild, schelleItem.kat || item.kat);
      }
    } else {
      items = items.filter(function (line) { return String(line.id).indexOf(prefix + "im:") !== 0; });
    }
    items = setzeZeile(items, prefix + "zusatz:felder", item.name, felder, item.bild, item.kat);
    items = items.filter(function (line) { return line.id !== "kauf:" + slug; });
    if (window.AMK_KAUF_STORE && window.AMK_KAUF_STORE.save) window.AMK_KAUF_STORE.save(items);
    else window.AMK_WUNSCH.save(items, true);
    zeigeHinweis(block, stand > 0 && (fussAnders || schelleAnders));
    var kreis = block.parentElement ? block.parentElement.querySelector("[data-kreis='bauzaun']") : null;
    if (kreis) kreis.checked = stand > 0 || felder > 0;
    kaufLeiste();
  }

  function liesSchnell() {
    if (!window.AMK_WUNSCH || !window.AMK_WUNSCH.load) return;
    schnellStill = true;
    var items = window.AMK_WUNSCH.load();
    document.querySelectorAll(".kauf-schnell[data-slug]").forEach(function (block) {
      var slug = block.getAttribute("data-slug") || "";
      var prefix = "kauf:" + slug + ":";
      var standField = schnellFeld(block, "staender");
      var feldField = schnellFeld(block, "felder");
      if (standField) standField.value = String(zeileMenge(items, prefix + "im:staender"));
      if (feldField) feldField.value = String(zeileMenge(items, prefix + "zusatz:felder"));
      var fuss = wahlEintrag("fuss");
      var schelle = wahlEintrag("schelle");
      var fussId = wahlTreffer(items, prefix, "fuss");
      var schelleId = wahlTreffer(items, prefix, "schelle");
      var stand = standField ? parseInt(standField.value, 10) || 0 : 0;
      zeigeHinweis(block, stand > 0 && ((fussId && fussId !== prefix + "im:fuss:" + fuss.standard) || (schelleId && schelleId !== prefix + "im:schelle:" + schelle.standard)));
      var kreis = block.parentElement ? block.parentElement.querySelector("[data-kreis='bauzaun']") : null;
      if (kreis) kreis.checked = (parseInt(standField && standField.value, 10) || 0) > 0 || (parseInt(feldField && feldField.value, 10) || 0) > 0;
    });
    schnellStill = false;
  }

  function schmuecke() {
    if (!window.AMK_BAUSTEINE || !window.AMK_BAUSTEINE.schnell) return;
    items.forEach(function (item) {
      if (item.el.querySelector(".kauf-schnell")) return;
      if (item.shop === "bauzaune") {
        if (!item.el.querySelector("[data-kreis='bauzaun']")) {
          item.el.insertAdjacentHTML("afterbegin", '<label class="beispiel-wahl"><input type="checkbox" data-kreis="bauzaun" aria-label="' +
            item.name.replace(/"/g, "") + ' auswählen"><span class="beispiel-kreis kachel-kreis"></span></label>');
        }
        item.el.insertAdjacentHTML("beforeend", window.AMK_BAUSTEINE.schnell({
          slug: item.slug,
          href: "../produkt/" + item.slug + "/"
        }));
      } else {
        item.el.insertAdjacentHTML("beforeend", window.AMK_BAUSTEINE.schnellLeer());
      }
    });
    liesSchnell();
  }

  liste.addEventListener("click", function (event) {
    var button = event.target.closest(".kauf-schnell [data-step]");
    if (!button || !liste.contains(button)) return;
    var wrap = button.closest(".beispiel-step");
    var field = wrap ? wrap.querySelector("input[type='number']") : null;
    if (!field) return;
    var step = parseInt(button.getAttribute("data-step"), 10) || 0;
    var value = parseInt(field.value, 10);
    if (isNaN(value)) value = 0;
    field.value = String(Math.min(9999, Math.max(0, value + step)));
    schreibSchnell(button.closest(".kauf-schnell"));
  });

  liste.addEventListener("input", function (event) {
    var field = event.target;
    if (!field || !field.matches || !field.matches(".kauf-schnell [data-schnell]")) return;
    schreibSchnell(field.closest(".kauf-schnell"));
  });

  liste.addEventListener("change", function (event) {
    var box = event.target;
    if (box && box.matches && box.matches("[data-kreis='bauzaun']")) {
      var tile = box.closest("article");
      var block = tile ? tile.querySelector(".kauf-schnell") : null;
      var standField = schnellFeld(block, "staender");
      var feldField = schnellFeld(block, "felder");
      var standNow = parseInt(standField && standField.value, 10) || 0;
      var feldNow = parseInt(feldField && feldField.value, 10) || 0;
      if (box.checked) {
        if (standNow < 1 && feldNow < 1 && standField) standField.value = "1";
      } else {
        if (standField) standField.value = "0";
        if (feldField) feldField.value = "0";
      }
      schreibSchnell(block);
      return;
    }
    var field = event.target;
    if (!field || !field.matches || !field.matches(".kauf-schnell [data-schnell]")) return;
    if (field.value === "") field.value = "0";
    schreibSchnell(field.closest(".kauf-schnell"));
  });

  Promise.all([
    fetch("../data/katalog.json").then(function (response) { return response.json(); }),
    fetch("../data/kauf-auswahl.json").then(function (response) { return response.json(); }).catch(function () { return null; })
  ]).then(function (result) {
    var data = result[0];
    var config = result[1];
    if (config && config.staender && config.staender.paket) staenderPaket = config.staender.paket;
    data.forEach(function (product) {
      var item = bySlug[product.slug];
      if (!item) return;
      item.code = product.code || "";
      item.shop = product.shop || "";
      item.attr = product.attr || {};
      item.bild = product.bild || "";
      item.kat = product.kat || "";
      if (product.name) item.name = product.name;
    });
    schmuecke();
    readUrl();
    render({ sprung: true, sanft: false });
    writeUrl("replace");
  }).catch(function () {
    board.hidden = true;
  });
})();
