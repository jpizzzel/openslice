// Small object drawings, 100 x 100 each, same ink + halftone language.
import { Kit, INK, TOMATO, CHEESE, CRUST, BASIL, PAPER, GRAY, P, L, C, E, G, at, tube, ArtOpts, f1 } from "./core";
import { pepperoni, olive, basilLeaf, mushroom, sneaker, pizzaBox, pizzaTop } from "./props";

export type BaseGlyph =
  | "satsuma" | "tangerine" | "voice" | "register" | "mystery"
  | "box" | "box-open" | "slice" | "pizza" | "peel" | "oven" | "laptop" | "keyboard"
  | "wrench" | "basil" | "pepperoni" | "mushroom" | "olive" | "cheese-drip"
  | "star" | "sparkle" | "squiggle" | "arrow" | "github" | "terminal" | "cursor"
  | "dough" | "rolling-pin" | "chef-hat" | "sneaker" | "headphones" | "coffee";

const ORANGE = "#EF6A1F";
const ORANGE_2 = "#FF9A1F";
const ORANGE_LT = "#ffb766";
const W = 3.6; // outer contour
const w = 2; // interior detail

/** crescent shading on the lower right of a circle */
function crescent(k: Kit, cx: number, cy: number, r: number, tone: 1 | 2 | 3 = 2, a0 = -40, a1 = 130, push = 0.22): string {
  const p = (a: number) => [f1(cx + Math.cos((a * Math.PI) / 180) * r), f1(cy + Math.sin((a * Math.PI) / 180) * r)];
  const [x0, y0] = p(a0), [x1, y1] = p(a1);
  return `<path d="M${x0} ${y0}A${r} ${r} 0 0 1 ${x1} ${y1}A${f1(r * (1 + push))} ${f1(r * (1 + push))} 0 0 0 ${x0} ${y0}Z" fill="${k.ht(tone)}"/>`;
}

/** a shine stroke along the upper left of a circle */
const shine = (cx: number, cy: number, r: number, sw = 3) => {
  const a0 = (200 * Math.PI) / 180, a1 = (245 * Math.PI) / 180;
  return L(`M${f1(cx + Math.cos(a0) * r)} ${f1(cy + Math.sin(a0) * r)}A${r} ${r} 0 0 1 ${f1(cx + Math.cos(a1) * r)} ${f1(cy + Math.sin(a1) * r)}`, sw, PAPER);
};

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
    const cx = 50, cy = 52, n = 9;
    let seg = "", juice = "";
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2 + 0.06, a1 = ((i + 1) / n) * Math.PI * 2 - 0.06, am = (a0 + a1) / 2;
      const pt = (a: number, r: number) => `${f1(cx + Math.cos(a) * r)} ${f1(cy + Math.sin(a) * r)}`;
      seg += `M${pt(am, 4.5)}L${pt(a0 + 0.1, 25)}Q${pt(a0 + 0.02, 29.5)} ${pt(am, 30)}Q${pt(a1 - 0.02, 29.5)} ${pt(a1 - 0.1, 25)}Z`;
      juice += `M${pt(am - 0.12, 12)}L${pt(am - 0.14, 20)}M${pt(am + 0.13, 15)}L${pt(am + 0.15, 23)}`;
    }
    return (
      C(cx, cy, 40, ORANGE, W) +
      C(cx, cy, 34, PAPER, w) +
      P(seg, ORANGE_LT, 1.8) +
      L(juice, 1.4, PAPER, `opacity=".9"`) +
      C(cx, cy, 3.4, PAPER, 1.6) +
      crescent(k, cx, cy, 40, 2) +
      [[20, 30], [76, 26], [80, 74], [26, 78], [52, 15]].map(([x, y]) => C(x, y, 0.9, INK, 0, `opacity=".45"`)).join("")
    );
  },
  tangerine: (k) =>
    C(50, 58, 34, ORANGE_2, W) +
    crescent(k, 50, 58, 34, 2) +
    [[34, 48], [42, 70], [60, 74], [70, 52], [56, 40], [30, 64], [64, 62], [48, 82], [76, 68]].map(([x, y]) => C(x, y, 1, INK, 0, `opacity=".4"`)).join("") +
    shine(50, 58, 27, 3.4) +
    L("M50 25V17", 3.4) +
    P("M50 26L44 22L48 27L42 30L50 29L58 31L52 27L56 22Z", BASIL, 1.6) +
    G(P("M0 0C10 -12 30 -12 40 -2C30 8 10 10 0 0Z", BASIL, 2.8) + L("M3 0C14 -3 26 -3 37 -2", 1.4, PAPER, `opacity=".8"`), at(52, 20, 1, -24)),
  voice: (k) =>
    L("M22 32C15 41 15 55 22 64M13 25C2 39 2 57 13 71", 3.4, TOMATO) +
    L("M78 32C85 41 85 55 78 64M87 25C98 39 98 57 87 71", 3.4, TOMATO) +
    L("M30 46C30 72 70 72 70 46", W) +
    L("M50 68V84", W) +
    P("M34 86Q34 82 38 82H62Q66 82 66 86V88H34Z", PAPER, 3) +
    P("M38 22C38 8 62 8 62 22V46C62 60 38 60 38 46Z", PAPER, W) +
    P("M38 22C38 8 62 8 62 22V34H38Z", k.ht(3), 0) +
    L("M42 18H58M40 24H60M40 30H60", 1.4) +
    P("M38 34H62V39H38Z", TOMATO, 2.4) +
    P("M54 44V50", "none", 2, `stroke="${PAPER}"`),
  register: (k) =>
    // receipt
    P("M20 50V22L23 19L26 22L29 19L32 22L35 19L38 22V50", PAPER, 2.6) +
    L("M24 28H34M24 33H32M24 38H34", 1.4) +
    // display tower
    P("M56 18H84V44H56Z", PAPER, W) +
    P("M60 22H80V36H60Z", INK, 0) +
    L("M72 24.5C68 24 66 25.5 66.5 27.4C67 29.4 73 28.8 73.5 31C74 33 71 34 67 33.4M70 23V35", 1.6, CHEESE) +
    L("M70 44V50", W) +
    // body
    P("M14 50H86L92 80H8Z", PAPER, W) +
    P("M62 50H86L92 80H70Z", k.ht(1), 0) +
    [0, 1, 2].map((r) => [0, 1, 2, 3, 4].map((c) => {
      const y = 55 + r * 8, x = 18 + c * 10 - r * 1.6;
      return P(`M${x} ${y}h7l.6 5h-8.2z`, r === 2 && c === 4 ? TOMATO : PAPER, 1.6);
    }).join("")).join("") +
    // drawer
    P("M8 80H92V92H8Z", CRUST, W) +
    P("M40 85H60", "none", 3) +
    P("M8 80H92V92H8Z", k.ht(1), 0),
  mystery: (k) => {
    const tape = "M2 80L98 56L98 70L2 94Z";
    return (
      // box: top, side, front
      P("M18 38L30 26H88L76 38Z", CRUST, W) +
      P("M76 38L88 26V76L76 88Z", CRUST, W) +
      P("M76 38L88 26V76L76 88Z", k.ht(3), 0) +
      P("M18 38H76V88H18Z", CRUST, W) +
      P("M18 38H76V50H18Z", k.ht(1), 0) +
      L("M47 38V44M30 26L42 38", 2) +
      G(L(Q_MARK, 6.4) + C(1, 18, 3.8, INK), at(46, 62, 0.95, 0)) +
      // caution tape
      P(tape, CHEESE, 2.6) +
      P(tape, k.hatch(8, INK, 3.4, 30), 0) +
      L("M2 80L98 56M2 94L98 70", 2.6)
    );
  },
  box: (k) =>
    pizzaBox(k, 10, 56, 78, 26, 24, 6, true, W) +
    L("M30 22c-5 -6 3 -9 -2 -15M48 20c-5 -6 3 -9 -2 -15M66 22c-5 -6 3 -9 -2 -15", 2.2, GRAY),
  "box-open": (k) =>
    // lid (inside face)
    P("M16 46L90 46L84 6L22 6Z", PAPER, W) +
    P("M56 46L90 46L84 6L62 6Z", k.ht(1), 0) +
    E(68, 22, 7, 4, CRUST, 0, `opacity=".55"`) +
    // tray
    P("M8 58L92 58L90 46L16 46Z", CRUST, W) +
    E(51, 53, 33, 6.4, CRUST, 2.6) +
    E(51, 53, 27, 4.4, TOMATO, 1.6) +
    E(51, 52.6, 24, 3.6, CHEESE, 0) +
    [[38, 52], [52, 54.5], [64, 51.8], [46, 50.6]].map(([x, y]) => E(x, y, 3.6, 1.6, TOMATO, 1.2)).join("") +
    basilLeaf(58, 54, 80, 0.3, 1.8) +
    // front
    P("M8 58H92V78H8Z", CRUST, W) +
    P("M58 58H92V78H66Z", k.ht(2), 0) +
    L("M10 64H90", 1.6) +
    L("M24 71h10M46 71h10M68 71h10", 2.4),
  slice: (k) => {
    const slice = "M10 78L76 20Q96 38 92 64Z";
    return (
      // cheese strands
      tube("M28 70C28 80 31 86 29 95", 3.2, CHEESE, 2) +
      tube("M46 68C45 76 48 82 46 88", 2.6, CHEESE, 2) +
      tube("M64 66C66 72 63 76 64 82", 2.4, CHEESE, 2) +
      E(29, 96, 3.6, 2.2, CHEESE, 2) +
      P(slice, CHEESE, W) +
      G(
        P("M60 30Q86 50 92 64L100 64L100 20Z", k.ht(2), 0) +
        pepperoni(k, 52, 50, 7) + pepperoni(k, 74, 44, 6.4) + pepperoni(k, 34, 66, 5.4) +
        basilLeaf(66, 58, 60, 0.5, 1.8) + E(40, 58, 2, 1.4, "none", 1.2) + E(78, 58, 2.4, 1.6, "none", 1.2),
        `clip-path="${k.clip("gslice", `<path d="${slice}"/>`)}"`) +
      P(slice, "none", W) +
      P("M73 16Q100 36 96 68L88 64Q90 42 70 25Z", CRUST, W) +
      P("M84 30Q93 44 92 64L88 64Q90 46 80 34Z", k.ht(2), 0) +
      L("M78 24l3 2M88 40l1 4M86 52l1 3", 1.8)
    );
  },
  pizza: (k) => pizzaTop(k, 50, 50, 43, 8, W),
  peel: (k) =>
    G(
      P("M-26 -34Q-26 -48 -12 -48H12Q26 -48 26 -34V-2Q26 6 14 8L5 10V44Q5 48 0 48Q-5 48 -5 44V10L-14 8Q-26 6 -26 -2Z", CRUST, W) +
      L("M-16 -40V-2M-6 -44V4M8 -44V2M18 -40V-4M0 16V40", 1.2, INK, `opacity=".4"`) +
      C(0, 40, 2.2, PAPER, 1.6) +
      pizzaTop(k, 0, -20, 19, 6, 2.4),
      at(50, 50, 0.9, 38)),
  oven: (k) =>
    // chimney + smoke
    P("M64 10H76V30H64Z", PAPER, W) +
    L("M70 6c-4 -3 2 -5 -1 -8", 2, GRAY) +
    // dome
    P("M8 86V56C8 22 92 22 92 56V86Z", PAPER, W) +
    P("M60 28C80 34 92 44 92 56V86H66C78 70 76 42 60 28Z", k.ht(2), 0) +
    L("M18 46C24 34 36 28 48 27", 2.4, PAPER) +
    // brick arch
    P("M24 86V64C24 40 76 40 76 64V86H66V64C66 52 34 52 34 64V86Z", TOMATO, 2.8) +
    L("M24 70H34M66 70H76M26 56L35 59M74 56L65 59M36 44L40 53M64 44L60 53M50 41V50", 1.8) +
    // mouth + fire
    P("M34 86V64C34 52 66 52 66 64V86Z", INK, 2) +
    P("M38 86C36 78 42 74 42 68C46 72 46 76 48 76C48 70 52 64 52 60C58 66 60 72 58 78C60 76 62 74 62 72C64 78 64 82 62 86Z", TOMATO, 0) +
    P("M44 86C43 81 47 79 47 76C50 79 52 82 54 80C55 83 55 85 54 86Z", CHEESE, 0) +
    // base
    P("M4 86H96V94H4Z", CRUST, W) +
    L("M20 86V94M40 86V94M60 86V94M80 86V94", 1.6),
  laptop: (k) =>
    P("M18 10H82Q86 10 86 14V60H14V14Q14 10 18 10Z", PAPER, W) +
    P("M20 16H80V54H20Z", INK, 0) +
    L("M25 23H40M44 23H52", 2.4, TOMATO) +
    L("M29 30H50M54 30H70", 2.4, CHEESE) +
    L("M29 37H44M48 37H62", 2.4, PAPER) +
    L("M25 44H34M38 44H48", 2.4, BASIL) +
    P("M52 44H57", "none", 2.4, `stroke="${PAPER}"`) +
    P("M14 60H86L96 80H4Z", PAPER, W) +
    P("M60 60H86L96 80H70Z", k.ht(1), 0) +
    L("M18 64H82M15 69H85M12 74H88", 1.2, INK, `opacity=".55"`) +
    P("M4 80H96V84Q96 87 92 87H8Q4 87 4 84Z", PAPER, 3) +
    P("M40 74H60L61 78H39Z", "none", 1.4),
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
        const fill = r === 0 && c === 0 ? TOMATO : r === 2 && c === 6 ? CHEESE : PAPER;
        keys += P(`M${f1(ax)} ${y0}L${f1(bx)} ${y0}L${f1(cx_)} ${y1}L${f1(dx)} ${y1}Z`, fill, 1.6);
      }
    }
    return (
      P("M18 34H82L90 76H10Z", PAPER, W) +
      P("M10 76H90V82Q90 84 88 84H12Q10 84 10 82Z", PAPER, 3) +
      P("M10 78H90V84H10Z", k.ht(2), 0) +
      keys +
      L("M50 34C50 22 60 22 62 14C64 8 70 6 74 8", 2.6)
    );
  },
  wrench: (k) =>
    G(
      `<path d="M-34 -12A12 12 0 1 0 -34 12A12 12 0 1 0 -34 -12ZM-38.4 -5.4L-31 -5.6L-27.4 .2L-31 6L-38.4 6L-41.8 .2Z" fill="${PAPER}" fill-rule="evenodd" ${`stroke="${INK}" stroke-width="${W}" stroke-linejoin="round"`}/>` +
      P("M-23 -5.4H20V5.4H-23Z", PAPER, W) +
      P("M20 -6C24 -16 40 -18 47 -9L37 -4.4V4.4L47 9C40 18 24 16 20 6Z", PAPER, W) +
      P("M-22 1H19V4H-22Z", k.ht(3), 0) +
      P("M24 4C28 12 38 13 44 9L37 6Z", k.ht(3), 0) +
      L("M-14 -1.2H10", 1.6, INK, `opacity=".5"`),
      at(52, 50, 1.05, -38)),
  basil: () =>
    L("M50 94C48 74 54 52 50 22", 3.2, BASIL) +
    basilLeaf(36, 44, -50, 1.5, 2.6) + basilLeaf(64, 50, 54, 1.45, 2.6) + basilLeaf(50, 20, 4, 1.3, 2.6) +
    basilLeaf(36, 70, -64, 1.15, 2.6) + basilLeaf(63, 76, 70, 1.05, 2.6),
  pepperoni: (k) => pepperoni(k, 44, 54, 34, W) + crescent(k, 44, 54, 34, 1) + pepperoni(k, 80, 22, 13, 2.8),
  mushroom: () => mushroom(48, 54, 3.4) + mushroom(80, 22, 1.4, 24),
  olive: () =>
    G(E(0, 0, 15, 20, INK, W) + L("M-6 -12C-9 -6 -9 2 -6 8", 3, PAPER, `opacity=".7"`), at(68, 32, 1, 28)) +
    olive(34, 62, 22) + olive(74, 74, 14),
  "cheese-drip": (k) =>
    P("M8 10H92V38C92 44 88 46 86 42C84 38 80 36 78 44L77 62C77 70 69 70 69 62L68 46C67 40 60 40 58 46C57 52 52 54 50 48C48 40 42 40 40 48L39 80C39 88 30 88 30 80L29 46C28 40 22 40 20 46C19 54 12 52 12 44C10 40 8 40 8 38Z", CHEESE, W) +
    P("M8 10H92V20H8Z", k.ht(2), 0) +
    E(24, 28, 5, 3.4, k.ht(4, "#d99a12", 3.4), 1.8) + E(58, 26, 6.4, 4, k.ht(4, "#d99a12", 3.4), 1.8) + E(82, 30, 3.6, 2.6, k.ht(4, "#d99a12", 3.4), 1.6) +
    L("M34 50V72M73 50V58", 2.4, PAPER, `opacity=".85"`) +
    P("M73 78C69 84 70 90 73.5 90C77 90 78 84 73 78Z", CHEESE, 2.6),
  star: (k) =>
    P(starPath(50, 54, 42, 19), CHEESE, W) +
    `<path d="${starPath(50, 54, 42, 19)}" fill="${k.ht(2)}" clip-path="${k.clip("starh", `<rect x="52" y="0" width="60" height="100"/>`)}"/>` +
    L("M36 40L44 33", 3, PAPER) +
    P(sparkleD(86, 16, 9), PAPER, 2.2) + P(sparkleD(14, 86, 6), TOMATO, 2),
  sparkle: () =>
    P(sparkleD(46, 54, 40), CHEESE, W) +
    L("M36 44C38 38 40 36 44 34", 3, PAPER) +
    P(sparkleD(82, 18, 12), TOMATO, 2.6) +
    P(sparkleD(84, 78, 7), PAPER, 2.2) +
    C(18, 18, 3, INK),
  squiggle: () => tube("M10 62C16 30 34 28 34 48C34 70 50 74 54 50C58 26 74 24 76 46C78 64 86 70 92 48", 6, TOMATO, 2.8),
  arrow: () =>
    tube("M12 80C18 40 46 22 80 32", 6, TOMATO, 2.8) +
    tube("M64 16L84 32L66 50", 6, TOMATO, 2.8),
  github: () =>
    // a generic version control branch, not a logo
    L("M30 28V72", 6) + L("M70 38C70 58 34 52 30 70", 6) +
    C(30, 22, 10, PAPER, W) + C(30, 22, 4, TOMATO) +
    C(30, 78, 10, PAPER, W) + C(30, 78, 4, INK) +
    C(70, 32, 10, PAPER, W) + C(70, 32, 4, BASIL),
  terminal: () =>
    P("M10 20Q10 14 16 14H84Q90 14 90 20V82Q90 88 84 88H16Q10 88 10 82Z", INK, W) +
    P("M10 20Q10 14 16 14H84Q90 14 90 20V28H10Z", PAPER, W) +
    C(19, 21, 3, TOMATO, 1.4) + C(28, 21, 3, CHEESE, 1.4) + C(37, 21, 3, BASIL, 1.4) +
    L("M20 42L30 50L20 58", 4, PAPER) +
    `<g data-part="caret">${L("M36 60H50", 4.4, CHEESE)}</g>` +
    L("M20 72H44M50 72H60", 2.4, PAPER, `opacity=".45"`),
  cursor: (k) =>
    L("M20 14L12 8M16 26H6M30 8L31 0", 3) +
    P("M28 16V80L44 65L56 90L68 85L56 61H78Z", PAPER, W) +
    P("M28 16L78 61H56L68 85L60 88L48 62Z", k.ht(2), 0) +
    P("M28 16V80L44 65L56 90L68 85L56 61H78Z", "none", W),
  dough: (k) =>
    E(50, 82, 42, 7, k.ht(1)) +
    P("M12 66C12 38 30 30 50 30C72 30 88 40 88 64C88 78 74 86 50 86C26 86 12 80 12 66Z", PAPER, W) +
    P("M88 64C88 78 74 86 50 86C34 86 22 82 16 76C40 80 74 76 80 46C86 52 88 58 88 64Z", k.ht(2), 0) +
    L("M36 50C42 46 50 46 58 49", 1.8) +
    [[30, 42], [44, 38], [62, 40], [40, 56], [58, 58], [72, 52], [10, 30], [90, 26], [80, 14], [20, 16]].map(([x, y], i) => C(x, y, i > 5 ? 1.6 : 1, INK, 0, `opacity="${i > 5 ? 0.55 : 0.35}"`)).join(""),
  "rolling-pin": (k) =>
    G(
      L("M-46 0H46", 6) +
      C(-46, 0, 6, CRUST, 3) + C(46, 0, 6, CRUST, 3) +
      P("M-28 -12H28Q32 -12 32 -8V8Q32 12 28 12H-28Q-32 12 -32 8V-8Q-32 -12 -28 -12Z", CRUST, W) +
      P("M-31 3H31V8Q31 11 28 11H-28Q-31 11 -31 8Z", k.ht(2), 0) +
      L("M-22 -6C-10 -8 4 -4 18 -7M-16 1C-4 -1 8 2 22 0", 1.3, INK, `opacity=".5"`) +
      L("M-26 -7H-8", 2.4, PAPER),
      at(50, 52, 1, -28)) +
    [[20, 80], [30, 86], [70, 20], [80, 28], [14, 70]].map(([x, y]) => C(x, y, 1.4, INK, 0, `opacity=".5"`)).join(""),
  "chef-hat": (k) =>
    P("M24 54C8 52 8 28 26 28C28 12 48 8 55 20C63 8 84 12 81 30C96 32 94 54 76 54Z", PAPER, W) +
    P("M81 30C96 32 94 54 76 54H62C76 48 82 40 81 30Z", k.ht(2), 0) +
    L("M40 30C40 38 42 44 44 50M58 26C60 36 60 44 58 50", 1.8) +
    P("M24 54H76L74 86H26Z", PAPER, W) +
    P("M60 54H76L74 86H62Z", k.ht(1), 0) +
    L("M36 58V82M50 58V82M64 58V82", 1.6) +
    P("M25 62H75L74.6 68H25.4Z", TOMATO, 2),
  sneaker: (k) => sneaker(k, 40, 46, false, -6, 1.75),
  headphones: (k) =>
    tube("M22 64C16 18 84 18 78 64", 5, BASIL, 2.8) +
    P("M22 56H30V84H22Z", INK, 0) + P("M70 56H78V84H70Z", INK, 0) +
    P("M8 56Q8 50 14 50H22Q28 50 28 56V86Q28 92 22 92H14Q8 92 8 86Z", INK, W) +
    P("M72 56Q72 50 78 50H86Q92 50 92 56V86Q92 92 86 92H78Q72 92 72 86Z", INK, W) +
    P("M76 54H86Q88 54 88 58V84Q88 88 86 88H76Z", k.ht(3, PAPER, 3.6), 0) +
    L("M12 58V78", 2, PAPER, `opacity=".7"`) +
    L("M36 30C42 26 48 25 54 25", 2, PAPER, `opacity=".7"`),
  coffee: (k) =>
    L("M38 22c-5 -6 3 -9 -2 -15M52 20c-5 -6 3 -9 -2 -15", 2.4, GRAY) +
    tube("M70 44C88 42 88 72 68 72", 5, PAPER, 2.8) +
    P("M20 32H72L68 84Q67 90 60 90H32Q25 90 24 84Z", PAPER, W) +
    P("M56 32H72L68 84Q67 90 60 90H50Q60 70 56 32Z", k.ht(2), 0) +
    P("M22 52H71L70 64H23Z", TOMATO, 2.4) +
    G(P("M0 -4C-2 -8 -8 -6 -6 -1L0 4L6 -1C8 -6 2 -8 0 -4Z", PAPER, 1.4), at(46, 58)) +
    E(46, 32, 26, 5, INK, W) +
    E(46, 32.6, 20, 3.2, "#5b3a22", 0) +
    L("M34 32C38 30.6 44 30.4 48 31", 1.4, CRUST),
};

export const GLYPH_IDS = Object.keys(DRAW) as BaseGlyph[];

/** glyph markup in a 100 x 100 box, for embedding inside other drawings */
export function glyphBody(k: Kit, id: string): string {
  const f = DRAW[id as BaseGlyph] ?? DRAW.star;
  return G(G(f(k), `transform="translate(4 4) scale(.92)"`), `data-glyph="${id}"`);
}

export function glyph(id: string, opts: ArtOpts = {}): string {
  const k = new Kit();
  return k.wrap("0 0 100 100", glyphBody(k, id), opts);
}
