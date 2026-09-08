/* Nichula S. Wasalathilaka — publications page behaviour.
 * Vanilla JS only. No build step, no dependencies.
 *
 * Progressive enhancement: publications.html ships the complete list in the
 * markup, already in newest-first order. This file only reveals the filter
 * and sort controls and wires them up. With JavaScript off, the controls stay
 * hidden and the full archive is still there to read.
 */
(function () {
  "use strict";

  var controls = document.querySelector("[data-pub-controls]");
  var list = document.querySelector("[data-pub-list]");
  var empty = document.querySelector("[data-pub-empty]");

  if (!controls || !list) {
    return;
  }

  var filters = Array.prototype.slice.call(
    controls.querySelectorAll("[data-filter]")
  );
  var sort = controls.querySelector("[data-pub-sort]");
  var items = Array.prototype.slice.call(list.children);

  if (!filters.length || !items.length) {
    return;
  }

  // The markup order is the repository's own ordering. Keep it as the
  // tie-break within a year rather than inventing a finer chronology.
  items.forEach(function (item, index) {
    item.dataset.order = String(index);
  });

  var activeFilter = "all";

  function matches(item) {
    return activeFilter === "all" || item.dataset.category === activeFilter;
  }

  function applyFilter() {
    var shown = 0;

    items.forEach(function (item) {
      var visible = matches(item);
      item.hidden = !visible;
      if (visible) {
        shown += 1;
      }
    });

    if (empty) {
      empty.hidden = shown !== 0;
    }
  }

  function applySort() {
    var newestFirst = !sort || sort.value !== "oldest";

    items
      .slice()
      .sort(function (a, b) {
        var yearA = Number(a.dataset.year);
        var yearB = Number(b.dataset.year);

        if (yearA !== yearB) {
          return newestFirst ? yearB - yearA : yearA - yearB;
        }

        return Number(a.dataset.order) - Number(b.dataset.order);
      })
      .forEach(function (item) {
        list.appendChild(item);
      });
  }

  filters.forEach(function (button) {
    button.addEventListener("click", function () {
      activeFilter = button.dataset.filter;

      filters.forEach(function (other) {
        other.setAttribute(
          "aria-pressed",
          String(other === button)
        );
      });

      applyFilter();
    });
  });

  if (sort) {
    sort.addEventListener("change", applySort);
  }

  /* A category in the URL preselects that filter, so index.html can link
     straight to publications.html#remote-sensing. An unknown hash — including
     the #pub-… anchors used to deep-link a single entry — is left alone so the
     browser still scrolls to it. */
  function selectFromHash() {
    var wanted = window.location.hash.replace("#", "");
    if (!wanted) {
      return;
    }
    var match = filters.filter(function (button) {
      return button.dataset.filter === wanted;
    })[0];
    if (!match) {
      return;
    }
    activeFilter = wanted;
    filters.forEach(function (other) {
      other.setAttribute("aria-pressed", String(other === match));
    });
    applyFilter();
  }

  window.addEventListener("hashchange", selectFromHash);

  controls.hidden = false;
  applyFilter();
  applySort();
  selectFromHash();
})();
