(function () {
  var root = document.querySelector(".beispiel");
  if (!root) return;

  var main = document.getElementById("beispiel-bild");
  var thumbs = root.querySelectorAll(".beispiel-thumbs button");
  thumbs.forEach(function (button) {
    button.addEventListener("click", function () {
      var img = button.querySelector("img");
      if (main && img) {
        main.src = img.getAttribute("src");
        main.alt = img.getAttribute("alt") || button.getAttribute("aria-label") || "";
      }
      thumbs.forEach(function (other) { other.removeAttribute("aria-current"); });
      button.setAttribute("aria-current", "true");
    });
  });

  var form = root.querySelector("form[data-order]");
  var field = form ? form.elements.menge : null;
  if (field) {
    function clamp() {
      var value = parseInt(field.value, 10);
      if (!value || value < 1) value = 1;
      if (value > 99) value = 99;
      field.value = String(value);
    }
    root.querySelectorAll("[data-step]").forEach(function (button) {
      button.addEventListener("click", function () {
        var step = parseInt(button.getAttribute("data-step"), 10) || 0;
        var value = parseInt(field.value, 10);
        if (!value || value < 1) value = 1;
        field.value = String(Math.min(99, Math.max(1, value + step)));
      });
    });
    field.addEventListener("change", clamp);
  }

  var tabs = root.querySelectorAll("[role='tab']");
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (other) {
        var on = other === tab;
        other.setAttribute("aria-selected", on ? "true" : "false");
        var panel = document.getElementById(other.getAttribute("aria-controls"));
        if (panel) panel.hidden = !on;
      });
    });
  });
})();
