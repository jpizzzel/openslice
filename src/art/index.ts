// Art library contract. Every function returns an inline SVG string.
// Page modules import from here; the art module owns the drawings.
// Style: black ink line art (#141210), gray halftone shading, tomato (#ff3b2f)
// and cheese (#ffc93c) spot color. Every SVG has a viewBox and no fixed size,
// so callers size it with CSS. Interactive parts carry data-part="..." hooks.
//
// Implementation lives in: core.ts (kit, ids, halftone), props.ts (shared
// objects), mascots.ts, glyphs.ts, posters.ts, scenes.ts.
import type { Tool } from "../data/site";
import { Kit, ArtOpts } from "./core";
import { mascot as drawMascot, Who, Pose, MascotOpts } from "./mascots";
import { glyph as drawGlyph } from "./glyphs";
import { poster as drawPoster } from "./posters";
import { scene as drawScene, SceneId } from "./scenes";

export type { Who, Pose, ArtOpts, SceneId, MascotOpts };
export type GlyphId =
  | Tool["glyph"]
  | "box" | "box-open" | "slice" | "pizza" | "peel" | "oven" | "laptop" | "keyboard"
  | "wrench" | "basil" | "pepperoni" | "mushroom" | "olive" | "cheese-drip"
  | "star" | "sparkle" | "squiggle" | "arrow" | "github" | "terminal" | "cursor"
  | "dough" | "rolling-pin" | "chef-hat" | "sneaker" | "headphones" | "coffee"
  | "box-empty" | "ticket" | "receipt";

/**
 * The two mascots: Jonah and Peter drawn as pizza slice characters. viewBox 0 0 200 300.
 * opts.apron adds the Saturday apron (data-part="apron").
 */
export function mascot(who: Who, pose: Pose = "stand", opts: MascotOpts = {}): string {
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
