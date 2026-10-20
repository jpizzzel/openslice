// LAB: a calm grid of small interactive toys. Each toy lives in its own module
// under ./lab. A toy shows a still frame and only runs while someone is
// playing with it (hovered, focused, touched) or while it is expanded into the
// full size view.
import "../styles/pages/lab.css";
import type { Page } from "../core/page";
import { gsap, reducedMotion, lenis } from "../core/motion";
import { Flip } from "gsap/Flip";
import { EXPERIMENTS } from "./lab/registry";
import { Loop, makeSfx, type Experiment, type Toy, type ToyEnv } from "./lab/kit";
import { esc, footerHTML, reveal } from "./about/kit";

gsap.registerPlugin(Flip);

/** toys that span two columns of the grid */
const WIDE = new Set(["type"]);
/** how long a toy keeps running after the pointer leaves, so it can settle */
const SETTLE_MS = 1400;

interface Tile {
  exp: Experiment;
  el: HTMLElement;
  frame: HTMLElement;
  stage: HTMLElement;
  expand: HTMLButtonElement;
  toy: Toy | null;
  env: ToyEnv;
  visible: boolean;
  armed: boolean;
  running: boolean;
  rest: number;
}

function tileHTML(exp: Experiment) {
  return `
  <li class="lab-tile${WIDE.has(exp.id) ? " lab-tile--wide" : ""}" data-exp="${exp.id}">
    <div class="lab-tile__frame">
      <div class="lab-stage" role="group" tabindex="0" aria-label="${esc(exp.label)} Press Enter to play."></div>
    </div>
    <div class="lab-tile__cap">
      <h2 class="lab-tile__title" id="lab-t-${exp.id}">${esc(exp.title)}</h2>
      <button type="button" class="lab-tile__expand" aria-label="Expand ${esc(exp.title)}" aria-haspopup="dialog">Expand</button>
      <p class="lab-tile__line">${esc(exp.line)}</p>
    </div>
  </li>`;
}

const page: Page = {
  title: "Lab",
  section: "lab",
  mount({ root }) {
    root.innerHTML = `
    <div class="p-lab">
      <header class="lab-head" data-reveal>
        <h1 class="lab-h1">Lab</h1>
        <p class="lab-lede">Small interactive toys we made while building OpenSlice. Each one sits still until you hover over it or tap it.</p>
      </header>
      <ul class="lab-grid" data-reveal="list">${EXPERIMENTS.map(tileHTML).join("")}</ul>
      ${footerHTML()}
    </div>`;

    const pageEl = root.querySelector(".p-lab") as HTMLElement;
    const loop = new Loop();
    const sfx = makeSfx();
    const kills: (() => void)[] = [];
    const tweens: gsap.core.Animation[] = [];
    let expanded: Tile | null = null;
    let hovered: Tile | null = null;
    let focused: Tile | null = null;

    const tiles: Tile[] = [...pageEl.querySelectorAll<HTMLElement>(".lab-tile")].map((el, i) => {
      const exp = EXPERIMENTS[i];
      const t: Tile = {
        exp, el,
        frame: el.querySelector(".lab-tile__frame") as HTMLElement,
        stage: el.querySelector(".lab-stage") as HTMLElement,
        expand: el.querySelector(".lab-tile__expand") as HTMLButtonElement,
        toy: null, visible: false, armed: false, running: false, rest: 0,
        env: {
          key: exp.id, loop, reduced: reducedMotion, sfx,
          poke: () => { loop.focus = exp.id; },
        },
      };
      return t;
    });
    const byFrame = new Map(tiles.map((t) => [t.frame, t] as const));

    /* ----------------------------------------------- lifecycle per toy */
    const ensure = (t: Tile) => {
      if (!t.toy) t.toy = t.exp.create(t.stage, t.env);
      return t.toy;
    };
    const wanted = (t: Tile) =>
      expanded ? expanded === t : t.visible && (t === hovered || t === focused || t.armed);
    const halt = (t: Tile) => {
      window.clearTimeout(t.rest);
      t.rest = 0;
      t.toy?.stop();
      t.running = false;
    };
    const sync = (t: Tile) => {
      if (wanted(t)) {
        window.clearTimeout(t.rest);
        t.rest = 0;
        ensure(t).start();
        t.running = true;
        loop.focus = t.exp.id;
      } else if (t.running && !t.rest) {
        // let it settle (springs come to rest), then freeze on that frame
        if (!t.visible) halt(t);
        else t.rest = window.setTimeout(() => { t.rest = 0; if (!wanted(t)) halt(t); }, SETTLE_MS);
      }
    };

    // build each toy (its still frame) once it comes near the viewport
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const t = byFrame.get(e.target as HTMLElement);
        if (!t) continue;
        t.visible = e.isIntersecting;
        if (t.visible) ensure(t);
        else disarm(t);
        sync(t);
      }
    }, { rootMargin: "200px 0px" });
    tiles.forEach((t) => io.observe(t.frame));
    kills.push(() => io.disconnect());

    tiles.forEach((t) => {
      const enter = () => { hovered = t; sync(t); };
      const leave = () => { if (hovered === t) hovered = null; sync(t); };
      // keyboard focus plays the toy; a click focuses it too, but there the
      // pointer decides
      const fin = () => { if (t.stage.matches(":focus-visible")) { focused = t; sync(t); } };
      const fout = () => { if (focused === t) focused = null; sync(t); };
      t.frame.addEventListener("pointerenter", enter);
      t.frame.addEventListener("pointerleave", leave);
      t.stage.addEventListener("focusin", fin);
      t.stage.addEventListener("focusout", fout);
      kills.push(() => {
        t.frame.removeEventListener("pointerenter", enter);
        t.frame.removeEventListener("pointerleave", leave);
        t.stage.removeEventListener("focusin", fin);
        t.stage.removeEventListener("focusout", fout);
      });
    });

    /* touch: the first tap arms a toy (touch-action: none) so drags play
       instead of scrolling; tapping elsewhere or scrolling it away disarms. */
    function disarm(t: Tile) {
      if (!t.armed) return;
      t.armed = false;
      t.stage.classList.remove("is-armed");
      sync(t);
    }
    const onDocDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      const target = e.target as Node;
      for (const t of tiles) {
        const inside = t.stage.contains(target);
        if (inside && !t.armed) {
          t.armed = true;
          t.stage.classList.add("is-armed");
          sync(t);
        } else if (!inside && t !== expanded) disarm(t);
      }
    };
    document.addEventListener("pointerdown", onDocDown, true);
    kills.push(() => document.removeEventListener("pointerdown", onDocDown, true));

    /* ------------------------------------------------------------ modal */
    let modal: HTMLElement | null = null;
    let lastFocus: HTMLElement | null = null;
    const chrome = document.getElementById("chrome");

    const fit = (exp: Experiment) => {
      const vw = window.innerWidth, vh = window.innerHeight;
      const g = vw < 721 ? 16 : 40;
      const maxW = Math.min(vw - g * 2, 1400), maxH = vh - g * 2 - (vw < 721 ? 150 : 100);
      const ar = exp.ar[0] / exp.ar[1];
      let w = maxW, h = w / ar;
      if (h > maxH) { h = maxH; w = h * ar; }
      return { w: Math.round(w), h: Math.round(h) };
    };
    const size = (m: HTMLElement, exp: Experiment) => {
      const s = fit(exp);
      const frame = m.querySelector(".p-lab-modal__frame") as HTMLElement;
      frame.style.width = `${s.w}px`;
      frame.style.height = `${s.h}px`;
      // the caption wraps to the frame width instead of widening the box
      (m.querySelector(".p-lab-modal__box") as HTMLElement).style.width = `${s.w}px`;
    };

    const openModal = (t: Tile) => {
      if (expanded || modal) return;
      expanded = t;
      lastFocus = t.expand;
      ensure(t);
      modal = document.createElement("div");
      modal.className = "p-lab-modal";
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.setAttribute("aria-labelledby", "lab-modal-title");
      modal.innerHTML = `
        <div class="p-lab-modal__bg" data-close></div>
        <div class="p-lab-modal__box">
          <div class="p-lab-modal__frame"></div>
          <div class="p-lab-modal__bar">
            <div>
              <h2 id="lab-modal-title">${esc(t.exp.title)}</h2>
              <p>${esc(t.exp.line)}</p>
            </div>
            <button type="button" class="p-lab-modal__close">Close</button>
          </div>
        </div>`;
      document.body.appendChild(modal);
      size(modal, t.exp);
      const frame = modal.querySelector(".p-lab-modal__frame") as HTMLElement;

      loop.solo = t.exp.id;
      tiles.forEach(sync);
      root.inert = true;
      chrome?.setAttribute("inert", "");
      lenis?.stop();
      document.documentElement.classList.add("lab-lock");
      t.el.classList.add("is-out");
      t.stage.classList.add("is-armed");

      const bg = modal.querySelector(".p-lab-modal__bg")!;
      const bar = modal.querySelector(".p-lab-modal__bar")!;
      if (reducedMotion) {
        frame.appendChild(t.stage);
      } else {
        const state = Flip.getState(t.stage);
        frame.appendChild(t.stage);
        tweens.push(Flip.from(state, { duration: 0.6, ease: "power3.inOut", scale: true }));
        tweens.push(gsap.fromTo(bg, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power2.out" }));
        tweens.push(gsap.fromTo(bar, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, delay: 0.35, ease: "power2.out" }));
      }
      (modal.querySelector(".p-lab-modal__close") as HTMLElement).focus({ preventScroll: true });
    };

    const closeModal = () => {
      const t = expanded;
      const m = modal;
      if (!t || !m) return;
      modal = null;
      const finish = () => {
        t.frame.appendChild(t.stage);
        gsap.set(t.stage, { clearProps: "all" });
        m.remove();
        t.el.classList.remove("is-out");
        t.stage.classList.toggle("is-armed", t.armed);
        expanded = null;
        loop.solo = "";
        tiles.forEach(sync);
      };
      root.inert = false;
      chrome?.removeAttribute("inert");
      lenis?.start();
      document.documentElement.classList.remove("lab-lock");
      lastFocus?.focus({ preventScroll: true });
      if (reducedMotion) { finish(); return; }
      const bg = m.querySelector(".p-lab-modal__bg")!;
      const bar = m.querySelector(".p-lab-modal__bar")!;
      tweens.push(gsap.to(bar, { opacity: 0, duration: 0.2, ease: "power2.in" }));
      tweens.push(gsap.to(bg, { opacity: 0, duration: 0.5, ease: "power2.inOut" }));
      tweens.push(Flip.fit(t.stage, t.frame, { scale: true, duration: 0.55, ease: "power3.inOut", onComplete: finish }) as gsap.core.Tween);
    };

    const onModalClick = (e: MouseEvent) => {
      if (!modal) return;
      const el = e.target as Element;
      if (el.closest("[data-close]") || el.closest(".p-lab-modal__close")) closeModal();
    };
    const onKey = (e: KeyboardEvent) => {
      if (!modal) return;
      if (e.key === "Escape") { e.preventDefault(); closeModal(); return; }
      if (e.key === "Tab") {
        const f = [...modal.querySelectorAll<HTMLElement>("button, [href], [tabindex]:not([tabindex='-1'])")].filter((x) => !x.hasAttribute("disabled"));
        if (!f.length) return;
        const a = f[0], z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    };
    const onResize = () => { if (modal && expanded) size(modal, expanded.exp); };
    document.addEventListener("click", onModalClick);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    kills.push(() => {
      document.removeEventListener("click", onModalClick);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    });

    tiles.forEach((t) => {
      // keyboard play: Enter / Space on a focused stage runs the toy's default action
      const key = (e: KeyboardEvent) => {
        if (e.target !== t.stage || (e.key !== "Enter" && e.key !== " ")) return;
        e.preventDefault();
        focused = t;
        const toy = ensure(t);
        toy.start();
        t.running = true;
        toy.act?.();
      };
      const open = () => openModal(t);
      t.stage.addEventListener("keydown", key);
      t.expand.addEventListener("click", open);
      t.frame.addEventListener("dblclick", open);
      kills.push(() => {
        t.stage.removeEventListener("keydown", key);
        t.expand.removeEventListener("click", open);
        t.frame.removeEventListener("dblclick", open);
      });
    });

    kills.push(reveal(pageEl));

    return () => {
      if (modal) {
        modal.remove();
        modal = null;
        root.inert = false;
        chrome?.removeAttribute("inert");
        lenis?.start();
        document.documentElement.classList.remove("lab-lock");
      }
      tweens.forEach((t) => t.kill());
      // a dialog caught mid-close: its finish() never runs once the tweens are killed
      document.querySelectorAll(".p-lab-modal").forEach((m) => m.remove());
      kills.forEach((k) => k());
      tiles.forEach((t) => { window.clearTimeout(t.rest); t.toy?.destroy(); });
      loop.destroy();
    };
  },
};

export default page;
