// Shared helpers for the home page, the toolbox index and the tool pages.
import { gsap, ScrollTrigger, reducedMotion } from "../../core/motion";
import { loaderGone } from "../../core/ready";
import { PEOPLE, STATUS_LABEL, type Person, type Tool } from "../../data/site";
import { esc } from "../../art/core";
import { renderFooter } from "../../chrome/footer";

export { esc };
/** the shared site footer (rendered by the chrome) */
export const footerHTML = renderFooter;

export const makers = (t: Tool): Person[] =>
  t.by.map((id) => PEOPLE.find((p) => p.id === id)).filter((p): p is Person => !!p);

export const isClassified = (t: Tool) => t.status === "prepping";

/** "Replaces" as plain text. */
export const replacesText = (t: Tool) => t.replaces ?? (isClassified(t) ? "Not announced" : "Nothing, it's our own");

export const statusText = (t: Tool) => STATUS_LABEL[t.status];

export const arrowSVG = (dir: "up" | "down" | "left" | "right" | "ne") => {
  const rot = { up: 0, right: 90, down: 180, left: 270, ne: 45 }[dir];
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" style="transform:rotate(${rot}deg)"><path d="M12 20V4M5 11l7-7 7 7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square"/></svg>`;
};

/**
 * Entrance motion, the only kind these pages use: a short fade and a small rise.
 * `now` plays as the page appears; `later` plays once as each enters the viewport.
 * Everything is recorded in `ctx`, so reverting it kills and resets it all.
 */
export function rise(ctx: gsap.Context, now: Element[], later: Element[], first: boolean, alive: () => boolean) {
  if (reducedMotion) return;
  const from = { autoAlpha: 0, y: 20 };
  ctx.add(() => gsap.set(now, from));
  const go = () => {
    if (!alive()) return;
    ctx.add(() => gsap.to(now, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out", stagger: 0.06, clearProps: "opacity,visibility,transform" }));
  };
  // on a first load the intro loader (if any) may still be on screen; never wait on it for long
  if (first) Promise.race([loaderGone, new Promise((r) => setTimeout(r, 1200))]).then(go);
  else go();
  ctx.add(() => later.forEach((n) => {
    gsap.from(n, {
      ...from, duration: 0.6, ease: "power2.out", clearProps: "opacity,visibility,transform",
      scrollTrigger: { trigger: n, start: "top 88%", once: true },
    });
  }));
  // fonts can shift layout after the triggers measured
  document.fonts?.ready.then(() => { if (alive()) ScrollTrigger.refresh(); });
}
