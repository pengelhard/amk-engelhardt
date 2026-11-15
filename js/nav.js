(function () {
  var tab = document.querySelector(".tabbar");

  function pinTab() {
    if (!tab || getComputedStyle(tab).display === "none") {
      document.documentElement.style.removeProperty("--tabbar");
      return;
    }
    document.documentElement.style.setProperty("--tabbar", tab.offsetHeight + "px");
  }

  pinTab();
  window.addEventListener("resize", pinTab);
  if (tab && window.ResizeObserver) new ResizeObserver(pinTab).observe(tab);

  var bar = document.querySelector(".top");

  function pinTop() {
    if (!bar) return;
    document.documentElement.style.setProperty("--top", bar.offsetHeight + "px");
    var hero = document.querySelector(".hero");
    if (!hero) {
      bar.classList.add("is-solid");
      return;
    }
    bar.classList.toggle("is-solid", window.scrollY > 8);
  }

  pinTop();
  window.addEventListener("scroll", pinTop, { passive: true });
  window.addEventListener("resize", pinTop);

  var button = document.querySelector(".nav-toggle");
  var nav = document.getElementById("nav");
  if (!button || !nav) return;

  function close() {
    nav.classList.remove("is-open");
    button.setAttribute("aria-expanded", "false");
  }

  button.addEventListener("click", function () {
    var open = nav.classList.toggle("is-open");
    button.setAttribute("aria-expanded", open ? "true" : "false");
  });

  nav.addEventListener("click", function (event) {
    if (event.target.closest("a")) close();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") close();
  });
})();
