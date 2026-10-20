// HERO: "the box is the logo". Our own pizza box flips its lid, steam curls up
// and the tools fountain out. Scrolling packs them back in, shuts the lid and
// slides the box down onto the menu board.
import { gsap, ScrollTrigger } from "../../core/motion";
import { bus } from "../../core/bus";
import { glyph, type GlyphId } from "../../art";
import { SITE } from "../../data/site";
import { esc, type Kit } from "./kit";
import { boxHTML, steamHTML } from "./box";
import { ticketHTML } from "./ticket";

interface Obj {
  id: GlyphId;
  /** center, relative to the box, in box widths */
  dx: number;
  /** where it rests: its bottom edge, below the box center, in box widths */
  by: number;
  /** width, in box widths */
  s: number;
  /** resting rotation */
  r: number;
}

// A still life: the kit behind each tool, set down on the table around the box,
// all on the same tabletop (the box's shadow), nearer ones a touch lower.
const OBJECTS: Obj[] = [
  { id: "keyboard", dx: -1.0, by: 0.34, s: 0.4, r: -4 },
  { id: "voice", dx: -0.64, by: 0.5, s: 0.2, r: -6 },
  { id: "mystery", dx: 0.62, by: 0.5, s: 0.22, r: 6 },
  { id: "register", dx: 0.88, by: 0.32, s: 0.32, r: 3 },
  { id: "tangerine", dx: 1.02, by: 0.52, s: 0.2, r: 8 },
];

const OPEN = 118; // lid angle once open, in degrees around the hinge
const intro = `Making free tools for students, engineers and small businesses, out of the same house we sell pizza from.`;

export function heroHTML() {
  const objs = OBJECTS.map(
    (o, i) => `
      <div class="o o--${o.id}" style="--dx:${o.dx};--by:${o.by};--s:${o.s};--r:${o.r}deg" data-i="${i}">
        <div class="o-scroll"><div class="o-intro"><i class="o-sh"></i><div class="o-float"><div class="o-wig">${glyph(o.id)}</div></div></div></div>
      </div>`,
  ).join("");

  return `
  <section class="h-hero" data-hero aria-labelledby="h-title">
    <div class="h-pin">
      <div class="h-copy">
        <h1 id="h-title" class="h-title">
          <span class="sr-only">${esc(SITE.name)}: </span>
          <span class="h-tl h-tl--serif"><span class="h-tl__in">Free tools,</span></span>
          <span class="h-tl h-tl--caps"><span class="h-tl__in">served hot.</span></span>
        </h1>
        <div class="h-sub">
          <p class="h-intro">${esc(intro)}</p>
          <p class="h-links">
            <a class="h-go" href="/toolbox" data-cursor="Open"><span class="h-ul">Open the toolbox</span><span class="h-go__ar" aria-hidden="true">${glyph("arrow")}</span></a>
            <a class="h-ul h-src" href="${SITE.repo}" target="_blank" rel="noopener" data-cursor="GitHub">Read the source</a>
          </p>
        </div>
        ${ticketHTML()}
      </div>

      <div class="h-stage" aria-hidden="true">
        <div class="h-bx" data-cursor="Peek">
          <div class="bx-travel"><div class="bx-par"><div class="bx-hv"><div class="bx-in">
            ${boxHTML()}
            ${steamHTML()}
          </div></div></div></div>
        </div>
        <div class="h-objs">${objs}</div>
      </div>
    </div>
  </section>`;
}

export function initHero(kit: Kit, introReady: Promise<void>) {
  const hero = kit.root.querySelector<HTMLElement>("[data-hero]")!;
  const pin = hero.querySelector<HTMLElement>(".h-pin")!;
  const anchor = hero.querySelector<HTMLElement>(".h-bx")!;
  const mouthEl = hero.querySelector<HTMLElement>(".h-objs")!;
  const travel = hero.querySelector<HTMLElement>(".bx-travel")!;
  const par = hero.querySelector<HTMLElement>(".bx-par")!;
  const hv = hero.querySelector<HTMLElement>(".bx-hv")!;
  const boxIn = hero.querySelector<HTMLElement>(".bx-in")!;
  const lid = hero.querySelector<HTMLElement>(".bx-lid")!;
  const lidA = hero.querySelector<HTMLElement>(".bx-lid__a")!;
  const lidB = hero.querySelector<HTMLElement>(".bx-lid__b")!;
  const steam = hero.querySelector<HTMLElement>(".bx-steam")!;
  const curls = [...steam.querySelectorAll<SVGElement>(".bx-curl")];
  const shadow = hero.querySelector<HTMLElement>(".bx-shadow")!;
  const objs = [...hero.querySelectorAll<HTMLElement>(".o")];
  const scrolls = objs.map((o) => o.querySelector<HTMLElement>(".o-scroll")!);
  const intros = objs.map((o) => o.querySelector<HTMLElement>(".o-intro")!);
  const floats = objs.map((o) => o.querySelector<HTMLElement>(".o-float")!);
  const wigs = objs.map((o) => o.querySelector<HTMLElement>(".o-wig")!);
  const lines = [...hero.querySelectorAll<HTMLElement>(".h-tl__in")];
  const sub = [...hero.querySelectorAll<HTMLElement>(".h-intro, .h-links")];
  const ticket = hero.querySelector<HTMLElement>(".h-tk")!;
  const drop = kit.root.querySelector<HTMLElement>(".h-mb__drop");

  if (kit.reduced) return;

  // ---- geometry, read from untransformed layout boxes only
  const rect = (el: Element) => el.getBoundingClientRect();
  /** offset from an object's resting center to the box mouth */
  const toMouth = (i: number) => {
    const m = rect(mouthEl), o = rect(objs[i]);
    return { x: m.left + m.width / 2 - (o.left + o.width / 2), y: m.top + m.height / 2 - (o.top + o.height / 2) };
  };
  /** where the box has to go to sit on the menu board, once the hero has scrolled on */
  const landing = () => {
    if (!drop) return { x: 0, y: 0, s: 1 };
    const a = rect(anchor), d = rect(drop), h = rect(hero), p = rect(pin);
    const inPin = a.top + a.height / 2 - p.top;
    const pinEnd = h.top + h.height - p.height; // where the pin sits once it lets go
    return {
      x: d.left + d.width / 2 - (a.left + a.width / 2),
      y: d.top + d.height / 2 - (pinEnd + inPin),
      s: d.width / a.width,
    };
  };

  // ---- initial state, hidden until the intro
  kit.add(() => {
    gsap.set(lines, { yPercent: 110 });
    gsap.set(sub, { autoAlpha: 0, y: 24 });
    gsap.set(ticket, { autoAlpha: 0, y: 90, rotation: 7 });
    gsap.set(boxIn, { autoAlpha: 0, y: 70, scale: 0.9 });
    gsap.set(shadow, { autoAlpha: 0, scale: 0.6 });
    gsap.set(lidA, { rotationX: 0 });
    gsap.set(intros, { autoAlpha: 0 });
  });

  // ---- steam: a loop that only runs while the hero is on screen
  let steamTl: gsap.core.Timeline | null = null;
  kit.add(() => {
    steamTl = gsap.timeline({ repeat: -1, paused: true });
    curls.forEach((c, i) => {
      steamTl!.fromTo(c,
        { y: 30, scaleY: 0.7, autoAlpha: 0 },
        { keyframes: [
          { y: 0, scaleY: 1, autoAlpha: 0.9, duration: 0.9, ease: "sine.out" },
          { y: -46, scaleY: 1.15, autoAlpha: 0, duration: 1.3, ease: "sine.in" },
        ] },
        i * 0.7);
    });
    ScrollTrigger.create({
      trigger: hero, start: "top bottom", end: "bottom top",
      onToggle: (s) => (s.isActive ? steamTl?.play() : steamTl?.pause()),
    });
  });

  // ---- idle: they rest on the table, so no bobbing. Only a little mouse
  // parallax by depth (max ~10px) and a slow breath of tilt.
  const seeds = OBJECTS.map((o, i) => ({
    ph: i * 1.7 + o.dx * 2,
    sp: 0.5 + ((i * 37) % 10) / 30,
    rot: 0.8 + ((i * 7) % 3) * 0.4,
    depth: 0.35 + o.by * 0.9,
  }));
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  type Q = ReturnType<typeof gsap.quickTo>;
  let qx: Q | null = null, qr: Q | null = null;
  if (kit.fine) {
    kit.add(() => {
      qx = gsap.quickTo(par, "x", { duration: 0.9, ease: "power3" });
      qr = gsap.quickTo(par, "rotation", { duration: 1.1, ease: "power3" });
    });
    kit.onCleanup(() => { qx?.tween.kill(); qr?.tween.kill(); });
    const move = (e: PointerEvent) => {
      mouse.tx = (e.clientX / innerWidth) * 2 - 1;
      mouse.ty = (e.clientY / innerHeight) * 2 - 1;
      qx?.(mouse.tx * 8);
      qr?.(mouse.tx * 1.4);
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
      const x = -mouse.x * 10 * s.depth;
      const r = Math.sin(t) * s.rot + mouse.x * 2 * s.depth;
      // tilt about the bottom edge, so it rocks on the table instead of hovering
      floats[i].style.transform = `translate3d(${x.toFixed(2)}px,0,0) rotate(${r.toFixed(2)}deg)`;
    }
  });

  // ---- scroll: tools fly home in order, the lid shuts with a bounce, and the
  // box rides down onto the menu board. Wide screens pin the hero (CSS sticky);
  // narrow ones scrub while it scrolls. Rebuilt when the layout flips.
  // (Not gsap.matchMedia: it never removes its MediaQueryList listeners.)
  const mq = window.matchMedia("(min-width: 1024px)");
  let scrollTl: gsap.core.Timeline | null = null;
  const buildScroll = () => kit.add(() => {
    scrollTl?.scrollTrigger?.kill();
    scrollTl?.revert();
    const wide = mq.matches;
    const menu = kit.root.querySelector<HTMLElement>(".h-mb");
    const tl = (scrollTl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: wide ? hero : anchor,
        start: wide ? "top top" : "top 55%",
        endTrigger: menu ?? hero,
        end: menu ? (wide ? "top 22%" : "top 30%") : "bottom top",
        scrub: 0.6,
        invalidateOnRefresh: true,
      },
    }));
    const n = scrolls.length;
    scrolls.forEach((el, i) => {
      tl.to(el, {
        x: () => toMouth(i).x,
        y: () => toMouth(i).y,
        scale: 0.12,
        rotation: (i % 2 ? 1 : -1) * 160,
        autoAlpha: 0,
        duration: 0.14,
        ease: "power2.in",
      }, (i / n) * 0.2);
    });
    tl.to(steam, { autoAlpha: 0, duration: 0.06 }, 0.02)
      .to(lid, { rotationX: -OPEN, duration: 0.15, ease: "bounce.out" }, 0.3)
      .to(hv, { keyframes: [
        { scaleY: 0.92, scaleX: 1.05, duration: 0.025 },
        { scaleY: 1, scaleX: 1, duration: 0.06, ease: "back.out(3)" },
      ] }, 0.4)
      .to(shadow, { autoAlpha: 0, duration: 0.1 }, 0.5)
      .to(travel, {
        x: () => landing().x,
        y: () => landing().y,
        scale: () => landing().s,
        rotation: -7,
        duration: 0.5,
        ease: "power2.inOut",
      }, 0.5);
  });
  buildScroll();
  mq.addEventListener("change", buildScroll);
  kit.onCleanup(() => mq.removeEventListener("change", buildScroll));

  // ---- hover (or tap) the box: the lid peeks and everything jiggles
  let ready = false, lastPeek = 0;
  const peek = () => {
    const now = performance.now();
    if (!ready || now - lastPeek < 700) return;
    lastPeek = now;
    bus.emit("sfx", { name: "pop" });
    kit.add(() => {
      gsap.timeline({ defaults: { overwrite: "auto" } })
        .to(lidB, { rotationX: 16, duration: 0.22, ease: "power2.out" })
        .to(lidB, { rotationX: 0, duration: 1.2, ease: "elastic.out(1, 0.32)" });
      gsap.timeline({ defaults: { overwrite: "auto" } })
        .to(hv, { scaleY: 0.94, scaleX: 1.04, duration: 0.12, ease: "power2.in" })
        .to(hv, { scaleY: 1, scaleX: 1, duration: 0.9, ease: "elastic.out(1, 0.35)" });
      wigs.forEach((w, i) => {
        gsap.fromTo(w,
          { rotation: (i % 2 ? 1 : -1) * 12, y: -10 },
          { rotation: 0, y: 0, duration: 1, ease: "elastic.out(1.1, 0.3)", delay: i * 0.018, overwrite: true });
      });
    });
  };
  const peekEv = kit.fine ? "pointerenter" : "pointerdown";
  anchor.addEventListener(peekEv, peek);
  kit.onCleanup(() => anchor.removeEventListener(peekEv, peek));

  // ---- hover (or tap) a tool: springy wiggle
  let lastPop = 0;
  objs.forEach((o, i) => {
    const wiggle = () => {
      if (!ready || gsap.isTweening(wigs[i])) return;
      const dir = i % 2 ? 1 : -1;
      gsap.fromTo(wigs[i],
        { rotation: 22 * dir, scale: 1.16 },
        { rotation: 0, scale: 1, duration: 1.2, ease: "elastic.out(1.1, 0.28)", overwrite: true });
      const now = performance.now();
      if (now - lastPop > 60) { bus.emit("sfx", { name: "pop" }); lastPop = now; }
    };
    const ev = kit.fine ? "pointerenter" : "pointerdown";
    o.addEventListener(ev, wiggle);
    kit.onCleanup(() => o.removeEventListener(ev, wiggle));
  });

  // ---- intro
  introReady.then(() => kit.add(() => {
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.to(lines, { yPercent: 0, duration: 0.9, stagger: 0.06 }, 0)
      .to(sub, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.06 }, 0.18)
      .to(ticket, { autoAlpha: 1, y: 0, rotation: -2.4, duration: 1.2, ease: "back.out(1.3)" }, 0.3)
      .to(boxIn, { autoAlpha: 1, y: 0, scale: 1, duration: 0.8 }, 0.05)
      .to(shadow, { autoAlpha: 1, scale: 1, duration: 0.8 }, 0.05)
      // the lid flips open on its hinge and overshoots
      .to(hv, { scaleY: 0.93, scaleX: 1.04, duration: 0.14, ease: "power2.in" }, 0.42)
      .to(hv, { scaleY: 1, scaleX: 1, duration: 0.9, ease: "elastic.out(1, 0.4)" }, 0.56)
      .to(lidA, { rotationX: OPEN, duration: 1.1, ease: "back.out(1.7)" }, 0.5)
      .add(() => bus.emit("sfx", { name: "pop" }), 0.55)
      .add(() => { steamTl?.play(0); }, 0.8);
    // the tools fountain out of the mouth, nearest first
    const order = intros.map((el, i) => ({ el, i, d: toMouth(i) }))
      .sort((a, b) => Math.hypot(a.d.x, a.d.y) - Math.hypot(b.d.x, b.d.y));
    order.forEach(({ el, i, d }, n) => {
      const at = 0.66 + n * 0.07;
      // up out of the mouth, then down onto the table with a little bounce
      tl.fromTo(el, { x: d.x, autoAlpha: 0, scale: 0.2, rotation: (i % 2 ? 1 : -1) * 120 },
        { x: 0, autoAlpha: 1, scale: 1, rotation: 0, duration: 0.9, ease: "power3.out" }, at)
        .fromTo(el, { y: d.y }, { keyframes: [
          { y: Math.min(d.y, 0) - 70, duration: 0.42, ease: "power2.out" },
          { y: 0, duration: 0.6, ease: "bounce.out" },
        ] }, at);
    });
    tl.add(() => { ready = true; }, 1.5);
  }));
}
