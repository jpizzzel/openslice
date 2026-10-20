// The living trunk: a tree drawn from data. Every tool in TOOLS becomes a
// branch, so adding one to site.ts grows a new branch (and the drawing gets
// taller to make room). Branch order, reach, rise and thickness all come from
// the index; nothing is hand placed. Also the growth rings cross-section: one
// ring per full year since SITE.since, counted from today's date.
//
// Hooks kept for slices.ts: [data-part="branch"] paths (pathLength=1, with
// data-slug), two [data-part="leaf"] groups per branch in branch order, and a
// [data-part="fruit"] group per tool (data-slug) hanging from its tip.
import { SITE, type Tool } from "../../data/site";
import { glyph, halftone } from "../../art";

const INK = "#141210";
const PAPER = "#f7f4ef";
const BASIL = "#2f7d4f";
const CHEESE = "#ffc93c";

const W = 800;
const CX = W / 2;
/** vertical gap between branch joints on the trunk (same side: twice this) */
const STEP = 70;
const f1 = (n: number) => Math.round(n * 10) / 10;
const pt = (p: number[]) => `${f1(p[0])} ${f1(p[1])}`;

function bez(p0: number[], p1: number[], p2: number[], p3: number[], t: number) {
  const u = 1 - t;
  const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
  return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
}

/** place a glyph() drawing (viewBox 0 0 100 100) as a nested svg */
function placeGlyph(id: Tool["glyph"], cx: number, cy: number, size: number) {
  return glyph(id).replace("<svg ", `<svg x="${f1(cx - size / 2)}" y="${f1(cy - size / 2)}" width="${size}" height="${size}" `);
}

function leaf(x: number, y: number, rot: number, s = 1) {
  return `<g data-part="leaf"><g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(rot)}) scale(${s})">` +
    `<path d="M-15 0Q-3 -12 15 0Q-3 12 -15 0Z" fill="${BASIL}" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>` +
    `<path d="M-11 0Q0 -1.5 11 0" fill="none" stroke="${INK}" stroke-width="1.4" stroke-linecap="round"/></g></g>`;
}

export interface TreeOpts {
  /** display name for a tool (classified tools hide theirs) */
  name(t: Tool): string;
}

export function treeSVG(tools: Tool[], o: TreeOpts): string {
  const n = Math.max(1, tools.length);
  const topJoint = 150;
  const ground = topJoint + 120 + (n - 1) * STEP;
  const H = ground + 70;
  const crown = topJoint - 78;
  const ht = halftone(2, INK, 4.6);
  const ht1 = halftone(1, INK, 4.6);

  // trunk half width at height y: wide at the root flare, narrow at the crown
  const half = (y: number) => {
    const t = Math.min(1, Math.max(0, (ground - y) / (ground - crown)));
    return 12 + 40 * Math.pow(1 - t, 1.4);
  };

  let branches = "", leaves = "", fruits = "";
  tools.forEach((tool, i) => {
    // the first tool is the lowest branch; sides alternate up the trunk
    const dir = i % 2 === 0 ? -1 : 1;
    const ay = ground - 120 - i * STEP;
    // lower branches reach further, with a little deterministic wobble
    const reach = Math.max(150, Math.min(300, 280 - (i / Math.max(1, n - 1)) * 90 + 34 * Math.sin(i * 2.3 + 0.7)));
    const rise = 60 + 13 * Math.cos(i * 1.7);
    const p0 = [CX + dir * (half(ay) - 3), ay];
    const p3 = [CX + dir * reach, ay - rise];
    const p1 = [p0[0] + dir * reach * 0.28, ay - rise * 0.85];
    const p2 = [p3[0] - dir * reach * 0.38, p3[1] + 4];
    const w = Math.max(3.4, 7.4 - (i * 3.6) / n);
    // a short twig near the tip rides along as a second subpath, so the
    // pathLength=1 dash draws it right after the branch
    const tw = bez(p0, p1, p2, p3, 0.62);
    branches += `<path data-part="branch" data-slug="${tool.slug}" pathLength="1" d="M${pt(p0)}C${pt(p1)} ${pt(p2)} ${pt(p3)}M${pt(tw)}q${f1(dir * 8)} -16 ${f1(dir * 22)} -22" fill="none" stroke="${INK}" stroke-width="${f1(w)}" stroke-linecap="round"/>`;
    [0.45, 0.74].forEach((t, j) => {
      const [lx, ly] = bez(p0, p1, p2, p3, t);
      leaves += leaf(lx, ly - 9, (j ? -32 : 28) * dir + (dir > 0 ? 0 : 180), j ? 0.9 : 1.05);
    });
    // fruit hangs from the tip
    const [tx, ty] = p3;
    const fy = ty + 26 + 30;
    const label = o.name(tool).toUpperCase();
    const lw = label.length * 6.9 + 14;
    fruits += `<g data-part="fruit" data-slug="${tool.slug}">` +
      `<path d="M${pt(p3)}V${f1(ty + 26)}" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>` +
      `<circle cx="${f1(tx + 4)}" cy="${f1(fy + 4)}" r="30" fill="${INK}"/>` +
      `<circle cx="${f1(tx)}" cy="${f1(fy)}" r="30" fill="${PAPER}" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M${f1(tx)} ${f1(fy - 30)}A30 30 0 0 1 ${f1(tx)} ${f1(fy + 30)}Z" fill="${ht1.fill}" opacity=".5"/>` +
      `<circle cx="${f1(tx)}" cy="${f1(fy)}" r="24.5" fill="none" stroke="${tool.color}" stroke-width="4" stroke-dasharray="6.4 3.2"/>` +
      placeGlyph(tool.glyph, tx, fy, 44) +
      `<rect x="${f1(tx - lw / 2)}" y="${f1(fy + 37)}" width="${f1(lw)}" height="16" rx="8" fill="${INK}"/>` +
      `<text class="sl-tree__fl" x="${f1(tx)}" y="${f1(fy + 48.6)}" text-anchor="middle" fill="${PAPER}" font-size="9.5" font-weight="600" letter-spacing=".1em">${label}</text>` +
      `</g>`;
  });

  // trunk: a tapered ink outline, halftone shade on the right, bark ticks
  const yMid = (ground + crown) / 2;
  const trunk = `M${CX - half(ground)} ${ground}C${CX - half(ground) + 12} ${ground - 70} ${CX - half(yMid) - 2} ${yMid} ${CX - half(crown)} ${crown}` +
    `Q${CX} ${crown - 10} ${CX + half(crown)} ${crown}` +
    `C${CX + half(yMid) + 2} ${yMid} ${CX + half(ground) - 12} ${ground - 70} ${CX + half(ground)} ${ground}Z`;
  let bark = "";
  for (let y = ground - 40, k = 0; y > crown + 40; y -= 46, k++) {
    const x = CX + 16 + (k % 2 ? 7 : 0);
    bark += `M${x} ${y}q${k % 2 ? 4 : -3} -12 ${k % 2 ? 1 : 2} -22`;
  }
  const trunkLabel = SITE.trunk.name.toUpperCase();
  const labelY = (ground + Math.max(crown + 80, ground - 120 - (n - 1) * STEP)) / 2;

  const roots =
    `<path d="M${CX - 24} ${ground}C${CX - 60} ${ground + 4} ${CX - 110} ${ground + 10} ${CX - 168} ${ground + 30}" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>` +
    `<path d="M${CX + 24} ${ground}C${CX + 60} ${ground + 4} ${CX + 110} ${ground + 10} ${CX + 168} ${ground + 30}" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>` +
    `<path d="M${CX - 90} ${ground + 9}q-14 10 -16 24M${CX + 90} ${ground + 9}q14 10 16 24" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>` +
    `<text class="sl-tree__fl" x="${CX - 176}" y="${ground + 50}" text-anchor="middle" fill="${INK}" font-size="11" font-weight="700">J.P.</text>` +
    `<text class="sl-tree__fl" x="${CX + 176}" y="${ground + 50}" text-anchor="middle" fill="${INK}" font-size="11" font-weight="700">P.M.</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false" data-scene="living-tree">
  <defs>${ht.def}${ht1.def}<clipPath id="sl-trunk-clip"><path d="${trunk}"/></clipPath></defs>
  <g data-part="ground">
    <ellipse cx="${CX}" cy="${ground + 10}" rx="330" ry="16" fill="${ht.fill}"/>
    <path d="M60 ${ground}H${W - 60}" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M110 ${ground + 14}H170M630 ${ground + 18}H700M250 ${ground + 22}H300" stroke="${INK}" stroke-width="1.6" stroke-linecap="round" opacity=".5"/>
  </g>
  <g data-part="roots">${roots}</g>
  <g data-part="branches">${branches}</g>
  <g data-part="leaves">${leaves}</g>
  <g data-part="trunk">
    <path d="${trunk}" fill="${PAPER}"/>
    <g clip-path="url(#sl-trunk-clip)">
      <rect x="${CX + 4}" y="${crown - 20}" width="60" height="${ground - crown + 40}" fill="${ht.fill}"/>
      <path d="${bark}" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" opacity=".7"/>
    </g>
    <path d="${trunk}" fill="none" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <text class="sl-tree__fl" transform="translate(${CX - 4} ${f1(labelY)}) rotate(-90)" text-anchor="middle" fill="${INK}" font-size="12" font-weight="700" letter-spacing=".24em">${trunkLabel}</text>
    <path d="M${CX} ${crown - 6}c-2 -14 4 -24 14 -30" fill="none" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/>
    ${leaf(CX + 16, crown - 38, -40, 0.85).replace('data-part="leaf"', 'data-part="sprout"')}
    <circle cx="${CX - 8}" cy="${crown - 18}" r="5" fill="${CHEESE}" stroke="${INK}" stroke-width="2"/>
  </g>
  <g data-part="fruits">${fruits}</g>
</svg>`;
}

/* ------------------------------------------------------------ growth rings */

/** full years since fall of `since` (rings close each Sept 1), plus the year in progress */
export function ringCount(since: number, now = new Date()) {
  let full = 0;
  while (new Date(since + full + 1, 8, 1) <= now) full++;
  return { full, start: since };
}

export function ringsSVG(since: number, now = new Date()) {
  const { full } = ringCount(since, now);
  const total = full + 1; // the outermost ring is still growing
  const c = 110, rMax = 90, rMin = 12;
  const ht = halftone(2, INK, 4);
  const wob = (r: number, k: number) => {
    let d = "";
    const N = 48;
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2;
      const rr = r * (1 + 0.035 * Math.sin(3 * a + k * 1.3) + 0.02 * Math.sin(5 * a + k * 2.1)) + (r > 30 ? 3 * Math.cos(a - 0.6) : 0);
      d += `${i ? "L" : "M"}${f1(c + Math.cos(a) * rr)} ${f1(c + Math.sin(a) * rr)}`;
    }
    return d + "Z";
  };
  const radius = (k: number) => rMin + ((k + 1) / total) * (rMax - rMin);
  let bands = "", lines = "", labels = "";
  // filled bands from the outside in: halftone on every other year
  for (let k = total - 1; k >= 0; k--) {
    bands += `<path d="${wob(radius(k), k)}" fill="${PAPER}"/>`;
    if (k % 2 === 0) bands += `<path d="${wob(radius(k), k)}" fill="${ht.fill}" opacity=".55"/>`;
  }
  for (let k = 0; k < total; k++) {
    const live = k === total - 1;
    lines += `<path class="sl-ring" pathLength="1" d="${wob(radius(k), k)}" fill="none" stroke="${live ? "#ff3b2f" : INK}" stroke-width="${live ? 2.6 : 1.8}"${live ? ` stroke-dasharray=".02 .02"` : ""}/>`;
    const r0 = k ? radius(k - 1) : rMin * 0.4;
    const x = c + (r0 + radius(k)) / 2 + 2;
    const yr = String(since + k).slice(2);
    labels += `<text class="sl-tree__fl" x="${f1(x)}" y="${c + 3.5}" text-anchor="middle" font-size="9" font-weight="700" fill="${live ? "#d92a1f" : INK}">${live ? "now" : `'${yr}`}</text>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220" aria-hidden="true" focusable="false">
  <defs>${ht.def}</defs>
  <path d="${wob(rMax + 10, 9)}" fill="#e9b46a" stroke="${INK}" stroke-width="3"/>
  <path d="${wob(rMax + 10, 9)}" fill="${ht.fill}" opacity=".35"/>
  ${bands}${lines}
  <path d="M${c} ${c}L${c + rMax + 6} ${c - 8}" stroke="${INK}" stroke-width="1.2" stroke-dasharray="3 3" opacity=".5"/>
  <circle cx="${c}" cy="${c}" r="4" fill="${INK}"/>
  ${labels}
</svg>`;
}
