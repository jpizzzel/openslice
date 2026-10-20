import "../styles/pages/slices.css";
import type { Page } from "../core/page";
import { gsap, ScrollTrigger, reducedMotion, finePointer } from "../core/motion";
import { bus } from "../core/bus";
import { SITE, STATUS_LABEL, TOOLS, type Tool } from "../data/site";
import { glyph, poster, scene, type GlyphId } from "../art";
import { esc, footerHTML, responsive, whenReady } from "./about/kit";

const DAYS: { d: string; long: string; what: string; g: GlyphId }[] = [
  { d: "Mon", long: "Monday", what: "Building", g: "laptop" },
  { d: "Tue", long: "Tuesday", what: "Building", g: "keyboard" },
  { d: "Wed", long: "Wednesday", what: "Building", g: "terminal" },
  { d: "Thu", long: "Thursday", what: "Building", g: "wrench" },
  { d: "Fri", long: "Friday", what: "Building", g: "dough" },
  { d: "Sat", long: "Saturday", what: "Slices", g: "pizza" },
  { d: "Sun", long: "Sunday", what: "Building", g: "coffee" },
];

const bySlug = new Map(TOOLS.map((t) => [t.slug, t]));
const toolName = (t: Tool) => (t.status === "prepping" ? "Classified" : t.name);
const sliceos = TOOLS.find((t) => t.slug === "sliceos");

function template() {
  return `<div class="p-slices">
  <section class="sl-hero" aria-labelledby="sl-title">
    <p class="sl-hero__kicker mono" aria-hidden="true"><span>Fig. 01</span><span>Where everything grows from</span></p>
    <h1 class="sl-hero__title" id="sl-title">
      <span class="sl-l"><span class="sl-li caps-red">The</span></span>
      <span class="sl-l"><span class="sl-li caps-red">Trunk</span></span>
      <span class="sl-hero__name serif"><span class="sl-l"><span class="sl-li"><em>Saturday Slices</em></span></span></span>
    </h1>
    <span class="sl-hero__box" aria-hidden="true">${glyph("pizza")}</span>
    <div class="sl-hero__copy">
      <p class="sl-hero__lede">A student run pizza place out of our house. It is the reason most of these tools exist, and the business we built SliceOS to run.</p>
      <dl class="sl-hero__meta">
        <div><dt class="label">Kitchen</dt><dd>${SITE.where}</dd></div>
        <div><dt class="label">Staff</dt><dd>Two roommates</dd></div>
        <div><dt class="label">Open</dt><dd>Saturdays</dd></div>
        <div><dt class="label">Runs on</dt><dd>${sliceos ? `<a class="u-link" href="/toolbox/${sliceos.slug}">${sliceos.name}</a>` : "SliceOS"}</dd></div>
      </dl>
      <a class="sl-btn" href="${SITE.trunk.href}" target="_blank" rel="noopener" data-cursor="Order">
        <span>Visit ${SITE.trunk.name}</span><span class="sl-btn__arr" aria-hidden="true">&#8599;</span>
      </a>
    </div>
  </section>

  <section class="sl-tree" aria-labelledby="sl-tree-h">
    <div class="sl-tree__pin">
      <header class="sl-tree__head">
        <p class="label">Fig. 02</p>
        <h2 id="sl-tree-h"><span class="caps-red">One trunk,</span> <em class="serif">many branches.</em></h2>
      </header>
      <div class="sl-tree__stage">
        <div class="sl-tree__art">${scene("tree")}</div>
        <p class="sl-tree__tag sl-tree__tag--branches"><span class="label">Branches</span><span>Tools</span></p>
        <p class="sl-tree__tag sl-tree__tag--trunk"><span class="label">Trunk</span><span>${SITE.trunk.name}</span></p>
        <p class="sl-tree__tag sl-tree__tag--roots"><span class="label">Roots</span><span>Two roommates</span></p>
        <div class="sl-tip" role="status" aria-live="polite" hidden>
          <span class="sl-tip__art" aria-hidden="true"></span>
          <span class="sl-tip__kind label"></span>
          <strong class="sl-tip__name"></strong>
          <span class="sl-tip__status mono"></span>
        </div>
      </div>
      <nav class="sl-tree__list" aria-label="Branches of the tree">
        <p class="label">Every branch</p>
        <ol>
          ${TOOLS.map(
            (t, i) => `<li><a href="/toolbox/${t.slug}" data-slug="${t.slug}" data-cursor="Open" style="--c:${t.color}">
              <span class="mono">${String(i + 1).padStart(2, "0")}</span>
              <span class="sl-tree__lname">${esc(toolName(t))}</span>
              <span class="sl-tree__lstatus label">${STATUS_LABEL[t.status]}</span>
            </a></li>`,
          ).join("")}
        </ol>
      </nav>
      <div class="sl-tree__progress" aria-hidden="true"><span></span></div>
    </div>
  </section>

  <section class="sl-week" aria-labelledby="sl-week-h">
    <header class="sl-week__head">
      <p class="label">Fig. 03</p>
      <h2 id="sl-week-h"><span class="caps-red">Saturday</span> <em class="serif">rhythm.</em></h2>
      <p class="sl-week__sub">Six days of building. One day of dough. Repeat until graduation, then keep going.</p>
    </header>
    <ol class="sl-week__strip">
      ${DAYS.map(
        (d) => `<li class="sl-day${d.d === "Sat" ? " sl-day--sat" : ""}">
          <span class="sl-day__d"><abbr title="${d.long}">${d.d}</abbr></span>
          <span class="sl-day__g" aria-hidden="true">${glyph(d.g)}</span>
          <span class="sl-day__what">${d.what}</span>
          <span class="sl-day__bar" aria-hidden="true"><span></span></span>
        </li>`,
      ).join("")}
    </ol>
    <div class="sl-week__ticker" aria-hidden="true"><div class="sl-week__tape">${[0, 1]
      // two runs for a seamless loop; render each glyph separately so svg ids stay unique
      .map(() => DAYS.map((d) => `<span${d.d === "Sat" ? ' class="is-sat"' : ""}>${d.d === "Sat" ? "Pizza day" : "Build day"}</span><i>${glyph("slice")}</i>`).join(""))
      .join("")}</div></div>
  </section>

  ${
    sliceos
      ? `<section class="sl-os" aria-labelledby="sl-os-h">
    <a class="sl-os__poster" href="/toolbox/${sliceos.slug}" data-cursor="Peek" aria-hidden="true" tabindex="-1">${poster(sliceos)}</a>
    <div class="sl-os__copy">
      <p class="label">Fig. 04 / ${esc(sliceos.kind)}</p>
      <h2 id="sl-os-h" class="sl-os__h"><span class="caps-red">${esc(sliceos.name)}</span><em class="serif">the back of house</em></h2>
      <p class="sl-os__blurb">${esc(sliceos.blurb)}</p>
      <ul class="sl-os__feat">${sliceos.features.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
      <p class="sl-os__note"><span class="sl-os__pill mono">${STATUS_LABEL[sliceos.status]}</span><span class="serif">Coming to the toolbox. We are cleaning it up so it can run your shop too.</span></p>
      <a class="sl-btn sl-btn--ink" href="/toolbox/${sliceos.slug}" data-cursor="Open"><span>Read about ${esc(sliceos.name)}</span><span class="sl-btn__arr" aria-hidden="true">&rarr;</span></a>
    </div>
  </section>`
      : ""
  }
  ${footerHTML()}
</div>`;
}

/** Pair fruits with branches. Prefer a matching data-slug, else spread fruits along the branch order. */
function pairFruits(branches: SVGPathElement[], fruits: SVGElement[]) {
  return fruits.map((f, i) => {
    const slug = f.dataset.slug;
    let bi = slug ? branches.findIndex((b) => b.dataset.slug === slug) : -1;
    if (bi < 0) bi = branches.length ? Math.min(branches.length - 1, Math.round(((i + 1) / fruits.length) * branches.length) - 1) : -1;
    return { f, bi: Math.max(0, bi) };
  });
}

/**
 * Fruits swing from their stems and leaves rustle when the pointer brushes
 * past: one damped angular spring per item, driven by pointer velocity.
 * Each item's drawing is wrapped in an inner <g> so the spring never fights
 * the GSAP scale tweens on the outer group. The ticker only runs while
 * something is still moving; item centres are cached and re-read lazily
 * after a scroll or resize (no layout reads in the frame loop).
 */
function makeSwing(stage: HTMLElement, fruits: SVGElement[], leaves: SVGElement[]) {
  if (!finePointer) return null;
  const NS = "http://www.w3.org/2000/svg";
  type Item = { g: SVGGElement; px: number; py: number; cx: number; cy: number; a: number; v: number; k: number; c: number; gain: number; max: number };
  const wrap = (el: SVGElement, k: number, c: number, gain: number, max: number, pivotTop: boolean): Item | null => {
    const g = document.createElementNS(NS, "g") as SVGGElement;
    while (el.firstChild) g.appendChild(el.firstChild);
    el.appendChild(g);
    let bb: DOMRect;
    try { bb = g.getBBox(); } catch { return null; }
    // fruits hang from the top of their stem, leaves pivot at their centre
    const px = bb.x + bb.width / 2, py = pivotTop ? bb.y : bb.y + bb.height / 2;
    return { g, px, py, cx: 0, cy: 0, a: 0, v: 0, k, c, gain, max };
  };
  const items = [
    ...fruits.map((f) => wrap(f, 60, 4.2, 0.09, 26, true)),
    ...leaves.map((l) => wrap(l, 160, 7, 0.16, 34, false)),
  ].filter((x): x is Item => !!x);
  if (!items.length) return null;

  let dirty = true, running = false, lx = 0, ly = 0, has = false;
  const measure = () => {
    dirty = false;
    for (const it of items) {
      const r = it.g.getBoundingClientRect();
      it.cx = r.left + r.width / 2; it.cy = r.top + r.height / 2;
    }
  };
  const tick = (_t: number, dms: number) => {
    const dt = Math.min(0.05, dms / 1000);
    let moving = false;
    for (const it of items) {
      if (it.a === 0 && it.v === 0) continue;
      it.v += (-it.k * it.a - it.c * it.v) * dt;
      it.a += it.v * dt;
      if (Math.abs(it.a) < 0.02 && Math.abs(it.v) < 0.05) { it.a = 0; it.v = 0; }
      else moving = true;
      it.g.setAttribute("transform", `rotate(${it.a.toFixed(2)} ${it.px.toFixed(1)} ${it.py.toFixed(1)})`);
    }
    if (!moving) { gsap.ticker.remove(tick); running = false; }
  };
  const move = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    if (dirty) measure();
    if (!has) { lx = e.clientX; ly = e.clientY; has = true; return; }
    const vx = e.clientX - lx, vy = e.clientY - ly;
    lx = e.clientX; ly = e.clientY;
    const R = 90;
    for (const it of items) {
      const dx = e.clientX - it.cx, dy = e.clientY - it.cy;
      const d2 = dx * dx + dy * dy;
      if (d2 > R * R) continue;
      const fall = 1 - Math.sqrt(d2) / R;
      // horizontal sweeps push hardest; a little vertical for leaves
      it.v += (vx + vy * 0.25 * Math.sign(dx || 1)) * it.gain * 60 * fall;
      it.v = Math.max(-it.max * 8, Math.min(it.max * 8, it.v));
      if (!running) { running = true; gsap.ticker.add(tick); }
    }
  };
  const leave = () => { has = false; };
  const stale = () => { dirty = true; };
  stage.addEventListener("pointermove", move, { passive: true });
  stage.addEventListener("pointerleave", leave);
  window.addEventListener("scroll", stale, { passive: true });
  window.addEventListener("resize", stale);
  return () => {
    stage.removeEventListener("pointermove", move);
    stage.removeEventListener("pointerleave", leave);
    window.removeEventListener("scroll", stale);
    window.removeEventListener("resize", stale);
    gsap.ticker.remove(tick);
  };
}

const page: Page = {
  title: "The Trunk",
  section: "Slices",
  mount({ root, first }) {
    root.innerHTML = template();
    const el = root.querySelector<HTMLElement>(".p-slices")!;
    let alive = true;
    const offs: (() => void)[] = [];
    const ctx = gsap.context(() => {}, el);

    const stage = el.querySelector<HTMLElement>(".sl-tree__stage")!;
    const svg = stage.querySelector<SVGSVGElement>(".sl-tree__art svg");
    const branches = svg ? [...svg.querySelectorAll<SVGPathElement>('[data-part="branch"]')] : [];
    const fruits = svg ? [...svg.querySelectorAll<SVGElement>('[data-part="fruit"]')] : [];
    const pairs = pairFruits(branches, fruits);
    const links = new Map([...el.querySelectorAll<HTMLAnchorElement>(".sl-tree__list a")].map((a) => [a.dataset.slug!, a]));

    // Branch drawing setup: pathLength="1" makes the dash math trivial.
    branches.forEach((b) => {
      if (!b.getAttribute("pathLength")) b.setAttribute("pathLength", "1");
      b.style.strokeDasharray = "1";
    });
    fruits.forEach((f) => {
      f.style.transformBox = "fill-box";
      f.style.transformOrigin = "50% 50%";
      f.style.cursor = "pointer";
      // keyboard: every fruit is a real stop that opens its tool
      const t = bySlug.get(f.dataset.slug || "");
      if (t) {
        f.setAttribute("tabindex", "0");
        f.setAttribute("role", "link");
        f.setAttribute("aria-label", `${toolName(t)}, ${STATUS_LABEL[t.status]}`);
      }
    });
    if (svg && fruits.length) {
      // the fruits are focusable links, so the drawing can't be aria-hidden
      svg.removeAttribute("aria-hidden");
      svg.removeAttribute("focusable");
      svg.setAttribute("role", "group");
      svg.setAttribute("aria-label", "The tree: Saturday Slices is the trunk, every tool is a branch");
    }
    const leaves = svg ? [...svg.querySelectorAll<SVGGElement>('[data-part="leaf"]')] : [];
    const swing = reducedMotion ? null : makeSwing(stage, fruits, leaves);
    if (swing) offs.push(swing);

    // Tooltip card for fruits.
    const tip = el.querySelector<HTMLElement>(".sl-tip")!;
    const showTip = (f: SVGElement) => {
      const t = bySlug.get(f.dataset.slug || "");
      if (!t) return;
      tip.querySelector(".sl-tip__art")!.innerHTML = glyph(t.glyph);
      tip.querySelector(".sl-tip__kind")!.textContent = t.kind;
      tip.querySelector(".sl-tip__name")!.textContent = toolName(t);
      tip.querySelector(".sl-tip__status")!.textContent = STATUS_LABEL[t.status];
      tip.style.setProperty("--c", t.color);
      const fr = f.getBoundingClientRect();
      const sr = stage.getBoundingClientRect();
      const x = fr.left + fr.width / 2 - sr.left;
      const y = fr.top - sr.top;
      tip.hidden = false;
      const flip = x > sr.width * 0.66;
      tip.classList.toggle("is-flip", flip);
      // no room above the fruit (top of the stage or under the fixed header): hang it below
      const below = fr.top - tip.offsetHeight - 16 < Math.max(0, sr.top) + 8 || fr.top - tip.offsetHeight - 16 < 72;
      tip.classList.toggle("is-below", below);
      // keep the card inside the stage horizontally (small screens)
      const tw = tip.offsetWidth, anchor = flip ? 0.9 : 0.5;
      const left = Math.min(Math.max(x - tw * anchor, 0), Math.max(0, sr.width - tw));
      gsap.killTweensOf(tip);
      gsap.set(tip, { x: left + tw * anchor, y: below ? y + fr.height : y });
      gsap.fromTo(tip, { autoAlpha: 0, scale: 0.85, yPercent: below ? 0 : -90 }, { autoAlpha: 1, scale: 1, yPercent: below ? 12 : -110, duration: 0.45, ease: "back.out(2)" });
      links.get(t.slug)?.classList.add("is-hot");
      if (!reducedMotion && f.dataset.shown !== "0") gsap.to(f, { scale: 1.18, duration: 0.5, ease: "back.out(3)", overwrite: "auto" });
      bus.emit("sfx", { name: "tick" });
    };
    const hideTip = (f: SVGElement) => {
      gsap.to(tip, { autoAlpha: 0, duration: 0.2, onComplete: () => { tip.hidden = true; } });
      links.get(f.dataset.slug || "")?.classList.remove("is-hot");
      if (!reducedMotion && f.dataset.shown !== "0") gsap.to(f, { scale: 1, duration: 0.5, ease: "back.out(3)", overwrite: "auto" });
    };
    fruits.forEach((f) => {
      const enter = () => showTip(f);
      const leave = () => hideTip(f);
      const click = () => {
        const a = links.get(f.dataset.slug || "");
        if (a) a.click();
      };
      const key = (e: KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); click(); }
      };
      f.addEventListener("pointerenter", enter);
      f.addEventListener("pointerleave", leave);
      f.addEventListener("focus", enter);
      f.addEventListener("blur", leave);
      f.addEventListener("keydown", key);
      f.addEventListener("click", click);
      offs.push(() => {
        f.removeEventListener("pointerenter", enter);
        f.removeEventListener("pointerleave", leave);
        f.removeEventListener("focus", enter);
        f.removeEventListener("blur", leave);
        f.removeEventListener("keydown", key);
        f.removeEventListener("click", click);
      });
    });
    // Hovering a list entry lights up its fruit.
    links.forEach((a, slug) => {
      const f = fruits.find((x) => x.dataset.slug === slug);
      if (!f) return;
      const on = () => showTip(f);
      const off = () => hideTip(f);
      a.addEventListener("pointerenter", on);
      a.addEventListener("pointerleave", off);
      a.addEventListener("focus", on);
      a.addEventListener("blur", off);
      offs.push(() => {
        a.removeEventListener("pointerenter", on);
        a.removeEventListener("pointerleave", off);
        a.removeEventListener("focus", on);
        a.removeEventListener("blur", off);
      });
    });

    const cleanup = () => {
      alive = false;
      offs.forEach((f) => f());
      gsap.killTweensOf([tip, ...fruits]);
      ctx.revert();
    };

    if (reducedMotion) {
      el.classList.add("is-static");
      branches.forEach((b) => (b.style.strokeDashoffset = "0"));
      return cleanup;
    }

    // Hero intro.
    ctx.add(() => {
      gsap.set(".sl-li", { yPercent: 115 });
      gsap.set(".sl-hero__box", { autoAlpha: 0, scale: 0.6, rotation: -30 });
      gsap.set(".sl-hero__copy > *, .sl-hero__kicker", { autoAlpha: 0, y: 20 });
    });
    whenReady(first, () => alive, () =>
      ctx.add(() => {
        gsap.timeline({ defaults: { ease: "expo.out" } })
          .to(".sl-li", { yPercent: 0, duration: 1.4, stagger: 0.12 })
          .to(".sl-hero__box", { autoAlpha: 1, scale: 1, rotation: 8, duration: 1.4, ease: "elastic.out(1, 0.5)" }, 0.35)
          .to(".sl-hero__copy > *, .sl-hero__kicker", { autoAlpha: 1, y: 0, duration: 1, stagger: 0.06 }, 0.5);
      }),
    );

    ctx.add(() => {
      gsap.to(".sl-hero__box", { yPercent: 60, rotation: 40, ease: "none", scrollTrigger: { trigger: ".sl-hero", start: "top top", end: "bottom top", scrub: true } });

      // Saturday rhythm: days drop in, Saturday lands last with a bounce.
      const days = gsap.utils.toArray<HTMLElement>(".sl-day");
      gsap.from(days, { y: 60, autoAlpha: 0, duration: 1, ease: "expo.out", stagger: 0.07, scrollTrigger: { trigger: ".sl-week__strip", start: "top 82%", once: true } });
      gsap.fromTo(".sl-day__bar > span", { scaleY: 0 }, { scaleY: 1, duration: 1.2, ease: "expo.out", stagger: 0.07, delay: 0.3, scrollTrigger: { trigger: ".sl-week__strip", start: "top 82%", once: true } });

      // A highlight that walks through the week and rests on Saturday.
      const walk = gsap.timeline({ repeat: -1, repeatDelay: 0.6, paused: true });
      days.forEach((d, i) => {
        const sat = d.classList.contains("sl-day--sat");
        walk.to(d, { y: sat ? -18 : -8, duration: sat ? 0.5 : 0.22, ease: sat ? "back.out(3)" : "power2.out" }, i * 0.28)
          .to(d.querySelector(".sl-day__g"), { rotation: sat ? 360 : 12, duration: sat ? 0.9 : 0.3, ease: sat ? "expo.out" : "power2.out" }, i * 0.28)
          .to(d, { y: 0, duration: 0.5, ease: "power3.out" }, i * 0.28 + (sat ? 1.2 : 0.25))
          .to(d.querySelector(".sl-day__g"), { rotation: 0, duration: 0.4, ease: "power2.out" }, i * 0.28 + (sat ? 1.2 : 0.3));
      });
      const tape = gsap.to(".sl-week__tape", { xPercent: -50, duration: 26, ease: "none", repeat: -1, paused: true });
      ScrollTrigger.create({
        trigger: ".sl-week",
        start: "top bottom",
        end: "bottom top",
        onToggle: (s) => {
          s.isActive ? walk.play() : walk.pause();
          s.isActive ? tape.play() : tape.pause();
        },
      });

      // SliceOS poster tilts as it scrolls by.
      gsap.fromTo(".sl-os__poster", { rotation: -8, y: 80 }, { rotation: 3, y: -40, ease: "none", scrollTrigger: { trigger: ".sl-os", start: "top bottom", end: "bottom top", scrub: true } });
      el.querySelectorAll<HTMLElement>(".sl-os__h").forEach((h) => {
        gsap.from(h.children, { yPercent: 100, opacity: 0, duration: 1.2, ease: "expo.out", stagger: 0.1, scrollTrigger: { trigger: h, start: "top 85%", once: true } });
      });
    });

    // Poster tilt follows the pointer on desktop.
    if (finePointer) {
      const p = el.querySelector<HTMLElement>(".sl-os__poster");
      if (p) {
        const rx = gsap.quickTo(p.firstElementChild, "rotationY", { duration: 0.6, ease: "power3.out" });
        const ry = gsap.quickTo(p.firstElementChild, "rotationX", { duration: 0.6, ease: "power3.out" });
        const move = (e: PointerEvent) => {
          const r = p.getBoundingClientRect();
          rx(((e.clientX - r.left) / r.width - 0.5) * 16);
          ry(-((e.clientY - r.top) / r.height - 0.5) * 16);
        };
        const out = () => { rx(0); ry(0); };
        p.addEventListener("pointermove", move);
        p.addEventListener("pointerleave", out);
        offs.push(() => {
          p.removeEventListener("pointermove", move); p.removeEventListener("pointerleave", out);
          // paused quickTo tweens stay in the global timeline and would retain the page
          rx.tween.kill(); ry.tween.kill();
        });
      }
    }

    // The tree: pinned, branches draw with scroll, fruit springs in when its branch completes.
    const buildTree = (pinIt: boolean) => {
      // desktop "pin" is CSS sticky inside a tall section (see slices.css): no
      // pin spacer, no reparenting, no layout shift while scrolling
      const n = Math.max(1, branches.length);
      const spanOf = (i: number) => ({ start: (i / n) * 0.82, end: ((i + 1) / n) * 0.82 + 0.06 });
      const thresholds = pairs.map(({ bi }) => Math.min(0.99, spanOf(bi).end));
      fruits.forEach((f) => { f.dataset.shown = "0"; });
      gsap.set(fruits, { scale: 0, opacity: 0 });
      gsap.set(branches, { strokeDashoffset: 1, opacity: 0 });
      gsap.set(leaves, { scale: 0, transformOrigin: "50% 50%" });
      gsap.set(".sl-tree__tag", { autoAlpha: 0, y: 20 });
      gsap.set(".sl-tree__list li", { autoAlpha: 0.25 });

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: pinIt ? ".sl-tree" : ".sl-tree__pin",
          start: pinIt ? "top top" : "top 75%",
          end: pinIt ? "bottom bottom" : "bottom 60%",
          scrub: 0.6,
          onUpdate: (s) => {
            const p = s.progress;
            pairs.forEach(({ f }, i) => {
              const want = p >= thresholds[i];
              if (want && f.dataset.shown !== "1") {
                f.dataset.shown = "1";
                gsap.to(f, { scale: 1, opacity: 1, duration: 0.9, ease: "elastic.out(1.1, 0.45)", overwrite: "auto" });
                links.get(f.dataset.slug || "")?.parentElement?.classList.add("is-on");
                bus.emit("sfx", { name: "pop" });
              } else if (!want && f.dataset.shown === "1") {
                f.dataset.shown = "0";
                gsap.to(f, { scale: 0, opacity: 0, duration: 0.3, ease: "power2.in", overwrite: "auto" });
                links.get(f.dataset.slug || "")?.parentElement?.classList.remove("is-on");
              }
            });
          },
        },
      });
      // Placeholder art may not have branches yet; keep the timeline a real length.
      tl.to({}, { duration: 1 }, 0);
      branches.forEach((b, i) => {
        const s = spanOf(i);
        tl.to(b, { strokeDashoffset: 0, duration: s.end - s.start }, s.start)
          .to(b, { opacity: 1, duration: 0.01 }, s.start);
        // the two leaves on this branch sprout as the stroke passes them
        [0.45, 0.72].forEach((at, j) => {
          const leaf = leaves[i * 2 + j];
          if (leaf) tl.to(leaf, { scale: 1, duration: 0.05, ease: "back.out(3)" }, s.start + (s.end - s.start) * at * 0.9);
        });
      });
      tl.fromTo(".sl-tree__progress > span", { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0)
        .to(".sl-tree__tag--roots", { autoAlpha: 1, y: 0, duration: 0.12 }, 0)
        .to(".sl-tree__tag--trunk", { autoAlpha: 1, y: 0, duration: 0.12 }, 0.12)
        .to(".sl-tree__tag--branches", { autoAlpha: 1, y: 0, duration: 0.12 }, 0.3)
        .to(".sl-tree__list li", { autoAlpha: 1, duration: 0.2, stagger: 0.1 }, 0.3)
        .fromTo(".sl-tree__art", { scale: 0.94 }, { scale: 1, duration: 1 }, 0);
    };

    offs.push(responsive(el, "(min-width: 900px)", () => buildTree(true), () => buildTree(false)));

    return cleanup;
  },
};

export default page;
