(function () {
  /* Eine Karte für alle Gruppen: Checkbox, Mengenfeld erst nach dem Anhaken.
     Bauzaun nutzt Meter oder Felder, alle anderen die Stückzahl. */
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

  function stueck(inputId, qty) {
    return '<div class="field"><label for="' + esc(inputId) + '">Anzahl</label>' +
      '<input id="' + esc(inputId) + '" data-menge type="number" min="1" max="99" value="' + esc(qty) + '" inputmode="numeric"></div>';
  }

  function laenge(opts, qty) {
    var inputId = esc(opts.inputId);
    var unitName = esc(opts.unitName);
    var unit = opts.unit === "felder" ? "felder" : "m";
    var labelId = esc(opts.labelId || ("label-" + opts.value));
    var label = unit === "felder" ? "Anzahl Felder" : "Länge in Metern";
    var mode = unit === "felder" ? "numeric" : "decimal";
    var aria = esc(opts.unitLabel || ("Einheit für " + opts.title));
    return '<div class="unit-switch" role="radiogroup" aria-label="' + aria + '">' +
      '<label class="choice"><input type="radio" name="' + unitName + '" value="m"' + (unit === "m" ? " checked" : "") + '> <span>Meter</span></label>' +
      '<label class="choice"><input type="radio" name="' + unitName + '" value="felder"' + (unit === "felder" ? " checked" : "") + '> <span>Felder</span></label>' +
      "</div>" +
      '<div class="field"><label id="' + labelId + '" for="' + inputId + '">' + label + "</label>" +
      '<input id="' + inputId + '" name="' + inputId + '" data-menge type="text" inputmode="' + mode + '" autocomplete="off" value="' + esc(qty) + '"></div>';
  }

  function card(opts) {
    var on = !!opts.checked;
    var mode = opts.mode === "laenge" ? "laenge" : "stueck";
    var qty = opts.qty == null || opts.qty === "" ? (mode === "stueck" ? "1" : "") : opts.qty;
    var withMenge = mode === "laenge" || opts.menge !== false;
    var panel = "";
    var controls = "";
    if (withMenge) {
      panel = mode === "laenge" ? laenge(opts, qty) : stueck(opts.inputId, qty);
      controls = ' aria-controls="' + esc(opts.panelId) + '"';
      panel = '<div class="pick-menge" id="' + esc(opts.panelId) + '" data-menge-fuer="' + esc(opts.value) + '"' + (on ? "" : " hidden") + ">" + panel + "</div>";
    }
    return '<div class="pick-block"' + dataAttrs(opts.data) + ">" +
      '<label class="pick">' + (opts.media || "") +
      '<span><input type="checkbox" name="' + esc(opts.name) + '" value="' + esc(opts.value) + '"' +
      (on ? " checked" : "") + controls + "><strong>" + esc(opts.title) + "</strong></span></label>" +
      panel + (opts.extra || "") + "</div>";
  }

  function reveal(box, focus) {
    if (!box) return;
    var id = box.getAttribute("aria-controls") || "";
    var panel = id ? document.getElementById(id) : null;
    if (!panel) return;
    if (box.checked) {
      panel.hidden = false;
      if (!focus) return;
      var field = panel.querySelector("[data-menge]");
      window.setTimeout(function () {
        if (!box.checked || panel.hidden || !field) return;
        field.focus();
        if (typeof field.select === "function") field.select();
      }, 0);
      return;
    }
    if (panel.contains(document.activeElement)) box.focus();
    panel.hidden = true;
  }

  document.addEventListener("change", function (event) {
    var box = event.target;
    if (!box || !box.matches || !box.matches('.pick input[type="checkbox"][aria-controls]')) return;
    reveal(box, true);
  });

  window.AMK_TYPWAHL = { card: card, reveal: reveal };
})();
