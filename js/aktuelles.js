(function () {
  var nodes = document.querySelectorAll("[data-aktuelles]");
  if (!nodes.length) return;

  var TYPES = { "Angebot": true, "Neuheit": true, "Besonderes Produkt": true };
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

  function slug(value) {
    var text = String(value || "").toLowerCase();
    text = text.replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss");
    text = text.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return text || "eintrag";
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

  function gruppeOf(entry) {
    var raw = String(entry.gruppe || "").trim();
    return GRUPPEN[raw] || GRUPPEN[raw.toLowerCase()] || "";
  }

  function ways(entry, root) {
    var weg = wegOf(entry);
    var gruppe = gruppeOf(entry);
    var query = gruppe ? "?gruppe=" + encodeURIComponent(gruppe) : "";
    var links = "";
    if (weg !== "kauf") {
      links += '<a class="btn" href="' + esc(root + "mieten/" + query) + '" aria-label="' + esc(entry.titel + " mieten") + '">Mieten</a>';
    }
    if (weg !== "miete") {
      links += '<a class="btn btn-ghost" href="' + esc(root + "kaufen/" + query) + '" aria-label="' + esc(entry.titel + " kaufen") + '">Kaufen</a>';
    }
    return '<div class="news-ways">' + links + "</div>";
  }

  function card(entry, root) {
    var img = localPath(entry.bild);
    var title = String(entry.titel);
    var price = String(entry.preis || "").trim();
    var picture = img
      ? '<img src="' + esc(root + img) + '" alt="' + esc(entry.alt || "") + '" width="1200" height="675" loading="lazy" decoding="async">'
      : "";
    var badge = TYPES[entry.typ] ? '<span class="badge">' + esc(entry.typ) + "</span>" : "";
    var note = price ? ' data-note="' + esc(price) + '"' : "";
    var bild = img ? ' data-bild="' + esc(img) + '"' : "";
    return (
      '<article class="news-card">' + picture +
      '<div class="news-body">' + badge +
      "<strong>" + esc(title) + "</strong>" +
      "<p>" + esc(entry.text || "") + "</p>" +
      (price ? '<p class="news-price">' + esc(price) + "</p>" : "") +
      ways(entry, root) +
      '<button type="button" class="btn" data-add="aktuell:' + esc(slug(title)) + '" data-name="' + esc(title) + '"' + bild + note + ">Anfragen</button>" +
      "</div></article>"
    );
  }

  function paint(node, entries) {
    var root = node.getAttribute("data-root") || "";
    var limit = parseInt(node.getAttribute("data-limit") || "", 10);
    var home = node.getAttribute("data-home") === "ja";
    var block = home ? document.getElementById("aktuelles") : null;
    var live = liveEntries(entries);
    var shown = limit > 0 ? live.slice(0, limit) : live;
    if (!shown.length) {
      if (home && block) block.hidden = true;
      else node.innerHTML = '<p class="offer-empty">Zurzeit keine Einträge.</p>';
      return;
    }
    if (block) block.hidden = false;
    var layout = shown.length === 1 ? "news-banner" : "news-grid";
    node.innerHTML = '<div class="' + layout + '">' + shown.map(function (entry) {
      return card(entry, root);
    }).join("") + "</div>";
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
          var block = document.getElementById("aktuelles");
          if (block) block.hidden = true;
          return;
        }
        node.innerHTML = '<p class="offer-empty">Die Einträge konnten nicht geladen werden.</p>';
      });
    });
})();
