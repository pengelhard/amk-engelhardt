(function () {
  var form = document.getElementById("rechner-form");
  var meters = document.getElementById("meter");
  var out = document.getElementById("rechner-ergebnis");
  if (!form || !meters || !out) return;

  function text() {
    var value = Number(String(meters.value).replace(",", "."));
    var gate = (form.querySelector('input[name="tor"]:checked') || {}).value === "ja";
    if (!value || value <= 0) {
      out.innerHTML = "<strong>Bitte eine Länge über 0 m eintragen.</strong>";
      return;
    }
    var panels = Math.ceil(value / 3.45 - 1e-9);
    var feet = panels + 1;
    var clamps = Math.max(panels - 1, 0);
    if (gate) clamps += 1;
    var meterText = String(value).replace(".", ",");
    out.innerHTML =
      "<strong>" + panels + " Felder · " + feet + " Füße · " + clamps + " Schellen</strong>" +
      "<small>Für " + meterText + " m, gerade Strecke, " + (gate ? "mit Tor." : "ohne Tor.") + "</small>";
  }

  form.addEventListener("input", text);
  form.addEventListener("change", text);
  text();
})();
