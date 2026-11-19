(function () {
  /* Schilderliste. Die Kauf-Kachel kommt über die gemeinsame Typ-Karte.
     Dateien und Lizenz: images/schilder/CREDITS.md */
  var ZEICHEN = [
    { id: "z123", nr: "Z 123", name: "Arbeitsstelle", art: "gefahr", bild: "images/schilder/z123.svg" },
    { id: "z120", nr: "Z 120", name: "Verengte Fahrbahn", art: "gefahr", bild: "images/schilder/z120.svg" },
    { id: "z121-10", nr: "Z 121-10", name: "Einseitig verengte Fahrbahn, rechts", art: "gefahr", bild: "images/schilder/z121-10.svg" },
    { id: "z121-20", nr: "Z 121-20", name: "Einseitig verengte Fahrbahn, links", art: "gefahr", bild: "images/schilder/z121-20.svg" },
    { id: "z208", nr: "Z 208", name: "Dem Gegenverkehr Vorrang gewähren", art: "quadrat", bild: "images/schilder/z208.svg" },
    { id: "z308", nr: "Z 308", name: "Vorrang vor dem Gegenverkehr", art: "quadrat", bild: "images/schilder/z308.svg" },
    { id: "z222", nr: "Z 222", name: "Rechts vorbei", art: "gebot", bild: "images/schilder/z222.svg" },
    { id: "z250", nr: "Z 250", name: "Verbot für Fahrzeuge aller Art", art: "verbot", bild: "images/schilder/z250.svg" },
    { id: "z255", nr: "Z 255", name: "Verbot für Krafträder", art: "verbot", bild: "images/schilder/z255.svg" },
    { id: "z267", nr: "Z 267", name: "Verbot der Einfahrt", art: "verbot", bild: "images/schilder/z267.svg" },
    { id: "z274-30", nr: "Z 274-30", name: "Zulässige Höchstgeschwindigkeit 30", art: "verbot", bild: "images/schilder/z274-30.svg" },
    { id: "z274-50", nr: "Z 274-50", name: "Zulässige Höchstgeschwindigkeit 50", art: "verbot", bild: "images/schilder/z274-50.svg" },
    { id: "z274-70", nr: "Z 274-70", name: "Zulässige Höchstgeschwindigkeit 70", art: "verbot", bild: "images/schilder/z274-70.svg" },
    { id: "z276", nr: "Z 276", name: "Überholverbot", art: "verbot", bild: "images/schilder/z276.svg" },
    { id: "z283", nr: "Z 283", name: "Absolutes Haltverbot", art: "halt", bild: "images/schilder/z283.svg" },
    { id: "z286", nr: "Z 286", name: "Eingeschränktes Haltverbot", art: "halt", bild: "images/schilder/z286.svg" },
    { id: "z259", nr: "Z 259", name: "Verbot für Fußgänger", art: "verbot", bild: "images/schilder/z259.svg" },
    { id: "z454", nr: "Z 454-20", name: "Umleitungswegweiser", art: "umleitung", bild: "images/schilder/z454.svg" },
    { id: "z455", nr: "Z 455.1", name: "Ankündigung der Umleitung", art: "umleitung", bild: "images/schilder/z455.svg" },
    { id: "z457", nr: "Z 457.1", name: "Umleitungsankündigung", art: "umleitung", bild: "images/schilder/z457.svg" },
    { id: "z600", nr: "Z 600-30", name: "Absperrschranke", art: "einrichtung", bild: "images/schilder/z600.svg" },
    { id: "z605", nr: "Z 605-10", name: "Leitbake", art: "einrichtung", bild: "images/schilder/z605.svg" }
  ];

  var TEILE = [
    { id: "gefahr", label: "Gefahrzeichen", art: { gefahr: 1 } },
    { id: "vorschrift", label: "Vorschriftzeichen", art: { quadrat: 1, gebot: 1, verbot: 1, halt: 1 } },
    { id: "richt", label: "Richtzeichen", art: { umleitung: 1 } },
    { id: "einrichtung", label: "Verkehrseinrichtungen", art: { einrichtung: 1 } }
  ];
  var query = "";
  var localTeil = "";

  function teilOf(entry) {
    var found = TEILE[0].id;
    TEILE.forEach(function (teil) { if (teil.art[entry.art]) found = teil.id; });
    return found;
  }

  function signGroup(value) {
    var gruppe = value || "";
    if (window.AMK_GRUPPEN && typeof window.AMK_GRUPPEN.canon === "function") gruppe = window.AMK_GRUPPEN.canon(gruppe);
    return gruppe === "verkehr";
  }

  function teilNow() {
    var params = new URLSearchParams(location.search);
    var teil = params.get("teil") || "";
    if (signGroup(params.get("gruppe")) && TEILE.some(function (entry) { return entry.id === teil; })) {
      localTeil = teil;
      return teil;
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
        var title = row.querySelector("strong, h3");
        var text = (title ? title.textContent : "").toLocaleLowerCase("de");
        row.hidden = row.getAttribute("data-teil") !== teil || !!(q && text.indexOf(q) === -1);
      });
    });
  }

  function assetRoot() {
    var nodes = document.getElementsByTagName("script");
    var i;
    for (i = 0; i < nodes.length; i++) {
      var src = nodes[i].getAttribute("src") || "";
      var at = src.indexOf("js/schilder.js");
      if (at >= 0) return src.slice(0, at);
    }
    return "";
  }

  function esc(value) {
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  document.querySelectorAll("[data-schilder]").forEach(function (form) {
    var list = form.querySelector("[data-schild-liste]");
    if (!list || !window.AMK_TYPWAHL) return;
    if (!form.hasAttribute("data-ohne-pills")) {
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
        localTeil = id;
        apply();
        document.dispatchEvent(new CustomEvent("amk-zeichen", { detail: id }));
      });
    }
    var kachel = form.getAttribute("data-vorgang") !== "miete";
    var karten = ZEICHEN.map(function (entry) {
      var bild = '<img src="' + esc(assetRoot() + entry.bild) + '" alt="" width="96" height="96" decoding="async">';
      return window.AMK_TYPWAHL.card({
        name: "schild",
        value: entry.id,
        title: entry.nr + " " + entry.name,
        media: kachel ? bild : '<span class="pick-bild">' + bild + "</span>",
        panelId: "menge-panel-schild-" + entry.id,
        inputId: "menge-schild-" + entry.id,
        data: { schild: entry.id, teil: teilOf(entry) },
        kachel: kachel,
        href: kachel ? assetRoot() + "produkt/schild-" + entry.id + "/" : ""
      });
    }).join("");
    list.innerHTML = kachel
      ? '<div class="tiles">' + karten + "</div>"
      : '<fieldset class="pick-set"><legend>Typ</legend><div class="picks">' + karten + "</div></fieldset>";

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

    function writeCart(interactive) {
      if (!window.AMK_WUNSCH || typeof window.AMK_WUNSCH.replace !== "function") return;
      var lines = [];
      var invalid = null;
      ZEICHEN.forEach(function (entry) {
        if (invalid) return;
        var box = form.querySelector('input[name="schild"][value="' + entry.id + '"]');
        if (!box || !box.checked) return;
        var qtyField = form.querySelector("#menge-schild-" + entry.id);
        var qty = parseInt(qtyField && qtyField.value, 10);
        if (!qty || qty < 1 || qty > 9999) {
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
        if (!interactive) return;
        var row = invalid.closest("[data-schild]");
        if (row && row.hidden && window.AMK_SCHILDER_UI && window.AMK_SCHILDER_UI.open) {
          window.AMK_SCHILDER_UI.open(row.getAttribute("data-teil") || "");
        }
        invalid.focus();
        return;
      }
      var vorgang = form.getAttribute("data-vorgang") === "miete" ? "miete" : "kauf";
      var noteField = form.elements.hinweis;
      var note = noteField ? String(noteField.value || "").trim() : "";
      if (!lines.length && !note && interactive && !form.hasAttribute("data-leer-ok")) {
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
      if (!lines.length) return;
      if (interactive) window.AMK_WUNSCH.replace(lines);
      else {
        var kept = window.AMK_WUNSCH.load().filter(function (item) {
          return !lines.some(function (line) { return line.id === item.id; });
        });
        lines.forEach(function (line) { kept.push(line); });
        window.AMK_WUNSCH.save(kept, true);
      }
    }

    form.addEventListener("change", function (event) {
      var box = event.target;
      if (box && box.name === "schild" && !box.checked && window.AMK_WUNSCH && window.AMK_WUNSCH.remove) {
        var vorgang = form.getAttribute("data-vorgang") === "miete" ? "miete" : "kauf";
        window.AMK_WUNSCH.remove(vorgang + ":schild:" + box.value);
      }
      if (form.getAttribute("data-vorgang") !== "miete") writeCart(false);
    });

    form.addEventListener("input", function (event) {
      if (form.getAttribute("data-vorgang") === "miete") return;
      var target = event.target;
      if (!target || (target.type !== "number" && target.name !== "hinweis")) return;
      writeCart(false);
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      writeCart(true);
    });

    if (form.getAttribute("data-vorgang") !== "miete") {
      form.querySelectorAll('button[type="submit"]').forEach(function (button) {
        var link = document.createElement("a");
        link.className = "btn";
        link.href = assetRoot() + "anfrage/";
        link.textContent = "Zum Anfragekorb";
        button.replaceWith(link);
      });
    }
  });

  window.AMK_SCHILDER = ZEICHEN;
  window.AMK_SCHILDER_TEILE = TEILE.map(function (teil) { return teil.id; });
  window.AMK_SCHILDER_UI = {
    sync: apply,
    open: function (id) {
      if (TEILE.some(function (entry) { return entry.id === id; })) localTeil = id;
      apply();
    },
    filter: function (value) {
      query = value || "";
      apply();
    }
  };
  apply();
})();
