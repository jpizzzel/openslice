// The OpenSlice pizza box lid, outside face: the screen printed logo side. One
// drawing shared by the home hero's 3D box and the preloader, so the box you
// wait on is the box that opens. Ink line art, halftone, tomato and cheese spot.
import { SITE } from "../data/site";

const INK = "#141210";
const TOMATO = "#f2362a";
const CHEESE = "#ffc93c";
const CRUST = "#e9b46a";
const PAPER = "#fbf8f2";
const MONO = `'JetBrains Mono Variable','JetBrains Mono',ui-monospace,monospace`;
const DISPLAY = `'Big Shoulders Display Variable','Big Shoulders Display',Impact,sans-serif`;
const SERIF = `'Instrument Serif',Georgia,serif`;

/** dot pattern defs, unique per face */
export const dots = (id: string, color: string, r: number, size = 5, rot = 45) =>
  `<pattern id="${id}" width="${size}" height="${size}" patternUnits="userSpaceOnUse" patternTransform="rotate(${rot})"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="${color}"/></pattern>`;

/** a little pizza slice, point down, drawn around (0,0) in a 60 unit box */
export const sliceMark = (stroke = INK) =>
  `<path d="M-22 -16Q0 -24 22 -16L3 24Q0 29 -3 24Z" fill="${CHEESE}" stroke="${stroke}" stroke-width="2.6" stroke-linejoin="round"/>` +
  `<path d="M-24 -17Q0 -27 24 -17Q25 -24 19 -26Q0 -32 -19 -26Q-25 -24 -24 -17Z" fill="${CRUST}" stroke="${stroke}" stroke-width="2.6" stroke-linejoin="round"/>` +
  `<circle cx="-7" cy="-6" r="4.6" fill="${TOMATO}" stroke="${stroke}" stroke-width="1.8"/>` +
  `<circle cx="7" cy="2" r="4" fill="${TOMATO}" stroke="${stroke}" stroke-width="1.8"/>` +
  `<circle cx="-1" cy="12" r="2.8" fill="${TOMATO}" stroke="${stroke}" stroke-width="1.6"/>`;

const heart = (x: number, y: number, s: number, fill: string) =>
  `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -3C-1.6 -7 -7 -6 -7 -2C-7 1.6 -2.6 4.4 0 7C2.6 4.4 7 1.6 7 -2C7 -6 1.6 -7 0 -3Z" fill="${fill}"/>`;

export interface LidOpts {
  /** id prefix for the patterns: two lids can be on the page at once */
  idp: string;
  /** print the wordmark into the art. The preloader sets it as real text instead. */
  word?: boolean;
  /** how the square art fits its box */
  fit?: "none" | "xMidYMid meet";
}

/** The lid's outside face, a 400 x 400 drawing. The wordmark baseline sits at y 280. */
export function lidArt({ idp, word = true, fit = "none" }: LidOpts) {
  const id = (k: string) => `${idp}-${k}`;
  const ring = "M200 84a50 50 0 1 1 -0.1 0";
  const defs =
    dots(id("ht"), INK, 1.05, 5) +
    dots(id("ht2"), INK, 0.7, 4) +
    dots(id("grease"), "#d8a640", 1.5, 5, 30) +
    `<path id="${id("ring")}" d="${ring}"/>`;
  const body =
    // board, crease and shading
    `<rect x="2" y="2" width="396" height="396" rx="7" fill="${PAPER}" stroke="${INK}" stroke-width="4"/>` +
    `<path d="M2 300L100 398H392Q398 398 398 392V90Z" fill="url(#${id("ht2")})" opacity=".55"/>` +
    `<rect x="14" y="14" width="372" height="372" rx="3" fill="none" stroke="${INK}" stroke-width="1.4" opacity=".55"/>` +
    // print frame
    `<rect x="28" y="28" width="344" height="344" fill="none" stroke="${TOMATO}" stroke-width="3.2"/>` +
    `<rect x="35" y="35" width="330" height="330" fill="none" stroke="${TOMATO}" stroke-width="1.2"/>` +
    // top small print
    `<text x="200" y="60" text-anchor="middle" font-family="${MONO}" font-size="12" font-weight="600" letter-spacing="3" fill="${INK}">FREE TOOLS, SERVED HOT</text>` +
    `<path d="M62 56h28M310 56h28" stroke="${INK}" stroke-width="1.6"/>` +
    // the slice stamp, with its ring of small print
    `<g transform="rotate(-10 200 134)">` +
    `<circle cx="200" cy="134" r="58" fill="${PAPER}" stroke="${TOMATO}" stroke-width="3"/>` +
    `<circle cx="200" cy="134" r="40" fill="${TOMATO}" stroke="${INK}" stroke-width="2"/>` +
    `<circle cx="200" cy="134" r="40" fill="url(#${id("ht")})" opacity=".35"/>` +
    `<text font-family="${MONO}" font-size="8.6" font-weight="700" letter-spacing="0.9" fill="${TOMATO}"><textPath href="#${id("ring")}">OPEN SOURCE ✶ KEEP FLAT ✶ OPEN SOURCE ✶ KEEP FLAT ✶</textPath></text>` +
    `<g transform="translate(200 136) scale(.92)">${sliceMark()}</g>` +
    `</g>` +
    // the wordmark, printed twice a hair out of register
    (word
      ? `<text x="203" y="283" text-anchor="middle" font-family="${DISPLAY}" font-weight="800" font-size="104" textLength="318" lengthAdjust="spacingAndGlyphs" fill="${INK}">OPENSLICE</text>` +
        `<text x="200" y="280" text-anchor="middle" font-family="${DISPLAY}" font-weight="800" font-size="104" textLength="318" lengthAdjust="spacingAndGlyphs" fill="${TOMATO}">OPENSLICE</text>`
      : "") +
    `<path d="M50 300H350" stroke="${INK}" stroke-width="1.6"/>` +
    // bottom small print
    `<text x="52" y="324" font-family="${MONO}" font-size="12" font-weight="600" letter-spacing="2" fill="${INK}">EST. ${SITE.since}</text>` +
    `<text x="348" y="324" text-anchor="end" font-family="${MONO}" font-size="12" font-weight="600" letter-spacing="2" fill="${INK}">HANDLE WITH LOVE</text>` +
    heart(152, 320, 1, TOMATO) +
    `<text x="200" y="352" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="19" fill="${INK}">fresh from our house to yours</text>` +
    // a grease spot, because it was a real pizza
    `<ellipse cx="330" cy="92" rx="22" ry="17" fill="url(#${id("grease")})" opacity=".7"/>`;
  return `<svg viewBox="0 0 400 400" preserveAspectRatio="${fit}" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs>${body}</svg>`;
}
