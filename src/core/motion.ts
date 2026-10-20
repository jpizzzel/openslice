import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

export const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

export let lenis: Lenis | null = null;

export function initScroll() {
  if (reducedMotion) return;
  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis?.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

export function scrollTop() {
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
  else window.scrollTo(0, 0);
}

export { gsap, ScrollTrigger };
