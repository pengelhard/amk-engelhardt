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

  function applyVde() {
    var only = vde && vde.checked && !vde.disabled;
    document.querySelectorAll("[data-gruppe='absperrung']").forEach(function (card) {
      var mark = card.getAttribute("data-vde");
      var isVde = mark === "ja" || mark === "beispiel";
      card.hidden = !!(only && !isVde);
    });
  }

  if (vde) vde.addEventListener("change", applyVde);

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
      if (vde) {
        var onFence = name === "absperrung";
        vde.disabled = !onFence;
        if (!onFence) vde.checked = false;
      }
      if (rechner && name === "bauzaun") rechner.open = true;
      applyVde();
    });
  });
})();
