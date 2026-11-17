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
      form.querySelectorAll("[data-schild]").forEach(function (row) {
        var title = row.querySelector("strong");
        var text = (title ? title.textContent : "").toLocaleLowerCase("de");
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
    if (!list || !window.AMK_TYPWAHL) return;
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
    list.innerHTML = '<fieldset class="pick-set"><legend>Typ</legend><div class="picks">' +
      ZEICHEN.map(function (entry) {
        return window.AMK_TYPWAHL.card({
          name: "schild",
          value: entry.id,
          title: entry.nr + " " + entry.name,
          media: '<span class="pick-bild">' + mark(entry) + "</span>",
          panelId: "menge-panel-schild-" + entry.id,
          inputId: "menge-schild-" + entry.id,
          data: { schild: entry.id, teil: teilOf(entry) }
        });
      }).join("") + "</div></fieldset>";

    var vorgangForm = form.getAttribute("data-vorgang") === "miete" ? "miete" : "kauf";
    if (window.AMK_WUNSCH && window.AMK_WUNSCH.load) {
      var saved = {};
      window.AMK_WUNSCH.load().forEach(function (item) { saved[item.id] = item; });
      ZEICHEN.forEach(function (entry) {
        var item = saved[vorgangForm + ":schild:" + entry.id];
        if (!item) return;
        var box = form.querySelector('input[name="schild"][value="' + entry.id + '"]');
        var qtyField = form.querySelector("#menge-schild-" + entry.id);
        if (box) box.checked = true;
        if (qtyField && item.qty) qtyField.value = String(item.qty);
        if (box && window.AMK_TYPWAHL) window.AMK_TYPWAHL.reveal(box, false);
      });
    }

    form.addEventListener("change", function (event) {
      var box = event.target;
      if (!box || box.name !== "schild" || box.checked) return;
      if (window.AMK_WUNSCH && window.AMK_WUNSCH.remove) {
        var vorgang = form.getAttribute("data-vorgang") === "miete" ? "miete" : "kauf";
        window.AMK_WUNSCH.remove(vorgang + ":schild:" + box.value);
      }
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!window.AMK_WUNSCH || typeof window.AMK_WUNSCH.replace !== "function") return;
      var lines = [];
      var invalid = null;
      ZEICHEN.forEach(function (entry) {
        if (invalid) return;
        var box = form.querySelector('input[name="schild"][value="' + entry.id + '"]');
        if (!box || !box.checked) return;
        var qtyField = form.querySelector("#menge-schild-" + entry.id);
        var qty = parseInt(qtyField && qtyField.value, 10);
        if (!qty || qty < 1 || qty > 99) {
          invalid = qtyField;
          return;
        }
        var vorgang = form.getAttribute("data-vorgang") === "miete" ? "miete" : "kauf";
        lines.push({
          id: vorgang + ":schild:" + entry.id,
          name: entry.nr + " " + entry.name,
          qty: qty,
          kat: "verkehrssicherung"
        });
      });
      if (invalid) {
        invalid.setAttribute("aria-invalid", "true");
        invalid.focus();
        return;
      }
      var vorgang = form.getAttribute("data-vorgang") === "miete" ? "miete" : "kauf";
      var noteField = form.elements.hinweis;
      var note = noteField ? String(noteField.value || "").trim() : "";
      if (!lines.length && !note) {
        var first = form.querySelector('[data-schild]:not([hidden]) input[name="schild"]');
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
      var vorgangNow = form.getAttribute("data-vorgang") === "miete" ? "miete" : "kauf";
      ZEICHEN.forEach(function (entry) {
        var box = form.querySelector('input[name="schild"][value="' + entry.id + '"]');
        if (box && box.checked) return;
        if (window.AMK_WUNSCH.remove) window.AMK_WUNSCH.remove(vorgangNow + ":schild:" + entry.id);
      });
      if (!note && window.AMK_WUNSCH.remove) window.AMK_WUNSCH.remove(vorgangNow + ":schild:hinweis");
      if (lines.length) window.AMK_WUNSCH.replace(lines);
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
