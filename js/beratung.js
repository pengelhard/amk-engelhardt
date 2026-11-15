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
    if (von && bis && bis < von) {
      status.textContent = "Das Ende liegt vor dem Anfang.";
      status.classList.add("is-error");
      form.bis.focus();
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
    status.textContent = "Ihr E-Mail-Programm öffnet sich.";
    window.location.href = href;
  });
})();
