(function () {
  var KEY = "amk-wunsch";

  var ART_KEYS = { standard: 1, f1: 1, secure: 1, xxl: 1 };
  var EXTRA_NAMES = {
    "Hochsicherheitsschellen": 1,
    "Bauzaunplane": 1,
    "Sichtschutz": 1,
    "Tür": 1,
    "Tor": 1,
    "Zusatzstreben": 1,
    "Lauftor/Tür": 1,
    "Einfahrtstor": 1,
    "Sichtschutzplane": 1,
    "Sicherheitsschellen": 1,
    "Schwere Füße": 1,
    "Straßenverkehr/Absicherung": 1
  };
  var COUNTED = { "Bauzaunplane": 1, "Tür": 1, "Tor": 1, "Zusatzstreben": 1 };

  function cleanExtra(entry) {
    var name = "";
    var menge = 0;
    if (typeof entry === "string") name = entry;
    else if (entry && typeof entry === "object") {
      name = String(entry.name || "");
      menge = parseInt(entry.menge, 10);
    }
    if (!EXTRA_NAMES[name]) return null;
    if (!COUNTED[name]) return { name: name };
    if (!menge || menge < 1) menge = 1;
    if (menge > 99) menge = 99;
    return { name: name, menge: menge };
  }

  function cleanKonfig(konfig) {
    if (!konfig || typeof konfig !== "object") return null;
    var menge = String(konfig.menge || "").trim();
    if (!menge) return null;
    var extras = [];
    var seen = {};
    if (Array.isArray(konfig.extras)) {
      konfig.extras.forEach(function (entry) {
        var extra = cleanExtra(entry);
        if (!extra || seen[extra.name]) return;
        seen[extra.name] = 1;
        extras.push(extra);
      });
    }
    var next = {
      art: String(konfig.art || "").slice(0, 80),
      key: ART_KEYS[konfig.key] ? konfig.key : "",
      menge: menge.slice(0, 12),
      einheit: konfig.einheit === "felder" ? "felder" : "m",
      von: String(konfig.von || "").slice(0, 10),
      bis: String(konfig.bis || "").slice(0, 10),
      extras: extras
    };
    var bemerkung = String(konfig.bemerkung || "").trim();
    if (bemerkung) next.bemerkung = bemerkung.slice(0, 600);
    return next;
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
      if (note) next.note = note.slice(0, 600);
      if (item.sammel) next.sammel = true;
      if (item.genehmigung) next.genehmigung = true;
      var ort = String(item.ort || "").trim();
      if (ort) next.ort = ort.slice(0, 160);
      var kat = String(item.kat || "");
      if (kat === "bauzaun" || kat === "verkehrssicherung" || kat === "anhaenger") next.kat = kat;
      return next;
    });
  }

  function migrateZeit(raw) {
    if (!Array.isArray(raw) || !raw.some(function (item) { return item && (item.von || item.bis); })) return raw;
    var found = null;
    raw.forEach(function (item) {
      if (found || !item) return;
      var von = String(item.von || "");
      var bis = String(item.bis || "");
      if (/^\d{4}-\d{2}-\d{2}$/.test(von) && /^\d{4}-\d{2}-\d{2}$/.test(bis)) found = { von: von, bis: bis };
    });
    if (found) {
      var meta = {};
      try { meta = JSON.parse(localStorage.getItem("amk-anfrage-meta") || "{}") || {}; } catch (error) { meta = {}; }
      if (!meta.von && !meta.bis) {
        meta.von = found.von;
        meta.bis = found.bis;
        localStorage.setItem("amk-anfrage-meta", JSON.stringify(meta));
      }
    }
    return raw.map(function (item) {
      if (!item || (!item.von && !item.bis)) return item;
      var copy = {};
      Object.keys(item).forEach(function (key) {
        if (key !== "von" && key !== "bis") copy[key] = item[key];
      });
      return copy;
    });
  }

  function load() {
    try {
      var raw = JSON.parse(localStorage.getItem(KEY) || "[]");
      var migrated = migrateZeit(raw);
      if (migrated !== raw) localStorage.setItem(KEY, JSON.stringify(migrated));
      return normalize(migrated);
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
  toast.innerHTML = '<p class="toast-title">In die Anfrage gelegt.</p><p class="toast-note" hidden></p><div class="toast-actions"><button type="button" class="btn btn-ghost" data-toast-stay>Weiter umsehen</button><a class="btn" data-toast-go href="anfrage/">Zur Anfrage</a></div>';
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
    if (noteNode) {
      noteNode.hidden = !note;
      noteNode.textContent = note;
    }
    var items = load();
    var found = null;
    items.forEach(function (item) { if (item.id === id) found = item; });
    if (found) found.qty += 1;
    else items.push({ id: id, name: name, qty: 1, bild: node.getAttribute("data-bild") || "", note: note });
    save(items);
    showToast();
  });

  function merge(items, incoming) {
    var found = null;
    if (incoming.sammel) {
      items.forEach(function (existing) {
        if (found || !existing.sammel) return;
        if (existing.id === incoming.id && (existing.note || "") === (incoming.note || "")) found = existing;
      });
    } else if (!incoming.konfig) {
      items.forEach(function (existing) {
        if (existing.konfig || existing.sammel || found) return;
        if (existing.id === incoming.id && (existing.von || "") === (incoming.von || "") && (existing.bis || "") === (incoming.bis || "")) found = existing;
      });
    }
    if (found && !incoming.sammel) found.qty = Math.min(99, found.qty + incoming.qty);
    else if (!found) items.push(incoming);
  }

  function add(item) {
    var batch = Array.isArray(item) ? item : [item];
    var items = load();
    var added = 0;
    batch.forEach(function (entry) {
      var incoming = normalize([entry])[0];
      if (!incoming) return;
      merge(items, incoming);
      added += 1;
    });
    if (!added) return items;
    save(items);
    showToast();
    return items;
  }

  function replace(item) {
    var batch = Array.isArray(item) ? item : [item];
    var incoming = [];
    batch.forEach(function (entry) {
      var next = normalize([entry])[0];
      if (next) incoming.push(next);
    });
    if (!incoming.length) return load();
    var ids = {};
    incoming.forEach(function (entry) { ids[entry.id] = 1; });
    var items = load().filter(function (entry) { return !ids[entry.id]; });
    incoming.forEach(function (entry) { items.push(entry); });
    save(items);
    showToast();
    return items;
  }

  function remove(id) {
    var key = String(id || "");
    var items = load();
    var next = items.filter(function (entry) { return entry.id !== key; });
    if (next.length === items.length) return next;
    save(next);
    return next;
  }

  window.AMK_WUNSCH = { load: load, save: save, add: add, replace: replace, remove: remove, onChange: null };
  paint(load());
})();
