// Page transition: the old page fades out, the new one fades in with a short rise.
// About 0.4s end to end. The router awaits leave() -> mount -> enter(), one
// navigation at a time, and queues any click that lands mid-way.
import { gsap, reducedMotion } from "./motion";

function announce() {
  const live = document.getElementById("route-announcer");
  if (!live) return;
  live.textContent = "";
  requestAnimationFrame(() => { live.textContent = document.title; });
}

export async function leave(view: HTMLElement): Promise<void> {
  gsap.killTweensOf(view);
  document.documentElement.classList.add("is-routing");
  await gsap.to(view, reducedMotion
    ? { autoAlpha: 0, duration: 0.12, ease: "none" }
    : { autoAlpha: 0, y: -8, duration: 0.16, ease: "power1.in" });
}

export async function enter(view: HTMLElement): Promise<void> {
  gsap.killTweensOf(view);
  if (reducedMotion) {
    gsap.set(view, { y: 0 });
    await gsap.to(view, { autoAlpha: 1, duration: 0.16, ease: "none" });
  } else {
    await gsap.fromTo(view, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.26, ease: "power2.out" });
  }
  // no lingering transform on #view: it would trap position: fixed descendants
  gsap.set(view, { clearProps: "transform,opacity,visibility" });
  document.documentElement.classList.remove("is-routing");
  view.focus({ preventScroll: true });
  announce();
}
