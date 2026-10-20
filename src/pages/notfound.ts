import "../styles/pages/notfound.css";
import type { Page } from "../core/page";
import { gsap, reducedMotion } from "../core/motion";
import { bus } from "../core/bus";
import { halftone, mascot } from "../art";
import { whenReady } from "./about/kit";

const CRUMB_COLORS = ["#d9a35b", "#c98a3f", "#ffc93c", "#ff3b2f", "#e7c48a"];
const POOL = 48;
const INK = "#141210";

/** The giant 404, with a bite taken out of the 0 (svg mask). `lit` is the
 *  halftone copy that shows under the searching flashlight. */
function num404(id: string, lit: boolean) {
  const h = halftone(3, INK, 11);
  const fill = lit ? h.fill : "currentColor";
  return `<svg class="nf__num${lit ? " nf__num--lit" : ""}" viewBox="0 0 1000 420" aria-hidden="true" focusable="false">
    <defs>${lit ? h.def : ""}<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="420">
      <rect width="1000" height="420" fill="#fff"/>
      <g fill="#000"><circle cx="410" cy="96" r="58"/><circle cx="458" cy="50" r="46"/><circle cx="368" cy="156" r="44"/><circle cx="500" cy="20" r="36"/><circle cx="350" cy="214" r="30"/></g>
    </mask></defs>
    ${lit ? "" : `<g fill="#141210" opacity=".28"><circle cx="318" cy="52" r="5"/><circle cx="292" cy="96" r="3.5"/><circle cx="346" cy="14" r="3"/><circle cx="270" cy="150" r="4"/></g>`}
    <g fill="${fill}" font-size="520" font-weight="500" letter-spacing="-30" text-anchor="middle">
      <text x="178" y="398">4</text>
      <text x="500" y="398" mask="url(#${id})">0</text>
      <text x="822" y="398">4</text>
    </g>
  </svg>`;
}

/** An empty, greasy pizza box. Ink line, halftone shade, crumbs, one crust. */
function emptyBox() {
  const h = halftone(2, INK, 5);
  const g = halftone(3, "#b9852f", 6);
  return `<svg viewBox="0 0 400 320" aria-hidden="true" focusable="false">
    <defs>${h.def}${g.def}</defs>
    <ellipse cx="206" cy="304" rx="190" ry="12" fill="${h.fill}"/>
    <!-- lid, hinged at the back and propped open -->
    <path d="M40 176L352 160L364 30L58 46Z" fill="#e9b46a" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M62 160L334 146L344 50L76 62Z" fill="#f3dfb8" stroke="${INK}" stroke-width="2"/>
    <path d="M300 60L344 50L334 146L296 150Z" fill="${h.fill}" opacity=".5"/>
    <ellipse cx="206" cy="104" rx="84" ry="30" fill="#d9a35b" opacity=".45" transform="rotate(-3 206 104)"/>
    <ellipse cx="206" cy="104" rx="84" ry="30" fill="${g.fill}" opacity=".7" transform="rotate(-3 206 104)"/>
    <path d="M118 84q-10 18 4 30M290 96q8 16 -6 28" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" opacity=".45"/>
    <text x="206" y="122" text-anchor="middle" font-size="13" font-weight="700" letter-spacing="3" fill="${INK}" opacity=".55" transform="rotate(-3 206 122)" class="nf__boxtxt">HOT &amp; FRESH</text>
    <!-- tray -->
    <path d="M40 176L352 160L384 236L18 258Z" fill="#f3dfb8" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M64 186L332 172L354 226L44 244Z" fill="#ead2a2" stroke="${INK}" stroke-width="1.6" stroke-dasharray="5 6" opacity=".9"/>
    <!-- grease ring where the pizza was, plus drips -->
    <ellipse cx="202" cy="210" rx="118" ry="24" fill="none" stroke="#c98a3f" stroke-width="7" opacity=".55" transform="rotate(-3 202 210)"/>
    <ellipse cx="160" cy="214" rx="34" ry="9" fill="#d9a35b" opacity=".6"/>
    <ellipse cx="160" cy="214" rx="34" ry="9" fill="${g.fill}"/>
    <ellipse cx="262" cy="200" rx="22" ry="6" fill="#d9a35b" opacity=".6"/>
    <!-- the one crust nobody wanted -->
    <path d="M226 226q34 -20 70 -10" fill="none" stroke="${INK}" stroke-width="15" stroke-linecap="round"/>
    <path d="M226 226q34 -20 70 -10" fill="none" stroke="#e9b46a" stroke-width="9" stroke-linecap="round"/>
    <path d="M244 216l2 4M262 211l1 4M278 210l1 4" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>
    <!-- crumbs -->
    <g fill="#e9b46a" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round">
      <path d="M110 222l7 -4 5 5 -6 5z"/><path d="M134 236l5 -3 4 4 -5 3z"/><path d="M318 220l6 -2 2 6 -6 1z"/>
      <path d="M196 238l4 -4 5 3 -4 4z"/><path d="M90 236l4 -2 3 3 -4 2z"/>
    </g>
    <g fill="#ff3b2f" stroke="${INK}" stroke-width="1.6"><circle cx="176" cy="196" r="3.4"/><circle cx="300" cy="234" r="2.6"/></g>
    <!-- front wall -->
    <path d="M18 258L384 236L384 274L18 298Z" fill="#e9b46a" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M300 241L384 236L384 274L300 279Z" fill="${h.fill}" opacity=".55"/>
    <path d="M60 280l60 -3M150 276l40 -2" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
  </svg>`;
}

/** Sauce on the face and a sweat drop: drawn over mascot() (same 200x300 box). */
const GUILT = `<svg class="nf__guilt" viewBox="0 0 200 300" aria-hidden="true" focusable="false">
  <path d="M110 150q14 -6 22 2q6 8 -2 14q-4 10 -10 6q-8 2 -9 -6q-8 -8 -1 -16z" fill="#ff3b2f" stroke="#141210" stroke-width="2.4" stroke-linejoin="round"/>
  <path d="M124 166q2 10 -2 16q-4 4 -6 -2q0 -6 2 -12" fill="#ff3b2f" stroke="#141210" stroke-width="2.2" stroke-linejoin="round"/>
  <path d="M66 140q6 -6 13 -2" fill="none" stroke="#ff3b2f" stroke-width="4" stroke-linecap="round"/>
  <path d="M152 74q8 12 8 18a8 8 0 0 1 -16 0q0 -6 8 -18z" fill="#f7f4ef" stroke="#141210" stroke-width="2.4" stroke-linejoin="round"/>
  <path d="M164 64l8 -6M168 78l9 -1" stroke="#141210" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M88 174l5 -3 4 4 -5 3z" fill="#e9b46a" stroke="#141210" stroke-width="1.6"/>
</svg>`;

const page: Page = {
  title: "Not found",
  section: "Lost",
  mount({ root, first }) {
    const path = location.pathname.replace(/[<>&"']/g, "");
    root.innerHTML = `<div class="p-404">
      <section class="nf" aria-labelledby="nf-h">
        ${num404("nf-bite", false)}
        <div class="nf__torch" aria-hidden="true"><div class="nf__torch-in">${num404("nf-bite-lit", true)}</div></div>
        <div class="nf__scene" aria-hidden="true">
          <span class="nf__box">${emptyBox()}</span>
          <span class="nf__who">${mascot("jonah", "stand")}${GUILT}</span>
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

    // Flashlight: a warm circle of light sweeps the page looking for the
    // missing slice. Under it the giant 404 shows its halftone ink. Pure
    // transforms: the circle moves one way, its content the opposite way.
    const sec0 = el.querySelector<HTMLElement>(".nf")!;
    const torch = el.querySelector<HTMLElement>(".nf__torch")!;
    const torchIn = el.querySelector<HTMLElement>(".nf__torch-in")!;
    let W = 1, H = 1, TR = 1;
    const fit = () => {
      W = sec0.clientWidth; H = sec0.clientHeight; TR = torch.offsetWidth / 2;
      torchIn.style.width = `${W}px`; torchIn.style.height = `${H}px`;
    };
    const ro = new ResizeObserver(fit);
    ro.observe(sec0);
    fit();
    const beam = { x: W * 0.62, y: H * 0.45, tx: W * 0.62, ty: H * 0.45, user: 0 };
    const tx = gsap.quickSetter(torch, "x", "px"), ty = gsap.quickSetter(torch, "y", "px");
    const ix = gsap.quickSetter(torchIn, "x", "px"), iy = gsap.quickSetter(torchIn, "y", "px");
    const sweep = (time: number, dms: number) => {
      const dt = Math.min(0.05, dms / 1000);
      if (beam.user > 0) beam.user -= dt;
      else {
        // nobody is holding the flashlight: it searches on its own
        beam.tx = W * (0.5 + 0.34 * Math.sin(time * 0.5));
        beam.ty = H * (0.48 + 0.22 * Math.sin(time * 0.83 + 1.3));
      }
      const k = 1 - Math.exp(-dt * (beam.user > 0 ? 9 : 2.2));
      beam.x += (beam.tx - beam.x) * k; beam.y += (beam.ty - beam.y) * k;
      tx(beam.x - TR); ty(beam.y - TR);
      ix(TR - beam.x); iy(TR - beam.y);
    };
    gsap.ticker.add(sweep);
    const aim = (e: PointerEvent) => {
      const r = sec0.getBoundingClientRect();
      beam.tx = e.clientX - r.left; beam.ty = e.clientY - r.top; beam.user = 2.5;
    };
    sec0.addEventListener("pointermove", aim);

    ctx.add(() => {
      gsap.set(".nf__li", { yPercent: 110 });
      gsap.set(".nf__box", { autoAlpha: 0, y: -80, rotation: -20 });
      gsap.set(".nf__who", { autoAlpha: 0, xPercent: -40 });
      gsap.set(".nf__p, .nf__links", { autoAlpha: 0, y: 16 });
    });
    whenReady(first, () => alive, () =>
      ctx.add(() => {
        // non-first visits: start as the transition cover peels away
        gsap.timeline({ defaults: { ease: "expo.out" }, delay: first ? 0 : 0.2 })
          .to(".nf__li", { yPercent: 0, duration: 0.9, stagger: 0.06 }, 0)
          .to(".nf__box", { autoAlpha: 1, y: 0, rotation: -4, duration: 1.2, ease: "bounce.out" }, 0.1)
          .to(".nf__who", { autoAlpha: 1, xPercent: 0, duration: 1.1 }, 0.5)
          .to(".nf__p, .nf__links", { autoAlpha: 1, y: 0, duration: 1, stagger: 0.08 }, 0.35);
        // the guilty shuffle: a small nervous sway, nothing to see here
        gsap.to(".nf__who", { rotation: 3, duration: 0.9, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 1.8, transformOrigin: "50% 100%" });
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
      gsap.ticker.remove(sweep);
      ro.disconnect();
      sec0.removeEventListener("pointermove", aim);
      sec.removeEventListener("pointermove", move);
      sec.removeEventListener("pointerdown", down);
      gsap.killTweensOf(crumbs);
      ctx.revert();
    };
  },
};

export default page;
