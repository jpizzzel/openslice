// Page transition. Replaced/enhanced by the chrome module; keep the API stable.
import { gsap, reducedMotion } from "./motion";

export async function leave(view: HTMLElement): Promise<void> {
  if (reducedMotion) return;
  await gsap.to(view, { autoAlpha: 0, y: -20, duration: 0.35, ease: "power2.in" });
}

export async function enter(view: HTMLElement): Promise<void> {
  if (reducedMotion) {
    gsap.set(view, { autoAlpha: 1, y: 0 });
    return;
  }
  await gsap.fromTo(view, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: "expo.out" });
}
