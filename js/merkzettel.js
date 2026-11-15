(function () {
  var KEY = "amk-wunsch";

  function load() {
    try {
      var data = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
  }

  function save(items) {
    localStorage.setItem(KEY, JSON.stringify(items));
    paint(items);
  }

  function paint(items) {
    var count = String(items.length);
    document.querySelectorAll("[data-wunsch-count]").forEach(function (node) {
      node.textContent = count;
    });
    document.querySelectorAll("[data-add]").forEach(function (node) {
      var id = node.getAttribute("data-add");
      var on = items.some(function (item) { return item.id === id; });
      node.setAttribute("aria-pressed", on ? "true" : "false");
      if (node.tagName === "A" || node.tagName === "BUTTON") {
        node.textContent = on ? "Vom Merkzettel nehmen" : "Zur Anfrage hinzufügen";
      }
    });
  }

  document.addEventListener("click", function (event) {
    var node = event.target.closest("[data-add]");
    if (!node) return;
    event.preventDefault();
    var id = node.getAttribute("data-add");
    var name = node.getAttribute("data-name") || id;
    var items = load();
    var index = -1;
    items.forEach(function (item, i) { if (item.id === id) index = i; });
    if (index >= 0) items.splice(index, 1);
    else items.push({ id: id, name: name });
    save(items);
  });

  paint(load());
  window.AMK_WUNSCH = { load: load, save: save };
})();
