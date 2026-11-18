(function () {
  var board = document.getElementById("miete-board");
  var gruppen = document.getElementById("miete-gruppen");
  var zaun = document.getElementById("miete-zaun");
  var konfig = document.getElementById("miete-konfig");
  var gitter = document.getElementById("miete-gitter");
  var schilder = document.getElementById("miete-schilder");
  var absperrung = document.getElementById("miete-absperrung");
  var anhaenger = document.getElementById("miete-anhaenger");
  if (!board || !gruppen || !window.AMK_GRUPPEN) return;

  var panels = { zaun: zaun, schilder: schilder, absperrung: absperrung, anhaenger: anhaenger };
  var state = { gruppe: "", teil: "zaun" };

  function allowed(gruppe, teil) {
    if (gruppe === "zaun") return teil === "gitter" ? "gitter" : "zaun";
    var list = gruppe === "schilder"
      ? window.AMK_SCHILDER_TEILE
      : (window.AMK_AUSWAHL && window.AMK_AUSWAHL.teile[gruppe]);
    if (list && list.indexOf(teil) !== -1) return teil;
    return gruppe === "zaun" ? "zaun" : "";
  }

  function readUrl() {
    var params = new URLSearchParams(location.search);
    var gruppe = params.get("gruppe") || "";
    if (!window.AMK_GRUPPEN.byId[gruppe]) gruppe = "zaun";
    state = { gruppe: gruppe, teil: allowed(gruppe, params.get("teil") || "") };
  }

  function writeUrl(mode) {
    var params = new URLSearchParams();
    if (state.gruppe) params.set("gruppe", state.gruppe);
    if (state.gruppe === "zaun" && state.teil === "gitter") params.set("teil", "gitter");
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
    if (gitter) gitter.hidden = state.teil !== "gitter";
    document.querySelectorAll("#miete-unter [data-teil]").forEach(function (button) {
      var on = button.getAttribute("data-teil") === state.teil;
      button.setAttribute("aria-pressed", on ? "true" : "false");
    });
    if (window.AMK_AUSWAHL) window.AMK_AUSWAHL.sync();
    if (window.AMK_SCHILDER_UI) window.AMK_SCHILDER_UI.sync();
  }

  gruppen.addEventListener("click", function (event) {
    var link = event.target.closest("a[data-gruppe]");
    if (!link) return;
    event.preventDefault();
    state.gruppe = link.getAttribute("data-gruppe") || "";
    state.teil = state.gruppe === "zaun" ? "zaun" : "";
    render();
    writeUrl("push");
  });

  document.addEventListener("amk-teil", function (event) {
    if (!state.gruppe || state.gruppe === "zaun") return;
    var teil = allowed(state.gruppe, String(event.detail || ""));
    if (!teil) return;
    state.teil = teil;
    writeUrl("push");
    render();
  });

  var unter = document.getElementById("miete-unter");
  if (unter) {
    unter.addEventListener("click", function (event) {
      var button = event.target.closest("[data-teil]");
      if (!button) return;
      state.gruppe = "zaun";
      state.teil = button.getAttribute("data-teil") === "gitter" ? "gitter" : "zaun";
      render();
      writeUrl("push");
    });
  }

  window.addEventListener("popstate", function () {
    readUrl();
    render();
  });

  readUrl();
  render();
  writeUrl("replace");
})();
