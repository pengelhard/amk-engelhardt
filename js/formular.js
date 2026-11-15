(function () {
  function cfg() {
    var source = window.AMK_FORM || {};
    return {
      endpoint: String(source.endpoint || "").trim(),
      accessKey: String(source.accessKey || "").trim()
    };
  }

  function ready() {
    var current = cfg();
    return !!(current.endpoint && current.accessKey);
  }

  function openMail(href, status, text) {
    if (status) {
      status.classList.remove("is-error");
      status.textContent = text || "Ihr E-Mail-Programm öffnet sich.";
    }
    window.location.href = href;
  }

  function send(opts) {
    var status = opts.status;
    if (status) status.classList.remove("is-error");
    if (opts.honeypot) {
      window.location.href = opts.thanks;
      return;
    }
    if (!ready()) {
      openMail(opts.mailto, status);
      return;
    }
    var current = cfg();
    if (status) status.textContent = "Wird gesendet.";
    fetch(current.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        access_key: current.accessKey,
        subject: opts.subject,
        from_name: opts.name,
        email: opts.email,
        message: opts.message,
        botcheck: ""
      })
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (data) {
        if (!response.ok || data.success === false) throw new Error("send");
        if (typeof opts.onSuccess === "function") opts.onSuccess();
        window.location.href = opts.thanks;
      });
    }).catch(function () {
      if (status) status.classList.add("is-error");
      openMail(opts.mailto, status, "Der Versand hat nicht geklappt. Ihr E-Mail-Programm öffnet sich.");
    });
  }

  window.AMK_FORMULAR = { ready: ready, send: send };
})();
