// Wide illustration scenes, 800 x 500. Mascots are placed with group
// transforms; their parts use fill-box origins so they animate at any scale.
import { TOOLS, SITE } from "../data/site";
import { Kit, INK, TOMATO, CHEESE, CRUST, BASIL, PAPER, GRAY, F_MONO, P, L, C, E, G, at, tube, part, rng, f1, ArtOpts } from "./core";
import { mascotBody, mascotLayers, Who, Pose } from "./mascots";
import { glyphBody, sparkleD } from "./glyphs";
import { pepperoni, basilLeaf, laptop, pizzaBox } from "./props";
import { T } from "./posters";

export type SceneId = "duo-push" | "duo-wave" | "kitchen" | "tree" | "duo-laptops" | "duo-carry";

/** place a mascot: x,y = top-left of its 200x300 box, s = scale */
function placeMascot(k: Kit, who: Who, pose: Pose, x: number, y: number, s: number, extra = ""): string {
  return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${s})" data-part="mascot-${who}"${extra ? " " + extra : ""}>${mascotBody(k, who, pose)}</g>`;
}

function placeGlyph(k: Kit, id: string, cx: number, cy: number, size: number, rot = 0): string {
  return G(glyphBody(k, id), `transform="translate(${cx} ${cy}) rotate(${rot}) scale(${size / 100}) translate(-50 -50)"`);
}

function confetti(seed: number, n: number, x0: number, y0: number, w: number, h: number): string {
  const r = rng(seed);
  const cols = [TOMATO, CHEESE, BASIL, INK];
  let out = "";
  for (let i = 0; i < n; i++) {
    const x = f1(x0 + r() * w), y = f1(y0 + r() * h), rot = f1(r() * 180), c = cols[i % 4];
    const kind = i % 3;
    out += kind === 0
      ? `<rect x="-4" y="-1.6" width="8" height="3.2" rx="1" fill="${c}" transform="translate(${x} ${y}) rotate(${rot})"/>`
      : kind === 1
        ? C(x, y, 2.2, c)
        : L(`M${x} ${y}q3 -4 6 0t6 0`, 1.8, c);
  }
  return part("confetti", null, out);
}

/* ------------------------------------------------------------- duo-push */

function duoPush(k: Kit): string {
  const ground = 452;
  return (
    part("ground", null,
      L(`M0 ${ground}H800`, 2.4) +
      `<rect x="0" y="${ground}" width="800" height="48" fill="${k.ht(1)}"/>` +
      L("M60 466H140M220 476H260M420 470H520", 1.6, INK, `opacity=".5"`)) +
    part("wall", null,
      `<rect x="640" y="-10" width="170" height="520" fill="${INK}"/>` +
      L("M640 -10V510", 4) +
      L("M652 60l-10 6M652 190l-12 4M652 330l-10 -6", 2, PAPER, `opacity=".7"`)) +
    // speed lines + dust kicked behind
    part("speed", null,
      L("M20 220H96M8 250H70M34 280H110M14 330H60", 3) +
      P("M70 448C58 448 54 438 64 432C64 422 78 418 84 426C92 418 106 424 102 434C110 438 106 450 96 450Z", PAPER, 2.4) +
      P("M36 444C28 444 26 436 32 432C34 426 42 426 44 430C50 428 56 434 52 440Z", PAPER, 2) +
      C(112, 438, 4, PAPER, 2) + C(20, 430, 3, PAPER, 1.8)) +
    placeMascot(k, "jonah", "push", 128, 42, 1.43) +
    placeMascot(k, "peter", "push", 360, 36, 1.45) +
    // impact sparks on the wall
    part("impact", null,
      L("M634 120l-14 -10M630 150h-16M634 182l-14 10", 3) +
      P(sparkleD(612, 84, 12), CHEESE, 2.4) + P(sparkleD(600, 226, 8), TOMATO, 2)) +
    // a pepperoni and basil leaf jostled loose
    G(pepperoni(k, 300, 70, 10, 2.4) + basilLeaf(250, 40, 30, 1, 2.2) + L("M282 60l-8 -4M318 52l6 -6", 2), `data-part="flying"`)
  );
}

/* ------------------------------------------------------------- duo-wave */

function duoWave(k: Kit): string {
  const cols = [TOMATO, CHEESE, BASIL, PAPER];
  let flags = "";
  for (let i = 0; i < 14; i++) {
    const x = 20 + i * 56, y = 30 + Math.sin((i / 13) * Math.PI) * 34;
    const ny = 30 + Math.sin(((i + 1) / 13) * Math.PI) * 34;
    flags += P(`M${x + 6} ${f1(y + 1)}L${x + 50} ${f1(ny + 1)}L${x + 28} ${f1((y + ny) / 2 + 40)}Z`, cols[i % 4], 2.2);
  }
  return (
    part("sun", null,
      C(400, 250, 200, PAPER) +
      `<circle cx="400" cy="250" r="200" fill="${k.ht(1)}"/>`) +
    part("bunting", null, L("M0 20Q400 96 800 20", 2.4) + flags) +
    confetti(7, 46, 30, 90, 740, 260) +
    part("ground", null, E(400, 466, 300, 14, k.ht(2)) + L("M80 466H720", 2.4)) +
    placeMascot(k, "jonah", "wave", 146, 62, 1.35) +
    placeMascot(k, "peter", "wave", 424, 62, 1.35) +
    P(sparkleD(150, 150, 16), CHEESE, 2.4) + P(sparkleD(660, 130, 12), TOMATO, 2.2) + P(sparkleD(690, 330, 8), PAPER, 2)
  );
}

/* ------------------------------------------------------------- kitchen */

function kitchen(k: Kit): string {
  const top = 372;
  let tiles = "";
  for (let y = 196; y < top; y += 22) tiles += `M300 ${y}H800`;
  for (let x = 300, row = 0; x <= 800; x += 30, row++) tiles += `M${x} 196V${top}`;
  return (
    // wall
    `<rect width="800" height="500" fill="${PAPER}"/>` +
    `<rect width="800" height="500" fill="${k.ht(1)}" opacity=".5"/>` +
    `<rect x="300" y="196" width="500" height="${top - 196}" fill="${PAPER}"/>` +
    L(tiles, 1, INK, `opacity=".25"`) +
    L(`M300 196H800`, 2.2) +
    // window
    part("window", null,
      P("M560 30H760V170H560Z", CHEESE, 3.4) +
      C(700, 74, 22, PAPER, 2.4) +
      P("M560 140C600 118 640 130 680 118C720 108 746 124 760 118V170H560Z", BASIL, 2.4) +
      L("M660 30V170M560 100H760", 4) +
      P("M548 170H772V182H548Z", PAPER, 3)) +
    // shelf with jars
    part("shelf", null,
      P("M330 140H520V150H330Z", CRUST, 3) +
      P("M346 106H376V140H346Z", PAPER, 2.6) + P("M344 100H378V108H344Z", TOMATO, 2.4) + L("M352 122H370", 1.6) +
      P("M390 114H414V140H390Z", PAPER, 2.6) + P("M388 108H416V116H388Z", BASIL, 2.4) +
      P("M428 94H460V140H428Z", PAPER, 2.6) + P("M428 114H460V140H428Z", CHEESE, 0) + P("M428 94H460V140H428Z", "none", 2.6) + P("M426 88H462V96H426Z", INK, 2) +
      G(placeGlyph(k, "coffee", 0, 0, 52), at(492, 116))) +
    // hanging lamp
    part("lamp", null,
      L("M470 0V18", 2.4) +
      P("M438 50C438 26 502 26 502 50Z", TOMATO, 3) + P("M438 50H502", "none", 3) +
      E(470, 54, 8, 4, CHEESE, 2)) +
    // oven on a brick stand
    part("oven", null,
      P("M20 300H280V420H20Z", TOMATO, 3.4) +
      L("M20 330H280M20 360H280M20 390H280M60 300V330M140 300V330M220 300V330M100 330V360M180 330V360M260 330V360M60 360V390M140 360V390M220 360V390M100 390V420M180 390V420", 1.6) +
      P("M20 300H280V420H20Z", k.ht(2), 0) +
      G(placeGlyph(k, "oven", 0, 0, 300), `transform="translate(150 170)"`)) +
    // counter back edge, mascots behind it
    placeMascot(k, "jonah", "point", 330, 150, 1.12) +
    placeMascot(k, "peter", "carry", 562, 146, 1.12) +
    // counter
    part("counter", null,
      P(`M280 ${top}H800V500H280Z`, PAPER, 3.4) +
      P(`M272 ${top - 12}H808V${top}H272Z`, CRUST, 3.4) +
      L(`M290 ${top - 6}H780`, 1.4, INK, `opacity=".4"`) +
      L(`M420 ${top}V500M560 ${top}V500M700 ${top}V500`, 2.4) +
      C(404, 420, 4, INK) + C(436, 420, 4, INK) + C(544, 420, 4, INK) + C(576, 420, 4, INK) + C(684, 420, 4, INK) +
      `<rect x="${280}" y="${top}" width="520" height="128" fill="${k.ht(1)}"/>`) +
    // things on the counter
    G(laptop(k, 440, top - 12, 96, "win"), `data-part="laptop-jonah"`) +
    G(laptop(k, 680, top - 12, 96, "mac"), `data-part="laptop-peter"`) +
    G(E(334, top - 14, 26, 10, PAPER, 2.6) + E(326, top - 22, 12, 9, PAPER, 2.4) + E(344, top - 22, 13, 9.4, PAPER, 2.4), `data-part="dough"`) +
    G(placeGlyph(k, "register", 560, top - 40, 64), `data-part="register"`) +
    // floor in front of the oven, peel leaning on it
    `<rect x="0" y="420" width="280" height="80" fill="${CRUST}"/>` +
    `<rect x="0" y="420" width="280" height="80" fill="${k.ht(2)}"/>` +
    L("M0 420H280", 3) +
    G(placeGlyph(k, "peel", 0, 0, 170, -60), `transform="translate(250 398)" data-part="peel"`) +
    // steam from the oven
    L("M120 92c-8 -10 6 -16 -2 -28M150 84c-8 -10 6 -16 -2 -28", 2.4, GRAY)
  );
}

/* ------------------------------------------------------------- tree */

function bez(p0: number[], p1: number[], p2: number[], p3: number[], t: number): [number, number] {
  const u = 1 - t;
  return [0, 1].map((i) => u * u * u * p0[i] + 3 * u * u * t * p1[i] + 3 * u * t * t * p2[i] + t * t * t * p3[i]) as [number, number];
}

function tree(k: Kit): string {
  const ground = 462;
  const trunk = "M318 470L400 168L482 470Z";
  // fruit slots fan around the crown; left and right alternate up the trunk
  const slots = [
    { at: [380, 360], to: [104, 236] },
    { at: [420, 360], to: [696, 236] },
    { at: [388, 300], to: [196, 112] },
    { at: [412, 300], to: [604, 112] },
    { at: [396, 236], to: [322, 56] },
    { at: [404, 236], to: [478, 56] },
    { at: [392, 410], to: [36, 352] },
    { at: [408, 410], to: [764, 352] },
  ];
  let branches = "", leaves = "", fruits = "";
  TOOLS.slice(0, slots.length).forEach((tool, i) => {
    const s = slots[i];
    const [ax, ay] = s.at, [tx, ty] = s.to;
    const fy = ty - 40; // stem top above fruit
    const dir = tx < ax ? -1 : 1;
    const p0 = [ax, ay], p1 = [ax + dir * 40, ay - 70], p2 = [tx - dir * 60, fy + 10], p3 = [tx, fy];
    branches += `<path data-part="branch" data-slug="${tool.slug}" pathLength="1" d="M${p0}C${p1} ${p2} ${p3}" fill="none" ${`stroke="${INK}" stroke-width="${7 - (i >> 1) * 0.8}" stroke-linecap="round"`}/>`;
    [0.45, 0.72].forEach((t, j) => {
      const [lx, ly] = bez(p0, p1, p2, p3, t);
      leaves += G(basilLeaf(f1(lx), f1(ly - 10), (j ? 30 : -30) * dir + (dir > 0 ? 20 : -20), 1.2, 2.2), `data-part="leaf"`);
    });
    const label = tool.name.toUpperCase();
    fruits += part("fruit",
      [tx, fy],
      L(`M${tx} ${fy}V${ty - 30}`, 3) +
      C(tx + 4, ty + 4, 34, INK) +
      C(tx, ty, 34, PAPER, 3) +
      C(tx, ty, 34, "none", 0, `stroke="${tool.color}" stroke-width="5" stroke-dasharray="${f1(Math.PI * 2 * 34 / 24)} ${f1(Math.PI * 2 * 34 / 24)}" transform="rotate(-90 ${tx} ${ty})" opacity=".9"`) +
      placeGlyph(k, tool.glyph, tx, ty, 54) +
      `<rect x="${f1(tx - label.length * 3.4 - 6)}" y="${ty + 42}" width="${f1(label.length * 6.8 + 12)}" height="15" rx="7.5" fill="${INK}"/>` +
      T(tx, ty + 53, label, 9, PAPER, F_MONO, `text-anchor="middle" font-weight="600" letter-spacing=".1em"`),
      `data-slug="${tool.slug}"`);
  });
  const clip = k.clip("trunk", `<path d="${trunk}"/>`);
  return (
    part("ground", null,
      E(400, ground + 8, 360, 16, k.ht(2)) +
      L(`M40 ${ground}H760`, 2.4) +
      L("M90 472H150M640 476H720M240 480H300", 1.6, INK, `opacity=".5"`)) +
    `<g data-part="branches">${branches}</g>` +
    `<g data-part="leaves">${leaves}</g>` +
    // trunk: an upright slice, crust as the root flare
    part("trunk", null,
      P(trunk, CHEESE, 0) +
      G(
        P("M430 160L500 160L500 480L452 480Q470 320 430 160Z", k.ht(2), 0) +
        pepperoni(k, 392, 260, 10) + pepperoni(k, 420, 330, 12) + pepperoni(k, 372, 380, 11) + pepperoni(k, 430, 420, 9) +
        basilLeaf(398, 300, -20, 0.9) + basilLeaf(396, 430, 40, 1) +
        E(408, 218, 3, 2, "none", 1.4) + E(384, 330, 3.4, 2.4, "none", 1.4) + E(410, 386, 3, 2, "none", 1.4),
        `clip-path="${clip}"`) +
      P(trunk, "none", 4.4) +
      // cheese drip off the tip
      tube("M398 176C398 186 401 192 399 200", 3, CHEESE, 2) +
      // crust roots
      P("M300 470C300 450 320 440 340 444C360 436 440 436 460 444C480 440 500 450 500 470C500 482 488 486 476 482C440 476 360 476 324 482C312 486 300 482 300 470Z", CRUST, 4) +
      P("M306 472C330 466 470 466 494 472C494 478 488 482 476 481C440 476 360 476 324 481C314 482 306 478 306 472Z", k.ht(2), 0) +
      L("M300 466C284 470 270 470 256 466M500 466C516 470 530 470 544 466", 4) +
      T(400, 464, SITE.trunk.name.toUpperCase(), 9.4, INK, F_MONO, `text-anchor="middle" font-weight="700" letter-spacing=".14em"`)) +
    fruits +
    // the duo under the tree
    placeMascot(k, "jonah", "sit", 170, 300, 0.56) +
    placeMascot(k, "peter", "wave", 540, 300, 0.56)
  );
}

/* ------------------------------------------------------------- duo-laptops */

/** both of them on pizza box stacks, leaning back to back, laptops on their laps */
function duoLaptops(k: Kit): string {
  const ground = 452, s = 1.12;
  // seat: local y 210 sits on the top box lid; feet hang in front of the stack
  const sitter = (who: Who, cx: number, lean: number) => {
    const x = cx - 100 * s, y = 314 - 210 * s;
    const L0 = mascotLayers(k, who, "lap");
    const lap = G(laptop(k, 100, 210, 92, who === "jonah" ? "win" : "mac", 3), `data-part="laptop"`);
    return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${s}) rotate(${lean} 100 210)" data-part="mascot-${who}"><g data-who="${who}" data-pose="lap">${L0.back}${lap}</g></g>`;
  };
  const stack = (cx: number, seed: number) => {
    const r = rng(seed);
    const w = 150;
    return pizzaBox(k, cx - w / 2 + 4, 404, w - 8, 30, 14, -4, false, 3) +
      pizzaBox(k, cx - w / 2 - 6 + r() * 8, 362, w + 4, 30, 14, 5, false, 3) +
      pizzaBox(k, cx - w / 2 + r() * 6, 320, w, 30, 14, -3, true, 3);
  };
  return (
    part("sun", null, C(400, 220, 190, PAPER) + `<circle cx="400" cy="220" r="190" fill="${k.ht(1)}"/>` + C(400, 220, 190, "none", 0, `stroke="${INK}" stroke-width="1.4" stroke-dasharray="2 6"`)) +
    part("ground", null,
      E(400, ground - 2, 300, 14, k.ht(2)) +
      L(`M60 ${ground}H740`, 2.6) +
      L(`M110 ${ground + 14}H190M560 ${ground + 18}H660M300 ${ground + 22}H340`, 1.6, INK, `opacity=".5"`)) +
    part("seat", null, stack(278, 3) + stack(522, 9)) +
    sitter("jonah", 290, 9) +
    sitter("peter", 510, -9) +
    // a shared idea between them
    part("spark", null,
      P(sparkleD(400, 64, 16), CHEESE, 2.6) +
      L("M372 70l-12 -4M428 70l12 -4M400 34v-12", 2.4)) +
    // what they are typing, drifting out to each side
    part("code", null,
      T(120, 170, "{ }", 30, INK, F_MONO, `font-weight="700"`) +
      T(640, 180, "</>", 26, INK, F_MONO, `font-weight="700"`) +
      L("M150 214h40M136 228h28M640 220h36M654 234h24", 3, INK, `opacity=".8"`) +
      L("M196 214h10M672 234h8", 3, TOMATO)) +
    G(placeGlyph(k, "coffee", 120, 420, 64, -4), `data-part="mug"`) +
    G(placeGlyph(k, "box-empty", 690, 412, 84, 6), `data-part="empty-box"`) +
    P(sparkleD(700, 110, 10), PAPER, 2.2) + P(sparkleD(96, 94, 7), INK, 1.4)
  );
}

/* ------------------------------------------------------------- duo-carry */

/** both of them carrying one big pizza box, walking right */
function duoCarry(k: Kit): string {
  const ground = 456, s = 1.2;
  const y = ground - 287 * s;
  const jx = 250 - 100 * s, px = 540 - 100 * s;
  const J = mascotLayers(k, "jonah", "lift"), Pt = mascotLayers(k, "peter", "lift");
  const at2 = (x: number, bob: number, extra = "") => `transform="translate(${f1(x)} ${f1(y + bob)}) scale(${s})${extra}"`;
  const handY = y + 197 * s;
  const bx0 = jx + 30 * s, bx1 = px + 170 * s;
  return (
    part("ground", null,
      L(`M40 ${ground}H760`, 2.6) +
      `<rect x="40" y="${ground}" width="720" height="40" fill="${k.ht(1)}"/>` +
      L("M70 470H150M330 476H380M600 468H700", 1.6, INK, `opacity=".5"`)) +
    // speed lines and dust behind
    part("speed", null,
      L("M30 230H100M14 262H80M40 296H120M20 340H72", 3) +
      P("M86 446C74 446 70 436 80 430C80 420 94 416 100 424C108 416 122 422 118 432C126 436 122 448 112 448Z", PAPER, 2.4) +
      C(130, 436, 4, PAPER, 2) + C(60, 440, 3, PAPER, 1.8)) +
    `<g ${at2(jx, 0)} data-part="mascot-jonah"><g data-who="jonah" data-pose="lift">${J.back}</g></g>` +
    `<g ${at2(px, -4)} data-part="mascot-peter"><g data-who="peter" data-pose="lift">${Pt.back}</g></g>` +
    // the big box, steaming
    part("box", null,
      pizzaBox(k, bx0, handY - 6, bx1 - bx0, 40, 30, 10, true, 3.4) +
      L(`M${f1(bx0 + 90)} ${f1(handY - 52)}c-6 -8 4 -12 -2 -22M${f1(bx0 + 170)} ${f1(handY - 56)}c-6 -8 4 -12 -2 -22M${f1(bx0 + 250)} ${f1(handY - 52)}c-6 -8 4 -12 -2 -22`, 2.2, INK, `opacity=".7"`)) +
    `<g ${at2(jx, 0)} data-part="arms-jonah">${J.front}</g>` +
    `<g ${at2(px, -4)} data-part="arms-peter">${Pt.front}</g>` +
    // where they are headed
    part("arrow", null, placeGlyph(k, "arrow", 716, 150, 90, 8)) +
    P(sparkleD(660, 70, 12), CHEESE, 2.4) + P(sparkleD(150, 120, 8), PAPER, 2) +
    L("M700 300l14 -4M702 322h16M700 344l14 4", 2.6)
  );
}

const DRAW: Record<SceneId, (k: Kit) => string> = { "duo-push": duoPush, "duo-wave": duoWave, kitchen, tree, "duo-laptops": duoLaptops, "duo-carry": duoCarry };

export function scene(id: SceneId, opts: ArtOpts = {}): string {
  const k = new Kit();
  return k.wrap("0 0 800 500", G(DRAW[id](k), `data-scene="${id}"`), opts);
}

