(function () {
  var board = document.getElementById("miete-board");
  var gruppen = document.getElementById("miete-gruppen");
  var zaun = document.getElementById("miete-zaun");
  var konfig = document.getElementById("miete-konfig");
  var geraet = document.getElementById("miete-geraet");
  var verkehr = document.getElementById("miete-verkehr");
  var anhaenger = document.getElementById("miete-anhaenger");
  var genehmigung = document.getElementById("genehmigung-miete");
  if (!board || !gruppen || !window.AMK_GRUPPEN) return;

  var panels = { zaun: zaun, verkehr: verkehr, anhaenger: anhaenger };
  var state = { gruppe: "", teil: "zaun" };
  var ZAUN = { zaun: 1, gitter: 1, schwellen: 1, schleuse: 1, buehne: 1 };
  var zeichen = "";
  var GENEHM = "miete:genehmigung";

  function deviceTeile(gruppe) {
    if (gruppe === "verkehr") return window.AMK_AUSWAHL && window.AMK_AUSWAHL.teile.absperrung;
    return window.AMK_AUSWAHL && window.AMK_AUSWAHL.teile[gruppe];
  }

  function allowed(gruppe, teil) {
    if (gruppe === "zaun") return ZAUN[teil] ? teil : "zaun";
    var list = deviceTeile(gruppe);
    if (list && list.indexOf(teil) !== -1) return teil;
    return "";
  }

  function readUrl() {
    var params = new URLSearchParams(location.search);
    var gruppe = window.AMK_GRUPPEN.canon(params.get("gruppe") || "");
    if (!window.AMK_GRUPPEN.byId[gruppe]) gruppe = "zaun";
    var teil = params.get("teil") || "";
    var unter = params.get("unter") || "";
    if (gruppe === "zaun" && teil === "leit") teil = ZAUN[unter] ? unter : "schwellen";
    if (gruppe === "verkehr" && ZAUN[teil] && teil !== "zaun" && teil !== "gitter") {
      gruppe = "zaun";
    }
    var signs = window.AMK_SCHILDER_TEILE || [];
    zeichen = "";
    if (gruppe === "verkehr" && signs.indexOf(teil) !== -1) {
      zeichen = teil;
      if (window.AMK_SCHILDER_UI && window.AMK_SCHILDER_UI.open) window.AMK_SCHILDER_UI.open(teil);
      teil = "";
    }
    state = { gruppe: gruppe, teil: allowed(gruppe, teil) };
  }

  function writeUrl(mode) {
    var params = new URLSearchParams();
    if (state.gruppe) params.set("gruppe", state.gruppe);
    if (state.gruppe === "verkehr" && zeichen) params.set("teil", zeichen);
    else if (state.gruppe === "zaun" && state.teil && state.teil !== "zaun") params.set("teil", state.teil);
    else if (state.gruppe && state.gruppe !== "zaun" && state.teil) params.set("teil", state.teil);
    var qs = params.toString();
    var url = location.pathname + (qs ? "?" + qs : "");
    if (mode === "push") history.pushState({ miete: 1 }, "", url);
    else history.replaceState({ miete: 1 }, "", url);
  }

  function render() {
    var open = !!state.gruppe;
    board.classList.toggle("is-gruppe", open);
    gruppen.querySelectorAll("[data-gruppe]").forEach(function (link) {
      var on = link.getAttribute("data-gruppe") === state.gruppe;
      if (on) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
    Object.keys(panels).forEach(function (id) {
      if (panels[id]) panels[id].hidden = id !== state.gruppe;
    });
    if (konfig) konfig.hidden = state.teil !== "zaun";
    if (geraet) {
      var pick = state.teil === "gitter" || state.teil === "schwellen" || state.teil === "schleuse" || state.teil === "buehne";
      geraet.hidden = !pick;
      if (pick) geraet.setAttribute("data-gruppe", state.teil);
    }
    document.querySelectorAll("#miete-unter [data-teil]").forEach(function (link) {
      var on = link.getAttribute("data-teil") === state.teil;
      if (on) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
    if (window.AMK_AUSWAHL) window.AMK_AUSWAHL.sync();
    if (window.AMK_SCHILDER_UI) window.AMK_SCHILDER_UI.sync();
    verkehrLeiste();
  }

  function verkehrZeilen() {
    var lines = [];
    if (genehmigung && genehmigung.checked) {
      lines.push({ name: "Anordnung durch AMK beantragen lassen", menge: "" });
    }
    var zeile = window.AMK_AUSWAHL && window.AMK_AUSWAHL.zeileVon;
    var geraete = document.getElementById("miete-absperrung");
    if (geraete && zeile) {
      geraete.querySelectorAll('input[name="typ"]:checked').forEach(function (box) {
        lines.push(zeile(box));
      });
    }
    var schilder = document.getElementById("miete-schilder");
    if (schilder && zeile) {
      schilder.querySelectorAll('input[name="schild"]:checked').forEach(function (box) {
        lines.push(zeile(box));
      });
      var note = schilder.elements.hinweis;
      var text = note ? String(note.value || "").trim() : "";
      if (text) lines.push({ name: "Größe, Folie, Ständer", menge: text });
    }
    return lines;
  }

  function verkehrLeiste() {
    var aside = document.getElementById("miete-verkehr-summe");
    if (!aside || !window.AMK_AUSWAHL || !window.AMK_AUSWAHL.fillLeiste) return;
    window.AMK_AUSWAHL.fillLeiste(aside, verkehrZeilen());
  }

  function ersteWahl(root) {
    if (!root) return null;
    var boxes = root.querySelectorAll('input[name="typ"], input[name="schild"]');
    var i;
    for (i = 0; i < boxes.length; i++) {
      var card = boxes[i].closest("[data-teil-karte], [data-schild]");
      if (card && card.hidden) continue;
      return boxes[i];
    }
    return null;
  }

  gruppen.addEventListener("click", function (event) {
    var link = event.target.closest("a[data-gruppe]");
    if (!link) return;
    event.preventDefault();
    state.gruppe = window.AMK_GRUPPEN.canon(link.getAttribute("data-gruppe") || "") || "zaun";
    state.teil = state.gruppe === "zaun" ? "zaun" : "";
    render();
    writeUrl("push");
  });

  function genehmigungOn() {
    if (!window.AMK_WUNSCH || !window.AMK_WUNSCH.load) return false;
    return window.AMK_WUNSCH.load().some(function (item) { return item.id === GENEHM; });
  }

  function genehmigungSync() {
    if (genehmigung) genehmigung.checked = genehmigungOn();
  }

  if (genehmigung && window.AMK_WUNSCH) {
    genehmigung.addEventListener("change", function () {
      if (genehmigung.checked) {
        window.AMK_WUNSCH.replace({
          id: GENEHM,
          name: "Anordnung durch AMK beantragen lassen",
          qty: 1,
          sammel: true,
          kat: "verkehrssicherung"
        });
      } else if (window.AMK_WUNSCH.remove) {
        window.AMK_WUNSCH.remove(GENEHM);
      }
    });
    var previous = window.AMK_WUNSCH.onChange;
    window.AMK_WUNSCH.onChange = function (items) {
      if (typeof previous === "function") previous(items);
      genehmigungSync();
    };
    genehmigungSync();
  }

  document.addEventListener("amk-teil", function (event) {
    var detail = String(event.detail || "");
    if (!state.gruppe || state.gruppe === "zaun") return;
    var teil = allowed(state.gruppe, detail);
    if (!teil) return;
    zeichen = "";
    state.teil = teil;
    writeUrl("push");
    render();
  });

  var unter = document.getElementById("miete-unter");
  if (unter) {
    unter.addEventListener("click", function (event) {
      var link = event.target.closest("a[data-teil]");
      if (!link) return;
      event.preventDefault();
      state.gruppe = "zaun";
      zeichen = "";
      state.teil = allowed("zaun", link.getAttribute("data-teil") || "");
      render();
      writeUrl("push");
    });
  }

  window.addEventListener("popstate", function () {
    readUrl();
    render();
  });

  if (verkehr) {
    verkehr.addEventListener("change", verkehrLeiste);
    verkehr.addEventListener("input", verkehrLeiste);
  }
  document.addEventListener("amk-auswahl", verkehrLeiste);
  var korb = document.getElementById("miete-verkehr-korb");
  if (korb) {
    korb.addEventListener("click", function () {
      if (!verkehrZeilen().length) {
        var first = ersteWahl(verkehr);
        if (first) first.focus();
        return;
      }
      var device = document.querySelector("#miete-absperrung form");
      var signs = document.getElementById("miete-schilder");
      if (device) device.requestSubmit();
      if (signs) signs.requestSubmit();
    });
  }

  document.addEventListener("amk-zeichen", function (event) {
    if (state.gruppe !== "verkehr") return;
    var id = String(event.detail || "");
    var signs = window.AMK_SCHILDER_TEILE || [];
    if (signs.indexOf(id) === -1) return;
    zeichen = id;
    state.teil = "";
    writeUrl("push");
  });

  function jumpTo(selector) {
    var tries = 0;
    function step() {
      var target = document.querySelector(selector);
      if (target && target.getBoundingClientRect().height > 0) {
        var root = document.documentElement;
        var previous = root.style.scrollBehavior;
        root.style.scrollBehavior = "auto";
        target.scrollIntoView({ block: "start" });
        root.style.scrollBehavior = previous;
        return;
      }
      tries += 1;
      if (tries < 40) window.setTimeout(step, 50);
    }
    step();
  }

  readUrl();
  render();
  writeUrl("replace");
  if (state.gruppe === "verkehr" && zeichen) jumpTo("#miete-schilder .kauf-cats");
  else if (state.gruppe === "verkehr" && state.teil) jumpTo("#miete-absperrung .kauf-cats");
})();
