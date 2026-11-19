(function () {
  /* Detail und Auswahl: Komplett-Ständer, Fuß, Schelle, Zubehör, Korb.
     Kachel, Kreis und Mengensteuerung kommen aus js/kauf-bausteine.js.
     Gespeist aus data/katalog.json und data/kauf-auswahl.json. */
  var IM = "im Komplett-Ständer";
  var ZU = "zusätzlich";

  document.querySelectorAll("main form.order[data-order]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);
    var button = form.querySelector('button[type="submit"]');
    if (button) button.remove();
  });

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function capped(value) {
    var qty = parseInt(value, 10);
    if (!qty || qty < 1) return 0;
    if (qty > 9999) return 9999;
    return qty;
  }

  function mount(product, all, root, host) {
    if (!host || host.dataset.kaufAuswahl) return;
    var order = host.querySelector("form.order[data-order]");
    if (!order || document.getElementById("beispiel-form")) return;
    var slug = (product && product.slug) || order.getAttribute("data-slug") || "";
    if (!slug) return;
    host.dataset.kaufAuswahl = "1";
    if (!product) {
      product = {
        slug: slug,
        name: order.getAttribute("data-name") || slug,
        bild: order.getAttribute("data-bild") || "",
        kat: order.getAttribute("data-kat") || "",
        shop: ""
      };
    }
    var bySlug = {};
    (all || []).forEach(function (item) { if (item && item.slug) bySlug[item.slug] = item; });
    var column = order.parentNode;
    var figure = host.querySelector("figure.scene");
    var crumbs = host.querySelector(".crumbs");
    var heading = host.querySelector("h1");
    var specs = host.querySelector("ul.specs");
    var leads = [];
    if (column) {
      Array.prototype.slice.call(column.children).forEach(function (node) {
        if (node.tagName === "P") leads.push(node);
      });
    }
    var blocks = Array.prototype.slice.call(host.querySelectorAll(".detail-block, details.sheet"));

    var form = document.createElement("form");
    form.className = "beispiel-form";
    form.id = "kauf-auswahl-form";
    form.addEventListener("submit", function (event) { event.preventDefault(); });
    host.parentNode.insertBefore(form, host);
    form.appendChild(host);
    host.classList.remove("detail");
    host.classList.add("beispiel-seite");

    var galerie = document.createElement("div");
    galerie.className = "beispiel-galerie detail";
    if (figure) galerie.appendChild(figure);

    var rechts = document.createElement("div");
    rechts.className = "beispiel-rechts";
    var kauf = document.createElement("div");
    kauf.className = "beispiel-kauf";
    var body = document.createElement("div");
    body.className = "beispiel-kauf-body";
    if (crumbs) body.appendChild(crumbs);
    if (heading) body.appendChild(heading);
    leads.forEach(function (node) { body.appendChild(node); });
    if (specs) body.appendChild(specs);
    var arten = document.createElement("div");
    arten.className = "beispiel-arten";
    arten.id = "beispiel-arten";
    var inhalt = document.createElement("ul");
    inhalt.className = "beispiel-inhalt";
    inhalt.id = "beispiel-inhalt";
    inhalt.hidden = true;
    body.appendChild(arten);
    body.appendChild(inhalt);
    kauf.appendChild(body);

    var korb = document.createElement("div");
    korb.className = "beispiel-korb kachel-box";
    korb.innerHTML =
      '<div class="beispiel-auswahl" id="beispiel-auswahl">' +
      '<h2 id="beispiel-auswahl-titel" tabindex="-1">Deine Auswahl</h2>' +
      '<div id="beispiel-liste"></div></div>' +
      '<div class="beispiel-senden"><a class="btn" href="' + esc(root) + 'anfrage/">Zum Anfragekorb</a></div>';

    var daten = document.createElement("div");
    daten.className = "beispiel-daten";
    daten.id = "kauf-daten";
    blocks.forEach(function (node) { daten.appendChild(node); });

    var zubehoerHost = document.createElement("section");
    zubehoerHost.className = "kauf-board beispiel-zubehoer";
    zubehoerHost.hidden = true;
    zubehoerHost.innerHTML = '<h2 id="zubehoer-titel">Passendes Zubehör</h2><div class="tiles" id="beispiel-zubehoer"></div>';

    rechts.appendChild(kauf);
    rechts.appendChild(korb);
    host.innerHTML = "";
    host.appendChild(galerie);
    host.appendChild(rechts);
    host.appendChild(daten);
    host.appendChild(zubehoerHost);

    var leiste = document.createElement("div");
    leiste.className = "beispiel-leiste";
    leiste.innerHTML =
      '<button type="button" class="beispiel-leiste-wahl" id="beispiel-leiste-wahl" aria-expanded="false" aria-controls="beispiel-auswahl"><span id="beispiel-posten">0 Posten</span></button>' +
      '<a class="btn" href="' + esc(root) + 'anfrage/">Zum Anfragekorb</a>';
    var haube = document.createElement("button");
    haube.type = "button";
    haube.className = "beispiel-haube";
    haube.hidden = true;
    haube.setAttribute("aria-label", "Auswahl schließen");
    form.appendChild(leiste);
    form.appendChild(haube);
    if (order.parentNode) order.remove();

    var config = null;
    var choice = {};
    var managed = {};
    var zubehoer = [];
    var paket = null;

    function mieteModus() { return new URLSearchParams(location.search).get("modus") === "miete"; }
    function anhaengerMiete() { return mieteModus() && product.shop === "anhaenger"; }
    function prefix() { return (mieteModus() ? "miete:" : "kauf:") + slug + ":"; }
    function plainId() { return (mieteModus() ? "miete:" : "kauf:") + slug; }
    function standPrefix() { return "kauf:" + slug + ":"; }
    function standOn() { return !!paket; }
    function feldAutomatik() { return slug === "bauzaun-10075"; }
    function autoLine(parentId, teilSlug, name, qty) {
      var item = itemOf(teilSlug, { name: name, slug: teilSlug });
      var line = lineOf(parentId + ":auto:" + teilSlug, item.name || name, qty, item.bild, item.kat || product.kat, "automatisch");
      line.herkunft = "auto";
      return line;
    }

    function setListe(open) {
      var box = document.getElementById("beispiel-auswahl");
      var toggle = document.getElementById("beispiel-leiste-wahl");
      if (box) box.classList.toggle("is-offen", open);
      if (toggle) toggle.setAttribute("aria-expanded", open ? "true" : "false");
      haube.hidden = !open;
      if (open) {
        var title = document.getElementById("beispiel-auswahl-titel");
        if (title) title.focus();
      } else if (toggle && box && box.contains(document.activeElement)) {
        toggle.focus();
      }
    }

    function stepper(key, id, value, label, min) {
      return window.AMK_BAUSTEINE.mengeSchritt({ key: key, id: id, value: value, label: label, min: min });
    }

    function karte(id, label, aria) {
      return '<div class="beispiel-art-karte"><p class="beispiel-art-text"><strong>' + esc(label) + "</strong></p>" +
        stepper(id.replace(/^menge-/, ""), id, "0", aria, 0) + "</div>";
    }

    function fieldValue(id) {
      var field = document.getElementById(id);
      return field ? capped(field.value) : 0;
    }

    function setMenge(key, value) {
      var field = document.getElementById("menge-" + key);
      if (field) field.value = String(value);
      form.querySelectorAll('[data-spiegel="' + key + '"]').forEach(function (mirror) {
        mirror.value = String(value);
      });
    }

    function standZahl() { return fieldValue("menge-staender"); }
    function feldZahl() { return standOn() ? fieldValue("menge-felder") : fieldValue("menge-einfach"); }

    function itemOf(itemSlug, fallback) {
      return bySlug[itemSlug] || fallback || { slug: itemSlug, name: itemSlug, bild: "", kat: product.kat || "" };
    }

    function lineOf(id, name, qty, bild, kat, note) {
      var line = { id: id, name: name, qty: qty, bild: bild || "", kat: kat || "" };
      if (note) line.note = note;
      return line;
    }

    function optionLabel(itemSlug, standard) {
      var item = itemOf(itemSlug);
      var text = item.name || itemSlug;
      if (item.kicker) text += " · " + item.kicker;
      if (itemSlug === standard) text += " (Standard)";
      return text;
    }

    function mal(je, n) {
      var qty = (je || 1) * n;
      return qty > 9999 ? 9999 : qty;
    }

    function zeileText(key) {
      var n = standZahl();
      if (key === "zaun") return mal(paket.felderJe || 30, n) + "× " + product.name;
      if (key === "stand") return n + "× " + itemOf(paket.stand.slug, paket.stand).name;
      var entry = null;
      (paket.wahl || []).forEach(function (item) { if (item.id === key) entry = item; });
      var chosen = choice[key] || (entry && entry.standard) || "";
      return mal(entry ? entry.je : 1, n) + "× " + (itemOf(chosen).name || (entry && entry.label) || "");
    }

    function selectField(entry) {
      var current = choice[entry.id] || entry.standard;
      var options = (entry.optionen || []).map(function (itemSlug) {
        return '<option value="' + esc(itemSlug) + '"' + (itemSlug === current ? " selected" : "") + ">" +
          esc(optionLabel(itemSlug, entry.standard)) + "</option>";
      }).join("");
      return '<select class="beispiel-wahlfeld" id="wahl-' + esc(entry.id) + '" data-wahl="' + esc(entry.id) + '" aria-label="' +
        esc(entry.label) + ' im Komplett-Ständer">' + options + "</select>";
    }

    function paintCount() {
      var node = document.getElementById("beispiel-posten");
      var list = document.getElementById("beispiel-liste");
      if (!node || !list) return;
      node.textContent = list.querySelectorAll(".beispiel-zeile, .beispiel-post").length + " Posten";
    }

    function paintList() {
      var list = document.getElementById("beispiel-liste");
      if (!list) return;
      var html = "";
      var post = window.AMK_BAUSTEINE.auswahlPost;
      if (standOn() && standZahl() > 0) {
        html += '<section class="beispiel-block" id="block-im"><h3>Im Komplett-Ständer enthalten</h3><ul>' +
          post({
            name: standZahl() + " × " + (paket.label || "Komplett-Ständer"),
            nameId: "beispiel-staender-kopf",
            weg: "staender",
            wegLabel: "Komplett-Ständer entfernen",
            step: stepper("staender", "menge-liste-staender", standZahl(), "Ständeranzahl", 0)
          }) +
          post({ name: zeileText("zaun"), live: "zaun" }) +
          post({ name: zeileText("stand"), live: "stand" });
        (paket.wahl || []).forEach(function (entry) {
          html += post({ name: zeileText(entry.id), live: entry.id, extra: selectField(entry) });
        });
        html += "</ul></section>";
      }
      var extra = "";
      var felder = standOn() ? feldZahl() : 0;
      if (felder > 0) {
        extra += post({
          id: "zeile-felder",
          name: product.name,
          weg: "felder",
          wegLabel: "Einzelfelder entfernen",
          step: stepper("felder", "menge-liste-felder", felder, "Feldanzahl", 0)
        });
      }
      if (!standOn() && feldZahl() > 0) {
        extra += post({
          name: product.name,
          step: stepper("einfach", "menge-liste-einfach", feldZahl(), "Menge", 0)
        });
      }
      form.querySelectorAll('input[name="zubehoer"]:checked').forEach(function (box) {
        var item = itemOf(box.value);
        var qtyField = document.getElementById("menge-" + box.value);
        extra += post({
          name: item.name,
          weg: box.value,
          wegLabel: item.name + " entfernen",
          step: stepper(box.value, "menge-liste-" + box.value, qtyField ? qtyField.value : "1", "Menge " + item.name, 1)
        });
      });
      if (extra) html += '<section class="beispiel-block" id="block-zusatz"><h3>Zusätzlich</h3><ul>' + extra + "</ul></section>";
      if (feldAutomatik() && feldZahl() > 0) {
        var schelleName = itemOf("zubehoer-10002-1", { name: "Verbindungsschelle 2,5 mm" }).name;
        var fussName = itemOf("fuss-10006", { name: "Kunststofffuß schwer 23 kg" }).name;
        var autoN = feldZahl();
        html += '<section class="beispiel-block" id="block-auto"><h3>Automatisch dazu</h3><ul>' +
          post({ name: schelleName, fest: true, menge: String(autoN) }) +
          post({ name: fussName, fest: true, menge: String(Math.min(9999, autoN + 1)) }) +
          "</ul></section>";
      }
      if (!html) html = '<p class="kauf-auswahl-leer">' + esc(window.AMK_KAUF_STORE ? window.AMK_KAUF_STORE.leer : "Noch nichts ausgewählt.") + "</p>";
      var active = document.activeElement;
      var typing = active && active.tagName === "INPUT" && list.contains(active);
      if (typing && standOn() && standZahl() > 0 && list.querySelector("[data-live]")) {
        var kopf = document.getElementById("beispiel-staender-kopf");
        if (kopf) kopf.textContent = standZahl() + " × " + (paket.label || "Komplett-Ständer");
        list.querySelectorAll("[data-live]").forEach(function (node) {
          node.textContent = zeileText(node.getAttribute("data-live"));
        });
        paintCount();
        return;
      }
      list.innerHTML = html;
      paintCount();
    }

    function linesNow() {
      var lines = [];
      if (standOn()) {
        var n = standZahl();
        if (n > 0) {
          lines.push(lineOf(standPrefix() + "im:zaun", product.name, mal(paket.felderJe || 30, n), product.bild, product.kat, IM));
          var stand = itemOf(paket.stand && paket.stand.slug, paket.stand);
          lines.push(lineOf(standPrefix() + "im:staender", stand.name, n, stand.bild, stand.kat || product.kat, IM));
          (paket.wahl || []).forEach(function (entry) {
            var itemSlug = choice[entry.id] || entry.standard;
            var item = itemOf(itemSlug);
            lines.push(lineOf(standPrefix() + "im:" + entry.id + ":" + itemSlug, item.name, mal(entry.je || 1, n), item.bild, item.kat || product.kat, IM));
          });
        }
        var m = feldZahl();
        if (m > 0) {
          var loseId = mieteModus() ? plainId() : standPrefix() + "zusatz:felder";
          lines.push(lineOf(loseId, product.name, m, product.bild, product.kat, mieteModus() ? "" : ZU));
          if (feldAutomatik()) {
            lines.push(autoLine(loseId, "zubehoer-10002-1", "Verbindungsschelle 2,5 mm", m));
            lines.push(autoLine(loseId, "fuss-10006", "Kunststofffuß schwer 23 kg", Math.min(9999, m + 1)));
          }
        }
      } else if (anhaengerMiete()) {
        var wahl = document.getElementById("miete-anhaenger");
        if (wahl && wahl.checked) {
          var anhaenger = lineOf(plainId(), product.name, 1, product.bild, product.kat, "");
          anhaenger.sammel = true;
          lines.push(anhaenger);
        }
      } else {
        var einfach = feldZahl();
        if (einfach > 0) {
          lines.push(lineOf(plainId(), product.name, einfach, product.bild, product.kat, ""));
          if (feldAutomatik()) {
            lines.push(autoLine(plainId(), "zubehoer-10002-1", "Verbindungsschelle 2,5 mm", einfach));
            lines.push(autoLine(plainId(), "fuss-10006", "Kunststofffuß schwer 23 kg", Math.min(9999, einfach + 1)));
          }
        }
      }
      form.querySelectorAll('input[name="zubehoer"]:checked').forEach(function (box) {
        var item = bySlug[box.value];
        if (!item) return;
        var qty = capped(document.getElementById("menge-" + box.value) && document.getElementById("menge-" + box.value).value);
        if (!qty) qty = 1;
        managed["kauf:" + item.slug] = 1;
        lines.push(lineOf("kauf:" + item.slug, item.name, qty, item.bild, item.kat, ZU));
      });
      return lines;
    }

    function syncCart() {
      if (!window.AMK_WUNSCH || typeof window.AMK_WUNSCH.save !== "function") return;
      var lines = linesNow();
      var wanted = {};
      lines.forEach(function (line) { wanted[line.id] = line; });
      var own = prefix();
      var stand = standPrefix();
      var items = window.AMK_WUNSCH.load().filter(function (item) {
        var id = String(item.id || "");
        if (id.indexOf(stand + "im:") === 0 || id.indexOf(stand + "zusatz:") === 0) return !!wanted[id];
        if (standOn() && id === stand.slice(0, -1)) return false;
        if (id.indexOf(own) === 0) return !!wanted[id];
        if (mieteModus() && id === plainId()) return !!wanted[id];
        if (managed[id]) return !!wanted[id];
        return true;
      });
      lines.forEach(function (line) {
        if (!line.qty) return;
        var found = null;
        items.forEach(function (item) { if (item.id === line.id) found = item; });
        if (found) {
          found.qty = line.qty;
          found.name = line.name;
          found.bild = line.bild || "";
          found.kat = line.kat || "";
          if (line.note) found.note = line.note;
          else delete found.note;
          if (line.herkunft) found.herkunft = line.herkunft;
          else delete found.herkunft;
        } else items.push(line);
      });
      if (window.AMK_KAUF_STORE && window.AMK_KAUF_STORE.save) window.AMK_KAUF_STORE.save(items);
      else window.AMK_WUNSCH.save(items, true);
    }

    function restore() {
      var items = window.AMK_WUNSCH && window.AMK_WUNSCH.load ? window.AMK_WUNSCH.load() : [];
      var n = 0;
      var felder = 0;
      var einfach = 0;
      items.forEach(function (item) {
        var id = String(item.id || "");
        if (id === standPrefix() + "im:staender") n = item.qty;
        if (id === standPrefix() + "zusatz:felder") felder = item.qty;
        if (id === plainId()) einfach = item.qty;
        if (anhaengerMiete() && id === plainId() && item.qty > 0) {
          var haken = document.getElementById("miete-anhaenger");
          if (haken) haken.checked = true;
        }
        (paket && paket.wahl || []).forEach(function (entry) {
          var mark = standPrefix() + "im:" + entry.id + ":";
          if (id.indexOf(mark) === 0) choice[entry.id] = id.slice(mark.length);
        });
        if (zubehoer.indexOf(id.slice(5)) >= 0 && (item.note === ZU || item.herkunft === "manuell")) {
          var box = form.querySelector('input[name="zubehoer"][value="' + id.slice(5) + '"]');
          if (box) {
            box.checked = true;
            var pick = box.closest(".beispiel-pick");
            var step = pick ? pick.querySelector(".beispiel-step") : null;
            if (step) step.hidden = false;
            setMenge(id.slice(5), item.qty || 1);
            managed[id] = 1;
          }
        }
      });
      if (standOn()) {
        setMenge("staender", n || 0);
        setMenge("felder", mieteModus() ? (einfach || felder || 0) : (felder || (!n ? einfach : 0) || 0));
      } else {
        setMenge("einfach", einfach || 0);
      }
    }

    function showInhalt() {
      var lines = (paket && paket.inhalt) || [];
      inhalt.hidden = !lines.length;
      inhalt.innerHTML = lines.map(function (line) { return "<li>" + esc(line) + "</li>"; }).join("");
    }

    function fillArten() {
      if (anhaengerMiete()) {
        arten.innerHTML = '<label class="beispiel-art-karte"><input type="checkbox" id="miete-anhaenger"> <strong>' + esc(product.name) + " auswählen</strong></label>";
        inhalt.hidden = true;
        inhalt.innerHTML = "";
        return;
      }
      if (standOn()) {
        arten.innerHTML =
          karte("menge-staender", paket.label || "Komplett-Ständer", "Ständeranzahl") +
          karte("menge-felder", paket.felderLabel || "Einzelne Felder", "Feldanzahl");
        (paket.wahl || []).forEach(function (entry) { choice[entry.id] = choice[entry.id] || entry.standard; });
      } else {
        arten.innerHTML = karte("menge-einfach", "Menge", "Menge");
      }
      showInhalt();
    }

    function fillZubehoer() {
      var hostTiles = document.getElementById("beispiel-zubehoer");
      if (!hostTiles) return;
      var html = zubehoer.map(function (itemSlug) {
        if (itemSlug === slug) return "";
        var item = bySlug[itemSlug];
        if (!item) return "";
        return window.AMK_BAUSTEINE.zubehoerKachel({
          src: root + (item.bild || ""),
          width: item.width,
          height: item.height,
          slug: itemSlug,
          name: item.name,
          kicker: item.kicker,
          fuss: item.platzhalter
            ? '<span class="beispiel-platzhalter">Platzhalter</span>'
            : '<a class="beispiel-details" href="' + esc(root + "produkt/" + itemSlug + "/") + '">Details</a>'
        });
      }).join("");
      hostTiles.innerHTML = html;
      zubehoerHost.hidden = !html;
    }

    function applyConfig(data) {
      config = data || {};
      var shops = config.staender && config.staender.shops || [];
      var hatStander = !!(product.shop && shops.indexOf(product.shop) >= 0 && config.staender && config.staender.paket);
      if (mieteModus() && !hatStander) {
        paket = null;
        zubehoer = [];
        fillArten();
        fillZubehoer();
        restore();
        paintList();
        syncCart();
        return;
      }
      if (hatStander) paket = config.staender.paket;
      var perProduct = config.zubehoerNachProdukt && config.zubehoerNachProdukt[slug];
      var perShop = product.shop && config.zubehoerNachShop && config.zubehoerNachShop[product.shop];
      zubehoer = Array.isArray(perProduct) ? perProduct.slice() : (Array.isArray(perShop) ? perShop.slice() : []);
      fillArten();
      fillZubehoer();
      restore();
      paintList();
      syncCart();
    }

    form.addEventListener("click", function (event) {
      var weg = event.target.closest("[data-weg]");
      if (weg && form.contains(weg)) {
        var key = weg.getAttribute("data-weg");
        if (key === "felder" || key === "staender") {
          setMenge(key, 0);
          paintList();
          syncCart();
          return;
        }
        var box = form.querySelector('input[name="zubehoer"][value="' + key + '"]');
        if (box) {
          box.checked = false;
          box.dispatchEvent(new Event("change", { bubbles: true }));
        }
        return;
      }
      var button = event.target.closest("[data-step]");
      if (!button || !form.contains(button)) return;
      var wrap = button.closest(".beispiel-step");
      var field = wrap ? wrap.querySelector('input[type="number"]') : null;
      if (!field) return;
      var step = parseInt(button.getAttribute("data-step"), 10) || 0;
      var min = parseInt(field.getAttribute("min"), 10);
      if (isNaN(min)) min = 0;
      var value = parseInt(field.value, 10);
      if (isNaN(value)) value = min;
      var cap = parseInt(field.getAttribute("max"), 10) || 9999;
      field.value = String(Math.min(cap, Math.max(min, value + step)));
      field.dispatchEvent(new Event("input", { bubbles: true }));
    });

    form.addEventListener("input", function (event) {
      var target = event.target;
      if (!target || target.type !== "number") return;
      var value = target.value === "" ? "" : String(capped(target.value) || (parseInt(target.getAttribute("min"), 10) || 0));
      if (target.value !== "" && value !== "") target.value = value;
      var key = target.getAttribute("data-spiegel") || (target.id || "").replace(/^menge-/, "");
      if (target.hasAttribute("data-spiegel")) {
        var canon = document.getElementById("menge-" + key);
        if (canon && canon !== target && target.value !== "") canon.value = target.value;
      } else {
        form.querySelectorAll('[data-spiegel="' + key + '"]').forEach(function (mirror) {
          if (target.value !== "") mirror.value = target.value;
        });
      }
      if (target.value === "") return;
      paintList();
      syncCart();
    });

    form.addEventListener("change", function (event) {
      var target = event.target;
      if (!target) return;
      if (target.type === "number") {
        var min = parseInt(target.getAttribute("min"), 10);
        if (isNaN(min)) min = 0;
        var qty = capped(target.value);
        if (qty < min) qty = min;
        target.value = String(qty);
        var key = target.getAttribute("data-spiegel") || (target.id || "").replace(/^menge-/, "");
        setMenge(key, qty);
        paintList();
        syncCart();
        return;
      }
      if (target.getAttribute("data-wahl")) {
        choice[target.getAttribute("data-wahl")] = target.value;
        paintList();
        syncCart();
        return;
      }
      if (target.id === "miete-anhaenger") {
        paintList();
        syncCart();
        return;
      }
      if (target.name === "zubehoer") {
        var pick = target.closest(".beispiel-pick");
        var step = pick ? pick.querySelector(".beispiel-step") : null;
        if (step) {
          step.hidden = !target.checked;
          if (!target.checked) {
            var field = step.querySelector('input[type="number"]');
            if (field) field.value = "1";
          }
        }
        if (target.checked) managed["kauf:" + target.value] = 1;
        paintList();
        syncCart();
      }
    });

    document.getElementById("beispiel-leiste-wahl").addEventListener("click", function () {
      var box = document.getElementById("beispiel-auswahl");
      setListe(!(box && box.classList.contains("is-offen")));
    });
    haube.addEventListener("click", function () { setListe(false); });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setListe(false);
    });

    window.addEventListener("pageshow", function () {
      if (!document.getElementById("kauf-auswahl-form")) return;
      restore();
      paintList();
    });

    var kit = new Promise(function (resolve) {
      if (window.AMK_BAUSTEINE) { resolve(); return; }
      var script = document.createElement("script");
      script.src = root + "js/kauf-bausteine.js?v=ax";
      script.onload = function () { resolve(); };
      script.onerror = function () { resolve(); };
      document.head.appendChild(script);
    });
    Promise.all([
      fetch(root + "data/kauf-auswahl.json").then(function (response) { return response.json(); }).catch(function () { return null; }),
      kit
    ]).then(function (result) { applyConfig(result[0]); });
  }

  window.AMK_KAUF_AUSWAHL = { mount: mount };
})();
