(function () {
  function today() {
    var date = new Date();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    return date.getFullYear() + "-" + (month < 10 ? "0" : "") + month + "-" + (day < 10 ? "0" : "") + day;
  }

  function message(input) {
    var id = input.id + "-fehler";
    var node = document.getElementById(id);
    if (node) return node;
    node = document.createElement("p");
    node.id = id;
    node.className = "field-error";
    node.hidden = true;
    var field = input.closest(".field") || input.parentNode;
    field.appendChild(node);
    return node;
  }

  function clear(input) {
    if (!input) return;
    input.removeAttribute("aria-invalid");
    var node = document.getElementById(input.id + "-fehler");
    if (!node) return;
    node.hidden = true;
    node.textContent = "";
  }

  function show(input, text) {
    var node = message(input);
    input.setAttribute("aria-invalid", "true");
    input.setAttribute("aria-describedby", node.id);
    node.textContent = text;
    node.hidden = false;
  }

  function syncMin(von, bis) {
    var start = today();
    von.min = start;
    bis.min = von.value && von.value > start ? von.value : start;
  }

  function checkPair(von, bis, quiet) {
    if (!von || !bis) return true;
    syncMin(von, bis);
    var start = today();
    var ok = true;
    var focus = null;
    clear(von);
    clear(bis);
    if (von.value && von.value < start) {
      show(von, "Liegt in der Vergangenheit.");
      ok = false;
      focus = von;
    }
    if (bis.value && von.value && bis.value < von.value) {
      show(bis, "Liegt vor dem Anfang.");
      ok = false;
      if (!focus) focus = bis;
    } else if (bis.value && !von.value && bis.value < start) {
      show(bis, "Liegt in der Vergangenheit.");
      ok = false;
      if (!focus) focus = bis;
    } else if (bis.value && von.value && bis.value < start && von.value >= start) {
      show(bis, "Liegt in der Vergangenheit.");
      ok = false;
      if (!focus) focus = bis;
    }
    if (!ok && !quiet && focus) focus.focus();
    return ok;
  }

  function bindPair(von, bis) {
    if (!von || !bis) return;
    function refresh() {
      syncMin(von, bis);
      if (von.value || bis.value) checkPair(von, bis, true);
      else {
        clear(von);
        clear(bis);
      }
    }
    von.addEventListener("change", refresh);
    von.addEventListener("input", refresh);
    bis.addEventListener("change", refresh);
    bis.addEventListener("input", refresh);
    syncMin(von, bis);
  }

  var von = document.getElementById("von");
  var bis = document.getElementById("bis");
  if (von && bis && von.type === "date" && bis.type === "date") bindPair(von, bis);
  document.querySelectorAll("form[data-order]").forEach(function (form) {
    bindPair(form.querySelector('[name="von"]'), form.querySelector('[name="bis"]'));
  });

  window.AMK_ZEIT = {
    checkPair: checkPair,
    bindPair: bindPair,
    clearPair: function (start, end) { clear(start); clear(end); }
  };
})();
