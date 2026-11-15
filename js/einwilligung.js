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
  }

  function initMap() {
    var live = document.getElementById("karte");
    if (!live || map || typeof L === "undefined") return;
    var box = document.querySelector("[data-map-fallback]");
    var note = document.querySelector("[data-map-attrib]");
    if (box) box.hidden = true;
    if (note) note.hidden = true;
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
    setTimeout(function () {
      if (map) map.invalidateSize();
    }, 50);
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

  function showBar() {
    if (document.querySelector(".consent")) return;
    var bar = document.createElement("div");
    bar.className = "consent";
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", "Einwilligung für die Karte");
    bar.innerHTML = '<div class="wrap consent-inner"><p>Für die bewegliche Karte verbindet sich Ihr Browser mit OpenStreetMap. <a href="' + root + 'datenschutz/">Datenschutz</a></p><div class="consent-actions"><button type="button" class="consent-btn" data-consent="nein">Ablehnen</button><button type="button" class="consent-btn" data-consent="ja">Akzeptieren</button></div></div>';
    document.body.appendChild(bar);
    bar.addEventListener("click", function (event) {
      var button = event.target.closest ? event.target.closest("[data-consent]") : null;
      if (!button) return;
      apply(button.getAttribute("data-consent"));
    });
  }

  document.addEventListener("click", function (event) {
    var trigger = event.target.closest ? event.target.closest("[data-cookie-settings]") : null;
    if (!trigger) return;
    event.preventDefault();
    showBar();
    var first = document.querySelector(".consent button");
    if (first) first.focus();
  });

  window.addEventListener("resize", function () {
    if (map) map.invalidateSize();
  });

  var saved = read();
  if (saved === "ja") {
    if (document.getElementById("karte")) ensureLeaflet(initMap);
  } else if (saved === "nein") {
    showFallback();
  } else {
    showFallback();
    showBar();
  }
})();
