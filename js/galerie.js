(function () {
  /* Bilder und Zeichnungen einer Produktseite. Weitere Dateien kommen über
     bilder und zeichnungen in data/katalog.json, siehe docs/kauf.md. */
  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function scriptRoot() {
    var nodes = document.getElementsByTagName("script");
    var i;
    for (i = 0; i < nodes.length; i++) {
      var src = nodes[i].getAttribute("src") || "";
      var at = src.indexOf("js/galerie.js");
      if (at >= 0) return src.slice(0, at);
    }
    return "";
  }

  function slugFromPath() {
    var parts = location.pathname.split("/").filter(Boolean);
    var at = parts.indexOf("produkt");
    if (at >= 0 && parts[at + 1]) return decodeURIComponent(parts[at + 1]);
    return "";
  }

  function asSlide(item, product) {
    if (!item) return null;
    if (typeof item === "string") item = { src: item };
    if (!item.src) return null;
    return {
      src: item.src,
      small: item.small || "",
      w: item.w || item.width || (product && product.width) || 1200,
      h: item.h || item.height || (product && product.height) || 900,
      alt: item.alt || (product && (product.alt || product.name)) || "",
      art: item.art === "zeichnung" ? "zeichnung" : "bild"
    };
  }

  function slidesFrom(product) {
    if (!product) return [];
    var slides = [];
    var listed = Array.isArray(product.bilder) && product.bilder.length ? product.bilder : null;
    if (listed) {
      listed.forEach(function (item) {
        var slide = asSlide(item, product);
        if (slide) slides.push(slide);
      });
    } else if (product.bild) {
      var first = asSlide({
        src: product.bild,
        small: product.bildSmall,
        w: product.width,
        h: product.height,
        alt: product.alt || product.name
      }, product);
      if (first) slides.push(first);
    }
    (Array.isArray(product.zeichnungen) ? product.zeichnungen : []).forEach(function (item) {
      var drawing = asSlide(item, product);
      if (!drawing) return;
      drawing.art = "zeichnung";
      slides.push(drawing);
    });
    return slides;
  }

  function srcOf(slide, root) {
    var src = slide.src || "";
    if (/^(https?:|data:|\/|\.\.)/.test(src)) return src;
    return root + src;
  }

  function imgTag(slide, root, thumb) {
    var src = srcOf(slide, root);
    var small = slide.small && slide.small !== slide.src ? srcOf({ src: slide.small }, root) : "";
    var set = !thumb && small ? ' srcset="' + esc(small) + " 640w, " + esc(src) + ' 1200w" sizes="100vw"' : "";
    return '<img draggable="false" src="' + esc(src) + '"' + set + ' alt="' + esc(thumb ? "" : slide.alt) + '" width="' + esc(slide.w) + '" height="' + esc(slide.h) + '" decoding="async">';
  }

  function chevron(dir) {
    var points = dir < 0 ? "14 5 8 12 14 19" : "10 5 16 12 10 19";
    return '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="' + points + '"/></svg>';
  }

  function mount(figure, slides, root) {
    if (!figure || !slides || !slides.length) return;
    var index = 0;
    var many = slides.length > 1;
    figure.dataset.galerie = "1";
    figure.innerHTML = "";
    var box = document.createElement("div");
    box.className = "galerie";
    box.setAttribute("data-count", String(slides.length));
    box.innerHTML =
      '<div class="galerie-stage">' +
      '<button type="button" class="galerie-nav galerie-prev" aria-label="Vorheriges Bild">' + chevron(-1) + "</button>" +
      '<button type="button" class="galerie-open">' + imgTag(slides[0], root, false) + "</button>" +
      '<button type="button" class="galerie-nav galerie-next" aria-label="Nächstes Bild">' + chevron(1) + "</button>" +
      '<p class="galerie-count"></p>' +
      "</div>" +
      '<div class="galerie-thumbs" aria-label="Bilder"></div>';
    figure.appendChild(box);

    var openBtn = box.querySelector(".galerie-open");
    var count = box.querySelector(".galerie-count");
    var thumbs = box.querySelector(".galerie-thumbs");
    var mark = document.createElement("p");
    mark.className = "galerie-art";
    box.querySelector(".galerie-stage").appendChild(mark);

    slides.forEach(function (slide, at) {
      var button = document.createElement("button");
      button.type = "button";
      button.innerHTML = imgTag(slide, root, true);
      button.addEventListener("click", function () { show(at); });
      thumbs.appendChild(button);
    });

    var licht = document.createElement("div");
    licht.className = "galerie-licht";
    licht.hidden = true;
    licht.innerHTML =
      '<button type="button" class="galerie-close" data-galerie-close aria-label="Schließen">' +
      '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M6 6l12 12M18 6 6 18"/></svg></button>' +
      '<button type="button" class="galerie-nav galerie-prev" aria-label="Vorheriges Bild">' + chevron(-1) + "</button>" +
      '<button type="button" class="galerie-frame">' + imgTag(slides[0], root, false) + "</button>" +
      '<button type="button" class="galerie-nav galerie-next" aria-label="Nächstes Bild">' + chevron(1) + "</button>" +
      '<div class="galerie-thumbs" aria-label="Bilder"></div>';
    licht.setAttribute("data-count", String(slides.length));
    document.body.appendChild(licht);
    var lightThumbs = licht.querySelector(".galerie-thumbs");
    slides.forEach(function (slide, at) {
      var button = document.createElement("button");
      button.type = "button";
      button.innerHTML = imgTag(slide, root, true);
      button.addEventListener("click", function (event) {
        event.stopPropagation();
        show(at);
      });
      lightThumbs.appendChild(button);
    });

    function show(next) {
      var len = slides.length;
      index = ((next % len) + len) % len;
      var slide = slides[index];
      openBtn.innerHTML = imgTag(slide, root, false);
      openBtn.setAttribute("aria-label", (many ? "Bild " + (index + 1) + " von " + len + ", " : "") + (slide.alt || "Bild") + " vergrößern");
      licht.querySelector(".galerie-frame").innerHTML = imgTag(slide, root, false);
      count.textContent = many ? (index + 1) + " / " + len : "";
      mark.textContent = slide.art === "zeichnung" ? "Zeichnung" : "";
      mark.hidden = slide.art !== "zeichnung";
      box.querySelectorAll(".galerie-thumbs button").forEach(function (button, at) {
        if (at === index) button.setAttribute("aria-current", "true");
        else button.removeAttribute("aria-current");
        button.setAttribute("aria-label", slides[at].alt || "Bild " + (at + 1));
      });
      lightThumbs.querySelectorAll("button").forEach(function (button, at) {
        if (at === index) button.setAttribute("aria-current", "true");
        else button.removeAttribute("aria-current");
        button.setAttribute("aria-label", slides[at].alt || "Bild " + (at + 1));
      });
    }

    function openLight() {
      licht.hidden = false;
      document.body.classList.add("galerie-open");
      var close = licht.querySelector(".galerie-close");
      if (close) close.focus();
    }

    function closeLight() {
      if (licht.hidden) return;
      licht.hidden = true;
      document.body.classList.remove("galerie-open");
      openBtn.focus();
    }

    function bindSwipe(node, onSwipe, onTap) {
      var startX = 0;
      var startY = 0;
      var active = false;
      var dragged = false;
      var origin = null;
      node.addEventListener("dragstart", function (event) { event.preventDefault(); });
      node.addEventListener("pointerdown", function (event) {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        if (event.target.closest && event.target.closest(".galerie-nav, .galerie-close, .galerie-thumbs")) return;
        origin = event.target;
        active = true;
        dragged = false;
        startX = event.clientX;
        startY = event.clientY;
        if (node.setPointerCapture) {
          try { node.setPointerCapture(event.pointerId); } catch (err) { /* Geste bleibt am Bild */ }
        }
      });
      node.addEventListener("pointerup", function (event) {
        if (!active) return;
        active = false;
        var dx = event.clientX - startX;
        var dy = event.clientY - startY;
        if (Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy)) {
          dragged = true;
          onSwipe(dx < 0 ? 1 : -1);
          return;
        }
        if (onTap && origin && origin.closest && origin.closest(".galerie-open, .galerie-frame")) onTap();
      });
      node.addEventListener("click", function (event) {
        if (!dragged) return;
        dragged = false;
        event.preventDefault();
        event.stopPropagation();
      }, true);
    }

    box.querySelector(".galerie-prev").addEventListener("click", function () { show(index - 1); });
    box.querySelector(".galerie-next").addEventListener("click", function () { show(index + 1); });
    licht.querySelector(".galerie-prev").addEventListener("click", function (event) {
      event.stopPropagation();
      show(index - 1);
    });
    licht.querySelector(".galerie-next").addEventListener("click", function (event) {
      event.stopPropagation();
      show(index + 1);
    });
    openBtn.addEventListener("click", openLight);
    licht.querySelector(".galerie-close").addEventListener("click", function (event) {
      event.stopPropagation();
      closeLight();
    });
    licht.addEventListener("click", function (event) {
      if (event.target === licht) closeLight();
    });
    bindSwipe(box.querySelector(".galerie-stage"), function (step) { show(index + step); }, openLight);
    bindSwipe(licht, function (step) { show(index + step); });
    document.addEventListener("keydown", function (event) {
      var lightOn = !licht.hidden;
      var inside = event.target.closest && event.target.closest(".galerie, .galerie-licht");
      if (event.key === "Escape" && lightOn) {
        event.preventDefault();
        closeLight();
        return;
      }
      if (!lightOn && !inside) return;
      if (event.target.closest && event.target.closest("input, textarea, select")) return;
      if (event.key === "ArrowRight") {
        show(index + 1);
        event.preventDefault();
      } else if (event.key === "ArrowLeft") {
        show(index - 1);
        event.preventDefault();
      }
    });
    show(0);
  }

  function slideFromFigure(figure, root) {
    var img = figure.querySelector("img");
    if (!img) return [];
    var src = img.getAttribute("src") || "";
    if (root && src.indexOf(root) === 0) src = src.slice(root.length);
    return [{
      src: src,
      small: "",
      w: img.getAttribute("width") || 1200,
      h: img.getAttribute("height") || 900,
      alt: img.getAttribute("alt") || "",
      art: "bild"
    }];
  }

  function upgrade() {
    var figure = document.querySelector("main figure.scene");
    if (!figure || figure.dataset.galerie) return;
    var root = scriptRoot();
    var slug = slugFromPath();
    var form = document.querySelector("form[data-order]");
    if (form && form.getAttribute("data-slug") && form.getAttribute("data-slug").indexOf("schild:") !== 0) {
      slug = form.getAttribute("data-slug");
    }
    fetch(root + "data/katalog.json")
      .then(function (response) { return response.json(); })
      .then(function (data) {
        var product = null;
        (Array.isArray(data) ? data : []).forEach(function (item) {
          if (item.slug === slug) product = item;
        });
        var slides = slidesFrom(product);
        if (!slides.length) slides = slideFromFigure(figure, root);
        mount(figure, slides, root);
      })
      .catch(function () {
        mount(figure, slideFromFigure(figure, root), root);
      });
  }

  window.AMK_GALERIE = { slidesFrom: slidesFrom, mount: mount };
  upgrade();
})();
