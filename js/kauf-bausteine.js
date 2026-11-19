(function () {
  /* Gemeinsame Kauf-Bausteine: Kachel, Mengenfeld, Auswahlkreis.
     Ober- und Unterkacheln tragen dieselben Klassen an den Links.
     Die Produktkachel und das Zubehör nutzen produkt und zubehoerKachel. */

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function dataAttrs(map) {
    var out = "";
    if (!map) return out;
    Object.keys(map).forEach(function (key) {
      out += " data-" + key + '="' + esc(map[key]) + '"';
    });
    return out;
  }

  function kreis() {
    return '<span class="beispiel-kreis kachel-kreis"></span>';
  }

  function mengeFeld(inputId, qty) {
    return '<div class="field kachel-menge"><label for="' + esc(inputId) + '">Anzahl</label>' +
      '<input id="' + esc(inputId) + '" data-menge type="number" min="1" max="9999" value="' + esc(qty) + '" inputmode="numeric"></div>';
  }

  function mengeSchritt(opts) {
    var min = opts.min == null ? 1 : opts.min;
    var attrs = "";
    if (opts.key != null && opts.key !== "") attrs += ' data-spiegel="' + esc(opts.key) + '"';
    if (opts.merk) attrs += ' data-schnell="' + esc(opts.merk) + '"';
    if (opts.alsMenge) attrs += " data-menge";
    if (opts.name) attrs += ' name="' + esc(opts.name) + '"';
    return '<div class="beispiel-step kachel-menge"' + (opts.hidden ? " hidden" : "") + ">" +
      '<button type="button" data-step="-1" aria-label="Weniger">−</button>' +
      '<label class="visually-hidden" for="' + esc(opts.id) + '">' + esc(opts.label) + "</label>" +
      '<input id="' + esc(opts.id) + '"' + attrs + ' type="number" size="4" min="' + min + '" max="9999" value="' + esc(opts.value) + '" inputmode="numeric">' +
      '<button type="button" data-step="1" aria-label="Mehr">+</button></div>';
  }

  function produkt(opts, box, panel) {
    var zeile = opts.note ? esc(opts.note) : "\u00a0";
    var inner = '<span class="frame">' + (opts.media || "") + "</span><h3>" + esc(opts.title) + "</h3>";
    var link = opts.href ? '<a href="' + esc(opts.href) + '">' + inner + "</a>" : inner;
    var unten = opts.fuss != null ? opts.fuss : ((panel || "") + schnellLeer());
    return '<article class="tile kauf-produkt kachel kachel--produkt"' + dataAttrs(opts.data) + ">" +
      link +
      "<p>" + zeile + "</p>" +
      '<label class="beispiel-wahl">' + box + kreis() +
      '<span class="visually-hidden">' + esc(opts.title) + " auswählen</span></label>" +
      unten + "</article>";
  }

  function zubehoerKachel(opts) {
    return '<article class="tile beispiel-pick kachel kachel--produkt"><label class="beispiel-hit">' +
      '<span class="frame"><img src="' + esc(opts.src) + '" alt="" width="' + esc(opts.width || 1200) + '" height="' + esc(opts.height || 675) + '" decoding="async">' +
      '<span class="beispiel-wahl"><input type="checkbox" name="zubehoer" value="' + esc(opts.slug) + '" aria-label="' + esc(opts.name) + '">' + kreis() + "</span></span>" +
      '<span class="beispiel-name"><h3>' + esc(opts.name) + '</h3><span class="beispiel-mass">' + esc(opts.kicker || "") + "</span></span></label>" +
      '<div class="beispiel-fuss">' +
      mengeSchritt({
        id: "menge-" + opts.slug,
        name: opts.mengeName ? "menge-" + opts.slug : "",
        value: "1",
        label: "Menge " + opts.name,
        min: 1,
        hidden: true
      }) +
      (opts.fuss || "") +
      "</div></article>";
  }

  function schnellZeile(label, id, merk) {
    return '<div class="kauf-schnell-zeile"><span>' + esc(label) + "</span>" +
      mengeSchritt({ id: id, value: "0", label: label, min: 0, merk: merk }) + "</div>";
  }

  function schnell(opts) {
    var slug = opts.slug || "";
    return '<div class="kauf-schnell" data-slug="' + esc(slug) + '">' +
      schnellZeile("Ständer", "schnell-staender-" + slug, "staender") +
      schnellZeile("Einzelfelder", "schnell-felder-" + slug, "felder") +
      '<p class="kauf-schnell-fuss"><a class="kauf-schnell-details" href="' + esc(opts.href || "") + '">Details anpassen</a>' +
      '<span class="kauf-schnell-hinweis" hidden>angepasst</span></p></div>';
  }

  function schnellLeer() {
    return '<div class="kauf-schnell kauf-schnell--leer" aria-hidden="true"></div>';
  }

  window.AMK_BAUSTEINE = {
    esc: esc,
    kreis: kreis,
    mengeFeld: mengeFeld,
    mengeSchritt: mengeSchritt,
    produkt: produkt,
    schnell: schnell,
    schnellLeer: schnellLeer,
    zubehoerKachel: zubehoerKachel
  };
})();
