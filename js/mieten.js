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
  var lists = { gitter: gitter, verkehr: absperrung, anhaenger: anhaenger };
  var katOf = { gitter: "bauzaun", verkehr: "verkehrssicherung", anhaenger: "anhaenger" };
  var state = { gruppe: "", teil: "zaun" };

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function readUrl() {
    var params = new URLSearchParams(location.search);
    var gruppe = params.get("gruppe") || "";
    if (!window.AMK_GRUPPEN.byId[gruppe]) gruppe = "";
    var teil = params.get("teil") === "gitter" ? "gitter" : "zaun";
    state = { gruppe: gruppe, teil: gruppe === "zaun" ? teil : "zaun" };
  }

  function writeUrl(mode) {
    var params = new URLSearchParams();
    if (state.gruppe) params.set("gruppe", state.gruppe);
    if (state.gruppe === "zaun" && state.teil === "gitter") params.set("teil", "gitter");
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
  }

  function card(product, kat) {
    var bild = product.bild ? '<span class="frame"><img loading="lazy" src="../' + esc(product.bild) + '" alt="' + esc(product.alt || "") + '" width="' + (product.width || 640) + '" height="' + (product.height || 480) + '" decoding="async"></span>' : "";
    return '<article class="tile"><a href="../produkt/' + esc(product.slug) + '/">' + bild + "<h3>" + esc(product.name) + "</h3></a>" +
      '<form class="order" data-miete="' + esc(product.slug) + '" data-name="' + esc(product.name) + '" data-bild="' + esc(product.bild || "") + '" data-kat="' + kat + '">' +
      '<div class="field order-qty"><label>Menge <input name="menge" type="number" min="1" max="99" value="1" inputmode="numeric" required></label></div>' +
      '<button class="btn" type="submit">In den Anfragekorb</button></form></article>';
  }

  function fill(shop, products) {
    var node = lists[shop];
    if (!node) return;
    var kat = katOf[shop] || "";
    node.innerHTML = products.filter(function (product) { return product.shop === shop; }).map(function (product) {
      return card(product, kat);
    }).join("");
  }

  board.addEventListener("submit", function (event) {
    var form = event.target.closest("form[data-miete]");
    if (!form || !window.AMK_WUNSCH) return;
    event.preventDefault();
    var qtyField = form.elements.menge;
    var qty = parseInt(qtyField && qtyField.value, 10);
    if (!qty || qty < 1 || qty > 99) {
      if (qtyField) qtyField.focus();
      return;
    }
    window.AMK_WUNSCH.add({
      id: "miete:" + form.getAttribute("data-miete"),
      name: form.getAttribute("data-name") || "",
      qty: qty,
      bild: form.getAttribute("data-bild") || "",
      kat: form.getAttribute("data-kat") || ""
    });
  });

  gruppen.addEventListener("click", function (event) {
    var link = event.target.closest("a[data-gruppe]");
    if (!link) return;
    event.preventDefault();
    state.gruppe = link.getAttribute("data-gruppe") || "";
    state.teil = "zaun";
    render();
    writeUrl("push");
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
  if (location.search) writeUrl("replace");

  fetch("../data/katalog.json")
    .then(function (response) { return response.json(); })
    .then(function (data) {
      fill("gitter", data);
      fill("verkehr", data);
      fill("anhaenger", data);
    });
})();
