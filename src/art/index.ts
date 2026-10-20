// Art library contract. Every function returns an inline SVG string.
// Page modules import from here; the art module owns the drawings.
// Style: black ink line art (#141210), gray halftone shading, tomato (#ff3b2f)
// and cheese (#ffc93c) spot color. Every SVG has a viewBox and no fixed size,
// so callers size it with CSS. Interactive parts carry data-part="..." hooks.
//
// Implementation lives in: core.ts (kit, ids, halftone), props.ts (shared
// objects), mascots.ts, glyphs.ts, posters.ts, scenes.ts.
import type { Tool } from "../data/site";
import { svg as wrapSvg, Kit, ArtOpts } from "./core";
import { mascot as drawMascot, mascotBody, POSES, Who, Pose } from "./mascots";
import { glyph as drawGlyph, glyphBody, GLYPH_IDS } from "./glyphs";
import { poster as drawPoster } from "./posters";
import { scene as drawScene, SceneId } from "./scenes";

export type { Who, Pose, ArtOpts, SceneId };
export type GlyphId =
  | Tool["glyph"]
  | "box" | "box-open" | "slice" | "pizza" | "peel" | "oven" | "laptop" | "keyboard"
  | "wrench" | "basil" | "pepperoni" | "mushroom" | "olive" | "cheese-drip"
  | "star" | "sparkle" | "squiggle" | "arrow" | "github" | "terminal" | "cursor"
  | "dough" | "rolling-pin" | "chef-hat" | "sneaker" | "headphones" | "coffee";

/** The two mascots: Jonah and Peter drawn as pizza slice characters. viewBox 0 0 200 300. */
export function mascot(who: Who, pose: Pose = "stand", opts: ArtOpts = {}): string {
  return drawMascot(who, pose, opts);
}

/** Small object/topping/icon drawings. viewBox 0 0 100 100. */
export function glyph(id: GlyphId, opts: ArtOpts = {}): string {
  return drawGlyph(id, opts);
}

/** A poster-style artwork for a tool, used on cards. Aspect 4:5 (viewBox 0 0 400 500). */
export function poster(tool: Tool, opts: ArtOpts = {}): string {
  return drawPoster(tool, opts);
}

/** Wide illustration scenes. viewBox 0 0 800 500. */
export function scene(id: SceneId, opts: ArtOpts = {}): string {
  return drawScene(id, opts);
}

export function svg(viewBox: string, body: string, opts: ArtOpts = {}): string {
  return wrapSvg(viewBox, body, opts);
}

/* ---- additions ---- */

/** every pose, in display order */
export const MASCOT_POSES: readonly Pose[] = POSES;
/** every glyph id that has a drawing */
export const GLYPHS: readonly GlyphId[] = GLYPH_IDS;

/**
 * A halftone dot <pattern> for page-level SVG. Returns the defs markup and the
 * fill value. ids are unique per call.
 *   const h = halftone(2); `<svg><defs>${h.def}</defs><rect fill="${h.fill}" .../></svg>`
 */
export function halftone(tone: 1 | 2 | 3 | 4 = 2, color = "#141210", size = 4.2): { def: string; fill: string; id: string } {
  const r = [0, 0.62, 0.92, 1.25, 1.6][tone] * (size / 4.2);
  const k = new Kit();
  const id = k.uid("ht");
  return {
    id,
    fill: `url(#${id})`,
    def: `<pattern id="${id}" width="${size}" height="${size}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="${size / 2}" cy="${size / 2}" r="${r.toFixed(2)}" fill="${color}"/></pattern>`,
  };
}

/** A CSS background-image (data URI) of halftone dots, for non-SVG elements. */
export function halftoneCss(color = "#141210", size = 6, r = 1.1): string {
  const s = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><circle cx='${size / 2}' cy='${size / 2}' r='${r}' fill='${color}'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
}

/**
 * Several mascots / glyphs inside one composed svg (shared defs).
 * items: [{ who, pose, x, y, s }] in a viewBox of your choosing.
 */
export function group(viewBox: string, items: ({ who: Who; pose: Pose; x: number; y: number; s?: number } | { glyph: GlyphId; x: number; y: number; s?: number; r?: number })[], opts: ArtOpts = {}): string {
  const k = new Kit();
  const body = items.map((it) => {
    const s = it.s ?? 1;
    if ("who" in it)
      return `<g transform="translate(${it.x} ${it.y}) scale(${s})" data-part="mascot-${it.who}">${mascotBody(k, it.who, it.pose)}</g>`;
    return `<g transform="translate(${it.x} ${it.y}) rotate(${it.r ?? 0}) scale(${s})">${glyphBody(k, it.glyph)}</g>`;
  }).join("");
  return k.wrap(viewBox, body, opts);
}
