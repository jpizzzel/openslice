// Automated QA: node scripts/qa.mjs [--dist dir] [--report file.md] [--routes /,/lab] [--only desktop|mobile]
//                                   [--fast] [--loops 3] [--sample ms]
// Serves a built dist dir (default dist/) with `vite preview` and, for every route on desktop and
// mobile, checks runtime errors, failed requests, horizontal overflow, headings, accessible names,
// duplicate ids, axe-core (serious/critical), LCP/CLS and scroll frame timing. Then it drives the
// SPA through the nav (route changes, titles, back button) and measures heap / listener / node
// growth over repeated nav loops. Prints a markdown report and exits non-zero on any error.
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";

const require = createRequire(import.meta.url);
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : d; };
const flag = (k) => { const i = args.indexOf(k); if (i >= 0) { args.splice(i, 1); return true; } return false; };

const dist = opt("--dist", "dist");
const reportPath = opt("--report", "");
const only = opt("--only", "");
const loops = Number(opt("--loops", "3"));
const sampleMs = Number(opt("--sample", "5000"));
const fast = flag("--fast");
const ROUTES = opt("--routes", "")
  .split(",").filter(Boolean);
if (!ROUTES.length) ROUTES.push("/", "/toolbox", "/toolbox/satsuma", "/toolbox/mandarin", "/toolbox/redacted-1",
  "/lab", "/about", "/slices", "/does-not-exist");

const VIEWPORTS = [
  { name: "desktop", ctx: { viewport: { width: 1440, height: 900 } } },
  { name: "mobile", ctx: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } },
].filter((v) => !only || v.name === only);

// Thresholds for warnings (not errors).
const T = { lcp: 2500, cls: 0.1, p95: 33.4, avg: 20, longTasks: 3, heapMB: 2, listeners: 50, nodes: 300 };

const EXE = process.env.SHOOT_CHROMIUM || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const AXE = require.resolve("axe-core/axe.min.js");
const VITE = resolve(dirname(require.resolve("vite/package.json")), "bin/vite.js");

/* ---------------------------------------------------------------- findings */
const findings = []; // { route, vp, sev: "error"|"warn"|"info", kind, msg }
const add = (route, vp, sev, kind, msg) => findings.push({ route, vp, sev, kind, msg: String(msg).slice(0, 400) });
const metrics = []; // per route x viewport

/* ---------------------------------------------------------------- server */
const port = 4800 + Math.floor(Math.random() * 800);
const origin = `http://localhost:${port}`;
const srv = spawn(process.execPath, [VITE, "preview", "--outDir", dist, "--port", String(port), "--strictPort"], {
  stdio: ["ignore", "ignore", "pipe"], detached: true,
});
let srvErr = "";
srv.stderr.on("data", (d) => (srvErr += d));
const stopServer = () => { try { process.kill(-srv.pid, "SIGTERM"); } catch { try { srv.kill(); } catch {} } };
process.on("exit", stopServer);
process.on("SIGINT", () => { stopServer(); process.exit(130); });

async function waitForServer() {
  const until = Date.now() + 20000;
  while (Date.now() < until) {
    try { const r = await fetch(origin + "/"); if (r.ok) return; } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`vite preview did not start on ${origin}\n${srvErr}`);
}

/* ---------------------------------------------------------------- in-page helpers */
// Installed before any page script so the observers see buffered entries from the start.
const INIT = () => {
  const q = (window.__qa = { lcp: 0, lcpEl: "", cls: 0, longTasks: [], shifts: [] });
  const desc = (n) => {
    if (!n || !n.tagName) return "";
    let s = n.tagName.toLowerCase();
    if (n.id) s += "#" + n.id;
    const c = typeof n.className === "string" ? n.className.trim().split(/\s+/).filter(Boolean).slice(0, 2) : [];
    if (c.length) s += "." + c.join(".");
    return s;
  };
  q.desc = desc;
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) { q.lcp = e.startTime; q.lcpEl = desc(e.element) || e.url || ""; }
    }).observe({ type: "largest-contentful-paint", buffered: true });
  } catch {}
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        if (e.hadRecentInput) continue;
        q.cls += e.value;
        if (q.shifts.length < 300) q.shifts.push({ t: Math.round(e.startTime), v: e.value, src: (e.sources || []).map((s) => desc(s.node)).filter(Boolean).slice(0, 3) });
      }
    }).observe({ type: "layout-shift", buffered: true });
  } catch {}
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) q.longTasks.push({ t: Math.round(e.startTime), d: Math.round(e.duration) });
    }).observe({ type: "longtask", buffered: true });
  } catch {}
};

// Static DOM checks run in the page.
const STATIC_CHECKS = () => {
  const desc = window.__qa.desc;
  const hiddenFromAT = (el) => {
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      if (n.getAttribute("aria-hidden") === "true" || n.hidden || n.inert) return true;
      const cs = getComputedStyle(n);
      if (cs.display === "none") return true;
    }
    return getComputedStyle(el).visibility === "hidden";
  };
  const nameOf = (el) => {
    const lbl = el.getAttribute("aria-label");
    if (lbl && lbl.trim()) return lbl.trim();
    const by = el.getAttribute("aria-labelledby");
    if (by) {
      const t = by.split(/\s+/).map((id) => document.getElementById(id)?.textContent || "").join(" ").trim();
      if (t) return t;
    }
    const walk = (n) => {
      if (n.nodeType === 3) return n.textContent;
      if (n.nodeType !== 1) return "";
      if (n.getAttribute("aria-hidden") === "true") return "";
      if (n.tagName === "IMG") return n.getAttribute("alt") || "";
      if (n.tagName.toLowerCase() === "svg") {
        return n.getAttribute("aria-label") || n.querySelector(":scope > title")?.textContent || "";
      }
      const cs = getComputedStyle(n);
      if (cs.display === "none") return "";
      const own = n !== el && n.getAttribute("aria-label");
      if (own) return own;
      return [...n.childNodes].map(walk).join(" ");
    };
    const t = walk(el).replace(/\s+/g, " ").trim();
    if (t) return t;
    return (el.getAttribute("title") || "").trim();
  };

  const out = { h1: [], unnamed: [], unlabeledImg: [], dupIds: [], title: document.title, lang: document.documentElement.lang };
  out.h1 = [...document.querySelectorAll("h1")].filter((h) => !hiddenFromAT(h)).map((h) => h.textContent.replace(/\s+/g, " ").trim().slice(0, 60));
  for (const el of document.querySelectorAll("a, button, [role=button], [role=link]")) {
    if (hiddenFromAT(el)) continue;
    if (el.tagName === "A" && !el.hasAttribute("href") && !el.getAttribute("role")) continue;
    if (!nameOf(el)) out.unnamed.push(`${desc(el)}${el.getAttribute("href") ? ` [href=${el.getAttribute("href")}]` : ""}`);
  }
  for (const el of document.querySelectorAll("img, [role=img], svg[role=img]")) {
    if (hiddenFromAT(el)) continue;
    if (el.tagName === "IMG") {
      if (!el.hasAttribute("alt") && el.getAttribute("role") !== "presentation") out.unlabeledImg.push(`${desc(el)} (no alt) ${el.getAttribute("src")?.slice(0, 60) || ""}`);
      continue;
    }
    const hasName = (el.getAttribute("aria-label") || "").trim() || el.getAttribute("aria-labelledby") ||
      (el.tagName.toLowerCase() === "svg" && el.querySelector(":scope > title")?.textContent.trim());
    if (!hasName) out.unlabeledImg.push(`${desc(el)} (role=img without label)`);
  }
  // Bare inline svgs that are neither hidden nor labelled are announced inconsistently.
  for (const el of document.querySelectorAll("svg:not([role])")) {
    if (hiddenFromAT(el) || el.closest("a, button, [role=img]")) continue;
    if (el.getAttribute("aria-label") || el.querySelector(":scope > title")) continue;
    const r = el.getBoundingClientRect();
    if (r.width * r.height < 4) continue;
    out.unlabeledImg.push(`${desc(el)} (svg without role, label or aria-hidden; warn)`);
  }
  const seen = new Map();
  for (const el of document.querySelectorAll("[id]")) seen.set(el.id, (seen.get(el.id) || 0) + 1);
  out.dupIds = [...seen].filter(([, n]) => n > 1).map(([id, n]) => `#${id} x${n}`);
  return out;
};

// vw is the configured viewport width: under mobile emulation innerWidth grows to fit
// overflowing content (the page zooms out), which would hide the problem.
const OVERFLOW_CHECK = (vw) => {
  const sw = document.documentElement.scrollWidth;
  const bw = document.body.scrollWidth;
  const res = { vw, sw, bw, iw: innerWidth, y: Math.round(scrollY), culprits: [] };
  if (Math.max(sw, bw, innerWidth) <= vw) return res;
  const desc = window.__qa.desc;
  // Outermost elements sticking out on the right, whose parent does not.
  const out = (r) => r.right > vw + 1;
  for (const el of document.body.querySelectorAll("*")) {
    if (el.ownerSVGElement) continue; // report the <svg>, not its shapes
    const r = el.getBoundingClientRect();
    if (!r.width || !out(r)) continue;
    const p = el.parentElement;
    if (p && p !== document.body) {
      const pr = p.getBoundingClientRect();
      const pcs = getComputedStyle(p);
      if (out(pr) && pcs.overflowX === "visible") continue;
      if (pcs.overflowX !== "visible" && pcs.overflowX !== "") continue; // clipped by parent
    }
    if (getComputedStyle(el).position === "fixed") continue;
    res.culprits.push(`${desc(el)} [${Math.round(r.left)}..${Math.round(r.right)}]`);
    if (res.culprits.length >= 6) break;
  }
  return res;
};

// rAF frame sampler; when nativeScroll is true it scrolls the page itself (touch path).
const FRAME_SAMPLE = async ({ ms, nativeScroll }) => {
  const q = window.__qa;
  const lt0 = q.longTasks.length;
  const frames = [];
  const max = document.documentElement.scrollHeight - innerHeight;
  let travel = 0, lastY = scrollY;
  await new Promise((done) => {
    let last = performance.now();
    const start = last;
    const tick = (now) => {
      frames.push(now - last);
      last = now;
      travel += Math.abs(scrollY - lastY);
      lastY = scrollY;
      const t = now - start;
      if (nativeScroll && max > 0) {
        const phase = t / ms; // down for 60%, back up for 40%
        const target = phase < 0.6 ? (phase / 0.6) * max : max * (1 - (phase - 0.6) / 0.4);
        window.scrollTo(0, target);
      }
      if (t < ms) requestAnimationFrame(tick); else done();
    };
    requestAnimationFrame(tick);
  });
  frames.shift();
  const sorted = [...frames].sort((a, b) => a - b);
  const avg = frames.reduce((a, b) => a + b, 0) / Math.max(1, frames.length);
  const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
  const long = q.longTasks.slice(lt0);
  return { travel: Math.round(travel), frames: frames.length, avg, p95, max: sorted[sorted.length - 1] || 0, jank: frames.filter((f) => f > 50).length, longTasks: long.length, longMs: long.reduce((a, b) => a + b.d, 0) };
};

/* ---------------------------------------------------------------- page lifecycle */
function wire(page, sink) {
  page.on("pageerror", (e) => sink.push({ sev: "error", kind: "pageerror", msg: e.message }));
  page.on("console", (m) => {
    if (m.type() === "error") sink.push({ sev: "error", kind: "console.error", msg: m.text() });
    else if (m.type() === "warning") sink.push({ sev: "warn", kind: "console.warn", msg: m.text() });
  });
  page.on("requestfailed", (r) => {
    const f = r.failure()?.errorText || "";
    if (/ERR_ABORTED/.test(f) && page.isClosed()) return;
    sink.push({ sev: /ERR_ABORTED/.test(f) ? "warn" : "error", kind: "request failed", msg: `${r.method()} ${r.url().replace(origin, "")} ${f}` });
  });
  page.on("response", (r) => {
    if (r.status() >= 400) sink.push({ sev: "error", kind: "HTTP " + r.status(), msg: r.url().replace(origin, "") });
  });
}

async function settle(page, ms = 1800) {
  try {
    await page.waitForFunction(() => !document.getElementById("loader") && document.querySelector("#view")?.childElementCount > 0, null, { timeout: 20000 });
  } catch {
    return false;
  }
  await page.waitForTimeout(ms);
  return true;
}

const fmt = (n, d = 0) => (n == null || Number.isNaN(n) ? "n/a" : Number(n).toFixed(d));

async function auditRoute(browser, vp, route) {
  const ctx = await browser.newContext(vp.ctx);
  await ctx.addInitScript(INIT);
  const page = await ctx.newPage();
  const sink = [];
  wire(page, sink);
  const m = { route, vp: vp.name };
  try {
    const resp = await page.goto(origin + route, { waitUntil: "load", timeout: 30000 });
    if (!resp || !resp.ok()) add(route, vp.name, "error", "navigation", `HTTP ${resp?.status()}`);
    if (!(await settle(page))) add(route, vp.name, "error", "boot", "preloader never left or #view stayed empty within 20s");

    const perf = await page.evaluate(() => ({ lcp: __qa.lcp, lcpEl: __qa.lcpEl, cls: __qa.cls, shifts: [...__qa.shifts].sort((a, b) => b.v - a.v).slice(0, 3), n: __qa.shifts.length, lt: __qa.longTasks.length }));
    Object.assign(m, { lcp: perf.lcp, lcpEl: perf.lcpEl, cls: perf.cls, bootLongTasks: perf.lt });
    if (perf.lcp > T.lcp) add(route, vp.name, "warn", "LCP", `${fmt(perf.lcp)}ms (${perf.lcpEl}); budget ${T.lcp}ms`);
    if (perf.cls > T.cls) add(route, vp.name, "warn", "CLS", `${fmt(perf.cls, 3)} at load; top shifts: ${perf.shifts.map((s) => `${fmt(s.v, 3)}@${s.t}ms ${s.src.join(",")}`).join("; ")}`);

    const s = await page.evaluate(STATIC_CHECKS);
    m.title = s.title;
    if (s.h1.length !== 1) add(route, vp.name, "error", "h1", `${s.h1.length} visible h1 elements${s.h1.length ? ": " + s.h1.map((t) => `"${t}"`).join(", ") : ""}`);
    for (const u of s.unnamed) add(route, vp.name, "error", "no accessible name", u);
    for (const u of s.unlabeledImg) add(route, vp.name, /; warn\)$/.test(u) ? "warn" : "error", "unlabeled image", u.replace("; warn)", ")"));
    for (const d of s.dupIds) add(route, vp.name, "error", "duplicate id", d);
    if (s.lang !== "en") add(route, vp.name, "warn", "lang", `html lang="${s.lang}"`);

    await page.addScriptTag({ path: AXE });
    const axe = await page.evaluate(async () => {
      const r = await window.axe.run(document, { resultTypes: ["violations"] });
      return r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, n: v.nodes.length, targets: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) }));
    });
    for (const v of axe) {
      const sev = v.impact === "serious" || v.impact === "critical" ? "error" : "info";
      add(route, vp.name, sev, `axe ${v.impact}`, `${v.id}: ${v.help} (${v.n} node${v.n > 1 ? "s" : ""}: ${v.targets.join(" | ")})`);
    }

    // Horizontal overflow at several scroll positions.
    const H = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    m.scrollH = H;
    const seenOverflow = new Set();
    for (const f of [0, 0.25, 0.5, 0.75, 1]) {
      await page.evaluate((y) => { window.scrollTo(0, y); }, Math.round(H * f));
      await page.waitForTimeout(500);
      const o = await page.evaluate(OVERFLOW_CHECK, vp.ctx.viewport.width);
      if (Math.max(o.sw, o.bw, o.iw) > o.vw) {
        const key = o.culprits.join("|");
        if (!seenOverflow.has(key)) {
          seenOverflow.add(key);
          add(route, vp.name, "error", "horizontal overflow", `scrollWidth ${Math.max(o.sw, o.bw, o.iw)} > ${o.vw} at y=${o.y}: ${o.culprits.join(", ") || "(culprit not found)"}`);
        }
      }
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);

    if (!fast) {
      let fr;
      if (vp.name === "desktop") {
        // Real wheel input so Lenis smooth scroll and ScrollTriggers run as for a user.
        await page.mouse.move(720, 450);
        const sampling = page.evaluate(FRAME_SAMPLE, { ms: sampleMs, nativeScroll: false });
        const t0 = Date.now();
        while (Date.now() - t0 < sampleMs - 100) {
          const down = Date.now() - t0 < sampleMs * 0.6;
          await page.mouse.wheel(0, down ? 120 : -160);
          await page.waitForTimeout(50);
        }
        fr = await sampling;
      } else {
        fr = await page.evaluate(FRAME_SAMPLE, { ms: sampleMs, nativeScroll: true });
      }
      if (fr.travel < 200 && m.scrollH > 400) add(route, vp.name, "warn", "qa runner", `page barely scrolled during the frame sample (${fr.travel}px of ${m.scrollH}px); frame numbers are not representative`);
      Object.assign(m, { travel: fr.travel, fAvg: fr.avg, fP95: fr.p95, fMax: fr.max, jank: fr.jank, longTasks: fr.longTasks, longMs: fr.longMs });
      if (fr.p95 > T.p95 || fr.avg > T.avg) add(route, vp.name, "warn", "frame time", `avg ${fmt(fr.avg, 1)}ms, p95 ${fmt(fr.p95, 1)}ms, max ${fmt(fr.max)}ms, ${fr.jank} frames >50ms while scrolling`);
      if (fr.longTasks > T.longTasks) add(route, vp.name, "warn", "long tasks", `${fr.longTasks} long tasks (${fr.longMs}ms total) during ${sampleMs}ms scroll`);
      const after = await page.evaluate((n) => ({ cls: __qa.cls, top: __qa.shifts.slice(n).sort((a, b) => b.v - a.v).slice(0, 3) }), perf.n);
      m.clsAll = after.cls;
      if (after.cls - perf.cls > T.cls) add(route, vp.name, "warn", "CLS while scrolling", `+${fmt(after.cls - perf.cls, 3)} layout shift during scroll (not user-input excluded); largest: ${after.top.map((x) => `${fmt(x.v, 3)} ${x.src.join(",") || "?"}`).join("; ")}`);
    }
  } catch (e) {
    add(route, vp.name, "error", "qa runner", e.message.split("\n")[0]);
  } finally {
    for (const x of sink) add(route, vp.name, x.sev, x.kind, x.msg);
    metrics.push(m);
    await ctx.close();
  }
}

/* ---------------------------------------------------------------- SPA navigation */
async function clickTo(page, vpName, href, scope = "#chrome") {
  const visible = (sel) => page.locator(`${sel}:visible`).first();
  let loc = visible(`${scope} a[href="${href}"]`);
  if (!(await loc.count()) && scope === "#chrome") {
    const btn = visible('#chrome [aria-controls="mm"]');
    if (await btn.count()) {
      await btn.click();
      await page.waitForSelector("#mm:not([hidden])", { timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(800);
      loc = visible(`#mm a[href="${href}"]`);
    }
  }
  if (!(await loc.count())) loc = visible(`a[href="${href}"]`);
  if (!(await loc.count())) throw new Error(`no visible link to ${href}`);
  try {
    await loc.click({ timeout: 4000 });
  } catch (e) {
    add(href, vpName, "warn", "click intercepted", `link to ${href} not directly clickable (${e.message.split("\n")[0].slice(0, 120)}); retried with force`);
    await loc.click({ force: true, timeout: 4000 });
  }
}

async function waitRoute(page, href, prevTitle) {
  await page.waitForFunction(([h, t]) => location.pathname === h && document.title !== t && !document.querySelector(".pt.is-on") && document.querySelector("#view")?.childElementCount > 0,
    [href, prevTitle], { timeout: 10000 });
  await page.waitForTimeout(400);
}

// One loop through the site using only in-app links. Returns the list of steps.
async function navLoop(page, vpName, check) {
  const steps = [];
  const go = async (label, href, scope) => {
    const before = await page.evaluate(() => ({ p: location.pathname, t: document.title }));
    const e0 = check.errors.length;
    const t0 = Date.now();
    try {
      await clickTo(page, vpName, href, scope);
      await waitRoute(page, href, before.t);
      const after = await page.evaluate(() => ({ p: location.pathname, t: document.title, focus: document.activeElement?.id || document.activeElement?.tagName }));
      steps.push({ label, href, ok: true, ms: Date.now() - t0, title: after.t, errs: check.errors.slice(e0) });
    } catch (e) {
      const now = await page.evaluate(() => ({ p: location.pathname, t: document.title })).catch(() => ({}));
      steps.push({ label, href, ok: false, ms: Date.now() - t0, msg: `${e.message.split("\n")[0].slice(0, 160)} (now at ${now.p}, title "${now.t}")`, errs: check.errors.slice(e0) });
    }
  };
  await go("nav: Toolbox", "/toolbox");
  const tool = await page.locator('#view a[href^="/toolbox/"]:visible').first().getAttribute("href").catch(() => null);
  if (tool) await go("toolbox card: tool", tool, "#view");
  else steps.push({ label: "toolbox card: tool", href: "/toolbox/*", ok: false, msg: "no visible tool link in #view on /toolbox", errs: [] });
  await go("nav: Lab", "/lab");
  await go("nav: About", "/about");
  await go("nav: The Trunk", "/slices");
  await go("logo: home", "/");
  return steps;
}

async function spaAudit(browser, vp) {
  const ctx = await browser.newContext(vp.ctx);
  await ctx.addInitScript(INIT);
  const page = await ctx.newPage();
  const sink = [];
  wire(page, sink);
  const check = { errors: sink };
  const res = { vp: vp.name, steps: [], back: null, mem: null };
  try {
    await page.goto(origin + "/", { waitUntil: "load" });
    await settle(page, 1200);
    res.steps = await navLoop(page, vp.name, check);
    // History: back should return to the previous route via popstate.
    const t = await page.title();
    await page.goBack();
    try {
      await page.waitForFunction((t) => location.pathname === "/slices" && document.title !== t && !document.querySelector(".pt.is-on"), t, { timeout: 8000 });
      res.back = { ok: true };
    } catch (e) {
      res.back = { ok: false, msg: `back button did not restore /slices (at ${await page.evaluate(() => location.pathname)})` };
    }
    await page.goForward();
    await page.waitForFunction(() => location.pathname === "/" && !document.querySelector(".pt.is-on"), null, { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(600);

    if (vp.name === "desktop") {
      // Leak check: CDP metrics after forced GC, before and after N full nav loops.
      const cdp = await ctx.newCDPSession(page);
      await cdp.send("Performance.enable");
      const snap = async () => {
        await cdp.send("HeapProfiler.collectGarbage");
        await page.waitForTimeout(300);
        await cdp.send("HeapProfiler.collectGarbage");
        const { metrics: ms } = await cdp.send("Performance.getMetrics");
        const g = (k) => ms.find((x) => x.name === k)?.value ?? 0;
        const pm = await page.evaluate(() => performance.memory ? performance.memory.usedJSHeapSize : 0);
        return { heap: pm || g("JSHeapUsedSize"), listeners: g("JSEventListeners"), nodes: g("Nodes"), docs: g("Documents") };
      };
      await navLoop(page, vp.name, check); // warm-up so lazy chunks / caches are in
      const base = await snap();
      const per = [];
      for (let i = 0; i < loops; i++) {
        const st = await navLoop(page, vp.name, check);
        if (st.some((s) => !s.ok)) res.steps.push(...st.filter((s) => !s.ok).map((s) => ({ ...s, label: `loop ${i + 1} ${s.label}` })));
        per.push(await snap());
      }
      res.mem = { base, per, loops };

      // Attribution: bounce home -> R -> home via history + popstate (the router's own path),
      // so growth per cycle points at R's mount/cleanup (home's share shows on every row).
      const go = async (path) => {
        const t = await page.title();
        await page.evaluate((p) => { history.pushState({}, "", p); dispatchEvent(new PopStateEvent("popstate")); }, path);
        await page.waitForFunction(([p, t]) => location.pathname === p && document.title !== t && !document.querySelector(".pt.is-on"), [path, t], { timeout: 10000 });
        await page.waitForTimeout(300);
      };
      res.attr = [];
      for (const r of ROUTES.filter((r) => r !== "/")) {
        try {
          await go(r); await go("/");
          const a = await snap();
          for (let i = 0; i < loops; i++) { await go(r); await go("/"); }
          const b = await snap();
          res.attr.push({ route: r, heap: (b.heap - a.heap) / loops, listeners: (b.listeners - a.listeners) / loops, nodes: (b.nodes - a.nodes) / loops });
        } catch (e) {
          res.attr.push({ route: r, err: e.message.split("\n")[0] });
        }
      }
    }
  } catch (e) {
    res.fatal = e.message.split("\n")[0];
  } finally {
    res.sink = sink;
    await ctx.close();
  }
  return res;
}

/* ---------------------------------------------------------------- report */
function render(spa, wall) {
  const L = [];
  const errors = findings.filter((f) => f.sev === "error");
  const warns = findings.filter((f) => f.sev === "warn");
  L.push(`# OpenSlice QA report`);
  L.push("");
  L.push(`dist: \`${dist}\` | ${new Date().toISOString()} | ${Math.round(wall / 1000)}s | viewports: ${VIEWPORTS.map((v) => `${v.name} ${v.ctx.viewport.width}x${v.ctx.viewport.height}`).join(", ")}`);
  L.push("");
  L.push(`**${errors.length ? "FAIL" : "PASS"}**: ${errors.length} error finding(s), ${warns.length} warning(s).`);
  L.push("");
  L.push("## Metrics");
  L.push("");
  L.push("| route | vp | LCP ms (element) | CLS load / total | frame avg / p95 / max ms | long tasks | scrolled px | title |");
  L.push("|---|---|---|---|---|---|---|---|");
  for (const r of ROUTES) for (const v of VIEWPORTS) {
    const m = metrics.find((x) => x.route === r && x.vp === v.name);
    if (!m) continue;
    L.push(`| ${r} | ${v.name} | ${fmt(m.lcp)} (${m.lcpEl || "?"}) | ${fmt(m.cls, 3)} / ${fmt(m.clsAll, 3)} | ${fast ? "skipped" : `${fmt(m.fAvg, 1)} / ${fmt(m.fP95, 1)} / ${fmt(m.fMax)}`} | ${fast ? "-" : m.longTasks} | ${fast ? "-" : m.travel} | ${m.title ?? ""} |`);
  }
  L.push("");
  L.push("_Frame times come from headless Chromium with software rendering; treat them as relative, not absolute._");
  L.push("");

  // Group findings: route -> severity -> unique (kind,msg) with viewport tags.
  L.push("## Findings by route");
  const sevOrder = ["error", "warn", "info"];
  const routes = [...new Set([...ROUTES, ...findings.map((f) => f.route)])];
  for (const r of routes) {
    const fs = findings.filter((f) => f.route === r);
    if (!fs.length) continue;
    L.push("");
    L.push(`### ${r}`);
    for (const sev of sevOrder) {
      const g = new Map();
      for (const f of fs.filter((f) => f.sev === sev)) {
        const k = `${f.kind}\u0000${f.msg}`;
        if (!g.has(k)) g.set(k, new Set());
        g.get(k).add(f.vp);
      }
      if (!g.size) continue;
      L.push(`- **${sev}**`);
      for (const [k, vps] of g) {
        const [kind, msg] = k.split("\u0000");
        const tag = vps.size === VIEWPORTS.length && VIEWPORTS.length > 1 ? "both" : [...vps].join("+");
        L.push(`  - [${tag}] ${kind}: ${msg.replace(/\n/g, " ")}`);
      }
    }
  }
  if (!findings.length) L.push("", "No findings.");
  L.push("");

  L.push("## SPA navigation");
  for (const s of spa) {
    L.push("");
    L.push(`### ${s.vp}`);
    if (s.fatal) L.push(`- **error** runner: ${s.fatal}`);
    for (const st of s.steps) {
      const errs = st.errs.filter((e) => e.sev === "error");
      L.push(`- ${st.ok && !errs.length ? "ok" : "**FAIL**"} ${st.label} -> ${st.href} (${st.ms ?? "?"}ms)${st.ok ? ` title "${st.title}"` : `: ${st.msg}`}${errs.length ? `; errors: ${errs.map((e) => `${e.kind}: ${e.msg}`).join(" / ")}` : ""}`);
    }
    if (s.back) L.push(`- ${s.back.ok ? "ok" : "**FAIL**"} browser back -> /slices${s.back.ok ? "" : `: ${s.back.msg}`}`);
    const extra = s.sink.filter((e) => e.sev === "error");
    const uniq = [...new Set(extra.map((e) => `${e.kind}: ${e.msg}`))];
    if (uniq.length) L.push(`- errors seen during in-app navigation (all loops): ${uniq.map((u) => `\n  - ${u}`).join("")}`);
    if (s.mem) {
      const { base, per, loops: n } = s.mem;
      const last = per[per.length - 1];
      const mb = (b) => (b / 1048576).toFixed(2);
      L.push("");
      L.push(`Leak check (forced GC, ${n} full nav loops after a warm-up loop):`);
      L.push("");
      L.push("| snapshot | JS heap MB | listeners | DOM nodes | documents |");
      L.push("|---|---|---|---|---|");
      L.push(`| baseline | ${mb(base.heap)} | ${base.listeners} | ${base.nodes} | ${base.docs} |`);
      per.forEach((p, i) => L.push(`| after loop ${i + 1} | ${mb(p.heap)} | ${p.listeners} | ${p.nodes} | ${p.docs} |`));
      L.push(`| **delta** | ${mb(last.heap - base.heap)} | ${last.listeners - base.listeners} | ${last.nodes - base.nodes} | ${last.docs - base.docs} |`);
      if (s.attr?.length) {
        L.push("");
        L.push(`Per route growth per home -> route -> home cycle (avg of ${n}, after GC; ~0 means clean):`);
        L.push("");
        L.push("| route | JS heap kB | listeners | DOM nodes |");
        L.push("|---|---|---|---|");
        for (const a of s.attr) L.push(a.err ? `| ${a.route} | error: ${a.err} | | |` : `| ${a.route} | ${(a.heap / 1024).toFixed(0)} | ${fmt(a.listeners, 1)} | ${fmt(a.nodes, 0)} |`);
      }
    }
  }
  L.push("");
  return L.join("\n");
}

/* ---------------------------------------------------------------- main */
const t0 = Date.now();
let browser;
let spa = [];
try {
  await waitForServer();
  browser = await chromium.launch({ executablePath: EXE, args: ["--enable-precise-memory-info"] });
  for (const vp of VIEWPORTS) {
    for (const r of ROUTES) {
      process.stderr.write(`qa ${vp.name} ${r}\n`);
      await auditRoute(browser, vp, r);
    }
  }
  for (const vp of VIEWPORTS) {
    process.stderr.write(`qa ${vp.name} spa navigation\n`);
    const s = await spaAudit(browser, vp);
    spa.push(s);
    for (const st of s.steps) if (!st.ok) add("SPA navigation", vp.name, "error", "navigation", `${st.label} -> ${st.href}: ${st.msg}`);
    for (const st of s.steps) for (const e of st.errs.filter((e) => e.sev === "error")) add("SPA navigation", vp.name, "error", e.kind, `${st.label}: ${e.msg}`);
    if (s.back && !s.back.ok) add("SPA navigation", vp.name, "error", "history", s.back.msg);
    if (s.fatal) add("SPA navigation", vp.name, "error", "qa runner", s.fatal);
    if (s.mem) {
      const last = s.mem.per[s.mem.per.length - 1], b = s.mem.base;
      const dh = (last.heap - b.heap) / 1048576, dl = last.listeners - b.listeners, dn = last.nodes - b.nodes;
      const grows = (k) => s.mem.per.every((p, i) => i === 0 || p[k] > s.mem.per[i - 1][k]);
      if (dh > T.heapMB) add("SPA navigation", vp.name, "warn", "heap growth", `+${dh.toFixed(2)}MB JS heap after ${s.mem.loops} nav loops${grows("heap") ? " (monotonic)" : ""}`);
      if (dl > T.listeners) add("SPA navigation", vp.name, "warn", "listener growth", `+${dl} event listeners after ${s.mem.loops} nav loops${grows("listeners") ? " (monotonic, likely a cleanup leak)" : ""}`);
      if (dn > T.nodes) add("SPA navigation", vp.name, "warn", "DOM node growth", `+${dn} nodes after ${s.mem.loops} nav loops${grows("nodes") ? " (monotonic, detached or leftover nodes)" : ""}`);
      for (const a of s.attr || []) {
        if (a.err) { add(a.route, vp.name, "warn", "leak check", a.err); continue; }
        const bits = [];
        if (a.nodes > 50) bits.push(`+${fmt(a.nodes)} DOM nodes`);
        if (a.listeners >= 1) bits.push(`+${fmt(a.listeners, 1)} event listeners`);
        if (a.heap > 200 * 1024) bits.push(`+${(a.heap / 1024).toFixed(0)}kB heap`);
        if (bits.length) add(a.route, vp.name, "warn", "leak per visit", `${bits.join(", ")} retained per home -> ${a.route} -> home cycle (after GC)`);
      }
    }
  }
} catch (e) {
  add("runner", "-", "error", "qa runner", e.stack || e.message);
} finally {
  await browser?.close();
  stopServer();
}

const md = render(spa, Date.now() - t0);
process.stdout.write(md + "\n");
if (reportPath) {
  mkdirSync(dirname(resolve(reportPath)), { recursive: true });
  writeFileSync(reportPath, md + "\n");
  process.stderr.write(`report written to ${reportPath}\n`);
}
process.exitCode = findings.some((f) => f.sev === "error") ? 1 : 0;
