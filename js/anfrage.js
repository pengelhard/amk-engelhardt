(function () {
  var form = document.getElementById("anfrage-form");
  if (!form) return;

  var dates = document.getElementById("zeitraum");
  var from = document.getElementById("von");
  var to = document.getElementById("bis");
  var lengthInput = document.getElementById("laenge");
  var heightInput = document.getElementById("hoehe-feld");
  var address = document.getElementById("lieferadresse");
  var delivery = document.getElementById("lieferung");
  var status = document.getElementById("form-status");
  var list = document.getElementById("merkzettel-liste");
  var mail = "info@bauzaun-mieten.net";

  function art() {
    return (form.querySelector('input[name="bereich"]:checked') || {}).value || "";
  }

  function say(message, isError) {
    status.textContent = message;
    status.classList.toggle("is-error", !!isError);
  }

  function labels(name) {
    return Array.prototype.slice.call(form.querySelectorAll('input[name="' + name + '"]:checked')).map(function (input) {
      var text = input.parentNode.querySelector("span");
      return text ? text.textContent : input.value;
    });
  }

  function toggleArt() {
    var buy = art() === "kauf";
    if (dates) dates.hidden = buy;
    if (from) from.required = !buy && art() === "miete";
    if (to) to.required = !buy && art() === "miete";
    if (buy && from && to) {
      from.value = "";
      to.value = "";
    }
  }

  function toggleAddress() {
    if (address && delivery) address.required = delivery.checked;
  }

  function check(id) {
    var boxes = form.querySelectorAll('input[type="checkbox"]');
    Array.prototype.forEach.call(boxes, function (box) {
      if (box.value === id) box.checked = true;
    });
  }

  function applyQuery() {
    var params = new URLSearchParams(window.location.search);
    if (params.get("bereich") === "miete" || params.get("bereich") === "kauf") {
      var radio = form.querySelector('input[name="bereich"][value="' + params.get("bereich") + '"]');
      if (radio) radio.checked = true;
    }
    if (params.get("laenge") && lengthInput) lengthInput.value = params.get("laenge");
    if (params.get("hoehe") && heightInput) heightInput.value = params.get("hoehe");
    var products = [];
    params.getAll("produkt").forEach(function (value) {
      value.split(",").forEach(function (part) {
        if (part.trim()) products.push(part.trim());
      });
    });
    products.forEach(check);
    var stored = window.AMK_WUNSCH ? window.AMK_WUNSCH.load() : [];
    if (list) {
      list.innerHTML = "";
      stored.forEach(function (item) {
        check(item.id);
        var li = document.createElement("li");
        li.textContent = item.name;
        list.appendChild(li);
      });
      if (!stored.length) {
        var empty = document.createElement("li");
        empty.textContent = "Noch nichts auf dem Merkzettel. Unten auswählen.";
        list.appendChild(empty);
      }
    } else {
      stored.forEach(function (item) { check(item.id); });
    }
    toggleArt();
    toggleAddress();
  }

  applyQuery();
  form.addEventListener("change", function (event) {
    if (event.target.name === "bereich") toggleArt();
    if (event.target === delivery) toggleAddress();
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var data = new FormData(form);
    var name = String(data.get("name") || "").trim();
    var phone = String(data.get("telefon") || "").trim();
    var email = String(data.get("email") || "").trim();
    var mode = art();
    var message = String(data.get("nachricht") || "").trim();
    var meters = String(data.get("laenge") || "").trim();
    var height = String(data.get("hoehe") || "").trim();
    var rent = labels("produkt-miete");
    var buy = labels("produkt-kauf");
    var privacy = form.querySelector('input[name="datenschutz"]').checked;

    if (!privacy) {
      say("Bitte den Datenschutz-Hinweis ankreuzen.", true);
      return;
    }
    if (!name || !phone || !email || !mode) {
      say("Bitte Name, Telefon, E-Mail und Miete oder Kauf ausfüllen.", true);
      return;
    }
    if (mode === "miete" && !rent.length && !meters) {
      say("Bitte ein Mietprodukt oder eine Zaunlänge angeben.", true);
      return;
    }
    if (mode === "kauf" && !buy.length) {
      say("Zum Kauf stehen nur Anhänger bereit. Bitte einen Beispiel-Anhänger wählen.", true);
      return;
    }
    if (mode === "miete" && (!from.value || !to.value)) {
      say("Für die Miete bitte den Zeitraum von und bis angeben.", true);
      return;
    }
    if (mode === "miete" && from.value > to.value) {
      say("Das Enddatum liegt vor dem Startdatum.", true);
      return;
    }
    if (delivery.checked && !String(data.get("lieferadresse") || "").trim()) {
      say("Bitte die Lieferadresse angeben.", true);
      return;
    }

    var lines = [
      "Anfrage über den Prototyp der Website",
      "",
      "Name: " + name,
      "Telefon: " + phone,
      "E-Mail: " + email,
      "Bereich: " + (mode === "kauf" ? "Kauf (nur Anhänger)" : "Miete")
    ];
    if (mode === "miete") lines.push("Zeitraum: " + from.value + " bis " + to.value);
    if (meters) lines.push("Zaunlänge: " + meters + " m");
    if (height) lines.push("Höhe aus dem Rechner: " + height);
    lines.push("Lieferung: " + (delivery.checked ? "ja" : "nein"));
    if (delivery.checked) lines.push("Lieferadresse: " + String(data.get("lieferadresse")).trim());
    lines.push("Aufbau: " + (form.querySelector('input[name="aufbau"]').checked ? "ja" : "nein"));
    lines.push("Abbau: " + (form.querySelector('input[name="abbau"]').checked ? "ja" : "nein"));
    lines.push("Mietprodukte:");
    (rent.length ? rent : ["(keine)"]).forEach(function (item) { lines.push("- " + item); });
    lines.push("Kauf-Anhänger:");
    (buy.length ? buy : ["(keine)"]).forEach(function (item) { lines.push("- " + item); });
    lines.push("", "Nachricht:", message || "(keine)");
    lines.push("", "Hinweis: lokal im Browser erzeugt, nicht an einen Server gesendet.");

    say("Prototyp: Es wurde nichts an einen Server gesendet. Wenn sich kein E-Mail-Programm öffnet, schreiben Sie an " + mail + ".", false);
    window.location.href = "mailto:" + mail +
      "?subject=" + encodeURIComponent("Anfrage von der Testseite – AMK Engelhardt") +
      "&body=" + encodeURIComponent(lines.join("\n"));
  });
})();
