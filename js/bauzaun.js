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
    function boxOf(key) {
      return form.querySelector('input[name="art"][value="' + key + '"]');
    }

    function unit(key) {
      var checked = form.querySelector('input[name="einheit-' + key + '"]:checked');
      return checked ? checked.value : "m";
    }

    function syncUnit(key) {
      var felder = unit(key) === "felder";
      var input = document.getElementById("menge-" + key);
      var label = document.getElementById("label-" + key);
      if (input) input.setAttribute("inputmode", felder ? "numeric" : "decimal");
      if (label) label.textContent = felder ? "Anzahl Felder" : "Länge in Metern";
    }

    function renderPicks() {
      var host = form.querySelector("[data-zaun-picks]");
      if (!host || !window.AMK_TYPWAHL) return;
      host.innerHTML = Object.keys(ART).map(function (key) {
        return window.AMK_TYPWAHL.card({
          name: "art",
          value: key,
          title: ART[key],
          media: '<img src="../' + BILD[key] + '" width="1200" height="675" alt="">',
          mode: "laenge",
          panelId: "menge-panel-" + key,
          inputId: "menge-" + key,
          labelId: "label-" + key,
          unitName: "einheit-" + key,
          unitLabel: "Einheit für " + ART[key]
        });
      }).join("");
    }

    function syncPanel(box) {
      if (window.AMK_TYPWAHL) window.AMK_TYPWAHL.reveal(box, false);
    }

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

    function selected() {
      var list = [];
      form.querySelectorAll('input[name="art"]:checked').forEach(function (box) {
        var key = box.value;
        if (!ART[key]) return;
        var input = document.getElementById("menge-" + key);
        var raw = String(input && input.value || "").trim();
        var felder = unit(key) === "felder";
        var amount = raw ? (felder ? raw + (raw === "1" ? " Feld" : " Felder") : raw + " m") : "";
        list.push({ key: key, name: ART[key], raw: raw, amount: amount, felder: felder, input: input });
      });
      return list;
    }

    function syncSummary() {
      var list = selected();
      var extras = readExtras().map(function (entry) { return entry.name; });
      var extraText = extras.length ? extras.join(", ") : "–";
      var liste = form.querySelector('[data-sum="liste"]');
      if (liste) {
        liste.innerHTML = list.length ? list.map(function (entry) {
          return "<div><dt>" + entry.name + "</dt><dd>" + (entry.amount || "–") + "</dd></div>";
        }).join("") : "<div><dt>Zauntyp</dt><dd>–</dd></div>";
      }
      put("extras", extraText);
      var bits = list.map(function (entry) {
        return entry.amount ? entry.name + " · " + entry.amount : entry.name;
      });
      if (extraText !== "–") bits.push(extraText);
      put("short", bits.join("; ") || "–");
    }

    form.addEventListener("input", syncSummary);
    form.addEventListener("change", syncSummary);

    form.addEventListener("change", function (event) {
      var box = event.target;
      if (!box || box.name !== "art") return;
      if (box.checked) syncUnit(box.value);
      else if (window.AMK_WUNSCH.remove) window.AMK_WUNSCH.remove("miete:bauzaun:" + box.value);
    });

    function restore() {
      if (!window.AMK_WUNSCH.load) return;
      var items = window.AMK_WUNSCH.load();
      var extraOn = {};
      items.forEach(function (item) {
        if (!item.konfig || String(item.id).indexOf("miete:bauzaun:") !== 0) return;
        var key = item.konfig.key;
        var box = boxOf(key);
        if (!box || !ART[key]) return;
        box.checked = true;
        syncPanel(box);
        var input = document.getElementById("menge-" + key);
        if (input) input.value = String(item.konfig.menge || "");
        var chosen = item.konfig.einheit === "felder" ? "felder" : "m";
        var radio = form.querySelector('input[name="einheit-' + key + '"][value="' + chosen + '"]');
        if (radio) radio.checked = true;
        syncUnit(key);
        (item.konfig.extras || []).forEach(function (extra) { if (extra && extra.name) extraOn[extra.name] = 1; });
        if (item.konfig.bemerkung && form.elements.bemerkung && !form.elements.bemerkung.value) {
          form.elements.bemerkung.value = item.konfig.bemerkung;
        }
      });
      form.querySelectorAll('input[name="extra"]').forEach(function (box) {
        if (EXTRAS[box.value] && extraOn[EXTRAS[box.value]]) box.checked = true;
      });
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var status = document.getElementById("konfig-status");
      status.textContent = "";
      status.classList.remove("is-error");
      form.querySelectorAll("[aria-invalid]").forEach(function (field) { field.removeAttribute("aria-invalid"); });
      var list = selected();
      if (!list.length) {
        var first = form.querySelector('input[name="art"]');
        if (first) first.focus();
        return;
      }
      var lines = [];
      for (var i = 0; i < list.length; i++) {
        var entry = list[i];
        var raw = entry.raw.replace(",", ".");
        var amount = Number(raw);
        if (!entry.raw || !isFinite(amount) || amount <= 0 || amount > 100000 || (entry.felder && amount % 1 !== 0)) {
          status.textContent = entry.felder ? "Bitte die Anzahl der Felder angeben." : "Bitte die Länge in Metern angeben.";
          status.classList.add("is-error");
          if (entry.input) {
            entry.input.setAttribute("aria-invalid", "true");
            entry.input.focus();
          }
          return;
        }
        var shown = entry.felder ? String(amount) : entry.raw.replace(".", ",");
        lines.push({
          id: "miete:bauzaun:" + entry.key,
          name: entry.name,
          qty: 1,
          kat: "bauzaun",
          bild: BILD[entry.key] || "",
          konfig: {
            art: entry.name,
            key: entry.key,
            menge: shown,
            einheit: entry.felder ? "felder" : "m",
            extras: readExtras(),
            bemerkung: form.elements.bemerkung ? String(form.elements.bemerkung.value || "").trim() : ""
          }
        });
      }
      window.AMK_WUNSCH.replace(lines);
      status.textContent = "";
    });

    renderPicks();
    restore();
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
