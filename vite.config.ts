import { defineConfig, type Plugin } from "vite";

// Fonts that render above the fold on every route. Their hashed latin woff2 files are
// preloaded from the built index.html so text does not wait on the CSS to be parsed.
const PRELOAD_FONTS = [
  /bricolage-grotesque-latin-wght-normal-[\w-]+\.woff2$/,
  /big-shoulders-display-latin-wght-normal-[\w-]+\.woff2$/,
  // the italic serif carries the hero headlines on most pages
  /instrument-serif-latin-400-italic-[\w-]+\.woff2$/,
];

function fontPreload(): Plugin {
  let base = "/";
  return {
    name: "openslice:font-preload",
    apply: "build",
    configResolved(config) {
      base = config.base;
    },
    transformIndexHtml: {
      order: "post",
      handler(html, ctx) {
        const bundle = ctx.bundle;
        if (!bundle) return html;
        const files = Object.keys(bundle);
        const tags = PRELOAD_FONTS.flatMap((re) => {
          const file = files.find((f) => re.test(f));
          if (!file) {
            console.warn(`[font-preload] no font asset matched ${re}`);
            return [];
          }
          return [`<link rel="preload" href="${base}${file}" as="font" type="font/woff2" crossorigin>`];
        }).join("\n    ");
        if (!tags) return html;
        // keep <meta charset> first in <head>; the preloads go right after it
        const charset = /<meta charset="[^"]*"\s*\/?>/i;
        return charset.test(html)
          ? html.replace(charset, (m) => `${m}\n    ${tags}`)
          : html.replace(/<head>/i, `<head>\n    ${tags}`);
      },
    },
  };
}

export default defineConfig({
  // manifest: lets scripts/size.mjs resolve the initial route's chunk graph.
  build: { target: "es2022", manifest: true },
  plugins: [fontPreload()],
});
