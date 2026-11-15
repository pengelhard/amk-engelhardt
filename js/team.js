(function () {
  var section = document.getElementById("team");
  var img = document.getElementById("team-foto");
  if (!section || !img) return;
  var src = img.getAttribute("data-src");
  if (!src) return;
  img.addEventListener("load", function () {
    if (img.naturalWidth > 0) section.hidden = false;
  });
  img.src = src;
})();
