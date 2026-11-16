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

  var KATEGORIEN = [
    { id: "", label: "Alle" },
    { id: "bauzaune", label: "Bauzäune" },
    { id: "zubehoer", label: "Zaunzubehör" },
    { id: "tore", label: "Türen & Tore" },
    { id: "sichtschutz", label: "Sichtschutz & Planen" },
    { id: "gitter", label: "Absperrgitter" },
    { id: "verkehr", label: "Verkehrssicherung" },
    { id: "anhaenger", label: "Anhänger" }
  ];
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
  var HASH = { bauzaun: "bauzaune", verkehrssicherung: "verkehr", anhaenger: "anhaenger" };
  var known = {};
  KATEGORIEN.forEach(function (kat) { if (kat.id) known[kat.id] = true; });

  var nodes = Array.prototype.slice.call(document.querySelectorAll("article.tile"));
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

  var state = { kat: "", q: "", sort: "", facets: {} };
  var searchTimer = 0;

  function readUrl() {
    var params = new URLSearchParams(location.search);
    var kat = params.get("kat") || "";
    if (!known[kat]) kat = "";
    if (!kat && location.hash) {
      var mapped = HASH[location.hash.slice(1)];
      if (mapped) kat = mapped;
    }
    var facets = {};
    FACETTEN.forEach(function (pair) {
      var values = params.getAll(pair[0]);
      if (values.length) facets[pair[0]] = values;
    });
    state = {
      kat: kat,
      q: params.get("q") || "",
      sort: params.get("sort") || "",
      facets: facets
    };
  }

  function writeUrl(mode) {
    var params = new URLSearchParams();
    if (state.kat) params.set("kat", state.kat);
    if (state.q) params.set("q", state.q);
    if (state.sort) params.set("sort", state.sort);
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

  function matches(item, skipKey) {
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
    cats.innerHTML = KATEGORIEN.map(function (kat) {
      var on = state.kat === kat.id;
      return '<button type="button" class="chip" data-kat="' + kat.id + '" aria-pressed="' + (on ? "true" : "false") + '">' + kat.label + "</button>";
    }).join("");
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
    renderChips();
    renderFacets();
    qInput.value = state.q;
    sortInput.value = state.sort === "name" || state.sort === "nummer" ? state.sort : "";
    var shown = 0;
    ordered(items).forEach(function (item) {
      var on = matches(item, null);
      item.el.hidden = !on;
      liste.appendChild(item.el);
      if (on) shown += 1;
    });
    empty.hidden = shown !== 0;
    countEl.textContent = shown === 1 ? "1 Artikel" : shown + " Artikel";
    document.querySelectorAll("main section.copy").forEach(function (section) {
      section.hidden = true;
    });
    board.hidden = false;
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

  resetBtn.addEventListener("click", function () {
    state = { kat: "", q: "", sort: "", facets: {} };
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
      var hashKat = location.hash && HASH[location.hash.slice(1)];
      render();
      if (hashKat && !new URLSearchParams(location.search).get("kat")) writeUrl("replace");
      else writeUrl("replace");
    })
    .catch(function () {
      board.hidden = true;
    });
})();
