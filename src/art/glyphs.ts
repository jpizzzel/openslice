// Small object drawings, 100 x 100 each, same ink + halftone language.
import { Kit, INK, TOMATO, CHEESE, BASIL, PAPER, P, L, C, E, G, at, tube, ArtOpts, f1 } from "./core";
import { pepperoni, olive, inkLeaf, pizzaBox, pizzaTop } from "./props";

export type BaseGlyph =
  | "satsuma" | "tangerine" | "voice" | "register" | "mystery"
  | "box" | "box-open" | "slice" | "pizza" | "peel" | "oven" | "laptop" | "keyboard"
  | "wrench" | "basil" | "pepperoni" | "mushroom" | "olive" | "cheese-drip"
  | "star" | "sparkle" | "squiggle" | "arrow" | "github" | "terminal" | "cursor"
  | "dough" | "rolling-pin" | "chef-hat" | "sneaker" | "headphones" | "coffee"
  | "box-empty" | "ticket" | "receipt";

// Unified style: ink contours, paper base, gray halftone for form and shadow,
// at most one spot color per object.
const ORANGE = "#EF6A1F"; // satsuma
const ORANGE_2 = "#FF8F1F"; // tangerine
const W = 3.8; // outer contour
const w = 2.2; // interior detail
const hw = 1.4; // hairline

/** halftone shadow clipped to a shape (keys are per glyph) */
function shade(k: Kit, key: string, shape: string, shadow: string, tone: 1 | 2 | 3 | 4 = 2): string {
  return `<path d="${shadow}" fill="${k.ht(tone)}" clip-path="${k.clip("g" + key, `<path d="${shape}"/>`)}"/>`;
}

/** a filled shape, its halftone shadow, then the contour on top so dots never cover the line */
function form(k: Kit, key: string, shape: string, shadow: string, tone: 1 | 2 | 3 | 4 = 2, fill = PAPER, sw = W): string {
  return P(shape, fill, 0) + shade(k, key, shape, shadow, tone) + P(shape, "none", sw);
}

/** crescent shading on the lower right of a circle */
function crescent(k: Kit, cx: number, cy: number, r: number, tone: 1 | 2 | 3 = 2, a0 = -40, a1 = 130, push = 0.22): string {
  const p = (a: number) => [f1(cx + Math.cos((a * Math.PI) / 180) * r), f1(cy + Math.sin((a * Math.PI) / 180) * r)];
  const [x0, y0] = p(a0), [x1, y1] = p(a1);
  return `<path d="M${x0} ${y0}A${r} ${r} 0 0 1 ${x1} ${y1}A${f1(r * (1 + push))} ${f1(r * (1 + push))} 0 0 0 ${x0} ${y0}Z" fill="${k.ht(tone)}"/>`;
}

/** steam wisps in thin ink */
const steam = (xs: number[], y: number, h = 14) =>
  L(xs.map((x) => `M${x} ${y}c-5 ${-h * 0.4} 4 ${-h * 0.6} -1 ${-h}`).join(""), 1.8, INK, `opacity=".7"`);

/** mushroom slice with halftone on its shadow side */
function mush(k: Kit, x: number, y: number, s = 1, rot = 0): string {
  const d = "M-11 1C-12 -8 -5 -12 0 -12C5 -12 12 -8 11 1C7 3 4 2 3 2L4 10C4 12 -4 12 -4 10L-3 2C-5 2 -8 3 -11 1Z";
  return G(
    P(d, PAPER, 0) +
    P("M2 -12C7 -11 12 -7 11 1C7 3 4 2 3 2L4 10C4 12 1 12 1 12L1 2C6 1 8 -4 2 -12Z", k.ht(2, INK, 4.2 / s), 0) +
    P("M-3 2L3 2L4 10C4 12 -4 12 -4 10Z", k.ht(1, INK, 4.2 / s), 0) +
    P("M-3 2.2H3L3.4 5C1 4 -1 4 -3.2 5Z", k.ht(3, INK, 4.2 / s), 0) +
    L("M-7 -1C-4 -4 4 -4 7 -1M-2 4L-1.6 9", 1.1 / s) +
    P(d, "none", 2.4 / s),
    at(x, y, s, rot));
}

function starPath(cx: number, cy: number, ro: number, ri: number, n = 5, rot = -90): string {
  let d = "";
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? ri : ro;
    const a = ((rot + (i * 180) / n) * Math.PI) / 180;
    d += `${i ? "L" : "M"}${f1(cx + Math.cos(a) * r)} ${f1(cy + Math.sin(a) * r)}`;
  }
  return d + "Z";
}

export const sparkleD = (cx: number, cy: number, r: number) =>
  `M${cx} ${cy - r}C${f1(cx + r * 0.1)} ${f1(cy - r * 0.25)} ${f1(cx + r * 0.25)} ${f1(cy - r * 0.1)} ${cx + r} ${cy}C${f1(cx + r * 0.25)} ${f1(cy + r * 0.1)} ${f1(cx + r * 0.1)} ${f1(cy + r * 0.25)} ${cx} ${cy + r}C${f1(cx - r * 0.1)} ${f1(cy + r * 0.25)} ${f1(cx - r * 0.25)} ${f1(cy + r * 0.1)} ${cx - r} ${cy}C${f1(cx - r * 0.25)} ${f1(cy - r * 0.1)} ${f1(cx - r * 0.1)} ${f1(cy - r * 0.25)} ${cx} ${cy - r}Z`;

const Q_MARK = "M-9 -8C-9 -20 11 -20 11 -8C11 0 1 1 1 9";

const DRAW: Record<BaseGlyph, (k: Kit) => string> = {
  satsuma: (k) => {
    // a halved satsuma: orange rind, paper pith, segments in orange dot tint
    const cx = 50, cy = 52, n = 9;
    let seg = "";
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2 + 0.07, a1 = ((i + 1) / n) * Math.PI * 2 - 0.07, am = (a0 + a1) / 2;
      const pt = (a: number, r: number) => `${f1(cx + Math.cos(a) * r)} ${f1(cy + Math.sin(a) * r)}`;
      seg += `M${pt(am, 5)}L${pt(a0 + 0.1, 24)}Q${pt(a0 + 0.02, 29)} ${pt(am, 29.6)}Q${pt(a1 - 0.02, 29)} ${pt(a1 - 0.1, 24)}Z`;
    }
    return (
      C(cx, cy, 41, ORANGE, 0) +
      crescent(k, cx, cy, 41, 3, -40, 130, 0.16) +
      C(cx, cy, 41, "none", W) +
      C(cx, cy, 34, PAPER, w) +
      `<path d="${seg}" fill="${k.ht(4, ORANGE, 3)}"/>` +
      L(seg, 1.6) +
      `<path d="M${cx + 8} ${cy - 30}A30 30 0 0 1 ${cx + 22} ${cy + 22}L${cx} ${cy}Z" fill="${k.ht(1)}" clip-path="${k.clip("gsat", `<circle cx="${cx}" cy="${cy}" r="34"/>`)}"/>` +
      C(cx, cy, 3.4, PAPER, 1.6) +
      [[20, 30], [76, 24], [82, 72], [24, 78], [52, 14], [88, 48]].map(([x, y]) => C(x, y, 1, INK)).join("")
    );
  },
  tangerine: (k) =>
    C(50, 58, 34, ORANGE_2, 0) +
    crescent(k, 50, 58, 34, 3, -50, 140, 0.2) +
    C(50, 58, 34, "none", W) +
    [[34, 48], [42, 70], [60, 74], [70, 52], [56, 40], [30, 64], [64, 62], [48, 82], [76, 68]].map(([x, y]) => C(x, y, 1, INK)).join("") +
    L("M27 50A26 26 0 0 1 40 34", 3.4, PAPER) +
    L("M50 25V16", 3.2) +
    P("M50 26L44 22L48 27L42 30L50 29L58 31L52 27L56 22Z", INK, 1.2) +
    G(P("M0 0C10 -12 30 -12 40 -2C30 8 10 10 0 0Z", PAPER, 0) +
      P("M0 0C10 3 26 3 40 -2C30 8 10 10 0 0Z", k.ht(3), 0) +
      L("M3 0C14 -2 26 -2 37 -2M14 -1l5 -5M22 -1l5 -5M14 -1l5 4M24 -1l4 4", 1.3) +
      P("M0 0C10 -12 30 -12 40 -2C30 8 10 10 0 0Z", "none", 2.8), at(52, 19, 1, -24)),
  voice: (k) => {
    const cap = "M38 22C38 8 62 8 62 22V46C62 60 38 60 38 46Z";
    return (
      L("M22 32C15 41 15 55 22 64M13 25C2 39 2 57 13 71", 3.6, TOMATO) +
      L("M78 32C85 41 85 55 78 64M87 25C98 39 98 57 87 71", 3.6, TOMATO) +
      L("M30 46C30 72 70 72 70 46", W) +
      L("M50 68V84", W) +
      form(k, "vbase", "M34 88Q34 82 40 82H60Q66 82 66 88Z", "M52 80H70V90H52Z", 3, PAPER, 3) +
      P(cap, PAPER, 0) +
      shade(k, "vcap", cap, "M38 6H64V34H38Z", 3) +
      shade(k, "vcap", cap, "M54 34H64V62H50C56 56 56 44 54 34Z", 2) +
      L("M42 18H58M40 24H60M40 30H60", hw) +
      L("M38 34H62M38 39H62", 2.2) +
      P(cap, "none", W) +
      L("M44 44V50", 2.4, INK, `opacity=".6"`)
    );
  },
  register: (k) =>
    // receipt
    form(k, "rrec", "M20 50V22L23 19L26 22L29 19L32 22L35 19L38 22V50", "M32 18H40V50H32Z", 2, PAPER, 2.6) +
    L("M24 28H34M24 33H32M24 38H34", hw) +
    // display tower
    P("M56 18H84V44H56Z", PAPER, W) +
    P("M60 22H80V36H60Z", INK, 0) +
    L("M72 24.5C68 24 66 25.5 66.5 27.4C67 29.4 73 28.8 73.5 31C74 33 71 34 67 33.4M70 23V35", 1.6, PAPER) +
    L("M70 44V50", W) +
    // body
    form(k, "rbody", "M14 50H86L92 80H8Z", "M62 50H92V80H70Z", 2) +
    [0, 1, 2].map((r) => [0, 1, 2, 3, 4].map((c) => {
      const y = 55 + r * 8, x = 18 + c * 10 - r * 1.6;
      return P(`M${x} ${y}h7l.6 5h-8.2z`, r === 2 && c === 4 ? TOMATO : PAPER, 1.6);
    }).join("")).join("") +
    // drawer
    form(k, "rdraw", "M8 80H92V92H8Z", "M8 80H92V92H8Z", 1) +
    shade(k, "rdraw", "M8 80H92V92H8Z", "M64 80H92V92H64Z", 2) +
    P("M40 86H60", "none", 3),
  mystery: (k) => {
    const tape = "M2 80L98 56L98 70L2 94Z";
    return (
      form(k, "mtop", "M18 38L30 26H88L76 38Z", "M18 38L30 26H88L76 38Z", 1) +
      form(k, "mside", "M76 38L88 26V76L76 88Z", "M76 38L88 26V76L76 88Z", 3) +
      form(k, "mfront", "M18 38H76V88H18Z", "M18 38H76V47H18Z", 2) +
      shade(k, "mfront", "M18 38H76V88H18Z", "M62 38H76V88H58Z", 1) +
      L("M47 38V44M30 26L42 38", 2) +
      G(L(Q_MARK, 6.4) + C(1, 18, 3.8, INK), at(46, 62, 0.95, 0)) +
      // caution tape
      P(tape, CHEESE, 0) +
      P(tape, k.hatch(8, INK, 3.4, 30), 0) +
      P(tape, "none", 2.6)
    );
  },
  box: (k) => pizzaBox(k, 10, 58, 78, 26, 26, 6, true, W) + steam([30, 48, 66], 24, 16),
  "box-open": (k) =>
    // lid (inside face)
    form(k, "olid", "M16 46L90 46L84 6L22 6Z", "M58 46L90 46L84 6L64 6Z", 1) +
    E(34, 20, 6, 3.6, "none", 1.2, `opacity=".45"`) +
    // tray
    form(k, "otray", "M8 58L92 58L90 46L16 46Z", "M8 58L92 58L90 46L16 46Z", 2, PAPER, 3) +
    E(51, 53, 33, 6.4, PAPER, 2.6) +
    `<ellipse cx="51" cy="53" rx="33" ry="6.4" fill="${k.ht(1)}"/>` +
    E(51, 53, 26, 4.2, PAPER, 1.6) +
    [[38, 52.4], [52, 54.4], [64, 51.8], [45, 50.6], [58, 50.4]].map(([x, y]) => E(x, y, 3.4, 1.5, TOMATO, 1.2)).join("") +
    // front
    form(k, "ofront", "M8 58H92V78H8Z", "M58 58H92V78H66Z", 2) +
    L("M10 64H90", 1.6) +
    L("M24 71h10M46 71h10M68 71h10", 2.4),
  "box-empty": (k) =>
    // lid up, inside face with a grease ghost
    form(k, "elid", "M18 44L86 44L80 8L24 8Z", "M58 44L86 44L80 8L62 8Z", 1) +
    P("M40 22C36 18 42 14 46 17C50 13 56 18 52 22C55 26 48 29 45 26C41 28 37 25 40 22Z", CHEESE, 1.3) +
    // the floor of the box, shadowed under the lid
    form(k, "efloor", "M18 44H86L94 70H10Z", "M18 44H86L88 51H16Z", 2) +
    E(52, 58, 30, 8, "none", 1.4, `stroke-dasharray="3 3.4" opacity=".7"`) +
    P("M30 58C27 54 33 51 37 54C41 51 46 55 43 59C45 63 38 65 35 62C31 64 27 61 30 58Z", CHEESE, 1.3) +
    P("M62 62C60 59 64 57 67 59C70 57 74 60 71 63C72 66 67 67 65 65C62 66 60 64 62 62Z", CHEESE, 1.3) +
    E(74, 52, 3.4, 2, CHEESE, 1.2) +
    // a forgotten crust end
    G(P("M-13 3C-10 -6 10 -6 13 3C9 1 4 0 0 0C-4 0 -9 1 -13 3Z", PAPER, 2.4) +
      P("M-11 1C-6 -1 6 -1 11 1L13 3C9 1 4 0 0 0C-4 0 -9 1 -13 3Z", k.ht(3), 0) +
      L("M-6 -2.6l1.6 1M2 -3.4l1.4 1.2", 1.2), at(50, 56, 1.2, -8)) +
    // crumbs
    [[24, 64, 2], [40, 66, 1.6], [70, 56, 1.4], [80, 64, 2.2], [57, 66, 1.2], [34, 50, 1.2], [86, 58, 1.4]].map(([x, y, r]) => C(x, y, r, INK)).join("") +
    P("M44 61l3 -2l1 3z", PAPER, 1.2) + P("M76 60l3 1l-2 2z", PAPER, 1.2) +
    // front wall
    form(k, "efront", "M10 70H94V88H10Z", "M60 70H94V88H68Z", 2) +
    L("M12 76H92", 1.6) +
    L("M26 82h10M48 82h10M70 82h10", 2.4),
  slice: (k) => {
    const slice = "M10 78L76 20Q96 38 92 64Z";
    const crust = "M73 16Q100 36 96 68L88 64Q90 42 70 25Z";
    return (
      // stretchy cheese
      P("M24 74C26 80 30 82 30 86C30 89.6 25 89.6 25 86C25 83 23 80 20 77Z", PAPER, 2.4) +
      P(slice, PAPER, 0) +
      G(
        P("M56 30Q84 50 90 66L100 66L100 20Z", k.ht(2), 0) +
        P("M10 78L92 64L80 74L10 84Z", k.ht(3), 0) +
        L("M24 66C34 60 40 62 48 56M58 40C62 46 70 46 74 52", 1.2, INK, `opacity=".55"`) +
        pepperoni(k, 54, 50, 7.4) + pepperoni(k, 76, 44, 6.4) + pepperoni(k, 34, 67, 5.6) +
        E(42, 58, 2.2, 1.5, PAPER, 1.3) + E(70, 60, 2.6, 1.7, PAPER, 1.3) + E(62, 66, 1.6, 1.1, PAPER, 1.2),
        `clip-path="${k.clip("gslice", `<path d="${slice}"/>`)}"`) +
      P(slice, "none", W) +
      form(k, "scrust", crust, "M84 28Q94 44 92 66L100 66L100 20Z", 3) +
      L("M78 26l3 2M86 44l1 4", 1.6)
    );
  },
  pizza: (k) => pizzaTop(k, 50, 50, 43, 8, W),
  peel: (k) => {
    const d = "M-26 -34Q-26 -48 -12 -48H12Q26 -48 26 -34V-2Q26 6 14 8L5 10V44Q5 48 0 48Q-5 48 -5 44V10L-14 8Q-26 6 -26 -2Z";
    return G(
      P(d, PAPER, 0) +
      shade(k, "peel", d, "M12 -50H30V12H0V50H6V10L14 8Q22 2 12 -50Z", 2) +
      L("M-16 -40V-6M-6 -44V2M8 -44V0M18 -40V-6M0 16V40", 1.1, INK, `opacity=".45"`) +
      P(d, "none", W) +
      C(0, 40, 2.2, PAPER, 1.6) +
      pizzaTop(k, 0, -20, 19, 6, 2.4),
      at(50, 50, 0.9, 38));
  },
  oven: (k) => {
    const dome = "M8 86V56C8 22 92 22 92 56V86Z";
    return (
      form(k, "ochim", "M64 10H76V30H64Z", "M71 10H76V30H71Z", 2) +
      steam([70], 7, 10) +
      P(dome, PAPER, 0) +
      shade(k, "odome", dome, "M58 26C80 32 94 44 94 56V88H64C78 70 76 42 58 26Z", 2) +
      shade(k, "odome", dome, "M74 34C86 42 94 50 94 60V88H82C88 72 86 50 74 34Z", 3) +
      P(dome, "none", W) +
      L("M18 46C24 34 36 28 48 27", 1.6, INK, `opacity=".5"`) +
      // brick arch
      P("M24 86V64C24 40 76 40 76 64V86H66V64C66 52 34 52 34 64V86Z", PAPER, 2.8) +
      L("M24 70H34M66 70H76M26 56L35 59M74 56L65 59M36 44L40 53M64 44L60 53M50 41V50", 1.8) +
      // mouth + fire
      P("M34 86V64C34 52 66 52 66 64V86Z", INK, 2) +
      P("M38 86C36 78 42 74 42 68C46 72 46 76 48 76C48 70 52 64 52 60C58 66 60 72 58 78C60 76 62 74 62 72C64 78 64 82 62 86Z", TOMATO, 0) +
      P("M44 86C43 81 47 79 47 76C50 79 52 82 54 80C55 83 55 85 54 86Z", `${k.ht(4, INK, 3)}`, 0) +
      // base
      form(k, "obase", "M4 86H96V94H4Z", "M4 86H96V94H4Z", 2, PAPER, 3.2) +
      L("M20 86V94M40 86V94M60 86V94M80 86V94", 1.6)
    );
  },
  laptop: (k) =>
    P("M18 10H82Q86 10 86 14V60H14V14Q14 10 18 10Z", PAPER, W) +
    P("M20 16H80V54H20Z", PAPER, 0) +
    P("M20 16H80V54H20Z", k.ht(2), 0) +
    P("M58 16H70L52 54H40Z", PAPER, 0) +
    P("M74 16H78L60 54H56Z", PAPER, 0) +
    P("M20 16H80V54H20Z", "none", 1.8) +
    L("M26 24H40M26 31H46M30 38H38M30 45H42", 2.4) +
    G(P("M0 0V13L3.4 9.6L6 15L8.6 13.8L6 8.6H10.6Z", TOMATO, 1.5), at(60, 32)) +
    form(k, "lbase", "M14 60H86L96 80H4Z", "M62 60H86L96 80H72Z", 2) +
    L("M18 65H82M15 70H85M12 75H88", 1.2, INK, `opacity=".55"`) +
    form(k, "llip", "M4 80H96V84Q96 87 92 87H8Q4 87 4 84Z", "M4 83H96V88H4Z", 3, PAPER, 3) +
    P("M40 75H60L61 79H39Z", PAPER, 1.4),
  keyboard: (k) => {
    let keys = "";
    const rows = 4;
    for (let r = 0; r < rows; r++) {
      const y0 = 38 + r * 9, y1 = y0 + 6.4;
      const xl = (y: number) => 18 - ((y - 34) / 42) * 8, xr = (y: number) => 82 + ((y - 34) / 42) * 8;
      const n = r === 3 ? 3 : 8;
      for (let c = 0; c < n; c++) {
        let f0 = c / n, f1_ = (c + 1) / n;
        if (r === 3) { f0 = [0, 0.18, 0.78][c]; f1_ = [0.16, 0.76, 1][c]; }
        const ax = xl(y0) + (xr(y0) - xl(y0)) * f0 + 1.2, bx = xl(y0) + (xr(y0) - xl(y0)) * f1_ - 1.2;
        const cx_ = xl(y1) + (xr(y1) - xl(y1)) * f1_ - 1.2, dx = xl(y1) + (xr(y1) - xl(y1)) * f0 + 1.2;
        const key = `M${f1(ax)} ${y0}L${f1(bx)} ${y0}L${f1(cx_)} ${y1}L${f1(dx)} ${y1}Z`;
        keys += r === 0 && c === 0 ? P(key, TOMATO, 1.6) : P(key, PAPER, 0) + (c >= n - 2 ? P(key, k.ht(1), 0) : "") + P(key, "none", 1.6);
      }
    }
    return (
      form(k, "kbody", "M18 34H82L90 76H10Z", "M70 34H82L90 76H76Z", 2) +
      form(k, "kfoot", "M10 76H90V82Q90 84 88 84H12Q10 84 10 82Z", "M10 78H90V86H10Z", 3, PAPER, 3) +
      keys +
      L("M50 34C50 22 60 22 62 14C64 8 70 6 74 8", 2.6)
    );
  },
  wrench: (k) =>
    G(
      `<path d="M-34 -12A12 12 0 1 0 -34 12A12 12 0 1 0 -34 -12ZM-38.4 -5.4L-31 -5.6L-27.4 .2L-31 6L-38.4 6L-41.8 .2Z" fill="${PAPER}" fill-rule="evenodd" ${`stroke="${INK}" stroke-width="${W}" stroke-linejoin="round"`}/>` +
      `<path d="M-46 2A12 12 0 0 0 -24 4L-27.4 .2L-31 6L-38.4 6L-41.8 .2Z" fill="${k.ht(3)}"/>` +
      P("M-23 -5.4H20V5.4H-23Z", PAPER, W) +
      P("M20 -6C24 -16 40 -18 47 -9L37 -4.4V4.4L47 9C40 18 24 16 20 6Z", PAPER, W) +
      P("M-21 1H19V3.6H-21Z", k.ht(3), 0) +
      P("M23 4C28 12 38 13 44 9L37 6Z", k.ht(3), 0) +
      L("M-14 -1.4H10", 1.4, INK, `opacity=".6"`),
      at(52, 50, 1.05, -38)),
  basil: (k) =>
    L("M50 94C48 74 54 52 50 22", 3.2) +
    inkLeaf(k, 36, 44, -50, 1.5, BASIL, 2.8) + inkLeaf(k, 64, 50, 54, 1.45, BASIL, 2.8) + inkLeaf(k, 50, 20, 4, 1.3, BASIL, 2.8) +
    inkLeaf(k, 36, 70, -64, 1.15, BASIL, 2.6) + inkLeaf(k, 63, 76, 70, 1.05, BASIL, 2.6),
  pepperoni: (k) =>
    pepperoni(k, 44, 54, 34, W) + crescent(k, 44, 54, 34, 2) + C(44, 54, 34, "none", W) +
    pepperoni(k, 80, 22, 13, 2.8) + crescent(k, 80, 22, 13, 2) + C(80, 22, 13, "none", 2.8),
  mushroom: (k) => mush(k, 48, 54, 3.4) + mush(k, 80, 22, 1.4, 24),
  olive: (k) =>
    G(E(0, 0, 15, 20, INK, W) + L("M-6 -12C-9 -6 -9 2 -6 8", 3, PAPER, `opacity=".8"`), at(68, 32, 1, 28)) +
    E(36, 86, 22, 4, k.ht(2)) + E(76, 88, 14, 3, k.ht(2)) +
    olive(34, 62, 22, PAPER) + E(34.4, 62.3, 9.2, 7.9, k.ht(2)) + E(34.4, 62.3, 9.2, 7.9, "none", 1.6) +
    olive(74, 74, 14, PAPER) + E(74.4, 74.3, 5.9, 5, k.ht(2)),
  "cheese-drip": (k) => {
    const d = "M8 10H92V38C92 44 88 46 86 42C84 38 80 36 78 44L77 62C77 70 69 70 69 62L68 46C67 40 60 40 58 46C57 52 52 54 50 48C48 40 42 40 40 48L39 80C39 88 30 88 30 80L29 46C28 40 22 40 20 46C19 54 12 52 12 44C10 40 8 40 8 38Z";
    return (
      P(d, CHEESE, 0) +
      shade(k, "cd", d, "M8 10H92V20H8Z", 2) +
      shade(k, "cd", d, "M34 40H40V90H34ZM73 44H78V72H73Z", 3) +
      P(d, "none", W) +
      [[24, 28, 5, 3.4], [58, 26, 6.4, 4], [82, 30, 3.6, 2.6]].map(([x, y, rx, ry]) =>
        E(x, y, rx, ry, PAPER, 1.8) + P(`M${x - rx + 1} ${y}A${rx - 1} ${ry - 0.8} 0 0 1 ${x + rx - 1} ${y}A${rx} ${ry * 0.5} 0 0 0 ${x - rx + 1} ${y}Z`, INK, 0)).join("") +
      L("M33 50V72", 2.2, PAPER) +
      P("M73 78C69 84 70 90 73.5 90C77 90 78 84 73 78Z", CHEESE, 2.6)
    );
  },
  star: (k) =>
    P(starPath(50, 54, 42, 19), CHEESE, 0) +
    `<path d="${starPath(50, 54, 42, 19)}" fill="${k.ht(2)}" clip-path="${k.clip("starh", `<path d="M50 54L120 0V120H50Z"/>`)}"/>` +
    P(starPath(50, 54, 42, 19), "none", W) +
    L("M36 40L44 33", 3, PAPER) +
    P(sparkleD(86, 16, 9), PAPER, 2.2) + P(sparkleD(14, 86, 6), INK, 1.4),
  sparkle: (k) =>
    P(sparkleD(46, 54, 40), CHEESE, 0) +
    `<path d="${sparkleD(46, 54, 40)}" fill="${k.ht(2)}" clip-path="${k.clip("spk", `<path d="M46 54L120 54V120H46Z"/>`)}"/>` +
    P(sparkleD(46, 54, 40), "none", W) +
    L("M36 44C38 38 40 36 44 34", 3, PAPER) +
    P(sparkleD(82, 18, 12), PAPER, 2.6) +
    P(sparkleD(84, 78, 7), INK, 1.4) +
    C(18, 18, 3, INK),
  squiggle: (k) =>
    L("M13 66C19 34 37 32 37 52C37 74 53 78 57 54C61 30 77 28 79 50C81 68 89 74 95 52", 9, `${k.ht(3)}`) +
    tube("M10 62C16 30 34 28 34 48C34 70 50 74 54 50C58 26 74 24 76 46C78 64 86 70 92 48", 6, TOMATO, 2.8),
  arrow: (k) =>
    L("M15 84C21 44 49 26 83 36M67 20L87 36L69 54", 9, `${k.ht(3)}`) +
    tube("M12 80C18 40 46 22 80 32", 6, TOMATO, 2.8) +
    tube("M64 16L84 32L66 50", 6, TOMATO, 2.8),
  github: (k) =>
    // a generic version control branch, not a logo
    L("M30 28V72", 6) + L("M70 38C70 58 34 52 30 70", 6) +
    C(30, 22, 10, PAPER, 0) + crescent(k, 30, 22, 10, 2) + C(30, 22, 10, "none", W) + C(30, 22, 3.6, INK) +
    C(30, 78, 10, PAPER, 0) + crescent(k, 30, 78, 10, 2) + C(30, 78, 10, "none", W) + C(30, 78, 3.6, INK) +
    C(70, 32, 10, TOMATO, W) + C(70, 32, 3.6, PAPER, 1.6),
  terminal: () =>
    P("M10 20Q10 14 16 14H84Q90 14 90 20V82Q90 88 84 88H16Q10 88 10 82Z", INK, W) +
    P("M10 20Q10 14 16 14H84Q90 14 90 20V28H10Z", PAPER, W) +
    C(19, 21, 3, TOMATO, 1.4) + C(28, 21, 3, PAPER, 1.4) + C(37, 21, 3, PAPER, 1.4) +
    L("M20 42L30 50L20 58", 4, PAPER) +
    `<g data-part="caret">${L("M36 60H50", 4.4, TOMATO)}</g>` +
    L("M20 72H44M50 72H60", 2.4, PAPER, `opacity=".45"`),
  cursor: (k) => {
    const d = "M28 16V80L44 65L56 90L68 85L56 61H78Z";
    return (
      L("M20 14L12 8M16 26H6M30 8L31 0", 3.2, TOMATO) +
      P(d, PAPER, 0) +
      shade(k, "cur", d, "M28 16L78 61H56L68 85L60 88L48 62Z", 2) +
      P(d, "none", W)
    );
  },
  dough: (k) => {
    const d = "M12 66C12 38 30 30 50 30C72 30 88 40 88 64C88 78 74 86 50 86C26 86 12 80 12 66Z";
    return (
      E(52, 84, 42, 6, k.ht(2)) +
      P(d, PAPER, 0) +
      shade(k, "dough", d, "M88 64C88 78 74 86 50 86C34 86 22 82 16 76C40 80 74 76 80 46C86 52 88 58 88 64Z", 2) +
      shade(k, "dough", d, "M88 62C88 76 76 84 56 86C72 80 84 70 84 52Z", 3) +
      P(d, "none", W) +
      L("M36 50C42 46 50 46 58 49", 1.8) +
      [[30, 42], [44, 38], [62, 40], [40, 56], [58, 58], [72, 52], [10, 30], [90, 26], [80, 14], [20, 16]].map(([x, y], i) => C(x, y, i > 5 ? 1.6 : 1, INK, 0, i > 5 ? "" : `opacity=".5"`)).join("")
    );
  },
  "rolling-pin": (k) =>
    G(
      L("M-46 0H46", 6) +
      C(-46, 0, 6, PAPER, 3) + C(46, 0, 6, PAPER, 3) +
      `<path d="M-52 2A6 6 0 0 0 -40 2ZM40 2A6 6 0 0 0 52 2Z" fill="${k.ht(3)}"/>` +
      form(k, "rpin", "M-28 -12H28Q32 -12 32 -8V8Q32 12 28 12H-28Q-32 12 -32 8V-8Q-32 -12 -28 -12Z", "M-34 2H34V14H-34Z", 2) +
      L("M-22 -5C-10 -7 4 -3 18 -6M-16 1C-4 -1 8 2 22 0", 1.2, INK, `opacity=".5"`),
      at(50, 52, 1, -28)) +
    [[20, 80], [30, 86], [70, 20], [80, 28], [14, 70]].map(([x, y]) => C(x, y, 1.4, INK)).join(""),
  "chef-hat": (k) => {
    const top = "M24 54C8 52 8 28 26 28C28 12 48 8 55 20C63 8 84 12 81 30C96 32 94 54 76 54Z";
    const band = "M24 54H76L74 86H26Z";
    return (
      P(top, PAPER, 0) +
      shade(k, "chtop", top, "M81 30C96 32 94 54 76 54H58C76 48 82 40 81 30ZM10 50H76V56H10Z", 2) +
      P(top, "none", W) +
      L("M40 30C40 38 42 44 44 50M58 26C60 36 60 44 58 50", 1.8) +
      form(k, "chband", band, "M60 54H80V90H62Z", 2) +
      L("M36 70V82M50 70V82M64 70V82", 1.6) +
      P("M25 58H75L74.6 65H25.4Z", TOMATO, 2.2)
    );
  },
  sneaker: (k) => {
    const up = "M12 70C12 56 16 42 26 38C32 36 36 40 42 45C52 52 64 54 78 56C89 58 94 63 94 70Z";
    const sole = "M8 70H96Q98 70 98 74V78Q98 84 92 84H14Q8 84 8 78Z";
    return (
      E(54, 88, 44, 4, k.ht(2)) +
      // tongue
      form(k, "snt", "M30 40C30 28 42 26 46 32L50 46Z", "M40 26H52V48H44Z", 2, PAPER, 2.6) +
      P(up, PAPER, 0) +
      shade(k, "snu", up, "M8 50C16 52 20 60 22 72H8Z", 3) +
      shade(k, "snu", up, "M40 60C60 62 80 60 96 62V72H40Z", 1) +
      P("M24 66C38 52 58 52 76 60L73 66C58 60 42 61 30 70Z", TOMATO, 2.2) +
      P(up, "none", W) +
      L("M70 70C72 62 80 58 92 62", 2) +
      L("M36 44L44 40M41 48L49 44M46 51L54 48", 2.2) +
      L("M14 52C18 48 22 48 24 50", 2) +
      form(k, "sns", sole, "M8 76H98V86H8Z", 2, PAPER, 3.2) +
      L("M12 76H94", 1.3)
    );
  },
  headphones: (k) => {
    const cupL = "M8 56Q8 50 14 50H22Q28 50 28 56V86Q28 92 22 92H14Q8 92 8 86Z";
    const cupR = "M72 56Q72 50 78 50H86Q92 50 92 56V86Q92 92 86 92H78Q72 92 72 86Z";
    return (
      tube("M22 64C16 18 84 18 78 64", 5, PAPER, 2.8) +
      L("M64 26C74 34 78 46 77 58", 4, `${k.ht(3)}`) +
      L("M20 54V46M80 54V46", 6) +
      P("M24 56H32V86H24Z", INK, 2) + P("M68 56H76V86H68Z", INK, 2) +
      form(k, "hpl", cupL, "M8 72H30V94H8Z", 2) +
      form(k, "hpr", cupR, "M84 48H94V94H72V78C80 76 84 66 84 48Z", 3) +
      L("M13 60V76", 1.6, INK, `opacity=".6"`)
    );
  },
  coffee: (k) => {
    const mug = "M20 32H72L68 84Q67 90 60 90H32Q25 90 24 84Z";
    return (
      steam([38, 52], 22, 16) +
      E(46, 90, 30, 4, k.ht(2)) +
      tube("M70 44C88 42 88 72 68 72", 5, PAPER, 2.8) +
      P(mug, PAPER, 0) +
      shade(k, "mug", mug, "M56 32H74V92H50Q60 70 56 32Z", 2) +
      shade(k, "mug", mug, "M66 32H74V92H62Q68 70 66 32Z", 3) +
      P(mug, "none", W) +
      G(P("M0 -5C-3 -10 -11 -8 -9 -1L0 7L9 -1C11 -8 3 -10 0 -5Z", TOMATO, 2), at(45, 60)) +
      E(46, 32, 26, 5, PAPER, W) +
      E(46, 32.8, 21, 3.2, INK, 0) +
      L("M34 32C38 30.8 44 30.6 48 31.2", 1.3, PAPER, `opacity=".8"`)
    );
  },
  ticket: (k) => {
    const t = "M-24 -34H24V38L18 34L12 38L6 34L0 38L-6 34L-12 38L-18 34L-24 38Z";
    return (
      G(P(t, k.ht(2), 0), at(55, 58, 1, -4)) +
      G(
        P(t, PAPER, 0) +
        shade(k, "tk", t, "M16 -40H30V44H14Z", 2) +
        P(t, "none", W) +
        L("M-17 -18H6", 3.4) + L("M10 -18H17", 3.4, TOMATO) +
        L("M-17 -11H17", 1.2, INK, `stroke-dasharray="2 2.4"`) +
        L("M-17 -3H-13M-9 -3H10M-17 5H-13M-9 5H6M-17 13H-13M-9 13H12", 1.8) +
        L("M-17 22H17", 1.2, INK, `stroke-dasharray="2 2.4"`) +
        L("M-17 29H-2", 2.6),
        at(51, 54, 1, -4)) +
      // the clip
      G(
        P("M-14 -6H14L12 8H-12Z", PAPER, 0) +
        P("M2 -6H14L12 8H0Z", k.ht(3), 0) +
        P("M-14 -6H14L12 8H-12Z", "none", 3) +
        L("M-9 -6C-12 -16 12 -16 9 -6", 2.6) +
        L("M-8 2H8", 1.4),
        at(50, 20, 1, -4))
    );
  },
  receipt: (k) => {
    const r = "M-20 -36H20V40L15 36L10 40L5 36L0 40L-5 36L-10 40L-15 36L-20 40Z";
    return (
      G(
        P(r, PAPER, 0) +
        shade(k, "rc", r, "M12 -40H24V44H10Z", 2) +
        shade(k, "rc", r, "M-24 -36H24V-30H-24Z", 1) +
        P(r, "none", W) +
        // curl of the roll at the top
        P("M-20 -36C-20 -44 -8 -46 -6 -40C-5 -37 -9 -35 -11 -37", "none", 2.6) +
        L("M-8 -26H8", 3) +
        L("M-13 -19H13", 1.2, INK, `stroke-dasharray="1.6 2.2"`) +
        L("M-13 -11H0M7 -11H13M-13 -4H-3M7 -4H13M-13 3H2M7 3H13", 1.8) +
        L("M-13 11H13", 1.2, INK, `stroke-dasharray="1.6 2.2"`) +
        L("M-13 19H-4M4 19H13", 3) +
        L("M3 24H14", 2.2, TOMATO) +
        L("M-10 30h2M-6 30h1M-3 30h3M2 30h1M5 30h2M9 30h1", 2.2),
        at(50, 52, 1, 6)) +
      E(54, 94, 22, 3, k.ht(2))
    );
  },
};

/** glyph markup in a 100 x 100 box, for embedding inside other drawings */
export function glyphBody(k: Kit, id: string): string {
  const f = DRAW[id as BaseGlyph] ?? DRAW.star;
  return G(G(f(k), `transform="translate(4 4) scale(.92)"`), `data-glyph="${id}"`);
}

export function glyph(id: string, opts: ArtOpts = {}): string {
  const k = new Kit();
  return k.wrap("0 0 100 100", glyphBody(k, id), opts);
}
