(function () {
  var root = document.querySelector("[data-dia]");
  if (!root) return;
  var media = root.querySelector(".hero-media");
  var first = media && media.querySelector("picture");
  if (!first) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduce.matches) return;

  var rest = ["zeichen", "zaun", "baustelle", "anhaenger"];
  var widths = [768, 1280, 1920, 2560];
  var frames = [first];
  var index = 0;
  var timer = 0;
  var hold = 6000;
  var fade = 1250;

  function srcset(id, ext) {
    return widths.map(function (w) {
      return "images/hero/" + id + "-" + w + "." + ext + " " + w + "w";
    }).join(", ");
  }

  function frame(id) {
    var picture = document.createElement("picture");
    picture.setAttribute("aria-hidden", "true");
    var avif = document.createElement("source");
    avif.type = "image/avif";
    avif.sizes = "100vw";
    avif.srcset = srcset(id, "avif");
    var webp = document.createElement("source");
    webp.type = "image/webp";
    webp.sizes = "100vw";
    webp.srcset = srcset(id, "webp");
    var img = document.createElement("img");
    img.alt = "";
    img.width = 2560;
    img.height = 1706;
    img.decoding = "async";
    img.src = "images/hero/" + id + "-1280.webp";
    picture.appendChild(avif);
    picture.appendChild(webp);
    picture.appendChild(img);
    return picture;
  }

  function show(next) {
    var current = frames[index];
    var target = frames[next];
    if (!target || target === current) return;
    target.classList.add("is-fade");
    void target.offsetWidth;
    target.classList.add("is-on");
    window.setTimeout(function () {
      if (current !== target) current.classList.remove("is-on");
    }, fade);
    index = next;
  }

  function tick() {
    if (document.hidden) return;
    show((index + 1) % frames.length);
  }

  function arm() {
    window.clearInterval(timer);
    timer = window.setInterval(tick, hold);
  }

  function whenReady(picture, done) {
    var img = picture.querySelector("img");
    if (img.complete && img.naturalWidth) done();
    else img.addEventListener("load", done, { once: true });
  }

  function boot() {
    rest.forEach(function (id) {
      var picture = frame(id);
      media.appendChild(picture);
      frames.push(picture);
    });
    var started = false;
    function begin() {
      if (started) return;
      started = true;
      tick();
      arm();
    }
    whenReady(frames[1], function () { window.setTimeout(begin, 1800); });
    window.setTimeout(begin, 8000);
  }

  function later() {
    window.setTimeout(boot, 4000);
  }

  if (document.readyState === "complete") later();
  else window.addEventListener("load", later);

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      window.clearInterval(timer);
      timer = 0;
      return;
    }
    if (frames.length > 1) arm();
  });

  reduce.addEventListener("change", function () {
    if (!reduce.matches) return;
    window.clearInterval(timer);
    frames.forEach(function (picture, i) {
      picture.classList.toggle("is-on", i === 0);
      if (i > 0) picture.remove();
    });
    frames = [first];
    index = 0;
  });
})();
