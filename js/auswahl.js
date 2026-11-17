(function () {
  /* Eine Auswahl für Miete und Kauf: Pills, Typ-Karten, Anzahl.
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

  function picture(product, root) {
    if (!product.bild) return FALLBACK;
    return '<img src="' + esc(root + product.bild) + '" alt="" width="' + (product.width || 640) + '" height="' + (product.height || 480) + '" decoding="async">';
  }

  function updateSum(node) {
    var form = node.querySelector("form");
    if (!form) return;
    var radio = form.querySelector('input[name="typ"]:checked');
    var product = null;
    if (radio && products) {
      products.forEach(function (entry) { if (entry.slug === radio.value) product = entry; });
    }
    var qtyField = form.elements.menge;
    var qty = parseInt(qtyField && qtyField.value, 10);
    if (!qty || qty < 1) qty = 1;
    var von = form.elements.von;
    var bis = form.elements.bis;
    var zeit = von && bis && von.value && bis.value ? de(von.value) + "–" + de(bis.value) : "";
    var name = product ? product.name : "";
    var short = node.querySelector('[data-sum="short"]');
    var typ = node.querySelector('[data-sum="typ"]');
    var menge = node.querySelector('[data-sum="menge"]');
    var zeitNode = node.querySelector('[data-sum="zeit"]');
    if (short) short.textContent = name ? name + " · " + qty + (zeit ? " · " + zeit : "") : "";
    if (typ) typ.textContent = name || "–";
    if (menge) menge.textContent = String(qty);
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
    if (!products || !TEILE[gruppe]) return;
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
    var pills = teile.length > 1
      ? '<div class="kauf-cats" role="navigation" aria-label="Unterkategorien">' + teile.map(function (entry) {
        var on = entry.id === teilId;
        return '<button type="button" class="chip" data-teil="' + entry.id + '" aria-pressed="' + (on ? "true" : "false") + '">' + esc(entry.label) + "</button>";
      }).join("") + "</div>"
      : "";
    var cards = list.map(function (product, index) {
      return '<label class="pick">' + picture(product, root) +
        "<span><input type=\"radio\" name=\"typ\" value=\"" + esc(product.slug) + "\"" + (index === 0 ? " checked" : "") + " required>" +
        "<strong>" + esc(product.name) + "</strong></span></label>";
    }).join("");
    var zeit = "";
    if (vorgang === "miete") {
      zeit = '<fieldset class="choices"><legend>Zeitraum</legend><div class="form-grid">' +
        '<div class="field"><label for="von-' + gruppe + '">Von</label><input id="von-' + gruppe + '" name="von" type="date" autocomplete="off" required></div>' +
        '<div class="field"><label for="bis-' + gruppe + '">Bis</label><input id="bis-' + gruppe + '" name="bis" type="date" autocomplete="off" required></div>' +
        "</div></fieldset>";
    }
    node.innerHTML = pills +
      '<form class="konfig-layout">' +
      '<div class="konfig-main">' +
      '<fieldset class="pick-set"><legend>Typ</legend><div class="picks">' + cards + "</div></fieldset>" +
      '<fieldset class="choices"><legend id="legende-menge-' + gruppe + '">Anzahl</legend><div class="field">' +
      '<input id="menge-' + gruppe + '" name="menge" type="number" min="1" max="99" value="1" inputmode="numeric" required aria-labelledby="legende-menge-' + gruppe + '"></div></fieldset>' +
      zeit +
      "</div>" +
      '<aside class="konfig-summary" aria-live="polite"><h2>Ihre Auswahl</h2>' +
      '<p class="sum-short" data-sum="short"></p><dl class="sum-full">' +
      '<div><dt>Typ</dt><dd data-sum="typ">–</dd></div>' +
      '<div><dt>Anzahl</dt><dd data-sum="menge">1</dd></div>' +
      (vorgang === "miete" ? '<div><dt>Zeitraum</dt><dd data-sum="zeit">–</dd></div>' : "") +
      "</dl><p class=\"price-once\">Preis auf Anfrage</p>" +
      '<button class="btn" type="submit">In den Anfragekorb</button></aside></form>';
    var von = node.querySelector('[name="von"]');
    var bis = node.querySelector('[name="bis"]');
    if (von && bis && window.AMK_ZEIT) window.AMK_ZEIT.bindPair(von, bis);
    updateSum(node);
  }

  function submit(node, event) {
    var form = event.target.closest("form");
    if (!form || !node.contains(form) || !window.AMK_WUNSCH) return;
    event.preventDefault();
    var gruppe = node.getAttribute("data-gruppe") || "";
    var vorgang = node.getAttribute("data-vorgang") === "miete" ? "miete" : "kauf";
    var radio = form.querySelector('input[name="typ"]:checked');
    var qtyField = form.elements.menge;
    var qty = parseInt(qtyField && qtyField.value, 10);
    if (!radio) {
      var first = form.querySelector('input[name="typ"]');
      if (first) first.focus();
      return;
    }
    if (!qty || qty < 1 || qty > 99) {
      if (qtyField) qtyField.focus();
      return;
    }
    var product = null;
    (products || []).forEach(function (entry) { if (entry.slug === radio.value) product = entry; });
    if (!product) return;
    var item = {
      id: vorgang + ":" + product.slug,
      name: product.name,
      qty: qty,
      bild: product.bild || "",
      kat: KAT[gruppe] || ""
    };
    if (vorgang === "miete") {
      var von = form.elements.von;
      var bis = form.elements.bis;
      if (!von.value) { von.focus(); return; }
      if (!bis.value) { bis.focus(); return; }
      if (window.AMK_ZEIT && !window.AMK_ZEIT.checkPair(von, bis)) return;
      item.von = von.value;
      item.bis = bis.value;
    }
    window.AMK_WUNSCH.add(item);
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
    node.addEventListener("change", function () { updateSum(node); });
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
