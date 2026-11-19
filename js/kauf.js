(function () {
  var board = document.querySelector(".kauf-board");
  var liste = document.getElementById("kauf-liste");
  var empty = document.getElementById("kauf-empty");
  var countEl = document.getElementById("kauf-count");
  var qInput = document.getElementById("kauf-q");
  var sortInput = document.getElementById("kauf-sort");
  var resetBtn = document.getElementById("kauf-reset");
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
  var EBENE = { schwellen: 1, schleuse: 1, buehne: 1 };
  var HASH = {
    bauzaun: { gruppe: "zaun", kat: "bauzaune" },
    verkehrssicherung: { gruppe: "verkehr", kat: "" },
    anhaenger: { gruppe: "anhaenger", kat: "" }
  };

  var vorlage = document.getElementById("kauf-vorlage");
  var nodes = Array.prototype.slice.call((vorlage ? vorlage.content : document).querySelectorAll("article.tile"));
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

  var state = { gruppe: "", kat: "", q: "", sort: "" };
  var schilder = document.getElementById("schilder-bereich");
  var wahl = document.getElementById("kauf-wahl");
  var spalte = document.getElementById("kauf-spalte");
  var verkehrSumme = document.getElementById("kauf-verkehr-summe");
  var searchTimer = 0;

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
    if (!gruppe && !params.get("q")) gruppe = "zaun";
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
      zeichen: zeichen,
      q: params.get("q") || "",
      sort: params.get("sort") || ""
    };
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
    if (state.q) params.set("q", state.q);
    if (state.sort) params.set("sort", state.sort);
    if (state.gruppe === "verkehr" && state.zeichen) params.set("teil", state.zeichen);
    else if (state.teil && teilList().indexOf(state.teil) !== -1) params.set("teil", state.teil);
    var qs = params.toString();
    var url = location.pathname + (qs ? "?" + qs : "");
    if (mode === "push") history.pushState({ kauf: 1 }, "", url);
    else history.replaceState({ kauf: 1 }, "", url);
  }

  function hay(item) {
    return (item.name + " " + item.code + " " + item.slug).toLocaleLowerCase("de");
  }

  function inGruppe(item) {
    if (!state.gruppe) return !state.q ? false : item.slug !== "verkehrsschilder";
    if (item.shop === "gitter" || item.shop === "verkehr" || item.shop === "anhaenger") return false;
    if (item.slug === "verkehrsschilder") return false;
    var shops = GRUPPEN[state.gruppe] || [];
    if (shops.indexOf(item.shop) === -1) return false;
    return true;
  }

  function matches(item) {
    if (!inGruppe(item)) return false;
    if (state.kat && item.shop !== state.kat) return false;
    if (state.q && hay(item).indexOf(state.q.toLocaleLowerCase("de")) < 0) return false;
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

  function filterSchilder() {
    if (window.AMK_SCHILDER_UI) window.AMK_SCHILDER_UI.filter(state.q);
  }

  function ordered(list) {
    var copy = list.slice();
    if (state.sort === "name") {
      copy.sort(function (a, b) { return a.name.localeCompare(b.name, "de"); });
    } else if (state.sort === "nummer") {
      copy.sort(function (a, b) {
        if (!a.code && !b.code) return a.index - b.index;
        if (!a.code) return 1;
        if (!b.code) return -1;
        return a.code.localeCompare(b.code, "de", { numeric: true });
      });
    } else {
      copy.sort(function (a, b) { return a.index - b.index; });
    }
    return copy;
  }

  function render() {
    var overview = !state.gruppe && !state.q;
    var verkehr = state.gruppe === "verkehr";
    var signs = verkehr;
    var picker = verkehr || state.gruppe === "anhaenger" || (state.gruppe === "zaun" && (state.kat === "gitter" || !!EBENE[state.kat]));
    var auswahl = document.getElementById("kauf-auswahl");
    var hinweis = document.getElementById("kauf-verkehr-hinweis");
    board.classList.toggle("is-gruppe", !overview);
    board.classList.toggle("is-schilder", false);
    board.classList.toggle("is-auswahl", picker && !verkehr);
    board.classList.toggle("is-anhaenger", state.gruppe === "anhaenger");
    board.classList.toggle("is-verkehr", verkehr);
    if (hinweis) hinweis.hidden = !verkehr;
    if (wahl) wahl.classList.toggle("konfig-layout", verkehr);
    if (spalte) spalte.classList.toggle("konfig-main", verkehr);
    if (verkehrSumme) verkehrSumme.hidden = !verkehr;
    renderGruppen();
    renderEbene();
    renderHinweis();
    if (auswahl) {
      if (verkehr) {
        auswahl.setAttribute("data-ohne-leiste", "");
        auswahl.setAttribute("data-leer-ok", "");
      } else {
        auswahl.removeAttribute("data-ohne-leiste");
        auswahl.removeAttribute("data-leer-ok");
      }
      auswahl.hidden = !picker;
      if (picker) {
        var auswahlGruppe = state.gruppe;
        if (state.gruppe === "zaun") auswahlGruppe = EBENE[state.kat] ? state.kat : "gitter";
        else if (verkehr) auswahlGruppe = "absperrung";
        auswahl.setAttribute("data-gruppe", auswahlGruppe);
      }
      else {
        auswahl.innerHTML = "";
        delete auswahl.dataset.key;
      }
    }
    qInput.placeholder = signs ? "Nummer oder Name" : "Name oder Artikelnummer";
    qInput.value = state.q;
    sortInput.value = state.sort === "name" || state.sort === "nummer" ? state.sort : "";
    var shown = 0;
    ordered(items).forEach(function (item) {
      var on = !overview && !signs && !picker && matches(item);
      item.el.hidden = !on;
      liste.appendChild(item.el);
      if (on) shown += 1;
    });
    if (schilder) schilder.hidden = !signs;
    filterSchilder();
    var signShown = signs && schilder ? schilder.querySelectorAll("[data-schild]:not([hidden])").length : 0;
    empty.hidden = overview || picker || (signs ? signShown !== 0 : shown !== 0);
    countEl.hidden = overview || signs || picker;
    if (window.AMK_AUSWAHL) window.AMK_AUSWAHL.sync();
    kaufLeiste();
    countEl.textContent = shown === 1 ? "1 Artikel" : shown + " Artikel";
    document.querySelectorAll("main section.copy").forEach(function (section) {
      section.hidden = true;
    });
    board.hidden = false;
  }

  function kaufZeilen() {
    var lines = [];
    var zeile = window.AMK_AUSWAHL && window.AMK_AUSWAHL.zeileVon;
    var geraete = document.getElementById("kauf-auswahl");
    if (geraete && zeile && geraete.getAttribute("data-gruppe") === "absperrung") {
      geraete.querySelectorAll('input[name="typ"]:checked').forEach(function (box) {
        lines.push(zeile(box));
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

  document.querySelectorAll(".kauf-ebene").forEach(function (nav) {
    nav.addEventListener("click", function (event) {
      var link = event.target.closest("a");
      if (!link || !nav.contains(link)) return;
      event.preventDefault();
      var fuer = nav.getAttribute("data-fuer") || "";
      var signs = window.AMK_SCHILDER_TEILE || [];
      var teil = link.getAttribute("data-teil") || "";
      state.gruppe = fuer || state.gruppe;
      if (link.hasAttribute("data-kat")) {
        state.kat = link.getAttribute("data-kat") || "";
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
      writeUrl("push");
      render();
      if (!hoverFein()) closePanel();
    });
  });

  sortInput.addEventListener("change", function () {
    state.sort = sortInput.value;
    render();
    writeUrl("push");
  });

  qInput.addEventListener("input", function () {
    state.q = qInput.value.trim();
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(function () {
      render();
      writeUrl("replace");
    }, 200);
  });

  var drops = document.getElementById("kauf-drops");
  var gruppen = document.getElementById("kauf-gruppen");
  var offen = "";
  var closeTimer = 0;
  var focusQuiet = false;
  var fromPointer = false;

  function hoverFein() {
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  }

  function placePanel(id) {
    if (!drops) return;
    var link = document.querySelector('#kauf-gruppen a[data-gruppe="' + id + '"]');
    var nav = document.querySelector('.kauf-ebene[data-fuer="' + id + '"]');
    if (!link || !nav) return;
    nav.style.top = Math.max(0, link.offsetTop + link.offsetHeight - 1) + "px";
  }

  function paintPanel() {
    document.querySelectorAll(".kauf-ebene").forEach(function (nav) {
      var on = nav.getAttribute("data-fuer") === offen;
      nav.hidden = !on;
      if (on) placePanel(offen);
    });
    document.querySelectorAll("#kauf-gruppen a[data-gruppe]").forEach(function (link) {
      link.setAttribute("aria-expanded", link.getAttribute("data-gruppe") === offen ? "true" : "false");
    });
  }

  function openPanel(id) {
    window.clearTimeout(closeTimer);
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

  if (gruppen) {
    gruppen.addEventListener("click", function (event) {
      var link = event.target.closest("a[data-gruppe]");
      if (!link) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      var id = canonGruppe(link.getAttribute("data-gruppe") || "");
      if (!hoverFein()) {
        if (offen === id) closePanel();
        else openPanel(id);
        return;
      }
      openPanel(id);
    });
    gruppen.querySelectorAll("a[data-gruppe]").forEach(function (link) {
      var id = link.getAttribute("data-gruppe") || "";
      link.addEventListener("pointerdown", function () { fromPointer = true; });
      link.addEventListener("pointerup", function () { fromPointer = false; });
      link.addEventListener("pointercancel", function () { fromPointer = false; });
      link.addEventListener("mouseenter", function () {
        if (hoverFein()) openPanel(id);
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
      if (hoverFein()) openPanel(id);
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
    var trigger = document.querySelector('#kauf-gruppen a[data-gruppe="' + id + '"]');
    focusQuiet = true;
    closePanel();
    if (trigger) trigger.focus();
    focusQuiet = false;
  });

  document.addEventListener("pointerdown", function (event) {
    if (!offen || !drops || drops.contains(event.target)) return;
    closePanel();
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

  resetBtn.addEventListener("click", function () {
    state.kat = "";
    state.q = "";
    state.sort = "";
    render();
    writeUrl("push");
  });

  window.addEventListener("popstate", function () {
    readUrl();
    render();
  });

  if (wahl) {
    wahl.addEventListener("change", kaufLeiste);
    wahl.addEventListener("input", kaufLeiste);
  }
  document.addEventListener("amk-auswahl", kaufLeiste);
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
    state.zeichen = id;
    state.teil = "";
    writeUrl("push");
  });

  fetch("../data/katalog.json")
    .then(function (response) { return response.json(); })
    .then(function (data) {
      data.forEach(function (product) {
        var item = bySlug[product.slug];
        if (!item) return;
        item.code = product.code || "";
        item.shop = product.shop || "";
        item.attr = product.attr || {};
        if (product.name) item.name = product.name;
      });
      readUrl();
      render();
      writeUrl("replace");
    })
    .catch(function () {
      board.hidden = true;
    });
})();
