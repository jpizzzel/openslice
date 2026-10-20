// Shared plumbing for the Lab experiments: palette, a single shared rAF loop
// with focus scheduling, a canvas stage (DPR capped, ResizeObserver driven,
// reduced motion aware) and a few drawing helpers in the ink/halftone style.
import { bus } from "../../core/bus";

export const C = {
  flour: "#efebe4",
  flour2: "#e4ded4",
  paper: "#f7f4ef",
  tomato: "#ff3b2f",
  tomatoDeep: "#d92a1f",
  tomatoLight: "#ff7a6e",
  ink: "#141210",
  ink2: "#4a4540",
  ink3: "#8a837a",
  basil: "#2f7d4f",
  basilLight: "#4fa06f",
  cheese: "#ffc93c",
  cheeseDeep: "#f0a91b",
  crust: "#efc27a",
  dough: "#f6e4c0",
} as const;

export type SfxName = "tick" | "pop" | "whoosh" | "click";

export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const TAU = Math.PI * 2;

/** small deterministic PRNG */
export function rng(seed: number) {
  let a = seed >>> 0 || 1;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------------------------------------------------------------- loop */

export interface Sub {
  key: string;
  heavy: boolean;
  tick(dt: number, t: number): void;
  acc?: number;
}

/**
 * One rAF for every running toy. A toy only runs while someone is playing
 * with it (hovered, focused, touched or expanded), so usually nothing runs.
 * `solo` (modal) pauses everything else. Halts when the tab hides.
 */
export class Loop {
  private subs = new Set<Sub>();
  private raf = 0;
  private last = 0;
  private frame = 0;
  focus = "";
  solo = "";
  /** performance.now() of the last page scroll; set by the page */
  lastScroll = -1e9;

  constructor() {
    document.addEventListener("visibilitychange", this.vis);
  }
  private vis = () => (document.hidden ? this.halt() : this.wake());
  add(s: Sub) {
    s.acc = 0;
    this.subs.add(s);
    this.wake();
  }
  remove(s: Sub) {
    this.subs.delete(s);
    if (!this.subs.size) this.halt();
  }
  has(s: Sub) { return this.subs.has(s); }
  private wake() {
    if (this.raf || !this.subs.size || document.hidden) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.run);
  }
  private halt() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }
  private run = (now: number) => {
    this.raf = requestAnimationFrame(this.run);
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.frame++;
    // while the page scrolls, leave the frame budget to scrolling: toys that
    // are not focused tick at a third of the rate (time still accumulates)
    const scrolling = now - this.lastScroll < 180;
    for (const s of this.subs) {
      if (this.solo && s.key !== this.solo) continue;
      s.acc = (s.acc ?? 0) + dt;
      if (!this.solo && s.key !== this.focus) {
        if (scrolling ? this.frame % 3 : s.heavy && this.frame % 2) continue;
      }
      const d = Math.min(0.05, s.acc);
      s.acc = 0;
      s.tick(d, now / 1000);
    }
  };
  destroy() {
    this.halt();
    this.subs.clear();
    document.removeEventListener("visibilitychange", this.vis);
  }
}

/* ----------------------------------------------------------------- env */

export interface ToyEnv {
  key: string;
  loop: Loop;
  reduced: boolean;
  /** throttled sound effect */
  sfx(name: SfxName, minGapMs?: number): void;
  /** the person touched the toy: claims focus */
  poke(): void;
}

export interface Toy {
  start(): void;
  stop(): void;
  destroy(): void;
  /** keyboard play (Enter / Space on the focused stage): one good default action */
  act?(): void;
}

export interface Experiment {
  id: string;
  title: string;
  line: string;
  /** describes the toy for assistive tech */
  label: string;
  /** width / height of the toy when expanded */
  ar: [number, number];
  heavy?: boolean;
  create(host: HTMLElement, env: ToyEnv): Toy;
}

export function makeSfx() {
  const last: Record<string, number> = {};
  return (name: SfxName, gap = 60) => {
    const now = performance.now();
    if (now - (last[name] ?? 0) < gap) return;
    last[name] = now;
    bus.emit("sfx", { name });
  };
}

/* --------------------------------------------------------------- stage */

export interface StageOpts {
  host: HTMLElement;
  env: ToyEnv;
  label: string;
  heavy?: boolean;
  /** called with new and previous css size (previous is 0 on first layout) */
  resize(w: number, h: number, pw: number, ph: number): void;
  /** advance and draw. `dt` is 0 for a static (reduced motion) render. */
  frame(dt: number, t: number): void;
}

/**
 * A canvas that fills its host. Runs its frame on the shared loop while
 * started. Under reduced motion it renders one static frame and only runs
 * for a short while after each `kick()` (direct interaction).
 */
export class Stage {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  w = 0;
  h = 0;
  dpr = 1;
  started = false;
  private until = 0;
  private ro: ResizeObserver;
  private sub: Sub;

  constructor(private o: StageOpts) {
    const c = document.createElement("canvas");
    c.className = "lab-canvas";
    c.setAttribute("role", "img");
    c.setAttribute("aria-label", o.label);
    o.host.appendChild(c);
    this.canvas = c;
    this.ctx = c.getContext("2d")!;
    this.sub = { key: o.env.key, heavy: !!o.heavy, tick: (dt, t) => this.tick(dt, t) };
    this.ro = new ResizeObserver(() => this.measure());
    // the observer fires once right away (async), so callers can finish
    // wiring before the first resize/frame
    this.ro.observe(o.host);
  }

  private measure() {
    const r = this.o.host.getBoundingClientRect();
    // getBoundingClientRect includes Flip scale transforms; offset* does not
    const w = this.o.host.clientWidth || r.width;
    const h = this.o.host.clientHeight || r.height;
    if (w < 2 || h < 2) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (w === this.w && h === this.h && dpr === this.dpr) return;
    const pw = this.w, ph = this.h;
    this.w = w; this.h = h; this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.o.resize(w, h, pw, ph);
    this.paint(0);
  }

  private paint(dt: number) {
    if (!this.w) return;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.o.frame(dt, performance.now() / 1000);
  }

  private tick(dt: number, _t: number) {
    if (this.o.env.reduced && performance.now() > this.until) {
      this.o.env.loop.remove(this.sub);
      return;
    }
    this.paint(dt);
  }

  start() {
    if (this.started) return;
    this.started = true;
    if (this.o.env.reduced) this.paint(0);
    else this.o.env.loop.add(this.sub);
  }

  stop() {
    this.started = false;
    this.o.env.loop.remove(this.sub);
  }

  /** run the loop for a while after direct interaction (reduced motion) */
  kick(ms = 1800) {
    if (!this.o.env.reduced || !this.started) return;
    this.until = performance.now() + ms;
    if (!this.o.env.loop.has(this.sub)) this.o.env.loop.add(this.sub);
  }

  /** pointer position in css px, robust to Flip transforms */
  pos(e: PointerEvent | MouseEvent) {
    const r = this.canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / (r.width || 1)) * this.w,
      y: ((e.clientY - r.top) / (r.height || 1)) * this.h,
    };
  }

  destroy() {
    this.stop();
    this.ro.disconnect();
    this.canvas.remove();
  }
}

/* ------------------------------------------------------------- drawing */

const patterns = new Map<string, CanvasPattern>();
/** halftone dot pattern: `step` css px grid, dot radius `r`, 45deg screen */
export function dots(ctx: CanvasRenderingContext2D, color: string, step: number, r: number, dpr: number) {
  const k = `${color}|${step}|${r}|${dpr}`;
  let p = patterns.get(k);
  if (p) return p;
  const s = Math.max(2, Math.round(step * dpr));
  const c = document.createElement("canvas");
  c.width = s; c.height = s;
  const g = c.getContext("2d")!;
  g.fillStyle = color;
  const rr = r * dpr;
  for (const [x, y] of [[0, 0], [s, 0], [0, s], [s, s], [s / 2, s / 2]]) {
    g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill();
  }
  p = ctx.createPattern(c, "repeat")!;
  p.setTransform(new DOMMatrix().scale(1 / dpr));
  patterns.set(k, p);
  return p;
}

export function pepperoni(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, lw: number, seed = 1) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
  ctx.fillStyle = C.tomato; ctx.fill();
  ctx.lineWidth = lw; ctx.strokeStyle = C.ink; ctx.stroke();
  const rnd = rng(seed * 977);
  ctx.fillStyle = C.tomatoDeep;
  for (let i = 0; i < 4; i++) {
    const a = rnd() * TAU, d = r * (0.25 + rnd() * 0.45);
    ctx.beginPath(); ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, r * (0.1 + rnd() * 0.08), 0, TAU); ctx.fill();
  }
  ctx.beginPath(); ctx.arc(x, y, r * 0.62, -2.4, -1.4);
  ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = Math.max(1, r * 0.12); ctx.lineCap = "round"; ctx.stroke();
}

export function leaf(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, a: number, lw: number) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(a);
  ctx.beginPath();
  ctx.moveTo(-r, 0);
  ctx.quadraticCurveTo(-r * 0.2, -r * 0.95, r, 0);
  ctx.quadraticCurveTo(-r * 0.2, r * 0.95, -r, 0);
  ctx.fillStyle = C.basil; ctx.fill();
  ctx.lineWidth = lw; ctx.strokeStyle = C.ink; ctx.lineJoin = "round"; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-r * 0.75, 0); ctx.quadraticCurveTo(0, -r * 0.08, r * 0.7, 0);
  ctx.lineWidth = lw * 0.7; ctx.stroke();
  ctx.restore();
}

/** smooth closed path through points using midpoint quadratics */
export function closedCurve(ctx: CanvasRenderingContext2D, xs: Float32Array | number[], ys: Float32Array | number[], n: number) {
  ctx.beginPath();
  let mx = (xs[n - 1] + xs[0]) / 2, my = (ys[n - 1] + ys[0]) / 2;
  ctx.moveTo(mx, my);
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    mx = (xs[i] + xs[j]) / 2; my = (ys[i] + ys[j]) / 2;
    ctx.quadraticCurveTo(xs[i], ys[i], mx, my);
  }
  ctx.closePath();
}

/** pointer helper: down/move/up with capture, returns cleanup */
export function drag(
  el: HTMLElement,
  h: {
    down?(e: PointerEvent): boolean | void;
    move?(e: PointerEvent, active: boolean): void;
    up?(e: PointerEvent): void;
  },
) {
  let active = false;
  const down = (e: PointerEvent) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    if (h.down?.(e) === false) return;
    active = true;
    try { el.setPointerCapture(e.pointerId); } catch { /* noop */ }
  };
  const move = (e: PointerEvent) => h.move?.(e, active);
  const up = (e: PointerEvent) => {
    if (!active) return;
    active = false;
    h.up?.(e);
  };
  el.addEventListener("pointerdown", down);
  el.addEventListener("pointermove", move);
  el.addEventListener("pointerup", up);
  el.addEventListener("pointercancel", up);
  el.addEventListener("lostpointercapture", up);
  return () => {
    el.removeEventListener("pointerdown", down);
    el.removeEventListener("pointermove", move);
    el.removeEventListener("pointerup", up);
    el.removeEventListener("pointercancel", up);
    el.removeEventListener("lostpointercapture", up);
  };
}
