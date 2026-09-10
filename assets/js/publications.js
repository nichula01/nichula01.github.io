/* Nichula S. Wasalathilaka — publications page behaviour.
 * Vanilla JS only. No build step, no dependencies.
 *
 * Two jobs, both progressive enhancement:
 *
 *   1. The research-area navigation is plain anchors in the markup, so it
 *      already scrolls and already updates the URL with JavaScript off. This
 *      file only marks which section the reader is currently inside, using an
 *      IntersectionObserver rather than a scroll handler.
 *
 *   2. Sorting genuinely needs script, so its control ships hidden and is
 *      revealed here. Each research section sorts on its own — the three
 *      sections are never merged into one sequence.
 *
 * Nothing here hides a publication. There is no filtering on this page.
 */
(function () {
  "use strict";

  var nav = document.querySelector(".pubs-nav");
  var sectionEls = Array.prototype.slice.call(
    document.querySelectorAll(".pub-section")
  );

  /* ---------------------------------------------------------------- sorting */

  var sortWrap = document.querySelector("[data-pub-sort-wrap]");
  var sort = document.querySelector("[data-pub-sort]");
  var lists = Array.prototype.slice.call(
    document.querySelectorAll("[data-pub-list]")
  );

  if (sort && lists.length) {
    // The markup order is the repository's own ordering. Keep it as the
    // tie-break within a year rather than inventing a finer chronology.
    lists.forEach(function (list) {
      Array.prototype.slice.call(list.children).forEach(function (item, index) {
        item.dataset.order = String(index);
      });
    });

    var applySort = function () {
      var newestFirst = sort.value !== "oldest";

      lists.forEach(function (list) {
        Array.prototype.slice
          .call(list.children)
          .sort(function (a, b) {
            var yearA = Number(a.dataset.year);
            var yearB = Number(b.dataset.year);

            if (yearA !== yearB) {
              return newestFirst ? yearB - yearA : yearA - yearB;
            }

            return Number(a.dataset.order) - Number(b.dataset.order);
          })
          .forEach(function (item) {
            // Re-appending in order is enough; nothing is added or removed.
            list.appendChild(item);
          });
      });
    };

    sort.addEventListener("change", applySort);
    if (sortWrap) {
      sortWrap.hidden = false;
    }
    applySort();
  }

  /* ------------------------------------------------- active section marking */

  if (!nav || !sectionEls.length) {
    return;
  }

  var links = Array.prototype.slice.call(
    nav.querySelectorAll("[data-section-link]")
  );

  if (!links.length) {
    return;
  }

  function setActive(name) {
    links.forEach(function (link) {
      if (link.dataset.sectionLink === name) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  var headerEl = document.querySelector(".site-header");

  function headerHeight() {
    return headerEl ? Math.round(headerEl.getBoundingClientRect().height) : 65;
  }

  /* The section the reader is in is the last one whose heading has passed a
     reading line just below the sticky header. Above the first heading nothing
     has passed it, which is exactly the "All" state — and it is also where the
     All control lands, since that scrolls to the top of the archive rather
     than to the first section. */
  function currentSection() {
    var line = headerHeight() + 40;
    var name = "all";

    sectionEls.forEach(function (el) {
      if (el.getBoundingClientRect().top <= line) {
        name = el.id;
      }
    });

    /* The last section is short enough that the page can run out of scroll
       before its heading ever reaches the line. Reaching the bottom means
       being in it. */
    var atBottom =
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 2;

    if (atBottom) {
      name = sectionEls[sectionEls.length - 1].id;
    }

    return name;
  }

  function sync() {
    setActive(currentSection());
  }

  /* The observer is only the trigger — it fires when a section boundary
     crosses the band, and the geometry above then gives the exact answer. No
     scroll handler, and no polling. */
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(sync, {
      rootMargin: "-" + (headerHeight() + 40) + "px 0px -55% 0px",
      threshold: 0,
    });

    sectionEls.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* The observer's last callback lands while a smooth scroll is still moving,
     so the resting position has to be read once the scroll actually stops —
     otherwise a jump to a section settles on whichever one the animation was
     passing through. This also catches the far bottom of the page, where no
     section boundary crosses the band at all. */
  if ("onscrollend" in window) {
    window.addEventListener("scrollend", sync);
  } else {
    var settle;
    window.addEventListener(
      "scroll",
      function () {
        window.clearTimeout(settle);
        settle = window.setTimeout(sync, 120);
      },
      { passive: true }
    );
  }

  /* A click marks its target immediately, so the button responds even before
     the smooth scroll arrives. The browser handles the scrolling and the
     history entry itself. */
  links.forEach(function (link) {
    link.addEventListener("click", function () {
      setActive(link.dataset.sectionLink);
    });
  });

  /* Back/forward between #medical-ai and #remote-sensing changes the hash
     without a scroll that the observer would otherwise have to infer. */
  window.addEventListener("hashchange", function () {
    var wanted = window.location.hash.replace("#", "");
    if (!wanted) {
      return;
    }
    var match = links.filter(function (link) {
      return link.dataset.sectionLink === wanted;
    })[0];
    if (match) {
      setActive(wanted);
    } else if (wanted === "publication-list") {
      setActive("all");
    }
  });
})();
