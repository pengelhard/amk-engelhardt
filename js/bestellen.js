(function () {
  if (!window.AMK_WUNSCH || typeof window.AMK_WUNSCH.add !== "function") return;

  function mode(form) {
    var checked = form.querySelector('input[type="radio"]:checked');
    return checked && checked.value === "kauf" ? "kauf" : "miete";
  }

  function sync(form) {
    var buy = mode(form) === "kauf";
    var dates = form.querySelector(".order-dates");
    if (dates) dates.hidden = buy;
    ["von", "bis"].forEach(function (name) {
      var field = form.elements[name];
      if (field) field.required = !buy;
    });
    if (buy && window.AMK_ZEIT) window.AMK_ZEIT.clearPair(form.elements.von, form.elements.bis);
  }

  document.querySelectorAll("form[data-order]").forEach(function (form) {
    form.addEventListener("change", function () { sync(form); });
    sync(form);
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var qtyField = form.elements.menge;
      var qty = parseInt(qtyField.value, 10);
      if (!qty || qty < 1 || qty > 99) {
        qtyField.focus();
        return;
      }
      var buy = mode(form) === "kauf";
      var von = form.elements.von;
      var bis = form.elements.bis;
      if (!buy) {
        if (window.AMK_ZEIT && !window.AMK_ZEIT.checkPair(von, bis)) return;
        if (!von.value || !bis.value) {
          (von.value ? bis : von).focus();
          return;
        }
      }
      window.AMK_WUNSCH.add({
        id: (buy ? "kauf:" : "miete:") + form.getAttribute("data-slug"),
        name: form.getAttribute("data-name") || "",
        qty: qty,
        bild: form.getAttribute("data-bild") || "",
        von: buy ? "" : von.value,
        bis: buy ? "" : bis.value
      });
    });
  });
})();
