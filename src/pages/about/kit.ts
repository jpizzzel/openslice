// Small helpers shared by the lab, about, trunk and 404 pages.
import { gsap, ScrollTrigger, reducedMotion } from "../../core/motion";
import { esc } from "../../art/core";
import { renderFooter } from "../../chrome/footer";

export { esc };
/** the shared site footer (rendered by the chrome) */
export const footerHTML = renderFooter;

/**
 * One quiet entrance per section: every `[data-reveal]` element fades in and
 * rises 20px once, when it scrolls into view. `[data-reveal="list"]` staggers
 * its direct children lightly instead. Nothing idles. Returns a cleanup that
 * kills the tweens and triggers and restores the inline styles.
 */
export function reveal(scope: HTMLElement): () => void {
  if (reducedMotion) return () => {};
  const ctx = gsap.context(() => {
    scope.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
      const targets = el.dataset.reveal === "list" ? [...el.children] : [el];
      gsap.set(targets, { autoAlpha: 0, y: 20 });
      ScrollTrigger.create({
        trigger: el,
        start: "top 90%",
        once: true,
        onEnter: () =>
          gsap.to(targets, {
            autoAlpha: 1,
            y: 0,
            duration: 0.6,
            ease: "power2.out",
            stagger: 0.06,
            clearProps: "transform,opacity,visibility",
          }),
      });
    });
  }, scope);
  return () => ctx.revert();
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
