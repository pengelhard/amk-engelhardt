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
    var value = parseInt(field.value, 10);
    var cap = parseInt(field.getAttribute("max"), 10);
    if (!cap || cap < 1) cap = 9999;
    if (!value || value < 1) value = 1;
    if (value > cap) value = cap;
    field.value = String(value);
    return value;
  }

  var base = scriptRoot();
  var config = null;
  var product = null;
  var bySlug = {};
  var wahl = root.querySelector(".beispiel-leiste-wahl");
  var haube = root.querySelector(".beispiel-haube");
  var modus = {};
  var managed = {
    "kauf:beispiel:felder": 1,
    "kauf:beispiel:staender": 1,
    "kauf:beispiel:transportstaender": 1
  };

  function artNow() {
    var chosen = root.querySelector('input[name="art"]:checked');
    var id = chosen ? chosen.value : "";
    var found = null;
    (config.arten || []).forEach(function (entry) {
      if (entry.id === id) found = entry;
    });
    return found || config.arten[0];
  }

  function canonical(key) {
    return document.getElementById("menge-" + key);
  }

  function staenderArt() {
    var found = null;
    (config.arten || []).forEach(function (entry) {
      if (entry.id === "staender") found = entry;
    });
    return found || {};
  }

  function felderJe() {
    var n = parseInt(staenderArt().felderJe, 10);
    return n > 0 ? n : 30;
  }

  function autoMenge(je) {
    var n = je * standZahl();
    if (n < 1) n = 1;
    if (n > 9999) n = 9999;
    return n;
  }

  function showArt() {
    var art = artNow();
    var unit = document.getElementById("beispiel-einheit");
    var list = document.getElementById("beispiel-inhalt");
    if (unit) unit.textContent = art.einheit || "";
    if (!list) return;
    if (art.inhalt && art.inhalt.length) {
      list.hidden = false;
      list.innerHTML = art.inhalt.map(function (line) {
        return "<li>" + esc(line) + "</li>";
      }).join("");
    } else {
      list.hidden = true;
      list.innerHTML = "";
    }
  }

  function standZahl() {
    var field = document.getElementById("menge-staender");
    return field ? clamp(field) : 1;
  }

  function feldZahl() {
    var field = document.getElementById("menge-felder");
    return field ? clamp(field) : 1;
  }

  function standardVon(slug) {
    var found = null;
    (config.arten || []).forEach(function (art) {
      (art.posten || []).forEach(function (row) {
        if (row.slug === slug) found = row;
      });
    });
    return found;
  }

  function stepper(key, id, value, label, max) {
    return '<div class="beispiel-step">' +
      '<button type="button" data-step="-1" aria-label="Weniger">−</button>' +
      '<label class="visually-hidden" for="' + esc(id) + '">' + esc(label) + "</label>" +
      '<input id="' + esc(id) + '" data-spiegel="' + esc(key) + '" type="number" min="1" max="' + (max || 9999) + '" value="' + esc(value) + '" inputmode="numeric">' +
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

  function setMenge(slug, value) {
    var field = document.getElementById("menge-" + slug);
    if (field) field.value = String(value);
    root.querySelectorAll('[data-spiegel="' + slug + '"]').forEach(function (mirror) {
      mirror.value = String(value);
    });
  }

  function syncStandards(entering) {
    var art = artNow();
    if (!art || art.id !== "staender") {
      Object.keys(modus).forEach(function (slug) {
        if (modus[slug] !== "auto") return;
        setChecked(slug, false);
        setMenge(slug, 1);
        delete modus[slug];
      });
      return;
    }
    (art.posten || []).forEach(function (row) {
      var state = modus[row.slug];
      var box = root.querySelector('input[name="zubehoer"][value="' + row.slug + '"]');
      var kept = state === "hand" && box && box.checked;
      if (entering && !kept) state = "auto";
      if (state === "weg" || state === "hand") return;
      modus[row.slug] = "auto";
      setChecked(row.slug, true);
      setMenge(row.slug, autoMenge(row.je));
    });
  }

  function paintCount() {
    var node = document.getElementById("beispiel-posten");
    var list = document.getElementById("beispiel-liste");
    if (!node || !list) return;
    var n = list.querySelectorAll(".beispiel-post").length;
    node.textContent = n + " Posten";
  }

  function festZeile(name, qty, note) {
    return '<li class="beispiel-post beispiel-post--fest">' +
      '<p class="beispiel-post-text"><strong>' + esc(name) + "</strong>" +
      (note ? '<span class="beispiel-post-art">' + esc(note) + "</span>" : "") +
      '</p><p class="beispiel-post-fest">' + esc(qty) + "</p></li>";
  }

  function postZeile(slug, hint) {
    var item = bySlug[slug];
    if (!item) return "";
    var field = document.getElementById("menge-" + slug);
    return '<li class="beispiel-post">' +
      '<p class="beispiel-post-text"><strong>' + esc(item.name) + "</strong>" +
      (hint ? '<span class="beispiel-post-art">' + esc(hint) + "</span>" : "") +
      "</p>" +
      '<button type="button" class="beispiel-weg" data-weg="' + esc(slug) + '" aria-label="' + esc(item.name) + ' entfernen">×</button>' +
      stepper(slug, "menge-liste-" + slug, field ? field.value : "1", "Menge " + item.name, 9999) +
      "</li>";
  }

  function paintList() {
    var list = document.getElementById("beispiel-liste");
    if (!list || !product) return;
    var art = artNow();
    var html = "";
    var stand = (art && art.staender) || {};
    if (art && art.id === "staender") {
      var n = standZahl();
      var standItem = bySlug[stand.slug] || {};
      html += festZeile(product.name, autoMenge(felderJe()), "aus " + n + " Komplett-Ständer");
      html += festZeile(standItem.name || stand.name || "Transportständer", n, stand.vermerk || "inklusive");
    } else {
      var main = document.getElementById("menge-felder");
      html += '<li class="beispiel-post beispiel-post--haupt">' +
        '<p class="beispiel-post-text"><strong>' + esc(product.name) + "</strong>" +
        '<span class="beispiel-post-art">Einzelne Felder</span></p>' +
        stepper("felder", "menge-liste-felder", main ? main.value : "1", "Feldanzahl", 9999) +
        "</li>";
    }
    var seen = {};
    (art.posten || []).forEach(function (row) {
      var box = root.querySelector('input[name="zubehoer"][value="' + row.slug + '"]');
      if (!box || !box.checked) return;
      seen[row.slug] = true;
      html += postZeile(row.slug);
    });
    root.querySelectorAll('input[name="zubehoer"]:checked').forEach(function (box) {
      if (seen[box.value]) return;
      var hint = art.id === "staender" && box.value === stand.slug ? "zusätzlich" : "";
      html += postZeile(box.value, hint);
    });
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

    var arten = document.getElementById("beispiel-arten");
    if (arten) {
      arten.innerHTML = (config.arten || []).map(function (entry, index) {
        var inputId = "menge-" + entry.id;
        var unit = entry.einheit || entry.label;
        return '<div class="beispiel-art-karte">' +
          '<label class="beispiel-art"><span class="beispiel-wahl"><input type="radio" name="art" value="' + esc(entry.id) + '"' +
          (index === 0 ? " checked" : "") + '><span class="beispiel-kreis"></span></span>' +
          '<span class="beispiel-art-text"><strong>' + esc(entry.label) + '</strong><span class="beispiel-art-einheit">' + esc(unit) + "</span></span></label>" +
          '<div class="beispiel-step"><button type="button" data-step="-1" aria-label="Weniger">−</button>' +
          '<label class="visually-hidden" for="' + esc(inputId) + '">' + esc(unit) + "</label>" +
          '<input id="' + esc(inputId) + '" name="' + esc(inputId) + '" type="number" min="1" max="9999" value="1" inputmode="numeric">' +
          '<button type="button" data-step="1" aria-label="Mehr">+</button></div></div>';
      }).join("");
    }
    showArt();
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

  function lineOf(item, qty, note, herkunft) {
    var line = {
      id: item.id,
      name: item.name,
      qty: qty,
      bild: item.bild || "",
      kat: item.kat || product.kat || "",
      herkunft: herkunft
    };
    if (note) line.note = note;
    return line;
  }

  function linesNow() {
    var art = artNow();
    var lines = [];
    if (art.id === "staender") {
      var n = standZahl();
      var stand = art.staender || {};
      var standItem = bySlug[stand.slug] || {};
      lines.push(lineOf({
        id: "kauf:beispiel:felder",
        name: product.name,
        bild: product.bild,
        kat: product.kat
      }, autoMenge(felderJe()), "aus " + n + " Komplett-Ständer", "auto"));
      lines.push(lineOf({
        id: "kauf:beispiel:transportstaender",
        name: standItem.name || stand.name || "Transportständer",
        bild: standItem.bild || "",
        kat: standItem.kat || product.kat
      }, n, stand.vermerk || "inklusive", "auto"));
    } else {
      lines.push(lineOf({
        id: "kauf:beispiel:felder",
        name: product.name,
        bild: product.bild,
        kat: product.kat
      }, feldZahl(), "", "manuell"));
    }
    var standSlug = (art.staender && art.staender.slug) || (staenderArt().staender && staenderArt().staender.slug) || "";
    root.querySelectorAll('input[name="zubehoer"]:checked').forEach(function (box) {
      var item = bySlug[box.value];
      if (!item) return;
      var herkunft = modus[box.value] === "auto" ? "auto" : "manuell";
      var note = art.id === "staender" && box.value === standSlug ? "zusätzlich" : "";
      lines.push(lineOf({
        id: "kauf:" + item.slug,
        name: item.name,
        bild: item.bild,
        kat: item.kat
      }, clamp(document.getElementById("menge-" + box.value)), note, herkunft));
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
        found.herkunft = line.herkunft;
        if (line.note) found.note = line.note;
        else delete found.note;
      } else items.push(line);
    });
    window.AMK_WUNSCH.save(items, true);
  }

  function restoreCart() {
    var items = window.AMK_WUNSCH.load();
    var byId = {};
    items.forEach(function (item) { byId[item.id] = item; });
    var fields = byId["kauf:beispiel:felder"];
    var autoStand = byId["kauf:beispiel:transportstaender"];
    var legacy = byId["kauf:beispiel:staender"];
    var komplett = !!(autoStand && (autoStand.herkunft === "auto" || autoStand.note === "inklusive")) || !!legacy;
    if (komplett) {
      var radio = root.querySelector('input[name="art"][value="staender"]');
      if (radio) radio.checked = true;
      var nField = document.getElementById("menge-staender");
      var n = autoStand ? autoStand.qty : (legacy ? legacy.qty : 1);
      if (nField) nField.value = String(n);
      showArt();
    } else if (fields) {
      var radioFelder = root.querySelector('input[name="art"][value="felder"]');
      if (radioFelder) radioFelder.checked = true;
      var fField = document.getElementById("menge-felder");
      if (fField) fField.value = String(fields.qty);
      showArt();
    }
    var known = {};
    (config.zubehoer || []).forEach(function (slug) { known[slug] = 1; });
    items.forEach(function (item) {
      var slug = String(item.id || "");
      if (slug.indexOf("kauf:") !== 0) return;
      slug = slug.slice(5);
      if (!known[slug]) return;
      if (item.herkunft === "auto" && artNow().id !== "staender") return;
      var box = root.querySelector('input[name="zubehoer"][value="' + slug + '"]');
      if (!box) return;
      box.checked = true;
      var pick = box.closest(".beispiel-pick");
      var step = pick ? pick.querySelector(".beispiel-step") : null;
      if (step) step.hidden = false;
      setMenge(slug, item.qty);
      managed[item.id] = 1;
      var row = standardVon(slug);
      if (!row) return;
      if (artNow().id === "staender" && item.herkunft === "auto") modus[slug] = "auto";
      else if (artNow().id === "staender" && item.herkunft !== "manuell" && item.qty === autoMenge(row.je)) modus[slug] = "auto";
      else modus[slug] = "hand";
    });
    if (artNow().id === "staender") {
      (artNow().posten || []).forEach(function (row) {
        if (!modus[row.slug]) modus[row.slug] = "weg";
      });
    }
  }

  root.addEventListener("click", function (event) {
    var weg = event.target.closest("[data-weg]");
    if (weg && root.contains(weg)) {
      var box = root.querySelector('input[name="zubehoer"][value="' + weg.getAttribute("data-weg") + '"]');
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
    var value = parseInt(field.value, 10);
    if (!value || value < 1) value = 1;
    var cap = parseInt(field.getAttribute("max"), 10) || 9999;
    field.value = String(Math.min(cap, Math.max(1, value + step)));
    field.dispatchEvent(new Event("input", { bubbles: true }));
  });

  function noteHand(slug, value) {
    var row = standardVon(slug);
    if (!row || modus[slug] !== "auto") return;
    if (value !== autoMenge(row.je)) modus[slug] = "hand";
  }

  root.addEventListener("input", function (event) {
    var target = event.target;
    if (!target || target.type !== "number") return;
    var value = clamp(target);
    var key = target.hasAttribute("data-spiegel") ? target.getAttribute("data-spiegel") : target.id.replace(/^menge-/, "");
    if (target.hasAttribute("data-spiegel")) {
      var canon = canonical(key);
      if (canon && canon !== target && canon.value !== String(value)) canon.value = String(value);
    } else {
      root.querySelectorAll('[data-spiegel="' + key + '"]').forEach(function (mirror) {
        if (mirror.value !== String(value)) mirror.value = String(value);
      });
    }
    if (key === "staender" && artNow().id === "staender") {
      syncStandards(false);
      paintList();
    } else if (key !== "felder" && key !== "staender") noteHand(key, value);
    syncCart();
  });

  root.addEventListener("change", function (event) {
    var target = event.target;
    if (target.name === "art") {
      showArt();
      syncStandards(true);
      paintList();
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
      if (standardVon(target.value)) modus[target.value] = target.checked ? "hand" : "weg";
      paintList();
    }
    if (target.type === "number") clamp(target);
    syncCart();
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
