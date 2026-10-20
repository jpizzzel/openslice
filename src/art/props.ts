// Reusable drawn props shared by mascots, glyphs, posters and scenes.
import { Kit, INK, TOMATO, TOMATO_DEEP, CHEESE, BASIL, PAPER, P, L, C, E, G, at, f1 } from "./core";

/** a pepperoni round */
export function pepperoni(k: Kit, x: number, y: number, r: number, w = 2.2): string {
  return G(
    C(0, 0, r, TOMATO, w) +
    C(0, 0, r * 0.74, k.ht(3, TOMATO_DEEP, 3.4)) +
    E(-r * 0.3, -r * 0.32, r * 0.2, r * 0.13, PAPER, 0, `opacity=".85" transform="rotate(-30 ${-r * 0.3} ${-r * 0.32})"`) +
    C(r * 0.35, r * 0.22, r * 0.09, PAPER, 0, `opacity=".8"`) +
    (r > 14
      ? [[-0.4, 0.35, 0.07], [0.1, -0.5, 0.06], [0.5, -0.2, 0.05], [-0.1, 0.55, 0.05], [0.05, 0.05, 0.08]].map(([u, v, q]) => C(r * u, r * v, r * q, PAPER, 0, `opacity=".7"`)).join("") +
        L(`M${-r * 0.5} ${r * 0.62}A${r * 0.8} ${r * 0.8} 0 0 0 ${r * 0.62} ${r * 0.45}`, r * 0.05, INK, `opacity=".35"`)
      : ""),
    at(x, y));
}

/** a sliced black olive ring */
export function olive(x: number, y: number, r: number, hole = CHEESE): string {
  return G(
    E(0, 0, r, r * 0.9, INK) +
    E(0.4, 0.3, r * 0.42, r * 0.36, hole) +
    L(`M${-r * 0.62} ${-r * 0.25}Q${-r * 0.4} ${-r * 0.65} 0 ${-r * 0.66}`, Math.max(1, r * 0.16), PAPER, `opacity=".7"`),
    at(x, y));
}

/** a basil leaf pointing up (local length ~20 * s) */
export function basilLeaf(x: number, y: number, rot = 0, s = 1, w = 2): string {
  return G(
    P("M0 -11C7 -7 8.5 3 0 11C-8.5 3 -7 -7 0 -11Z", BASIL, w / s) +
    L("M0 -8.5C.8 -2 .8 3 0 9", 1.1 / s, PAPER, `opacity=".75"`) +
    L("M0 -3L3.6 -6M0 2L4 -.6M0 -1L-3.8 -4M0 4L-3.8 1.6", 0.9 / s, PAPER, `opacity=".55"`),
    at(x, y, s, rot));
}

/** a mushroom slice */
export function mushroom(x: number, y: number, s = 1, rot = 0): string {
  return G(
    P("M-11 1C-12 -8 -5 -12 0 -12C5 -12 12 -8 11 1C7 3 4 2 3 2L4 10C4 12 -4 12 -4 10L-3 2C-5 2 -8 3 -11 1Z", PAPER, 2.2 / s) +
    L("M-7 -1C-4 -4 4 -4 7 -1M-2 4L-1.6 9M2 4L1.8 9", 1.1 / s, INK, `opacity=".6"`),
    at(x, y, s, rot));
}

/**
 * A sneaker, ankle at (0,0) in local space, toe pointing +x, sole at y≈15.
 * flip mirrors it so the toe points left.
 */
export function sneaker(k: Kit, x: number, y: number, flip = false, rot = 0, s = 1, accent = TOMATO): string {
  const body =
    // tongue + collar
    P("M-6 -8C-6 -13 3 -14 4 -9L5 -4", PAPER, 2.4) +
    // upper
    P("M-12 -3C-12 -8 -5 -9 -1 -7C5 -5 9 0 15 2C21 3.5 26 5.5 26 9.5L26 11L-14 11L-14 3C-14 0 -13 -2 -12 -3Z", PAPER, 2.8) +
    // side stripe
    P("M-8 8C-1 1 8 0 17 5L15 8.4C8 5.6 1 6.4 -4 9.6Z", accent, 1.6) +
    // toe cap + heel tab
    L("M15 10.6C16.6 5.6 21 4.6 25.8 7.6", 1.6) +
    P("M-14 1C-16 -2 -15.4 -5 -12.4 -5", "none", 2) +
    // laces
    L("M-1 -6.4L3 -8.4M2 -4.6L6 -6.4M5 -2.6L8.6 -4.2", 1.5) +
    // sole
    P("M-15.5 10.5L27 10.5C29.4 10.5 29.4 16 26.4 16L-13.6 16C-17 16 -17.4 10.5 -15.5 10.5Z", PAPER, 2.8) +
    P("M-15.6 13.6L28.4 13.6", "none", 1.1) +
    P("M-14 14.2L27 14.2L26.2 15.6L-13.4 15.6Z", k.ht(2), 0);
  const t = `translate(${x} ${y})${rot ? ` rotate(${rot})` : ""}${flip ? " scale(-1 1)" : ""}${s !== 1 ? ` scale(${s})` : ""}`;
  return G(body, `transform="${t}"`);
}

/**
 * A pizza box in a frontal 3/4 view. (x,y) is the top-left of the front face.
 * w width, h front height, d lid depth (how far the top recedes), s lid skew.
 * Paper stock, ink outline, halftone shading, a tomato logo.
 */
export function pizzaBox(k: Kit, x: number, y: number, w: number, h: number, d: number, s = 0, logo = true, sw = 3): string {
  const tx = x + w / 2 + s / 2, ty = y - d / 2;
  const lr = Math.min(w * 0.17, 26);
  return G(
    // front face
    P(`M${x} ${y}L${x + w} ${y}L${x + w} ${y + h}L${x} ${y + h}Z`, PAPER, sw) +
    P(`M${x + sw / 2} ${y + h * 0.32}L${x + w - sw / 2} ${y + h * 0.32}L${x + w - sw / 2} ${y + h - sw / 2}L${x + sw / 2} ${y + h - sw / 2}Z`, k.ht(1), 0) +
    P(`M${x + w * 0.58} ${y}L${x + w} ${y}L${x + w} ${y + h}L${x + w * 0.72} ${y + h}Z`, k.ht(2), 0) +
    L(`M${x + 3} ${y + h * 0.32}L${x + w - 3} ${y + h * 0.32}`, sw * 0.45) +
    // vents
    [0.2, 0.4, 0.6, 0.8].map((f) => P(`M${x + w * f - 5} ${y + h * 0.66}h10`, "none", sw * 0.75)).join("") +
    // lid
    P(`M${x} ${y}L${x + w} ${y}L${x + w + s} ${y - d}L${x + s} ${y - d}Z`, PAPER, sw) +
    P(`M${x + w * 0.66 + s * 0.5} ${y - d}L${x + w + s} ${y - d}L${x + w} ${y}L${x + w * 0.78} ${y}Z`, k.ht(1), 0) +
    (logo
      ? E(tx, ty, lr, Math.min(d * 0.3, lr * 0.55), TOMATO, sw * 0.6) +
        P(`M${tx - lr * 0.5} ${ty - d * 0.1}L${tx + lr * 0.5} ${ty - d * 0.1}L${tx} ${ty + d * 0.17}Z`, PAPER, sw * 0.4) +
        L(`M${tx - lr * 0.5} ${ty - d * 0.1}L${tx + lr * 0.5} ${ty - d * 0.1}`, sw * 0.9, INK)
      : ""),
    "");
}

/** an ink leaf (local length ~22 * s): paper or spot fill, halftone on one half, ink midrib */
export function inkLeaf(k: Kit, x: number, y: number, rot = 0, s = 1, fill = PAPER, w = 2): string {
  return G(
    P("M0 -11C7 -7 8.5 3 0 11C-8.5 3 -7 -7 0 -11Z", fill, w / s) +
    P("M0 -11C7 -7 8.5 3 0 11Z", k.ht(2, INK, f1(4.2 / s)), 0) +
    L("M0 -8C.7 -2 .7 3 0 9", 1.2 / s) +
    P("M0 -11C7 -7 8.5 3 0 11C-8.5 3 -7 -7 0 -11Z", "none", w / s),
    at(x, y, s, rot));
}

/** a whole pizza seen from above (radius r): paper cheese, halftone crust, tomato pepperoni */
export function pizzaTop(k: Kit, cx: number, cy: number, r: number, cuts = 8, sw = 3): string {
  const ri = r * 0.8;
  let cutsMk = "";
  for (let i = 0; i < cuts; i++) {
    const a = (i / cuts) * Math.PI * 2 + 0.2;
    cutsMk += `M${(cx + Math.cos(a) * ri * 0.12).toFixed(1)} ${(cy + Math.sin(a) * ri * 0.12).toFixed(1)}L${(cx + Math.cos(a) * ri).toFixed(1)} ${(cy + Math.sin(a) * ri).toFixed(1)}`;
  }
  const tops: string[] = [];
  const pos = [[0.5, -0.9], [-0.55, -0.35], [0.15, 0.55], [0.62, 0.35], [-0.35, 0.62], [-0.05, -0.2], [0.42, -0.25], [-0.62, 0.15]];
  pos.forEach(([u, v], i) => {
    const px = cx + u * ri * 0.7, py = cy + v * ri * 0.7;
    tops.push(i % 3 === 2 ? inkLeaf(k, px, py, i * 40, r / 52, PAPER, 2) : pepperoni(k, px, py, r * 0.13, sw * 0.6));
  });
  const ring = (rr: number) => `M${cx - rr} ${cy}a${rr} ${rr} 0 1 0 ${rr * 2} 0a${rr} ${rr} 0 1 0 ${-rr * 2} 0Z`;
  const sh = (rr: number, push: number) =>
    `M${(cx + rr * Math.cos(-0.7)).toFixed(1)} ${(cy + rr * Math.sin(-0.7)).toFixed(1)}A${rr} ${rr} 0 0 1 ${(cx + rr * Math.cos(2.27)).toFixed(1)} ${(cy + rr * Math.sin(2.27)).toFixed(1)}A${rr * push} ${rr * push} 0 0 0 ${(cx + rr * Math.cos(-0.7)).toFixed(1)} ${(cy + rr * Math.sin(-0.7)).toFixed(1)}Z`;
  return G(
    C(cx, cy, r, PAPER, sw) +
    `<path d="${ring(r) + ring(ri)}" fill="${k.ht(1)}" fill-rule="evenodd"/>` +
    `<path d="${sh(r, 1.2)}" fill="${k.ht(2)}"/>` +
    C(cx, cy, ri, PAPER, sw * 0.6) +
    `<path d="${sh(ri, 1.35)}" fill="${k.ht(1)}"/>` +
    L(cheeseBlob(cx, cy, ri * 0.86, 11), sw * 0.35, INK, `opacity=".5"`) +
    L(cutsMk, sw * 0.42) +
    tops.join("") +
    L(`M${cx - r * 0.84} ${cy - r * 0.18}A${r * 0.9} ${r * 0.9} 0 0 1 ${cx - r * 0.36} ${cy - r * 0.8}`, sw * 0.45, INK, `opacity=".6"`));
}

/** a wobbly cheese blob path */
export function cheeseBlob(cx: number, cy: number, r: number, n: number): string {
  let d = "";
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (i % 2 ? 0.93 : 1);
    const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
    if (i === 0) d += `M${x.toFixed(1)} ${y.toFixed(1)}`;
    else {
      const am = ((i - 0.5) / n) * Math.PI * 2;
      const qx = cx + Math.cos(am) * r * 1.04, qy = cy + Math.sin(am) * r * 1.04;
      d += `Q${qx.toFixed(1)} ${qy.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
  }
  return d + "Z";
}

/** a laptop seen from the front-ish, base centered at (cx, y). variant decides the sticker */
export function laptop(k: Kit, cx: number, y: number, w: number, variant: "win" | "mac" | "plain" = "plain", sw = 3): string {
  const h = w * 0.62, x = cx - w / 2, top = y - h;
  const sticker =
    variant === "win"
      ? G(P("M-7 -6L-1 -7L-1 -1L-7 -.4ZM1 -7.3L8 -8.3L8 -1L1 -1ZM-7 1.2L-1 1.2L-1 7.4L-7 6.6ZM1 1.2L8 1.2L8 8.6L1 7.6Z", CHEESE, 1.2), at(cx + w * 0.22, top + h * 0.3, w / 120, -10))
      : variant === "mac"
        ? G(C(0, 0, 9.5, BASIL, 1.4) + cmdKey(0, 0, 1, PAPER, 1.3), at(cx - w * 0.22, top + h * 0.34, w / 120, 8))
        : "";
  return G(
    // lid (back of screen faces viewer: we see the lid exterior)
    P(`M${x + 4} ${top}Q${x} ${top} ${x} ${top + 4}L${x} ${y}L${x + w} ${y}L${x + w} ${top + 4}Q${x + w} ${top} ${x + w - 4} ${top}Z`, PAPER, sw) +
    P(`M${cx + w * 0.1} ${top + 1.5}L${x + w - 2} ${top + 1.5}L${x + w - 2} ${y - 1}L${cx + w * 0.28} ${y - 1}Z`, k.ht(1), 0) +
    sticker +
    // base
    P(`M${x - w * 0.08} ${y}L${x + w * 1.08} ${y}L${x + w * 1.04} ${y + w * 0.06}L${x - w * 0.04} ${y + w * 0.06}Z`, PAPER, sw) +
    L(`M${cx - w * 0.12} ${y + w * 0.03}H${cx + w * 0.12}`, sw * 0.5),
    "");
}

/** the command-key loop symbol, ~12 units across at s=1 */
export function cmdKey(x: number, y: number, s = 1, color = INK, w = 1.4): string {
  const a = 1.9, r = 1.9, b = a + r;
  return G(
    L(`M${-a} ${-b}V${b}M${a} ${-b}V${b}M${-b} ${-a}H${b}M${-b} ${a}H${b}`, w, color) +
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => C(u * b, v * b, r, "none", 0, `stroke="${color}" stroke-width="${w}"`)).join(""),
    at(x, y, s));
}
