(function () {
  /* Ein Stand für alle Kaufseiten. Liste, Detail und „Ihre Auswahl“
     lesen und schreiben denselben Korb-Speicher. */
  var LEER = "Noch nichts ausgewählt.";

  function wunsch() {
    return window.AMK_WUNSCH || null;
  }

  function load() {
    return wunsch() && wunsch().load ? wunsch().load() : [];
  }

  function save(items) {
    if (wunsch() && wunsch().save) wunsch().save(items, true);
  }

  function byId() {
    var map = {};
    load().forEach(function (item) {
      if (item && item.id) map[item.id] = item;
    });
    return map;
  }

  function menge(field) {
    var qty = parseInt(field && field.value, 10);
    if (!qty || qty < 0) qty = 0;
    if (qty > 9999) qty = 9999;
    return qty;
  }

  function winkel(card, quelle) {
    if (!card) return 0;
    var box = card.querySelector('input[type="checkbox"]');
    var field = card.querySelector(".kauf-schnell--menge input, [data-menge]");
    if (!box || !field) return 0;
    var qty = menge(field);
    var vomKreis = quelle === box;
    if (vomKreis) qty = box.checked ? Math.max(qty, 1) : 0;
    else box.checked = qty > 0;
    if (String(qty) !== field.value) field.value = String(qty);
    return qty;
  }

  function frisch() {
    document.dispatchEvent(new CustomEvent("amk-wunsch-frisch"));
  }

  window.addEventListener("pageshow", frisch);
  window.addEventListener("storage", function (event) {
    if (!event.key || event.key === "amk-wunsch") frisch();
  });

  document.addEventListener("click", function (event) {
    var button = event.target.closest(".kauf-schnell--menge [data-step]");
    if (!button) return;
    var field = button.parentNode.querySelector("input");
    if (!field) return;
    var step = parseInt(button.getAttribute("data-step"), 10) || 0;
    field.value = String(Math.min(9999, Math.max(0, menge(field) + step)));
    field.dispatchEvent(new Event("input", { bubbles: true }));
  });

  window.AMK_KAUF_STORE = {
    leer: LEER,
    load: load,
    save: save,
    byId: byId,
    menge: menge,
    winkel: winkel
  };
})();
