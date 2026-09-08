# Asset audit — last updated 2026-09-07 (Phase 1 + refinement pass)

Findings from a full inspection of the repository before the homepage redesign.
**Nothing in this document has been deleted or moved.** This working copy is not
under version control, so every deletion listed here needs explicit approval
from the repository owner first.

---

## 1. Duplicate directory: `images/reaserch/` vs `images/research/`

`images/reaserch/` (misspelled) is a **byte-for-byte duplicate** of
`images/research/`. All 15 files match on MD5:

| File | Status |
| --- | --- |
| `dataset.jpg` | identical |
| `god_cxr_anatomy_graph.jpg` | identical |
| `god_explanations__cxr.png` | identical |
| `god_explanations_Fundes.jpg` | identical |
| `Graph of Differences Arch.png` | identical |
| `iciis2025_precision_spatiotemporal_decoder.jpg` | identical |
| `iciis2025_precision_spatiotemporal_qualitative.jpg` | identical |
| `igarss2026_vss_benchmark_efficiency.png` | identical |
| `igarss2026_vss_benchmark_pipeline.png` | identical |
| `igarss2026_vss_benchmark_qualitative.png` | identical |
| `mambafcs_fusion_decoder.jpg` | identical |
| `mambafcs_overview_architecture.jpg` | identical |
| `mambafcs_qualitative_ablation.jpg` | identical |
| `stageA.jpg` | identical |
| `stageB.jpg` | identical |

**Reference check:** grepping every file in the repository for the string
`reaserch` returns **zero hits**. `research.html` references only the correctly
spelled `images/research/...` paths.

**Recommendation:** delete `images/reaserch/` in full. It is ~57 MB of dead
weight, roughly half the repository's total size, and it slows every clone and
every GitHub Pages deploy.

**Status:** NOT deleted. Awaiting owner approval.

---

## 2. Unreferenced images at `images/` root

These files exist but are not referenced by `index.html`, `research.html`,
`publications.html`, or `index_1.html`:

| File | Size | Likely purpose |
| --- | --- | --- |
| `advanced_level.jpg` | 89 KB | unknown |
| `Farbe.png` | 4.5 KB | logo, unknown organisation |
| `iciet.png` | 27 KB | ICIET conference logo |
| `iciis.png` | 34 KB | ICIIS conference logo |
| `igarss.png` | 7.3 KB | IGARSS conference logo |
| `jstars.png` | 5.0 KB | IEEE J-STARS logo |
| `Peradeniya.jpg` | 279 KB | University of Peradeniya |
| `nichula.jpg` | 53 KB | **now used** — hero portrait, see §5 |

The four venue logos are plausibly wanted for a future publications-page
redesign. **Recommendation:** keep all of them for now. Total cost is ~450 KB.

**Status:** all retained.

---

## 3. `index_1.html`

A 34 KB earlier draft of the homepage (`<title>Nichula Wasalathilaka | Research
Portfolio</title>`, sections: News / Research / Contact with Journal, Conference
and Working Papers groups). It is not linked from any page and is not listed in
`sitemap.xml`, but GitHub Pages **will serve it publicly** at
`https://nichula01.github.io/index_1.html`.

It contains a "Working Papers" grouping that does not appear on the current
`publications.html`, so it may hold content worth carrying forward.

**Recommendation:** review it, extract anything still wanted, then delete it —
or at minimum add `<meta name="robots" content="noindex">` so a stale draft of
the homepage is not indexed alongside the real one.

**Status:** untouched, still publicly reachable.

---

## 4. Oversized originals

Several research figures are far larger than any display use requires:

| File | Dimensions | Size |
| --- | --- | --- |
| `images/research/god_explanations_Fundes.jpg` | 6102 × 3781 | 13.1 MB |
| `images/research/mambafcs_overview_architecture.jpg` | 10920 × 4940 | 8.5 MB |
| `images/research/mambafcs_qualitative_ablation.jpg` | 3688 × 5764 | 6.8 MB |
| `images/research/Graph of Differences Arch.png` | 5750 × 2450 | 6.1 MB |
| `images/research/igarss2026_vss_benchmark_qualitative.png` | 3185 × 3398 | 4.2 MB |
| `images/research/god_explanations__cxr.png` | 3520 × 2200 | 3.9 MB |
| `images/research/dataset.jpg` | 10250 × 3600 | 3.6 MB |
| `images/research/iciis2025_precision_spatiotemporal_qualitative.jpg` | 3270 × 1983 | 3.4 MB |
| `images/VLM OOD Architecture.png` | 7360 × 2990 | 1.9 MB |

`research.html` loads these originals directly. That page currently ships
roughly **60 MB of imagery**, which is a serious performance problem on mobile.

**Recommendation (Phase 2, when `research.html` is redesigned):** generate
web-sized derivatives (~1600 px wide) and have the page load those, keeping the
originals as the click-through / lightbox target. Do not overwrite originals.

**Status:** originals untouched. Homepage derivatives created — see §5.

---

## 5. New files created in Phase 1

Web-optimised derivatives for the homepage only, all cropped/resized from real
research figures in this repository. Originals untouched.

| Derivative | Source | Size |
| --- | --- | --- |
| `images/home/tile-medical.jpg` (1200 × 900) | `images/research/god_explanations_Fundes.jpg` | 129 KB |
| `images/home/tile-remote-sensing.jpg` (1200 × 900) | `images/research/igarss2026_vss_benchmark_qualitative.png` | 358 KB |
| `images/home/tile-scientific.jpg` (740 × 555) | `images/fig8_new.png` | 47 KB |
| `images/home/thumb-god.jpg` (480 × 360) | `images/research/Graph of Differences Arch.png` | 29 KB |
| `images/home/thumb-proton.jpg` (480 × 360) | `images/VLM OOD Architecture.png` | 28 KB |
| `images/home/thumb-mambafcs.jpg` (480 × 360) | `images/research/mambafcs_overview_architecture.jpg` | 24 KB |

Total homepage imagery: **~615 KB**, down from ~30 MB if originals were used.

The hero portrait uses `images/nichula.jpg` (505 × 471, 53 KB) rather than
`images/nichula_2.jpg`. `nichula_2.jpg` is a casual night photograph with a cap
and sunglasses; `nichula.jpg` is a clear head-and-shoulders portrait and is the
appropriate choice for an academic site. Its resolution is low — a higher-
resolution version would improve the hero on high-DPI screens.

---

## 6. Content issues found (not fixed — out of Phase 1 scope)

1. **`research.html` figure captions for RespGeomLib appear swapped.**
   - `images/fig8_new.png` is captioned *"Junction quality comparison.
     RespGeomLib yields cleaner junction curvature than the Boolean/stitch
     baseline"*, but the image actually shows a six-panel CFD pipeline:
     (a) CFD-ready Y-junction surface, (b) volume mesh, (c) velocity magnitude,
     (d) velocity vectors, (e) static pressure, (f) particle traces.
   - `images/fig9_new (1).png` is captioned *"CFD-ready export and stable
     airflow simulation"*, but the image actually shows a CT-derived airway
     reconstruction beside a RespGeomLib procedural airway.

   These two captions look like they belong to each other's figure. Needs the
   owner's confirmation before either is changed.

2. **`research.html` has an empty image source** at line 1508:
   `<img class="lightbox-img" id="lightbox-img" src="" alt="" />`. An empty
   `src` makes the browser re-request the current page URL. It should be
   omitted from the markup and set by JavaScript when the lightbox opens.

3. **`publications.html` and `research.html` state "7 papers"** in the page
   header while `publications.html` lists seven numbered entries — consistent.
   No action needed; noted so it stays consistent when either page is rebuilt.

4. **Open Graph image.** `og:image` and `twitter:image` point to
   `images/nichula_2.jpg` (1024 × 1365, portrait orientation) while the card is
   declared `summary_large_image`, which expects a landscape image around
   1200 × 630. A dedicated landscape social card would render far better.

---

## 7. Links verified

All internal links and anchors used by the new homepage resolve:

- `research.html`, `publications.html` — exist.
- `research.html#medical-imaging-research`, `#remote-sensing`,
  `#systems-modeling` — anchors exist.
- `research.html#graph-of-differences-miccai-2026`,
  `#proton-ood-miccai-2026`, `#mamba-fcs-jstars-2026` — anchors exist.
- `index.html#contact` (used by `research.html` and `publications.html`) —
  the `#contact` section is preserved on the redesigned homepage.

Known dead targets, deliberately **not** linked:
`projects.html` and `cv/Nichula_Wasalathilaka_CV.pdf` do not exist. The markup
for both is present but commented out in `index.html`.

---

## 8. Files added in the refinement pass (2026-09-07)

| File | Purpose | Size |
| --- | --- | --- |
| `assets/img/world.svg` | Base world map: Natural Earth I projection of Natural Earth 110m country data (public domain), Douglas-Peucker simplified, Antarctica omitted. Colours baked in. | 79 KB |
| `data/research-locations.json` | The only source of map marker data. Each entry carries a `source` field naming the repository content that supports it. | 3 KB |
| `assets/js/research-map.js` | Projects the JSON locations into the map's coordinate space and draws markers + tooltips. No mapping library. | 6 KB |
| `tools/build-world-map.js` | Authoring-time generator for `world.svg`. Not served. Prints the projection constants that `research-map.js` and the `index.html` viewBox must match. | 7 KB |
| `tools/countries-110m.json` | Cached public-domain source data for the generator, so the map can be rebuilt offline. Not served. | 105 KB |

Verified reproducible: re-running `node tools/build-world-map.js` produces a
byte-identical `assets/img/world.svg`.

## 9. Map locations and their provenance

Only four locations are on the map. Each is stated in repository content:

| Location | Evidence in this repository |
| --- | --- |
| University of Peradeniya, Sri Lanka | `index.html` — home institution. `index.html` updates and `publications.html` — ICIIS 2025 held at the Faculty of Engineering, University of Peradeniya. |
| MBZUAI, Abu Dhabi, UAE | `index.html` — "visiting research student at MBZUAI, Abu Dhabi". `research.html` lines 1269 and 1345 — both MICCAI 2026 papers "Research conducted at MBZUAI, Abu Dhabi", supervised by Prof. Imran Razzak, Prof. Dwarikanath Mahapatra and (PROTON) Prof. Shadab Khan. |
| MICCAI 2026, Strasbourg, France | `publications.html` — "MICCAI 2026 … Strasbourg, France" on both papers. |
| IGARSS 2026, Washington, D.C., USA | `publications.html` — "IGARSS 2026 … Washington, DC, USA" on both papers. |

**Deliberately excluded** — the repository does not state a city, and guessing
one would be an invented fact:

- **IEEE Mercon 2026.** `publications.html` gives only "Moratuwa Engineering
  Research Conference". The venue name implies Moratuwa, Sri Lanka, but the
  repository never says so.
- **ICIET 2025** (Best Oral Presentation award, Faculty of Technology,
  University of Sri Jayewardenepura). No city stated, and it is an award
  rather than a publication venue.
- **IEEE J-STARS.** A journal, not a place. Journal headquarters are not
  publication locations.

**Collaborators deliberately not listed for University of Peradeniya.** The
co-authors on the remote-sensing and RespGeomLib papers (Buddhi Wijenayake,
Roshan Godaliyadda, Vijitha Herath, Parakrama Ekanayake and others) are almost
certainly Peradeniya-affiliated, but no file in this repository states their
affiliation. Listing them under Peradeniya would assert an affiliation the
repository does not support. Confirm their affiliations and they can be added
to that location's `collaborators` array.

For MBZUAI the tooltip says **"Supervisors"**, not "Collaborators", because
that is precisely what `research.html` states.

## 10. Known deviations from the brief (refinement pass)

1. **Map height.** The brief asked for both "map width approximately 100%" and
   "map height approximately 430-500px". With the whole world visible the
   aspect ratio is fixed at 2.283:1, so at the full 1296px content width the
   map is ~568px tall. Full width was chosen because it keeps the map aligned
   with every other element on the page; a centred narrower map left the
   heading and the map on different left edges.
2. **Mobile map height.** The brief asked for 250-300px under 768px. Showing
   the entire world at a 390px viewport is geometrically ~171px tall; reaching
   250px would require either horizontal scrolling or cropping out real
   continents. Instead the map bleeds to the screen edges, markers are enlarged
   for touch, and the full location list is shown as readable text beneath it.
3. **Hero portrait width.** The brief asked for 26-30% of the content width.
   `images/nichula.jpg` is a tight 505x471 head-and-shoulders crop, so at that
   size the face dominates the page. It is set to ~290px (~22%). A
   higher-resolution photograph with shoulder and background context would let
   it go to the intended size.
4. **`CV` in the navigation** is rendered as an inert, muted item rather than a
   link, because `cv/Nichula_Wasalathilaka_CV.pdf` does not exist. The markup
   to activate it is in an HTML comment beside it.
5. **`Projects`** is absent from the navigation because `projects.html` does
   not exist.

