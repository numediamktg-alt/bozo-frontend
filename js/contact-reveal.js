/* ThisOldHippie contact reveal v1.0.0
 * The contact address is never in the page. A "Show email" button runs a
 * Cloudflare Turnstile human check; the toh-contact Worker verifies it and
 * returns the address, which then replaces the button as a mailto link.
 * Markup: <button type="button" class="toh-email-btn" data-toh-email>Show email</button>
 */
(function () {
  var SITE_KEY = "0x4AAAAAAFMLUdNOERS8SbkA";
  var ENDPOINT = "https://toh-contact.chuck-3ba.workers.dev/reveal";
  var TS_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

  var style = document.createElement("style");
  style.textContent =
    ".toh-email-btn{background:none;border:0;padding:0;margin:0;font:inherit;color:inherit;" +
    "text-decoration:underline;cursor:pointer}" +
    ".toh-email-btn[disabled]{cursor:wait;text-decoration:none}" +
    ".toh-ts{display:flex;justify-content:center;margin:8px 0}";
  document.head.appendChild(style);

  var tsLoading = null;
  function loadTurnstile() {
    if (window.turnstile) return Promise.resolve();
    if (tsLoading) return tsLoading;
    tsLoading = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = TS_SRC;
      s.async = true;
      s.onload = function () { window.turnstile ? resolve() : reject(new Error("turnstile missing")); };
      s.onerror = function () { tsLoading = null; reject(new Error("turnstile load failed")); };
      document.head.appendChild(s);
    });
    return tsLoading;
  }

  function reveal(btn) {
    if (btn.disabled) return;
    var color = window.getComputedStyle(btn).color;
    btn.disabled = true;
    btn.textContent = "Checking...";
    var holder = document.createElement("span");
    holder.className = "toh-ts";
    btn.parentNode.insertBefore(holder, btn.nextSibling);
    var widgetId = null;

    function cleanup() {
      try { if (widgetId !== null && window.turnstile) window.turnstile.remove(widgetId); } catch (e) {}
      if (holder.parentNode) holder.parentNode.removeChild(holder);
    }
    function fail() {
      cleanup();
      btn.disabled = false;
      btn.textContent = "Try again";
    }

    loadTurnstile().then(function () {
      widgetId = window.turnstile.render(holder, {
        sitekey: SITE_KEY,
        action: "contact-reveal",
        appearance: "interaction-only",
        callback: function (token) {
          fetch(ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: token })
          })
            .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status)); })
            .then(function (d) {
              if (!d || !d.email) throw new Error("no address");
              var a = document.createElement("a");
              a.href = "mailto:" + d.email;
              a.textContent = d.email;
              a.style.color = color;
              cleanup();
              btn.parentNode.replaceChild(a, btn);
            })
            .catch(fail);
        },
        "error-callback": fail,
        "expired-callback": fail,
        "timeout-callback": fail
      });
    }).catch(fail);
  }

  function bind() {
    var btns = document.querySelectorAll("[data-toh-email]");
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener("click", function (ev) { reveal(ev.currentTarget); });
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();
})();
