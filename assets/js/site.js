/* Nichula S. Wasalathilaka — shared site behaviour.
 * Vanilla JS only. No build step, no dependencies.
 * Sole responsibility today: the responsive navigation toggle.
 */
(function () {
  "use strict";

  var toggle = document.querySelector("[data-nav-toggle]");
  var nav = document.getElementById("site-nav");

  if (!toggle || !nav) {
    return;
  }

  var mobileQuery = window.matchMedia("(max-width: 860px)");

  function setExpanded(isOpen) {
    nav.classList.toggle("is-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.querySelector("[data-nav-toggle-label]").textContent = isOpen
      ? "Close"
      : "Menu";
  }

  function close() {
    if (toggle.getAttribute("aria-expanded") === "true") {
      setExpanded(false);
    }
  }

  toggle.addEventListener("click", function () {
    setExpanded(toggle.getAttribute("aria-expanded") !== "true");
  });

  // Following an in-page link should dismiss the panel.
  nav.addEventListener("click", function (event) {
    if (event.target.closest("a")) {
      close();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      close();
      toggle.focus();
    }
  });

  // Returning to the desktop breakpoint must not leave a stale open state.
  function handleBreakpoint(event) {
    if (!event.matches) {
      close();
    }
  }

  if (typeof mobileQuery.addEventListener === "function") {
    mobileQuery.addEventListener("change", handleBreakpoint);
  } else if (typeof mobileQuery.addListener === "function") {
    mobileQuery.addListener(handleBreakpoint);
  }
})();
