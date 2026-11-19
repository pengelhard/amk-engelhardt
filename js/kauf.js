(function () {
  var board = document.querySelector(".kauf-board");
  var liste = document.getElementById("kauf-liste");
  var cats = document.getElementById("kauf-cats");
  var empty = document.getElementById("kauf-empty");
  var countEl = document.getElementById("kauf-count");
  var qInput = document.getElementById("kauf-q");
  var sortInput = document.getElementById("kauf-sort");
  var resetBtn = document.getElementById("kauf-reset");
  if (!board || !liste || !cats) return;

  var GRUPPEN = {};
  (window.AMK_GRUPPEN ? window.AMK_GRUPPEN.list : [
    { id: "zaun", shops: ["bauzaune", "zubehoer", "tore", "sichtschutz", "gitter"] },
    { id: "verkehr", shops: ["schilder", "verkehr"] },
    { id: "anhaenger", shops: ["anhaenger"] }
  ]).forEach(function (gruppe) { GRUPPEN[gruppe.id] = gruppe.shops.slice(); });
  var UNTER = {
    zaun: [
      { id: "", label: "Alle" },
      { id: "bauzaune", label: "Bauzäune" },
      { id: "zubehoer", label: "Zaunzubehör" },
      { id: "tore", label: "Türen & Tore" },
      { id: "sichtschutz", label: "Sichtschutz & Planen" }
    ]
  };
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
    var nav = document.getElementById("kauf-ebene");
    if (!nav) return;
    nav.hidden = state.gruppe !== "zaun";
    nav.querySelectorAll("a[data-kat]").forEach(function (link) {
      var on = state.gruppe === "zaun" && link.getAttribute("data-kat") === state.kat;
      if (on) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  }

  function renderChips() {
    var list = UNTER[state.gruppe] || [];
    cats.hidden = !list.length;
    cats.innerHTML = list.map(function (kat) {
      var on = state.kat === kat.id;
      return '<button type="button" class="chip" data-kat="' + kat.id + '" aria-pressed="' + (on ? "true" : "false") + '">' + kat.label + "</button>";
    }).join("");
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
    renderChips();
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

  var ebene = document.getElementById("kauf-ebene");
  if (ebene) {
    ebene.addEventListener("click", function (event) {
      var link = event.target.closest("a[data-kat]");
      if (!link) return;
      event.preventDefault();
      state.gruppe = "zaun";
      state.kat = link.getAttribute("data-kat") || "";
      state.teil = "";
      state.zeichen = "";
      render();
      writeUrl("push");
    });
  }

  cats.addEventListener("click", function (event) {
    var button = event.target.closest("button[data-kat]");
    if (!button) return;
    state.kat = button.getAttribute("data-kat") || "";
    render();
    writeUrl("push");
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

  var gruppen = document.getElementById("kauf-gruppen");
  if (gruppen) {
    gruppen.addEventListener("click", function (event) {
      var link = event.target.closest("a[data-gruppe]");
      if (!link) return;
      event.preventDefault();
      state.gruppe = canonGruppe(link.getAttribute("data-gruppe") || "");
      state.kat = "";
      state.teil = "";
      state.zeichen = "";
      state.q = "";
      state.sort = "";
      render();
      writeUrl("push");
    });
  }

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

  function jumpTo(selector) {
    var tries = 0;
    function step() {
      var target = document.querySelector(selector);
      if (target && target.getBoundingClientRect().height > 0) {
        var root = document.documentElement;
        var previous = root.style.scrollBehavior;
        root.style.scrollBehavior = "auto";
        target.scrollIntoView({ block: "start" });
        root.style.scrollBehavior = previous;
        return;
      }
      tries += 1;
      if (tries < 40) window.setTimeout(step, 50);
    }
    step();
  }

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
      if (state.gruppe === "verkehr" && state.zeichen) jumpTo("#schilder-bereich .kauf-cats");
      else if (state.gruppe === "verkehr" && state.teil) jumpTo("#kauf-auswahl .kauf-cats");
    })
    .catch(function () {
      board.hidden = true;
    });
})();
