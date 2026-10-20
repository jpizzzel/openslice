// Art library contract. Every function returns an inline SVG string.
// Page modules import from here; the art module owns the drawings.
// Style: black ink line art (#141210), gray halftone shading, tomato (#ff3b2f)
// and cheese (#ffc93c) spot color. Every SVG has a viewBox and no fixed size,
// so callers size it with CSS. Interactive parts carry data-part="..." hooks.
import type { Tool } from "../data/site";

export type Who = "jonah" | "peter";
export type Pose = "stand" | "wave" | "push" | "point" | "sit" | "carry";
export type GlyphId =
  | Tool["glyph"]
  | "box" | "box-open" | "slice" | "pizza" | "peel" | "oven" | "laptop" | "keyboard"
  | "wrench" | "basil" | "pepperoni" | "mushroom" | "olive" | "cheese-drip"
  | "star" | "sparkle" | "squiggle" | "arrow" | "github" | "terminal" | "cursor"
  | "dough" | "rolling-pin" | "chef-hat" | "sneaker" | "headphones" | "coffee";

export interface ArtOpts {
  /** accessible label; when omitted the svg is aria-hidden */
  label?: string;
  className?: string;
}

/** The two mascots: Jonah and Peter drawn as pizza slice characters. */
export function mascot(who: Who, pose: Pose = "stand", opts: ArtOpts = {}): string {
  const fill = who === "jonah" ? "#ffc93c" : "#ffb02e";
  return svg("0 0 200 300", `
    <path d="M100 20 L170 230 Q100 250 30 230 Z" fill="${fill}" stroke="#141210" stroke-width="5" stroke-linejoin="round"/>
    <circle cx="80" cy="140" r="6" fill="#141210"/><circle cx="120" cy="140" r="6" fill="#141210"/>
    <path d="M80 170 Q100 185 120 170" stroke="#141210" stroke-width="5" fill="none" stroke-linecap="round"/>
    <text x="100" y="290" text-anchor="middle" font-size="22" font-family="sans-serif">${who}:${pose}</text>`, opts);
}

/** Small object/topping/icon drawings. */
export function glyph(id: GlyphId, opts: ArtOpts = {}): string {
  return svg("0 0 100 100", `
    <rect x="10" y="10" width="80" height="80" rx="12" fill="#f7f4ef" stroke="#141210" stroke-width="4"/>
    <text x="50" y="56" text-anchor="middle" font-size="12" font-family="sans-serif">${id}</text>`, opts);
}

/** A poster-style artwork for a tool, used on cards. Aspect 4:5 (viewBox 0 0 400 500). */
export function poster(tool: Tool, opts: ArtOpts = {}): string {
  return svg("0 0 400 500", `
    <rect width="400" height="500" fill="${tool.color}"/>
    <text x="24" y="470" font-size="64" font-family="sans-serif" fill="#141210">${tool.name}</text>`, opts);
}

/** Wide illustration scenes. */
export type SceneId = "duo-push" | "duo-wave" | "kitchen" | "tree";
export function scene(id: SceneId, opts: ArtOpts = {}): string {
  return svg("0 0 800 500", `<rect width="800" height="500" fill="#e4ded4"/><text x="400" y="250" text-anchor="middle" font-size="40">${id}</text>`, opts);
}

export function svg(viewBox: string, body: string, opts: ArtOpts = {}): string {
  const a11y = opts.label ? `role="img" aria-label="${opts.label}"` : `aria-hidden="true" focusable="false"`;
  const cls = opts.className ? ` class="${opts.className}"` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"${cls} ${a11y}>${body}</svg>`;
}
