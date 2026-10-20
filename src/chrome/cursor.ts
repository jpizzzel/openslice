// Custom cursor: ink dot -> ring over links/buttons -> labelled pill over [data-cursor].
// Fine pointers only. One rAF loop, transform only, sleeps when settled.
import { finePointer, reducedMotion } from "../core/motion";

export function initCursor() {
  if (!finePointer) return;
  const el = document.createElement("div");
  el.className = "cursor";
  el.setAttribute("aria-hidden", "true");
  el.innerHTML = `<div class="cursor-b"><span class="cursor-l"></span></div>`;
  document.body.appendChild(el);
  document.documentElement.classList.add("has-cursor");
  const label = el.querySelector(".cursor-l") as HTMLElement;

  let mx = -100, my = -100, x = -100, y = -100, raf = 0, shown = false;
  let state = "";
  const k = reducedMotion ? 1 : 0.22;

  const loop = () => {
    x += (mx - x) * k;
    y += (my - y) * k;
    el.style.transform = `translate3d(${x}px,${y}px,0)`;
    raf = Math.abs(mx - x) + Math.abs(my - y) > 0.1 ? requestAnimationFrame(loop) : 0;
  };
  const wake = () => { if (!raf) raf = requestAnimationFrame(loop); };

  const setState = (s: string, text = "") => {
    if (s === state && label.textContent === text) return;
    state = s;
    el.dataset.state = s;
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

  addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    mx = e.clientX; my = e.clientY;
    if (!shown) { shown = true; x = mx; y = my; el.classList.add("is-on"); }
    wake();
  }, { passive: true });
  addEventListener("pointerover", (e) => read(e.target), { passive: true });
  addEventListener("pointerdown", () => el.classList.add("is-down"), { passive: true });
  addEventListener("pointerup", () => el.classList.remove("is-down"), { passive: true });
  document.documentElement.addEventListener("pointerleave", () => { shown = false; el.classList.remove("is-on"); });
  // content swaps under a still pointer (route change, menu): re-read what's below it
  const recheck = () => read(document.elementFromPoint(mx, my));
  return { recheck };
}
