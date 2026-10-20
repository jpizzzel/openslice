// Generative 400 x 500 posters, one composition family per tool glyph.
// Deterministic: all variation comes from a seeded RNG keyed on the slug.
import type { Tool } from "../data/site";
import { TOOLS, STATUS_LABEL } from "../data/site";
import { Kit, INK, TOMATO, CHEESE, PAPER, F_MONO, F_DISPLAY, F_SERIF, P, L, C, G, rng, hash, esc, f1, ArtOpts } from "./core";
import { glyphBody, sparkleD } from "./glyphs";

const W = 400, H = 500, M = 22;

/** text helper */
export function T(x: number, y: number, s: string, size: number, fill = INK, font = F_MONO, extra = ""): string {
  return `<text x="${x}" y="${y}" font-family="${font}" font-size="${size}" fill="${fill}"${extra ? " " + extra : ""}>${esc(s)}</text>`;
}

const mono = (x: number, y: number, s: string, fill = INK, anchor = "start", size = 9) =>
  T(x, y, s.toUpperCase(), size, fill, F_MONO, `letter-spacing=".08em" font-weight="500" text-anchor="${anchor}"`);

const display = (x: number, y: number, s: string, size: number, fill: string, len?: number, extra = "") =>
  T(x, y, s.toUpperCase(), size, fill, F_DISPLAY, `font-weight="900" letter-spacing="-.01em"${len ? ` textLength="${len}" lengthAdjust="spacingAndGlyphs"` : ""}${extra ? " " + extra : ""}`);

/** a field of halftone dots whose radius comes from fn (0 = no dot) */
export function dotField(x0: number, y0: number, w: number, h: number, step: number, fn: (x: number, y: number) => number): string {
  let d = "";
  for (let j = 0, y = y0; y <= y0 + h; j++, y += step * 0.866) {
    for (let x = x0 + (j % 2 ? step / 2 : 0); x <= x0 + w; x += step) {
      const r = fn(x, y);
      if (r > 0.25) d += `M${f1(x - r)} ${f1(y)}a${f1(r)} ${f1(r)} 0 1 0 ${f1(r * 2)} 0a${f1(r)} ${f1(r)} 0 1 0 ${f1(-r * 2)} 0`;
    }
  }
  return d;
}

/** swiss grid + corner registration marks */
function grid(color: string, op = 0.35, cols = 4): string {
  let d = `M${M} ${M}V${H - M}M${W - M} ${M}V${H - M}M${M} ${M}H${W - M}M${M} ${H - M}H${W - M}`;
  for (let i = 1; i < cols; i++) {
    const x = f1(M + ((W - M * 2) * i) / cols);
    d += `M${x} ${M}V${M + 8}M${x} ${H - M - 8}V${H - M}`;
  }
  const reg = [[M, M], [W - M, M], [M, H - M], [W - M, H - M]]
    .map(([x, y]) => `M${x - 8} ${y}H${x + 8}M${x} ${y - 8}V${y + 8}`).join("");
  return L(d, 0.7, color, `opacity="${op}"`) + L(reg, 0.9, color) +
    [[M, M], [W - M, M], [M, H - M], [W - M, H - M]].map(([x, y]) => C(x, y, 3.4, "none", 0, `stroke="${color}" stroke-width=".9"`)).join("");
}

function header(tool: Tool, idx: number, color: string): string {
  return mono(M + 10, M + 20, `N°${String(idx + 1).padStart(2, "0")}`, color) +
    mono(W / 2, M + 20, tool.kind, color, "middle") +
    mono(W - M - 10, M + 20, String(tool.year), color, "end");
}

function footer(tool: Tool, color: string, y = H - M - 12): string {
  return mono(M + 10, y, tool.platform, color) + mono(W - M - 10, y, STATUS_LABEL[tool.status], color, "end");
}

/** a round status sticker with text on a circle */
function stamp(k: Kit, cx: number, cy: number, r: number, label: string, fill: string, ink: string, rot = 0): string {
  const id = k.uid(`ring${cx}${cy}`);
  const rr = r - 9;
  return G(
    C(0, 0, r, fill, 2.4) + C(0, 0, r - 16, "none", 0, `stroke="${ink}" stroke-width="1.2"`) +
    `<path id="${id}" d="M${-rr} 0A${rr} ${rr} 0 1 1 ${rr} 0A${rr} ${rr} 0 1 1 ${-rr} 0" fill="none"/>` +
    `<text font-family="${F_MONO}" font-size="8.4" font-weight="600" letter-spacing=".14em" fill="${ink}"><textPath href="#${id}">${esc(`${label} · ${label} · `.toUpperCase())}</textPath></text>` +
    P(sparkleD(0, 0, r * 0.34), ink, 0),
    `transform="translate(${cx} ${cy}) rotate(${rot})"`);
}

function bigGlyph(k: Kit, id: string, cx: number, cy: number, size: number, rot = 0): string {
  const s = size / 100;
  return G(glyphBody(k, id), `transform="translate(${cx} ${cy}) rotate(${rot}) scale(${s}) translate(-50 -50)"`);
}

/** shorten at a word boundary */
const trim = (s: string, n: number) => (s.length <= n ? s : s.slice(0, s.lastIndexOf(" ", n)));

/* ------------------------------------------------------------ layouts */

type Layout = (k: Kit, t: Tool, idx: number, r: () => number) => string;

/** A: a paper sun with a halftone shadow, giant glyph, name at the foot */
const sun: Layout = (k, t, idx, r) => {
  const cx = 200, cy = 222, R = 142;
  const clip = k.clip("sun", `<circle cx="${cx}" cy="${cy}" r="${R}"/>`);
  const tilt = f1(-8 + r() * 16);
  return (
    `<rect width="${W}" height="${H}" fill="${t.color}"/>` +
    `<path d="${dotField(0, 0, W, H, 9, (x, y) => Math.max(0, (y - 260) / 240) * 2.6 * (0.6 + 0.4 * Math.sin(x / 40)))}" fill="${INK}" opacity=".22"/>` +
    C(cx + 10, cy + 12, R, INK) +
    C(cx, cy, R, PAPER, 2.6) +
    G(`<path d="${dotField(cx - R, cy - R, R * 2, R * 2, 8, (x, y) => {
      const d = Math.hypot(x - (cx - 60), y - (cy - 70));
      return Math.max(0, (d - 110) / 150) * 3.4;
    })}" fill="${INK}"/>`, `clip-path="${clip}"`) +
    L(`M${cx - R - 18} ${cy}H${cx + R + 18}M${cx} ${cy - R - 18}V${cy + R + 18}`, 0.8, INK, `opacity=".5"`) +
    bigGlyph(k, t.glyph, cx, cy, 230, Number(tilt)) +
    grid(INK, 0.4) +
    header(t, idx, INK) +
    display(M + 8, 452, t.name, 112, INK, W - M * 2 - 16) +
    stamp(k, 318, 92, 44, STATUS_LABEL[t.status], CHEESE, INK, -14) +
    footer(t, INK, H - M - 8)
  );
};

/** B: paper sheet, a tall color band carrying the name sideways, glyph overlapping the seam */
const band: Layout = (k, t, idx, r) => {
  const bx = 150;
  return (
    `<rect width="${W}" height="${H}" fill="${PAPER}"/>` +
    `<rect width="${bx}" height="${H}" fill="${t.color}"/>` +
    `<path d="${dotField(0, 0, bx, H, 8, (_x, y) => Math.max(0, 1 - y / 420) * 3)}" fill="${INK}" opacity=".85"/>` +
    `<path d="${dotField(bx, 300, W - bx, 200, 10, (x, y) => Math.max(0, (y - 330) / 170) * 2.6 * Math.max(0, 1 - (x - bx) / 260))}" fill="${t.color}"/>` +
    display(0, 0, t.name, 150, PAPER, 440, `transform="translate(${bx - 22} ${H - 30}) rotate(-90)"`) +
    L(`M${bx} 0V${H}`, 2.6) +
    // concentric target behind the glyph
    [118, 96, 74].map((rr, i) => C(bx + 70, 236, rr, i === 0 ? CHEESE : "none", i === 0 ? 2.6 : 0, i ? `stroke="${INK}" stroke-width="1" stroke-dasharray="${2 + i * 2} 5"` : "")).join("") +
    bigGlyph(k, t.glyph, bx + 70, 236, 210, f1(-6 + r() * 12)) +
    grid(INK, 0.35) +
    mono(bx + 18, M + 20, `N°${String(idx + 1).padStart(2, "0")} / ${t.kind}`) +
    mono(W - M - 10, M + 20, String(t.year), INK, "end") +
    T(bx + 18, 404, t.replaces ? `after ${t.replaces}` : t.kind, 21, INK, F_SERIF, `font-style="italic"`) +
    L(`M${bx + 18} 418H${W - M - 10}`, 1) +
    mono(bx + 18, 436, t.platform) +
    mono(W - M - 10, 436, STATUS_LABEL[t.status], TOMATO, "end") +
    stamp(k, W - 62, 104, 36, t.platform, PAPER, INK, 12)
  );
};

/** C: ink night, sound rings in the tool color, paper type */
const rings: Layout = (k, t, idx) => {
  const cx = 200, cy = 250;
  let arcs = "";
  for (let i = 0; i < 9; i++) {
    const rr = 96 + i * 24;
    arcs += C(cx, cy, rr, "none", 0, `stroke="${i % 3 === 1 ? PAPER : t.color}" stroke-width="${f1(6 - i * 0.5)}" opacity="${f1(1 - i * 0.09)}"${i % 2 ? ` stroke-dasharray="${2 + i} ${6 + i}"` : ""}`);
  }
  return (
    `<rect width="${W}" height="${H}" fill="${INK}"/>` +
    `<path d="${dotField(0, 0, W, H, 9, (x, y) => {
      const d = Math.hypot(x - cx, y - cy);
      return d < 90 ? 0 : 1.7 * Math.abs(Math.sin(d / 18)) * Math.max(0, 1 - d / 330);
    })}" fill="${t.color}" opacity=".6"/>` +
    arcs +
    C(cx, cy, 84, PAPER, 2.6) +
    C(cx, cy, 84, "none", 0, `stroke="${t.color}" stroke-width="6" stroke-dasharray="1 9"`) +
    bigGlyph(k, t.glyph, cx, cy, 150) +
    grid(PAPER, 0.3) +
    header(t, idx, PAPER) +
    display(M + 8, 142, t.name, 96, t.color, W - M * 2 - 16) +
    T(M + 10, 420, t.replaces ? `after ${t.replaces}` : t.kind, 24, PAPER, F_SERIF, `font-style="italic"`) +
    footer(t, PAPER) +
    // level meter
    Array.from({ length: 22 }, (_, i) => {
      const hgt = f1(4 + Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6)) * 26);
      return `<rect x="${W - M - 10 - (22 - i) * 6}" y="${f1(436 - Number(hgt))}" width="3" height="${hgt}" fill="${i > 16 ? TOMATO : PAPER}"/>`;
    }).join("")
  );
};

/** D: sunburst wedges, a paper plate, a ticket of features */
const burst: Layout = (k, t, idx) => {
  const cx = 200, cy = 236;
  let wedges = "";
  const n = 24;
  for (let i = 0; i < n; i += 2) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
    wedges += `M${cx} ${cy}L${f1(cx + Math.cos(a0) * 520)} ${f1(cy + Math.sin(a0) * 520)}L${f1(cx + Math.cos(a1) * 520)} ${f1(cy + Math.sin(a1) * 520)}Z`;
  }
  const feats = t.features.slice(0, 3);
  return (
    `<rect width="${W}" height="${H}" fill="${t.color}"/>` +
    `<path d="${wedges}" fill="${k.ht(3, INK, 6)}" opacity=".55"/>` +
    C(cx, cy, 128, INK) +
    C(cx - 6, cy - 6, 128, PAPER, 2.6) +
    C(cx - 6, cy - 6, 112, "none", 0, `stroke="${INK}" stroke-width="1" stroke-dasharray="3 5"`) +
    bigGlyph(k, t.glyph, cx - 6, cy - 14, 176, -4) +
    // ticket
    G(
      P("M0 0H150V84L144 90L138 84L132 90L126 84L120 90L114 84L108 90L102 84L96 90L90 84L84 90L78 84L72 90L66 84L60 90L54 84L48 90L42 84L36 90L30 84L24 90L18 84L12 90L6 84L0 90Z", PAPER, 2) +
      mono(10, 16, "Order / Ticket", INK, "start", 7.4) +
      L("M10 22H140", 0.8, INK, `stroke-dasharray="2 2"`) +
      feats.map((f, i) => mono(10, 36 + i * 14, `${i + 1}× ${trim(f.split(/[,:]/)[0], 24)}`, INK, "start", 6.6)).join(""),
      `transform="translate(222 262) rotate(7)"`) +
    grid(INK, 0.4) +
    header(t, idx, INK) +
    `<rect x="${M}" y="392" width="${W - M * 2}" height="86" fill="${INK}"/>` +
    display(M + 12, 466, t.name, 92, PAPER, W - M * 2 - 24) +
    mono(M + 10, 384, t.platform) + mono(W - M - 10, 384, STATUS_LABEL[t.status], INK, "end")
  );
};

/** E: classified dossier with redaction bars and caution tape */
const classified: Layout = (k, t, idx, r) => {
  const tape = (y: number, rot: number, label: string) =>
    G(
      `<rect x="-60" y="-15" width="520" height="30" fill="${CHEESE}"/>` +
      `<rect x="-60" y="-15" width="520" height="30" fill="${k.hatch(22, INK, 9, 35)}" opacity=".9"/>` +
      `<rect x="40" y="-9" width="320" height="18" fill="${CHEESE}"/>` +
      T(200, 4, `${label} · ${label}`.toUpperCase(), 9.6, INK, F_MONO, `text-anchor="middle" font-weight="700" letter-spacing=".18em"`) +
      L("M-60 -15H460M-60 15H460", 2.2),
      `transform="translate(0 ${y}) rotate(${rot} 200 0)"`);
  let bars = "";
  for (let i = 0; i < 9; i++) {
    const y = 236 + i * 15;
    const wv = 120 + r() * 170;
    const red = r() > 0.35;
    bars += red
      ? `<rect x="${M + 22}" y="${y}" width="${f1(wv)}" height="10" fill="${INK}"/>`
      : `<rect x="${M + 22}" y="${y + 4}" width="${f1(wv * 0.7)}" height="2" fill="${INK}" opacity=".35"/>`;
  }
  const sheetRot = f1(-3 + r() * 6);
  const alt = hash(t.slug) % 2 === 1;
  return (
    `<rect width="${W}" height="${H}" fill="${t.color}"/>` +
    `<path d="${dotField(0, 0, W, H, 10, (x, y) => 1.2 + Math.sin((x + y) / 60) * 0.8)}" fill="${INK}" opacity=".18"/>` +
    // folder tab + sheet
    G(
      P(`M${M + 10} 54H150L164 40H${W - M - 10}V${H - 40}H${M + 10}Z`, PAPER, 2.6) +
      P(`M${W - M - 70} ${H - 40}L${W - M - 10} ${H - 100}V${H - 40}Z`, k.ht(2), 2) +
      mono(M + 22, 82, `File ${t.slug}`) + mono(W - M - 22, 82, `N°${String(idx + 1).padStart(2, "0")} / ${t.year}`, INK, "end") +
      L(`M${M + 22} 92H${W - M - 22}`, 1) +
      display(M + 22, 148, "Classified", 64, INK) +
      T(M + 22, 178, t.blurb.length > 54 ? t.blurb.slice(0, 52) + "..." : t.blurb, 13, INK, F_SERIF, `font-style="italic"`) +
      bars +
      bigGlyph(k, "mystery", W - 104, alt ? 392 : 300, 120, alt ? -10 : 8) +
      G(
        `<rect x="-78" y="-22" width="156" height="44" rx="4" fill="none" stroke="${TOMATO}" stroke-width="3.4"/>` +
        `<rect x="-72" y="-16" width="144" height="32" rx="2" fill="none" stroke="${TOMATO}" stroke-width="1.2"/>` +
        T(0, 9, alt ? "EYES ONLY" : "TOP SECRET", 24, TOMATO, F_DISPLAY, `text-anchor="middle" font-weight="900" letter-spacing=".06em"`),
        `transform="translate(${alt ? 130 : W - 120} ${alt ? 452 : 440}) rotate(${alt ? 8 : -12})" opacity=".92"`),
      `transform="rotate(${sheetRot} 200 250)"`) +
    (alt
      ? tape(214 + r() * 20, 14 + r() * 6, "Still in the dough / do not open") + tape(330 + r() * 20, -12 - r() * 6, STATUS_LABEL[t.status])
      : tape(196 + r() * 30, -18 + r() * 8, "Still in the dough / do not open") + tape(336 + r() * 20, 8 + r() * 6, STATUS_LABEL[t.status])) +
    grid(INK, 0.3) +
    mono(M + 10, H - M - 8, t.platform) + mono(W - M - 10, H - M - 8, "Access denied", INK, "end")
  );
};

const BY_GLYPH: Record<string, Layout> = { satsuma: sun, tangerine: band, voice: rings, register: burst };
const ALL: Layout[] = [sun, band, rings, burst];

export function posterBody(k: Kit, tool: Tool): string {
  const r = rng(hash(tool.slug));
  const idx = Math.max(0, TOOLS.findIndex((t) => t.slug === tool.slug));
  const layout = tool.status === "prepping" ? classified : BY_GLYPH[tool.glyph] ?? ALL[hash(tool.slug) % ALL.length];
  return G(layout(k, tool, idx, r), `data-slug="${esc(tool.slug)}"`) +
    `<rect width="${W}" height="${H}" fill="${k.ht(1, INK, 3)}" opacity=".18"/>`;
}

export function poster(tool: Tool, opts: ArtOpts = {}): string {
  const k = new Kit();
  const clip = k.clip("frame", `<rect width="${W}" height="${H}"/>`);
  return k.wrap(`0 0 ${W} ${H}`, G(posterBody(k, tool), `clip-path="${clip}"`), opts);
}

