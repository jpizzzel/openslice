// Inline SVG art that carries <text> is laid out again, repainted and re-rastered
// by the browser on every frame in which any ancestor's transform changes (glyph
// size tracks the on-screen scale). For halftone-heavy posters that ride on
// scroll or pointer driven transforms that is the most expensive thing on the page.
// flattenSvg() swaps such an svg for an <img> of the very same markup: an image is
// laid out and rastered once, then only moved by the compositor. The poster fonts
// are embedded as data URLs (an svg image cannot see the page's @font-face rules),
// and the swap waits for the image to decode, so nothing flashes or reflows.
import monoUrl from "@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2?url";
import displayUrl from "@fontsource-variable/big-shoulders-display/files/big-shoulders-display-latin-wght-normal.woff2?url";
import serifUrl from "@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2?url";
import serifItalicUrl from "@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2?url";

// Same family names and descriptors as src/styles/fonts.css.
// `use` is tested against each <text> start tag.
const italic = (t: string) => /font-style="italic"/.test(t);
const FACES = [
  { use: (t: string) => /JetBrains Mono/.test(t), url: monoUrl, face: `font-family:"JetBrains Mono Variable";font-style:normal;font-weight:100 800` },
  { use: (t: string) => /Big Shoulders/.test(t), url: displayUrl, face: `font-family:"Big Shoulders Display Variable";font-style:normal;font-weight:100 900` },
  { use: (t: string) => /Instrument Serif/.test(t) && !italic(t), url: serifUrl, face: `font-family:"Instrument Serif";font-style:normal;font-weight:400` },
  { use: (t: string) => /Instrument Serif/.test(t) && italic(t), url: serifItalicUrl, face: `font-family:"Instrument Serif";font-style:italic;font-weight:400` },
];

// Inherited text and paint properties an inline svg picks up from the page and an svg image
// would not; they are pinned on the image's root as computed.
const INHERITED = [
  "color", "font-weight", "font-style", "font-stretch", "letter-spacing", "word-spacing", "text-transform",
  "font-kerning", "font-variant-ligatures", "font-variant-numeric", "font-variant-caps", "font-feature-settings",
  "font-variation-settings", "font-optical-sizing", "font-synthesis", "text-rendering",
  "fill", "fill-opacity", "fill-rule", "stroke", "stroke-width", "stroke-opacity", "stroke-linecap", "stroke-linejoin",
  "stroke-dasharray", "stroke-miterlimit", "paint-order", "shape-rendering", "clip-rule",
];

const fontData = new Map<string, Promise<string>>();
const asDataUrl = (url: string) => {
  let p = fontData.get(url);
  if (!p) {
    p = fetch(url)
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
      .then((b) => new Promise<string>((res, rej) => {
        const fr = new FileReader();
        fr.onload = () => res(String(fr.result));
        fr.onerror = () => rej(fr.error);
        fr.readAsDataURL(b);
      }));
    p.catch(() => fontData.delete(url)); // let a later page try again
    fontData.set(url, p);
  }
  return p;
};

/**
 * Replace each svg that has text with an equivalent <img> once it has decoded. `size`
 * is the css that sizes the svg in its host. Returns a cleanup that cancels pending
 * swaps and releases the image urls. If anything fails the inline svg simply stays.
 */
export function flattenSvgs(svgs: Iterable<SVGSVGElement>, size = "width:100%;height:100%"): () => void {
  let dead = false;
  const urls: string[] = [];
  for (const svg of svgs) {
    // only text is re-laid out per frame; text-free art already rasters once as a layer
    if (!svg.querySelector("text")) continue;
    const cs = getComputedStyle(svg);
    const display = cs.display;
    if (display === "none") continue;
    const xml = new XMLSerializer().serializeToString(svg);
    const texts = xml.match(/<text\b[^>]*>/g) ?? [];
    const faces = FACES.filter((f) => texts.some(f.use));
    const pin = INHERITED.map((p) => `${p}:${cs.getPropertyValue(p)}`).join(";").replace(/"/g, "'");
    Promise.all(faces.map((f) => asDataUrl(f.url).then((d) => `@font-face{${f.face};src:url(${d}) format("woff2")}`)))
      .then(async (css) => {
        if (dead || !svg.isConnected) return;
        // root rule, not a style attribute: the svg may already carry one
        const src = xml.replace(/^<svg\b[^>]*>/, (m) => `${m}<style>${css.join("")}:root{${pin}}</style>`);
        const url = URL.createObjectURL(new Blob([src], { type: "image/svg+xml" }));
        urls.push(url);
        const img = new Image();
        const label = svg.getAttribute("aria-label");
        img.alt = label ?? "";
        if (!label) img.setAttribute("aria-hidden", "true");
        const cls = svg.getAttribute("class");
        if (cls) img.setAttribute("class", cls);
        img.draggable = false;
        img.decoding = "sync";
        // the host's css sizes its svg; `size` repeats that for the image
        img.style.cssText = `display:${display};${size};pointer-events:none`;
        img.src = url;
        await img.decode();
        if (dead || !svg.isConnected) return;
        svg.replaceWith(img);
      })
      .catch(() => {});
  }
  return () => {
    dead = true;
    urls.forEach((u) => URL.revokeObjectURL(u));
    urls.length = 0;
  };
}
