(function () {
  /* Eine Auswahl für Miete und Kauf: Pills und die gemeinsame Typ-Karte.
     Zeitraum nur bei Miete. Inhalte nur aus data/katalog.json. */
  var LEIT = [
    { id: "schwellen", label: "Betonleitschwellen", shop: "verkehr", art: "Betonschwellen" },
    { id: "schleuse", label: "Schleusen", shop: "verkehr", art: "Schleuse" },
    { id: "buehne", label: "Bühne", shop: "verkehr", art: "Bühne" }
  ];
  var TEILE = {
    gitter: [
      { id: "gitter", shop: "gitter" }
    ],
    absperrung: [
      { id: "schranken", label: "Absperrschranken", shop: "verkehr", art: "Schranken" },
      { id: "baken", label: "Leitbaken", shop: "verkehr", art: "Baken" }
    ].concat(LEIT),
    leit: LEIT,
    anhaenger: [
      { id: "hochlader", label: "Hochlader", shop: "anhaenger", art: "Hochlader" },
      { id: "plane", label: "Planenanhänger", shop: "anhaenger", art: "Planenanhänger" },
      { id: "koffer", label: "Kofferanhänger", shop: "anhaenger", art: "Kofferanhänger" },
      { id: "transporter", label: "Fahrzeugtransporter", shop: "anhaenger", art: "Fahrzeugtransporter" },
      { id: "kuehl", label: "Kühlanhänger", shop: "anhaenger", art: "Kühlanhänger" }
    ]
  };
  var KAT = { gitter: "bauzaun", absperrung: "verkehrssicherung", leit: "verkehrssicherung", anhaenger: "anhaenger" };
  var FALLBACK = '<svg class="pick-fallback" viewBox="0 0 64 48" aria-hidden="true" focusable="false"><rect x="5" y="8" width="54" height="32" rx="4" fill="none" stroke="#1a1a18" stroke-width="2"/><path d="M5 32 l16-12 10 8 8-6 20 14" fill="none" stroke="#1a1a18" stroke-width="2" stroke-linejoin="round"/></svg>';

  var products = null;
  var waiters = [];
  var loading = false;
  var failed = false;

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
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
    var params = new URLSearchParams(location.search);
    var want = params.get("teil") || "";
    var known = false;
    for (var i = 0; i < teile.length; i++) if (teile[i].id === want) known = true;
    if (!known) want = params.get("unter") || "";
    for (var j = 0; j < teile.length; j++) if (teile[j].id === want) return want;
    return teile[0].id;
  }

  function eckdaten(slug) {
    var rows = window.AMK_ANHAENGER_ECKDATEN && window.AMK_ANHAENGER_ECKDATEN[slug];
    if (!rows || !rows.length) return "";
    return '<details class="anhaenger-details"><summary>Eckdaten anzeigen</summary><table class="spec-table">' +
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

  function zeileVon(box) {
    var block = box && box.closest ? box.closest(".pick-block") : null;
    var title = block ? block.querySelector("strong") : null;
    var field = block ? block.querySelector("[data-menge]") : null;
    var name = title ? title.textContent.trim() : "";
    var menge = "";
    if (field) {
      var qty = parseInt(field.value, 10);
      menge = qty > 0 ? String(qty) : "–";
    }
    return { name: name, menge: menge };
  }

  function fillLeiste(aside, lines) {
    if (!aside) return;
    var short = aside.querySelector('[data-sum="short"]');
    var liste = aside.querySelector('[data-sum="liste"]');
    var rows = lines || [];
    var bits = rows.map(function (line) {
      return line.menge ? line.name + " · " + line.menge : line.name;
    });
    if (short) short.textContent = bits.join("; ") || "–";
    if (liste) {
      liste.innerHTML = rows.length ? rows.map(function (line) {
        var menge = line.menge ? "<dd>" + esc(line.menge) + "</dd>" : "";
        return "<div><dt>" + esc(line.name) + "</dt>" + menge + "</div>";
      }).join("") : "<div><dt>Typ</dt><dd>–</dd></div>";
    }
    aside.classList.toggle("is-leer", !rows.length);
  }

  function updateSum(node) {
    var form = node.querySelector("form");
    if (!form) return;
    var lines = chosen(form).map(function (entry) {
      return {
        name: entry.product.name,
        menge: entry.ohne ? "" : (entry.qty > 0 ? String(entry.qty) : "–")
      };
    });
    fillLeiste(node.querySelector(".konfig-summary"), lines);
    document.dispatchEvent(new CustomEvent("amk-auswahl"));
  }

  function showTeil(node, gruppe) {
    var teilId = selectedTeil(gruppe);
    node.querySelectorAll("[data-teil-karte]").forEach(function (card) {
      card.hidden = card.getAttribute("data-teil-karte") !== teilId;
    });
    node.querySelectorAll("button[data-teil]").forEach(function (button) {
      var on = button.getAttribute("data-teil") === teilId;
      button.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function statusOf(node, form) {
    var status = form.querySelector("[data-status]");
    if (status) return status;
    var layout = node.closest(".konfig-layout");
    return layout ? layout.querySelector(".konfig-summary [data-status]") : null;
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
    var bare = node.hasAttribute("data-ohne-leiste") ? "1" : "0";
    var key = gruppe + ":" + vorgang + ":" + bare;
    if (!teile.length) {
      node.innerHTML = "";
      delete node.dataset.key;
      return;
    }
    if (node.dataset.key === key && node.querySelector("form")) {
      showTeil(node, gruppe);
      updateSum(node);
      return;
    }
    node.dataset.key = key;
    var teilId = selectedTeil(gruppe);
    var saved = cartById();
    var pills = teile.length > 1
      ? '<div class="kauf-cats" role="navigation" aria-label="Unterkategorien">' + teile.map(function (entry) {
        var on = entry.id === teilId;
        return '<button type="button" class="chip" data-teil="' + entry.id + '" aria-pressed="' + (on ? "true" : "false") + '">' + esc(entry.label) + "</button>";
      }).join("") + "</div>"
      : "";
    var cards = "";
    teile.forEach(function (entry) {
      products.filter(function (product) { return matches(product, entry); }).forEach(function (product) {
        var existing = saved[vorgang + ":" + product.slug];
        var on = !!existing;
        var qty = existing && existing.qty ? existing.qty : 1;
        var hide = entry.id === teilId ? "" : " hidden";
        cards += '<div data-teil-karte="' + esc(entry.id) + '"' + hide + ">" + window.AMK_TYPWAHL.card({
          name: "typ",
          value: product.slug,
          title: product.name,
          note: product.kicker || "",
          media: picture(product, root),
          checked: on,
          qty: qty,
          menge: !(vorgang === "miete" && gruppe === "anhaenger"),
          panelId: "menge-panel-" + gruppe + "-" + product.slug,
          inputId: "menge-" + gruppe + "-" + product.slug,
          extra: gruppe === "anhaenger" ? eckdaten(product.slug) : "",
          href: vorgang === "kauf" ? root + "produkt/" + product.slug + "/" : ""
        }) + "</div>";
      });
    });
    var aside = bare === "1" ? "" :
      '<aside class="konfig-summary is-leer" aria-live="polite"><h2>Ihre Auswahl</h2>' +
      '<p class="sum-short" data-sum="short"></p><dl class="sum-full">' +
      '<div class="sum-lines" data-sum="liste"></div>' +
      "</dl><p class=\"price-once\">Preis auf Anfrage</p>" +
      '<p class="form-status" data-status role="status"></p>' +
      (vorgang === "kauf"
        ? '<a class="btn" href="' + esc(root) + 'anfrage/">Zum Anfragekorb</a>'
        : '<button class="btn" type="submit">In den Anfragekorb</button>') +
      "</aside>";
    var formClass = bare === "1" ? "" : ' class="konfig-layout"';
    var mainClass = bare === "1" ? "" : ' class="konfig-main"';
    node.innerHTML = pills +
      "<form" + formClass + ">" +
      "<div" + mainClass + ">" +
      '<fieldset class="pick-set"><legend>Typ</legend><div class="picks">' + cards + "</div></fieldset>" +
      "</div>" + aside + "</form>";
    updateSum(node);
  }

  function submit(node, event) {
    var form = event.target.closest("form");
    if (!form || !node.contains(form) || !window.AMK_WUNSCH) return;
    event.preventDefault();
    var gruppe = node.getAttribute("data-gruppe") || "";
    var vorgang = node.getAttribute("data-vorgang") === "miete" ? "miete" : "kauf";
    var status = statusOf(node, form);
    if (status) {
      status.textContent = "";
      status.classList.remove("is-error");
    }
    var list = chosen(form);
    if (!list.length) {
      if (node.hasAttribute("data-leer-ok")) return;
      var first = form.querySelector('[data-teil-karte]:not([hidden]) input[name="typ"]');
      if (!first) first = form.querySelector('input[name="typ"]');
      if (first) first.focus();
      return;
    }
    var lines = [];
    for (var i = 0; i < list.length; i++) {
      var entry = list[i];
      if (!entry.ohne && (!entry.qty || entry.qty < 1 || entry.qty > 9999)) {
        if (status) {
          status.textContent = "Bitte die Anzahl angeben.";
          status.classList.add("is-error");
        }
        if (entry.field) {
          var card = entry.field.closest("[data-teil-karte]");
          if (card && card.hidden) {
            var pill = node.querySelector('button[data-teil="' + card.getAttribute("data-teil-karte") + '"]');
            if (pill) pill.click();
          }
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
    form.querySelectorAll('input[name="typ"]').forEach(function (box) {
      if (!box.checked && window.AMK_WUNSCH.remove) window.AMK_WUNSCH.remove(vorgang + ":" + box.value);
    });
    if (!event || event.type === "submit") window.AMK_WUNSCH.replace(lines);
    else {
      var kept = window.AMK_WUNSCH.load().filter(function (item) {
        return !lines.some(function (line) { return line.id === item.id; });
      });
      lines.forEach(function (line) { kept.push(line); });
      window.AMK_WUNSCH.save(kept, true);
    }
  }

  function bind(node) {
    if (node.dataset.bound) return;
    node.dataset.bound = "1";
    node.addEventListener("click", function (event) {
      var button = event.target.closest("button[data-teil]");
      if (!button || !node.contains(button)) return;
      document.dispatchEvent(new CustomEvent("amk-teil", { detail: button.getAttribute("data-teil") || "" }));
    });
    function kaufSync(event) {
      if (node.getAttribute("data-vorgang") === "miete") return;
      var target = event.target;
      if (!target || (target.name !== "typ" && target.type !== "number")) return;
      submit(node, event);
    }
    node.addEventListener("input", function (event) {
      updateSum(node);
      kaufSync(event);
    });
    node.addEventListener("change", function (event) {
      var box = event.target;
      if (box && box.name === "typ" && !box.checked && window.AMK_WUNSCH.remove) {
        var vorgang = node.getAttribute("data-vorgang") === "miete" ? "miete" : "kauf";
        window.AMK_WUNSCH.remove(vorgang + ":" + box.value);
      }
      updateSum(node);
      kaufSync(event);
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

  var exported = { teile: {}, sync: sync, zeileVon: zeileVon, fillLeiste: fillLeiste };
  Object.keys(TEILE).forEach(function (gruppe) {
    if (gruppe === "gitter") return;
    exported.teile[gruppe] = ids(gruppe);
  });
  window.AMK_AUSWAHL = exported;
  sync();
})();
