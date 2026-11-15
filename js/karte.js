(function () {
  var slot = document.querySelector("[data-map]");
  if (!slot) return;
  var button = slot.querySelector("[data-map-load]");
  if (!button) return;
  button.addEventListener("click", function () {
    var frame = document.createElement("iframe");
    frame.title = "Karte: Oberer Kesselweg 2, 86744 Hainsfarth";
    frame.src = slot.getAttribute("data-map");
    frame.loading = "lazy";
    frame.referrerPolicy = "no-referrer-when-downgrade";
    slot.replaceChildren(frame);
  });
})();
