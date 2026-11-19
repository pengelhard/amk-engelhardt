(function () {
  /* Katalog laden und Typ-Liste für Miete und Kauf. Die Kauf-Kachel kommt
     aus js/kauf-bausteine.js. Zeitraum nur bei Miete. Inhalte nur aus data/katalog.json. */
  var TEILE = {
    gitter: [
      { id: "gitter", shop: "gitter" }
    ],
    schwellen: [
      { id: "schwellen", label: "Bodenleitschwellen", shop: "verkehr", art: "Betonschwellen" }
    ],
    schleuse: [
      { id: "schleuse", label: "Schleusen", shop: "verkehr", art: "Schleuse" }
    ],
    buehne: [
      { id: "buehne", label: "Bühnen", shop: "verkehr", art: "Bühne" }
    ],
    absperrung: [
      { id: "schranken", label: "Absperrschranken", shop: "verkehr", art: "Schranken" },
      { id: "baken", label: "Leitbaken", shop: "verkehr", art: "Baken" }
    ],
    anhaenger: [
      { id: "hochlader", label: "Hochlader", shop: "anhaenger", art: "Hochlader" },
      { id: "plane", label: "Planenanhänger", shop: "anhaenger", art: "Planenanhänger" },
      { id: "koffer", label: "Kofferanhänger", shop: "anhaenger", art: "Kofferanhänger" },
      { id: "transporter", label: "Fahrzeugtransporter", shop: "anhaenger", art: "Fahrzeugtransporter" },
      { id: "kuehl", label: "Kühlanhänger", shop: "anhaenger", art: "Kühlanhänger" }
    ]
  };
  var KAT = {
    gitter: "bauzaun",
    schwellen: "verkehrssicherung",
    schleuse: "verkehrssicherung",
    buehne: "verkehrssicherung",
    absperrung: "verkehrssicherung",
    anhaenger: "anhaenger"
  };
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

  function modusPasst(product) {
    var modus = window.AMK_MODUS === "miete" ? "miete" : "kauf";
    var modi = product.modi && product.modi.length ? product.modi : ["kauf"];
    return modi.indexOf(modus) !== -1;
  }

  function matches(product, teil) {
    if (!product || product.shop !== teil.shop) return false;
    if (!modusPasst(product)) return false;
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

  function feldVon(box) {
    var direkt = box && box.closest ? box.closest(".kauf-produkt, .pick-block") : null;
    var field = direkt ? direkt.querySelector("[data-menge]") : null;
    if (field) return field;
    var form = box && box.form;
    return form ? form.querySelector('[data-menge-fuer="' + box.value + '"] [data-menge]') : null;
  }

  function chosen(form) {
    var list = [];
    form.querySelectorAll('input[name="typ"]:checked').forEach(function (box) {
      var product = null;
      (products || []).forEach(function (entry) { if (entry.slug === box.value) product = entry; });
      if (!product) return;
      var field = feldVon(box);
      var ohne = !field;
      var qty = ohne ? 1 : parseInt(field.value, 10);
      list.push({ product: product, field: field, qty: qty, ohne: ohne });
    });
    return list;
  }

  function zeileVon(box) {
    var block = box && box.closest ? box.closest(".pick-block, .kauf-produkt") : null;
    var title = block ? block.querySelector("strong, h3") : null;
    var field = block ? block.querySelector("[data-menge]") : null;
    var link = block ? block.querySelector("a[href]") : null;
    var name = title ? title.textContent.trim() : "";
    var qty = 0;
    if (field) {
      qty = parseInt(field.value, 10);
      if (!qty || qty < 0) qty = 0;
    }
    var kind = box.name === "schild" ? "schild" : "typ";
    return {
      name: name,
      menge: qty > 0 ? String(qty) : "–",
      qty: qty,
      href: link ? link.getAttribute("href") : "",
      ziel: kind + ":" + (box.value || "")
    };
  }

  function kaufBox(aside, lines) {
    var liste = aside.querySelector('[data-sum="liste"]');
    var kurz = aside.querySelector('[data-sum="kurz"]');
    var rows = lines || [];
    if (kurz) kurz.textContent = (rows.length || 0) + " Posten";
    if (!liste || !window.AMK_BAUSTEINE) return;
    if (!rows.length) {
      liste.innerHTML = '<p class="kauf-auswahl-leer">Noch nichts ausgewählt.</p>';
    } else {
      var html = "";
      var last = "";
      var buf = "";
      function flush() {
        if (!buf) return;
        html += last
          ? '<section class="beispiel-block"><h3>' + esc(last) + "</h3><ul>" + buf + "</ul></section>"
          : "<ul>" + buf + "</ul>";
        buf = "";
      }
      rows.forEach(function (line) {
        var block = line.block || "";
        if (block !== last) {
          flush();
          last = block;
        }
        if (line.fest) {
          buf += window.AMK_BAUSTEINE.auswahlPost({
            name: line.name,
            fest: true,
            menge: String(line.qty == null ? "" : line.qty)
          });
          return;
        }
        var qty = line.qty;
        var step = "";
        if (typeof qty === "number") {
          var feldId = "kauf-box-" + String(line.ziel || line.name).replace(/[^a-z0-9_-]+/gi, "-");
          step = window.AMK_BAUSTEINE.mengeSchritt({
            id: feldId,
            value: String(qty),
            label: "Menge " + (line.name || ""),
            min: 0
          });
        }
        buf += window.AMK_BAUSTEINE.auswahlPost({
          name: line.name,
          ziel: line.ziel || "",
          weg: line.ziel || "",
          wegLabel: (line.name || "Position") + " entfernen",
          step: step
        });
      });
      flush();
      liste.innerHTML = html;
    }
    aside.classList.toggle("is-leer", !rows.length);
  }

  function fillLeiste(aside, lines) {
    if (!aside) return;
    if (aside.id === "kauf-verkehr-summe") {
      kaufBox(aside, lines);
      return;
    }
    var leer = window.AMK_KAUF_STORE ? window.AMK_KAUF_STORE.leer : "Noch nichts ausgewählt.";
    var short = aside.querySelector('[data-sum="short"]');
    var liste = aside.querySelector('[data-sum="liste"]');
    var rows = lines || [];
    var bits = rows.map(function (line) {
      return line.menge ? line.name + " · " + line.menge : line.name;
    });
    if (short) short.textContent = bits.join("; ") || leer;
    if (liste) {
      if (!rows.length) liste.innerHTML = '<p class="kauf-auswahl-leer">' + esc(leer) + "</p>";
      else {
        var html = "";
        var last = "";
        rows.forEach(function (line) {
          var block = line.block || "";
          if (block && block !== last) {
            html += '<p class="kauf-auswahl-block">' + esc(block) + "</p>";
            last = block;
          }
          var name = line.href ? '<a href="' + esc(line.href) + '">' + esc(line.name) + "</a>" : esc(line.name);
          var menge = line.menge ? "<dd>" + esc(line.menge) + "</dd>" : "";
          html += "<div><dt>" + name + "</dt>" + menge + "</div>";
        });
        liste.innerHTML = html;
      }
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
    var pillsOff = node.hasAttribute("data-ohne-pills") ? "1" : "0";
    var stapel = node.hasAttribute("data-stapel") ? "1" : "0";
    var modus = window.AMK_MODUS === "miete" ? "miete" : "kauf";
    var gleiche = node.hasAttribute("data-gleiche-kachel");
    var kachel = vorgang === "kauf" || gleiche;
    var key = gruppe + ":" + vorgang + ":" + modus + ":" + bare + ":" + pillsOff + ":" + stapel;
    if (!teile.length) {
      node.innerHTML = "";
      delete node.dataset.key;
      return;
    }
    if (node.dataset.key === key && node.querySelector("form")) {
      if (stapel !== "1") showTeil(node, gruppe);
      if (kachel) liesKarten(node);
      else updateSum(node);
      return;
    }
    node.dataset.key = key;
    var teilId = selectedTeil(gruppe);
    var saved = cartById();
    var pills = teile.length > 1 && !node.hasAttribute("data-ohne-pills")
      ? '<div class="kauf-cats" role="navigation" aria-label="Unterkategorien">' + teile.map(function (entry) {
        var on = entry.id === teilId;
        return '<button type="button" class="chip" data-teil="' + entry.id + '" aria-pressed="' + (on ? "true" : "false") + '">' + esc(entry.label) + "</button>";
      }).join("") + "</div>"
      : "";
    var cards = "";
    var bloecke = "";
    teile.forEach(function (entry) {
      var teilKarten = "";
      products.filter(function (product) { return matches(product, entry); }).forEach(function (product) {
        var existing = saved[vorgang + ":" + product.slug];
        var on = !!existing;
        var qty = existing && existing.qty ? existing.qty : 1;
        var hide = stapel === "1" || entry.id === teilId ? "" : " hidden";
        var daten = gruppe === "anhaenger" ? eckdaten(product.slug) : "";
        var suche = (product.name + " " + (product.code || "") + " " + product.slug).toLocaleLowerCase("de");
        teilKarten += '<div data-teil-karte="' + esc(entry.id) + '"' + hide + ' data-code="' + esc(product.code || "") + '" data-suche="' + esc(suche) + '">' + window.AMK_TYPWAHL.card({
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
          extra: kachel ? "" : daten,
          kachel: kachel,
          href: kachel ? root + "produkt/" + product.slug + "/" + (modus === "miete" ? "?modus=miete" : "") : ""
        }) + (kachel ? daten : "") + "</div>";
      });
      cards += teilKarten;
      if (stapel === "1" && teilKarten) {
        bloecke += '<section class="kauf-abschnitt" data-abschnitt="' + esc(entry.id) + '" id="kauf-teil-' + esc(entry.id) + '"><h2>' + esc(entry.label || entry.id) + '</h2><div class="tiles">' + teilKarten + '</div></section>';
      }
    });
    var aside = bare === "1" ? "" :
      '<aside class="konfig-summary kachel-box is-leer" aria-live="polite"><h2>' + (kachel ? "Deine Auswahl" : "Ihre Auswahl") + "</h2>" +
      '<p class="sum-short" data-sum="short"></p><dl class="sum-full">' +
      '<div class="sum-lines" data-sum="liste"></div>' +
      "</dl><p class=\"price-once\">Preis auf Anfrage</p>" +
      '<p class="form-status" data-status role="status"></p>' +
      (kachel
        ? '<a class="btn" href="' + esc(root) + 'anfrage/">Zum Anfragekorb</a>'
        : '<button class="btn" type="submit">In den Anfragekorb</button>') +
      "</aside>";
    var formClass = bare === "1" ? "" : ' class="konfig-layout"';
    var mainClass = bare === "1" ? "" : ' class="konfig-main"';
    node.innerHTML = pills +
      "<form" + formClass + ">" +
      "<div" + mainClass + ">" +
      (kachel
        ? (stapel === "1" ? bloecke : '<div class="tiles">' + cards + "</div>")
        : '<fieldset class="pick-set"><legend>Typ</legend><div class="picks">' + cards + "</div></fieldset>") +
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
    if (vorgang === "kauf") {
      form.querySelectorAll('input[name="typ"]').forEach(function (box) {
        if (!box.checked && window.AMK_WUNSCH.remove) window.AMK_WUNSCH.remove(vorgang + ":" + box.value);
      });
    }
    var list = chosen(form);
    if (!list.length) {
      if (node.hasAttribute("data-leer-ok") || vorgang === "kauf") return;
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
      if (node.getAttribute("data-vorgang") === "miete" && !node.hasAttribute("data-gleiche-kachel")) return;
      var target = event.target;
      if (!target) return;
      var card = target.closest && target.closest(".kauf-produkt");
      if (card && window.AMK_KAUF_STORE) window.AMK_KAUF_STORE.winkel(card, target);
      if (target.name !== "typ" && target.type !== "number") return;
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

  function liesKarten(node) {
    var vorgang = node.getAttribute("data-vorgang") === "miete" ? "miete" : "kauf";
    if (vorgang !== "kauf" && !node.hasAttribute("data-gleiche-kachel")) return;
    var saved = cartById();
    node.querySelectorAll(".kauf-produkt").forEach(function (card) {
      var box = card.querySelector('input[name="typ"]');
      var field = card.querySelector("[data-menge]");
      if (!box) return;
      var item = saved[vorgang + ":" + box.value];
      var qty = item && item.qty ? item.qty : 0;
      box.checked = qty > 0;
      if (field) field.value = String(qty > 9999 ? 9999 : qty);
    });
    updateSum(node);
  }

  function lies() {
    document.querySelectorAll("[data-auswahl]").forEach(function (node) {
      if (!node.querySelector(".kauf-produkt")) return;
      liesKarten(node);
    });
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

  var exported = { teile: {}, sync: sync, lies: lies, zeileVon: zeileVon, fillLeiste: fillLeiste };
  Object.keys(TEILE).forEach(function (gruppe) {
    if (gruppe === "gitter") return;
    exported.teile[gruppe] = ids(gruppe);
  });
  window.AMK_AUSWAHL = exported;
  sync();
})();
