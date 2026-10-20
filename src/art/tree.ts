// A small ink tree for the footer "living trunk". 120 x 120.
// The stump beside it shows one growth ring per year; the crown carries
// years * 3 leaves. Everything is seeded, so the same input draws the same tree.
import { Kit, INK, BASIL, PAPER, P, L, C, E, G, at, rng, f1, ArtOpts } from "./core";

export interface MiniTreeOpts extends ArtOpts {
  /** vary the layout while staying deterministic (default 1) */
  seed?: number;
}

const GROUND = 106;

/** a wobbly closed ring around (cx, cy) */
function ring(cx: number, cy: number, rx: number, ry: number, r: () => number, wob: number): string {
  const n = 22;
  const ph = r() * Math.PI * 2;
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + Math.sin(a * 3 + ph) * wob + (r() - 0.5) * wob;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  // smooth closed curve through the points (Catmull-Rom as cubic Beziers)
  let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)} ${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)} ${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])} ${f1(p2[1])}`;
  }
  return d + "Z";
}

const LEAF = "M0 -6C3.8 -3.8 4.6 1.6 0 6C-4.6 1.6 -3.8 -3.8 0 -6Z";

export function miniTree(years: number, opts: MiniTreeOpts = {}): string {
  const k = new Kit();
  const y = Math.max(0, Math.min(200, Math.floor(Number.isFinite(years) ? years : 0)));
  const r = rng(0x7ee + (opts.seed ?? 1) * 7919);
  const grow = Math.min(y, 12) / 12; // 0..1, the tree matures over a dozen years

  // ---- tree
  const tx = 42;
  const trunkTop = GROUND - (22 + grow * 34);
  const tw = 2.4 + grow * 4.2; // half width at the base
  const crownCy = trunkTop - 6 - grow * 6;
  const crownRx = 9 + grow * 25, crownRy = 8 + grow * 21;
  const trunk =
    `M${f1(tx - tw - 3)} ${GROUND}C${f1(tx - tw)} ${GROUND - 4} ${f1(tx - tw * 0.55)} ${GROUND - 14} ${f1(tx - tw * 0.4)} ${f1(trunkTop)}` +
    `L${f1(tx + tw * 0.4)} ${f1(trunkTop)}C${f1(tx + tw * 0.55)} ${GROUND - 14} ${f1(tx + tw)} ${GROUND - 4} ${f1(tx + tw + 3)} ${GROUND}Z`;
  let boughs = "";
  if (y >= 2) {
    const nb = Math.min(2 + Math.floor(y / 3), 6);
    for (let i = 0; i < nb; i++) {
      const side = i % 2 ? 1 : -1;
      const sy = trunkTop + 4 + (i >> 1) * 3;
      const ex = tx + side * crownRx * (0.4 + r() * 0.35), ey = crownCy - crownRy * (0.05 + r() * 0.45);
      boughs += `M${tx} ${f1(sy)}Q${f1(tx + side * 3)} ${f1(ey + 4)} ${f1(ex)} ${f1(ey)}`;
    }
  }
  // leaves on a sunflower spiral, each a little basil leaf
  const n = y * 3;
  const ls = n <= 12 ? 1.05 : Math.max(0.5, 1.05 - (n - 12) / 160);
  let leaves = "", leafShade = "";
  for (let i = 0; i < n; i++) {
    const t = Math.sqrt((i + 0.5) / Math.max(n, 1));
    const a = i * 2.39996 + r() * 0.5;
    const lx = tx + Math.cos(a) * crownRx * t * 0.92;
    const ly = crownCy + Math.sin(a) * crownRy * t * 0.92 - (n < 6 ? 4 : 0);
    const rot = (a * 180) / Math.PI + 90 + (r() - 0.5) * 50;
    const s = ls * (0.85 + r() * 0.3);
    const tr = at(f1(lx), f1(ly), f1(s), Math.round(rot));
    leaves += G(P(LEAF, BASIL, 1.1 / s) + L("M0 -4V4", 0.7 / s, PAPER, `opacity=".7"`), tr);
    // the lower right of the crown sits in shadow
    if (lx > tx - 2 && ly > crownCy - 2) leafShade += G(`<path d="M0 -6C3.8 -3.8 4.6 1.6 0 6Z" fill="${k.ht(3, INK, 2.6)}"/>`, tr);
  }
  const crownBack = y > 0 ? E(tx + 2, crownCy + 2, crownRx * 0.95, crownRy * 0.92, k.ht(1, INK, 3)) : "";

  // ---- stump with one ring per year
  const sx = 92, sTop = 84, srx = 18, sry = 7;
  let rings = "";
  const rr = rng(0x51ce + (opts.seed ?? 1) * 104729 + y);
  for (let i = y; i >= 1; i--) {
    const f = i / (y + 0.6);
    const wob = 0.025 + 0.03 * f;
    rings += `<path d="${ring(sx + (1 - f) * 0.8, sTop + (1 - f) * 0.3, srx * 0.86 * f, sry * 0.86 * f, rr, wob)}" fill="none" stroke="${INK}" stroke-width="${y > 14 ? 0.4 : y > 6 ? 0.6 : 0.8}"/>`;
  }
  const side = `M${sx - srx} ${sTop}V${GROUND - 1}Q${sx} ${GROUND + 4} ${sx + srx} ${GROUND - 1}V${sTop}Z`;
  const stump =
    P(side, PAPER, 0) +
    `<path d="${side}" fill="${k.ht(1, INK, 3)}"/>` +
    `<path d="M${sx + 3} ${sTop}H${sx + srx}V${GROUND - 1}Q${sx + 9} ${GROUND + 2} ${sx + 4} ${GROUND + 1.6}Z" fill="${k.ht(3, INK, 3)}"/>` +
    L(`M${sx - 10} ${sTop + 6}V${GROUND - 3}M${sx - 4} ${sTop + 7}V${GROUND - 4}M${sx + 7} ${sTop + 6}V${GROUND - 3}`, 0.9) +
    P(side, "none", 1.8) +
    // a root flaring into the ground
    L(`M${sx - srx} ${GROUND - 2}Q${sx - srx - 3} ${GROUND} ${sx - srx - 6} ${GROUND}M${sx + srx} ${GROUND - 2}Q${sx + srx + 3} ${GROUND} ${sx + srx + 6} ${GROUND}`, 1.6) +
    E(sx, sTop, srx, sry, PAPER, 0) +
    rings +
    C(sx + 0.8, sTop + 0.3, y > 0 ? 0.9 : 0.6, INK) +
    // a radial crack, like real stumps
    L(`M${sx + 1} ${sTop}L${sx + srx * 0.7} ${sTop - sry * 0.5}`, 0.6) +
    E(sx, sTop, srx, sry, "none", 1.8);

  const body =
    // ground
    E(66, GROUND + 3, 52, 3.4, k.ht(2, INK, 3)) +
    L(`M8 ${GROUND}H112`, 1.6) +
    L(`M14 ${GROUND + 6}h10M60 ${GROUND + 7}h14M100 ${GROUND + 6}h6`, 1, INK, `opacity=".5"`) +
    G(
      crownBack +
      L(boughs, 1.4 + grow * 0.8) +
      P(trunk, PAPER, 0) +
      `<path d="${trunk}" fill="${k.ht(2, INK, 3)}" clip-path="${k.clip("trunkR", `<rect x="${tx + 0.5}" y="0" width="60" height="120"/>`)}"/>` +
      P(trunk, "none", 1.6 + grow * 0.6) +
      (y >= 4 ? L(`M${tx - 1} ${GROUND - 6}Q${tx} ${f1(GROUND - 16)} ${tx - 0.6} ${f1(trunkTop + 8)}`, 0.7, INK, `opacity=".6"`) : "") +
      (y === 0 ? L(`M${tx} ${f1(trunkTop)}l-3 -4M${tx} ${f1(trunkTop)}l3 -5`, 1.2) : "") +
      leaves + leafShade,
      `data-part="tree"`) +
    G(stump, `data-part="stump"`);
  return k.wrap("0 0 120 120", G(body, `data-years="${y}"`), opts);
}
