(function () {
  var board = document.querySelector(".kauf-board");
  var liste = document.getElementById("kauf-liste");
  var cats = document.getElementById("kauf-cats");
  var form = document.getElementById("kauf-filter");
  var empty = document.getElementById("kauf-empty");
  var countEl = document.getElementById("kauf-count");
  var qInput = document.getElementById("kauf-q");
  var sortInput = document.getElementById("kauf-sort");
  var toggle = document.getElementById("kauf-toggle");
  var resetBtn = document.getElementById("kauf-reset");
  if (!board || !liste || !cats || !form) return;

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
      { id: "sichtschutz", label: "Sichtschutz & Planen" },
      { id: "gitter", label: "Absperrgitter" },
      { id: "leit", label: "Leitschwellen, Schleusen & Bühnen" }
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
  var FACETTEN = [
    ["hoehe", "Höhe"],
    ["breite", "Breite"],
    ["laenge", "Länge"],
    ["oberflaeche", "Oberfläche"],
    ["masche", "Maschenweite"],
    ["draht", "Drahtstärke"],
    ["standrohr", "Standrohr"],
    ["material", "Material"],
    ["fussart", "Fußart"],
    ["art", "Art"]
  ];
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

  var state = { gruppe: "", kat: "", q: "", sort: "", facets: {} };
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
    if (kat === "verkehr") kat = "";
    if (kat === "leit") {
      if (!gruppe) gruppe = "zaun";
    } else if (!KAT_GRUPPE[kat]) kat = "";
    if (!gruppe && location.hash && HASH[location.hash.slice(1)]) {
      var mapped = HASH[location.hash.slice(1)];
      gruppe = mapped.gruppe;
      if (!kat) kat = mapped.kat;
    }
    if (kat && !gruppe) gruppe = KAT_GRUPPE[kat] || "";
    if (gruppe && kat && kat !== "leit" && GRUPPEN[gruppe].indexOf(kat) === -1) kat = "";
    if (kat === "leit" && gruppe !== "zaun") kat = "";
    if (!gruppe && !params.get("q")) gruppe = "zaun";
    var facets = {};
    FACETTEN.forEach(function (pair) {
      var values = params.getAll(pair[0]);
      if (values.length) facets[pair[0]] = values;
    });
    var teil = params.get("teil") || "";
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
      sort: params.get("sort") || "",
      facets: facets
    };
  }

  function teilList() {
    var map = window.AMK_AUSWAHL && window.AMK_AUSWAHL.teile;
    if (state.gruppe === "verkehr") return (map && map.absperrung) || [];
    if (state.gruppe === "zaun" && state.kat === "leit") return (map && map.leit) || [];
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
    FACETTEN.forEach(function (pair) {
      (state.facets[pair[0]] || []).forEach(function (value) {
        params.append(pair[0], value);
      });
    });
    var qs = params.toString();
    var url = location.pathname + (qs ? "?" + qs : "");
    if (mode === "push") history.pushState({ kauf: 1 }, "", url);
    else history.replaceState({ kauf: 1 }, "", url);
  }

  function hay(item) {
    return (item.name + " " + item.code + " " + item.slug).toLocaleLowerCase("de");
  }

  function selected(key) {
    return state.facets[key] || [];
  }

  function inGruppe(item) {
    if (!state.gruppe) return !state.q ? false : item.slug !== "verkehrsschilder";
    if (item.shop === "gitter" || item.shop === "verkehr" || item.shop === "anhaenger") return false;
    if (item.slug === "verkehrsschilder") return false;
    var shops = GRUPPEN[state.gruppe] || [];
    if (shops.indexOf(item.shop) === -1) return false;
    return true;
  }

  function matches(item, skipKey) {
    if (!inGruppe(item)) return false;
    if (state.kat && item.shop !== state.kat) return false;
    if (state.q && hay(item).indexOf(state.q.toLocaleLowerCase("de")) < 0) return false;
    for (var i = 0; i < FACETTEN.length; i++) {
      var key = FACETTEN[i][0];
      if (key === skipKey) continue;
      var want = selected(key);
      if (!want.length) continue;
      if (want.indexOf(item.attr[key]) < 0) return false;
    }
    return true;
  }

  function inCategory(item) {
    if (!inGruppe(item)) return false;
    return !state.kat || item.shop === state.kat;
  }

  function compareValue(a, b) {
    var na = parseFloat(String(a).replace(",", "."));
    var nb = parseFloat(String(b).replace(",", "."));
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return String(a).localeCompare(String(b), "de");
  }

  function renderFacets() {
    var html = "";
    var active = 0;
    FACETTEN.forEach(function (pair) {
      var key = pair[0];
      var values = {};
      items.forEach(function (item) {
        if (!inCategory(item)) return;
        var value = item.attr[key];
        if (!value) return;
        if (!values[value]) values[value] = 0;
      });
      var keys = Object.keys(values);
      var chosen = selected(key);
      chosen.forEach(function (value) { if (!values[value]) values[value] = 0; });
      keys = Object.keys(values);
      if (keys.length < 2 && !chosen.length) return;
      keys.sort(compareValue);
      keys.forEach(function (value) {
        values[value] = 0;
        items.forEach(function (item) {
          if (item.attr[key] !== value) return;
          if (matches(item, key)) values[value] += 1;
        });
      });
      var rows = keys.filter(function (value) {
        return values[value] > 0 || chosen.indexOf(value) >= 0;
      });
      if (rows.length < 2 && !chosen.length) return;
      html += '<fieldset><legend>' + pair[1] + "</legend>";
      rows.forEach(function (value) {
        var on = chosen.indexOf(value) >= 0;
        if (on) active += 1;
        html += '<label class="choice"><input type="checkbox" name="' + key + '" value="' + escapeAttr(value) + '"' + (on ? " checked" : "") + "> <span>" + escapeText(value) + ' <span class="kauf-n">' + values[value] + "</span></span></label>";
      });
      html += "</fieldset>";
    });
    form.innerHTML = html;
    toggle.textContent = active ? "Filter (" + active + ")" : "Filter";
  }

  function escapeText(value) {
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function escapeAttr(value) {
    return escapeText(value).replace(/"/g, "&quot;");
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
    var picker = verkehr || state.gruppe === "anhaenger" || (state.gruppe === "zaun" && (state.kat === "gitter" || state.kat === "leit"));
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
        if (state.gruppe === "zaun") auswahlGruppe = state.kat === "leit" ? "leit" : "gitter";
        else if (verkehr) auswahlGruppe = "absperrung";
        auswahl.setAttribute("data-gruppe", auswahlGruppe);
      }
      else {
        auswahl.innerHTML = "";
        delete auswahl.dataset.key;
      }
    }
    if (!state.gruppe || signs || picker) form.innerHTML = "";
    else renderFacets();
    qInput.placeholder = signs ? "Nummer oder Name" : "Name oder Artikelnummer";
    qInput.value = state.q;
    sortInput.value = state.sort === "name" || state.sort === "nummer" ? state.sort : "";
    var shown = 0;
    ordered(items).forEach(function (item) {
      var on = !overview && !signs && !picker && matches(item, null);
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

  function ersteWahl(root) {
    if (!root) return null;
    var boxes = root.querySelectorAll('input[name="typ"], input[name="schild"]');
    var i;
    for (i = 0; i < boxes.length; i++) {
      var card = boxes[i].closest("[data-teil-karte], [data-schild]");
      if (card && card.hidden) continue;
      return boxes[i];
    }
    return null;
  }

  function readFacets() {
    var facets = {};
    form.querySelectorAll("input:checked").forEach(function (input) {
      if (!facets[input.name]) facets[input.name] = [];
      facets[input.name].push(input.value);
    });
    state.facets = facets;
  }

  cats.addEventListener("click", function (event) {
    var button = event.target.closest("button[data-kat]");
    if (!button) return;
    state.kat = button.getAttribute("data-kat") || "";
    state.facets = {};
    render();
    writeUrl("push");
  });

  form.addEventListener("change", function () {
    readFacets();
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
      state.facets = {};
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
    state.facets = {};
    if (form.classList.contains("is-open")) {
      /* keep the mobile panel as the user left it */
    }
    render();
    writeUrl("push");
  });

  toggle.addEventListener("click", function () {
    var open = !form.classList.contains("is-open");
    form.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
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
    kaufKorb.addEventListener("click", function () {
      if (!kaufZeilen().length) {
        var first = ersteWahl(wahl);
        if (first) first.focus();
        return;
      }
      var device = document.querySelector("#kauf-auswahl form");
      if (device) device.requestSubmit();
      if (schilder) schilder.requestSubmit();
    });
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
