# AGENTS.md — permanent project rules

This repository is the personal academic research website of **Nichula Sathmith
Wasalathilaka**, deployed as a GitHub Pages user site at
<https://nichula01.github.io/>.

It is an **academic researcher's website** — not a startup landing page, a SaaS
product site, a portfolio dashboard, or a commercial page. The quality bar is
the personal site of a strong researcher at MIT, Princeton, Harvard, Stanford or
EPFL. Every change should be judged against that bar.

These rules are binding for any agent (Codex, Claude, or otherwise) working in
this repository.

---

## 1. Academic integrity — the highest-priority rule

1. **Never invent** publication titles, author names, author order, venues,
   years, awards, collaborators, affiliations, supervisors, citation counts,
   benchmark numbers, research results, or any other academic claim.
2. **Academic facts must come from existing repository content or from data the
   repository owner explicitly supplies.** If a fact is not already in this
   repository and was not handed to you, do not write it — ask instead.
3. If content is missing, leave an explicit `<!-- TODO: ... -->` comment and
   report the gap. Do not fill it with a plausible guess.
4. Do not silently reword a paper title, reorder authors, upgrade a venue, or
   change an "Accepted" status to "Published" (or vice versa).
5. Do not add metrics the site does not already claim — no citation counts, no
   h-index, no "N collaborators", no "N countries", no impact factors.

## 2. Research imagery

6. **Never replace a genuine research figure with stock photography or a
   generated/AI-synthesised scientific image.** Figures on this site are real
   outputs of real papers.
7. A figure may be *cropped, resized or re-encoded* for web performance. It must
   never be redrawn, recoloured, relabelled, or fabricated.
8. Derived web assets live in `images/home/` (and similar). **Originals stay in
   place, untouched.**
9. Do not add portraits of collaborators, institutional logos, or venue logos
   that are not already in the repository and not cleared for use.
10. Do not use an AI-generated portrait of the site owner.

## 2b. The research footprint map

13a. Map locations live in **`data/research-locations.json`** and nowhere else.
    Never hard-code a marker into the SVG or into JavaScript.
13b. **Every location needs a `source` field** naming the file and wording in
    this repository that supports it. A location without a verifiable source
    does not go on the map.
13c. Do not add markers to make the map look global. An empty region is the
    honest answer when there is no verified work there.
13d. Do not infer an institution's location from a person's name, and do not
    treat a journal's headquarters as a publication location. A conference
    venue counts only when repository content states the city.
13e. Collaborator names shown for a location must be tied to that location by
    repository content (e.g. a stated supervisor at a stated institution).
    Use the `collaboratorsLabel` field so the tooltip says exactly what the
    relationship is — "Supervisors" is not the same claim as "Collaborators".
13f. `assets/img/world.svg` is generated from Natural Earth 110m public-domain
    country data in a Natural Earth I projection. If it is regenerated, the
    projection constants at the top of `assets/js/research-map.js`
    (`SCALE`, `ORIGIN_X`, `ORIGIN_Y`) and the `viewBox` in `index.html` must be
    updated to match, or every marker will land in the wrong place.
13g. The static location list under the map is not decoration — it is the
    accessible and small-screen fallback. Keep it in sync with the JSON.

## 3. Asset safety

11. **Do not delete research assets without first checking whether they are
    referenced.** Grep every `.html` file for the filename before touching it.
12. This working copy is **not under version control**, so deletions are
    unrecoverable. Record proposed deletions in `ASSET-AUDIT.md` and get explicit
    approval before removing anything.
13. Optimise images for the web without destroying originals: write derivatives
    to a new path, never overwrite the source file.

## 4. Platform constraints

14. **Preserve static GitHub Pages compatibility.** The site must load correctly
    when served as plain files from the repository root, with no build step.
15. Do **not** introduce React, Next.js, Vue, Svelte, a Tailwind build pipeline,
    npm, or any bundler. There is no `package.json` and there should not be one.
16. Keep every internal path **relative** (`images/...`, `assets/...`,
    `research.html`). Never use absolute paths beginning with `/`.
17. Keep `.nojekyll`, `robots.txt` and `sitemap.xml` at the repository root.
18. External resources are limited to Google Fonts. Do not add analytics,
    trackers, CDN JS libraries, or web fonts from other hosts.

## 5. Code architecture

19. Shared presentation lives in **`assets/css/site.css`**; shared behaviour in
    **`assets/js/site.js`**. This is the single convention — do not introduce a
    parallel `css/` or `js/` directory.
20. Prefer **semantic HTML5** (`header`, `nav`, `main`, `section`, `article`,
    `figure`, `footer`) over `div` soup.
21. Use **CSS custom properties** from the `:root` token block in `site.css`.
    Do not hard-code colours, and do not redefine the palette per page.
22. JavaScript is **minimal vanilla JS**, progressive-enhancement only. The page
    must remain fully readable and navigable with JavaScript disabled.
23. Migrate legacy inline `<style>` blocks into `site.css` as pages are
    redesigned, rather than adding new inline CSS.

## 6. Design language

24. The approved design language is **minimalist editorial academic**: white
    background, near-black type, one restrained deep-red accent (`#b51217`),
    generous whitespace, precise alignment, flat rather than card-heavy.
25. **Red is an accent, not a theme.** Reserve it for the active navigation
    underline, small section kickers, the single primary button, thin divider
    rules, and occasional venue accents.
26. **Avoid dashboard / SaaS aesthetics**: KPI tiles, statistic counters, metric
    cards, glassmorphism, gradients, glowing effects, animated backgrounds,
    decorative "AI network" graphics.
27. **Avoid excessive chrome**: large rounded corners, heavy shadows, pill
    buttons everywhere, nested cards, icons on every list item. Border radius
    stays at or near `2px`.
28. Typography carries the design. Headings and body both use one modern
    grotesk (Inter) — do not add a second family without a reason.
29. Authentic research figures should be the strongest visual elements on any
    page — stronger than any decoration.

## 7. Responsiveness, accessibility, performance

30. **Test desktop and mobile after every substantial visual change.** The
    target widths are 1440, 1280, 1024, 768, 390 and 360 px. Mobile layouts are
    designed, not shrunk. No horizontal overflow at any width.
31. Preserve accessibility: semantic landmarks, correct heading hierarchy
    (one `h1` per page, no skipped levels), useful `alt` text, sufficient
    contrast, visible `:focus-visible` states, correct `button` vs `a` usage,
    no hover-only interactions, working keyboard navigation, and a respected
    `prefers-reduced-motion` setting.
32. Keep pages fast: no JS libraries, `loading="lazy"` below the fold, explicit
    `width`/`height` or `aspect-ratio` on every image to avoid layout shift, and
    web-sized derivatives instead of multi-megabyte originals. Do not degrade
    research-figure quality so far that the science becomes unreadable.

## 8. SEO and metadata

33. Preserve or improve, never remove: `<title>`, meta description, canonical
    URL, Open Graph tags, Twitter card tags, and the `Person` JSON-LD schema.
34. Metadata must not assert anything the visible site does not support.
35. Update `sitemap.xml` `lastmod` values when a page's content changes; add a
    `<url>` entry whenever a new page is created.

## 9. Working method

36. Audit before editing: read the affected pages fully, inventory referenced
    assets, and check for broken links.
37. Make staged, reviewable changes. The owner approves each page's design
    before the next page is rebuilt.
38. Report exactly which files changed, and list any content or assets still
    needed from the owner.
