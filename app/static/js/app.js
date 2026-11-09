(function () {
  "use strict";

  const topbar = document.getElementById("topbar");
  const navToggle = document.querySelector("[data-nav-toggle]");

  if (topbar && navToggle) {
    const closeNav = () => {
      topbar.classList.remove("nav-open");
      navToggle.setAttribute("aria-expanded", "false");
    };

    navToggle.addEventListener("click", function () {
      const isOpen = topbar.classList.toggle("nav-open");
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    document.addEventListener("click", function (event) {
      if (!topbar.contains(event.target)) {
        closeNav();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeNav();
      }
    });
  }

  document.addEventListener("click", function (event) {
    const dismiss = event.target.closest("[data-dismiss-flash]");
    if (dismiss) {
      const flash = dismiss.closest(".flash");
      if (flash) {
        flash.remove();
      }
    }
  });

  document.addEventListener("click", function (event) {
    const trigger = event.target.closest("[data-confirm]");
    if (!trigger) {
      return;
    }
    const message = trigger.getAttribute("data-confirm");
    if (message && !window.confirm(message)) {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  document.querySelectorAll("form[data-loading]").forEach(function (form) {
    form.addEventListener("submit", function () {
      const button = form.querySelector('button[type="submit"]');
      if (button && !button.classList.contains("is-loading")) {
        button.classList.add("is-loading");
        button.disabled = true;
      }
    });
  });

  document.querySelectorAll("[data-autosubmit]").forEach(function (field) {
    field.addEventListener("change", function () {
      const form = field.closest("form");
      if (!form) {
        return;
      }
      if (typeof form.requestSubmit === "function") {
        form.requestSubmit();
      } else {
        form.submit();
      }
    });
  });

  document.querySelectorAll('input[type="file"]').forEach(function (input) {
    input.addEventListener("change", function () {
      const label = input.closest(".file-drop");
      if (!label || !input.files || !input.files.length) {
        return;
      }
      const title = label.querySelector("strong");
      if (title) {
        title.textContent = input.files[0].name;
      }
    });
  });

  if (
    "serviceWorker" in navigator &&
    (window.location.protocol === "https:" || window.location.hostname === "localhost")
  ) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("/sw.js").catch(function () {
        /* PWA opsional; abaikan jika gagal. */
      });
    });
  }
})();
