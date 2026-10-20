import { defineConfig, type Plugin } from "vite";

// Fonts that render above the fold on every route. Their hashed latin woff2 files are
// preloaded from the built index.html so text does not wait on the CSS to be parsed.
const PRELOAD_FONTS = [
  /bricolage-grotesque-latin-wght-normal-[\w-]+\.woff2$/,
  /big-shoulders-display-latin-wght-normal-[\w-]+\.woff2$/,
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
      handler(_html, ctx) {
        const bundle = ctx.bundle;
        if (!bundle) return [];
        const files = Object.keys(bundle);
        return PRELOAD_FONTS.flatMap((re) => {
          const file = files.find((f) => re.test(f));
          if (!file) {
            console.warn(`[font-preload] no asset matched ${re}`);
            return [];
          }
          return [{
            tag: "link",
            attrs: { rel: "preload", href: base + file, as: "font", type: "font/woff2", crossorigin: "" },
            injectTo: "head-prepend" as const,
          }];
        });
      },
    },
  };
}

export default defineConfig({
  build: { target: "es2022" },
  plugins: [fontPreload()],
});
