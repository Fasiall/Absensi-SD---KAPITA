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

  // Show/Hide password toggle
  document.querySelectorAll("[data-toggle-password]").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      const targetId = btn.getAttribute("data-toggle-password") || "password";
      const input = document.getElementById(targetId);
      if (!input) return;

      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";

      const eyeShow = btn.querySelector(".eye-show");
      const eyeHide = btn.querySelector(".eye-hide");
      if (eyeShow && eyeHide) {
        eyeShow.style.display = isPassword ? "none" : "inline-flex";
        eyeHide.style.display = isPassword ? "inline-flex" : "none";
      }

      const label = isPassword ? "Sembunyikan password" : "Tampilkan password";
      btn.setAttribute("aria-label", label);
      btn.setAttribute("title", label);
      input.focus();
    });
  });

  // Clear field error on input/modification
  ["input", "change"].forEach(function (eventType) {
    document.querySelectorAll(".field input, .field select, .field textarea").forEach(function (input) {
      input.addEventListener(eventType, function () {
        if (input.classList.contains("is-invalid")) {
          input.classList.remove("is-invalid");
        }
        const field = input.closest(".field");
        if (field) {
          field.classList.remove("has-error");
          const errorMsg = field.querySelector(".field-error");
          if (errorMsg) {
            errorMsg.style.display = "none";
          }
        }
        const flashDanger = document.querySelector(".flash-danger");
        if (flashDanger) {
          flashDanger.style.display = "none";
        }
      });
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
