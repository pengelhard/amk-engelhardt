(function () {
  var KEY = "amk-wunsch";

  function normalize(items) {
    if (!Array.isArray(items)) return [];
    return items.filter(function (item) {
      return item && item.id;
    }).map(function (item) {
      var qty = parseInt(item.qty, 10);
      if (!qty || qty < 1) qty = 1;
      if (qty > 99) qty = 99;
      return { id: String(item.id), name: String(item.name || item.id), qty: qty };
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
    var items = load();
    var found = null;
    items.forEach(function (item) { if (item.id === id) found = item; });
    if (found) found.qty += 1;
    else items.push({ id: id, name: name, qty: 1 });
    save(items);
    showToast();
  });

  window.AMK_WUNSCH = { load: load, save: save, onChange: null };
  paint(load());
})();
