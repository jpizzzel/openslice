// Custom cursor: ink dot -> ring over links/buttons -> labelled pill over [data-cursor].
// Fine pointers only. One rAF loop, transform only, sleeps when settled.
import { finePointer, reducedMotion } from "../core/motion";

export function initCursor() {
  if (!finePointer) return;
  const el = document.createElement("div");
  el.className = "cursor";
  el.setAttribute("aria-hidden", "true");
  el.innerHTML = `<div class="cursor-d"></div><div class="cursor-p"><span class="cursor-l"></span></div>`;
  document.body.appendChild(el);
  const root = document.documentElement;
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

  // The native cursor is only hidden once the custom one is actually tracking a
  // mouse. Pen/touch on a "fine" device, or a failed loop, falls back to native.
  const release = () => { shown = false; el.classList.remove("is-on"); root.classList.remove("has-cursor"); };
  addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") { if (shown) release(); return; }
    mx = e.clientX; my = e.clientY;
    if (!shown) {
      shown = true; x = mx; y = my;
      el.style.transform = `translate3d(${x}px,${y}px,0)`;
      el.classList.add("is-on");
      root.classList.add("has-cursor");
    }
    wake();
  }, { passive: true });
  addEventListener("pointerover", (e) => read(e.target), { passive: true });
  addEventListener("pointerdown", () => el.classList.add("is-down"), { passive: true });
  addEventListener("pointerup", () => el.classList.remove("is-down"), { passive: true });
  root.addEventListener("pointerleave", () => { shown = false; el.classList.remove("is-on"); });
  addEventListener("blur", () => el.classList.remove("is-down"));
  // content swaps under a still pointer (route change, menu): re-read what's below it
  const recheck = () => read(document.elementFromPoint(mx, my));
  return { recheck };
}
