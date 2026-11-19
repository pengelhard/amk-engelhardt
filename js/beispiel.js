(function () {
  var root = document.querySelector(".beispiel-form");
  if (!root || !window.AMK_WUNSCH) return;

  function scriptRoot() {
    var nodes = document.getElementsByTagName("script");
    var i;
    for (i = 0; i < nodes.length; i++) {
      var src = nodes[i].getAttribute("src") || "";
      var at = src.indexOf("js/beispiel.js");
      if (at >= 0) return src.slice(0, at);
    }
    return "";
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function clamp(field) {
    var cap = parseInt(field.getAttribute("max"), 10);
    if (!cap || cap < 1) cap = 9999;
    var min = parseInt(field.getAttribute("min"), 10);
    if (isNaN(min)) min = 1;
    var value = parseInt(field.value, 10);
    if (isNaN(value) || value < min) value = min;
    if (value > cap) value = cap;
    field.value = String(value);
    return value;
  }

  function capped(value) {
    var n = parseInt(value, 10);
    if (!n || n < 1) return 0;
    if (n > 9999) return 9999;
    return n;
  }

  var base = scriptRoot();
  var config = null;
  var product = null;
  var bySlug = {};
  var wahl = root.querySelector(".beispiel-leiste-wahl");
  var haube = root.querySelector(".beispiel-haube");
  var choice = {};
  var managed = {};
  var IM = "im Komplett-Ständer";
  var ZU = "zusätzlich";

  function paket() {
    return (config && config.paket) || {};
  }

  function standZahl() {
    var field = document.getElementById("menge-staender");
    return field ? clamp(field) : 0;
  }

  function feldZahl() {
    var field = document.getElementById("menge-felder");
    return field ? clamp(field) : 0;
  }

  function mal(je) {
    return capped(je * standZahl());
  }

  function standItem() {
    var stand = paket().stand || {};
    return bySlug[stand.slug] || { name: stand.name || "Transportständer", slug: stand.slug || "", bild: "", kat: "bauzaun" };
  }

  function wahlGruppen() {
    return paket().wahl || [];
  }

  function gruppe(id) {
    var found = null;
    wahlGruppen().forEach(function (entry) {
      if (entry.id === id) found = entry;
    });
    return found || { id: id, label: id, je: 1, standard: "", optionen: [] };
  }

  function gewaehlt(id) {
    var entry = gruppe(id);
    var slug = choice[id] || entry.standard;
    if (entry.optionen.indexOf(slug) === -1) slug = entry.standard;
    return slug;
  }

  function optionLabel(slug, standard) {
    var item = bySlug[slug] || {};
    var text = item.name || slug;
    if (item.code) text += " " + item.code;
    if (slug === standard) text += " (Standard)";
    return text;
  }

  function zeileText(key) {
    var n = standZahl();
    if (key === "zaun") return mal(paket().felderJe || 30) + "× " + (product ? product.name : "Bauzaun Profi");
    if (key === "stand") return n + "× " + standItem().name;
    var entry = gruppe(key);
    return mal(entry.je || 1) + "× " + entry.label;
  }

  function stepper(key, id, value, label, min) {
    return '<div class="beispiel-step">' +
      '<button type="button" data-step="-1" aria-label="Weniger">−</button>' +
      '<label class="visually-hidden" for="' + esc(id) + '">' + esc(label) + "</label>" +
      '<input id="' + esc(id) + '" data-spiegel="' + esc(key) + '" type="number" min="' + (min == null ? 1 : min) + '" max="9999" value="' + esc(value) + '" inputmode="numeric">' +
      '<button type="button" data-step="1" aria-label="Mehr">+</button>' +
      "</div>";
  }

  function setChecked(slug, on) {
    var box = root.querySelector('input[name="zubehoer"][value="' + slug + '"]');
    if (!box) return;
    box.checked = on;
    var pick = box.closest(".beispiel-pick");
    var step = pick ? pick.querySelector(".beispiel-step") : null;
    if (step) step.hidden = !on;
  }

  function setMenge(key, value) {
    var field = document.getElementById("menge-" + key);
    if (field) field.value = String(value);
    root.querySelectorAll('[data-spiegel="' + key + '"]').forEach(function (mirror) {
      mirror.value = String(value);
    });
  }

  function showInhalt() {
    var list = document.getElementById("beispiel-inhalt");
    if (!list) return;
    var lines = paket().inhalt || [];
    list.hidden = !lines.length;
    list.innerHTML = lines.map(function (line) {
      return "<li>" + esc(line) + "</li>";
    }).join("");
  }

  function paintCount() {
    var node = document.getElementById("beispiel-posten");
    var list = document.getElementById("beispiel-liste");
    if (!node || !list) return;
    var n = list.querySelectorAll(".beispiel-zeile, .beispiel-post").length;
    node.textContent = n + " Posten";
  }

  function paintQuiet() {
    var kopf = document.getElementById("beispiel-staender-kopf");
    if (kopf) kopf.textContent = standZahl() + " × " + (paket().label || "Komplett-Ständer");
    root.querySelectorAll("[data-live]").forEach(function (node) {
      node.textContent = zeileText(node.getAttribute("data-live"));
    });
    paintCount();
  }

  function selectField(entry) {
    var current = gewaehlt(entry.id);
    var options = (entry.optionen || []).map(function (slug) {
      return '<option value="' + esc(slug) + '"' + (slug === current ? " selected" : "") + ">" + esc(optionLabel(slug, entry.standard)) + "</option>";
    }).join("");
    return '<select class="beispiel-wahlfeld" id="wahl-' + esc(entry.id) + '" data-wahl="' + esc(entry.id) + '" aria-label="' + esc(entry.label) + ' im Komplett-Ständer">' + options + "</select>";
  }

  function postZeile(slug) {
    var item = bySlug[slug];
    if (!item) return "";
    var field = document.getElementById("menge-" + slug);
    return '<li class="beispiel-post">' +
      '<p class="beispiel-post-text"><strong>' + esc(item.name) + "</strong></p>" +
      '<button type="button" class="beispiel-weg" data-weg="' + esc(slug) + '" aria-label="' + esc(item.name) + ' entfernen">×</button>' +
      stepper(slug, "menge-liste-" + slug, field ? field.value : "1", "Menge " + item.name, 1) +
      "</li>";
  }

  function paintList() {
    var list = document.getElementById("beispiel-liste");
    if (!list || !product) return;
    var n = standZahl();
    var m = feldZahl();
    var active = document.activeElement;
    var typing = active && active.tagName === "INPUT" && list.contains(active);
    var imVisible = !!document.getElementById("block-im");
    var fieldsVisible = !!document.getElementById("zeile-felder");
    if (typing && (n > 0) === imVisible && (m > 0) === fieldsVisible) {
      paintQuiet();
      return;
    }
    var html = "";
    if (n > 0) {
      html += '<section class="beispiel-block" id="block-im">' +
        "<h3>Im Komplett-Ständer enthalten</h3>" +
        '<div class="beispiel-block-kopf"><p id="beispiel-staender-kopf">' + esc(n + " × " + (paket().label || "Komplett-Ständer")) + "</p>" +
        stepper("staender", "menge-liste-staender", n, "Ständeranzahl", 0) +
        "</div><ul>" +
        '<li class="beispiel-zeile"><span data-live="zaun">' + esc(zeileText("zaun")) + "</span></li>" +
        '<li class="beispiel-zeile"><span data-live="stand">' + esc(zeileText("stand")) + "</span></li>";
      wahlGruppen().forEach(function (entry) {
        html += '<li class="beispiel-zeile"><span data-live="' + esc(entry.id) + '">' + esc(zeileText(entry.id)) + "</span>" + selectField(entry) + "</li>";
      });
      html += "</ul></section>";
    }
    var extra = "";
    if (m > 0) {
      extra += '<li class="beispiel-post" id="zeile-felder">' +
        '<p class="beispiel-post-text"><strong>' + esc(product.name) + "</strong></p>" +
        '<button type="button" class="beispiel-weg" data-weg="felder" aria-label="Einzelfelder entfernen">×</button>' +
        stepper("felder", "menge-liste-felder", m, "Feldanzahl", 0) +
        "</li>";
    }
    root.querySelectorAll('input[name="zubehoer"]:checked').forEach(function (box) {
      extra += postZeile(box.value);
    });
    if (extra) {
      html += '<section class="beispiel-block" id="block-zusatz"><h3>Zusätzlich</h3><ul>' + extra + "</ul></section>";
    }
    list.innerHTML = html;
    paintCount();
  }

  function setListe(open) {
    var box = document.getElementById("beispiel-auswahl");
    if (box) box.classList.toggle("is-offen", open);
    if (wahl) wahl.setAttribute("aria-expanded", open ? "true" : "false");
    if (haube) haube.hidden = !open;
    if (open) {
      var title = document.getElementById("beispiel-auswahl-titel");
      if (title) title.focus();
    } else if (wahl && box && box.contains(document.activeElement)) {
      wahl.focus();
    }
  }

  function fillProduct() {
    document.title = product.name + " – AMK Engelhardt";
    var title = document.getElementById("beispiel-titel");
    var crumb = document.getElementById("beispiel-krume");
    var lead = document.getElementById("beispiel-lead");
    var kicker = document.getElementById("beispiel-kicker");
    if (title) title.textContent = product.name;
    if (crumb) crumb.textContent = product.name;
    if (lead) lead.textContent = product.lead || "";
    if (kicker) kicker.textContent = product.kicker || "";

    var text = document.getElementById("beispiel-text");
    if (text) {
      text.innerHTML = (product.text || []).map(function (paragraph) {
        return "<p>" + esc(paragraph) + "</p>";
      }).join("");
    }
    var table = document.getElementById("beispiel-specs");
    if (table) {
      var rows = product.specs || [];
      table.hidden = !rows.length;
      table.innerHTML = "<tbody>" + rows.map(function (pair) {
        return "<tr><th scope=\"row\">" + esc(pair[0]) + "</th><td>" + esc(pair[1]) + "</td></tr>";
      }).join("") + "</tbody>";
    }

    var slides = [{ src: product.bild, alt: product.alt || product.name }];
    (config.platzhalter || []).forEach(function (src, index) {
      slides.push({ src: src, alt: "Platzhalter " + (index + 1) });
    });
    var main = document.getElementById("beispiel-bild");
    var thumbs = document.getElementById("beispiel-thumbs");
    function show(index) {
      var slide = slides[index];
      if (main) {
        main.src = base + slide.src;
        main.alt = slide.alt;
      }
      if (!thumbs) return;
      thumbs.querySelectorAll("button").forEach(function (button, at) {
        if (at === index) button.setAttribute("aria-current", "true");
        else button.removeAttribute("aria-current");
      });
    }
    if (thumbs) {
      thumbs.innerHTML = slides.map(function (slide) {
        return '<button type="button" aria-label="' + esc(slide.alt) + '">' +
          '<img src="' + esc(base + slide.src) + '" alt="" width="800" height="600"></button>';
      }).join("");
      thumbs.querySelectorAll("button").forEach(function (button, index) {
        button.addEventListener("click", function () { show(index); });
      });
    }
    show(0);

    var host = document.getElementById("beispiel-arten");
    if (host) {
      host.innerHTML =
        karte("menge-staender", paket().label || "Komplett-Ständer", "Ständeranzahl") +
        karte("menge-felder", paket().felderLabel || "Einzelne Felder", "Feldanzahl");
    }
    wahlGruppen().forEach(function (entry) {
      choice[entry.id] = entry.standard;
    });
    showInhalt();
  }

  function karte(id, label, aria) {
    return '<div class="beispiel-art-karte"><p class="beispiel-art-text"><strong>' + esc(label) + "</strong></p>" +
      '<div class="beispiel-step"><button type="button" data-step="-1" aria-label="Weniger">−</button>' +
      '<label class="visually-hidden" for="' + esc(id) + '">' + esc(aria) + "</label>" +
      '<input id="' + esc(id) + '" name="' + esc(id) + '" type="number" min="0" max="9999" value="0" inputmode="numeric">' +
      '<button type="button" data-step="1" aria-label="Mehr">+</button></div></div>';
  }

  function fillZubehoer() {
    var host = document.getElementById("beispiel-zubehoer");
    if (!host) return;
    host.innerHTML = (config.zubehoer || []).map(function (slug) {
      var item = bySlug[slug];
      if (!item) return "";
      return '<article class="tile beispiel-pick">' +
        '<label class="beispiel-hit">' +
        '<span class="frame"><img src="' + esc(base + item.bild) + '" alt="" width="' + esc(item.width || 1200) + '" height="' + esc(item.height || 675) + '" decoding="async">' +
        '<span class="beispiel-wahl"><input type="checkbox" name="zubehoer" value="' + esc(slug) + '" aria-label="' + esc(item.name) + '"><span class="beispiel-kreis"></span></span></span>' +
        '<span class="beispiel-name"><h3>' + esc(item.name) + '</h3><span class="beispiel-mass">' + esc(item.kicker || "") + "</span></span>" +
        "</label>" +
        '<div class="beispiel-fuss">' +
        '<div class="beispiel-step" hidden>' +
        '<button type="button" data-step="-1" aria-label="Weniger">−</button>' +
        '<label class="visually-hidden" for="menge-' + esc(slug) + '">Menge ' + esc(item.name) + "</label>" +
        '<input id="menge-' + esc(slug) + '" name="menge-' + esc(slug) + '" type="number" min="1" max="9999" value="1" inputmode="numeric">' +
        '<button type="button" data-step="1" aria-label="Mehr">+</button>' +
        "</div>" +
        (item.platzhalter
          ? '<span class="beispiel-platzhalter">Platzhalter</span>'
          : '<a class="beispiel-details" href="' + esc(base + "produkt/" + slug + "/") + '">Details</a>') +
        "</div></article>";
    }).join("");
  }

  function lineOf(id, name, qty, bild, kat, note) {
    var line = { id: id, name: name, qty: capped(qty), bild: bild || "", kat: kat || "" };
    if (note) line.note = note;
    return line;
  }

  function linesNow() {
    var lines = [];
    var n = standZahl();
    if (n > 0) {
      lines.push(lineOf("kauf:beispiel:im:zaun", product.name, mal(paket().felderJe || 30), product.bild, product.kat, IM));
      var stand = standItem();
      lines.push(lineOf("kauf:beispiel:im:staender", stand.name, n, stand.bild, stand.kat || product.kat, IM));
      wahlGruppen().forEach(function (entry) {
        var slug = gewaehlt(entry.id);
        var item = bySlug[slug] || { name: slug, bild: "", kat: product.kat };
        lines.push(lineOf("kauf:beispiel:im:" + entry.id + ":" + slug, item.name, mal(entry.je || 1), item.bild, item.kat || product.kat, IM));
      });
    }
    var m = feldZahl();
    if (m > 0) {
      lines.push(lineOf("kauf:beispiel:zusatz:felder", product.name, m, product.bild, product.kat, ZU));
    }
    root.querySelectorAll('input[name="zubehoer"]:checked').forEach(function (box) {
      var item = bySlug[box.value];
      if (!item) return;
      var field = document.getElementById("menge-" + box.value);
      lines.push(lineOf("kauf:" + item.slug, item.name, clamp(field), item.bild, item.kat, ZU));
    });
    return lines;
  }

  function syncCart() {
    if (!product || !window.AMK_WUNSCH || typeof window.AMK_WUNSCH.save !== "function") return;
    var lines = linesNow();
    var wanted = {};
    lines.forEach(function (line) {
      wanted[line.id] = line;
      managed[line.id] = 1;
    });
    var items = window.AMK_WUNSCH.load().filter(function (item) {
      if (String(item.id).indexOf("kauf:beispiel:") === 0) return !!wanted[item.id];
      if (!managed[item.id]) return true;
      return !!wanted[item.id];
    });
    lines.forEach(function (line) {
      var found = null;
      items.forEach(function (item) { if (item.id === line.id) found = item; });
      if (found) {
        found.qty = line.qty;
        found.name = line.name;
        found.bild = line.bild || "";
        found.kat = line.kat || "";
        delete found.herkunft;
        if (line.note) found.note = line.note;
        else delete found.note;
      } else items.push(line);
    });
    window.AMK_WUNSCH.save(items, true);
  }

  function knownSlug(slug) {
    return (config.zubehoer || []).indexOf(slug) >= 0;
  }

  function noteAus(note) {
    var match = String(note || "").match(/^aus (\d+) Komplett-Ständer$/);
    return match ? parseInt(match[1], 10) : 0;
  }

  function restoreCart() {
    var items = window.AMK_WUNSCH.load();
    var n = 0;
    var felder = 0;
    var felderSet = false;
    items.forEach(function (item) {
      var id = String(item.id || "");
      if (id === "kauf:beispiel:im:staender") n = item.qty;
      if (id === "kauf:beispiel:transportstaender" && (item.herkunft === "auto" || item.note === "inklusive" || item.note === IM)) n = item.qty;
      if (id === "kauf:beispiel:staender") n = item.qty;
      if (id === "kauf:beispiel:zusatz:felder") {
        felder = item.qty;
        felderSet = true;
      }
      if (id === "kauf:beispiel:felder" && !felderSet) {
        var parsed = noteAus(item.note);
        if (item.herkunft === "auto" || parsed) {
          if (!n && parsed) n = parsed;
        } else {
          felder = item.qty;
          felderSet = true;
        }
      }
      wahlGruppen().forEach(function (entry) {
        var prefix = "kauf:beispiel:im:" + entry.id + ":";
        if (id.indexOf(prefix) === 0) choice[entry.id] = id.slice(prefix.length);
      });
      if (id.indexOf("kauf:") !== 0 || id.indexOf("kauf:beispiel:") === 0) return;
      var slug = id.slice(5);
      if (!knownSlug(slug)) return;
      if (item.herkunft === "auto") {
        managed[id] = 1;
        wahlGruppen().forEach(function (entry) {
          if (!choice[entry.id] || choice[entry.id] === entry.standard) {
            if (entry.optionen.indexOf(slug) >= 0 && item.herkunft === "auto") choice[entry.id] = slug;
          }
        });
        return;
      }
      if (item.herkunft === "manuell" || item.note === ZU) {
        setChecked(slug, true);
        setMenge(slug, item.qty);
        managed[id] = 1;
      }
    });
    setMenge("staender", n || 0);
    setMenge("felder", felder || 0);
  }

  root.addEventListener("click", function (event) {
    var weg = event.target.closest("[data-weg]");
    if (weg && root.contains(weg)) {
      var key = weg.getAttribute("data-weg");
      if (key === "felder") {
        setMenge("felder", 0);
        var field = document.getElementById("menge-felder");
        if (field) field.dispatchEvent(new Event("input", { bubbles: true }));
        return;
      }
      var box = root.querySelector('input[name="zubehoer"][value="' + key + '"]');
      if (box) {
        box.checked = false;
        box.dispatchEvent(new Event("change", { bubbles: true }));
        box.focus();
      }
      return;
    }
    var button = event.target.closest("[data-step]");
    if (!button || !root.contains(button)) return;
    var wrap = button.closest(".beispiel-step");
    var field = wrap ? wrap.querySelector('input[type="number"]') : null;
    if (!field) return;
    var step = parseInt(button.getAttribute("data-step"), 10) || 0;
    var min = parseInt(field.getAttribute("min"), 10);
    if (isNaN(min)) min = 1;
    var value = parseInt(field.value, 10);
    if (isNaN(value)) value = min;
    var cap = parseInt(field.getAttribute("max"), 10) || 9999;
    field.value = String(Math.min(cap, Math.max(min, value + step)));
    field.dispatchEvent(new Event("input", { bubbles: true }));
  });

  root.addEventListener("input", function (event) {
    var target = event.target;
    if (!target || target.type !== "number") return;
    var value = clamp(target);
    var key = target.hasAttribute("data-spiegel") ? target.getAttribute("data-spiegel") : target.id.replace(/^menge-/, "");
    if (target.hasAttribute("data-spiegel")) {
      var canon = document.getElementById("menge-" + key);
      if (canon && canon !== target && canon.value !== String(value)) canon.value = String(value);
    } else {
      root.querySelectorAll('[data-spiegel="' + key + '"]').forEach(function (mirror) {
        if (mirror.value !== String(value)) mirror.value = String(value);
      });
    }
    paintList();
    syncCart();
  });

  root.addEventListener("change", function (event) {
    var target = event.target;
    if (!target) return;
    if (target.getAttribute("data-wahl")) {
      choice[target.getAttribute("data-wahl")] = target.value;
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
      managed["kauf:" + target.value] = 1;
      paintList();
      syncCart();
    }
  });

  root.addEventListener("submit", function (event) {
    event.preventDefault();
    syncCart();
  });

  if (wahl) {
    wahl.addEventListener("click", function () {
      setListe(wahl.getAttribute("aria-expanded") !== "true");
    });
  }
  if (haube) haube.addEventListener("click", function () { setListe(false); });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") setListe(false);
  });

  Promise.all([
    fetch(base + "data/bauzaun-beispiel.json").then(function (response) { return response.json(); }),
    fetch(base + "data/katalog.json").then(function (response) { return response.json(); })
  ]).then(function (pair) {
    config = pair[0];
    (pair[1] || []).forEach(function (item) { if (item && item.slug) bySlug[item.slug] = item; });
    product = bySlug[config.slug];
    if (!product) return;
    fillProduct();
    fillZubehoer();
    restoreCart();
    paintList();
    syncCart();
  }).catch(function () {});
})();
