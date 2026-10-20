// Visual QA: node scripts/shoot.mjs [route ...] [--out dir] [--dist dir] [--mobile] [--wait ms] [--scroll px,px]
// Serves a built dist dir (default dist/) with `vite preview` and screenshots each route.
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : d; };
const flag = (k) => { const i = args.indexOf(k); if (i >= 0) { args.splice(i, 1); return true; } return false; };
const out = opt("--out", "shots");
const wait = Number(opt("--wait", "4500"));
const scroll = opt("--scroll", "").split(",").filter(Boolean).map(Number);
const mobile = flag("--mobile");
const dist = opt("--dist", "dist");
const routes = args.length ? args : ["/", "/toolbox", "/toolbox/satsuma", "/lab", "/about", "/slices"];
const port = 4300 + Math.floor(Math.random() * 500);
mkdirSync(out, { recursive: true });

const srv = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "preview", "--outDir", dist, "--port", String(port), "--strictPort"], { stdio: "ignore", detached: true });
await new Promise((r) => setTimeout(r, 1500));
const exe = process.env.SHOOT_CHROMIUM || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const browser = await chromium.launch({ executablePath: exe });
const ctx = await browser.newContext(mobile
  ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
  : { viewport: { width: 1600, height: 1000 } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}`));
page.on("console", (m) => { if (m.type() === "error") errors.push(`[console] ${m.text()}`); });
try {
  for (const r of routes) {
    await page.goto(`http://localhost:${port}${r}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(wait);
    const name = (r === "/" ? "home" : r.replace(/\//g, "_").replace(/^_/, "")) + (mobile ? "-m" : "");
    await page.screenshot({ path: `${out}/${name}.png` });
    for (const [i, y] of scroll.entries()) {
      await page.mouse.wheel(0, y);
      await page.waitForTimeout(1600);
      await page.screenshot({ path: `${out}/${name}-s${i + 1}.png` });
    }
    console.log("shot", r);
  }
} finally {
  await browser.close();
  try { process.kill(-srv.pid); } catch { srv.kill(); }
}
if (errors.length) { console.log("ERRORS:\n" + [...new Set(errors)].join("\n")); process.exitCode = 1; }
