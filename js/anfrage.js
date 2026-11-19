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
    if (id.indexOf("kauf:schild:") === 0) return "../kaufen/?gruppe=schilder&teil=gefahr";
    if (id.indexOf("miete:schild:") === 0) return "../mieten/?gruppe=schilder&teil=gefahr";
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
    if (slug === "transportstaender-10059") return "../produkt/beispiel/";
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

  function isIm(item) {
    var id = String(item && item.id || "");
    return id.indexOf(":im:") !== -1 && id.indexOf("kauf:") === 0 || !!(item && item.note === "im Komplett-Ständer");
  }

  function standKey(item) {
    var id = String(item && item.id || "");
    var at = id.indexOf(":im:");
    if (id.indexOf("kauf:") === 0 && at > 0) return id.slice(0, at);
    if (item && item.note === "im Komplett-Ständer") return "kauf:beispiel";
    return "";
  }

  function standFieldId(key) {
    var slug = String(key).replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
    return "menge-staender-" + (slug || "korb");
  }

  function standHref(key) {
    if (key === "kauf:beispiel") return "../produkt/beispiel/";
    var slug = String(key).indexOf("kauf:") === 0 ? String(key).slice(5) : "";
    if (!slug || slug.indexOf(":") !== -1) return "../kaufen/";
    return "../produkt/" + slug + "/";
  }

  function partOrder(id) {
    id = String(id);
    if (id.indexOf(":im:zaun") !== -1) return 0;
    if (id.indexOf(":im:staender") !== -1) return 1;
    if (id.indexOf(":im:fuss:") !== -1) return 2;
    if (id.indexOf(":im:schelle:") !== -1) return 3;
    return 9;
  }

  function standMembers(items) {
    return items.filter(isIm).sort(function (a, b) { return partOrder(a.id) - partOrder(b.id); });
  }

  function standGroups(items) {
    var map = {};
    var order = [];
    standMembers(items).forEach(function (item) {
      var key = standKey(item) || "kauf:beispiel";
      if (!map[key]) {
        map[key] = [];
        order.push(key);
      }
      map[key].push(item);
    });
    return order.map(function (key) { return { key: key, members: map[key] }; });
  }

  function standCount(members) {
    var n = 0;
    members.forEach(function (item) {
      if (String(item.id).indexOf(":im:staender") !== -1) n = item.qty;
    });
    return n || (members.length ? 1 : 0);
  }

  function standProduct(members) {
    var product = members[0];
    members.forEach(function (item) {
      if (String(item.id).indexOf(":im:zaun") !== -1) product = item;
    });
    return product;
  }

  function clampStand(value) {
    var qty = parseInt(value, 10);
    if (!qty || qty < 1) qty = 1;
    if (qty > 9999) qty = 9999;
    return qty;
  }

  function writeStand(key, n) {
    n = clampStand(n);
    var items = window.AMK_WUNSCH.load();
    var members = standMembers(items).filter(function (item) { return standKey(item) === key; });
    var old = standCount(members) || 1;
    items.forEach(function (item) {
      if (standKey(item) !== key) return;
      var je = Math.max(1, Math.round(item.qty / old));
      var qty = je * n;
      if (qty > 9999) qty = 9999;
      item.qty = qty;
    });
    window.AMK_WUNSCH.save(items, true);
    var row = null;
    list.querySelectorAll("[data-stand-key]").forEach(function (node) {
      if (!row && node.getAttribute("data-stand-key") === key) row = node;
    });
    if (!row) return;
    var title = row.querySelector("[data-stand-title]");
    var name = title ? title.getAttribute("data-stand-name") || "" : "";
    if (title) title.textContent = n + " × Komplett-Ständer – " + name;
    row.querySelectorAll("[data-je]").forEach(function (node) {
      var je = parseInt(node.getAttribute("data-je"), 10) || 1;
      var teil = node.getAttribute("data-teil") || "";
      var qty = je * n;
      if (qty > 9999) qty = 9999;
      node.textContent = qty + "× " + teil;
    });
  }

  function standMail(members) {
    if (!members.length) return "";
    var n = standCount(members);
    var product = standProduct(members);
    var lines = ["Kauf — " + n + " × Komplett-Ständer – " + product.name];
    members.forEach(function (item) { lines.push(item.qty + "× " + item.name); });
    return lines.join("\n");
  }

  function standRow(group) {
    var members = group.members;
    var key = group.key;
    var n = standCount(members);
    var product = standProduct(members);
    var info = CATALOG[product.id] || {};
    var bild = info.bild || product.bild;
    var image = bild ? '<img src="../' + esc(bild) + '" alt="" width="320" height="220">' : "";
    var fieldId = standFieldId(key);
    var parts = members.map(function (item) {
      var je = Math.max(1, Math.round(item.qty / n));
      return '<li data-je="' + je + '" data-teil="' + esc(item.name) + '">' + (je * n) + "× " + esc(item.name) + "</li>";
    }).join("");
    return '<li class="cart-row cart-stand" data-stand-key="' + esc(key) + '">' + image +
      '<div class="cart-main"><strong data-stand-title data-stand-name="' + esc(product.name) + '">' +
      esc(n + " × Komplett-Ständer – " + product.name) + "</strong>" +
      '<ul class="cart-stand-teile">' + parts + "</ul></div>" +
      '<div class="beispiel-step"><button type="button" data-stand-step="-1" aria-label="Weniger Ständer">−</button>' +
      '<label class="visually-hidden" for="' + fieldId + '">Ständeranzahl</label>' +
      '<input id="' + fieldId + '" data-stand-key="' + esc(key) + '" type="number" size="4" min="1" max="9999" value="' + n + '" inputmode="numeric">' +
      '<button type="button" data-stand-step="1" aria-label="Mehr Ständer">+</button></div>' +
      '<div class="cart-actions"><a class="text-btn" href="' + esc(standHref(key)) + '">Ändern<span class="visually-hidden">: Komplett-Ständer</span></a>' +
      '<button type="button" class="beispiel-weg" data-stand-weg="' + esc(key) + '" aria-label="Komplett-Ständer entfernen">×</button></div></li>';
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
        : '<label class="qty">Menge <input type="number" min="1" max="9999" inputmode="numeric" value="' + item.qty + '" data-index="' + index + '" aria-label="Menge ' + esc(item.name) + '"></label>';
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
      var body = group[1].map(function (entry) { return row(entry.item, entry.index); }).join("");
      if (group[0] === "Kauf") {
        var rest = group[1].filter(function (entry) { return !isIm(entry.item); });
        body = standGroups(group[1].map(function (entry) { return entry.item; })).map(standRow).join("") +
          rest.map(function (entry) { return row(entry.item, entry.index); }).join("");
      }
      return '<li class="cart-group"><h3>' + group[0] + "</h3></li>" + body;
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

  list.addEventListener("input", function (event) {
    var input = event.target.closest("[data-stand-key]");
    if (!input || input.value === "") return;
    var parsed = parseInt(input.value, 10);
    if (!parsed || parsed < 1) return;
    writeStand(input.getAttribute("data-stand-key"), parsed);
  });

  list.addEventListener("change", function (event) {
    var stand = event.target.closest("[data-stand-key]");
    if (stand) {
      var n = clampStand(stand.value);
      stand.value = String(n);
      writeStand(stand.getAttribute("data-stand-key"), n);
      return;
    }
    var input = event.target.closest("[data-index]");
    if (!input || input.type !== "number") return;
    var qty = parseInt(input.value, 10);
    if (!qty || qty < 1) qty = 1;
    if (qty > 9999) qty = 9999;
    input.value = String(qty);
    var items = window.AMK_WUNSCH.load();
    var index = Number(input.getAttribute("data-index"));
    if (items[index]) items[index].qty = qty;
    window.AMK_WUNSCH.save(items, true);
  });

  list.addEventListener("click", function (event) {
    var step = event.target.closest("[data-stand-step]");
    if (step && list.contains(step)) {
      var row = step.closest("[data-stand-key]");
      var field = row ? row.querySelector("input[data-stand-key]") : null;
      if (!field) return;
      var n = clampStand((parseInt(field.value, 10) || 1) + (parseInt(step.getAttribute("data-stand-step"), 10) || 0));
      field.value = String(n);
      writeStand(field.getAttribute("data-stand-key"), n);
      return;
    }
    var weg = event.target.closest("[data-stand-weg]");
    if (weg && list.contains(weg)) {
      var key = weg.getAttribute("data-stand-weg");
      window.AMK_WUNSCH.save(window.AMK_WUNSCH.load().filter(function (item) { return standKey(item) !== key; }));
      return;
    }
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

  var PFLICHT = {
    name: "Bitte Name angeben.",
    telefon: "Bitte Telefon angeben.",
    email: "Bitte E-Mail angeben.",
    datenschutz: "Bitte den Datenschutz-Hinweis bestätigen.",
    von: "Bitte Zeitraum angeben.",
    bis: "Bitte Zeitraum angeben."
  };

  function faultId(input) {
    return (input.id || input.name) + "-fehler";
  }

  function faultNode(input) {
    var id = faultId(input);
    var node = document.getElementById(id);
    if (node) return node;
    node = document.createElement("p");
    node.id = id;
    node.className = "field-error";
    node.hidden = true;
    var field = input.closest(".field");
    if (field) field.appendChild(node);
    else {
      var label = input.closest("label");
      var parent = label ? label.parentNode : input.parentNode;
      parent.insertBefore(node, label ? label.nextSibling : input.nextSibling);
    }
    return node;
  }

  function clearFault(input) {
    if (!input || !input.name) return;
    input.removeAttribute("aria-invalid");
    var node = document.getElementById(faultId(input));
    if (!node) return;
    node.hidden = true;
    node.textContent = "";
  }

  function missing(input) {
    if (input.type === "checkbox") return !input.checked;
    if (input.type === "email" && String(input.value || "").trim() && input.validity && input.validity.typeMismatch) return true;
    return !String(input.value || "").trim();
  }

  function faultText(input) {
    if (input.type === "email" && String(input.value || "").trim() && input.validity && input.validity.typeMismatch) {
      return "Bitte eine gültige E-Mail angeben.";
    }
    return PFLICHT[input.name];
  }

  function guard(names) {
    var first = null;
    names.forEach(function (name) {
      var input = form.elements[name];
      if (!input || !PFLICHT[name]) return;
      if (missing(input)) {
        var node = faultNode(input);
        input.setAttribute("aria-invalid", "true");
        input.setAttribute("aria-describedby", node.id);
        node.textContent = faultText(input);
        node.hidden = false;
        if (!first) first = input;
      } else clearFault(input);
    });
    if (first) {
      first.focus({ preventScroll: true });
      first.scrollIntoView({ block: "center" });
    }
    return !first;
  }

  form.addEventListener("input", function (event) {
    var input = event.target;
    if (input && input.name && PFLICHT[input.name] && !missing(input)) clearFault(input);
  });
  form.addEventListener("change", function (event) {
    var input = event.target;
    if (input && input.name && PFLICHT[input.name] && !missing(input)) clearFault(input);
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var status = document.getElementById("anfrage-status");
    var items = window.AMK_WUNSCH.load();
    var fields = readMeta();
    function val(name) { return String(fields[name] || "").trim(); }
    status.classList.remove("is-error");
    if (!items.length) return;
    if (!guard(["name", "telefon", "email", "datenschutz"])) return;
    var askPeriod = needsPeriod(items);
    if (askPeriod && renting(items)) {
      var vonField = document.getElementById("von");
      var bisField = document.getElementById("bis");
      if (window.AMK_ZEIT && !window.AMK_ZEIT.checkPair(vonField, bisField)) return;
      if (!vonField.value || !bisField.value) {
        guard([vonField.value ? "bis" : "von"]);
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
      if (prefix === "kauf:") standGroups(items).forEach(function (group) { lines.push(standMail(group.members)); });
      items.forEach(function (item) {
        if (isIm(item)) return;
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
