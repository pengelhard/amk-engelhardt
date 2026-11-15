(function () {
  var form = document.getElementById("bauzaun-konfig");
  if (!form || !window.AMK_WUNSCH || typeof window.AMK_WUNSCH.add !== "function") return;

  var ART = {
    standard: "Bauzaun Standard",
    f1: "Bauzaun F1",
    secure: "Bauzaun Secure",
    xxl: "Bauzaun XXL"
  };
  var EXTRAS = {
    hsschelle: "Hochsicherheitsschellen",
    plane: "Bauzaunplane",
    sichtschutz: "Sichtschutz",
    tuer: "Tür",
    tor: "Tor",
    strebe: "Zusatzstreben"
  };
  var COUNTED = { plane: 1, tuer: 1, tor: 1, strebe: 1 };
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

  function qtyField(box) {
    var row = box.closest(".extra-row");
    return row ? row.querySelector(".extra-qty") : null;
  }

  function syncQty(box) {
    var qty = qtyField(box);
    if (!qty) return;
    var on = box.checked && COUNTED[box.value];
    qty.hidden = !on;
    qty.disabled = !on;
    if (!on) qty.removeAttribute("aria-invalid");
    if (on && (!qty.value || parseInt(qty.value, 10) < 1)) qty.value = "1";
  }

  form.querySelectorAll('input[name="extra"]').forEach(function (box) {
    box.addEventListener("change", function () { syncQty(box); });
    syncQty(box);
  });

  function readExtras() {
    var extras = [];
    var invalid = null;
    form.querySelectorAll('input[name="extra"]:checked').forEach(function (box) {
      if (!EXTRAS[box.value]) return;
      if (!COUNTED[box.value]) {
        extras.push({ name: EXTRAS[box.value] });
        return;
      }
      var qty = qtyField(box);
      var amount = qty ? parseInt(qty.value, 10) : 0;
      if (!qty || !amount || amount < 1 || amount > 99) {
        if (qty) {
          qty.setAttribute("aria-invalid", "true");
          if (!invalid) invalid = qty;
        }
        return;
      }
      qty.removeAttribute("aria-invalid");
      extras.push({ name: EXTRAS[box.value], menge: amount });
    });
    return { extras: extras, invalid: invalid };
  }

  function rememberPeriod(von, bis) {
    try {
      var meta = JSON.parse(localStorage.getItem("amk-anfrage-meta") || "{}");
      if (!meta || typeof meta !== "object") meta = {};
      if (!meta.von) meta.von = von;
      if (!meta.bis) meta.bis = bis;
      if (!meta.leistung) meta.leistung = "lieferung";
      localStorage.setItem("amk-anfrage-meta", JSON.stringify(meta));
    } catch (error) {}
  }

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
    var von = form.von.value;
    var bis = form.bis.value;
    if (!von || !bis) {
      status.textContent = "Bitte den Mietzeitraum angeben.";
      status.classList.add("is-error");
      (von ? form.bis : form.von).focus();
      return;
    }
    if (window.AMK_ZEIT && !window.AMK_ZEIT.checkPair(form.von, form.bis)) return;
    var picked = readExtras();
    if (picked.invalid) {
      status.textContent = "Mindestens 1.";
      status.classList.add("is-error");
      picked.invalid.focus();
      return;
    }
    var extras = picked.extras;
    var shown = felder ? String(amount) : raw.replace(".", ",");
    window.AMK_WUNSCH.add({
      id: "miete:bauzaun-konfig:" + Date.now(),
      name: ART[artKey],
      qty: 1,
      konfig: {
        art: ART[artKey],
        key: artKey,
        menge: shown,
        einheit: felder ? "felder" : "m",
        von: von,
        bis: bis,
        extras: extras
      }
    });
    rememberPeriod(von, bis);
    form.reset();
    syncUnit();
    form.querySelectorAll('input[name="extra"]').forEach(syncQty);
    if (window.AMK_ZEIT) window.AMK_ZEIT.clearPair(form.von, form.bis);
    status.textContent = "In die Anfrage gelegt.";
  });
})();
