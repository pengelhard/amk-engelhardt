(function () {
  var form = document.getElementById("beratung-form");
  if (!form) return;

  function val(name) {
    var field = form.elements[name];
    return field ? String(field.value || "").trim() : "";
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var status = document.getElementById("beratung-status");
    status.classList.remove("is-error");
    var von = val("von");
    var bis = val("bis");
    if ((val("von") || val("bis")) && window.AMK_ZEIT && !window.AMK_ZEIT.checkPair(form.von, form.bis)) return;
    var trap = form.elements.botcheck;
    if (trap && String(trap.value || "").trim()) {
      window.location.href = "../danke/";
      return;
    }
    var lines = ["Individuelle Beratung an AMK Engelhardt", "", "Anliegen:", val("anliegen"), ""];
    lines.push("Ort: " + (val("ort") || "–"));
    function deDate(value) {
      var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
      return match ? match[3] + "." + match[2] + "." + match[1] : "";
    }
    if (von || bis) lines.push("Zeitraum: " + (deDate(von) || "–") + " bis " + (deDate(bis) || "–"));
    lines.push("");
    lines.push("Name: " + val("name"));
    if (val("firma")) lines.push("Firma: " + val("firma"));
    lines.push("Telefon: " + val("telefon"));
    lines.push("E-Mail: " + val("email"));
    var href = "mailto:info@bauzaun-mieten.net?subject=" +
      encodeURIComponent("Beratung – AMK Engelhardt") +
      "&body=" + encodeURIComponent(lines.join("\n"));
    if (!window.AMK_FORMULAR) {
      status.textContent = "Ihr E-Mail-Programm öffnet sich.";
      window.location.href = href;
      return;
    }
    window.AMK_FORMULAR.send({
      status: status,
      thanks: "../danke/",
      mailto: href,
      subject: "Beratung – AMK Engelhardt",
      name: val("name"),
      email: val("email"),
      message: lines.join("\n")
    });
  });
})();
