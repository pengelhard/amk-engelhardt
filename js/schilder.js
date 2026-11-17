(function () {
  /* StVO-Zeichen, übliche Baustellenauswahl. Keine Artikelnummern von KK:
     der Lieferant führt keine einzelnen Schilder. Namen nach StVO. */
  var ZEICHEN = [
    { id: "z123", nr: "Z 123", name: "Arbeitsstelle", art: "gefahr", symbol: "arbeit" },
    { id: "z120", nr: "Z 120", name: "Verengte Fahrbahn", art: "gefahr", symbol: "enge" },
    { id: "z121-10", nr: "Z 121-10", name: "Einseitig verengte Fahrbahn, rechts", art: "gefahr", symbol: "rechts" },
    { id: "z121-20", nr: "Z 121-20", name: "Einseitig verengte Fahrbahn, links", art: "gefahr", symbol: "links" },
    { id: "z208", nr: "Z 208", name: "Vorrang vor dem Gegenverkehr", art: "quadrat", symbol: "vor" },
    { id: "z308", nr: "Z 308", name: "Vorrang des Gegenverkehrs", art: "quadrat", symbol: "gegen" },
    { id: "z222", nr: "Z 222", name: "Rechts vorbei", art: "gebot", symbol: "pfeil" },
    { id: "z250", nr: "Z 250", name: "Verbot für Fahrzeuge aller Art", art: "verbot", symbol: "leer" },
    { id: "z260", nr: "Z 260", name: "Verbot für Krafträder", art: "verbot", symbol: "rad" },
    { id: "z267", nr: "Z 267", name: "Verbot der Einfahrt", art: "verbot", symbol: "balken" },
    { id: "z274-30", nr: "Z 274", name: "Zulässige Höchstgeschwindigkeit 30", art: "verbot", symbol: "30" },
    { id: "z274-50", nr: "Z 274", name: "Zulässige Höchstgeschwindigkeit 50", art: "verbot", symbol: "50" },
    { id: "z274-70", nr: "Z 274", name: "Zulässige Höchstgeschwindigkeit 70", art: "verbot", symbol: "70" },
    { id: "z276", nr: "Z 276", name: "Überholverbot", art: "verbot", symbol: "ueber" },
    { id: "z283", nr: "Z 283", name: "Absolutes Haltverbot", art: "halt", symbol: "kreuz" },
    { id: "z286", nr: "Z 286", name: "Eingeschränktes Haltverbot", art: "halt", symbol: "strich" },
    { id: "z259", nr: "Z 259", name: "Verbot für Fußgänger", art: "verbot", symbol: "fuss" },
    { id: "z454", nr: "Z 454", name: "Umleitungswegweiser", art: "umleitung", symbol: "umweg" },
    { id: "z455", nr: "Z 455", name: "Umleitungsankündigung", art: "umleitung", symbol: "ankuend" },
    { id: "z457", nr: "Z 457", name: "Umleitung", art: "umleitung", symbol: "umbieg" }
  ];

  var TEILE = [
    { id: "gefahr", label: "Gefahrzeichen", art: { gefahr: 1 } },
    { id: "vorschrift", label: "Vorschriftzeichen", art: { quadrat: 1, gebot: 1, verbot: 1, halt: 1 } },
    { id: "richt", label: "Richtzeichen", art: { umleitung: 1 } }
  ];
  var query = "";
  var localTeil = "";

  function teilOf(entry) {
    var found = TEILE[0].id;
    TEILE.forEach(function (teil) { if (teil.art[entry.art]) found = teil.id; });
    return found;
  }

  function teilNow() {
    var params = new URLSearchParams(location.search);
    if (params.get("gruppe") === "schilder") {
      var teil = params.get("teil") || "";
      if (TEILE.some(function (entry) { return entry.id === teil; })) return teil;
      return TEILE[0].id;
    }
    return localTeil || TEILE[0].id;
  }

  function apply() {
    var teil = teilNow();
    var q = query.toLocaleLowerCase("de");
    document.querySelectorAll("[data-schilder]").forEach(function (form) {
      form.querySelectorAll(".kauf-cats [data-teil]").forEach(function (button) {
        var on = button.getAttribute("data-teil") === teil;
        button.setAttribute("aria-pressed", on ? "true" : "false");
      });
      form.querySelectorAll(".schild-row").forEach(function (row) {
        var text = row.textContent.toLocaleLowerCase("de");
        row.hidden = row.getAttribute("data-teil") !== teil || !!(q && text.indexOf(q) === -1);
      });
    });
  }

  function svg(inner) {
    return '<svg viewBox="0 0 64 64" width="48" height="48" aria-hidden="true" focusable="false">' + inner + "</svg>";
  }

  function mark(entry) {
    var s = entry.symbol;
    if (entry.art === "gefahr") {
      var pic = "";
      if (s === "arbeit") pic = '<circle cx="24" cy="34" r="3.2" fill="#1a1a18"/><path d="M24 37 v8 M20 42 h8 M21 49 l3 -4 3 4 M33 33 l9 15" fill="none" stroke="#1a1a18" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>';
      if (s === "enge") pic = '<path d="M18 33 L27 51 M46 33 L37 51" fill="none" stroke="#1a1a18" stroke-width="3.2" stroke-linecap="round"/>';
      if (s === "rechts") pic = '<path d="M16 33 H42 L34 51 H22 Z" fill="#1a1a18"/>';
      if (s === "links") pic = '<path d="M48 33 H22 L30 51 H42 Z" fill="#1a1a18"/>';
      return svg('<polygon points="32,6 60,56 4,56" fill="#f0c400" stroke="#1a1a18" stroke-width="3"/>' + pic);
    }
    if (entry.art === "gebot") {
      return svg('<circle cx="32" cy="32" r="28" fill="#1d4e89"/><path d="M18 32 h22 M30 22 l12 10 -12 10" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>');
    }
    if (entry.art === "quadrat") {
      var vor = s === "vor";
      var up = vor ? "#1a1a18" : "#c41212";
      var down = vor ? "#c41212" : "#1a1a18";
      return svg('<rect x="6" y="6" width="52" height="52" fill="#fff" stroke="' + (vor ? "#1a1a18" : "#c41212") + '" stroke-width="4"/>' +
        '<path d="M24 16 v20 M18 24 l6 -8 6 8" fill="none" stroke="' + up + '" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="M40 48 V28 M34 40 l6 8 6 -8" fill="none" stroke="' + down + '" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>');
    }
    if (entry.art === "umleitung") {
      var arrow = s === "ankuend"
        ? '<path d="M32 46 V22 M24 30 l8 -10 8 10" fill="none" stroke="#1a1a18" stroke-width="4" stroke-linecap="round"/>'
        : s === "umbieg"
          ? '<path d="M22 44 V28 h16 M30 20 l8 8 -8 8" fill="none" stroke="#1a1a18" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
          : '<path d="M18 32 h24 M32 22 l10 10 -10 10" fill="none" stroke="#1a1a18" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>';
      return svg('<rect x="4" y="14" width="56" height="36" rx="4" fill="#f0c400" stroke="#1a1a18" stroke-width="3"/>' + arrow);
    }
    if (entry.art === "halt") {
      var extra = s === "kreuz"
        ? '<path d="M22 22 l20 20 M42 22 L22 42" stroke="#c41212" stroke-width="4" stroke-linecap="round"/>'
        : '<path d="M20 42 L44 22" stroke="#c41212" stroke-width="4" stroke-linecap="round"/>';
      return svg('<circle cx="32" cy="32" r="26" fill="#1d4e89" stroke="#c41212" stroke-width="6"/>' + extra);
    }
    var inner = "";
    if (s === "balken") inner = '<rect x="14" y="28" width="36" height="8" fill="#fff"/>';
    else if (s === "30" || s === "50" || s === "70") inner = '<text x="32" y="40" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" font-weight="700" fill="#1a1a18">' + s + "</text>";
    else if (s === "ueber") inner = '<path d="M18 40 h10 l6 -8 h8 M18 28 h16" fill="none" stroke="#1a1a18" stroke-width="3" stroke-linecap="round"/><path d="M16 18 L48 48" stroke="#c41212" stroke-width="4"/>';
    else if (s === "rad") inner = '<circle cx="24" cy="40" r="6" fill="none" stroke="#1a1a18" stroke-width="2"/><circle cx="42" cy="40" r="6" fill="none" stroke="#1a1a18" stroke-width="2"/><path d="M24 40 l8 -12 h10 l4 8" fill="none" stroke="#1a1a18" stroke-width="2"/>';
    else if (s === "fuss") inner = '<circle cx="32" cy="24" r="4" fill="#1a1a18"/><path d="M32 28 v10 M26 34 h12 M28 48 l4 -10 4 10" fill="none" stroke="#1a1a18" stroke-width="2" stroke-linecap="round"/>';
    return svg('<circle cx="32" cy="32" r="26" fill="#fff" stroke="#c41212" stroke-width="6"/>' + inner);
  }

  function esc(value) {
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  document.querySelectorAll("[data-schilder]").forEach(function (form) {
    var list = form.querySelector("[data-schild-liste]");
    if (!list) return;
    var nav = document.createElement("div");
    nav.className = "kauf-cats";
    nav.setAttribute("role", "navigation");
    nav.setAttribute("aria-label", "Unterkategorien");
    nav.innerHTML = TEILE.map(function (teil) {
      return '<button type="button" class="chip" data-teil="' + teil.id + '" aria-pressed="false">' + esc(teil.label) + "</button>";
    }).join("");
    form.insertBefore(nav, list);
    nav.addEventListener("click", function (event) {
      var button = event.target.closest("[data-teil]");
      if (!button) return;
      var id = button.getAttribute("data-teil") || "";
      if (new URLSearchParams(location.search).get("gruppe") === "schilder") {
        document.dispatchEvent(new CustomEvent("amk-teil", { detail: id }));
      } else {
        localTeil = id;
        apply();
      }
    });
    list.innerHTML = ZEICHEN.map(function (entry) {
      var title = entry.nr + " " + entry.name;
      return '<div class="schild-row" data-schild="' + entry.id + '" data-teil="' + teilOf(entry) + '">' +
        '<label class="choice"><input type="checkbox" name="schild" value="' + entry.id + '"> ' +
        '<span class="schild-mark">' + mark(entry) + "</span>" +
        "<span><strong>" + esc(entry.nr) + "</strong> " + esc(entry.name) + "</span></label>" +
        '<label class="schild-qty">Anzahl <input type="number" min="1" max="99" value="1" inputmode="numeric" data-menge="' + entry.id + '" aria-label="Anzahl ' + esc(title) + '"></label>' +
        "</div>";
    }).join("");

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!window.AMK_WUNSCH || typeof window.AMK_WUNSCH.add !== "function") return;
      var lines = [];
      ZEICHEN.forEach(function (entry) {
        var box = form.querySelector('input[name="schild"][value="' + entry.id + '"]');
        if (!box || !box.checked) return;
        var qtyField = form.querySelector('[data-menge="' + entry.id + '"]');
        var qty = parseInt(qtyField && qtyField.value, 10);
        if (!qty || qty < 1) qty = 1;
        if (qty > 99) qty = 99;
        var vorgang = form.getAttribute("data-vorgang") === "miete" ? "miete" : "kauf";
        lines.push({
          id: vorgang + ":schild:" + entry.id,
          name: entry.nr + " " + entry.name,
          qty: qty,
          kat: "verkehrssicherung"
        });
      });
      var vorgang = form.getAttribute("data-vorgang") === "miete" ? "miete" : "kauf";
      var noteField = form.elements.hinweis;
      var note = noteField ? String(noteField.value || "").trim() : "";
      if (!lines.length && !note) {
        var first = form.querySelector('.schild-row:not([hidden]) input[name="schild"]');
        if (first) first.focus();
        return;
      }
      if (note) {
        lines.push({
          id: vorgang + ":schild:hinweis",
          name: "Verkehrsschilder",
          qty: 1,
          kat: "verkehrssicherung",
          sammel: true,
          note: note
        });
      }
      window.AMK_WUNSCH.add(lines);
      form.querySelectorAll('input[name="schild"]').forEach(function (box) { box.checked = false; });
      if (noteField) noteField.value = "";
    });
  });

  window.AMK_SCHILDER = ZEICHEN;
  window.AMK_SCHILDER_TEILE = TEILE.map(function (teil) { return teil.id; });
  window.AMK_SCHILDER_UI = {
    sync: apply,
    filter: function (value) {
      query = value || "";
      apply();
    }
  };
  apply();
})();
