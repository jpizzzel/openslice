// THE BOX: OpenSlice's own pizza box, drawn here as six flat SVG faces and
// folded into a real CSS 3D box. The lid is its own hinged group so it can flip
// open, peek and shut. Ink line art, halftone shading, tomato and cheese spot.
import { SITE } from "../../data/site";
import { dots, sliceMark, lidArt } from "../../chrome/lid";

const INK = "#141210";
const TOMATO = "#f2362a";
const CHEESE = "#ffc93c";
const CRUST = "#e9b46a";
const BASIL = "#2f7d4f";
const PAPER = "#fbf8f2";
const KRAFT = "#eadcc4";
const GRAY = "#8a837a";
const MONO = `'JetBrains Mono Variable','JetBrains Mono',ui-monospace,monospace`;
const DISPLAY = `'Big Shoulders Display Variable','Big Shoulders Display',Impact,sans-serif`;
const SERIF = `'Instrument Serif',Georgia,serif`;

const f = (n: number) => Math.round(n * 10) / 10;

const svg = (vb: string, defs: string, body: string) =>
  `<svg viewBox="${vb}" preserveAspectRatio="none" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs>${body}</svg>`;

/** the lid, outside: the screen printed logo face (shared with the preloader) */
const lidTop = () => lidArt({ idp: "bxl" });

/** the lid, inside: what you see once it flips open */
function lidUnder() {
  const defs = dots("bxu-ht", INK, 0.75, 4.4) + dots("bxu-g", "#c99a3c", 1.6, 5.2, 20);
  const body =
    `<rect x="2" y="2" width="396" height="396" rx="7" fill="${KRAFT}" stroke="${INK}" stroke-width="4"/>` +
    `<rect x="2" y="2" width="396" height="396" rx="7" fill="url(#bxu-ht)" opacity=".28"/>` +
    `<path d="M2 2H398V70Q200 40 2 70Z" fill="url(#bxu-ht)" opacity=".5"/>` +
    `<rect x="14" y="14" width="372" height="372" rx="3" fill="none" stroke="${INK}" stroke-width="1.4" opacity=".5"/>` +
    `<ellipse cx="96" cy="300" rx="44" ry="30" fill="url(#bxu-g)" opacity=".75"/>` +
    `<ellipse cx="300" cy="96" rx="26" ry="20" fill="url(#bxu-g)" opacity=".6"/>` +
    `<text x="200" y="182" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="86" fill="${TOMATO}">Thank you!</text>` +
    `<text x="200" y="226" text-anchor="middle" font-family="${MONO}" font-size="13" font-weight="700" letter-spacing="3.4" fill="${INK}">COME BACK SATURDAY</text>` +
    `<path d="M120 246H280" stroke="${INK}" stroke-width="1.4" stroke-dasharray="4 5"/>` +
    `<g transform="translate(200 300) rotate(8) scale(.8)">${sliceMark()}</g>`;
  return svg("0 0 400 400", defs, body);
}

/** the tray floor, with the pizza we are giving away (one slice already gone) */
function floor() {
  const cx = 200, cy = 206, R = 162;
  const defs =
    dots("bxf-ht", INK, 1, 4.6) +
    dots("bxf-cheese", "#e0a21e", 1.3, 6, 15) +
    dots("bxf-grease", "#c99a3c", 1.5, 5, 20);
  const pt = (a: number, r: number) => `${f(cx + Math.cos((a * Math.PI) / 180) * r)} ${f(cy + Math.sin((a * Math.PI) / 180) * r)}`;
  // the missing slice: front right, so you can see it from the street
  const g0 = 22.5, g1 = 67.5;
  const arc = (r: number) => `M${pt(g1, r)}A${r} ${r} 0 1 1 ${pt(g0, r)}`;
  const pizza =
    `<path d="M${cx} ${cy}L${pt(g1, R)}A${R} ${R} 0 1 1 ${pt(g0, R)}Z" fill="${CRUST}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>` +
    `<path d="M${cx} ${cy}L${pt(g1, R - 20)}A${R - 20} ${R - 20} 0 1 1 ${pt(g0, R - 20)}Z" fill="${TOMATO}" stroke="${INK}" stroke-width="2"/>` +
    `<path d="M${cx} ${cy}L${pt(g1 + 3, R - 27)}A${R - 27} ${R - 27} 0 1 1 ${pt(g0 - 3, R - 27)}Z" fill="${CHEESE}"/>` +
    `<path d="M${cx} ${cy}L${pt(g1 + 3, R - 27)}A${R - 27} ${R - 27} 0 1 1 ${pt(g0 - 3, R - 27)}Z" fill="url(#bxf-cheese)" opacity=".8"/>` +
    // crust bubbles
    `<path d="${arc(R - 9)}" fill="none" stroke="${INK}" stroke-width="1.4" stroke-dasharray="10 16" opacity=".55"/>` +
    // cuts
    [112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((a) => `<path d="M${cx} ${cy}L${pt(a, R - 6)}" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`).join("") +
    // pepperoni
    [[150, 70], [100, 128], [205, 108], [250, 70], [292, 130], [330, 70], [180, 40], [130, 95], [240, 120], [350, 110], [300, 90], [270, 40]]
      .map(([a, r], i) => {
        const [x, y] = pt(a, r).split(" ").map(Number);
        const rr = 15 + (i % 3) * 2;
        return `<circle cx="${x}" cy="${y}" r="${rr}" fill="${TOMATO}" stroke="${INK}" stroke-width="2.4"/>` +
          `<circle cx="${x + 3}" cy="${y + 3}" r="${rr - 5}" fill="url(#bxf-ht)" opacity=".45"/>` +
          `<path d="M${x - rr * 0.55} ${y - rr * 0.2}Q${x - rr * 0.4} ${y - rr * 0.6} ${x} ${y - rr * 0.62}" fill="none" stroke="${PAPER}" stroke-width="2" stroke-linecap="round"/>`;
      }).join("") +
    // basil
    [[200, 55, 30], [118, 118, -40], [312, 104, 70]].map(([a, r, rot]) => {
      const [x, y] = pt(a, r).split(" ").map(Number);
      return `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M0 -13C9 -8 9 6 0 13C-9 6 -9 -8 0 -13Z" fill="${BASIL}" stroke="${INK}" stroke-width="2"/><path d="M0 -9V10" stroke="${PAPER}" stroke-width="1.2" opacity=".7"/></g>`;
    }).join("");
  const body =
    `<rect x="0" y="0" width="400" height="400" fill="${KRAFT}"/>` +
    `<rect x="0" y="0" width="400" height="400" fill="url(#bxf-ht)" opacity=".18"/>` +
    // inner shadow along the back and left walls
    `<path d="M0 0H400V34Q200 20 34 34V400H0Z" fill="url(#bxf-ht)" opacity=".7"/>` +
    // grease ring where the missing slice was
    `<path d="M${cx} ${cy}L${pt(g0 + 4, R - 10)}A${R - 10} ${R - 10} 0 0 1 ${pt(g1 - 4, R - 10)}Z" fill="url(#bxf-grease)" opacity=".85"/>` +
    `<circle cx="${f(cx + 70)}" cy="${f(cy + 92)}" r="2.4" fill="${CRUST}" stroke="${INK}" stroke-width="1"/>` +
    `<circle cx="${f(cx + 96)}" cy="${f(cy + 60)}" r="1.8" fill="${CRUST}" stroke="${INK}" stroke-width="1"/>` +
    pizza +
    `<rect x="2" y="2" width="396" height="396" fill="none" stroke="${INK}" stroke-width="4"/>`;
  return svg("0 0 400 400", defs, body);
}

/** the front wall: printed band */
function front() {
  const defs = dots("bxw-ht", INK, 0.9, 4.2);
  const body =
    `<rect x="2" y="2" width="396" height="60" fill="${PAPER}" stroke="${INK}" stroke-width="4"/>` +
    `<rect x="2" y="40" width="396" height="22" fill="url(#bxw-ht)" opacity=".45"/>` +
    `<rect x="12" y="12" width="376" height="40" fill="none" stroke="${TOMATO}" stroke-width="2"/>` +
    `<text x="200" y="45" text-anchor="middle" font-family="${DISPLAY}" font-weight="800" font-size="36" textLength="150" lengthAdjust="spacingAndGlyphs" fill="${TOMATO}">OPENSLICE</text>` +
    `<text x="24" y="37" font-family="${MONO}" font-size="11" font-weight="700" letter-spacing="1.6" fill="${INK}">HOT ✶ FRESH</text>` +
    `<text x="376" y="37" text-anchor="end" font-family="${MONO}" font-size="11" font-weight="700" letter-spacing="1.6" fill="${INK}">NO. ${SITE.since}</text>`;
  return svg("0 0 400 64", defs, body);
}

/** back wall: plain board */
function back() {
  const defs = dots("bxb-ht", INK, 1, 4.2);
  return svg("0 0 400 64", defs,
    `<rect x="2" y="2" width="396" height="60" fill="${KRAFT}" stroke="${INK}" stroke-width="4"/>` +
    `<rect x="2" y="2" width="396" height="60" fill="url(#bxb-ht)" opacity=".55"/>`);
}

/** side walls: shaded board, darker on the right */
function side(id: string, tone: number) {
  const defs = dots(id, INK, tone, 4.2);
  return svg("0 0 64 400", defs,
    `<rect x="2" y="2" width="60" height="396" fill="${PAPER}" stroke="${INK}" stroke-width="4"/>` +
    `<rect x="2" y="2" width="60" height="396" fill="url(#${id})"/>` +
    `<path d="M20 30V370" stroke="${INK}" stroke-width="1.4" opacity=".4"/>`);
}

/** steam wisps, drawn as ink curls */
export function steamHTML() {
  const curls = [
    "M20 120C4 100 36 86 20 64C6 46 34 32 22 8",
    "M50 120C66 98 34 84 50 60C64 40 36 26 50 4",
    "M80 120C64 100 96 86 80 64C66 46 94 32 82 10",
  ];
  return `<div class="bx-steam" aria-hidden="true">${curls
    .map((d) => `<svg class="bx-curl" viewBox="0 0 100 124" fill="none" stroke="${GRAY}" stroke-width="3.2" stroke-linecap="round"><path d="${d}"/></svg>`)
    .join("")}</div>`;
}

export function boxHTML() {
  return `
    <div class="bx-shadow"></div>
    <div class="bx-tilt">
      <div class="bx-3d">
        <div class="bx-f bx-floor">${floor()}</div>
        <div class="bx-f bx-wall bx-wall--back">${back()}</div>
        <div class="bx-f bx-wall bx-wall--l">${side("bxs-l", 0.75)}</div>
        <div class="bx-f bx-wall bx-wall--r">${side("bxs-r", 1.25)}</div>
        <div class="bx-f bx-wall bx-wall--front">${front()}</div>
        <div class="bx-lidz">
          <div class="bx-lid">
            <div class="bx-lid__a">
              <div class="bx-lid__b">
                <div class="bx-f bx-lid__top">${lidTop()}</div>
                <div class="bx-f bx-lid__under">${lidUnder()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
}
