(function () {
  var KEY = "amk-karte";
  var root = document.currentScript.src.replace(/js\/einwilligung\.js(?:\?.*)?$/, "");
  var map = null;
  var waiting = false;

  function read() {
    try {
      return localStorage.getItem(KEY);
    } catch (error) {
      return null;
    }
  }

  function write(value) {
    try {
      localStorage.setItem(KEY, value);
    } catch (error) {}
  }

  function showFallback() {
    var box = document.querySelector("[data-map-fallback]");
    var live = document.getElementById("karte");
    var note = document.querySelector("[data-map-attrib]");
    if (map) {
      map.remove();
      map = null;
    }
    if (live) {
      live.hidden = true;
      live.innerHTML = "";
    }
    if (box) box.hidden = false;
    if (note) note.hidden = false;
    var closeBtn = document.querySelector("[data-map-close]");
    var legal = document.querySelector("[data-map-legal]");
    if (closeBtn) closeBtn.hidden = true;
    if (legal) legal.hidden = false;
  }

  function initMap() {
    var live = document.getElementById("karte");
    if (!live || map || typeof L === "undefined") return;
    var box = document.querySelector("[data-map-fallback]");
    var note = document.querySelector("[data-map-attrib]");
    if (box) box.hidden = true;
    if (note) note.hidden = true;
    var closeBtn = document.querySelector("[data-map-close]");
    var legal = document.querySelector("[data-map-legal]");
    if (closeBtn) closeBtn.hidden = false;
    if (legal) legal.hidden = true;
    live.hidden = false;
    map = L.map(live, {
      scrollWheelZoom: true,
      wheelPxPerZoomLevel: 80,
      touchZoom: true,
      dragging: true,
      tap: true,
      zoomControl: true,
      minZoom: 10,
      maxZoom: 19
    }).setView([48.9541035, 10.6229489], 16);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · <a href="https://www.openstreetmap.org/fixthemap">Hinweis zur Karte</a>'
    }).addTo(map);
    L.marker([48.9541035, 10.6229489], {
      icon: L.divIcon({ className: "leaflet-div-icon map-pin", iconSize: [18, 18], iconAnchor: [9, 9], html: "" }),
      keyboard: false,
      alt: "AMK Engelhardt, Oberer Kesselweg 2, 86744 Hainsfarth"
    }).addTo(map).bindPopup("AMK Engelhardt<br>Oberer Kesselweg 2<br>86744 Hainsfarth").openPopup();
    bindPinch(map);
    setTimeout(function () {
      if (map) map.invalidateSize();
    }, 50);
  }

  function bindPinch(plan) {
    var el = plan.getContainer();
    var token = {};
    el._amkPinch = token;
    var start = null;
    var snap = plan.options.zoomSnap;
    function alive() {
      return el._amkPinch === token && plan.getContainer();
    }
    el.addEventListener("gesturestart", function (event) {
      if (!alive()) return;
      event.preventDefault();
      start = plan.getZoom();
      if (plan.touchZoom) plan.touchZoom.disable();
    }, { passive: false });
    el.addEventListener("gesturechange", function (event) {
      if (!alive()) return;
      event.preventDefault();
      if (start == null || !event.scale) return;
      plan.options.zoomSnap = 0;
      plan.setZoom(start + Math.log(event.scale) / Math.LN2, { animate: false });
    }, { passive: false });
    el.addEventListener("gestureend", function (event) {
      if (!alive()) return;
      event.preventDefault();
      plan.options.zoomSnap = snap;
      start = null;
      if (plan.touchZoom) plan.touchZoom.enable();
    }, { passive: false });
  }

  function releaseMap() {
    var nodes = document.querySelectorAll(".leaflet-pane, .leaflet-tile-container");
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].style.webkitTransform = "none";
      nodes[i].style.transform = "none";
    }
    var frame = document.querySelector(".map-frame");
    if (frame) frame.style.visibility = "hidden";
    if (map) {
      map.remove();
      map = null;
    }
  }

  function ensureLeaflet(done) {
    if (typeof L !== "undefined") {
      done();
      return;
    }
    if (waiting) {
      var timer = setInterval(function () {
        if (typeof L !== "undefined") {
          clearInterval(timer);
          done();
        }
      }, 40);
      return;
    }
    waiting = true;
    var css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = root + "assets/leaflet/leaflet.css";
    document.head.appendChild(css);
    var js = document.createElement("script");
    js.src = root + "assets/leaflet/leaflet.js";
    js.onload = done;
    document.body.appendChild(js);
  }

  function hideBar() {
    var bar = document.querySelector(".consent");
    if (bar) bar.remove();
  }

  function apply(choice) {
    write(choice);
    hideBar();
    if (!document.getElementById("karte")) return;
    if (choice === "ja") ensureLeaflet(initMap);
    else showFallback();
  }

  document.addEventListener("click", function (event) {
    var load = event.target.closest ? event.target.closest("[data-map-load]") : null;
    if (load) {
      event.preventDefault();
      apply("ja");
      return;
    }
    var close = event.target.closest ? event.target.closest("[data-map-close]") : null;
    if (!close) return;
    event.preventDefault();
    apply("nein");
  });

  window.addEventListener("resize", function () {
    if (map) map.invalidateSize();
  });

  var leftPage = false;
  window.addEventListener("pagehide", function () {
    leftPage = true;
    releaseMap();
  });
  window.addEventListener("pageshow", function (event) {
    if (!leftPage && !event.persisted) return;
    leftPage = false;
    var frame = document.querySelector(".map-frame");
    if (frame) frame.style.visibility = "";
    if (!map && document.getElementById("karte") && read() === "ja") ensureLeaflet(initMap);
  });

  if (read() === "ja" && document.getElementById("karte")) ensureLeaflet(initMap);
  else showFallback();
})();
