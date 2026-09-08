/* ---------------------------------------------------------------------------
 * build-world-map.js — authoring-time script, NOT part of the deployed site.
 *
 * Regenerates assets/img/world.svg: a Natural Earth I projection of Natural
 * Earth 110m country data (public domain), simplified for the web.
 *
 * Run:   node tools/build-world-map.js
 * Needs: network access on first run (downloads the source TopoJSON to a
 *        cache file next to this script). Node 18+ for global fetch.
 *
 * IMPORTANT: this script prints the projection constants at the end. If you
 * regenerate the map you MUST copy them into assets/js/research-map.js
 * (SCALE / ORIGIN_X / ORIGIN_Y) and update the viewBox on the marker <svg>
 * in index.html, or every marker will land in the wrong place.
 *
 * Source data: https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json
 * (world-atlas, ISC licence; derived from Natural Earth, public domain).
 * --------------------------------------------------------------------------- */

const fs = require('fs');
const path = require('path');

const SOURCE_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';
const CACHE = path.join(__dirname, 'countries-110m.json');

async function loadTopology() {
  if (!fs.existsSync(CACHE)) {
    const res = await fetch(SOURCE_URL);
    if (!res.ok) throw new Error('Download failed: HTTP ' + res.status);
    fs.writeFileSync(CACHE, Buffer.from(await res.arrayBuffer()));
  }
  return JSON.parse(fs.readFileSync(CACHE, 'utf8'));
}

main();
async function main() {
const T = await loadTopology();

const [sx, sy] = T.transform.scale;
const [tx, ty] = T.transform.translate;
const arcs = T.arcs.map((arc) => {
  let x = 0, y = 0;
  return arc.map(([dx, dy]) => { x += dx; y += dy; return [x * sx + tx, y * sy + ty]; });
});
function ring(indices) {
  const out = [];
  for (const idx of indices) {
    const rev = idx < 0;
    const a = arcs[rev ? ~idx : idx];
    const seg = rev ? a.slice().reverse() : a;
    for (let i = out.length ? 1 : 0; i < seg.length; i++) out.push(seg[i]);
  }
  return out;
}

const RAD = Math.PI / 180;
function project(lon, lat) {
  const l = lon * RAD, p = lat * RAD, p2 = p * p, p4 = p2 * p2;
  return [
    l * (0.8707 - 0.131979 * p2 + p4 * (-0.013791 + p4 * (0.003971 * p2 - 0.001529 * p4))),
    p * (1.007226 + p2 * (0.015085 + p4 * (-0.044475 + 0.028874 * p2 - 0.005916 * p4)))
  ];
}
const WIDTH = 1000;
const SCALE = WIDTH / (2 * project(180, 0)[0]);
const FULL_H = 2 * project(0, 90)[1] * SCALE;
const toSvg = (lon, lat) => {
  const [x, y] = project(lon, lat);
  return [x * SCALE + WIDTH / 2, FULL_H / 2 - y * SCALE];
};

// Douglas-Peucker
function dp(pts, eps) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    if (b - a < 2) continue;
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    let best = -1, bestD = eps;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = pts[i];
      let d;
      if (len2 === 0) d = Math.hypot(px - ax, py - ay);
      else {
        let t = ((px - ax) * dx + (py - ay) * dy) / len2;
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        d = Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
      }
      if (d > bestD) { bestD = d; best = i; }
    }
    if (best > 0) { keep[best] = 1; stack.push([a, best], [best, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
function area(pts) {
  let a = 0;
  for (let i = 0, n = pts.length; i < n; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % n];
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a) / 2;
}


// A ring that wraps past +/-180 longitude must be cut there, otherwise the
// projected path runs straight back across the entire map.
function splitAntimeridian(pts) {
  const parts = [];
  let current = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    if (Math.abs(pts[i][0] - pts[i - 1][0]) > 180) {
      parts.push(current);
      current = [];
    }
    current.push(pts[i]);
  }
  parts.push(current);
  if (parts.length === 1) return parts;
  // Re-join the first and last fragment: they are the two ends of the same
  // ring on the same side of the antimeridian.
  if (Math.abs(parts[0][0][0] - parts[parts.length - 1][parts[parts.length - 1].length - 1][0]) <= 180) {
    const last = parts.pop();
    parts[0] = last.concat(parts[0]);
  }
  return parts.filter((p) => p.length >= 4);
}

const EPS = 0.45, MIN_AREA = 2.0;
const SKIP = new Set(['Antarctica']);
const kept = [];
let minY = Infinity, maxY = -Infinity;

for (const geom of T.objects.countries.geometries) {
  if (SKIP.has(geom.properties && geom.properties.name)) continue;
  const polys = geom.type === 'Polygon' ? [geom.arcs] : geom.type === 'MultiPolygon' ? geom.arcs : [];
  const rings = [];
  for (const poly of polys) {
    for (const r of poly) {
      for (const part of splitAntimeridian(ring(r))) {
        let pts = part.map(([lon, lat]) => toSvg(lon, lat));
        if (pts.length < 4 || area(pts) < MIN_AREA) continue;
        pts = dp(pts, EPS);
        if (pts.length < 4) continue;
        rings.push(pts);
        for (const [, y] of pts) { if (y < minY) minY = y; if (y > maxY) maxY = y; }
      }
    }
  }
  if (rings.length) kept.push(rings);
}

const PAD = 4;
const CROP_Y = Math.max(0, Math.floor(minY - PAD));
const VIEW_H = Math.ceil(maxY + PAD) - CROP_Y;

const body = kept.map((rings) =>
  '<path d="' + rings.map((pts) =>
    'M' + pts.map(([x, y]) => `${x.toFixed(1)},${(y - CROP_Y).toFixed(1)}`).join('L') + 'Z'
  ).join('') + '"/>'
).join('\n');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${VIEW_H}" role="img" aria-label="Simplified world map">
<title>World map</title>
<desc>Land areas of the world in a Natural Earth I projection. Derived from Natural Earth 110m public-domain country data.</desc>
<g fill="#eceff2" stroke="#ffffff" stroke-width="0.55" stroke-linejoin="round">
${body}
</g>
</svg>
`;
fs.mkdirSync('assets/img', { recursive: true });
fs.writeFileSync('assets/img/world.svg', svg);

const OX = WIDTH / 2, OY = FULL_H / 2 - CROP_Y;
console.log(`viewBox: 0 0 ${WIDTH} ${VIEW_H}   aspect ${(WIDTH / VIEW_H).toFixed(3)}`);
console.log(`bytes: ${svg.length}   countries: ${kept.length}`);
console.log(`PROJECTION CONSTANTS  SCALE=${SCALE}  OX=${OX}  OY=${OY}`);
for (const [n, lon, lat] of [['Peradeniya',80.5918,7.2549],['Abu Dhabi',54.3773,24.4539],['Strasbourg',7.7521,48.5734],['Washington DC',-77.0369,38.9072]]) {
  const [px, py] = project(lon, lat);
  console.log(`  ${n.padEnd(14)} x=${(px*SCALE+OX).toFixed(1)}  y=${(OY-py*SCALE).toFixed(1)}`);
}
}
