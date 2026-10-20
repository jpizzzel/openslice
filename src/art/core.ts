// Shared primitives for the art library: palette, svg wrapper, unique ids,
// halftone patterns, stroke helpers and a seeded RNG.

export const INK = "#141210";
export const TOMATO = "#ff3b2f";
export const TOMATO_DEEP = "#d92a1f";
export const CHEESE = "#ffc93c";
export const CRUST = "#e9b46a";
export const BASIL = "#2f7d4f";
export const PAPER = "#f7f4ef";
export const FLOUR = "#efebe4";
export const GRAY = "#8a837a";

export const F_MONO = `'JetBrains Mono Variable','JetBrains Mono',ui-monospace,monospace`;
export const F_DISPLAY = `'Big Shoulders Display Variable','Big Shoulders Display',Impact,sans-serif`;
export const F_SERIF = `'Instrument Serif',Georgia,serif`;

export interface ArtOpts {
  /** accessible label; when omitted the svg is aria-hidden */
  label?: string;
  className?: string;
}

let counter = 0;

/**
 * A drawing kit scoped to one <svg> instance. Every id it hands out carries a
 * per-call prefix, so many copies of the same drawing can sit on one page.
 */
export class Kit {
  readonly id: string;
  private defs: string[] = [];
  private made = new Set<string>();
  constructor() {
    this.id = `os${(++counter).toString(36)}`;
  }
  /** unique id inside this svg */
  uid(name: string): string {
    return `${this.id}-${name.replace(/[^\w-]/g, "_")}`;
  }
  /** register a def once (keyed) and return its url() reference */
  def(key: string, make: (id: string) => string): string {
    const id = this.uid(key);
    if (!this.made.has(key)) {
      this.made.add(key);
      this.defs.push(make(id));
    }
    return `url(#${id})`;
  }
  /** halftone dot fill. tone 1 (light) .. 4 (heavy); color defaults to ink */
  ht(tone: 1 | 2 | 3 | 4 = 2, color = INK, size = 4.2): string {
    const r = [0, 0.62, 0.92, 1.25, 1.6][tone] * (size / 4.2);
    return this.def(`ht${tone}${color.slice(1)}${size}`, (id) =>
      `<pattern id="${id}" width="${size}" height="${size}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">` +
      `<circle cx="${size / 2}" cy="${size / 2}" r="${r.toFixed(2)}" fill="${color}"/></pattern>`);
  }
  /** diagonal hatch lines */
  hatch(gap = 5, color = INK, w = 1, angle = 45): string {
    return this.def(`hx${gap}${color.slice(1)}${w}${angle}`, (id) =>
      `<pattern id="${id}" width="${gap}" height="${gap}" patternUnits="userSpaceOnUse" patternTransform="rotate(${angle})">` +
      `<line x1="0" y1="0" x2="0" y2="${gap}" stroke="${color}" stroke-width="${w}"/></pattern>`);
  }
  /** a clipPath from markup; returns url() */
  clip(key: string, shape: string): string {
    return this.def(`c${key}`, (id) => `<clipPath id="${id}">${shape}</clipPath>`);
  }
  /** close over defs, wrap an svg */
  wrap(viewBox: string, body: string, opts: ArtOpts = {}, extra = ""): string {
    const defs = this.defs.length ? `<defs>${this.defs.join("")}</defs>` : "";
    return svg(viewBox, defs + body, opts, extra);
  }
}

export function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function svg(viewBox: string, body: string, opts: ArtOpts = {}, extra = ""): string {
  const a11y = opts.label ? `role="img" aria-label="${esc(opts.label)}"` : `aria-hidden="true" focusable="false"`;
  const cls = opts.className ? ` class="${esc(opts.className)}"` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"${cls} ${a11y}${extra ? " " + extra : ""}>${body}</svg>`;
}

/** stroke attributes */
export const sk = (w: number, color = INK) =>
  `stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;

/** filled + stroked path */
export const P = (d: string, fill = "none", w = 3, extra = "") =>
  `<path d="${d}" fill="${fill}"${w ? " " + sk(w) : ""}${extra ? " " + extra : ""}/>`;

/** stroke-only line path */
export const L = (d: string, w = 2, color = INK, extra = "") =>
  `<path d="${d}" fill="none" ${sk(w, color)}${extra ? " " + extra : ""}/>`;

export const C = (cx: number, cy: number, r: number, fill = "none", w = 0, extra = "") =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"${w ? " " + sk(w) : ""}${extra ? " " + extra : ""}/>`;

export const E = (cx: number, cy: number, rx: number, ry: number, fill = "none", w = 0, extra = "") =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}"${w ? " " + sk(w) : ""}${extra ? " " + extra : ""}/>`;

export const G = (body: string, attrs = "") => `<g${attrs ? " " + attrs : ""}>${body}</g>`;

/** translate / rotate / scale a group */
export const at = (x: number, y: number, s = 1, r = 0) =>
  `transform="translate(${x} ${y})${r ? ` rotate(${r})` : ""}${s !== 1 ? ` scale(${s})` : ""}"`;

/** an outlined tube (limbs, handles): ink stroke with a lighter core */
export const tube = (d: string, w = 7, core = PAPER, edge = 2.6) =>
  `<path d="${d}" fill="none" ${sk(w + edge * 2)}/><path d="${d}" fill="none" ${sk(w, core)}/>`;

/** Mulberry32 seeded random */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export const f1 = (n: number) => Math.round(n * 10) / 10;

/** approximate object bounding box of markup (paths, circles, ellipses, rects) */
export function bbox(markup: string): [number, number, number, number] {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const add = (x: number, y: number) => {
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  };
  for (const m of markup.matchAll(/\sd="([^"]+)"/g)) {
    const toks = m[1].match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g) || [];
    let cmd = "M", cx = 0, cy = 0, sx = 0, sy = 0, i = 0;
    const num = () => parseFloat(toks[i++]);
    while (i < toks.length) {
      if (/[a-zA-Z]/.test(toks[i])) cmd = toks[i++];
      const rel = cmd === cmd.toLowerCase();
      const C0 = cmd.toUpperCase();
      if (C0 === "Z") { cx = sx; cy = sy; continue; }
      const n = { M: 2, L: 2, T: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, A: 7 }[C0] ?? 2;
      const v: number[] = [];
      for (let k = 0; k < n; k++) v.push(num());
      if (v.some(Number.isNaN)) break;
      if (C0 === "H") { cx = rel ? cx + v[0] : v[0]; add(cx, cy); continue; }
      if (C0 === "V") { cy = rel ? cy + v[0] : v[0]; add(cx, cy); continue; }
      if (C0 === "A") {
        const nx = rel ? cx + v[5] : v[5], ny = rel ? cy + v[6] : v[6];
        add(nx, ny); cx = nx; cy = ny; continue;
      }
      for (let k = 0; k < n; k += 2) add(rel ? cx + v[k] : v[k], rel ? cy + v[k + 1] : v[k + 1]);
      const nx = rel ? cx + v[n - 2] : v[n - 2], ny = rel ? cy + v[n - 1] : v[n - 1];
      cx = nx; cy = ny;
      if (C0 === "M") { sx = cx; sy = cy; cmd = rel ? "l" : "L"; }
    }
  }
  for (const m of markup.matchAll(/<(circle|ellipse)\s[^>]*>/g)) {
    const g = (k: string) => parseFloat((m[0].match(new RegExp(`\\s${k}="(-?[\\d.]+)"`)) || [])[1] ?? "0");
    const rx = m[1] === "circle" ? g("r") : g("rx"), ry = m[1] === "circle" ? g("r") : g("ry");
    add(g("cx") - rx, g("cy") - ry); add(g("cx") + rx, g("cy") + ry);
  }
  return [x0, y0, x1, y1];
}

/**
 * A data-part group with a transform origin at pivot (in the drawing's own
 * coordinates) expressed as fill-box percentages, so CSS/GSAP rotations hinge
 * at the right spot even when the svg is nested and scaled.
 */
export function part(name: string, pivot: [number, number] | null, body: string, attrs = ""): string {
  let style = "";
  if (pivot) {
    const [x0, y0, x1, y1] = bbox(body);
    const px = x1 > x0 ? ((pivot[0] - x0) / (x1 - x0)) * 100 : 50;
    const py = y1 > y0 ? ((pivot[1] - y0) / (y1 - y0)) * 100 : 50;
    style = ` style="transform-box:fill-box;transform-origin:${f1(px)}% ${f1(py)}%"`;
  }
  return `<g data-part="${name}"${style}${attrs ? " " + attrs : ""}>${body}</g>`;
}
