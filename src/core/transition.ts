// Page transition: an ink sheet chased by a tomato sheet sweeps up over the page,
// and a pizza peel slides in from the left carrying the destination, written in
// that page's own voice. Then both sheets peel off upward.
// The router awaits leave() -> mount -> enter(), one navigation at a time.
import { gsap, reducedMotion } from "./motion";
import { bus } from "./bus";
import { transitionLine } from "../chrome/sections";
import { isSaturday } from "../chrome/countdown";

let panel: HTMLElement | null = null;
let dest = "";
let order = 0;

bus.on("route:before", ({ to }) => { dest = transitionLine(to); });

function ensure() {
  if (panel) return panel;
  panel = document.createElement("div");
  panel.className = "pt";
  panel.setAttribute("aria-hidden", "true");
  panel.innerHTML = `
    <div class="pt-ink"></div>
    <div class="pt-red">
      <div class="pt-meta"><span>OpenSlice&copy;</span><span class="pt-k"></span><span>Out of our kitchen</span></div>
      <div class="pt-in">
        <div class="pt-load">
          <span class="pt-handle"><i></i></span>
          <svg class="pt-neck" viewBox="0 0 40 100" preserveAspectRatio="none"><path d="M-2 39 C14 39 22 6 41 4 L41 96 C22 94 14 61 -2 61Z"/></svg>
          <div class="pt-blade"><div class="pt-mask"><span class="pt-t"></span></div></div>
        </div>
      </div>
    </div>`;
  document.body.appendChild(panel);
  gsap.set([panel.firstElementChild, panel.lastElementChild], { yPercent: 100 });
  return panel;
}

/** Long lines break once, at the space nearest the middle, so the blade hugs the type. */
function setLabel(el: HTMLElement, text: string) {
  const limit = innerWidth <= 720 ? 9 : 13;
  const words = text.split(" ");
  if (text.length <= limit || words.length < 2) { el.textContent = text; return; }
  let best = 1, bestD = Infinity;
  for (let i = 1; i < words.length; i++) {
    const d = Math.abs(words.slice(0, i).join(" ").length - words.slice(i).join(" ").length);
    if (d < bestD) { bestD = d; best = i; }
  }
  el.replaceChildren(words.slice(0, best).join(" "), document.createElement("br"), words.slice(best).join(" "));
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
  const t = p.querySelector<HTMLElement>(".pt-t")!, load = p.querySelector<HTMLElement>(".pt-load")!;
  const k = p.querySelector<HTMLElement>(".pt-k")!;
  setLabel(t, dest || "OpenSlice");
  order = (order % 999) + 1;
  k.textContent = isSaturday() ? "Fresh out the oven" : `Order no. ${String(order).padStart(3, "0")}`;
  gsap.killTweensOf([ink, red, t, load, view]);
  p.classList.add("is-on");
  bus.emit("sfx", { name: "whoosh" });
  gsap.set([ink, red], { yPercent: 100 });
  // the peel shoves the order in from off screen left, overshoots a hair, settles
  gsap.set(load, { x: -innerWidth * 1.15, rotate: -3, y: 0 });
  gsap.timeline()
    .to(load, { x: 0, rotate: 0, duration: 0.5, ease: "expo.out" }, 0.05)
    .to(load, { y: 4, duration: 0.1, ease: "power2.out" }, 0.26)
    .to(load, { y: 0, duration: 0.4, ease: "elastic.out(1, 0.5)" }, 0.36);
  await gsap.timeline()
    .to(view, { y: -80, duration: 0.36, ease: "power3.in" }, 0)
    .to(ink, { yPercent: 0, duration: 0.34, ease: "expo.inOut" }, 0)
    .to(red, { yPercent: 0, duration: 0.34, ease: "expo.inOut" }, 0.04)
    // hold a beat so the destination lands before the page swaps
    .to({}, { duration: 0.1 });
  gsap.set(view, { autoAlpha: 0 });
}

export async function enter(view: HTMLElement): Promise<void> {
  if (reducedMotion) {
    gsap.set(view, { y: 0 });
    await gsap.to(view, { autoAlpha: 1, duration: 0.2 });
  } else {
    const p = ensure();
    const ink = p.firstElementChild!, red = p.lastElementChild!;
    const inner = p.querySelector(".pt-in")!, load = p.querySelector(".pt-load")!;
    gsap.set(view, { autoAlpha: 1, y: 120 });
    gsap.to(view, { y: 0, duration: 0.7, ease: "expo.out", delay: 0.12, clearProps: "transform" });
    await gsap.timeline()
      // the peel yanks back out, the way you pull one from under a pie
      .to(load, { x: -innerWidth * 0.18, duration: 0.28, ease: "power3.in" }, 0)
      .to(inner, { yPercent: -30, autoAlpha: 0, duration: 0.3, ease: "power3.in" }, 0.04)
      .to(red, { yPercent: -100, duration: 0.36, ease: "expo.inOut" }, 0.05)
      .to(ink, { yPercent: -100, duration: 0.36, ease: "expo.inOut" }, 0.09);
    p.classList.remove("is-on");
    gsap.set(inner, { yPercent: 0, autoAlpha: 1 });
    gsap.set(view, { clearProps: "opacity,visibility" });
  }
  if (reducedMotion) gsap.set(view, { clearProps: "transform,opacity,visibility" });
  view.focus({ preventScroll: true });
  announce();
}
