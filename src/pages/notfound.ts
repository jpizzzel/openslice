import "../styles/pages/notfound.css";
import type { Page } from "../core/page";
import { gsap, reducedMotion } from "../core/motion";
import { bus } from "../core/bus";
import { glyph } from "../art";
import { whenReady } from "./about/kit";

const CRUMB_COLORS = ["#d9a35b", "#c98a3f", "#ffc93c", "#ff3b2f", "#e7c48a"];
const POOL = 48;

const page: Page = {
  title: "Not found",
  section: "Lost",
  mount({ root, first }) {
    const path = location.pathname.replace(/[<>&"']/g, "");
    root.innerHTML = `<div class="p-404">
      <section class="nf" aria-labelledby="nf-h">
        <span class="nf__num" aria-hidden="true">404</span>
        <div class="nf__box" aria-hidden="true">
          <span class="nf__lid">${glyph("box-open")}</span>
        </div>
        <h1 id="nf-h" class="nf__h">
          <span class="nf__l"><span class="nf__li caps-red">This slice</span></span>
          <span class="nf__l"><span class="nf__li caps-red">got <em class="serif">eaten.</em></span></span>
        </h1>
        <p class="nf__p">Nothing left at <code class="mono">${path}</code> but crumbs. Somebody got here first.</p>
        <nav class="nf__links" aria-label="Find your way back">
          <a class="nf__btn" href="/" data-cursor="Home"><span>Back home</span><span aria-hidden="true">&larr;</span></a>
          <a class="nf__btn nf__btn--ghost" href="/toolbox" data-cursor="Open"><span>Open the toolbox</span><span aria-hidden="true">&rarr;</span></a>
        </nav>
        <div class="nf__crumbs" aria-hidden="true"></div>
      </section>
    </div>`;
    const el = root.querySelector<HTMLElement>(".p-404")!;
    let alive = true;
    const ctx = gsap.context(() => {}, el);
    if (reducedMotion) return () => { alive = false; ctx.revert(); };

    ctx.add(() => {
      gsap.set(".nf__li", { yPercent: 110 });
      gsap.set(".nf__box", { autoAlpha: 0, y: -80, rotation: -20 });
      gsap.set(".nf__p, .nf__links", { autoAlpha: 0, y: 16 });
    });
    whenReady(first, () => alive, () =>
      ctx.add(() => {
        gsap.timeline({ defaults: { ease: "expo.out" } })
          .to(".nf__box", { autoAlpha: 1, y: 0, rotation: -6, duration: 1.4, ease: "bounce.out" })
          .to(".nf__li", { yPercent: 0, duration: 1.2, stagger: 0.1 }, 0.2)
          .to(".nf__p, .nf__links", { autoAlpha: 1, y: 0, duration: 1, stagger: 0.08 }, 0.5);
        gsap.to(".nf__box", { y: -10, rotation: -3, duration: 2.6, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 1.6 });
      }),
    );

    // Crumbs: a small pool of dots that scatter from the pointer.
    const layer = el.querySelector<HTMLElement>(".nf__crumbs")!;
    const crumbs = Array.from({ length: POOL }, (_, i) => {
      const c = document.createElement("i");
      c.style.background = CRUMB_COLORS[i % CRUMB_COLORS.length];
      layer.appendChild(c);
      return c;
    });
    gsap.set(crumbs, { autoAlpha: 0 });
    let next = 0, lx = 0, ly = 0, acc = 0;
    const spawn = (x: number, y: number, n: number, force = 1) => {
      for (let k = 0; k < n; k++) {
        const c = crumbs[next++ % POOL];
        const a = Math.random() * Math.PI * 2;
        const d = (30 + Math.random() * 90) * force;
        const s = 0.4 + Math.random() * 1.1;
        gsap.killTweensOf(c);
        gsap.set(c, { x, y, scale: s, rotation: Math.random() * 360, autoAlpha: 1 });
        gsap.to(c, { x: x + Math.cos(a) * d, y: y + Math.sin(a) * d * 0.6 + 60 + Math.random() * 80, rotation: "+=" + (Math.random() * 360 - 180), duration: 0.9 + Math.random() * 0.6, ease: "power2.out" });
        gsap.to(c, { autoAlpha: 0, duration: 0.5, delay: 0.6 + Math.random() * 0.5 });
      }
    };
    const sec = el.querySelector<HTMLElement>(".nf")!;
    const move = (e: PointerEvent) => {
      const r = sec.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      acc += Math.hypot(x - lx, y - ly);
      lx = x; ly = y;
      if (acc > 28) { acc = 0; spawn(x, y, 2); }
    };
    const down = (e: PointerEvent) => {
      const r = sec.getBoundingClientRect();
      spawn(e.clientX - r.left, e.clientY - r.top, 14, 1.6);
      bus.emit("sfx", { name: "pop" });
    };
    sec.addEventListener("pointermove", move);
    sec.addEventListener("pointerdown", down);

    return () => {
      alive = false;
      sec.removeEventListener("pointermove", move);
      sec.removeEventListener("pointerdown", down);
      gsap.killTweensOf(crumbs);
      ctx.revert();
    };
  },
};

export default page;
