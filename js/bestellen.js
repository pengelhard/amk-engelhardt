(function () {
  if (!window.AMK_WUNSCH || typeof window.AMK_WUNSCH.add !== "function") return;

  function mode(form) {
    var checked = form.querySelector('input[type="radio"]:checked');
    return checked && checked.value === "kauf" ? "kauf" : "miete";
  }

  document.querySelectorAll("form[data-order]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var sammel = form.hasAttribute("data-sammel");
      var buy = mode(form) === "kauf";
      var qty = 1;
      var note = "";
      if (sammel) {
        var bedarf = form.elements.bedarf;
        note = bedarf ? String(bedarf.value || "").trim() : "";
        if (!note) {
          if (bedarf) bedarf.focus();
          return;
        }
      } else {
        var qtyField = form.elements.menge;
        qty = parseInt(qtyField.value, 10);
        if (!qty || qty < 1 || qty > 99) {
          qtyField.focus();
          return;
        }
      }
      var item = {
        id: (buy ? "kauf:" : "miete:") + form.getAttribute("data-slug"),
        name: form.getAttribute("data-name") || "",
        qty: qty,
        bild: form.getAttribute("data-bild") || "",
        kat: form.getAttribute("data-kat") || ""
      };
      if (sammel) {
        item.sammel = true;
        item.note = note;
      }
      window.AMK_WUNSCH.add(item);
    });
  });
})();
