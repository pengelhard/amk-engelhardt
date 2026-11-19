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

  function artNow() {
    var chosen = root.querySelector('input[name="art"]:checked');
    var id = chosen ? chosen.value : "";
    var found = null;
    (config.arten || []).forEach(function (entry) {
      if (entry.id === id) found = entry;
    });
    return found || config.arten[0];
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
      thumbs.innerHTML = slides.map(function (slide, index) {
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
        return '<label class="beispiel-art"><input type="radio" name="art" value="' + esc(entry.id) + '"' +
          (index === 0 ? " checked" : "") + "> <strong>" + esc(entry.label) + "</strong></label>";
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
      var mass = item.kicker ? "<p>" + esc(item.kicker) + "</p>" : "<p></p>";
      return '<article class="tile beispiel-pick">' +
        '<label class="beispiel-hit">' +
        '<span class="frame"><img src="' + esc(base + item.bild) + '" alt="' + esc(item.alt || item.name) + '" width="' + esc(item.width || 1200) + '" height="' + esc(item.height || 675) + '" decoding="async"></span>' +
        '<span class="beispiel-zeile"><input type="checkbox" name="zubehoer" value="' + esc(slug) + '"><h3>' + esc(item.name) + "</h3></span>" +
        "</label>" + mass +
        '<div class="beispiel-step" hidden>' +
        '<button type="button" data-step="-1" aria-label="Weniger">−</button>' +
        '<label class="visually-hidden" for="menge-' + esc(slug) + '">Menge</label>' +
        '<input id="menge-' + esc(slug) + '" name="menge-' + esc(slug) + '" type="number" min="1" max="99" value="1" inputmode="numeric">' +
        '<button type="button" data-step="1" aria-label="Mehr">+</button>' +
        "</div>" +
        '<a class="beispiel-details" href="' + esc(base + "produkt/" + slug + "/") + '">Details</a>' +
        "</article>";
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
      var menge = box.closest(".beispiel-pick").querySelector('input[type="number"]');
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
    var button = event.target.closest("[data-step]");
    if (!button || !root.contains(button)) return;
    var wrap = button.closest(".beispiel-step");
    var field = wrap ? wrap.querySelector('input[type="number"]') : null;
    if (!field) return;
    var step = parseInt(button.getAttribute("data-step"), 10) || 0;
    var value = parseInt(field.value, 10);
    if (!value || value < 1) value = 1;
    field.value = String(Math.min(99, Math.max(1, value + step)));
  });

  root.addEventListener("change", function (event) {
    var target = event.target;
    if (target.name === "art") showArt();
    if (target.name === "zubehoer") {
      var step = target.closest(".beispiel-pick").querySelector(".beispiel-step");
      if (step) step.hidden = !target.checked;
    }
    if (target.type === "number") clamp(target);
  });

  root.addEventListener("submit", submit);

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
  }).catch(function () {});
})();
