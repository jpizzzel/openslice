// Small helpers shared by the about, trunk and 404 pages.
import { gsap, ScrollTrigger, reducedMotion } from "../../core/motion";
import { loaderGone } from "../../core/ready";

// The footer is owned by the chrome team. Glob it so this module builds
// whether or not src/chrome/footer.ts exists yet.
const footerMods = import.meta.glob<{ renderFooter?: () => string }>("../../chrome/footer.ts", { eager: true });

export function footerHTML(): string {
  const fn = Object.values(footerMods)[0]?.renderFooter;
  return typeof fn === "function" ? fn() : "<!-- footer -->";
}

/** Run `fn` once the preloader is gone (first paint) or right away. Never blocks mount. */
export function whenReady(first: boolean, alive: () => boolean, fn: () => void) {
  if (first) loaderGone.then(() => alive() && fn());
  else fn();
}

export const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Split text into masked words for line reveals. Returns HTML. */
export function words(text: string, cls = "") {
  return text
    .split(" ")
    .map((w) => `<span class="kw-mask"><span class="kw${cls ? " " + cls : ""}">${w}</span></span>`)
    .join(" ");
}

/**
 * Make an element draggable a little, with rubber band resistance, and spring
 * back to rest on release. Pointer events only, transform only.
 */
export function springDrag(el: HTMLElement, onGrab?: () => void): () => void {
  if (reducedMotion) return () => {};
  let sx = 0, sy = 0, id = -1;
  const qx = gsap.quickTo(el, "x", { duration: 0.35, ease: "power3.out" });
  const qy = gsap.quickTo(el, "y", { duration: 0.35, ease: "power3.out" });
  const band = (d: number) => Math.sign(d) * Math.min(Math.abs(d) * 0.45, 40 + Math.sqrt(Math.abs(d)) * 6);
  const down = (e: PointerEvent) => {
    if ((e.target as Element).closest("a,button")) return;
    id = e.pointerId; sx = e.clientX; sy = e.clientY;
    el.setPointerCapture(id);
    el.classList.add("is-grabbed");
    gsap.killTweensOf(el, "rotation,scale");
    gsap.to(el, { scale: 1.03, duration: 0.3, ease: "power3.out" });
    onGrab?.();
  };
  const move = (e: PointerEvent) => {
    if (e.pointerId !== id) return;
    qx(band(e.clientX - sx));
    qy(band(e.clientY - sy));
  };
  const up = (e: PointerEvent) => {
    if (e.pointerId !== id) return;
    id = -1;
    el.classList.remove("is-grabbed");
    gsap.to(el, { x: 0, y: 0, scale: 1, duration: 1.3, ease: "elastic.out(1, 0.35)", overwrite: true });
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
    // quickTo tweens are paused and live in the global timeline forever:
    // kill them or they retain the whole detached page.
    qx.tween.kill(); qy.tween.kill();
    gsap.killTweensOf(el);
  };
}

/**
 * Like gsap.matchMedia() with one query and an else branch, but it removes its
 * MediaQueryList listener on cleanup (gsap.matchMedia never does, which leaks
 * a listener per page visit). Each branch runs inside its own gsap.context
 * scoped to `scope`, reverted when the query flips or on cleanup.
 */
export function responsive(scope: Element, query: string, match: () => void, otherwise: () => void): () => void {
  const mq = window.matchMedia(query);
  let ctx: gsap.Context | null = null;
  const run = () => {
    ctx?.revert();
    ctx = gsap.context(mq.matches ? match : otherwise, scope);
  };
  const flip = () => { run(); ScrollTrigger.refresh(); };
  run();
  mq.addEventListener("change", flip);
  return () => {
    mq.removeEventListener("change", flip);
    ctx?.revert();
    ctx = null;
  };
}
