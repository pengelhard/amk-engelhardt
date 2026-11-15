(function () {
  var KEY = "amk-wunsch";

  var ART_KEYS = { standard: 1, f1: 1, secure: 1, xxl: 1 };
  var EXTRA_NAMES = {
    "Hochsicherheitsschellen": 1,
    "Bauzaunplane": 1,
    "Sichtschutz": 1,
    "Tür": 1,
    "Tor": 1,
    "Zusatzstreben": 1
  };

  function cleanKonfig(konfig) {
    if (!konfig || typeof konfig !== "object") return null;
    var menge = String(konfig.menge || "").trim();
    if (!menge) return null;
    var extras = [];
    if (Array.isArray(konfig.extras)) {
      konfig.extras.forEach(function (name) {
        if (EXTRA_NAMES[name] && extras.indexOf(name) === -1) extras.push(name);
      });
    }
    return {
      art: String(konfig.art || "").slice(0, 80),
      key: ART_KEYS[konfig.key] ? konfig.key : "",
      menge: menge.slice(0, 12),
      einheit: konfig.einheit === "felder" ? "felder" : "m",
      von: String(konfig.von || "").slice(0, 10),
      bis: String(konfig.bis || "").slice(0, 10),
      extras: extras
    };
  }

  function localBild(value) {
    var path = String(value || "").trim();
    if (!path || /^[a-z]+:/i.test(path) || path.indexOf("..") !== -1) return "";
    return path.replace(/^\/+/, "");
  }

  function normalize(items) {
    if (!Array.isArray(items)) return [];
    return items.filter(function (item) {
      return item && item.id;
    }).map(function (item) {
      var qty = parseInt(item.qty, 10);
      if (!qty || qty < 1) qty = 1;
      if (qty > 99) qty = 99;
      var next = { id: String(item.id), name: String(item.name || item.id), qty: qty };
      var konfig = cleanKonfig(item.konfig);
      if (konfig) next.konfig = konfig;
      var bild = localBild(item.bild);
      var note = String(item.note || "").trim();
      if (bild) next.bild = bild;
      if (note) next.note = note.slice(0, 80);
      return next;
    });
  }

  function load() {
    try {
      return normalize(JSON.parse(localStorage.getItem(KEY) || "[]"));
    } catch (error) {
      return [];
    }
  }

  function countOf(items) {
    return items.reduce(function (sum, item) { return sum + item.qty; }, 0);
  }

  function paint(items) {
    var count = countOf(items);
    var label = count === 0 ? "Anfrage, keine Artikel" : "Anfrage, " + count + " Artikel";
    document.querySelectorAll("[data-wunsch-count]").forEach(function (node) {
      node.textContent = String(count);
      if (count === 0) node.setAttribute("data-empty", "true");
      else node.removeAttribute("data-empty");
    });
    document.querySelectorAll("a.inquiry").forEach(function (node) {
      node.setAttribute("aria-label", label);
    });
  }

  function save(items, quiet) {
    var next = normalize(items);
    localStorage.setItem(KEY, JSON.stringify(next));
    paint(next);
    if (!quiet && window.AMK_WUNSCH && typeof window.AMK_WUNSCH.onChange === "function") {
      window.AMK_WUNSCH.onChange(next);
    }
    return next;
  }

  var toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role", "status");
  toast.hidden = true;
  toast.innerHTML = '<p class="toast-title">In die Anfrage gelegt.</p><p class="toast-note">Preis auf Anfrage.</p><div class="toast-actions"><button type="button" class="btn btn-ghost" data-toast-stay>Weiter umsehen</button><a class="btn" data-toast-go href="anfrage/">Zur Anfrage</a></div>';
  document.body.appendChild(toast);

  function hideToast() { toast.hidden = true; }
  var timer = 0;
  toast.querySelector("[data-toast-stay]").addEventListener("click", hideToast);
  toast.addEventListener("focusin", function () { window.clearTimeout(timer); });
  toast.addEventListener("pointerenter", function () { window.clearTimeout(timer); });

  function showToast() {
    var link = document.querySelector("a.inquiry");
    var go = toast.querySelector("[data-toast-go]");
    if (link && go) go.setAttribute("href", link.getAttribute("href"));
    toast.hidden = false;
    window.clearTimeout(timer);
    timer = window.setTimeout(hideToast, 7000);
    toast.querySelector("[data-toast-stay]").focus();
  }

  document.addEventListener("click", function (event) {
    var node = event.target.closest("[data-add]");
    if (!node) return;
    event.preventDefault();
    var id = node.getAttribute("data-add");
    var name = node.getAttribute("data-name") || id;
    var note = node.getAttribute("data-note") || "";
    var noteNode = toast.querySelector(".toast-note");
    if (noteNode) noteNode.textContent = note || "Preis auf Anfrage.";
    var items = load();
    var found = null;
    items.forEach(function (item) { if (item.id === id) found = item; });
    if (found) found.qty += 1;
    else items.push({ id: id, name: name, qty: 1, bild: node.getAttribute("data-bild") || "", note: note });
    save(items);
    showToast();
  });

  function add(item) {
    var items = load();
    items.push(item);
    save(items);
    showToast();
    return items;
  }

  window.AMK_WUNSCH = { load: load, save: save, add: add, onChange: null };
  paint(load());
})();
