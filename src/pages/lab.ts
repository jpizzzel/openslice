// LAB: "where slices get weird". A sticky mega count on the left and a
// masonry of small interactive toys on the right. Each toy lives in its own
// module under ./lab, starts only while its tile is on screen, and can be
// expanded into a large modal view with a Flip animation.
import "../styles/pages/lab.css";
import type { Page } from "../core/page";
import { gsap, ScrollTrigger, reducedMotion, finePointer, lenis } from "../core/motion";
import { Flip } from "gsap/Flip";
import { loaderGone } from "../core/ready";
import { renderFooter } from "../chrome/footer";
import { EXPERIMENTS } from "./lab/registry";
import { Loop, makeSfx, type Experiment, type Toy, type ToyEnv } from "./lab/kit";

gsap.registerPlugin(Flip);

const pad = (n: number) => String(n).padStart(2, "0");
const ICON_EXPAND = `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M9 2h5v5M14 2 8.5 7.5M7 14H2V9M2 14l5.5-5.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_CLOSE = `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3 3 13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;

interface Tile {
  i: number;
  exp: Experiment;
  el: HTMLElement;
  frame: HTMLElement;
  stage: HTMLElement;
  hint: HTMLElement;
  expand: HTMLButtonElement;
  toy: Toy | null;
  env: ToyEnv;
  visible: boolean;
}

function tileHTML(exp: Experiment, i: number) {
  const n = pad(i + 1);
  return `
  <article class="lab-tile" data-exp="${exp.id}" style="--ar:${exp.ar[0]} / ${exp.ar[1]}" aria-labelledby="lab-t-${exp.id}">
    <div class="lab-tile__frame">
      <div class="lab-stage lab-tone--${exp.tone}" role="group" aria-label="${exp.label}">
        <span class="lab-tile__num mono" aria-hidden="true">${n}</span>
        <span class="lab-chip lab-tile__hint" aria-hidden="true">${finePointer ? exp.hint : "Tap to play"}</span>
      </div>
    </div>
    <div class="lab-tile__cap">
      <span class="mono lab-tile__exp">Exp. ${n}</span>
      <h2 class="lab-tile__title" id="lab-t-${exp.id}">${exp.title}</h2>
      <button type="button" class="lab-tile__expand" data-cursor="Expand" aria-label="Expand ${exp.title}" aria-haspopup="dialog">
        <span>Expand</span>${ICON_EXPAND}
      </button>
      <p class="lab-tile__line">${exp.line}</p>
    </div>
  </article>`;
}

const page: Page = {
  title: "Lab",
  section: "lab",
  mount({ root, first }) {
    const total = EXPERIMENTS.length;
    root.innerHTML = `
    <div class="p-lab">
      <div class="p-lab__inner">
        <aside class="p-lab__side" aria-label="About the lab">
          <div class="p-lab__sticky">
            <div class="p-lab__countwrap">
              <p class="p-lab__count mega" aria-label="${total} experiments"><span data-count aria-hidden="true">${pad(reducedMotion ? total : 0)}</span></p>
              <p class="p-lab__countlab"><span class="label">Experiments</span><span>in the oven</span></p>
            </div>
            <nav class="p-lab__index" aria-label="Experiments">
              <p class="label">Now playing</p>
              <ol>${EXPERIMENTS.map((e, i) => `
                <li><button type="button" data-goto="${i}"><span class="mono">${pad(i + 1)}</span><span>${e.title}</span></button></li>`).join("")}
              </ol>
            </nav>
            <p class="p-lab__about">A space where we try ideas without overthinking them. Some turn into real tools, others just stay here as part of the process.</p>
          </div>
        </aside>
        <section class="p-lab__main">
          <header class="p-lab__head">
            <h1 class="p-lab__title">
              <span class="p-lab__mask"><span class="caps-red">The Lab</span></span>
              <span class="p-lab__mask"><em class="serif">where slices get weird.</em></span>
            </h1>
            <dl class="p-lab__meta">
              <div><dt class="label">Experiments</dt><dd>${pad(total)} toys, all live</dd></div>
              <div><dt class="label">Status</dt><dd>Always unfinished</dd></div>
              <div><dt class="label">House rule</dt><dd>Touch everything</dd></div>
              <div><dt class="label">Best with</dt><dd>Sound on, slightly hungry</dd></div>
            </dl>
          </header>
          <div class="p-lab__grid" data-grid></div>
        </section>
      </div>
      ${renderFooter()}
    </div>`;

    const pageEl = root.querySelector(".p-lab") as HTMLElement;
    const grid = pageEl.querySelector("[data-grid]") as HTMLElement;
    const countEl = pageEl.querySelector("[data-count]") as HTMLElement;
    const indexBtns = [...pageEl.querySelectorAll<HTMLButtonElement>("[data-goto]")];
    const loop = new Loop();
    const sfx = makeSfx();
    const kills: (() => void)[] = [];
    const tweens: gsap.core.Animation[] = [];
    let expanded: Tile | null = null;

    /* ------------------------------------------------------------ tiles */
    const holder = document.createElement("div");
    holder.innerHTML = EXPERIMENTS.map(tileHTML).join("");
    const tiles: Tile[] = [...holder.children].map((el, i) => {
      const exp = EXPERIMENTS[i];
      const t: Tile = {
        i, exp, el: el as HTMLElement,
        frame: el.querySelector(".lab-tile__frame") as HTMLElement,
        stage: el.querySelector(".lab-stage") as HTMLElement,
        hint: el.querySelector(".lab-tile__hint") as HTMLElement,
        expand: el.querySelector(".lab-tile__expand") as HTMLButtonElement,
        toy: null, visible: false,
        env: {
          key: exp.id, loop, reduced: reducedMotion, sfx,
          poke: () => {
            t.el.classList.add("is-used");
            loop.focus = exp.id;
            setNow(t.i);
          },
        },
      };
      return t;
    });
    const byFrame = new Map(tiles.map((t) => [t.frame, t] as const));

    /* masonry: shortest column first, re-flowed on breakpoint change */
    let cols = 0;
    const mqs = [window.matchMedia("(min-width: 1100px)"), window.matchMedia("(min-width: 721px)")];
    const flow = () => {
      const n = mqs[0].matches ? 3 : mqs[1].matches ? 2 : 1;
      if (n === cols) return;
      cols = n;
      const colEls = Array.from({ length: n }, () => {
        const c = document.createElement("div");
        c.className = "p-lab__col";
        return c;
      });
      const hts = new Array(n).fill(0);
      tiles.forEach((t, i) => {
        // keep the first row in order, then fill the shortest column
        let k = i < n ? i : hts.indexOf(Math.min(...hts));
        if (n === 1) k = 0;
        colEls[k].appendChild(t.el);
        hts[k] += t.exp.ar[1] / t.exp.ar[0] + 0.32;
      });
      grid.replaceChildren(...colEls);
      ScrollTrigger.refresh();
    };
    flow();
    mqs.forEach((m) => m.addEventListener("change", flow));
    kills.push(() => mqs.forEach((m) => m.removeEventListener("change", flow)));

    /* ----------------------------------------------- lifecycle per toy */
    const ensure = (t: Tile) => {
      if (!t.toy) t.toy = t.exp.create(t.stage, t.env);
      return t.toy;
    };
    const sync = (t: Tile) => {
      const run = expanded ? expanded === t : t.visible;
      if (run) ensure(t).start();
      else t.toy?.stop();
    };
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const t = byFrame.get(e.target as HTMLElement);
        if (!t) continue;
        t.visible = e.isIntersecting;
        if (!t.visible) disarm(t);
        sync(t);
      }
    }, { rootMargin: "80px 0px" });
    tiles.forEach((t) => io.observe(t.frame));
    kills.push(() => io.disconnect());

    // "now playing": whichever tile crosses the middle of the viewport
    let nowI = -1;
    function setNow(i: number) {
      if (i === nowI) return;
      nowI = i;
      indexBtns.forEach((b, k) => b.classList.toggle("is-now", k === i));
    }
    const mid = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const t = byFrame.get(e.target as HTMLElement);
        if (!t) continue;
        setNow(t.i);
        if (!hovered) loop.focus = t.exp.id;
      }
    }, { rootMargin: "-45% 0px -45% 0px" });
    tiles.forEach((t) => mid.observe(t.frame));
    kills.push(() => mid.disconnect());

    let hovered = "";
    tiles.forEach((t) => {
      const enter = () => { hovered = t.exp.id; loop.focus = t.exp.id; };
      const leave = () => { if (hovered === t.exp.id) hovered = ""; };
      t.frame.addEventListener("pointerenter", enter);
      t.frame.addEventListener("pointerleave", leave);
      kills.push(() => { t.frame.removeEventListener("pointerenter", enter); t.frame.removeEventListener("pointerleave", leave); });
    });

    /* touch: the first tap arms a toy (touch-action: none) so drags play
       instead of scrolling; tapping elsewhere or scrolling it away disarms. */
    function disarm(t: Tile) { t.stage.classList.remove("is-armed"); t.el.classList.remove("is-armed"); }
    const onDocDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      const target = e.target as Node;
      for (const t of tiles) {
        const inside = t.stage.contains(target);
        if (inside && !t.stage.classList.contains("is-armed")) {
          t.stage.classList.add("is-armed"); t.el.classList.add("is-armed");
          loop.focus = t.exp.id;
        } else if (!inside && t !== expanded) disarm(t);
      }
    };
    document.addEventListener("pointerdown", onDocDown, true);
    kills.push(() => document.removeEventListener("pointerdown", onDocDown, true));

    // index buttons scroll to their tile
    indexBtns.forEach((b) => {
      const go = () => {
        const t = tiles[Number(b.dataset.goto)];
        const y = t.el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.18;
        if (lenis) lenis.scrollTo(y, { duration: 1.2 });
        else window.scrollTo({ top: y, behavior: reducedMotion ? "auto" : "smooth" });
        sfx("click");
      };
      b.addEventListener("click", go);
      kills.push(() => b.removeEventListener("click", go));
    });

    /* ------------------------------------------------------------ modal */
    let modal: HTMLElement | null = null;
    let lastFocus: HTMLElement | null = null;
    const chrome = document.getElementById("chrome");

    const fit = (exp: Experiment) => {
      const vw = window.innerWidth, vh = window.innerHeight;
      const g = vw < 721 ? 16 : 40;
      const maxW = Math.min(vw - g * 2, 1500), maxH = vh - g * 2 - (vw < 721 ? 132 : 92);
      const ar = exp.ar[0] / exp.ar[1];
      let w = maxW, h = w / ar;
      if (h > maxH) { h = maxH; w = h * ar; }
      return { w: Math.round(w), h: Math.round(h) };
    };

    const openModal = (t: Tile) => {
      if (expanded || modal) return;
      expanded = t;
      lastFocus = t.expand;
      ensure(t);
      const n = pad(t.i + 1);
      modal = document.createElement("div");
      modal.className = `p-lab-modal lab-tone-host--${t.exp.tone}`;
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.setAttribute("aria-labelledby", "lab-modal-title");
      modal.innerHTML = `
        <div class="p-lab-modal__bg" data-close></div>
        <div class="p-lab-modal__box">
          <div class="p-lab-modal__frame"></div>
          <div class="p-lab-modal__bar">
            <span class="mono">Exp. ${n} / ${pad(total)}</span>
            <h2 id="lab-modal-title">${t.exp.title}</h2>
            <p>${t.exp.line}</p>
            <button type="button" class="p-lab-modal__close" data-cursor="Close"><span>Close</span><kbd>Esc</kbd>${ICON_CLOSE}</button>
          </div>
        </div>`;
      document.body.appendChild(modal);
      const frame = modal.querySelector(".p-lab-modal__frame") as HTMLElement;
      const size = fit(t.exp);
      frame.style.width = `${size.w}px`;
      frame.style.height = `${size.h}px`;

      loop.solo = t.exp.id;
      loop.focus = t.exp.id;
      tiles.forEach(sync);
      root.inert = true;
      chrome?.setAttribute("inert", "");
      lenis?.stop();
      document.documentElement.classList.add("lab-lock");
      t.el.classList.add("is-out");
      t.stage.classList.add("is-armed");
      sfx("whoosh");

      const bg = modal.querySelector(".p-lab-modal__bg")!;
      const bar = modal.querySelector(".p-lab-modal__bar")!;
      if (reducedMotion) {
        frame.appendChild(t.stage);
      } else {
        const state = Flip.getState(t.stage);
        frame.appendChild(t.stage);
        tweens.push(Flip.from(state, { duration: 0.85, ease: "expo.inOut", scale: true }));
        tweens.push(gsap.fromTo(bg, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power2.out" }));
        tweens.push(gsap.fromTo(bar, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, delay: 0.45, ease: "expo.out" }));
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
        disarm(t);
        expanded = null;
        loop.solo = "";
        tiles.forEach(sync);
      };
      root.inert = false;
      chrome?.removeAttribute("inert");
      lenis?.start();
      document.documentElement.classList.remove("lab-lock");
      lastFocus?.focus({ preventScroll: true });
      sfx("whoosh");
      if (reducedMotion) { finish(); return; }
      const bg = m.querySelector(".p-lab-modal__bg")!;
      const bar = m.querySelector(".p-lab-modal__bar")!;
      tweens.push(gsap.to(bar, { opacity: 0, y: 10, duration: 0.25, ease: "power2.in" }));
      tweens.push(gsap.to(bg, { opacity: 0, duration: 0.6, ease: "power2.inOut" }));
      tweens.push(Flip.fit(t.stage, t.frame, { scale: true, duration: 0.75, ease: "expo.inOut", onComplete: finish }) as gsap.core.Tween);
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
    const onResize = () => {
      if (!modal || !expanded) return;
      const frame = modal.querySelector(".p-lab-modal__frame") as HTMLElement;
      const s = fit(expanded.exp);
      frame.style.width = `${s.w}px`;
      frame.style.height = `${s.h}px`;
    };
    document.addEventListener("click", onModalClick);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    kills.push(() => {
      document.removeEventListener("click", onModalClick);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    });

    tiles.forEach((t) => {
      const open = () => { sfx("click"); openModal(t); };
      t.expand.addEventListener("click", open);
      const dbl = () => openModal(t);
      t.frame.addEventListener("dblclick", dbl);
      kills.push(() => { t.expand.removeEventListener("click", open); t.frame.removeEventListener("dblclick", dbl); });
    });

    /* ------------------------------------------------------------ intro */
    let alive = true;
    if (!reducedMotion) {
      // hide now so nothing flashes while the preloader leaves
      tiles.forEach((t, i) => gsap.set(t.el, { opacity: 0, y: 70, rotation: i % 2 ? 2.2 : -2.2, transformOrigin: "50% 100%" }));
      const masks = pageEl.querySelectorAll(".p-lab__mask > *");
      const meta = pageEl.querySelectorAll(".p-lab__meta > div, .p-lab__index li, .p-lab__about, .p-lab__countlab");
      gsap.set(masks, { yPercent: 110 });
      gsap.set(meta, { opacity: 0, y: 14 });
      gsap.set(countEl, { yPercent: 30, opacity: 0 });
      const intro = () => {
        if (!alive) return;
        const counter = { v: 0 };
        tweens.push(
          gsap.timeline({ delay: 0.1 })
            .to(masks, { yPercent: 0, duration: 1.1, ease: "expo.out", stagger: 0.08 }, 0)
            .to(meta, { opacity: 1, y: 0, duration: 0.8, ease: "expo.out", stagger: 0.035 }, 0.2)
            .to(countEl, { yPercent: 0, opacity: 1, duration: 1.2, ease: "expo.out" }, 0)
            .to(counter, {
              v: total, duration: 1.4, ease: "expo.out",
              onUpdate: () => { countEl.textContent = pad(Math.round(counter.v)); },
            }, 0.1),
        );
        // tiles rise with a slight tilt as they scroll in
        ScrollTrigger.batch(tiles.map((t) => t.el), {
          start: "top 94%",
          once: true,
          onEnter: (batch) => {
            tweens.push(gsap.to(batch, {
              opacity: 1, y: 0, rotation: 0, duration: 1.2, ease: "expo.out", stagger: 0.09,
              onComplete() { gsap.set(batch, { clearProps: "transform,opacity" }); },
            }));
          },
        });
        ScrollTrigger.refresh();
      };
      (first ? loaderGone : Promise.resolve()).then(intro);
    } else {
      countEl.textContent = pad(total);
    }

    return () => {
      alive = false;
      if (modal) {
        modal.remove();
        modal = null;
        root.inert = false;
        chrome?.removeAttribute("inert");
        lenis?.start();
        document.documentElement.classList.remove("lab-lock");
      }
      tweens.forEach((t) => t.kill());
      kills.forEach((k) => k());
      tiles.forEach((t) => t.toy?.destroy());
      loop.destroy();
    };
  },
};

export default page;
