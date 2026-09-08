/* Research footprint map.
 *
 * Draws markers over assets/img/world.svg, a static Natural Earth I projection
 * of Natural Earth 110m public-domain land data. Marker positions are computed
 * with the same projection so they land exactly where they should; nothing is
 * hard-coded into the SVG markup.
 *
 * Data source: data/research-locations.json (fetched at runtime).
 * Note: fetch() of a local file fails under the file:// protocol. Serve the
 * site over HTTP (GitHub Pages, or `python -m http.server`) to see the markers.
 * The visible/accessible location list below the map is static HTML and is
 * always present, so no information is lost if the fetch fails.
 *
 * No mapping library, no dependencies.
 */
(function () {
  "use strict";

  var root = document.querySelector("[data-research-map]");
  if (!root) return;

  var svg = root.querySelector("[data-map-markers]");
  var tip = root.querySelector("[data-map-tooltip]");
  if (!svg || !tip) return;

  var SVG_NS = "http://www.w3.org/2000/svg";

  /* Projection constants emitted by the map generator. Keep in sync with
   * assets/img/world.svg — regenerating the SVG regenerates these. */
  var SCALE = 182.78964407016807;
  var ORIGIN_X = 500;
  var ORIGIN_Y = 255.99825445407163;
  var RAD = Math.PI / 180;

  function project(lon, lat) {
    var l = lon * RAD;
    var p = lat * RAD;
    var p2 = p * p;
    var p4 = p2 * p2;
    var x = l * (0.8707 - 0.131979 * p2 + p4 * (-0.013791 + p4 * (0.003971 * p2 - 0.001529 * p4)));
    var y = p * (1.007226 + p2 * (0.015085 + p4 * (-0.044475 + 0.028874 * p2 - 0.005916 * p4)));
    return [x * SCALE + ORIGIN_X, ORIGIN_Y - y * SCALE];
  }

  function el(name, attrs) {
    var node = document.createElementNS(SVG_NS, name);
    for (var key in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, key)) {
        node.setAttribute(key, attrs[key]);
      }
    }
    return node;
  }

  function labelFor(loc) {
    var where = [loc.city, loc.country].filter(Boolean).join(", ");
    var parts = [loc.institution, where];
    if (loc.papers && loc.papers.length) {
      parts.push(loc.papers.length + (loc.papers.length === 1 ? " related paper" : " related papers"));
    }
    return parts.join(". ");
  }

  /* ---- Tooltip ---------------------------------------------------------- */
  var activeMarker = null;

  function buildTooltip(loc) {
    tip.textContent = "";

    var name = document.createElement("p");
    name.className = "map-tip__name";
    name.textContent = loc.institution;
    tip.appendChild(name);

    var place = document.createElement("p");
    place.className = "map-tip__place";
    place.textContent = [loc.city, loc.country].filter(Boolean).join(", ");
    tip.appendChild(place);

    if (loc.role) {
      var role = document.createElement("p");
      role.className = "map-tip__role";
      role.textContent = loc.role;
      tip.appendChild(role);
    }

    if (loc.collaborators && loc.collaborators.length) {
      tip.appendChild(section(loc.collaboratorsLabel || "Selected collaborators", loc.collaborators));
    }
    if (loc.papers && loc.papers.length) {
      tip.appendChild(section("Related work", loc.papers));
    }
  }

  function section(heading, items) {
    var frag = document.createDocumentFragment();

    var h = document.createElement("p");
    h.className = "map-tip__heading";
    h.textContent = heading;
    frag.appendChild(h);

    var list = document.createElement("ul");
    list.className = "map-tip__list";
    items.forEach(function (item) {
      var li = document.createElement("li");
      li.textContent = item;
      list.appendChild(li);
    });
    frag.appendChild(list);

    return frag;
  }

  function showTip(marker, loc) {
    if (activeMarker && activeMarker !== marker) {
      activeMarker.classList.remove("is-active");
    }
    activeMarker = marker;
    marker.classList.add("is-active");

    buildTooltip(loc);
    tip.hidden = false;

    // Position relative to the map box, flipping near the edges so the
    // tooltip never leaves the section.
    var box = root.getBoundingClientRect();
    var dot = marker.getBoundingClientRect();
    var x = dot.left + dot.width / 2 - box.left;
    var y = dot.top - box.top;

    tip.style.left = "0px";
    tip.style.top = "0px";
    var tw = tip.offsetWidth;
    var th = tip.offsetHeight;

    var left = Math.min(Math.max(x - tw / 2, 8), Math.max(8, box.width - tw - 8));
    var top = y - th - 14;
    if (top < 0) top = y + dot.height + 14;

    tip.style.left = Math.round(left) + "px";
    tip.style.top = Math.round(top) + "px";
  }

  function hideTip() {
    if (activeMarker) activeMarker.classList.remove("is-active");
    activeMarker = null;
    tip.hidden = true;
  }

  /* ---- Render ----------------------------------------------------------- */
  function render(locations) {
    locations.forEach(function (loc) {
      if (typeof loc.lat !== "number" || typeof loc.lon !== "number") return;

      var point = project(loc.lon, loc.lat);
      var group = el("g", {
        class: "map-marker" + (loc.primary ? " map-marker--primary" : ""),
        tabindex: "0",
        role: "button",
        "aria-label": labelFor(loc)
      });

      // Radii are viewBox units, so markers keep their proportion as the map
      // scales. At the 1440px desktop width these work out to roughly a 4px
      // radius for a venue, 7px for an institution and an 11px hover ring.
      // Generous transparent hit area for touch and coarse pointers.
      group.appendChild(el("circle", {
        class: "map-marker__hit",
        cx: point[0].toFixed(1),
        cy: point[1].toFixed(1),
        r: 13
      }));
      group.appendChild(el("circle", {
        class: "map-marker__ring",
        cx: point[0].toFixed(1),
        cy: point[1].toFixed(1),
        r: 8.5
      }));
      group.appendChild(el("circle", {
        class: "map-marker__dot",
        cx: point[0].toFixed(1),
        cy: point[1].toFixed(1),
        r: loc.primary ? 5.4 : 3.6
      }));

      group.addEventListener("mouseenter", function () { showTip(group, loc); });
      group.addEventListener("mouseleave", hideTip);
      group.addEventListener("focus", function () { showTip(group, loc); });
      group.addEventListener("blur", hideTip);
      group.addEventListener("click", function (event) {
        event.stopPropagation();
        if (activeMarker === group && !tip.hidden) hideTip();
        else showTip(group, loc);
      });
      group.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          showTip(group, loc);
        }
      });

      svg.appendChild(group);
    });

    document.addEventListener("click", function (event) {
      if (!root.contains(event.target)) hideTip();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") hideTip();
    });
    window.addEventListener("resize", hideTip);
  }

  fetch("data/research-locations.json")
    .then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
    })
    .then(render)
    .catch(function () {
      // Markers unavailable (offline, or opened over file://). The static
      // location list beneath the map still carries the full information.
      root.setAttribute("data-map-degraded", "true");
    });
})();
