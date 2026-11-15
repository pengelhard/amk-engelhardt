(function () {
  var blocks = document.querySelectorAll("[data-gruppe-block]");
  var links = document.querySelectorAll("[data-live-filter]");
  var vde = document.getElementById("nur-vde");
  var rechner = document.getElementById("rechner");
  var topBar = document.querySelector(".top");

  function pinBar() {
    if (!topBar) return;
    document.documentElement.style.setProperty("--bar", topBar.offsetHeight + "px");
  }

  pinBar();
  window.addEventListener("resize", pinBar);
  if (topBar && window.ResizeObserver) new ResizeObserver(pinBar).observe(topBar);

  function visibleGroup() {
    var current = document.querySelector("[data-live-filter][aria-current='page']");
    if (current) return current.getAttribute("data-live-filter");
    var open = [];
    blocks.forEach(function (block) {
      if (!block.hidden) open.push(block.getAttribute("data-gruppe-block"));
    });
    return open.length === 1 ? open[0] : "";
  }

  function cardsIn(name) {
    return document.querySelectorAll("[data-gruppe='" + name + "']");
  }

  function hasVde(name) {
    return Array.prototype.some.call(cardsIn(name), function (card) {
      return card.getAttribute("data-vde") === "ja";
    });
  }

  function applyVde() {
    var toggle = vde && vde.closest(".vde-toggle");
    var name = visibleGroup();
    var only = !!(toggle && !toggle.hidden && vde.checked && !vde.disabled && name);
    document.querySelectorAll("[data-gruppe]").forEach(function (card) {
      var group = card.getAttribute("data-gruppe");
      var isVde = card.getAttribute("data-vde") === "ja";
      card.hidden = !!(only && group === name && !isVde);
    });
  }

  function syncFilters() {
    document.querySelectorAll("[data-live-filter]").forEach(function (link) {
      var name = link.getAttribute("data-live-filter");
      link.hidden = cardsIn(name).length === 0;
    });
    var toggle = vde && vde.closest(".vde-toggle");
    if (toggle) {
      var name = visibleGroup();
      var show = !!(name && hasVde(name));
      toggle.hidden = !show;
      vde.disabled = !show;
      if (!show) vde.checked = false;
    }
    applyVde();
  }

  if (vde) vde.addEventListener("change", syncFilters);
  syncFilters();

  if (blocks.length < 2 || !links.length) return;

  links.forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      var name = link.getAttribute("data-live-filter");
      blocks.forEach(function (block) {
        block.hidden = block.getAttribute("data-gruppe-block") !== name;
      });
      links.forEach(function (other) {
        if (other === link) other.setAttribute("aria-current", "page");
        else other.removeAttribute("aria-current");
      });
      if (rechner && name === "bauzaun") rechner.open = true;
      syncFilters();
    });
  });
})();
