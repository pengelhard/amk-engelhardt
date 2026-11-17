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

  var GITTER = { "absperrung-10026": 1, "absperrung-10025-0": 1, "absperrung-10041": 1 };

  function slugOf(id) {
    var rest = String(id);
    var cut = rest.indexOf(":");
    rest = cut === -1 ? rest : rest.slice(cut + 1);
    return rest.split(":")[0];
  }

  function editHref(item) {
    var id = String(item.id);
    if (item.konfig || id.indexOf("bauzaun-konfig") !== -1 || id.indexOf("bauzaun-paket") !== -1) return "../mieten/?gruppe=zaun";
    if (id.indexOf("kauf:schild:") === 0) return "../kaufen/?gruppe=schilder";
    if (id.indexOf("miete:schild:") === 0) return "../mieten/?gruppe=schilder";
    if (id.indexOf("verkehr:") !== -1) return "../mieten/?gruppe=absperrung";
    var slug = slugOf(id);
    if (GITTER[slug]) {
      return id.indexOf("kauf:") === 0 ? "../kaufen/?gruppe=zaun&kat=gitter" : "../mieten/?gruppe=zaun&teil=gitter";
    }
    if (id.indexOf("miete:") === 0 && !CATALOG[id]) {
      if (item.kat === "anhaenger") return "../mieten/?gruppe=anhaenger";
      if (item.kat === "verkehrssicherung") return "../mieten/?gruppe=absperrung";
      return "../mieten/?gruppe=zaun";
    }
    if (id.indexOf("kauf:") === 0 && item.kat === "anhaenger") return "../kaufen/?gruppe=anhaenger";
    if (id.indexOf("kauf:") === 0 && item.kat === "verkehrssicherung") return "../kaufen/?gruppe=absperrung";
    if (id.indexOf("kauf:") === 0 || id.indexOf("miete:") === 0) return "../produkt/" + slug + "/";
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
    var extras = listed ? "<p>" + esc(listed) + "</p>" : "";
    var note = k.bemerkung ? "<p>" + esc(k.bemerkung) + "</p>" : "";
    return "<p>" + esc(k.menge) + einheit + "</p>" +
      "<p>Standardzubehör inklusive.</p>" +
      extras + note;
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
    if (verkehr) verkehr.hidden = true;
    if (einsatz) einsatz.hidden = true;
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
    function row(item, index) {
      var info = CATALOG[item.id] || {};
      var bild = item.konfig && BILD[item.konfig.key] ? BILD[item.konfig.key] : (info.bild || item.bild);
      var image = bild ? '<img src="../' + esc(bild) + '" alt="" width="320" height="220">' : "";
      var bits = [];
      if (item.konfig) bits.push(konfigText(item));
      else if (item.note) bits.push("<p>" + esc(item.note) + "</p>");
      if (item.von && item.bis) bits.push("<p>Zeitraum: " + esc(deDate(item.von)) + " bis " + esc(deDate(item.bis)) + "</p>");
      if (item.ort) bits.push("<p>" + esc(item.ort) + "</p>");
      if (item.genehmigung) bits.push("<p>Genehmigung durch AMK</p>");
      var qty = item.konfig || sammel(item)
        ? ""
        : '<label class="qty">Menge <input type="number" min="1" max="99" inputmode="numeric" value="' + item.qty + '" data-index="' + index + '" aria-label="Menge ' + esc(item.name) + '"></label>';
      return '<li class="cart-row">' + image +
        '<div class="cart-main"><strong>' + esc(item.name) + "</strong>" + bits.join("") + "</div>" +
        qty +
        '<div class="cart-actions"><a class="text-btn" href="' + esc(editHref(item)) + '">Ändern<span class="visually-hidden">: ' + esc(item.name) + '</span></a>' +
        '<button type="button" class="text-btn" data-index="' + index + '">Entfernen<span class="visually-hidden">: ' + esc(item.name) + "</span></button></div>" +
        "</li>";
    }
    var groups = [
      ["Miete", data.map(function (item, index) { return { item: item, index: index }; }).filter(function (entry) { return String(entry.item.id).indexOf("miete:") === 0; })],
      ["Kauf", data.map(function (item, index) { return { item: item, index: index }; }).filter(function (entry) { return String(entry.item.id).indexOf("kauf:") === 0; })],
      ["Weiteres", data.map(function (item, index) { return { item: item, index: index }; }).filter(function (entry) {
        var id = String(entry.item.id);
        return id.indexOf("miete:") !== 0 && id.indexOf("kauf:") !== 0;
      })]
    ];
    list.innerHTML = groups.filter(function (group) { return group[1].length; }).map(function (group) {
      return '<li class="cart-group"><h3>' + group[0] + "</h3></li>" +
        group[1].map(function (entry) { return row(entry.item, entry.index); }).join("");
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
    function lineOf(item) {
      if (item.konfig) {
        var k = item.konfig;
        var einheit = k.einheit === "felder" ? (k.menge === "1" ? " Feld" : " Felder") : " m";
        var listed = extraList(k.extras);
        return "Miete — " + k.art + " — " + k.menge + einheit + " — Standardzubehör inklusive" +
          (listed ? " — " + listed : "") +
          (k.bemerkung ? " — Bemerkung: " + k.bemerkung : "");
      }
      if (String(item.id).indexOf("miete:verkehr") === 0) {
        return "Miete — Verkehrssicherung — " + (item.note || "") +
          (item.ort ? " — Ort: " + item.ort : "") +
          (item.genehmigung ? " — Genehmigung durch AMK" : "");
      }
      if (sammel(item)) return kind(item.id) + " — " + item.name + (item.note ? " — " + item.note : "");
      return kind(item.id) + " — " + item.name + " — Menge " + item.qty + (item.note ? " — " + item.note : "");
    }
    var lines = ["Anfrage an AMK Engelhardt", ""];
    ["miete:", "kauf:", ""].forEach(function (prefix) {
      items.forEach(function (item) {
        var id = String(item.id);
        var match = prefix ? id.indexOf(prefix) === 0 : id.indexOf("miete:") !== 0 && id.indexOf("kauf:") !== 0;
        if (match) lines.push(lineOf(item));
      });
    });
    lines.push("");
    if (fencing(items) && val("laenge")) lines.push("Zaunlänge: " + val("laenge") + " m");
    if (fencing(items) && val("hoehe")) lines.push("Höhe: " + val("hoehe") + " m");
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
