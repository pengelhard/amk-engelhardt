(function () {
  var list = document.getElementById("anfrage-liste");
  var form = document.getElementById("anfrage-form");
  var empty = document.getElementById("anfrage-leer");
  if (!list || !form || !window.AMK_WUNSCH) return;

  var CATALOG = {
    "miete:bauzaun-standard": { name: "Bauzaun Standard", bild: "images/bauzaun-standard.webp" },
    "miete:bauzaun-f1": { name: "Bauzaun F1", bild: "images/bauzaun-f1.webp" },
    "miete:bauzaun-secure": { name: "Bauzaun Secure", bild: "images/bauzaun-secure.webp" },
    "miete:bauzaun-xxl": { name: "Bauzaun XXL", bild: "images/bauzaun-xxl.webp" },
    "miete:bauzaun-tuer": { name: "Bauzauntür Standard", bild: "images/bauzaun-tuer.webp" },
    "miete:exklusivtuer": { name: "Exklusivtür", bild: "images/exklusivtuer.webp" },
    "miete:bauzaun-tor": { name: "Tor mit Drehgelenken", bild: "images/tor-drehgelenk.webp" },
    "miete:sichtschutz-trapez": { name: "Sichtschutz Trapezblech", bild: "images/sichtschutz-trapez.webp" },
    "miete:sichtschutz-holz": { name: "Sichtschutz Holz", bild: "images/sichtschutz-holz.webp" },
    "miete:bauzaun-plane": { name: "Bauzaunplane", bild: "images/bauzaun-plane.webp" },
    "miete:betonfuss": { name: "Betonfuß", bild: "images/betonfuss.webp" },
    "miete:schelle": { name: "Verbindungsschelle", bild: "images/schelle.webp" },
    "miete:hsschelle": { name: "Hochsicherheitsschelle", bild: "images/hsschelle.webp" },
    "miete:strebe": { name: "Bauzaunstrebe", bild: "images/strebe.webp" },
    "miete:gitterzaun": { name: "Drahtgitterzaun", bild: "images/gitterzaun.webp" },
    "miete:polizeigitter": { name: "Polizeigitter", bild: "images/polizeigitter.webp" },
    "miete:polizeigitter-solid": { name: "Polizeigitter Solid", bild: "images/polizeigitter-solid.webp" },
    "miete:barriere": { name: "Barriere", bild: "images/barriere.webp" },
    "miete:absperrschranke": { name: "Absperrschranke Kunststoff", bild: "images/absperrschranke.webp" },
    "miete:verkehrsschilder": { name: "Verkehrsschilder", bild: "images/verkehrsschilder.webp" },
    "miete:hochlader": { name: "Hochlader", bild: "images/anhaenger-offen.webp" },
    "miete:planenanhaenger": { name: "Planenanhänger", bild: "images/anhaenger-plane.webp" },
    "miete:kofferanhaenger": { name: "Kofferanhänger", bild: "images/kofferanhaenger.webp" },
    "miete:kuehlanhaenger-13": { name: "Kühlanhänger", bild: "images/kuehlanhaenger-13.webp" },
    "miete:kuehlanhaenger-20": { name: "Kühlanhänger für Events", bild: "images/kuehlanhaenger-13.webp" },
    "kauf:hochlader": { name: "Hochlader", bild: "images/anhaenger-offen.webp" },
    "kauf:kofferanhaenger": { name: "Kofferanhänger", bild: "images/kofferanhaenger.webp" },
    "kauf:fahrzeugtransporter": { name: "Fahrzeugtransporter", bild: "images/fahrzeugtransporter.webp" }
  };

  var META = "amk-anfrage-meta";
  var fencePattern = /bauzaun|sichtschutz|betonfuss|schelle|strebe|gitterzaun|polizeigitter|barriere|absperrschranke|verkehrsschilder|exklusivtuer/;

  function loadMeta() {
    try {
      var data = JSON.parse(localStorage.getItem(META) || "{}");
      return data && typeof data === "object" ? data : {};
    } catch (error) {
      return {};
    }
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function kind(id) {
    id = String(id);
    if (id.indexOf("kauf:") === 0) return "Kauf";
    if (id.indexOf("aktuell:") === 0) return "Aktuelles";
    return "Miete";
  }

  function renting(items) {
    return items.some(function (item) { return String(item.id).indexOf("miete:") === 0; });
  }

  function sammel(item) {
    if (item.sammel) return true;
    return String(item.id).indexOf("verkehrsschilder") !== -1;
  }

  function isVerkehr(item) {
    if (item.kat === "verkehrssicherung") return true;
    var slug = String(item.id);
    var cut = slug.indexOf(":");
    slug = (cut === -1 ? slug : slug.slice(cut + 1)).split(":")[0];
    return slug === "verkehrsschilder" ||
      slug.indexOf("absperrung-") === 0 ||
      slug.indexOf("schranke-") === 0 ||
      slug.indexOf("schwelle-") === 0 ||
      slug === "polizeigitter" ||
      slug === "polizeigitter-solid" ||
      slug === "barriere" ||
      slug === "absperrschranke";
  }

  function needsPeriod(items) {
    return renting(items);
  }

  function editHref(item) {
    var id = String(item.id);
    if (item.konfig || id.indexOf("bauzaun-konfig") !== -1) return "../bauzaun/konfigurator/";
    if (id.indexOf("kauf:") === 0 || id.indexOf("miete:") === 0) return "../produkt/" + id.slice(id.indexOf(":") + 1).split(":")[0] + "/";
    if (id.indexOf("aktuell:") === 0) return "../aktuelles/";
    return "../anfrage/";
  }

  function fencing() {
    return false;
  }

  var BILD = {
    standard: "images/kk/bauzaun-10075.webp",
    f1: "images/kk/bauzaun-10042-0.webp",
    secure: "images/kk/bauzaun-10075-1.webp",
    xxl: "images/kk/bauzaun-10044-2.webp"
  };

  function deDate(value) {
    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
    return match ? match[3] + "." + match[2] + "." + match[1] : "";
  }

  function extraLabel(entry) {
    if (!entry) return "";
    if (typeof entry === "string") return entry;
    if (entry.menge) return entry.menge + " × " + entry.name;
    return entry.name || "";
  }

  function extraList(extras) {
    return (extras || []).map(extraLabel).filter(Boolean).join(", ");
  }

  function konfigText(item) {
    var k = item.konfig;
    var einheit = k.einheit === "felder" ? (k.menge === "1" ? " Feld" : " Felder") : " m";
    var listed = extraList(k.extras);
    var extras = listed ? esc(listed) + " — Aufpreis auf Anfrage" : "keine";
    return "<p>" + esc(k.menge) + einheit + "</p>" +
      "<p>Inklusive: Betonfüße, Verbindungsschellen, Streben nach Bedarf</p>" +
      "<p>Extras: " + extras + "</p>";
  }

  function render(items) {
    var data = items || window.AMK_WUNSCH.load();
    empty.hidden = data.length > 0;
    form.hidden = data.length === 0;
    var rent = document.getElementById("anfrage-miete");
    var fence = document.getElementById("anfrage-zaun");
    var period = document.getElementById("anfrage-zeit");
    var periodTitle = document.getElementById("anfrage-miete-titel");
    var askPeriod = needsPeriod(data);
    var verkehrOn = data.some(isVerkehr);
    var verkehr = document.getElementById("anfrage-verkehr");
    var einsatz = document.getElementById("anfrage-einsatz");
    if (rent) rent.hidden = !renting(data);
    if (period) period.hidden = !askPeriod;
    if (periodTitle) periodTitle.textContent = askPeriod ? "Zeitraum und Anfahrt" : "Anfahrt";
    if (verkehr) verkehr.hidden = !verkehrOn;
    if (einsatz) einsatz.hidden = !verkehrOn || renting(data);
    if (fence) fence.hidden = !fencing(data);
    var rentOn = rent && !rent.hidden;
    ["von", "bis"].forEach(function (id) {
      var field = document.getElementById(id);
      if (field) field.required = !!(rentOn && askPeriod);
    });
    ["ort", "plz"].forEach(function (id) {
      var field = document.getElementById(id);
      if (field) field.required = !!rentOn;
    });
    form.querySelectorAll('input[name="leistung"]').forEach(function (field) {
      field.required = !!rentOn;
    });
    list.innerHTML = data.map(function (item, index) {
      var info = CATALOG[item.id] || {};
      var bild = item.konfig && BILD[item.konfig.key] ? BILD[item.konfig.key] : (info.bild || item.bild);
      var modus = kind(item.id);
      var image = bild ? '<img src="../' + esc(bild) + '" alt="" width="320" height="220">' : "";
      var body = item.konfig
        ? konfigText(item)
        : (item.note ? "<p>" + esc(item.note) + "</p>" : "");
      var qty = item.konfig || sammel(item)
        ? ""
        : '<label class="qty">Menge <input type="number" min="1" max="99" inputmode="numeric" value="' + item.qty + '" data-index="' + index + '" aria-label="Menge ' + esc(item.name) + '"></label>';
      return '<li class="cart-row">' + image +
        '<div class="cart-main"><p class="cart-kind">' + modus + "</p><strong>" + esc(item.name) + "</strong>" + body + "</div>" +
        qty +
        '<div class="cart-actions"><a class="text-btn" href="' + esc(editHref(item)) + '">Ändern<span class="visually-hidden">: ' + esc(item.name) + '</span></a>' +
        '<button type="button" class="text-btn" data-index="' + index + '">Entfernen<span class="visually-hidden">: ' + esc(item.name) + "</span></button></div>" +
        "</li>";
    }).join("");
  }

  function fill(meta) {
    Object.keys(meta).forEach(function (key) {
      form.querySelectorAll('[name="' + key + '"]').forEach(function (field) {
        if (field.type === "radio") field.checked = field.value === meta[key];
        else if (field.type === "checkbox") field.checked = meta[key] === "ja";
        else if (meta[key] != null) field.value = meta[key];
      });
    });
  }

  function readMeta() {
    var data = {};
    form.querySelectorAll("[name]").forEach(function (field) {
      if (field.type === "radio") {
        if (field.checked) data[field.name] = field.value;
        return;
      }
      if (field.type === "checkbox") {
        data[field.name] = field.checked ? "ja" : "";
        return;
      }
      data[field.name] = field.value;
    });
    return data;
  }

  function applyQuery() {
    var params = new URLSearchParams(location.search);
    var produkt = params.get("produkt");
    var items = window.AMK_WUNSCH.load();
    if (produkt && CATALOG[produkt] && !items.some(function (item) { return item.id === produkt; })) {
      items.push({ id: produkt, name: CATALOG[produkt].name, qty: 1 });
      window.AMK_WUNSCH.save(items);
    }
    var meta = loadMeta();
    if (params.get("laenge")) meta.laenge = params.get("laenge");
    if (params.get("hoehe")) meta.hoehe = params.get("hoehe");
    if (params.get("bereich") === "miete" || (produkt && produkt.indexOf("miete:") === 0)) {
      if (!meta.leistung) meta.leistung = "lieferung";
    }
    fill(meta);
    localStorage.setItem(META, JSON.stringify(readMeta()));
  }

  list.addEventListener("change", function (event) {
    var input = event.target.closest("[data-index]");
    if (!input || input.type !== "number") return;
    var qty = parseInt(input.value, 10);
    if (!qty || qty < 1) qty = 1;
    if (qty > 99) qty = 99;
    input.value = String(qty);
    var items = window.AMK_WUNSCH.load();
    var index = Number(input.getAttribute("data-index"));
    if (items[index]) items[index].qty = qty;
    window.AMK_WUNSCH.save(items, true);
  });

  list.addEventListener("click", function (event) {
    var button = event.target.closest("button[data-index]");
    if (!button) return;
    var index = Number(button.getAttribute("data-index"));
    window.AMK_WUNSCH.save(window.AMK_WUNSCH.load().filter(function (item, itemIndex) { return itemIndex !== index; }));
  });

  function remember() {
    localStorage.setItem(META, JSON.stringify(readMeta()));
  }
  form.addEventListener("input", remember);
  form.addEventListener("change", remember);

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var status = document.getElementById("anfrage-status");
    var items = window.AMK_WUNSCH.load();
    var fields = readMeta();
    function val(name) { return String(fields[name] || "").trim(); }
    status.classList.remove("is-error");
    if (!items.length) return;
    var askPeriod = needsPeriod(items);
    if (askPeriod && renting(items)) {
      var vonField = document.getElementById("von");
      var bisField = document.getElementById("bis");
      if (window.AMK_ZEIT && !window.AMK_ZEIT.checkPair(vonField, bisField)) return;
      if (!vonField.value || !bisField.value) {
        (vonField.value ? bisField : vonField).focus();
        return;
      }
    }
    var trap = form.querySelector('[name="botcheck"]');
    if (trap && String(trap.value || "").trim()) {
      if (window.AMK_FORMULAR) window.AMK_FORMULAR.send({ honeypot: true, thanks: "danke/", status: status, mailto: "mailto:info@bauzaun-mieten.net" });
      else window.location.href = "danke/";
      return;
    }
    var lines = ["Anfrage an AMK Engelhardt", ""];
    items.forEach(function (item) {
      if (item.konfig) {
        var k = item.konfig;
        var einheit = k.einheit === "felder" ? (k.menge === "1" ? " Feld" : " Felder") : " m";
        var listed = extraList(k.extras);
        var extra = listed ? listed + " — Aufpreis auf Anfrage" : "keine";
        lines.push(k.art + " — " + kind(item.id) + " — " + k.menge + einheit + " — Inklusive: Betonfüße, Verbindungsschellen, Streben nach Bedarf — Extras: " + extra);
        return;
      }
      if (sammel(item)) {
        lines.push(item.name + " — " + kind(item.id) + (item.note ? " — " + item.note : ""));
        return;
      }
      lines.push(item.name + " — " + kind(item.id) + " — Menge " + item.qty + (item.note ? " — " + item.note : ""));
    });
    lines.push("");
    if (fencing(items) && val("laenge")) lines.push("Zaunlänge: " + val("laenge") + " m");
    if (fencing(items) && val("hoehe")) lines.push("Höhe: " + val("hoehe") + " m");
    if (items.some(isVerkehr) && val("genehmigung") === "ja") {
      lines.push("Genehmigung/Verkehrsrechtliche Anordnung durch AMK");
    }
    if (renting(items)) {
      if (askPeriod) lines.push("Zeitraum: " + (deDate(val("von")) || val("von")) + " bis " + (deDate(val("bis")) || val("bis")));
      lines.push("Leistung: " + (val("leistung") === "abholung" ? "Selbstabholung" : "Lieferung, Aufbau und Abbau"));
      lines.push("Einsatzort: " + val("ort"));
      lines.push("PLZ: " + val("plz"));
    } else if (items.some(isVerkehr) && val("einsatzort")) {
      lines.push("Einsatzort: " + val("einsatzort"));
    }
    lines.push("");
    lines.push("Name: " + val("name"));
    if (val("firma")) lines.push("Firma: " + val("firma"));
    lines.push("Telefon: " + val("telefon"));
    lines.push("E-Mail: " + val("email"));
    if (val("nachricht")) lines.push("", "Nachricht:", val("nachricht"));
    lines.push("", "Preis auf Anfrage");
    var href = "mailto:info@bauzaun-mieten.net?subject=" +
      encodeURIComponent("Anfrage – AMK Engelhardt") +
      "&body=" + encodeURIComponent(lines.join("\n"));
    var message = lines.join("\n");
    if (!window.AMK_FORMULAR) {
      status.textContent = "Ihr E-Mail-Programm öffnet sich.";
      window.location.href = href;
      return;
    }
    window.AMK_FORMULAR.send({
      status: status,
      thanks: "danke/",
      mailto: href,
      subject: "Anfrage – AMK Engelhardt",
      name: val("name"),
      email: val("email"),
      message: message,
      onSuccess: function () {
        window.AMK_WUNSCH.save([], true);
        try { localStorage.removeItem(META); } catch (error) {}
      }
    });
  });

  var previous = window.AMK_WUNSCH.onChange;
  window.AMK_WUNSCH.onChange = function (items) {
    if (typeof previous === "function") previous(items);
    render(items);
  };
  applyQuery();
  render(window.AMK_WUNSCH.load());
})();
