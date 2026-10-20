// HERO: mega "20 / 23" behind an open pizza box that bursts with tools.
import { gsap } from "../../core/motion";
import { SplitText } from "gsap/SplitText";
import { bus } from "../../core/bus";
import { glyph, type GlyphId } from "../../art";
import { SITE, TOOLS, STATUS_LABEL } from "../../data/site";
import { esc, type Kit } from "./kit";

gsap.registerPlugin(SplitText);

interface Obj {
  id: GlyphId;
  /** center, in % of the stage */
  x: number;
  y: number;
  /** width, in % of the stage width */
  s: number;
  /** resting rotation */
  r: number;
}

// A fountain: tight above the box, opening wide toward the top.
const OBJECTS: Obj[] = [
  { id: "laptop", x: 50, y: 15, s: 25, r: -7 },
  { id: "terminal", x: 22, y: 8, s: 12, r: -10 },
  { id: "squiggle", x: 80, y: 9, s: 10, r: 24 },
  { id: "star", x: 6, y: 25, s: 7, r: 0 },
  { id: "satsuma", x: 20, y: 31, s: 15, r: -12 },
  { id: "tangerine", x: 82, y: 28, s: 14, r: 10 },
  { id: "headphones", x: 97, y: 44, s: 13, r: 14 },
  { id: "cursor", x: 63, y: 34, s: 7, r: -14 },
  { id: "voice", x: 38, y: 43, s: 12, r: 8 },
  { id: "coffee", x: 4, y: 47, s: 11, r: -8 },
  { id: "register", x: 70, y: 50, s: 15, r: -6 },
  { id: "keyboard", x: 22, y: 57, s: 19, r: 14 },
  { id: "mystery", x: 51, y: 59, s: 11, r: 12 },
  { id: "slice", x: 86, y: 66, s: 12, r: -22 },
  { id: "basil", x: 33, y: 70, s: 8, r: -32 },
  { id: "pepperoni", x: 67, y: 72, s: 8, r: 0 },
];

const statement = `Building free tools for students, engineers and small businesses out of our kitchen since ${SITE.since}.`;

export function heroHTML() {
  const objs = OBJECTS.map(
    (o, i) => `
      <div class="o" style="--x:${o.x};--y:${o.y};--s:${o.s};--r:${o.r}deg" data-i="${i}">
        <div class="o-scroll"><div class="o-intro"><div class="o-float"><div class="o-wig">${glyph(o.id)}</div></div></div></div>
      </div>`,
  ).join("");

  const oven = TOOLS.map(
    (t) => `<li><a class="h-col__a" href="/toolbox/${t.slug}" data-cursor="Open"><span class="u-link">${esc(t.name)}</span></a> <span class="h-col__m">${STATUS_LABEL[t.status]}</span></li>`,
  ).join("");

  return `
  <section class="h-hero" data-hero aria-labelledby="h-title">
    <h1 id="h-title" class="sr-only">${SITE.name}: ${esc(SITE.tagline)} ${esc(statement)}</h1>

    <div class="h-num h-num--l mega" aria-hidden="true"><span class="h-mask"><span class="h-num__in">${String(SITE.since).slice(0, 2)}</span></span></div>
    <div class="h-num h-num--r mega" aria-hidden="true"><span class="h-mask"><span class="h-num__in">${String(SITE.since).slice(2)}</span></span></div>

    <ul class="h-facts caps-red" aria-label="About us">
      ${SITE.facts.map((f) => `<li><span class="h-line">${esc(f)}</span></li>`).join("")}
    </ul>
    <p class="h-and caps-red" aria-hidden="true"><span class="h-line">And</span></p>
    <p class="h-statement caps-red" aria-hidden="true">${esc(statement)}</p>

    <div class="h-stage" aria-hidden="true">
      <svg class="h-lines" viewBox="0 0 400 400" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2.6">
        <g class="h-lines__l">
          <path d="M70 330 L22 196"/><path d="M92 318 L60 236"/><path d="M48 352 L8 300"/>
          <path d="M30 150 q8 -10 0 -20 q-8 -10 0 -20"/>
        </g>
        <g class="h-lines__r">
          <path d="M330 330 L378 196"/><path d="M308 318 L340 236"/><path d="M352 352 L392 300"/>
          <path d="M372 150 q-8 -10 0 -20 q8 -10 0 -20"/>
        </g>
        <g class="h-lines__dash">
          <path d="M150 120 l-8 -16"/><path d="M250 120 l8 -16"/><path d="M200 96 l0 -18"/>
          <path d="M120 200 l-14 -6"/><path d="M280 200 l14 -6"/>
        </g>
      </svg>
      <div class="h-objs">${objs}</div>
      <div class="h-box"><div class="h-box__in">${glyph("box-open")}</div></div>
    </div>

    <div class="h-cols">
      <div class="h-col h-col--oven">
        <p class="label">In the oven</p>
        <ul>${oven}</ul>
      </div>
      <div class="h-col h-col--for">
        <p class="label">Built for</p>
        <ul><li>Students</li><li>Engineers</li><li>Small businesses</li><li>Anyone tired of subscriptions</li></ul>
      </div>
      <div class="h-col h-col--stack">
        <p class="label">Ingredients</p>
        <ul><li>TypeScript</li><li>Swift</li><li>C# / .NET</li><li>ffmpeg</li><li>A lot of pizza</li></ul>
        <p class="h-col__foot"><a href="${SITE.repo}" target="_blank" rel="noopener" class="u-link">Read the source</a></p>
      </div>
      <div class="h-col h-col--fed">
        <p class="label">Fed by</p>
        <ul><li><a class="u-link" href="${SITE.trunk.href}" target="_blank" rel="noopener">${esc(SITE.trunk.name)}</a> regulars</li><li>Our roommates</li><li>Late night deadlines</li><li>and many more</li></ul>
      </div>
    </div>
  </section>`;
}

export function initHero(kit: Kit, intro: Promise<void>) {
  const hero = kit.root.querySelector<HTMLElement>("[data-hero]")!;
  const stage = hero.querySelector<HTMLElement>(".h-stage")!;
  const box = hero.querySelector<HTMLElement>(".h-box__in")!;
  const objs = [...hero.querySelectorAll<HTMLElement>(".o")];
  const floats = objs.map((o) => o.querySelector<HTMLElement>(".o-float")!);
  const intros = objs.map((o) => o.querySelector<HTMLElement>(".o-intro")!);
  const wigs = objs.map((o) => o.querySelector<HTMLElement>(".o-wig")!);
  const nums = [...hero.querySelectorAll<HTMLElement>(".h-num__in")];
  const lines = [...hero.querySelectorAll<HTMLElement>(".h-facts .h-line")];
  const and = hero.querySelector<HTMLElement>(".h-and .h-line")!;
  const stmt = hero.querySelector<HTMLElement>(".h-statement")!;
  const cols = [...hero.querySelectorAll<HTMLElement>(".h-col")];
  const speed = hero.querySelector<SVGElement>(".h-lines")!;

  if (kit.reduced) return;

  // Hover / tap: springy wiggle + pop.
  let lastPop = 0;
  objs.forEach((o, i) => {
    o.style.pointerEvents = "auto";
    const wiggle = () => {
      if (gsap.isTweening(wigs[i])) return;
      const dir = i % 2 ? 1 : -1;
      gsap.fromTo(
        wigs[i],
        { rotation: 22 * dir, scale: 1.18 },
        { rotation: 0, scale: 1, duration: 1.2, ease: "elastic.out(1.1, 0.28)", overwrite: true },
      );
      const now = performance.now();
      if (now - lastPop > 60) { bus.emit("sfx", { name: "pop" }); lastPop = now; }
    };
    const ev = kit.fine ? "pointerenter" : "pointerdown";
    o.addEventListener(ev, wiggle);
    kit.onCleanup(() => o.removeEventListener(ev, wiggle));
  });

  // Idle float + mouse parallax, one loop for all objects.
  const seeds = OBJECTS.map((o, i) => ({
    ph: i * 1.7 + o.x * 0.05,
    sp: 0.7 + ((i * 37) % 10) / 18,
    amp: 6 + ((i * 13) % 9),
    rot: 2 + ((i * 7) % 5),
    depth: 0.4 + o.s / 18,
  }));
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  if (kit.fine) {
    const move = (e: PointerEvent) => {
      mouse.tx = (e.clientX / innerWidth) * 2 - 1;
      mouse.ty = (e.clientY / innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", move, { passive: true });
    kit.onCleanup(() => window.removeEventListener("pointermove", move));
  }
  kit.loop(hero, (time, dt) => {
    const k = 1 - Math.pow(0.002, dt);
    mouse.x += (mouse.tx - mouse.x) * k;
    mouse.y += (mouse.ty - mouse.y) * k;
    for (let i = 0; i < floats.length; i++) {
      const s = seeds[i];
      const t = time * s.sp + s.ph;
      const y = Math.sin(t) * s.amp - mouse.y * 22 * s.depth;
      const x = Math.cos(t * 0.6) * s.amp * 0.4 - mouse.x * 28 * s.depth;
      const r = Math.sin(t * 0.8) * s.rot + mouse.x * 4 * s.depth;
      floats[i].style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) rotate(${r.toFixed(2)}deg)`;
    }
  });

  let split: SplitText | null = null;

  kit.add(() => {
    // Scroll: the burst spreads out, numerals part, box sinks.
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.7, invalidateOnRefresh: true },
    });
    objs.forEach((o, i) => {
      const d = OBJECTS[i];
      tl.to(o.querySelector(".o-scroll"), {
        x: () => ((d.x - 50) / 100) * stage.offsetWidth * 1.1,
        y: () => -((100 - d.y) / 100) * stage.offsetHeight * 0.55 - 40,
        rotation: (d.x < 50 ? -1 : 1) * (20 + (i % 4) * 12),
        scale: 1 + d.s / 60,
      }, 0);
    });
    tl.to(nums[0].parentElement!.parentElement, { xPercent: -28 }, 0)
      .to(nums[1].parentElement!.parentElement, { xPercent: 28 }, 0)
      .to(hero.querySelector(".h-box"), { y: 120, rotation: -6 }, 0)
      .to(speed, { scale: 1.5, opacity: 0 }, 0)
      .to(hero.querySelector(".h-facts"), { y: -80 }, 0)
      .to(hero.querySelector(".h-statement"), { y: -40 }, 0);

    // Intro: hidden until the preloader leaves.
    split = SplitText.create(stmt, { type: "lines", mask: "lines", linesClass: "h-sline" });
    gsap.set([...nums, ...lines, and, ...split.lines], { yPercent: 115 });
    gsap.set(intros, { scale: 0, autoAlpha: 0 });
    gsap.set(box, { yPercent: 60, autoAlpha: 0 });
    gsap.set(cols, { autoAlpha: 0, y: 24 });
    gsap.set(speed, { autoAlpha: 0, scale: 0.6, transformOrigin: "50% 90%" });
  });

  intro.then(() => kit.add(() => {
    const boxR = box.getBoundingClientRect();
    const bx = boxR.left + boxR.width / 2;
    const by = boxR.top + boxR.height * 0.35;
    const order = intros
      .map((el, i) => {
        const r = el.getBoundingClientRect();
        return { el, i, dx: bx - (r.left + r.width / 2), dy: by - (r.top + r.height / 2) };
      })
      .sort((a, b) => (b.dy) - (a.dy) || a.i - b.i);

    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.to(nums, { yPercent: 0, duration: 1.6, stagger: 0.12 }, 0)
      .to(box, { yPercent: 0, autoAlpha: 1, duration: 1.1 }, 0.1)
      .to(box, { scaleY: 0.86, scaleX: 1.08, duration: 0.18, ease: "power2.in", transformOrigin: "50% 100%" }, 0.55)
      .to(box, { scaleY: 1, scaleX: 1, duration: 1.1, ease: "elastic.out(1, 0.35)" }, 0.73)
      .to(speed, { autoAlpha: 1, scale: 1, duration: 1.2 }, 0.7);
    order.forEach(({ el, i, dx, dy }, n) => {
      tl.fromTo(
        el,
        { x: dx, y: dy, scale: 0.2, rotation: (i % 2 ? 1 : -1) * 90, autoAlpha: 0 },
        { x: 0, y: 0, scale: 1, rotation: 0, autoAlpha: 1, duration: 1.15, ease: "back.out(1.5)" },
        0.72 + n * 0.055,
      );
    });
    tl.to(lines, { yPercent: 0, duration: 1.1, stagger: 0.07 }, 0.4)
      .to(and, { yPercent: 0, duration: 1.1 }, 0.95)
      .to(split?.lines ?? [], { yPercent: 0, duration: 1.1, stagger: 0.07 }, 1.05)
      .to(cols, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.08 }, 1.2);
  }));

  kit.onCleanup(() => split?.revert());
}
