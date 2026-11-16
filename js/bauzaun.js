(function () {
  var form = document.getElementById("bauzaun-konfig");
  if (form && window.AMK_WUNSCH && typeof window.AMK_WUNSCH.add === "function") {
    var ART = {
      standard: "Bauzaun Profi 3,5 × 2,0 m",
      f1: "Bauzaun Profi 3,5 × 1,2 m",
      secure: "Bauzaun Profi engmaschig 3,5 × 2,0 m",
      xxl: "Bauzaun Profi Exklusiv 3,5 × 2,5 m"
    };
    var BILD = {
      standard: "images/kk/bauzaun-10075.webp",
      f1: "images/kk/bauzaun-10042-0.webp",
      secure: "images/kk/bauzaun-10075-1.webp",
      xxl: "images/kk/bauzaun-10044-2.webp"
    };
    var EXTRAS = {
      tuer: "Lauftor/Tür",
      tor: "Einfahrtstor",
      plane: "Sichtschutzplane",
      schelle: "Sicherheitsschellen",
      fuesse: "Schwere Füße",
      strasse: "Straßenverkehr/Absicherung"
    };
    var menge = document.getElementById("menge");
    var label = document.getElementById("mengen-label");

    function unit() {
      var checked = form.querySelector('input[name="einheit"]:checked');
      return checked ? checked.value : "m";
    }

    function syncUnit() {
      var felder = unit() === "felder";
      menge.setAttribute("inputmode", felder ? "numeric" : "decimal");
      if (label) label.textContent = felder ? "Anzahl Felder" : "Länge in Metern";
    }

    form.querySelectorAll('input[name="einheit"]').forEach(function (radio) {
      radio.addEventListener("change", syncUnit);
    });
    syncUnit();

    function readExtras() {
      var extras = [];
      form.querySelectorAll('input[name="extra"]:checked').forEach(function (box) {
        if (EXTRAS[box.value]) extras.push({ name: EXTRAS[box.value] });
      });
      return extras;
    }

    function put(name, text) {
      var node = form.querySelector('[data-sum="' + name + '"]');
      if (node) node.textContent = text;
    }

    function syncSummary() {
      var artKey = (form.querySelector('input[name="art"]:checked') || {}).value;
      var art = ART[artKey] || "–";
      var raw = String(menge.value || "").trim();
      var felder = unit() === "felder";
      var amount = raw ? (felder ? raw + (raw === "1" ? " Feld" : " Felder") : raw + " m") : "–";
      var extras = readExtras().map(function (entry) { return entry.name; });
      var extraText = extras.length ? extras.join(", ") : "–";
      put("art", art);
      put("menge", amount);
      put("extras", extraText);
      var bits = [];
      if (art !== "–") bits.push(art);
      if (amount !== "–") bits.push(amount);
      if (extraText !== "–") bits.push(extraText);
      put("short", bits.join(" · ") || "–");
    }

    form.addEventListener("input", syncSummary);
    form.addEventListener("change", syncSummary);

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var status = document.getElementById("konfig-status");
      status.textContent = "";
      status.classList.remove("is-error");
      var artKey = (form.querySelector('input[name="art"]:checked') || {}).value;
      var raw = String(menge.value || "").trim().replace(",", ".");
      var amount = Number(raw);
      var felder = unit() === "felder";
      if (!ART[artKey] || !raw || !isFinite(amount) || amount <= 0 || amount > 100000 || (felder && amount % 1 !== 0)) {
        status.textContent = felder ? "Bitte die Anzahl der Felder angeben." : "Bitte die Länge in Metern angeben.";
        status.classList.add("is-error");
        menge.focus();
        return;
      }
      var extras = readExtras();
      var shown = felder ? String(amount) : raw.replace(".", ",");
      var note = form.elements.bemerkung ? String(form.elements.bemerkung.value || "").trim() : "";
      window.AMK_WUNSCH.add({
        id: "miete:bauzaun-paket:" + Date.now(),
        name: ART[artKey],
        qty: 1,
        kat: "bauzaun",
        bild: BILD[artKey] || "",
        konfig: {
          art: ART[artKey],
          key: artKey,
          menge: shown,
          einheit: felder ? "felder" : "m",
          extras: extras,
          bemerkung: note
        }
      });
      form.reset();
      syncUnit();
      syncSummary();
      status.textContent = "";
    });

    syncSummary();
  }

  var traffic = document.getElementById("verkehr-miete");
  if (traffic && window.AMK_WUNSCH && typeof window.AMK_WUNSCH.add === "function") {
    traffic.addEventListener("submit", function (event) {
      event.preventDefault();
      var bedarf = traffic.elements.bedarf;
      var text = bedarf ? String(bedarf.value || "").trim() : "";
      if (!text) {
        if (bedarf) bedarf.focus();
        return;
      }
      var ort = traffic.elements.ort ? String(traffic.elements.ort.value || "").trim() : "";
      window.AMK_WUNSCH.add({
        id: "miete:verkehr:" + Date.now(),
        name: "Verkehrssicherung",
        qty: 1,
        sammel: true,
        kat: "verkehrssicherung",
        bild: "images/kk/absperrung-10026.webp",
        note: text,
        ort: ort,
        genehmigung: !!(traffic.elements.genehmigung && traffic.elements.genehmigung.checked)
      });
      traffic.reset();
    });
  }
})();
