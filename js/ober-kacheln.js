(function () {
  /* Die drei Oberkacheln. Startseite, Mieten und Kaufen lesen nur diese Liste. */
  var BILDER = {
    zaun: {
      src: "images/start/kat-bauzaun.webp",
      small: "images/start/kat-bauzaun-768.webp",
      w: 1280,
      h: 720
    },
    verkehr: {
      src: "images/hero/schranke2-kachel.webp",
      w: 800,
      h: 450
    },
    anhaenger: {
      src: "images/start/kat-anhaenger.webp",
      small: "images/start/kat-anhaenger-768.webp",
      w: 1280,
      h: 720
    }
  };

  var script = document.currentScript;
  var adresse = script ? script.getAttribute("src") || "" : "";
  var prefix = adresse.replace(/js\/ober-kacheln\.js(?:\?.*)?$/, "");

  document.querySelectorAll("[data-ober]").forEach(function (node) {
    var bild = BILDER[node.getAttribute("data-ober")];
    if (!bild || node.querySelector("img")) return;
    var img = document.createElement("img");
    img.src = prefix + bild.src;
    img.width = bild.w;
    img.height = bild.h;
    img.alt = "";
    img.decoding = "async";
    img.loading = "lazy";
    if (bild.small) {
      img.srcset = prefix + bild.small + " 768w, " + prefix + bild.src + " 1280w";
      img.sizes = "(min-width: 800px) 33vw, 100vw";
    }
    node.insertBefore(img, node.firstChild);
  });
})();
