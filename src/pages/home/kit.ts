// Shared plumbing for the home page sections: one gsap ticker for every
// per-frame loop (floats, mouse parallax, marquee), each loop paused while its
// element is offscreen or the tab is hidden.
import { gsap } from "../../core/motion";

export type LoopFn = (time: number, dt: number) => void;

export interface Kit {
  root: HTMLElement;
  reduced: boolean;
  fine: boolean;
  /** run gsap code inside the page's gsap.context so ctx.revert() kills it */
  add: (fn: () => void) => void;
  /** register a cleanup for non-gsap things (listeners, observers) */
  onCleanup: (fn: () => void) => void;
  /** register a per-frame function that only runs while `el` is on screen */
  loop: (el: Element, fn: LoopFn) => void;
}

export function createLoop() {
  const entries: { fn: LoopFn; on: boolean }[] = [];
  const ios: IntersectionObserver[] = [];
  let running = false;

  const tick = (time: number, deltaMs: number) => {
    const dt = Math.min(deltaMs, 64) / 1000;
    for (const e of entries) if (e.on) e.fn(time, dt);
  };
  const sync = () => {
    const want = !document.hidden && entries.some((e) => e.on);
    if (want && !running) { gsap.ticker.add(tick); running = true; }
    else if (!want && running) { gsap.ticker.remove(tick); running = false; }
  };
  document.addEventListener("visibilitychange", sync);

  return {
    add(el: Element, fn: LoopFn) {
      const entry = { fn, on: false };
      entries.push(entry);
      const io = new IntersectionObserver(
        (list) => { entry.on = list[list.length - 1].isIntersecting; sync(); },
        { rootMargin: "120px 0px" },
      );
      io.observe(el);
      ios.push(io);
    },
    kill() {
      ios.forEach((io) => io.disconnect());
      entries.length = 0;
      document.removeEventListener("visibilitychange", sync);
      if (running) gsap.ticker.remove(tick);
      running = false;
    },
  };
}

export const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
