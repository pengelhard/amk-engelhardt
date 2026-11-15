(function () {
  var form = document.getElementById("rechner-form");
  var meters = document.getElementById("meter");
  var height = document.getElementById("hoehe");
  var out = document.getElementById("rechner-ergebnis");
  if (!form || !meters || !out) return;

  function text() {
    var value = Number(String(meters.value).replace(",", "."));
    var gate = (form.querySelector('input[name="tor"]:checked') || {}).value === "ja";
    var heightLabel = height && height.selectedOptions.length ? height.selectedOptions[0].textContent : "";
    if (!value || value <= 0) {
      out.innerHTML = "<strong>Bitte eine Länge über 0 m eintragen.</strong><small>Feldlänge 3,50 m ist eine Annahme. Die alte Website nennt kein Maß.</small>";
      return;
    }
    var panels = Math.ceil(value / 3.5 - 1e-9);
    var feet = panels + 1;
    var clamps = Math.max(panels - 1, 0);
    if (gate) clamps += 1;
    var meterText = String(value).replace(".", ",");
    var gateText = gate ? " Zusätzlich 1 Tor als Annahme, die Stückzahl der Felder bleibt die Länge." : " Ohne Tor.";
    out.innerHTML =
      "<strong>" + panels + " Felder · " + feet + " Füße · " + clamps + " Schellen</strong>" +
      "<small>Annahme, nicht von AMK: Feld 3,50 m, gerade Strecke, Füße = Felder + 1, Schellen = Stöße" +
      (gate ? " plus eine Schelle fürs Tor" : "") + ". " + meterText + " m. Höhe: " + heightLabel +
      ". Die Höhe ändert die Stückzahl hier nicht." + gateText + "</small>";
  }

  form.addEventListener("input", text);
  form.addEventListener("change", text);
  text();
})();
