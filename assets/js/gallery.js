/* Nichula S. Wasalathilaka — gallery page behaviour.
 * Vanilla JS only. No build step, no dependencies, no carousel library.
 *
 * data/gallery.json is the single source of truth: entries, their categories
 * and their images all come from it. Adding a second image to an entry's
 * "images" array is enough to turn its carousel on — nothing here is hard-coded
 * per entry.
 *
 * Structure:
 *   1. render      — entries and the category filter strip
 *   2. swiper      — one scroll-snap carousel per multi-image entry
 *   3. lightbox    — a single <dialog>, reused by every entry
 */
(function () {
  "use strict";

  var DATA_URL = "data/gallery.json";

  var grid = document.querySelector("[data-gallery-grid]");
  var filterBar = document.querySelector("[data-gallery-filters]");
  var status = document.querySelector("[data-gallery-status]");

  if (!grid) {
    return;
  }

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* The card label reads as a single item ("Poster"), while the filter reads as
     a set ("Posters"). Anything not listed falls through unchanged. */
  var SINGULAR = {
    Posters: "Poster",
    "Conference Moments": "Conference Moment",
    "Research Figures": "Research Figure",
    Talks: "Talk",
    Demos: "Demo"
  };

  var entries = [];

  /* ----------------------------------------------------------------------
     Small helpers
     ---------------------------------------------------------------------- */

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) {
      node.className = className;
    }
    if (text != null) {
      node.textContent = text;
    }
    return node;
  }

  function scrollBehavior() {
    return reduceMotion.matches ? "auto" : "smooth";
  }

  /* Metadata line: "IEEE IGARSS 2026 · Washington, D.C., USA · 9–14 August 2026",
     with any missing part simply dropped. */
  function metaLine(entry) {
    return [entry.event, entry.location, entry.date]
      .filter(Boolean)
      .join(" · ");
  }

  function linkList(links) {
    var order = [
      ["poster", "View poster"],
      ["paper", "Paper"],
      ["code", "Code"],
      ["project", "Project"],
      ["slides", "Slides"],
      ["video", "Video"]
    ];
    var out = [];
    order.forEach(function (pair) {
      var href = links && links[pair[0]];
      if (href) {
        out.push({ href: href, label: pair[1] });
      }
    });
    return out;
  }

  /* ----------------------------------------------------------------------
     1. Rendering
     ---------------------------------------------------------------------- */

  function buildImage(image, entry, index, eager) {
    var img = document.createElement("img");
    img.src = image.src;
    img.alt = image.alt || "";
    if (image.width) {
      img.width = image.width;
    }
    if (image.height) {
      img.height = image.height;
    }
    img.decoding = "async";
    if (eager) {
      img.setAttribute("fetchpriority", "high");
    } else {
      img.loading = "lazy";
    }
    img.style.objectFit = image.fit || "cover";
    if (image.position) {
      img.style.objectPosition = image.position;
    }
    /* A contained image sits on the neutral figure ground rather than white,
       so a landscape poster does not float in an unbounded frame. */
    if ((image.fit || "cover") === "contain") {
      img.classList.add("is-contained");
    }
    return img;
  }

  function buildSwiper(entry, entryIndex) {
    var total = entry.images.length;
    var multi = total > 1;

    var swipe = el("div", "gswipe");
    swipe.style.setProperty("--frame", entry.frame || "3 / 2");
    if (multi) {
      swipe.dataset.swipe = "";
    }

    var track = el("ul", "gswipe__track");
    track.dataset.swipeTrack = "";
    if (multi) {
      track.tabIndex = 0;
      track.setAttribute("aria-roledescription", "carousel");
      track.setAttribute("aria-label", entry.title + ", " + total + " images");
    }

    entry.images.forEach(function (image, i) {
      var slide = el("li", "gswipe__slide");
      if (multi) {
        slide.setAttribute("role", "group");
        slide.setAttribute("aria-roledescription", "slide");
        slide.setAttribute("aria-label", i + 1 + " of " + total);
      }

      var open = el("button", "gswipe__open");
      open.type = "button";
      open.dataset.open = String(i);
      open.dataset.entry = String(entryIndex);
      open.appendChild(buildImage(image, entry, i, entryIndex === 0 && i === 0));

      var label = el("span", "visually-hidden",
        multi
          ? "Open image " + (i + 1) + " of " + total + " full screen"
          : "Open image full screen");
      open.appendChild(label);

      slide.appendChild(open);
      track.appendChild(slide);
    });

    swipe.appendChild(track);

    if (multi) {
      swipe.appendChild(arrow("prev", "Previous image"));
      swipe.appendChild(arrow("next", "Next image"));

      var dots = el("div", "gswipe__dots");
      dots.dataset.swipeDots = "";
      for (var i = 0; i < total; i += 1) {
        var dot = el("button", "gswipe__dot");
        dot.type = "button";
        dot.dataset.goTo = String(i);
        dot.setAttribute("aria-label", "Show image " + (i + 1) + " of " + total);
        dots.appendChild(dot);
      }
      swipe.appendChild(dots);

      var live = el("p", "visually-hidden");
      live.dataset.swipeLive = "";
      live.setAttribute("aria-live", "polite");
      swipe.appendChild(live);
    }

    return swipe;
  }

  function arrow(direction, label) {
    var button = el("button", "gswipe__arrow gswipe__arrow--" + direction);
    button.type = "button";
    button.dataset.step = direction === "prev" ? "-1" : "1";
    button.setAttribute("aria-label", label);
    button.innerHTML =
      '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="' +
      (direction === "prev" ? "M10 2L4 8l6 6" : "M6 2l6 6-6 6") +
      '" /></svg>';
    return button;
  }

  function buildEntry(entry, index) {
    var article = el("article", "gitem");
    article.id = entry.id;
    article.dataset.category = entry.category;
    if (entry.featured) {
      article.classList.add("gitem--featured");
    }

    var media = el("div", "gitem__media");
    media.appendChild(buildSwiper(entry, index));
    article.appendChild(media);

    var body = el("div", "gitem__body");
    body.appendChild(el("p", "gitem__category", SINGULAR[entry.category] || entry.category));

    var heading = el("h2", "gitem__title", entry.title);
    body.appendChild(heading);

    var meta = metaLine(entry);
    if (meta) {
      body.appendChild(el("p", "gitem__meta", meta));
    }
    if (entry.subtitle) {
      body.appendChild(el("p", "gitem__subtitle", entry.subtitle));
    }
    if (entry.caption) {
      body.appendChild(el("p", "gitem__caption", entry.caption));
    }

    var links = linkList(entry.links);
    if (links.length) {
      var list = el("p", "gitem__links");
      links.forEach(function (link) {
        var a = el("a", null, link.label);
        a.href = link.href;
        if (/^https?:/.test(link.href)) {
          a.target = "_blank";
          a.rel = "noopener noreferrer";
        }
        a.appendChild(el("span", "gitem__arrow", "↗"));
        list.appendChild(a);
      });
      body.appendChild(list);
    }

    article.appendChild(body);
    return article;
  }

  function renderFilters() {
    var categories = [];
    entries.forEach(function (entry) {
      if (entry.category && categories.indexOf(entry.category) === -1) {
        categories.push(entry.category);
      }
    });

    /* One category is not a choice, so the strip stays hidden until a second
       kind of entry exists. */
    if (categories.length < 2) {
      return;
    }

    ["All"].concat(categories).forEach(function (category, i) {
      var button = el("button", "gallery-filter", category);
      button.type = "button";
      button.dataset.filter = category;
      button.setAttribute("aria-pressed", String(i === 0));
      filterBar.appendChild(button);
    });

    filterBar.hidden = false;

    filterBar.addEventListener("click", function (event) {
      var button = event.target.closest("[data-filter]");
      if (!button) {
        return;
      }
      applyFilter(button.dataset.filter);
    });
  }

  function applyFilter(category) {
    Array.prototype.forEach.call(filterBar.children, function (button) {
      button.setAttribute("aria-pressed", String(button.dataset.filter === category));
    });

    var shown = 0;
    Array.prototype.forEach.call(grid.children, function (article) {
      var match = category === "All" || article.dataset.category === category;
      article.hidden = !match;
      if (match) {
        shown += 1;
      }
    });

    status.hidden = shown > 0;
    if (!shown) {
      status.textContent = "No gallery entries in this category yet.";
    }
  }

  /* ----------------------------------------------------------------------
     2. Card swiper — native scroll-snap, JS only for state and controls
     ---------------------------------------------------------------------- */

  function initSwiper(swipe) {
    var track = swipe.querySelector("[data-swipe-track]");
    var dots = Array.prototype.slice.call(swipe.querySelectorAll("[data-go-to]"));
    var arrows = Array.prototype.slice.call(swipe.querySelectorAll("[data-step]"));
    var live = swipe.querySelector("[data-swipe-live]");
    var total = track.children.length;
    var index = 0;
    var ticking = false;
    var settleTimer;

    function slideWidth() {
      return track.clientWidth || 1;
    }

    /* CSS scroll-snap does the work on every browser that honours it. This is
       the safety net for the case where a gesture ends between snap points and
       the track is left showing two half slides. */
    function settle() {
      var width = slideWidth();
      var target = Math.round(track.scrollLeft / width) * width;
      if (Math.abs(track.scrollLeft - target) > 2) {
        track.scrollTo({ left: target, behavior: scrollBehavior() });
      }
    }

    function goTo(next, behavior) {
      var clamped = Math.max(0, Math.min(total - 1, next));
      track.scrollTo({
        left: clamped * slideWidth(),
        behavior: behavior || scrollBehavior()
      });
    }

    function sync() {
      var next = Math.round(track.scrollLeft / slideWidth());
      if (next === index) {
        return;
      }
      index = next;
      dots.forEach(function (dot, i) {
        dot.setAttribute("aria-current", String(i === index));
      });
      arrows.forEach(function (button) {
        var step = Number(button.dataset.step);
        button.disabled = (step < 0 && index === 0) || (step > 0 && index === total - 1);
      });
      if (live) {
        live.textContent = "Image " + (index + 1) + " of " + total;
      }
    }

    track.addEventListener("scroll", function () {
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(settle, 140);
      if (ticking) {
        return;
      }
      ticking = true;
      window.requestAnimationFrame(function () {
        ticking = false;
        sync();
      });
    }, { passive: true });

    arrows.forEach(function (button) {
      button.addEventListener("click", function () {
        goTo(index + Number(button.dataset.step));
      });
    });

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        goTo(Number(dot.dataset.goTo));
      });
    });

    /* The track is focusable, so arrow keys move between slides the way they
       would in any other listbox-like control. */
    track.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(index - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(index + 1);
      }
    });

    /* Resizing changes the snap geometry; hold the current slide. */
    window.addEventListener("resize", function () {
      goTo(index, "auto");
    });

    dots.forEach(function (dot, i) {
      dot.setAttribute("aria-current", String(i === 0));
    });
    arrows.forEach(function (button) {
      button.disabled = Number(button.dataset.step) < 0;
    });
  }

  /* ----------------------------------------------------------------------
     3. Lightbox — one <dialog> shared by every entry
     ---------------------------------------------------------------------- */

  var lightbox = (function () {
    var dialog = document.querySelector("[data-lightbox]");
    if (!dialog || typeof dialog.showModal !== "function") {
      return null;
    }

    var track = dialog.querySelector("[data-lightbox-track]");
    var title = dialog.querySelector("[data-lightbox-title]");
    var caption = dialog.querySelector("[data-lightbox-caption]");
    var count = dialog.querySelector("[data-lightbox-count]");
    var prev = dialog.querySelector("[data-lightbox-prev]");
    var next = dialog.querySelector("[data-lightbox-next]");
    var close = dialog.querySelector("[data-lightbox-close]");

    var images = [];
    var index = 0;
    var ticking = false;
    var settleTimer;

    function slideWidth() {
      return track.clientWidth || 1;
    }

    function settle() {
      var width = slideWidth();
      var target = Math.round(track.scrollLeft / width) * width;
      if (Math.abs(track.scrollLeft - target) > 2) {
        track.scrollTo({ left: target, behavior: scrollBehavior() });
      }
    }

    function paint() {
      var image = images[index];
      if (!image) {
        return;
      }
      caption.textContent = image.caption || "";
      caption.hidden = !image.caption;
      count.textContent = images.length > 1 ? index + 1 + " / " + images.length : "";
      count.hidden = images.length < 2;
      prev.disabled = index === 0;
      next.disabled = index === images.length - 1;
    }

    function goTo(target, behavior) {
      index = Math.max(0, Math.min(images.length - 1, target));
      track.scrollTo({ left: index * slideWidth(), behavior: behavior || "auto" });
      paint();
    }

    track.addEventListener("scroll", function () {
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(settle, 140);
      if (ticking) {
        return;
      }
      ticking = true;
      window.requestAnimationFrame(function () {
        ticking = false;
        var current = Math.round(track.scrollLeft / slideWidth());
        if (current !== index) {
          index = current;
          paint();
        }
      });
    }, { passive: true });

    prev.addEventListener("click", function () {
      goTo(index - 1, scrollBehavior());
    });
    next.addEventListener("click", function () {
      goTo(index + 1, scrollBehavior());
    });
    close.addEventListener("click", function () {
      dialog.close();
    });

    dialog.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(index - 1, scrollBehavior());
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(index + 1, scrollBehavior());
      }
    });

    /* Clicking the backdrop closes. The shell stops the event, so only clicks
       that land outside the panel reach here. */
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) {
        dialog.close();
      }
    });

    dialog.addEventListener("close", function () {
      track.replaceChildren();
      images = [];
      document.documentElement.style.removeProperty("overflow");
    });

    return {
      open: function (entry, startIndex) {
        images = entry.images;
        track.replaceChildren();
        track.setAttribute("aria-label", entry.title);

        entry.images.forEach(function (image, i) {
          var slide = el("li", "glightbox__slide");
          slide.setAttribute("role", "group");
          slide.setAttribute("aria-roledescription", "slide");
          slide.setAttribute("aria-label", i + 1 + " of " + entry.images.length);
          var img = document.createElement("img");
          img.src = image.full || image.src;
          img.alt = image.alt || "";
          img.decoding = "async";
          slide.appendChild(img);
          track.appendChild(slide);
        });

        title.textContent = entry.title;
        dialog.showModal();
        document.documentElement.style.overflow = "hidden";
        /* Geometry is only real once the dialog is laid out. */
        window.requestAnimationFrame(function () {
          goTo(startIndex, "auto");
          close.focus();
        });
      }
    };
  })();

  /* ----------------------------------------------------------------------
     Boot
     ---------------------------------------------------------------------- */

  function mount(data) {
    entries = data.filter(function (entry) {
      return entry && Array.isArray(entry.images) && entry.images.length;
    });

    if (!entries.length) {
      status.textContent = "No gallery entries yet.";
      return;
    }

    entries.forEach(function (entry, index) {
      grid.appendChild(buildEntry(entry, index));
    });

    Array.prototype.forEach.call(grid.querySelectorAll("[data-swipe]"), initSwiper);

    if (lightbox) {
      grid.addEventListener("click", function (event) {
        var button = event.target.closest("[data-open]");
        if (!button) {
          return;
        }
        lightbox.open(entries[Number(button.dataset.entry)], Number(button.dataset.open));
      });
    } else {
      /* Without <dialog> support the image itself is still reachable. */
      Array.prototype.forEach.call(grid.querySelectorAll("[data-open]"), function (button) {
        button.classList.add("is-inert");
        button.disabled = true;
      });
    }

    renderFilters();
    status.hidden = true;
  }

  fetch(DATA_URL, { cache: "no-cache" })
    .then(function (response) {
      if (!response.ok) {
        throw new Error("HTTP " + response.status);
      }
      return response.json();
    })
    .then(mount)
    .catch(function () {
      /* Browsers refuse fetch() on file:// URLs, so this is also what a
         double-clicked local copy of the page sees. */
      status.textContent =
        "The gallery could not be loaded. If you opened this page as a local " +
        "file, serve the site over HTTP instead — data/gallery.json cannot be " +
        "read from file:// URLs.";
      status.hidden = false;
    });
})();
