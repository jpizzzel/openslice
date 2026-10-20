// Page transition: an ink sheet chased by a tomato sheet sweeps up over the page
// carrying a spinning slice and the destination name, then both peel off upward.
// The router awaits leave() -> mount -> enter(), one navigation at a time.
import { gsap, reducedMotion } from "./motion";
import { bus } from "./bus";
import { glyph } from "../art";
import { sectionFor } from "../chrome/sections";
import { isSaturday } from "../chrome/countdown";

let panel: HTMLElement | null = null;
let dest = "";
let spin: gsap.core.Tween | null = null;

bus.on("route:before", ({ to }) => { dest = sectionFor(to); });

function ensure() {
  if (panel) return panel;
  panel = document.createElement("div");
  panel.className = "pt";
  panel.setAttribute("aria-hidden", "true");
  panel.innerHTML = `
    <div class="pt-ink"></div>
    <div class="pt-red">
      <div class="pt-meta"><span>OpenSlice&copy;</span><span>Out of our kitchen</span></div>
      <div class="pt-in">
        <span class="pt-k">Now serving</span>
        <div class="pt-slice">${glyph("slice")}</div>
        <div class="pt-mask"><span class="pt-t"></span></div>
      </div>
    </div>`;
  document.body.appendChild(panel);
  gsap.set([panel.firstElementChild, panel.lastElementChild], { yPercent: 100 });
  return panel;
}

function announce() {
  const live = document.getElementById("route-announcer");
  if (!live) return;
  live.textContent = "";
  requestAnimationFrame(() => { live.textContent = document.title; });
}

export async function leave(view: HTMLElement): Promise<void> {
  if (reducedMotion) {
    await gsap.to(view, { autoAlpha: 0, duration: 0.15 });
    return;
  }
  const p = ensure();
  const ink = p.firstElementChild!, red = p.lastElementChild!;
  const t = p.querySelector(".pt-t")!, slice = p.querySelector(".pt-slice")!, k = p.querySelector(".pt-k")!;
  t.textContent = dest || "OpenSlice";
  k.textContent = isSaturday() ? "Fresh out the oven" : "Now serving";
  gsap.killTweensOf([ink, red, t, slice, k, view]);
  spin?.kill();
  p.classList.add("is-on");
  bus.emit("sfx", { name: "whoosh" });
  spin = gsap.fromTo(slice, { rotate: -90 }, { rotate: 270, duration: 1.4, ease: "none", repeat: -1 });
  gsap.set([ink, red], { yPercent: 100 });
  gsap.set(t, { yPercent: 110 });
  gsap.set([k, slice], { autoAlpha: 0, scale: 0.6 });
  // label + slice animate on their own clock; the router only waits for the cover
  gsap.to(t, { yPercent: 0, duration: 0.45, ease: "expo.out", delay: 0.13 });
  gsap.to([k, slice], { autoAlpha: 1, scale: 1, duration: 0.4, ease: "back.out(2)", delay: 0.12 });
  await gsap.timeline()
    .to(view, { y: -80, duration: 0.36, ease: "power3.in" }, 0)
    .to(ink, { yPercent: 0, duration: 0.34, ease: "expo.inOut" }, 0)
    .to(red, { yPercent: 0, duration: 0.34, ease: "expo.inOut" }, 0.04)
    // hold a beat so the destination name lands before the page swaps
    .to({}, { duration: 0.06 });
  gsap.set(view, { autoAlpha: 0 });
}

export async function enter(view: HTMLElement): Promise<void> {
  if (reducedMotion) {
    gsap.set(view, { y: 0 });
    await gsap.to(view, { autoAlpha: 1, duration: 0.2 });
  } else {
    const p = ensure();
    const ink = p.firstElementChild!, red = p.lastElementChild!;
    const inner = p.querySelector(".pt-in")!;
    gsap.set(view, { autoAlpha: 1, y: 120 });
    gsap.to(view, { y: 0, duration: 0.7, ease: "expo.out", delay: 0.12, clearProps: "transform" });
    await gsap.timeline()
      .to(inner, { yPercent: -30, autoAlpha: 0, duration: 0.3, ease: "power3.in" }, 0.04)
      .to(red, { yPercent: -100, duration: 0.4, ease: "expo.inOut" }, 0.06)
      .to(ink, { yPercent: -100, duration: 0.4, ease: "expo.inOut" }, 0.11);
    p.classList.remove("is-on");
    spin?.kill(); spin = null;
    gsap.set(inner, { yPercent: 0, autoAlpha: 1 });
    gsap.set(view, { clearProps: "opacity,visibility" });
  }
  if (reducedMotion) gsap.set(view, { clearProps: "transform,opacity,visibility" });
  view.focus({ preventScroll: true });
  announce();
}
