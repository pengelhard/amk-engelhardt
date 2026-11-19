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
    if (!value || value < 1) value = 1;
    if (value > 99) value = 99;
    field.value = String(value);
    return value;
  }

  var base = scriptRoot();
  var config = null;
  var product = null;
  var bySlug = {};
  var wahl = root.querySelector(".beispiel-leiste-wahl");
  var haube = root.querySelector(".beispiel-haube");

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
    if (key === "haupt") return document.getElementById("menge-beispiel");
    return document.getElementById("menge-" + key);
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

  function artText(art) {
    return art.vorsatz || art.hinweis || art.label || "";
  }

  function stepper(key, id, value, label) {
    return '<div class="beispiel-step">' +
      '<button type="button" data-step="-1" aria-label="Weniger">−</button>' +
      '<label class="visually-hidden" for="' + esc(id) + '">' + esc(label) + "</label>" +
      '<input id="' + esc(id) + '" data-spiegel="' + esc(key) + '" type="number" min="1" max="99" value="' + esc(value) + '" inputmode="numeric">' +
      '<button type="button" data-step="1" aria-label="Mehr">+</button>' +
      "</div>";
  }

  function paintArt() {
    var node = root.querySelector(".beispiel-post-art");
    if (node) node.textContent = artText(artNow());
  }

  function paintCount() {
    var node = document.getElementById("beispiel-posten");
    if (!node) return;
    var n = 1 + root.querySelectorAll('input[name="zubehoer"]:checked').length;
    node.textContent = n + " Posten";
  }

  function paintList() {
    var list = document.getElementById("beispiel-liste");
    if (!list || !product) return;
    var art = artNow();
    var main = document.getElementById("menge-beispiel");
    var html = '<li class="beispiel-post beispiel-post--haupt">' +
      '<p class="beispiel-post-text"><strong>' + esc(product.name) + "</strong>" +
      '<span class="beispiel-post-art">' + esc(artText(art)) + "</span></p>" +
      stepper("haupt", "menge-liste-haupt", main ? main.value : "1", "Menge " + product.name) +
      "</li>";
    root.querySelectorAll('input[name="zubehoer"]:checked').forEach(function (box) {
      var item = bySlug[box.value];
      if (!item) return;
      var field = document.getElementById("menge-" + box.value);
      html += '<li class="beispiel-post">' +
        '<p class="beispiel-post-text"><strong>' + esc(item.name) + "</strong></p>" +
        '<button type="button" class="beispiel-weg" data-weg="' + esc(box.value) + '" aria-label="' + esc(item.name) + ' entfernen">×</button>' +
        stepper(box.value, "menge-liste-" + box.value, field ? field.value : "1", "Menge " + item.name) +
        "</li>";
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
        return '<label class="beispiel-art"><span class="beispiel-wahl"><input type="radio" name="art" value="' + esc(entry.id) + '"' +
          (index === 0 ? " checked" : "") + '><span class="beispiel-kreis"></span></span><strong>' + esc(entry.label) + "</strong></label>";
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
        '<input id="menge-' + esc(slug) + '" name="menge-' + esc(slug) + '" type="number" min="1" max="99" value="1" inputmode="numeric">' +
        '<button type="button" data-step="1" aria-label="Mehr">+</button>' +
        "</div>" +
        '<a class="beispiel-details" href="' + esc(base + "produkt/" + slug + "/") + '">Details</a>' +
        "</div></article>";
    }).join("");
  }

  function submit(event) {
    event.preventDefault();
    var art = artNow();
    var field = document.getElementById("menge-beispiel");
    var qty = clamp(field);
    var note = art.hinweis || art.label;
    if (art.vorsatz) {
      note = qty + " " + art.vorsatz;
      if (art.inhalt && art.inhalt.length > 1) note += " · " + art.inhalt.slice(1).join(" · ");
    }
    var lines = [{
      id: "kauf:beispiel:" + art.id,
      name: product.name,
      qty: qty,
      bild: product.bild || "",
      kat: product.kat || "",
      note: note
    }];
    root.querySelectorAll('input[name="zubehoer"]:checked').forEach(function (box) {
      var item = bySlug[box.value];
      if (!item) return;
      var menge = document.getElementById("menge-" + box.value);
      lines.push({
        id: "kauf:" + item.slug,
        name: item.name,
        qty: clamp(menge),
        bild: item.bild || "",
        kat: item.kat || ""
      });
    });
    window.AMK_WUNSCH.add(lines);
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
    field.value = String(Math.min(99, Math.max(1, value + step)));
    field.dispatchEvent(new Event("input", { bubbles: true }));
  });

  root.addEventListener("input", function (event) {
    var target = event.target;
    if (!target || target.type !== "number") return;
    var value = clamp(target);
    if (target.hasAttribute("data-spiegel")) {
      var canon = canonical(target.getAttribute("data-spiegel"));
      if (canon && canon.value !== String(value)) canon.value = String(value);
    } else {
      var key = target.id === "menge-beispiel" ? "haupt" : target.id.replace(/^menge-/, "");
      root.querySelectorAll('[data-spiegel="' + key + '"]').forEach(function (mirror) {
        if (mirror.value !== String(value)) mirror.value = String(value);
      });
    }
  });

  root.addEventListener("change", function (event) {
    var target = event.target;
    if (target.name === "art") {
      showArt();
      paintArt();
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
      paintList();
    }
    if (target.type === "number") clamp(target);
  });

  root.addEventListener("submit", submit);

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
    paintList();
  }).catch(function () {});
})();
