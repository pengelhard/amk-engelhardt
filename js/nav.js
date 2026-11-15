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
  }

  pinTop();
  window.addEventListener("scroll", pinTop, { passive: true });
  window.addEventListener("resize", pinTop);

  var buttons = Array.prototype.slice.call(document.querySelectorAll(".nav-toggle"));
  var button = document.querySelector(".header-bar .nav-toggle") || buttons[0];
  var menu = document.getElementById("menue");
  if (!button || !menu) return;

  var panel = menu.querySelector(".menu-panel");
  var open = false;
  var returnFocus = null;

  function focusables() {
    return Array.prototype.filter.call(panel.querySelectorAll("a[href], button:not([disabled])"), function (el) {
      return el.tabIndex >= 0;
    });
  }

  function background() {
    return [
      document.querySelector(".skip"),
      document.querySelector(".site-header"),
      document.querySelector("main"),
      document.querySelector(".site-footer"),
      document.querySelector(".tabbar")
    ];
  }

  function setInert(on) {
    background().forEach(function (node) {
      if (!node) return;
      if (on) node.setAttribute("inert", "");
      else node.removeAttribute("inert");
    });
  }

  function lock(on) {
    if (on) {
      var gap = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
      document.documentElement.style.setProperty("--menu-gap", gap + "px");
      document.documentElement.classList.add("menu-open");
      document.body.classList.add("menu-open");
      return;
    }
    document.documentElement.classList.remove("menu-open");
    document.body.classList.remove("menu-open");
    document.documentElement.style.removeProperty("--menu-gap");
  }

  function mark(on) {
    buttons.forEach(function (el) {
      el.setAttribute("aria-expanded", on ? "true" : "false");
      el.setAttribute("aria-label", on ? "Menü schließen" : "Menü öffnen");
    });
  }

  function close() {
    if (!open) return;
    open = false;
    menu.classList.remove("is-open");
    menu.setAttribute("aria-hidden", "true");
    mark(false);
    lock(false);
    setInert(false);
    if (returnFocus && returnFocus.focus) returnFocus.focus();
  }

  function show() {
    returnFocus = document.activeElement;
    open = true;
    menu.classList.add("is-open");
    menu.setAttribute("aria-hidden", "false");
    mark(true);
    lock(true);
    setInert(true);
    var closeButton = menu.querySelector(".menu-close");
    if (closeButton) closeButton.focus();
  }

  buttons.forEach(function (el) {
    el.addEventListener("click", function () {
      if (open) close();
      else show();
    });
  });

  menu.addEventListener("click", function (event) {
    if (event.target.closest("[data-menu-close]")) close();
    else if (event.target.closest("a")) close();
  });

  document.addEventListener("keydown", function (event) {
    if (!open) return;
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== "Tab" || !panel) return;
    var items = focusables();
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  window.addEventListener("resize", function () {
    if (open && button && getComputedStyle(button).display === "none") close();
  });
})();
