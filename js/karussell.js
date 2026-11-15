(function () {
  var root = document.querySelector("[data-karussell]");
  if (!root) return;
  var media = root.querySelector("[data-slides]");
  var slides = [].slice.call(root.querySelectorAll(".slide"));
  var dots = root.querySelector(".slide-dots");
  var caption = document.getElementById("slide-kicker");
  var goLink = root.querySelector("[data-slide-go]");
  var pauseBtn = root.querySelector("[data-pause]");
  if (!slides.length || !dots || !caption || !goLink) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var index = 0;
  var timer = 0;
  var paused = reduce;
  var hover = false;
  var inside = false;
  var holdTimer = 0;

  function load(slide) {
    if (!slide) return;
    var img = slide.querySelector("img");
    var src = img && img.getAttribute("data-src");
    if (!src) return;
    img.src = src;
    img.removeAttribute("data-src");
  }

  function label(slide, i) {
    return "Folie " + (i + 1) + " von " + slides.length + ": " + slide.getAttribute("data-title");
  }

  slides.forEach(function (slide, i) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "slide-dot";
    button.setAttribute("aria-label", label(slide, i));
    button.addEventListener("click", function () { show(i, true); });
    dots.appendChild(button);
  });

  function paint() {
    var slide = slides[index];
    caption.textContent = slide.getAttribute("data-title");
    goLink.textContent = slide.getAttribute("data-cta");
    goLink.setAttribute("href", slide.getAttribute("data-href"));
    [].forEach.call(dots.children, function (button, i) {
      if (i === index) button.setAttribute("aria-current", "true");
      else button.removeAttribute("aria-current");
    });
    if (pauseBtn) {
      pauseBtn.setAttribute("aria-pressed", paused ? "true" : "false");
      pauseBtn.setAttribute("aria-label", paused ? "Automatischen Wechsel starten" : "Automatischen Wechsel anhalten");
      var pauseIcon = pauseBtn.querySelector(".icon-pause");
      var playIcon = pauseBtn.querySelector(".icon-play");
      if (pauseIcon) pauseIcon.hidden = paused;
      if (playIcon) playIcon.hidden = !paused;
    }
  }

  function show(next, fromUser) {
    var incoming = (next + slides.length) % slides.length;
    if (incoming === index && slides[index].classList.contains("is-on")) {
      if (fromUser) arm();
      return;
    }
    var outgoing = slides[index];
    index = incoming;
    var current = slides[index];
    load(current);
    load(slides[(index + 1) % slides.length]);
    slides.forEach(function (slide, i) {
      var on = i === index;
      slide.classList.toggle("is-on", on);
      slide.setAttribute("aria-hidden", on ? "false" : "true");
      if (!on) slide.classList.remove("is-hold");
    });
    if (outgoing && outgoing !== current) {
      outgoing.classList.add("is-hold");
      window.clearTimeout(holdTimer);
      holdTimer = window.setTimeout(function () { outgoing.classList.remove("is-hold"); }, reduce ? 0 : 950);
    }
    if (media) media.appendChild(current);
    paint();
    if (fromUser) arm();
  }

  function step(direction) { show(index + direction, true); }

  function playing() { return !reduce && !paused && !hover && !inside; }

  function arm() {
    window.clearInterval(timer);
    if (!playing()) return;
    timer = window.setInterval(function () { show(index + 1, false); }, 5000);
  }

  root.querySelectorAll("[data-step]").forEach(function (button) {
    button.addEventListener("click", function () { step(Number(button.getAttribute("data-step"))); });
  });
  if (pauseBtn && !reduce) {
    pauseBtn.addEventListener("click", function () {
      paused = !paused;
      paint();
      arm();
    });
  }
  if (reduce && pauseBtn) pauseBtn.hidden = true;

  root.addEventListener("mouseenter", function () { hover = true; arm(); });
  root.addEventListener("mouseleave", function () { hover = false; arm(); });
  root.addEventListener("focusin", function () { inside = true; arm(); });
  root.addEventListener("focusout", function (event) {
    if (!root.contains(event.relatedTarget)) {
      inside = false;
      arm();
    }
  });
  var bar = root.querySelector(".slide-bar");
  if (bar) {
    bar.addEventListener("keydown", function (event) {
      if (event.key === "ArrowRight") { event.preventDefault(); step(1); }
      else if (event.key === "ArrowLeft") { event.preventDefault(); step(-1); }
    });
  }

  var startX = 0;
  var startY = 0;
  var tracking = false;
  root.addEventListener("touchstart", function (event) {
    if (event.touches.length !== 1) return;
    startX = event.touches[0].clientX;
    startY = event.touches[0].clientY;
    tracking = true;
  }, { passive: true });
  root.addEventListener("touchend", function (event) {
    if (!tracking) return;
    tracking = false;
    var touch = event.changedTouches[0];
    var dx = touch.clientX - startX;
    var dy = touch.clientY - startY;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
    step(dx < 0 ? 1 : -1);
  }, { passive: true });

  load(slides[1]);
  paint();
  arm();
})();
