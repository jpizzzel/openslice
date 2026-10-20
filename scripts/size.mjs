// Bundle size report: node scripts/size.mjs [--dist dir] [--route /]
// Run after a build. Prints raw and gzip sizes of every JS/CSS/font asset, then what the
// initial route downloads: index.html, the entry graph, the route's lazy page chunk and the
// fonts referenced by the CSS it loads (fonts only download when a glyph uses them).
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join, relative, extname } from "node:path";

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : d; };
const dist = opt("--dist", "dist");
const route = opt("--route", "/");

// route -> page source used by src/core/routes.ts
const PAGE_SRC = { "/": "src/pages/home.ts", "/toolbox": "src/pages/toolbox.ts", "/lab": "src/pages/lab.ts", "/about": "src/pages/about.ts", "/slices": "src/pages/slices.ts" };
const pageSrc = PAGE_SRC[route] ?? (route.startsWith("/toolbox/") ? "src/pages/tool.ts" : "src/pages/notfound.ts");

const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const files = walk(dist).filter((f) => !f.includes(`${join(dist, ".vite")}`));
const kindOf = (f) => ({ ".js": "js", ".css": "css", ".woff2": "font", ".woff": "font", ".html": "html" })[extname(f)] ?? "other";
const info = new Map();
for (const f of files) {
  const buf = readFileSync(f);
  const k = kindOf(f);
  // fonts and images are already compressed; gzip of them is reported for completeness
  info.set(relative(dist, f), { kind: k, raw: buf.length, gz: gzipSync(buf, { level: 9 }).length });
}
const kb = (n) => (n / 1024).toFixed(1).padStart(7) + " kB";
const pad = (s, n) => (s.length > n ? s : s + " ".repeat(n - s.length));

console.log(`\nAll assets in ${dist}\n`);
console.log(pad("file", 64) + pad("kind", 6) + "    raw" + "         gzip");
const order = ["html", "js", "css", "font", "other"];
const all = [...info].sort((a, b) => order.indexOf(a[1].kind) - order.indexOf(b[1].kind) || b[1].gz - a[1].gz);
for (const [f, i] of all) console.log(pad(f, 64) + pad(i.kind, 6) + kb(i.raw) + "  " + kb(i.gz));
const totals = {};
for (const [, i] of info) { totals[i.kind] ??= { raw: 0, gz: 0, n: 0 }; totals[i.kind].raw += i.raw; totals[i.kind].gz += i.gz; totals[i.kind].n++; }
console.log("\nTotals by kind");
for (const k of order) if (totals[k]) console.log(pad(`  ${k} (${totals[k].n})`, 70) + kb(totals[k].raw) + "  " + kb(totals[k].gz));

// Initial route graph
const manPath = join(dist, ".vite", "manifest.json");
if (!existsSync(manPath)) {
  console.log("\nNo .vite/manifest.json (build.manifest is off); skipping the initial route breakdown.");
  process.exit(0);
}
const man = JSON.parse(readFileSync(manPath, "utf8"));
const need = new Set();
const visit = (key) => {
  const e = man[key];
  if (!e || need.has(e.file)) return;
  need.add(e.file);
  (e.css || []).forEach((c) => need.add(c));
  (e.imports || []).forEach(visit);
};
visit("index.html");
const entryFiles = new Set(need);
visit(pageSrc);
const html = readFileSync(join(dist, "index.html"), "utf8");
const preloaded = [...html.matchAll(/<link[^>]+rel="preload"[^>]+href="\/?([^"]+)"/g)].map((m) => m[1]);
const fonts = new Set(preloaded);
for (const f of need) if (f.endsWith(".css")) {
  const css = readFileSync(join(dist, f), "utf8");
  for (const m of css.matchAll(/url\(["']?\/?([^"')]+\.woff2?)["']?\)/g)) fonts.add(m[1].replace(/^\.\.?\//, "assets/"));
}
const rows = [["index.html", "html", "document"]];
for (const f of need) rows.push([f, kindOf(f), entryFiles.has(f) ? "entry" : `page ${pageSrc}`]);
for (const f of fonts) rows.push([f, "font", preloaded.includes(f) ? "font (preloaded)" : "font (on use)"]);
console.log(`\nInitial route ${route} (entry + ${pageSrc})\n`);
const sum = {};
for (const [f, k, why] of rows) {
  const i = info.get(f);
  if (!i) { console.log(pad(f, 64) + "missing from dist"); continue; }
  console.log(pad(f, 64) + pad(k, 6) + kb(i.raw) + "  " + kb(i.gz) + "   " + why);
  sum[k] ??= { raw: 0, gz: 0 };
  sum[k].raw += i.raw; sum[k].gz += i.gz;
}
let tr = 0, tg = 0;
console.log("");
for (const k of order) if (sum[k]) {
  // woff2 is already Brotli compressed: count its raw bytes as transfer size
  const g = k === "font" ? sum[k].raw : sum[k].gz;
  tr += sum[k].raw; tg += g;
  console.log(pad(`  ${k}${k === "font" ? " (transfer = raw)" : " (gzip)"}`, 70) + kb(sum[k].raw) + "  " + kb(g));
}
console.log(pad("  initial route total", 70) + kb(tr) + "  " + kb(tg));
const otherLatin = [...info.keys()].filter((f) => /\.(woff2?)$/.test(f) && !/-latin-(wght|400)-/.test(f));
if (otherLatin.length) console.log(`\nWARNING: non-latin or legacy font files emitted: ${otherLatin.join(", ")}`);
