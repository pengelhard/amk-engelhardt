(function () {
  var nodes = document.querySelectorAll("[data-aktuelles]");
  if (!nodes.length) return;

  var TYPES = { "Angebot": true, "Neu": true, "Neuheit": true, "Besonderes Produkt": true };
  var LABELS = { "Neuheit": "Neu", "Neu": "Neu", "Angebot": "Angebot", "Besonderes Produkt": "Besonderes Produkt" };
  var GRUPPEN = {
    "zaun": "zaun",
    "schilder": "schilder",
    "absperrung": "absperrung",
    "anhaenger": "anhaenger",
    "Bauzaun & Absperrgitter": "zaun",
    "Verkehrsschilder": "schilder",
    "Verkehrsabsperreinrichtungen": "absperrung",
    "Anhänger": "anhaenger",
    "Anhaenger": "anhaenger"
  };

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function localPath(value) {
    var path = String(value || "").trim();
    if (!path || /^[a-z]+:/i.test(path) || path.indexOf("..") !== -1) return "";
    return path.replace(/^\/+/, "");
  }

  function stillValid(until) {
    if (!until) return true;
    var end = new Date(until + "T23:59:59");
    return !isNaN(end.getTime()) && end.getTime() >= Date.now();
  }

  function visible(entry) {
    return entry.sichtbar !== false && entry.sichtbar !== "false" && entry.sichtbar !== "nein";
  }

  function stamp(entry) {
    if (!entry.datum) return 0;
    var time = Date.parse(entry.datum);
    return isNaN(time) ? 0 : time;
  }

  function liveEntries(entries) {
    return entries.filter(function (entry) {
      return entry && entry.titel && visible(entry) && stillValid(entry.bis);
    }).sort(function (a, b) {
      return stamp(b) - stamp(a);
    });
  }

  function wegOf(entry) {
    var value = String(entry.weg || "").trim().toLowerCase();
    if (value === "miete" || value === "kauf" || value === "beides") return value;
    return "beides";
  }

  function artOf(entry) {
    var value = String(entry.art || "").trim().toLowerCase();
    if (value === "miete" || value === "kauf" || value === "beides") return value;
    return wegOf(entry);
  }

  function gruppeOf(entry) {
    var raw = String(entry.gruppe || "").trim();
    var id = GRUPPEN[raw] || GRUPPEN[raw.toLowerCase()] || "";
    if (id === "schilder" || id === "absperrung") return "verkehr";
    return id;
  }

  function ziel(entry, root) {
    var product = String(entry.slug || "").trim();
    var miete = artOf(entry) === "miete";
    if (/^[a-z0-9-]+$/.test(product)) {
      return root + "produkt/" + product + "/" + (miete ? "?modus=miete" : "");
    }
    var gruppe = gruppeOf(entry);
    var query = gruppe ? "?gruppe=" + encodeURIComponent(gruppe) : "";
    if (miete) query += (query ? "&" : "?") + "modus=miete";
    return root + "kaufen/" + query;
  }

  function etikett(entry) {
    if (!TYPES[entry.typ]) return "";
    return LABELS[entry.typ] || "";
  }

  function card(entry, root) {
    var img = localPath(entry.bild);
    var small = localPath(entry.bildKlein);
    var title = String(entry.titel);
    var width = parseInt(entry.breite, 10) || 1200;
    var height = parseInt(entry.hoehe, 10) || 675;
    var srcset = img
      ? (small ? esc(root + small) + " 640w, " + esc(root + img) + " " + width + "w" : esc(root + img) + " " + width + "w")
      : "";
    var picture = img
      ? '<span class="frame"><img loading="lazy" src="' + esc(root + img) + '" srcset="' + srcset + '" sizes="(min-width: 1100px) 22vw, (min-width: 720px) 45vw, 100vw" width="' + width + '" height="' + height + '" alt="' + esc(entry.alt || title) + '" decoding="async"></span>'
      : "";
    var badge = etikett(entry) ? '<span class="badge">' + esc(etikett(entry)) + "</span> " : "";
    var art = artOf(entry);
    if (art === "miete" || art === "beides") badge += '<span class="badge badge--miete">Miete</span> ';
    if (art === "kauf" || art === "beides") badge += '<span class="badge badge--kauf">Kauf</span> ';
    return (
      '<article class="tile"><a href="' + esc(ziel(entry, root)) + '">' + picture +
      "<h3>" + esc(title) + "</h3></a><p>" + badge + esc(entry.text || "") + "</p></article>"
    );
  }

  function paint(node, entries) {
    var root = node.getAttribute("data-root") || "";
    var limit = parseInt(node.getAttribute("data-limit") || "", 10);
    var home = node.getAttribute("data-home") === "ja";
    var block = home ? document.getElementById("neuheiten") : null;
    var live = liveEntries(entries);
    var shown = limit > 0 ? live.slice(0, limit) : live;
    if (!shown.length) {
      if (home && block) block.hidden = true;
      else node.innerHTML = '<p class="offer-empty">Zurzeit keine Einträge.</p>';
      return;
    }
    if (block) block.hidden = false;
    node.innerHTML = shown.map(function (entry) {
      return card(entry, root);
    }).join("");
  }

  var root = nodes[0].getAttribute("data-root") || "";
  fetch(root + "data/aktuelles.json")
    .then(function (response) {
      if (!response.ok) throw new Error("status");
      return response.json();
    })
    .then(function (entries) {
      if (!Array.isArray(entries)) throw new Error("shape");
      nodes.forEach(function (node) { paint(node, entries); });
    })
    .catch(function () {
      nodes.forEach(function (node) {
        if (node.getAttribute("data-home") === "ja") {
          var block = document.getElementById("neuheiten");
          if (block) block.hidden = true;
          return;
        }
        node.innerHTML = '<p class="offer-empty">Die Einträge konnten nicht geladen werden.</p>';
      });
    });
})();
