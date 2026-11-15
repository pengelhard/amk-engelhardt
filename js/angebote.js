(function () {
  var nodes = document.querySelectorAll("[data-angebote]");
  if (!nodes.length) return;

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

  function card(entry, root) {
    var href = localPath(entry.link);
    var img = localPath(entry.bild);
    var open = href ? '<a class="offer" href="' + esc(root + href) + '">' : '<article class="offer">';
    var close = href ? "</a>" : "</article>";
    var badges = '<span class="badge">' + esc(entry.badge || "Angebot") + "</span>";
    if (entry.beispiel) badges += '<span class="badge">Beispiel</span>';
    var picture = img
      ? '<img src="' + esc(root + img) + '" alt="' + esc(entry.alt || "") + '" width="1200" height="675">'
      : "";
    return (
      open + picture +
      '<span class="offer-body"><span class="badges">' + badges + "</span>" +
      "<strong>" + esc(entry.titel) + "</strong>" +
      "<p>" + esc(entry.text) + "</p></span>" + close
    );
  }

  function paint(node, entries) {
    var root = node.getAttribute("data-root") || "";
    var live = entries.filter(function (entry) { return stillValid(entry.bis); });
    if (!live.length) {
      node.innerHTML = '<p class="offer-empty">Zurzeit keine Angebote.</p>';
      return;
    }
    node.innerHTML = '<div class="offer-grid">' + live.map(function (entry) {
      return card(entry, root);
    }).join("") + "</div>";
  }

  var root = nodes[0].getAttribute("data-root") || "";
  fetch(root + "data/angebote.json")
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
        node.innerHTML = '<p class="offer-empty">Die Angebote konnten nicht geladen werden.</p>';
      });
    });
})();
