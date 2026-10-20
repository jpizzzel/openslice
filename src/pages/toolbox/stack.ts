// The covers stack: tool posters as tilted 3D cards. Drag or swipe sideways, use the
// arrow keys or a sideways wheel/trackpad gesture to move through them; click the front
// cover to open its tool. It never takes over vertical page scroll.
// Used by the home hero and by /toolbox.
import "../../styles/pages/covers.css";
import { gsap, reducedMotion, finePointer } from "../../core/motion";
import { poster } from "../../art/index";
import { flattenSvgs } from "../../art/flatten";
import type { Tool } from "../../data/site";
import { arrowSVG, esc } from "./shared";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export interface StackOptions {
  tools: Tool[];
  /** accessible name of the group */
  label?: string;
  /** called when the front cover changes (and once on mount with instant = true) */
  onChange?: (i: number, instant: boolean) => void;
  /** extra elements whose focus lets the arrow keys move the stack (lists, controls) */
  keyScopes?: HTMLElement[];
  /** let arrow keys move the stack while nothing in particular has focus and the stack is on screen */
  pageKeys?: boolean;
  /** a `ctrlHTML()` block to wire up: index and previous / next buttons */
  controls?: HTMLElement | null;
}

export interface Stack {
  go(i: number): void;
  next(): void;
  prev(): void;
  readonly index: number;
  destroy(): void;
}

/** Markup for the stack. Mount it with `mountStack` once it is in the DOM. */
export function stackHTML(tools: Tool[], label = "Tool covers") {
  return `
  <div class="cv" data-active="0">
    <div class="cv-stage" role="group" aria-roledescription="carousel" aria-label="${esc(label)}">
      ${tools.map((t, i) => `
      <a class="cv-card" href="/toolbox/${t.slug}" data-i="${i}" draggable="false" data-cursor="Open" style="--c:${t.color}">
        <span class="cv-card__art">${poster(t)}</span>
        <span class="cv-card__shade" aria-hidden="true"></span>
        <span class="sr-only">Open ${esc(t.name)}, ${esc(t.kind)}</span>
      </a>`).join("")}
    </div>
    <p class="sr-only cv-live" aria-live="polite"></p>
  </div>`;
}

/** "1 / 6" and previous / next buttons. Pass the element as `controls` to mountStack. */
export function ctrlHTML(n: number) {
  return `
  <div class="cv-ctrl">
    <button class="cv-btn" type="button" data-dir="-1" aria-label="Previous tool">${arrowSVG("left")}</button>
    <button class="cv-btn" type="button" data-dir="1" aria-label="Next tool">${arrowSVG("right")}</button>
    <span class="cv-idx" aria-hidden="true"><b>1</b> / ${n}</span>
  </div>`;
}

/** small deterministic per-card jitter so the pile looks set down by hand */
const jitter = (i: number) => (((i * 37) % 7) - 3) * 0.7;

export function mountStack(cv: HTMLElement, opts: StackOptions): Stack {
  const { tools } = opts;
  const N = tools.length;
  const stage = cv.querySelector<HTMLElement>(".cv-stage")!;
  const cards = [...cv.querySelectorAll<HTMLAnchorElement>(".cv-card")];
  const shades = cards.map((c) => c.querySelector<HTMLElement>(".cv-card__shade")!);
  const live = cv.querySelector<HTMLElement>(".cv-live")!;
  const ctrl = opts.controls ?? null;
  const idxEl = ctrl?.querySelector<HTMLElement>(".cv-idx b") ?? null;
  const btns = ctrl ? [...ctrl.querySelectorAll<HTMLButtonElement>(".cv-btn")] : [];

  const offs: (() => void)[] = [];
  const on = <K extends keyof WindowEventMap>(
    t: Window | HTMLElement, type: K, fn: (e: WindowEventMap[K]) => void, o?: AddEventListenerOptions,
  ) => {
    t.addEventListener(type, fn as EventListener, o);
    offs.push(() => t.removeEventListener(type, fn as EventListener, o));
  };

  // the posters ride per-frame 3D transforms: as images they raster once
  offs.push(flattenSvgs(cv.querySelectorAll<SVGSVGElement>(".cv-card__art > svg")));

  const state = { p: 0, mx: 0, my: 0 };
  let active = -1;
  let cw = 1;
  let tween: gsap.core.Tween | null = null;
  let raf = 0;
  let dead = false;

  // style writes are cached per node so a frame only touches what changed
  type Prop = "transform" | "opacity" | "visibility" | "zIndex";
  const last = new Map<HTMLElement, Partial<Record<Prop, string>>>();
  const put = (n: HTMLElement, prop: Prop, v: string) => {
    let c = last.get(n);
    if (!c) last.set(n, (c = {}));
    if (c[prop] === v) return;
    c[prop] = v;
    n.style[prop] = v;
  };

  const measure = () => { cw = cards[0]?.offsetWidth || 1; };

  const render = () => {
    raf = 0;
    const p = state.p;
    cards.forEach((c, i) => {
      const d = i - p;
      const j = jitter(i);
      let x: number, y: number, z: number, rx: number, ry: number, rz: number, o: number, sh: number;
      if (d <= 0) {
        // on its way off the top of the pile, to the left
        const k = -d;
        x = -k * 0.95 * cw;
        y = -k * 0.08 * cw;
        z = k * 60;
        rx = 12 + k * 6;
        ry = -22 - k * 14;
        rz = -3 + k * -10;
        o = clamp(1 - k * 1.5, 0, 1);
        sh = 0;
      } else {
        // waiting in the pile, up and to the right, further back
        x = d * 0.24 * cw;
        y = -d * 0.12 * cw;
        z = -d * 150;
        rx = 12 + d * 2;
        ry = -22 + d * 2;
        rz = -3 + j * Math.min(d, 1) + d * 2.2;
        o = d < 3 ? 1 : clamp(1 - (d - 3) / 0.6, 0, 1);
        sh = clamp(d * 0.16, 0, 0.5);
      }
      const near = clamp(1 - Math.abs(d), 0, 1);
      rx -= state.my * 6 * near;
      ry += state.mx * 8 * near;
      const hidden = o < 0.01;
      put(c, "visibility", hidden ? "hidden" : "visible");
      if (hidden) return;
      put(c, "transform", `perspective(1600px) translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,${z.toFixed(1)}px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg)`);
      put(c, "opacity", o.toFixed(3));
      put(c, "zIndex", String(d <= 0 ? 200 - Math.round(-d * 10) : 100 - Math.round(d * 10)));
      put(shades[i], "opacity", sh.toFixed(2));
    });
    setActive(clamp(Math.round(p), 0, N - 1), false);
  };
  const request = () => { if (!raf && !dead) raf = requestAnimationFrame(render); };

  const setActive = (i: number, instant: boolean) => {
    if (i === active) return;
    const hadFocus = cards.some((c) => c === document.activeElement);
    active = i;
    cv.dataset.active = String(i);
    cards.forEach((c, n) => {
      const front = n === i;
      c.classList.toggle("is-front", front);
      c.tabIndex = front ? 0 : -1;
      if (front) c.removeAttribute("aria-hidden");
      else c.setAttribute("aria-hidden", "true");
    });
    if (hadFocus) cards[i].focus({ preventScroll: true });
    live.textContent = `${tools[i].name}, ${i + 1} of ${N}`;
    if (idxEl) idxEl.textContent = String(i + 1);
    btns.forEach((b) => { b.disabled = Number(b.dataset.dir) < 0 ? i === 0 : i === N - 1; });
    opts.onChange?.(i, instant);
  };

  const go = (i: number) => {
    i = clamp(i, 0, N - 1);
    tween?.kill();
    tween = null;
    if (reducedMotion) {
      state.p = i;
      request();
      return;
    }
    const dist = Math.abs(i - state.p);
    tween = gsap.to(state, {
      p: i, duration: Math.min(1.1, 0.55 + dist * 0.12), ease: "power3.out", onUpdate: request,
      onComplete: () => { tween = null; },
    });
  };

  // ---------- drag / swipe ----------
  let drag: { x: number; y: number; p0: number; moved: boolean; touch: boolean; id: number; vx: number; t: number; lx: number } | null = null;
  let suppressClick = false;
  let suppressTimer = 0;
  const perCard = () => Math.max(160, cw * 0.9);

  on(stage, "pointerdown", (e) => {
    if (e.button !== 0 || !e.isPrimary) return;
    tween?.kill();
    tween = null;
    drag = { x: e.clientX, y: e.clientY, p0: state.p, moved: false, touch: e.pointerType !== "mouse", id: e.pointerId, vx: 0, t: performance.now(), lx: e.clientX };
  });
  on(window, "pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (!drag.moved) {
      if (Math.hypot(dx, dy) < 8) return;
      // mostly vertical: that is a page scroll, not ours
      if (Math.abs(dy) > Math.abs(dx)) { drag = null; return; }
      drag.moved = true;
      cv.classList.add("is-dragging");
      qx?.(0); qy?.(0);
    }
    const now = performance.now();
    const dt = Math.max(1, now - drag.t);
    drag.vx = drag.vx * 0.6 + ((e.clientX - drag.lx) / dt) * 0.4; // px per ms
    drag.t = now;
    drag.lx = e.clientX;
    let p = drag.p0 - dx / perCard();
    // resist past either end
    if (p < 0) p = p * 0.3;
    else if (p > N - 1) p = N - 1 + (p - (N - 1)) * 0.3;
    state.p = p;
    request();
  });
  const end = (e: PointerEvent | null) => {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    const d = drag;
    drag = null;
    cv.classList.remove("is-dragging");
    if (!d.moved) return;
    suppressClick = true;
    window.clearTimeout(suppressTimer);
    suppressTimer = window.setTimeout(() => (suppressClick = false), 60);
    const from = Math.round(d.p0);
    const delta = state.p - from;
    // a flick or a short pull is enough to move one card; a long pull lands where it was let go
    const fling = -d.vx * 1000 / perCard(); // cards per second
    let target = Math.round(state.p + clamp(fling * 0.12, -1, 1));
    if (Math.abs(delta) > 0.12 && Math.abs(delta) < 1) target = from + Math.sign(delta);
    go(target);
  };
  on(window, "pointerup", end);
  on(window, "pointercancel", end);
  // a drag that ends outside the window never sends pointerup
  on(window, "blur", () => end(null));

  // ---------- click ----------
  on(stage, "click", (e) => {
    if (suppressClick) { e.preventDefault(); e.stopPropagation(); return; }
    const card = (e.target as Element).closest<HTMLElement>(".cv-card");
    if (card && Number(card.dataset.i) !== active) {
      // a cover further back comes to the front first
      e.preventDefault();
      e.stopPropagation();
      go(Number(card.dataset.i));
    }
  }, { capture: true });

  // ---------- sideways wheel / trackpad ----------
  let wheelAcc = 0;
  let wheelLock = 0;
  let wheelTimer = 0;
  on(stage, "wheel", (e) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; // vertical: the page scrolls as usual
    e.preventDefault();
    e.stopPropagation();
    window.clearTimeout(wheelTimer);
    wheelTimer = window.setTimeout(() => { wheelAcc = 0; }, 160);
    const now = performance.now();
    if (now < wheelLock) return;
    wheelAcc += e.deltaX;
    if (Math.abs(wheelAcc) > 40) {
      const dir = Math.sign(wheelAcc);
      wheelAcc = 0;
      wheelLock = now + 380;
      go(active + dir);
    }
  }, { passive: false });

  // ---------- keys ----------
  let onScreen = true;
  const io = new IntersectionObserver((l) => { onScreen = l[l.length - 1].isIntersecting; }, { threshold: 0.3 });
  io.observe(stage);
  offs.push(() => io.disconnect());
  const scopes = [cv, ...(ctrl ? [ctrl] : []), ...(opts.keyScopes ?? [])];
  if (ctrl) {
    on(ctrl, "click", (e) => {
      const b = (e.target as Element).closest<HTMLButtonElement>(".cv-btn");
      if (b) go(active + Number(b.dataset.dir));
    });
  }
  on(window, "keydown", (e) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    const jump = e.key === "Home" ? 0 : e.key === "End" ? N - 1 : -1;
    if (!dir && jump < 0) return;
    const tg = (e.target as HTMLElement) ?? document.body;
    const inScope = scopes.some((s) => s.contains(tg));
    const pageLevel = !!opts.pageKeys && onScreen && (tg === document.body || tg === document.documentElement) && dir !== 0;
    if (!inScope && !pageLevel) return;
    if (jump >= 0 && !cv.contains(tg)) return; // Home / End only inside the stack itself
    const ni = jump >= 0 ? jump : clamp(active + dir, 0, N - 1);
    e.preventDefault();
    if (ni !== active) go(ni);
  });

  // ---------- hover tilt of the front cover ----------
  let qx: ((v: number) => void) | null = null;
  let qy: ((v: number) => void) | null = null;
  if (finePointer && !reducedMotion) {
    const tx = gsap.quickTo(state, "mx", { duration: 0.8, ease: "power3", onUpdate: request });
    const ty = gsap.quickTo(state, "my", { duration: 0.8, ease: "power3" });
    qx = tx; qy = ty;
    // quickTo tweens stay parked in the global timeline until killed
    offs.push(() => { tx.tween.kill(); ty.tween.kill(); });
    let r: DOMRect | null = null;
    on(stage, "pointerenter", () => { r = null; });
    on(stage, "pointermove", (e) => {
      if (drag?.moved || e.pointerType !== "mouse") return;
      const front = cards[active];
      if (!front) return;
      if (!r) r = front.getBoundingClientRect();
      tx(clamp(((e.clientX - (r.left + r.width / 2)) / r.width) * 2, -1, 1));
      ty(clamp(((e.clientY - (r.top + r.height / 2)) / r.height) * 2, -1, 1));
    });
    on(stage, "pointerleave", () => { r = null; tx(0); ty(0); });
    on(window, "scroll", () => { r = null; }, { passive: true });
  }

  // ---------- size ----------
  const ro = new ResizeObserver(() => { measure(); last.clear(); render(); });
  ro.observe(stage);
  offs.push(() => ro.disconnect());

  measure();
  setActive(0, true);
  render();
  cv.dataset.ready = "";
  return {
    go,
    next: () => go(active + 1),
    prev: () => go(active - 1),
    get index() { return active; },
    destroy() {
      dead = true;
      offs.forEach((f) => f());
      tween?.kill();
      cancelAnimationFrame(raf);
      window.clearTimeout(suppressTimer);
      window.clearTimeout(wheelTimer);
      last.clear();
    },
  };
}
