(function () {
  /* Detailseite: Daten sichtbar, Brotkrume zur Kategorie, Lieferumfang und
     Zubehör nur wenn der Katalog sie nennt. Siehe docs/kauf.md. */
  function scriptRoot() {
    var nodes = document.getElementsByTagName("script");
    var i;
    for (i = 0; i < nodes.length; i++) {
      var src = nodes[i].getAttribute("src") || "";
      var at = src.indexOf("js/produkt.js");
      if (at >= 0) return src.slice(0, at);
    }
    return "";
  }

  function slugFromPath() {
    var parts = location.pathname.split("/").filter(Boolean);
    var at = parts.indexOf("produkt");
    if (at >= 0 && parts[at + 1]) return decodeURIComponent(parts[at + 1]);
    return "";
  }

  var SHOP = {
    bauzaune: { gruppe: "zaun", kat: "bauzaune", label: "Bauzäune" },
    zubehoer: { gruppe: "zaun", kat: "zubehoer", label: "Zaunzubehör" },
    tore: { gruppe: "zaun", kat: "tore", label: "Türen & Tore" },
    sichtschutz: { gruppe: "zaun", kat: "sichtschutz", label: "Sichtschutz & Planen" },
    gitter: { gruppe: "zaun", kat: "gitter", label: "Absperrgitter" },
    schilder: { gruppe: "verkehr", kat: "", label: "Verkehrsabsicherung & Schilder" },
    verkehr: { gruppe: "verkehr", kat: "", label: "Verkehrsabsicherung & Schilder" },
    anhaenger: { gruppe: "anhaenger", kat: "", label: "Anhänger" }
  };
  var LEIT = { Betonschwellen: 1, Schleuse: 1, "Bühne": 1 };

  function crumbFor(product) {
    if (!product) return null;
    var art = product.attr && product.attr.art;
    if (product.shop === "verkehr" && LEIT[art]) {
      return { gruppe: "zaun", kat: "leit", label: "Leitschwellen, Schleusen & Bühnen" };
    }
    return SHOP[product.shop] || null;
  }

  function hrefOf(root, crumb) {
    var url = root + "kaufen/?gruppe=" + encodeURIComponent(crumb.gruppe);
    if (crumb.kat) url += "&kat=" + encodeURIComponent(crumb.kat);
    return url;
  }

  function openSheets(host) {
    host.querySelectorAll("details.sheet").forEach(function (node) {
      var summary = node.querySelector("summary");
      var title = summary ? summary.textContent.replace(/\s+/g, " ").trim() : "";
      var section = document.createElement("section");
      section.className = "detail-block";
      if (title) {
        var heading = document.createElement("h2");
        heading.textContent = title;
        section.appendChild(heading);
      }
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child !== summary) section.appendChild(child);
      });
      node.replaceWith(section);
    });
  }

  function addCrumb(root, crumb) {
    var nav = document.querySelector("main .crumbs");
    if (!nav || !crumb || nav.querySelector("a[href*='gruppe=']")) return;
    var current = nav.querySelector("[aria-current='page']");
    if (!current) return;
    var link = document.createElement("a");
    link.href = hrefOf(root, crumb);
    link.textContent = crumb.label;
    var sep = document.createElement("span");
    sep.setAttribute("aria-hidden", "true");
    sep.textContent = "›";
    nav.insertBefore(link, current);
    nav.insertBefore(document.createTextNode(" "), current);
    nav.insertBefore(sep, current);
    nav.insertBefore(document.createTextNode(" "), current);
  }

  function sectionOf(title) {
    var section = document.createElement("section");
    section.className = "detail-block";
    var heading = document.createElement("h2");
    heading.textContent = title;
    section.appendChild(heading);
    return section;
  }

  function insertBeforeForm(node) {
    var form = document.querySelector("main form.order, main form.schilder");
    if (form && form.parentNode) form.parentNode.insertBefore(node, form);
    else {
      var host = document.querySelector("main .detail > div");
      if (host) host.appendChild(node);
    }
  }

  function specTable(rows) {
    var section = sectionOf("Technische Daten");
    var table = document.createElement("table");
    table.className = "spec-table";
    var body = document.createElement("tbody");
    rows.forEach(function (row) {
      if (!row || row.length < 2 || !String(row[0]).trim() || !String(row[1]).trim()) return;
      var tr = document.createElement("tr");
      var th = document.createElement("th");
      th.scope = "row";
      th.textContent = String(row[0]);
      var td = document.createElement("td");
      td.textContent = String(row[1]);
      tr.appendChild(th);
      tr.appendChild(td);
      body.appendChild(tr);
    });
    if (!body.children.length) return null;
    table.appendChild(body);
    section.appendChild(table);
    return section;
  }

  function loadEckdaten(root, done) {
    if (window.AMK_ANHAENGER_ECKDATEN) {
      done(window.AMK_ANHAENGER_ECKDATEN);
      return;
    }
    var script = document.createElement("script");
    script.src = root + "data/anhaenger-eckdaten.js";
    script.onload = function () { done(window.AMK_ANHAENGER_ECKDATEN || {}); };
    script.onerror = function () { done({}); };
    document.body.appendChild(script);
  }

  function applyExtras(product, all, root, host) {
    if (!product) return;
    addCrumb(root, crumbFor(product));
    var lieferung = Array.isArray(product.lieferung) ? product.lieferung.filter(function (item) {
      return typeof item === "string" && item.trim();
    }) : [];
    if (lieferung.length) {
      var block = sectionOf("Lieferumfang");
      var list = document.createElement("ul");
      lieferung.forEach(function (item) {
        var li = document.createElement("li");
        li.textContent = item.trim();
        list.appendChild(li);
      });
      block.appendChild(list);
      insertBeforeForm(block);
    }
    var slugs = Array.isArray(product.zubehoer) ? product.zubehoer.filter(function (item) {
      return typeof item === "string" && item.trim();
    }) : [];
    if (slugs.length) {
      var bySlug = {};
      (all || []).forEach(function (item) { if (item && item.slug) bySlug[item.slug] = item; });
      var links = sectionOf("Passt dazu");
      var linked = document.createElement("ul");
      linked.className = "detail-links";
      slugs.forEach(function (slug) {
        var item = bySlug[slug];
        if (!item || !item.name) return;
        var li = document.createElement("li");
        var anchor = document.createElement("a");
        anchor.href = root + "produkt/" + encodeURIComponent(slug) + "/";
        anchor.textContent = item.name;
        li.appendChild(anchor);
        linked.appendChild(li);
      });
      if (linked.children.length) {
        links.appendChild(linked);
        insertBeforeForm(links);
      }
    }
    if (product.shop === "anhaenger" && !host.querySelector("table.spec-table")) {
      loadEckdaten(root, function (map) {
        var rows = map && map[product.slug];
        var table = rows ? specTable(rows) : null;
        if (table && !host.querySelector("table.spec-table")) insertBeforeForm(table);
      });
    }
  }

  function upgrade() {
    var host = document.querySelector("main .wrap.detail");
    if (!host || host.dataset.produkt) return;
    host.dataset.produkt = "1";
    openSheets(host);
    var root = scriptRoot();
    var form = document.querySelector("form[data-order]");
    var slug = slugFromPath();
    if (form && form.getAttribute("data-slug") && form.getAttribute("data-slug").indexOf("schild:") === 0) {
      addCrumb(root, SHOP.schilder);
      return;
    }
    if (form && form.getAttribute("data-slug")) slug = form.getAttribute("data-slug");
    fetch(root + "data/katalog.json")
      .then(function (response) { return response.json(); })
      .then(function (data) {
        var all = Array.isArray(data) ? data : [];
        var product = null;
        all.forEach(function (item) { if (item && item.slug === slug) product = item; });
        applyExtras(product, all, root, host);
      })
      .catch(function () {});
  }

  window.AMK_PRODUKT = { crumbFor: crumbFor, openSheets: openSheets };
  upgrade();
})();
