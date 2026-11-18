(function () {
  /* Eine Auswahl für Miete und Kauf: Pills und die gemeinsame Typ-Karte.
     Zeitraum nur bei Miete. Inhalte nur aus data/katalog.json. */
  var TEILE = {
    gitter: [
      { id: "gitter", shop: "gitter" }
    ],
    absperrung: [
      { id: "schranken", label: "Absperrschranken", shop: "verkehr", art: "Schranken" },
      { id: "baken", label: "Leitbaken", shop: "verkehr", art: "Baken" },
      { id: "schwellen", label: "Betonleitschwellen", shop: "verkehr", art: "Betonschwellen" },
      { id: "schleuse", label: "Schleusen", shop: "verkehr", art: "Schleuse" },
      { id: "buehne", label: "Bühne", shop: "verkehr", art: "Bühne" }
    ],
    anhaenger: [
      { id: "hochlader", label: "Hochlader", shop: "anhaenger", art: "Hochlader" },
      { id: "plane", label: "Planenanhänger", shop: "anhaenger", art: "Planenanhänger" },
      { id: "koffer", label: "Kofferanhänger", shop: "anhaenger", art: "Kofferanhänger" },
      { id: "transporter", label: "Fahrzeugtransporter", shop: "anhaenger", art: "Fahrzeugtransporter" },
      { id: "kuehl", label: "Kühlanhänger", shop: "anhaenger", art: "Kühlanhänger" }
    ]
  };
  var KAT = { gitter: "bauzaun", absperrung: "verkehrssicherung", anhaenger: "anhaenger" };
  var FALLBACK = '<svg class="pick-fallback" viewBox="0 0 64 48" aria-hidden="true" focusable="false"><rect x="5" y="8" width="54" height="32" rx="4" fill="none" stroke="#1a1a18" stroke-width="2"/><path d="M5 32 l16-12 10 8 8-6 20 14" fill="none" stroke="#1a1a18" stroke-width="2" stroke-linejoin="round"/></svg>';

  var products = null;
  var waiters = [];
  var loading = false;
  var failed = false;

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function de(value) {
    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
    return match ? match[3] + "." + match[2] + "." + match[1] : "";
  }

  function ids(gruppe) {
    return (TEILE[gruppe] || []).map(function (teil) { return teil.id; });
  }

  function matches(product, teil) {
    if (!product || product.shop !== teil.shop) return false;
    if (teil.art && ((product.attr || {}).art || "") !== teil.art) return false;
    return true;
  }

  function liveTeile(gruppe) {
    return (TEILE[gruppe] || []).filter(function (teil) {
      return products.some(function (product) { return matches(product, teil); });
    });
  }

  function selectedTeil(gruppe) {
    var teile = liveTeile(gruppe);
    if (!teile.length) return "";
    if (teile.length === 1) return teile[0].id;
    var want = new URLSearchParams(location.search).get("teil") || "";
    for (var i = 0; i < teile.length; i++) if (teile[i].id === want) return want;
    return teile[0].id;
  }

  function eckdaten(slug) {
    var rows = window.AMK_ANHAENGER_ECKDATEN && window.AMK_ANHAENGER_ECKDATEN[slug];
    if (!rows || !rows.length) return "";
    return '<details class="anhaenger-details"><summary>Details</summary><table class="spec-table">' +
      rows.map(function (row) {
        return "<tr><th scope=\"row\">" + esc(row[0]) + "</th><td>" + esc(row[1]) + "</td></tr>";
      }).join("") + "</table></details>";
  }

  function picture(product, root) {
    if (!product.bild) return FALLBACK;
    return '<img src="' + esc(root + product.bild) + '" alt="" width="' + (product.width || 640) + '" height="' + (product.height || 480) + '" decoding="async">';
  }

  function cartById() {
    var map = {};
    if (!window.AMK_WUNSCH || !window.AMK_WUNSCH.load) return map;
    window.AMK_WUNSCH.load().forEach(function (item) { map[item.id] = item; });
    return map;
  }

  function chosen(form) {
    var list = [];
    form.querySelectorAll('input[name="typ"]:checked').forEach(function (box) {
      var product = null;
      (products || []).forEach(function (entry) { if (entry.slug === box.value) product = entry; });
      if (!product) return;
      var field = form.querySelector('[data-menge-fuer="' + box.value + '"] [data-menge]');
      var ohne = !field;
      var qty = ohne ? 1 : parseInt(field.value, 10);
      list.push({ product: product, field: field, qty: qty, ohne: ohne });
    });
    return list;
  }

  function updateSum(node) {
    var form = node.querySelector("form");
    if (!form) return;
    var list = chosen(form);
    var von = form.elements.von;
    var bis = form.elements.bis;
    var zeit = von && bis && von.value && bis.value ? de(von.value) + "–" + de(bis.value) : "";
    var short = node.querySelector('[data-sum="short"]');
    var liste = node.querySelector('[data-sum="liste"]');
    var zeitNode = node.querySelector('[data-sum="zeit"]');
    var bits = list.map(function (entry) {
      if (entry.ohne) return entry.product.name;
      return entry.product.name + " · " + (entry.qty > 0 ? entry.qty : "–");
    });
    if (zeit) bits.push(zeit);
    if (short) short.textContent = bits.join("; ") || "–";
    if (liste) {
      liste.innerHTML = list.length ? list.map(function (entry) {
        var menge = entry.ohne ? "" : "<dd>" + (entry.qty > 0 ? entry.qty : "–") + "</dd>";
        return "<div><dt>" + esc(entry.product.name) + "</dt>" + menge + "</div>";
      }).join("") : "<div><dt>Typ</dt><dd>–</dd></div>";
    }
    if (zeitNode) zeitNode.textContent = zeit || "–";
  }

  function paint(node) {
    var gruppe = node.getAttribute("data-gruppe") || "";
    var vorgang = node.getAttribute("data-vorgang") === "miete" ? "miete" : "kauf";
    var root = node.getAttribute("data-root") || "../";
    if (failed) {
      node.innerHTML = "<p>Das Sortiment konnte nicht geladen werden.</p>";
      return;
    }
    if (!products || !TEILE[gruppe] || !window.AMK_TYPWAHL) return;
    var teile = liveTeile(gruppe);
    var teilId = selectedTeil(gruppe);
    var key = gruppe + ":" + teilId + ":" + vorgang;
    if (node.dataset.key === key && node.querySelector("form")) {
      updateSum(node);
      return;
    }
    node.dataset.key = key;
    var teil = null;
    teile.forEach(function (entry) { if (entry.id === teilId) teil = entry; });
    if (!teil) {
      node.innerHTML = "";
      return;
    }
    var list = products.filter(function (product) { return matches(product, teil); });
    var saved = cartById();
    var keptVon = "";
    var keptBis = "";
    var prevVon = node.querySelector('[name="von"]');
    var prevBis = node.querySelector('[name="bis"]');
    if (prevVon) keptVon = prevVon.value;
    if (prevBis) keptBis = prevBis.value;
    if (vorgang === "miete" && (!keptVon || !keptBis)) {
      list.forEach(function (product) {
        var item = saved[vorgang + ":" + product.slug];
        if (!item || !item.von || !item.bis) return;
        if (!keptVon) keptVon = item.von;
        if (!keptBis) keptBis = item.bis;
      });
    }
    var pills = teile.length > 1
      ? '<div class="kauf-cats" role="navigation" aria-label="Unterkategorien">' + teile.map(function (entry) {
        var on = entry.id === teilId;
        return '<button type="button" class="chip" data-teil="' + entry.id + '" aria-pressed="' + (on ? "true" : "false") + '">' + esc(entry.label) + "</button>";
      }).join("") + "</div>"
      : "";
    var cards = list.map(function (product) {
      var existing = saved[vorgang + ":" + product.slug];
      var on = !!existing;
      var qty = existing && existing.qty ? existing.qty : 1;
      return window.AMK_TYPWAHL.card({
        name: "typ",
        value: product.slug,
        title: product.name,
        media: picture(product, root),
        checked: on,
        qty: qty,
        menge: !(vorgang === "miete" && gruppe === "anhaenger"),
        panelId: "menge-panel-" + gruppe + "-" + product.slug,
        inputId: "menge-" + gruppe + "-" + product.slug,
        extra: gruppe === "anhaenger" ? eckdaten(product.slug) : ""
      });
    }).join("");
    var zeit = "";
    if (vorgang === "miete") {
      zeit = '<fieldset class="choices"><legend>Zeitraum</legend><div class="form-grid">' +
        '<div class="field"><label for="von-' + gruppe + '">Von</label><input id="von-' + gruppe + '" name="von" type="date" autocomplete="off"></div>' +
        '<div class="field"><label for="bis-' + gruppe + '">Bis</label><input id="bis-' + gruppe + '" name="bis" type="date" autocomplete="off"></div>' +
        "</div></fieldset>";
    }
    node.innerHTML = pills +
      '<form class="konfig-layout">' +
      '<div class="konfig-main">' +
      '<fieldset class="pick-set"><legend>Typ</legend><div class="picks">' + cards + "</div></fieldset>" +
      zeit +
      "</div>" +
      '<aside class="konfig-summary" aria-live="polite"><h2>Ihre Auswahl</h2>' +
      '<p class="sum-short" data-sum="short"></p><dl class="sum-full">' +
      '<div class="sum-lines" data-sum="liste"></div>' +
      (vorgang === "miete" ? '<div><dt>Zeitraum</dt><dd data-sum="zeit">–</dd></div>' : "") +
      "</dl><p class=\"price-once\">Preis auf Anfrage</p>" +
      '<p class="form-status" data-status role="status"></p>' +
      '<button class="btn" type="submit">In den Anfragekorb</button></aside></form>';
    var von = node.querySelector('[name="von"]');
    var bis = node.querySelector('[name="bis"]');
    if (von && keptVon) von.value = keptVon;
    if (bis && keptBis) bis.value = keptBis;
    if (von && bis && window.AMK_ZEIT) window.AMK_ZEIT.bindPair(von, bis);
    updateSum(node);
  }

  function submit(node, event) {
    var form = event.target.closest("form");
    if (!form || !node.contains(form) || !window.AMK_WUNSCH) return;
    event.preventDefault();
    var gruppe = node.getAttribute("data-gruppe") || "";
    var vorgang = node.getAttribute("data-vorgang") === "miete" ? "miete" : "kauf";
    var status = form.querySelector("[data-status]");
    if (status) {
      status.textContent = "";
      status.classList.remove("is-error");
    }
    var list = chosen(form);
    if (!list.length) {
      var first = form.querySelector('input[name="typ"]');
      if (first) first.focus();
      return;
    }
    var lines = [];
    for (var i = 0; i < list.length; i++) {
      var entry = list[i];
      if (!entry.ohne && (!entry.qty || entry.qty < 1 || entry.qty > 99)) {
        if (status) {
          status.textContent = "Bitte die Anzahl angeben.";
          status.classList.add("is-error");
        }
        if (entry.field) {
          entry.field.setAttribute("aria-invalid", "true");
          entry.field.focus();
        }
        return;
      }
      var item = {
        id: vorgang + ":" + entry.product.slug,
        name: entry.product.name,
        qty: entry.qty,
        bild: entry.product.bild || "",
        kat: KAT[gruppe] || ""
      };
      if (entry.ohne) item.sammel = true;
      lines.push(item);
    }
    if (vorgang === "miete") {
      var von = form.elements.von;
      var bis = form.elements.bis;
      if (!von.value) { von.focus(); return; }
      if (!bis.value) { bis.focus(); return; }
      if (window.AMK_ZEIT && !window.AMK_ZEIT.checkPair(von, bis)) return;
      lines.forEach(function (item) {
        item.von = von.value;
        item.bis = bis.value;
      });
    }
    form.querySelectorAll('input[name="typ"]').forEach(function (box) {
      if (!box.checked && window.AMK_WUNSCH.remove) window.AMK_WUNSCH.remove(vorgang + ":" + box.value);
    });
    window.AMK_WUNSCH.replace(lines);
  }

  function bind(node) {
    if (node.dataset.bound) return;
    node.dataset.bound = "1";
    node.addEventListener("click", function (event) {
      var button = event.target.closest("button[data-teil]");
      if (!button || !node.contains(button)) return;
      document.dispatchEvent(new CustomEvent("amk-teil", { detail: button.getAttribute("data-teil") || "" }));
    });
    node.addEventListener("input", function () { updateSum(node); });
    node.addEventListener("change", function (event) {
      var box = event.target;
      if (box && box.name === "typ" && !box.checked && window.AMK_WUNSCH.remove) {
        var vorgang = node.getAttribute("data-vorgang") === "miete" ? "miete" : "kauf";
        window.AMK_WUNSCH.remove(vorgang + ":" + box.value);
      }
      updateSum(node);
    });
    node.addEventListener("submit", function (event) { submit(node, event); });
  }

  function visible(node) {
    if (node.hidden) return false;
    var parent = node.parentElement;
    while (parent) {
      if (parent.hidden) return false;
      parent = parent.parentElement;
    }
    return true;
  }

  function sync() {
    document.querySelectorAll("[data-auswahl]").forEach(function (node) {
      bind(node);
      if (!visible(node)) return;
      ensure(function () { paint(node); });
    });
  }

  function ensure(done) {
    if (products || failed) { done(); return; }
    waiters.push(done);
    if (loading) return;
    loading = true;
    var host = document.querySelector("[data-auswahl]");
    var root = host ? (host.getAttribute("data-root") || "../") : "../";
    fetch(root + "data/katalog.json")
      .then(function (response) { return response.json(); })
      .then(function (data) {
        products = Array.isArray(data) ? data : [];
        waiters.splice(0).forEach(function (fn) { fn(); });
      })
      .catch(function () {
        failed = true;
        waiters.splice(0).forEach(function (fn) { fn(); });
      });
  }

  var exported = { teile: {}, sync: sync };
  Object.keys(TEILE).forEach(function (gruppe) {
    if (gruppe === "gitter") return;
    exported.teile[gruppe] = ids(gruppe);
  });
  window.AMK_AUSWAHL = exported;
  sync();
})();
