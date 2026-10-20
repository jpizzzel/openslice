// Custom cursor: ink dot -> ring over links/buttons -> labelled pill over [data-cursor].
// Fine pointers only. One rAF loop, transform only, sleeps when settled.
import { finePointer, reducedMotion } from "../core/motion";

export function initCursor() {
  if (!finePointer) return;
  // Two layers that travel together: the dot is difference-blended so it reads on
  // any ground; the labelled pill is a plain ink pill (a blended pill turns into
  // noise over color and illustration).
  const el = document.createElement("div");
  el.className = "cursor";
  el.setAttribute("aria-hidden", "true");
  el.innerHTML = `<div class="cursor-d"></div>`;
  const pel = document.createElement("div");
  pel.className = "cursor cursor--pill";
  pel.setAttribute("aria-hidden", "true");
  pel.innerHTML = `<div class="cursor-p"><span class="cursor-l"></span></div>`;
  document.body.append(el, pel);
  const both = [el, pel];
  const root = document.documentElement;
  const label = pel.querySelector(".cursor-l") as HTMLElement;
  const move = (t: string) => { el.style.transform = t; pel.style.transform = t; };

  let mx = -100, my = -100, x = -100, y = -100, raf = 0, shown = false;
  let state = "";
  const k = reducedMotion ? 1 : 0.22;

  const loop = () => {
    x += (mx - x) * k;
    y += (my - y) * k;
    move(`translate3d(${x}px,${y}px,0)`);
    raf = Math.abs(mx - x) + Math.abs(my - y) > 0.1 ? requestAnimationFrame(loop) : 0;
  };
  const wake = () => { if (!raf) raf = requestAnimationFrame(loop); };

  const setState = (s: string, text = "") => {
    if (s === state && label.textContent === text) return;
    state = s;
    both.forEach((n) => (n.dataset.state = s));
    if (text) label.textContent = text;
  };

  const read = (t: EventTarget | null) => {
    const n = t as Element | null;
    if (!n || !n.closest) return setState("");
    if (n.closest("input, textarea, select, [contenteditable]")) return setState("hide");
    const c = n.closest<HTMLElement>("[data-cursor]");
    if (c) return setState("pill", c.dataset.cursor || "View");
    if (n.closest("a[href], button, [role=button], label, summary")) return setState("ring");
    setState("");
  };

  // The native cursor is only hidden once the custom one is actually tracking a
  // mouse. Pen/touch on a "fine" device, or a failed loop, falls back to native.
  const on = (v: boolean) => both.forEach((n) => n.classList.toggle("is-on", v));
  const down = (v: boolean) => both.forEach((n) => n.classList.toggle("is-down", v));
  const release = () => { shown = false; on(false); root.classList.remove("has-cursor"); };
  addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") { if (shown) release(); return; }
    mx = e.clientX; my = e.clientY;
    if (!shown) {
      shown = true; x = mx; y = my;
      move(`translate3d(${x}px,${y}px,0)`);
      on(true);
      root.classList.add("has-cursor");
    }
    wake();
  }, { passive: true });
  addEventListener("pointerover", (e) => read(e.target), { passive: true });
  addEventListener("pointerdown", () => down(true), { passive: true });
  addEventListener("pointerup", () => down(false), { passive: true });
  root.addEventListener("pointerleave", () => { shown = false; on(false); });
  addEventListener("blur", () => down(false));
  // content swaps under a still pointer (route change, menu): re-read what's below it
  const recheck = () => read(document.elementFromPoint(mx, my));
  return { recheck };
}
