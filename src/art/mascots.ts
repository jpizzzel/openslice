// Jonah and Peter as pizza slice characters. Drawn in a 200 x 300 space,
// ground line at y≈286. Every pose is its own drawing (limbs, face, staging);
// only the slice torso is shared.
import { Kit, INK, TOMATO, CHEESE, CRUST, BASIL, PAPER, GRAY, P, L, C, E, G, at, tube, part, ArtOpts } from "./core";
import { pepperoni, olive, basilLeaf, sneaker, pizzaBox, cmdKey } from "./props";

export type Who = "jonah" | "peter";
export type Pose = "stand" | "wave" | "push" | "point" | "sit" | "carry";
export const POSES: Pose[] = ["stand", "wave", "push", "point", "sit", "carry"];

type EyeKind = "open" | "lid" | "happy" | "squint" | "wide" | "wink";
type BrowKind = "flat" | "up" | "angry" | "quirk";
type MouthKind = "smile" | "grin" | "o" | "grit" | "smirk" | "cat";

interface Face {
  dx?: number;
  look?: [number, number];
  eyes: EyeKind;
  brows: BrowKind;
  mouth: MouthKind;
  sweat?: boolean;
}

const SLICE = "M34 76C70 71 130 71 166 76Q150 146 112 207Q100 223 88 207Q50 146 34 76Z";
const CRUST_D =
  "M24 72C20 58 33 50 45 49C52 41 68 39 79 43C90 36 110 36 121 43C132 39 148 41 155 49C168 50 181 58 176 72C176 82 168 86 158 83C128 76 72 76 42 83C32 86 24 82 24 72Z";
const ARM_W = 6.2;
const LEG_W = 7;

/* ---------------------------------------------------------------- hands */

/** hands drawn in local space around the wrist end (0,0) */
const HAND = {
  open:
    "M-7 7C-10 3 -10.4 -2 -9.4 -6L-10 -10C-10.2 -13.4 -6 -14 -5.6 -10.6L-5 -7L-5 -13.2C-5 -16.8 -.6 -16.8 -.6 -13.2L-.4 -7.6L0 -14.2C.2 -17.8 4.6 -17.4 4.4 -13.8L3.9 -7L4.8 -11.4C5.4 -14.4 9.2 -13.6 8.6 -10.4L7.4 -3C9.2 -5.4 12.6 -6.2 13.4 -3.4C14 -1.2 11 2.4 9 5.2C6.4 9.2 -2 10.8 -7 7Z",
  fist:
    "M-7.4 -4.6C-6.6 -9.4 6.6 -9.6 8 -4.8C9.8 .6 8.8 6.6 3.6 8.2C-1 9.6 -5.6 8.8 -7.6 5.4C-9.4 2.4 -8.4 -1.8 -7.4 -4.6Z",
  point:
    "M-6.8 -5.6C-3.6 -8.8 3.4 -8.6 6.2 -6.4L18.4 -6.6C21.8 -6.6 21.8 -1.4 18.4 -1.4L8 -1.2C9.6 2.4 8.4 7 3.4 8.2C-1.4 9.4 -6 8 -8 4.6C-9.6 1.2 -9.2 -3.4 -6.8 -5.6Z",
  flat:
    "M-5.4 9C-8.4 3 -8.2 -9 -5.6 -15C-3.8 -19.2 3 -19 4 -14.8C5 -10 5.2 -2 4.4 9Z",
};

function hand(kind: keyof typeof HAND, x: number, y: number, rot = 0, flip = false, s = 1): string {
  let detail = "";
  if (kind === "fist") detail = L("M-3.4 -7.2V-2.6M.8 -7.8V-2.8M4.8 -7V-2.4M-6.6 1.6C-2.4 3.6 1.8 3.4 5.4 .8", 1.5);
  if (kind === "point") detail = L("M-1.2 -1.4C1.8 -.4 4.8 -.6 7.6 -1.6M-4 2.8C-1 4.2 2 4 4.6 2.6", 1.5);
  if (kind === "open") detail = L("M-2.4 2.2C0 4.2 3 4 5 2", 1.3);
  if (kind === "flat")
    detail =
      P("M-6.2 1C-11.6 -.4 -12.6 -6 -9.4 -8.4C-7.4 -9.8 -5.6 -7 -5.6 -5", PAPER, 2.4) +
      L("M-1.6 -16V-6.6M1.4 -15.6V-6.8", 1.3);
  const t = `translate(${x} ${y})${rot ? ` rotate(${rot})` : ""}${flip ? " scale(-1 1)" : ""}${s !== 1 ? ` scale(${s})` : ""}`;
  return G(P(HAND[kind], PAPER, 2.6) + detail, `transform="${t}"`);
}

/* ---------------------------------------------------------------- face */

function eyePair(who: Who, f: Face): string {
  const dx = f.dx ?? 0;
  const [lx, ly] = f.look ?? [0, 0];
  const out: string[] = [];
  [80 + dx, 120 + dx].forEach((cx, i) => {
    const cy = 118;
    const kind: EyeKind = f.eyes === "wink" ? (i === 0 ? "happy" : "open") : f.eyes;
    if (kind === "happy") {
      out.push(L(`M${cx - 8.5} ${cy + 3}Q${cx} ${cy - 11} ${cx + 8.5} ${cy + 3}`, 4.2));
      return;
    }
    if (kind === "squint") {
      const s = i === 0 ? 1 : -1;
      out.push(L(`M${cx - 7 * s} ${cy - 7}L${cx + 6 * s} ${cy}L${cx - 7 * s} ${cy + 7}`, 4.2));
      return;
    }
    const rx = kind === "wide" ? 11.5 : 10, ry = kind === "wide" ? 13.5 : 12;
    const pr = kind === "wide" ? 4.2 : 5.4;
    out.push(E(cx, cy, rx, ry, PAPER, 2.8));
    out.push(E(cx + lx, cy + ly + 1, pr, pr * 1.22, INK));
    out.push(C(cx + lx - 1.8, cy + ly - 2, 1.9, PAPER));
    out.push(C(cx + lx + 1.6, cy + ly + 3.4, 0.9, PAPER));
    if (kind === "lid" || who === "peter") {
      // Peter's signature heavy upper lids
      const drop = kind === "lid" ? 1 : 5;
      out.push(P(`M${cx - 12.5} ${cy - drop}Q${cx} ${cy - drop - 6} ${cx + 12.5} ${cy - drop}L${cx + 12.5} ${cy - 15}L${cx - 12.5} ${cy - 15}Z`, CHEESE, 0));
      out.push(L(`M${cx - 11.4} ${cy - drop + 0.6}Q${cx} ${cy - drop - 6} ${cx + 11.4} ${cy - drop + 0.6}`, 3.6));
      out.push(L(`M${cx + 9.6 * (i ? 1 : -1)} ${cy - drop}l${2.6 * (i ? 1 : -1)} -2.4`, 2));
    } else {
      // Jonah's lashes flick
      out.push(L(`M${cx + 9 * (i ? 1 : -1)} ${cy - 7}l${3.4 * (i ? 1 : -1)} -3`, 2.4));
    }
  });
  return part("eyes", null, out.join(""), `style="transform-box:fill-box;transform-origin:50% 55%"`);
}

function brows(who: Who, f: Face): string {
  const dx = f.dx ?? 0;
  const w = who === "jonah" ? 5 : 3.8;
  const out: string[] = [];
  [80 + dx, 120 + dx].forEach((cx, i) => {
    const s = i === 0 ? 1 : -1; // inner side direction
    const y = 98;
    let d = "";
    switch (f.brows) {
      case "flat": d = who === "jonah" ? `M${cx - 9} ${y + 1}L${cx + 9} ${y - 0.5}` : `M${cx - 9} ${y + 1}Q${cx} ${y - 5} ${cx + 9} ${y}`; break;
      case "up": d = `M${cx - 9} ${y}Q${cx} ${y - 8} ${cx + 9} ${y - 1}`; break;
      case "angry": d = `M${cx - 9 * s} ${y - 4}L${cx + 8 * s} ${y + 3}`; break;
      case "quirk": d = i === 0 ? `M${cx - 9} ${y + 1}L${cx + 9} ${y + 1}` : `M${cx - 9} ${y - 2}Q${cx} ${y - 10} ${cx + 9} ${y - 3}`; break;
    }
    out.push(L(d, w));
  });
  return part("brows", null, out.join(""));
}

function mouth(f: Face): string {
  const x = 100 + (f.dx ?? 0), y = 146;
  let m = "";
  switch (f.mouth) {
    case "smile":
      m = L(`M${x - 11} ${y - 2}Q${x} ${y + 9} ${x + 11} ${y - 2}`, 3.4) + L(`M${x - 13} ${y}l3 -3.6M${x + 13} ${y}l-3 -3.6`, 2.4);
      break;
    case "grin":
      m =
        P(`M${x - 14} ${y - 4}Q${x} ${y - 1} ${x + 14} ${y - 4}Q${x + 12} ${y + 15} ${x} ${y + 15}Q${x - 12} ${y + 15} ${x - 14} ${y - 4}Z`, INK, 3) +
        P(`M${x - 8} ${y + 9}Q${x} ${y + 3} ${x + 8} ${y + 9}Q${x + 5} ${y + 13.5} ${x} ${y + 13.5}Q${x - 5} ${y + 13.5} ${x - 8} ${y + 9}Z`, TOMATO, 0) +
        P(`M${x - 12} ${y - 2.6}Q${x} ${y} ${x + 12} ${y - 2.6}L${x + 11} ${y + 1.4}Q${x} ${y + 3.6} ${x - 11} ${y + 1.4}Z`, PAPER, 0);
      break;
    case "o":
      m = E(x, y + 3, 5.6, 6.8, INK, 2.6) + E(x, y + 6, 3.4, 2.4, TOMATO);
      break;
    case "grit":
      m =
        P(`M${x - 12} ${y - 4}H${x + 12}Q${x + 15} ${y - 4} ${x + 15} ${y + 1}Q${x + 15} ${y + 6} ${x + 12} ${y + 6}H${x - 12}Q${x - 15} ${y + 6} ${x - 15} ${y + 1}Q${x - 15} ${y - 4} ${x - 12} ${y - 4}Z`, PAPER, 2.8) +
        L(`M${x - 14} ${y + 1}H${x + 14}M${x - 6} ${y - 4}V${y + 6}M${x} ${y - 4}V${y + 6}M${x + 6} ${y - 4}V${y + 6}`, 1.6);
      break;
    case "smirk":
      m = L(`M${x - 11} ${y + 1}Q${x - 1} ${y + 7} ${x + 12} ${y - 4}`, 3.4) + L(`M${x + 9.6} ${y - 5.4}l4 3`, 2.4);
      break;
    case "cat":
      m = L(`M${x - 10} ${y}Q${x - 5} ${y + 6} ${x} ${y}Q${x + 5} ${y + 6} ${x + 10} ${y}`, 3.2);
      break;
  }
  return part("mouth", null, m, `style="transform-box:fill-box;transform-origin:50% 30%"`);
}

function blush(k: Kit, f: Face): string {
  const dx = f.dx ?? 0;
  const ht = k.ht(4, TOMATO, 3.2);
  return E(64 + dx, 137, 8, 5, ht) + E(136 + dx, 137, 8, 5, ht) +
    L(`M${60 + dx} ${136}l2.4 -3M${65 + dx} ${136}l2.4 -3M${135 + dx} ${136}l2.4 -3M${140 + dx} ${136}l2.4 -3`, 1.4);
}

/* ---------------------------------------------------------------- torso */

function hat(k: Kit, who: Who): string {
  if (who === "jonah") {
    // backwards cap: bill out the back, strap opening facing us, a sticker on the side panel
    return part("hat", [100, 50],
      P("M52 44C38 34 18 34 10 43C9 46 12 49 18 49C30 49 42 49 52 52Z", TOMATO, 3.4) +
      P("M52 44C38 34 18 34 10 43C9 46 12 49 18 49C30 49 42 49 52 52Z", k.ht(3), 0) +
      P("M45 55C42 25 68 9 100 9C132 9 158 25 155 55C130 47 70 47 45 55Z", TOMATO, 4) +
      P("M100 9C132 9 158 25 155 55C146 51 134 49 124 48C130 34 122 18 100 9Z", k.ht(2), 0) +
      L("M100 11C86 20 76 34 73 49M100 11C114 20 124 34 127 49", 1.8) +
      P("M86 50Q86 33 100 33Q114 33 114 50Z", CRUST, 2.6) +
      P("M84.5 43.5H115.5V50H84.5Z", INK, 0) +
      C(92, 46.7, 1.3, PAPER) + C(100, 46.7, 1.3, PAPER) + C(108, 46.7, 1.3, PAPER) +
      C(100, 9.5, 4, TOMATO, 2.6) +
      // windows-ish four pane laptop sticker
      G(P("M-8 -7L8 -7L8 7L-8 7Z", PAPER, 1.8) +
        P("M-5.4 -4.6L-.8 -5.2L-.8 -.8L-5.4 -.6ZM.8 -5.4L5.6 -6L5.6 -.8L.8 -.8ZM-5.4 .8L-.8 .8L-.8 5.2L-5.4 4.6ZM.8 .8L5.6 .8L5.6 6L.8 5.4Z", INK, 0),
        at(68, 31, 1, -14)));
  }
  // over-ear headphones in basil, with a command-key sticker on the cup
  return part("headphones", [100, 20],
    tube("M24 70C18 24 56 6 100 6C144 6 182 24 176 70", 5.4, BASIL, 2.6) +
    L("M44 22C60 12 80 9 98 9", 1.6, PAPER, `opacity=".6"`) +
    P("M22 62H31V96H22Z", INK, 0) + P("M169 62H178V96H169Z", INK, 0) +
    P("M8 60Q8 54 16 54H24Q30 54 30 60V98Q30 104 24 104H16Q8 104 8 98Z", INK, 3) +
    P("M170 60Q170 54 176 54H184Q192 54 192 60V98Q192 104 184 104H176Q170 104 170 98Z", INK, 3) +
    P("M174 58H186Q188.6 58 188.6 62V96Q188.6 100 186 100H174Z", k.ht(3, PAPER, 3.6), 0) +
    L("M12 62V86", 2, PAPER, `opacity=".7"`) +
    G(C(0, 0, 7.6, PAPER, 1.6) + cmdKey(0, 0, 0.92, INK, 1.4), at(19, 84)));
}

function toppings(k: Kit, who: Who, dx = 0): string {
  if (who === "jonah")
    return pepperoni(k, 52 + dx * 0.2, 104, 9.5) + pepperoni(k, 151 + dx * 0.2, 101, 8.5) + pepperoni(k, 88 + dx * 0.5, 186, 6.5) + pepperoni(k, 117 + dx * 0.4, 171, 6);
  return basilLeaf(50 + dx * 0.2, 108, -38, 0.95) + olive(151 + dx * 0.2, 104, 7) + olive(89 + dx * 0.5, 186, 5.6) + basilLeaf(117 + dx * 0.4, 172, 28, 0.62);
}

/** the slice body with face, toppings and headgear, in standing front coordinates */
function torso(k: Kit, who: Who, f: Face): string {
  const clip = k.clip("slice", `<path d="${SLICE}"/>`);
  const dx = f.dx ?? 0;
  const inside =
    // sauce rim with cheese melting over it
    P("M20 66L180 66L180 84C172 88 166 93 159 88C151 83 147 96 138 92C129 87 122 91 114 89C104 87 100 98 92 92C84 87 77 91 70 88C62 85 58 96 50 92C44 89 38 86 20 88Z", TOMATO, 2.2) +
    // form shading on the right flank
    P("M150 70Q140 150 94 224L200 224L200 70Z", k.ht(2), 0) +
    L("M155 92Q146 140 116 190", 1.6, INK, `opacity=".5"`) +
    // cheese bubbles
    E(66, 162 - 6, 3.4, 2.4, "none", 1.4) + E(130, 196 - 40, 2.6, 2, "none", 1.4) + E(102, 200, 3, 2.2, "none", 1.4) + C(76, 172, 1.4, INK) + C(126, 130 + 52, 1.2, INK) +
    toppings(k, who, dx);
  return part("body", null,
    // cheese drips past the outline
    P(SLICE, CHEESE, 0) +
    G(inside, `clip-path="${clip}"`) +
    P(SLICE, "none", 4.6) +
    P("M64 96Q62 104 64 108Q66 104 64 96Z", CHEESE, 0) +
    // crust "hat brim"
    P(CRUST_D, CRUST, 4.4) +
    P("M30 76C60 70 140 70 170 76C170 81 165 84 158 83C128 76 72 76 42 83C35 85 30 81 30 76Z", k.ht(2), 0) +
    L("M44 58C52 52 62 51 70 52M128 50C138 50 150 52 158 58", 2.2, PAPER, `opacity=".75"`) +
    L("M86 58l6 -2M104 55l7 1M146 64l5 3M58 66l-6 3M116 64l4 -1", 2.2, INK, `opacity=".55"`) +
    hat(k, who) +
    blush(k, f) +
    brows(who, f) +
    eyePair(who, f) +
    mouth(f) +
    (f.sweat ? P(`M${150 + dx * 0.4} 96C${146 + dx * 0.4} 104 ${148 + dx * 0.4} 110 ${153 + dx * 0.4} 110C${158 + dx * 0.4} 110 ${159 + dx * 0.4} 104 ${150 + dx * 0.4} 96Z`, PAPER, 2.2) : ""));
}

/* ---------------------------------------------------------------- limbs */

function arm(name: "arm-l" | "arm-r", d: string, shoulder: [number, number], handMk: string): string {
  return part(name, shoulder, tube(d, ARM_W) + handMk);
}

function leg(k: Kit, name: "leg-l" | "leg-r", d: string, sock: string, hip: [number, number], shoe: string): string {
  return part(name, hip,
    tube(d, LEG_W) +
    `<path d="${sock}" fill="none" stroke="${k.ht(3)}" stroke-width="${LEG_W}" stroke-linecap="butt"/>` +
    shoe);
}

function shadow(k: Kit, cx = 100, rx = 52): string {
  return part("shadow", null, E(cx, 287, rx, 5.5, k.ht(2)));
}

/* ---------------------------------------------------------------- poses */

const FACES: Record<Pose, Record<Who, Face>> = {
  stand: {
    jonah: { eyes: "open", brows: "flat", mouth: "smile", look: [0, 1] },
    peter: { eyes: "lid", brows: "up", mouth: "smirk", look: [1, 2] },
  },
  wave: {
    jonah: { eyes: "happy", brows: "up", mouth: "grin" },
    peter: { eyes: "wink", brows: "up", mouth: "grin", look: [1, 1] },
  },
  push: {
    jonah: { dx: 10, eyes: "squint", brows: "angry", mouth: "grit" },
    peter: { dx: 10, eyes: "squint", brows: "angry", mouth: "grit" },
  },
  point: {
    jonah: { dx: 3, eyes: "wide", brows: "up", mouth: "o", look: [4, 0] },
    peter: { dx: 3, eyes: "open", brows: "quirk", mouth: "smirk", look: [4, 1] },
  },
  sit: {
    jonah: { eyes: "open", brows: "up", mouth: "cat", look: [-1, 3] },
    peter: { eyes: "happy", brows: "flat", mouth: "smile" },
  },
  carry: {
    jonah: { eyes: "open", brows: "up", mouth: "grin", look: [0, -3] },
    peter: { eyes: "lid", brows: "up", mouth: "grin", look: [2, 0] },
  },
};

function drawPose(k: Kit, who: Who, pose: Pose): string {
  const f = FACES[pose][who];
  const accent = who === "jonah" ? TOMATO : BASIL;
  switch (pose) {
    case "stand": {
      return (
        shadow(k) +
        leg(k, "leg-l", "M94 204C92 230 84 250 81 268", "M82.6 258L81.2 268", [93, 206], sneaker(k, 81, 270, true, 0, 1, accent)) +
        leg(k, "leg-r", "M106 204C108 230 116 250 119 268", "M117.4 258L118.8 268", [107, 206], sneaker(k, 119, 270, false, 0, 1, accent)) +
        arm("arm-l", "M60 126C46 138 40 154 42 172", [58, 126], hand("fist", 43, 177, 10)) +
        arm("arm-r", "M140 126C158 130 170 146 160 160C156 166 146 168 136 166", [142, 126], hand("fist", 133, 164, -100)) +
        torso(k, who, f)
      );
    }
    case "wave": {
      return (
        shadow(k) +
        leg(k, "leg-l", "M94 204C90 228 84 250 82 268", "M83.4 258L82.2 268", [93, 206], sneaker(k, 82, 270, true, -4, 1, accent)) +
        leg(k, "leg-r", "M106 204C110 228 116 248 120 266", "M118.4 256L120 266", [107, 206], sneaker(k, 120, 268, false, -8, 1, accent)) +
        arm("arm-l", "M60 128C48 140 44 156 46 172", [58, 128], hand("fist", 47, 177, 14)) +
        torso(k, who, f) +
        arm("arm-r", "M145 127C164 122 176 106 177 84", [145, 127], hand("open", 177, 74, 10)) +
        L("M190 50C195 57 195 66 191 73M163 50C159 57 159 65 162 71", 2.4)
      );
    }
    case "push": {
      // side lunge, leaning into a wall at x≈196
      const lean = `transform="translate(-28 6) rotate(16 100 200)"`;
      return (
        shadow(k, 92, 70) +
        L("M8 200H24M2 214H20M12 228H26", 2.4) +
        part("dust", null, P("M10 276C4 276 2 270 7 267C7 262 14 260 17 264C21 260 28 263 26 269C30 271 28 277 23 277Z", PAPER, 2.2) + C(34, 272, 2.4, PAPER, 1.8)) +
        arm("arm-l", "M126 112C148 104 168 100 186 98", [126, 112], hand("flat", 190, 100, 0)) +
        leg(k, "leg-l", "M66 206C52 226 38 246 26 262", "M32 254L25.4 263", [66, 206], sneaker(k, 26, 266, false, 34, 1, accent)) +
        leg(k, "leg-r", "M80 206C98 220 106 240 98 268", "M101.4 258L98.4 268", [80, 206], sneaker(k, 98, 270, false, 0, 1, accent)) +
        arm("arm-r", "M134 142C152 152 170 142 184 130", [134, 142], hand("flat", 190, 130, -6)) +
        G(torso(k, who, f), lean) +
        P("M30 104C24 112 26 120 32 120C38 120 39 112 30 104Z", PAPER, 2.2) + P("M44 92C40 97 41 102 45 102C49 102 49 97 44 92Z", PAPER, 2) +
        L("M186 88l4 -6M180 84l2 -6", 2)
      );
    }
    case "point": {
      return (
        shadow(k) +
        leg(k, "leg-l", "M94 204C92 230 88 250 86 268", "M87.2 258L86.2 268", [93, 206], sneaker(k, 86, 270, true, 0, 1, accent)) +
        leg(k, "leg-r", "M106 204C112 226 122 246 128 264", "M125.6 254L128 264", [107, 206], sneaker(k, 128, 266, false, -6, 1, accent)) +
        arm("arm-l", "M60 126C42 130 32 146 40 160C44 166 54 168 64 166", [58, 126], hand("fist", 63, 162, 100, true)) +
        arm("arm-r", "M140 124C152 122 160 119 166 117", [140, 124], hand("point", 170, 116, -4)) +
        L("M184 98l5 -5M190 108l6 -2M180 132l5 4", 2.2) +
        torso(k, who, f)
      );
    }
    case "sit": {
      // perched on a stack of pizza boxes, one foot swinging
      return (
        shadow(k, 100, 70) +
        part("seat", null,
          pizzaBox(k, 40, 264, 122, 22, 12, 4, false, 3) +
          pizzaBox(k, 46, 240, 112, 22, 12, -3, false, 3) +
          pizzaBox(k, 36, 216, 126, 22, 12, 3, true, 3)) +
        leg(k, "leg-l", "M94 202C88 210 82 216 80 226C78 240 79 254 80 266", "M80 256V266", [93, 204], sneaker(k, 80, 268, true, 0, 1, accent)) +
        leg(k, "leg-r", "M106 202C112 210 118 216 120 226C122 238 126 248 132 258", "M128 250L132.4 259", [107, 204], sneaker(k, 133, 260, false, -18, 1, accent)) +
        arm("arm-l", "M60 128C44 146 38 176 42 200", [58, 128], hand("fist", 43, 204, -6)) +
        arm("arm-r", "M140 128C156 146 162 176 158 200", [142, 128], hand("fist", 157, 204, 6, true)) +
        torso(k, who, f) +
        L("M170 18q4 -6 8 0t8 0M178 32q3 -4 6 0", 2) // a little hum
      );
    }
    case "carry": {
      return (
        shadow(k) +
        leg(k, "leg-l", "M94 204C88 226 78 246 70 262", "M72.6 253L69.4 263", [93, 206], sneaker(k, 70, 265, true, 12, 1, accent)) +
        leg(k, "leg-r", "M106 204C110 228 116 250 118 268", "M117 258L118 268", [107, 206], sneaker(k, 118, 270, false, 0, 1, accent)) +
        torso(k, who, f) +
        part("box", null,
          pizzaBox(k, 40, 186, 120, 26, 26, 8, true, 3.2) +
          L("M28 170c-5 -6 3 -10 -2 -16M176 166c-5 -6 3 -10 -2 -16", 2, GRAY)) +
        arm("arm-l", "M60 128C42 144 34 172 37 204", [58, 128], hand("flat", 37, 197, 0)) +
        arm("arm-r", "M140 128C158 144 166 172 163 204", [142, 128], hand("flat", 163, 197, 0, true))
      );
    }
  }
}

export function mascotBody(k: Kit, who: Who, pose: Pose): string {
  return G(drawPose(k, who, pose), `data-who="${who}" data-pose="${pose}"`);
}

export function mascot(who: Who, pose: Pose = "stand", opts: ArtOpts = {}): string {
  const k = new Kit();
  return k.wrap("0 0 200 300", mascotBody(k, who, pose), opts);
}
