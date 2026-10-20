import "../styles/pages/toolbox.css";
import type { Page } from "../core/page";
import { gsap, ScrollTrigger, lenis, reducedMotion, finePointer } from "../core/motion";
import { loaderGone } from "../core/ready";
import { bus } from "../core/bus";
import { SITE, STATUS_LABEL, TOOLS, type Tool } from "../data/site";
import { poster } from "../art/index";
import {
  arrowSVG, esc, footerHTML, isClassified, makers, pad, replacesHTML, statusPill, STATUS_TONE,
} from "./toolbox/shared";

const N = TOOLS.length;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
/** small per-card "tossed on the table" jitter, deterministic */
const JIT = TOOLS.map((_, i) => [(((i * 37) % 7) - 3) * 0.9, (((i * 53) % 5) - 2) * 1.2]);
/** each ticket hangs a little crooked on the rail, and swings at its own pace (paper length) */
const REST = TOOLS.map((_, i) => (((i * 29) % 5) - 2) * 0.7);
const MASS = TOOLS.map((_, i) => 0.82 + ((i * 41) % 7) * 0.06);

function metaValues(t: Tool) {
  return {
    makers: makers(t).map((p) => `<span class="tb-line">${esc(p.name)}</span>`).join(""),
    platform: esc(t.platform),
    status: statusPill(t),
    replaces: replacesHTML(t),
    year: String(t.year),
  };
}
type MetaKey = keyof ReturnType<typeof metaValues>;
const META: [MetaKey, string][] = [
  ["makers", "Made by"],
  ["platform", "Platform"],
  ["status", "Status"],
  ["replaces", "Replaces"],
  ["year", "Year"],
];

/** One paper order ticket on the rail. */
function ticketHTML(t: Tool, i: number) {
  const ppl = makers(t).map((p) => esc(p.first)).join(" + ");
  const cls = isClassified(t);
  return `
        <li class="tb-tk" data-i="${i}" style="--i:${i};--tone:${STATUS_TONE[t.status]}">
          <a class="tb-tk__a" href="/toolbox/${t.slug}" data-i="${i}" data-cursor="Open" draggable="false"
             aria-label="Ticket ${pad(i + 1)}: ${esc(t.name)}, ${esc(t.kind)}, ${esc(STATUS_LABEL[t.status])}">
            <span class="tb-tk__shadow" aria-hidden="true"></span>
            <span class="tb-tk__paper" aria-hidden="true">
              <span class="tb-tk__top"><span>Tkt</span><b class="tb-tk__no">#${pad(i + 1)}</b></span>
              <span class="tb-tk__name">${esc(t.name)}</span>
              <span class="tb-tk__kind">${esc(t.kind)}</span>
              <span class="tb-tk__status"><i></i>${esc(STATUS_LABEL[t.status])}</span>
              <span class="tb-tk__more">
                <span class="tb-tk__kv"><span>By</span><span>${ppl}</span></span>
                <span class="tb-tk__kv"><span>For</span><span>${esc(t.platform)}</span></span>
                <span class="tb-tk__kv"><span>Sub</span><span>${cls ? `<span class="rd rd--bar" style="--w:5.5em"></span>` : esc(t.replaces ?? "Homemade")}</span></span>
                <span class="tb-tk__kv"><span>Yr</span><span>${t.year}</span></span>
              </span>
              <span class="tb-tk__qty"><span>Qty 1</span><span>$0.00</span></span>
              <span class="tb-tk__go">Open ticket ${arrowSVG("right")}</span>
            </span>
          </a>
        </li>`;
}

/** Split-flap digit: static halves show the resting digit, two flaps carry a change. */
const flipDigit = (d: string) => `
        <span class="tb-flip">
          <span class="tb-flip__h is-top"><span>${d}</span></span>
          <span class="tb-flip__h is-bot"><span>${d}</span></span>
          <span class="tb-flip__f is-top"><span>${d}</span></span>
          <span class="tb-flip__f is-bot"><span>${d}</span></span>
        </span>`;

function template() {
  const first = metaValues(TOOLS[0]);
  return `
<div class="p-toolbox">
  <section class="tb-stage" aria-labelledby="tb-h1">
    <header class="tb-head">
      <h1 id="tb-h1" class="tb-h1">
        <span class="tb-mask"><span class="tb-rise tb-h1__k">Toolbox</span></span>
        <span class="tb-mask"><span class="tb-rise tb-h1__n">${pad(N)} orders on the rail</span></span>
      </h1>
      <p class="tb-tag serif"><span class="tb-mask"><span class="tb-rise">${esc(SITE.tagline)}</span></span></p>
      <p class="tb-hint mono" aria-hidden="true"><span class="tb-mask"><span class="tb-rise">Scroll / drag / arrow keys</span></span></p>
    </header>

    <div class="tb-cards" role="group" aria-label="Tool posters">
      <span class="tb-table" aria-hidden="true"><i></i></span>
      ${TOOLS.map((t, i) => `
      <a class="tb-card" href="/toolbox/${t.slug}" data-i="${i}" data-cursor="Open" draggable="false" tabindex="-1" style="--c:${t.color}">
        <span class="tb-card__in">
          <span class="tb-card__art">${poster(t)}</span>
          <span class="tb-card__sheen" aria-hidden="true"><i></i></span>
          <span class="tb-card__shade" aria-hidden="true"></span>
          <span class="tb-card__cap"><b>${pad(i + 1)}</b> ${esc(t.name)}<span class="sr-only">, ${esc(t.kind)}</span></span>
        </span>
      </a>`).join("")}
    </div>

    <nav class="tb-rail" aria-label="Order rail, all slices">
      <span class="tb-rail__bar" aria-hidden="true"><i class="tb-rail__sheen"></i><b></b><b></b></span>
      <ol class="tb-rail__list" style="--last:${N - 1}">${TOOLS.map(ticketHTML).join("")}
      </ol>
    </nav>

    <dl class="tb-meta" aria-live="polite">
      ${META.map(([k, label]) => `
      <div class="tb-meta__pair" data-k="${k}">
        <dt class="label">${label}</dt>
        <dd><span class="mv"><span class="mv__in">${first[k]}</span></span></dd>
      </div>`).join("")}
    </dl>

    <div class="tb-serve">
      <div class="tb-sign" aria-hidden="true"><div class="tb-sign__box">
        <span class="tb-sign__k"><i></i>Now serving</span>
        <span class="tb-sign__digits">${flipDigit("0")}${flipDigit("1")}</span>
        <span class="tb-sign__of">Ticket no. / ${pad(N)} on the rail</span>
      </div></div>
      <p class="sr-only" aria-live="polite"><span class="tb-serve__sr">Now serving ticket 01 of ${pad(N)}: ${esc(TOOLS[0].name)}</span></p>
      <div class="tb-ctrl">
        <button class="tb-arrow" data-dir="-1" aria-label="Previous slice">${arrowSVG("up")}</button>
        <button class="tb-arrow" data-dir="1" aria-label="Next slice">${arrowSVG("down")}</button>
        <a class="tb-cta" href="/toolbox/${TOOLS[0].slug}" data-cursor="Open">
          <span class="tb-cta__k">View slice</span>
          <span class="tb-cta__name">${esc(TOOLS[0].name)}</span>
          <svg viewBox="0 0 10 12" aria-hidden="true"><path d="M0 0l10 6-10 6z" fill="currentColor"/></svg>
        </a>
      </div>
    </div>
  </section>
  ${footerHTML()}
</div>`;
}

const page: Page = {
  title: "Toolbox",
  section: "Toolbox",
  mount({ root, first }) {
    root.innerHTML = template();
    const el = root.querySelector<HTMLElement>(".p-toolbox")!;
    const stage = el.querySelector<HTMLElement>(".tb-stage")!;
    const cardsWrap = el.querySelector<HTMLElement>(".tb-cards")!;
    const cards = [...el.querySelectorAll<HTMLAnchorElement>(".tb-card")];
    const shades = cards.map((c) => c.querySelector<HTMLElement>(".tb-card__shade")!);
    const rail = el.querySelector<HTMLElement>(".tb-rail")!;
    const railList = el.querySelector<HTMLElement>(".tb-rail__list")!;
    const railSheen = el.querySelector<HTMLElement>(".tb-rail__sheen")!;
    const tks = [...el.querySelectorAll<HTMLElement>(".tb-tk")];
    const tkLinks = tks.map((t) => t.querySelector<HTMLAnchorElement>(".tb-tk__a")!);
    const cta = el.querySelector<HTMLAnchorElement>(".tb-cta")!;
    const ctaName = cta.querySelector<HTMLElement>(".tb-cta__name")!;
    const serveSr = el.querySelector<HTMLElement>(".tb-serve__sr")!;
    const flips = [...el.querySelectorAll<HTMLElement>(".tb-flip")];
    const pairs = new Map(
      [...el.querySelectorAll<HTMLElement>(".tb-meta__pair")].map((p) => [p.dataset.k as MetaKey, p.querySelector<HTMLElement>(".mv")!])
    );

    const sheens = cards.map((c) => c.querySelector<HTMLElement>(".tb-card__sheen")!);
    const sheenBands = sheens.map((s) => s.firstElementChild as HTMLElement);
    const table = el.querySelector<HTMLElement>(".tb-table")!;

    type Off = () => void;
    const listen = <K extends keyof WindowEventMap>(
      bag: Off[], t: Window | HTMLElement, type: K, fn: (e: WindowEventMap[K]) => void, opts?: AddEventListenerOptions,
    ) => {
      t.addEventListener(type, fn as EventListener, opts);
      bag.push(() => t.removeEventListener(type, fn as EventListener, opts));
    };
    const offs: Off[] = [];
    const on = <K extends keyof WindowEventMap>(t: Window | HTMLElement, type: K, fn: (e: WindowEventMap[K]) => void, opts?: AddEventListenerOptions) =>
      listen(offs, t, type, fn, opts);

    const ctx = gsap.context(() => {}, el);
    let active = -1;
    /** Current layout mode. `owns()` says whether arrow keys should drive the stack right now. */
    let mode: { go(i: number): void; owns(target: Element): boolean; kick(i: number, prev: number): void } =
      { go() {}, owns: () => false, kick() {} };
    let suppressClick = false;
    let leaving = false;
    offs.push(bus.on("route:before", () => { leaving = true; }));

    // ---------- "now serving" split-flap sign ----------
    type FlipState = { d: string; tl: gsap.core.Timeline | null };
    const flipState: FlipState[] = flips.map((f) => ({ d: f.querySelector("span span")!.textContent!, tl: null }));
    const setFlip = (k: number, d: string, instant: boolean) => {
      const f = flips[k];
      const s = flipState[k];
      // finish any flap still in the air: its onComplete leaves the static halves on the right digit
      s.tl?.progress(1).kill();
      s.tl = null;
      if (s.d === d) return;
      const [top, bot, ft, fb] = [...f.children].map((c) => c.firstElementChild as HTMLElement);
      const old = s.d;
      s.d = d;
      if (instant || reducedMotion) {
        top.textContent = bot.textContent = ft.textContent = fb.textContent = d;
        return;
      }
      const flapT = f.children[2] as HTMLElement;
      const flapB = f.children[3] as HTMLElement;
      top.textContent = d;
      bot.textContent = old;
      ft.textContent = old;
      fb.textContent = d;
      ctx.add(() => {
        s.tl = gsap.timeline({
          onComplete: () => {
            bot.textContent = d;
            ft.textContent = d;
            gsap.set([flapT, flapB], { autoAlpha: 0, rotationX: 0 });
          },
        })
          .set(flapT, { autoAlpha: 1, rotationX: 0 })
          .set(flapB, { autoAlpha: 1, rotationX: 90 })
          .to(flapT, { rotationX: -90, duration: 0.16, ease: "power2.in" }, k * 0.04)
          .set(flapT, { autoAlpha: 0 })
          .to(flapB, { rotationX: 0, duration: 0.3, ease: "back.out(2.4)" });
      });
    };
    const setSign = (n: number, instant: boolean) => {
      const s = pad(n);
      setFlip(0, s[0], instant);
      setFlip(1, s[1], instant);
    };

    // ---------- active state (shared) ----------
    const swapMeta = (t: Tool, instant: boolean) => {
      const vals = metaValues(t);
      META.forEach(([k], n) => {
        const mask = pairs.get(k)!;
        const olds = [...mask.children] as HTMLElement[];
        const next = document.createElement("span");
        next.className = "mv__in";
        next.innerHTML = vals[k];
        mask.appendChild(next);
        if (instant || reducedMotion) { olds.forEach((o) => o.remove()); return; }
        ctx.add(() => {
          gsap.killTweensOf(olds);
          gsap.to(olds, { yPercent: -110, duration: 0.38, ease: "power3.in", delay: n * 0.03, onComplete: () => olds.forEach((o) => o.remove()) });
          gsap.fromTo(next, { yPercent: 110 }, { yPercent: 0, duration: 0.8, ease: "expo.out", delay: 0.12 + n * 0.04 });
        });
      });
    };

    const setActive = (i: number, instant = false) => {
      if (i === active) return;
      const prev = active;
      active = i;
      const t = TOOLS[i];
      tkLinks.forEach((a, n) => (n === i ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current")));
      tks.forEach((tk, n) => tk.classList.toggle("is-active", n === i));
      cards.forEach((c, n) => c.classList.toggle("is-active", n === i));
      cta.href = `/toolbox/${t.slug}`;
      cta.setAttribute("aria-label", `View slice: ${t.name}`);
      ctaName.textContent = t.name;
      serveSr.textContent = `Now serving ticket ${pad(i + 1)} of ${pad(N)}: ${t.name}`;
      el.style.setProperty("--active", t.color);
      setSign(i + 1, instant);
      if (prev !== -1) {
        // the meta panel is only on screen in the flat layout; the pinned rail carries it on the ticket
        swapMeta(t, instant || el.classList.contains("is-pinned"));
        mode.kick(i, prev);
        bus.emit("sfx", { name: "tick" });
      }
    };

    // ---------- PINNED 3D STACK + TICKET RAIL (desktop, motion ok) ----------
    function setupPinned() {
      el.classList.add("is-pinned");
      const mo: Off[] = [];
      const state = { p: 0, mx: 0, my: 0 };
      let vw = innerWidth / 100;
      let vh = innerHeight / 100;
      let settled = 0;
      let auto = false;
      let autoTimer = 0;
      let snapTimer = 0;
      // front card geometry, cached so hover never reads layout from a tilting element
      let cx = 0, cy = 0, cw = 1, ch = 1;
      // ticket pivots (stage coordinates), cached on refresh
      let piv: { x: number; y0: number; y1: number }[] = [];

      const measure = () => {
        vw = innerWidth / 100;
        vh = innerHeight / 100;
        cw = cards[0].offsetWidth || 1;
        ch = cards[0].offsetHeight || 1;
        cx = cards[0].offsetLeft + cw / 2;
        cy = cards[0].offsetTop + ch / 2;
        piv = tks.map((tk) => ({
          x: rail.offsetLeft + railList.offsetLeft + tk.offsetLeft + tk.offsetWidth / 2,
          y0: rail.offsetTop + railList.offsetTop + tk.offsetTop,
          y1: rail.offsetTop + railList.offsetTop + tk.offsetTop + tk.offsetHeight,
        }));
      };

      // style writes are cached per node so a frame only touches what actually changed
      type Prop = "transform" | "opacity" | "visibility" | "zIndex";
      const last = new Map<HTMLElement, Partial<Record<Prop, string>>>();
      const put = (n: HTMLElement, prop: Prop, v: string) => {
        let c = last.get(n);
        if (!c) last.set(n, (c = {}));
        if (c[prop] === v) return;
        c[prop] = v;
        n.style[prop] = v;
      };

      // ---- ticket pendulums: angle th (deg), angular velocity w (deg/s), pulled-forward blend a ----
      const sw = tks.map((_, i) => ({ th: REST[i], w: 0, a: i === active ? 1 : 0, push: 0 }));
      const K = 46; // stiffness, about 1.1 swings a second
      const C = 1.5; // damping, a few lazy swings before it settles
      let lastP = 0;
      let asleep = false;
      let visible = true;
      const wake = () => { asleep = false; };
      const simulate = (dt: number) => {
        const dp = (state.p - lastP) / dt; // cards per second: the "draft" off the moving stack
        lastP = state.p;
        let busy = Math.abs(dp) > 0.01;
        sw.forEach((s, i) => {
          const isA = i === active ? 1 : 0;
          const rest = REST[i] * (1 - s.a);
          const acc = -K * (s.th - rest) - C * s.w - dp * 150 * MASS[i];
          s.w += acc * dt + s.push;
          s.push = 0;
          s.th += s.w * dt;
          s.a += (isA - s.a) * (1 - Math.exp(-dt * 9));
          if (Math.abs(s.w) > 0.05 || Math.abs(s.th - rest) > 0.03 || Math.abs(isA - s.a) > 0.002) busy = true;
          const pull = s.a;
          put(tks[i], "transform",
            `translate3d(0,${(pull * 54).toFixed(1)}px,0) rotate(${s.th.toFixed(2)}deg) scale(${(1 + pull * 0.07).toFixed(3)})`);
        });
        put(railSheen, "transform", `translate3d(${(state.p / (N - 1)) * 100 - 50}%,0,0)`);
        if (!busy) asleep = true;
      };

      let queued = false;
      const request = () => { queued = true; wake(); };
      const tick = (_t: number, dms: number) => {
        if (queued) { queued = false; render(); }
        if (!visible || asleep || leaving) { lastP = state.p; return; }
        simulate(clamp(dms / 1000, 1 / 240, 1 / 30));
      };
      const render = () => {
        const p = state.p;
        cards.forEach((c, i) => {
          const d = i - p;
          const [jz, jy] = JIT[i];
          let x: number, y: number, z: number, rx: number, ry: number, rz: number, o: number, sh: number;
          if (d <= 0) {
            const k = -d;
            x = k * 21 * vw + k * k * 4 * vw;
            y = -k * 57 * vh - k * k * 8 * vh;
            z = k * 120;
            rx = 14 + k * 26;
            ry = -24 - k * 8;
            rz = -3 + jz + k * 9;
            // gone before it reaches the header: no poster corners peeking under the chrome
            o = clamp(1 - (k - 0.45) * 1.8, 0, 1);
            sh = 0;
          } else {
            x = -d * 12 * vw + jy * vw * 0.4 * Math.min(d, 1);
            y = d * 31 * vh;
            z = -d * 320;
            rx = 14 + d * 10;
            ry = -24 + d * 4;
            rz = -3 + jz * Math.min(d, 1) * 1.6 - d * 4;
            o = d < 2.4 ? 1 : clamp(1 - (d - 2.4) / 0.7, 0, 1);
            sh = clamp(d * 0.3, 0, 0.62);
          }
          const near = clamp(1 - Math.abs(d), 0, 1);
          rx += state.my * -9 * near;
          ry += state.mx * 12 * near;
          const hidden = o < 0.01;
          put(c, "visibility", hidden ? "hidden" : "visible");
          if (hidden) return; // nothing to draw: skip the transform work for off-stage posters
          put(c, "transform", `perspective(1700px) translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,${z.toFixed(1)}px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg)`);
          put(c, "opacity", o.toFixed(3));
          put(c, "zIndex", String(d <= 0 ? 200 - Math.round(-d * 10) : 100 - Math.round(d * 10)));
          put(shades[i], "opacity", sh.toFixed(2));
          // specular sheen: a band of light glides across each poster as it lands, and follows the hover tilt
          if (Math.abs(d) < 1.3) {
            put(sheens[i], "opacity", (near * 0.9 + 0.1).toFixed(2));
            put(sheenBands[i], "transform", `translate3d(${(d * 150 - 20 + state.mx * 34).toFixed(1)}%,0,0)`);
          } else {
            put(sheens[i], "opacity", "0");
          }
        });
        setActive(clamp(Math.round(p), 0, N - 1));
        const settle = 1 - clamp(Math.abs(p - Math.round(p)) * 5, 0, 1);
        put(cta, "opacity", (0.35 + settle * 0.65).toFixed(2));
        // the "table" shadow under the front poster: tight when it lands, loose mid-flight, slides against the tilt
        const lift = 1 - settle;
        put(table, "transform", `translate3d(${(-state.mx * 26).toFixed(1)}px, ${(-state.my * 10 + lift * 22).toFixed(1)}px, 0) scale(${(1 + lift * 0.22).toFixed(3)}, ${(1 + lift * 0.4).toFixed(3)})`);
        put(table, "opacity", (0.75 - lift * 0.4).toFixed(2));
      };

      measure();

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: stage,
          start: "top top",
          end: () => `+=${Math.round((N - 1) * innerHeight * 0.8)}`,
          pin: true,
          scrub: 0.75,
          invalidateOnRefresh: true,
          onRefresh: () => { measure(); last.clear(); render(); wake(); },
          onUpdate: () => scheduleSnap(),
        },
      });
      tl.to(state, { p: N - 1, ease: "none", onUpdate: request });
      // one ticker for the stack and the rail: posters render on demand, tickets simulate until they rest
      gsap.ticker.add(tick);
      mo.push(() => gsap.ticker.remove(tick));
      // the rail stops swinging when the stage is off screen
      const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) wake(); });
      io.observe(stage);
      mo.push(() => io.disconnect());

      const st = tl.scrollTrigger!;
      const step = () => (st.end - st.start) / (N - 1);
      const inRange = (pad = 4) => window.scrollY >= st.start - pad && window.scrollY <= st.end + pad;
      const blocked = () => leaving || !!lenis?.isStopped;

      const releaseAuto = () => { auto = false; window.clearTimeout(autoTimer); };
      const scrollToY = (y: number, dur: number) => {
        if (blocked()) return;
        auto = true;
        window.clearTimeout(autoTimer);
        // Lenis skips onComplete when the user interrupts, so never trust it alone
        autoTimer = window.setTimeout(releaseAuto, dur * 1000 + 250);
        if (lenis) {
          lenis.scrollTo(y, { duration: dur, easing: (t) => 1 - Math.pow(1 - t, 4), onComplete: releaseAuto });
        } else {
          window.scrollTo({ top: y, behavior: "smooth" });
        }
      };

      const doSnap = () => {
        if (auto || drag || blocked()) return;
        if (!inRange()) return;
        const y = window.scrollY;
        const frac = (y - st.start) / step();
        const delta = frac - settled;
        let idx = Math.round(frac);
        if (Math.abs(delta) > 0.12 && Math.abs(delta) < 1) idx = settled + Math.sign(delta);
        idx = clamp(idx, 0, N - 1);
        settled = idx;
        const target = st.start + idx * step();
        if (Math.abs(target - y) > 1.5) scrollToY(target, 0.75);
      };
      const scheduleSnap = () => {
        window.clearTimeout(snapTimer);
        if (!auto && !blocked()) snapTimer = window.setTimeout(doSnap, 150);
      };
      mo.push(bus.on("route:before", () => { window.clearTimeout(snapTimer); releaseAuto(); }));
      // a wheel during an automatic glide means the user wants control back
      listen(mo, window, "wheel", () => { if (auto) releaseAuto(); }, { passive: true });

      mode = {
        go(i: number) {
          i = clamp(i, 0, N - 1);
          const dist = Math.abs(i - (active < 0 ? 0 : active));
          settled = i;
          scrollToY(st.start + i * step(), Math.min(1.8, 0.85 + dist * 0.16));
        },
        owns: (target) => inRange(innerHeight * 0.25) && !blocked() && (target === document.body || !!target.closest(".tb-stage")),
        // the new ticket gets yanked off the rail, the old one is shoved back up: both swing
        kick(i, prev) {
          if (i < 0) { sw.forEach((s, n) => (s.push += (n % 2 ? -1 : 1) * 26 * MASS[n])); wake(); return; }
          const dir = i > prev ? 1 : -1;
          sw[i].push += 60 * dir;
          if (prev >= 0) sw[prev].push -= 40 * dir;
          wake();
        },
      };

      // hover tilt of the front poster, and a hand brushing past the tickets
      const qx = gsap.quickTo(state, "mx", { duration: 0.9, ease: "power3", onUpdate: request });
      const qy = gsap.quickTo(state, "my", { duration: 0.9, ease: "power3" });
      // quickTo tweens stay parked in the global timeline until killed
      mo.push(() => { qx.tween.kill(); qy.tween.kill(); });
      if (finePointer) {
        listen(mo, cardsWrap, "pointermove", (e) => {
          if (drag?.moved) return;
          qx(clamp(((e.clientX - cx) / cw) * 2, -1, 1));
          qy(clamp(((e.clientY - cy) / ch) * 2, -1, 1));
        });
        listen(mo, cardsWrap, "pointerleave", () => { qx(0); qy(0); });
        let px = NaN;
        listen(mo, stage, "pointermove", (e) => {
          if (e.pointerType !== "mouse" || !visible) return;
          const dx = Number.isNaN(px) ? 0 : e.clientX - px;
          px = e.clientX;
          if (!dx) return;
          const top = stage.getBoundingClientRect().top;
          const y = e.clientY - top;
          let hit = false;
          piv.forEach((q, i) => {
            if (y < q.y0 - 30 || y > q.y1 + 60) return;
            const f = clamp(1 - Math.abs(e.clientX - q.x) / 110, 0, 1);
            if (!f) return;
            // a brush low on the paper swings it more than one near the clip
            const lever = clamp((y - q.y0) / (q.y1 - q.y0), 0.25, 1);
            sw[i].push += clamp(dx, -40, 40) * f * lever * 0.9 / MASS[i];
            hit = true;
          });
          if (hit) wake();
        });
        listen(mo, stage, "pointerleave", () => { px = NaN; });
      }

      // drag / swipe on the stage
      let drag: { x: number; y: number; s: number; moved: boolean; touch: boolean; id: number } | null = null;
      listen(mo, stage, "pointerdown", (e) => {
        if (e.button !== 0 || !e.isPrimary || (e.target as Element).closest("button, .tb-rail, .tb-cta")) return;
        if (!inRange()) return;
        drag = { x: e.clientX, y: e.clientY, s: window.scrollY, moved: false, touch: e.pointerType !== "mouse", id: e.pointerId };
        releaseAuto();
        window.clearTimeout(snapTimer);
      });
      listen(mo, window, "pointermove", (e) => {
        if (!drag || e.pointerId !== drag.id) return;
        const dx = e.clientX - drag.x;
        const dy = e.clientY - drag.y;
        if (!drag.moved) {
          if (Math.hypot(dx, dy) < 8) return;
          if (drag.touch && Math.abs(dy) > Math.abs(dx)) { drag = null; return; }
          drag.moved = true;
          el.classList.add("is-dragging");
        }
        const dd = Math.abs(dx) > Math.abs(dy) ? dx : dy;
        const y = clamp(drag.s - dd * (step() / (innerWidth * 0.28)), st.start, st.end);
        if (lenis) lenis.scrollTo(y, { immediate: true });
        else window.scrollTo(0, y);
      });
      const end = (e: PointerEvent) => {
        if (!drag || e.pointerId !== drag.id) return;
        const moved = drag.moved;
        drag = null;
        el.classList.remove("is-dragging");
        if (moved) {
          suppressClick = true;
          window.setTimeout(() => (suppressClick = false), 60);
          doSnap();
        }
      };
      listen(mo, window, "pointerup", end);
      listen(mo, window, "pointercancel", end);
      // a drag that ends outside the window never sends pointerup
      listen(mo, window, "blur", () => { if (drag) { drag = null; el.classList.remove("is-dragging"); } });

      render();
      return () => {
        mo.forEach((f) => f());
        window.clearTimeout(snapTimer);
        window.clearTimeout(autoTimer);
        mode = { go() {}, owns: () => false, kick() {} };
        el.classList.remove("is-pinned", "is-dragging");
        last.clear();
        [...cards, ...tks, ...shades, ...sheens, ...sheenBands, cta, table, railSheen].forEach((n) => n.removeAttribute("style"));
        cards.forEach((c, i) => c.style.setProperty("--c", TOOLS[i].color));
        tks.forEach((tk, i) => { tk.style.setProperty("--i", String(i)); tk.style.setProperty("--tone", STATUS_TONE[TOOLS[i].status]); });
      };
    }

    // ---------- FLAT RAIL (mobile + reduced motion) ----------
    function setupFlat() {
      el.classList.add("is-flat");
      const mo: Off[] = [];
      let stepX = 1;
      let raf = 0;
      const measure = () => {
        stepX = (cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : 0) || 1;
      };
      const update = () => {
        raf = 0;
        const p = clamp(cardsWrap.scrollLeft / stepX, 0, N - 1);
        if (!reducedMotion) {
          cards.forEach((c, i) => {
            const d = i - p;
            const a = Math.abs(d);
            c.style.transform = `perspective(900px) translate3d(0, ${(a * 18).toFixed(1)}px, 0) rotateY(${(-d * 16).toFixed(2)}deg) rotateZ(${(d * 3.5 + JIT[i][0] * 0.4).toFixed(2)}deg) scale(${(1 - Math.min(a, 1.5) * 0.08).toFixed(3)})`;
            shades[i].style.opacity = clamp(a * 0.34, 0, 0.55).toFixed(3);
          });
        }
        setActive(clamp(Math.round(p), 0, N - 1));
      };
      const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
      listen(mo, cardsWrap, "scroll", onScroll, { passive: true });
      listen(mo, window, "resize", () => { measure(); onScroll(); });
      measure();
      update();
      // keep the active chip in view on the rail without scrolling the page
      const chipIntoView = (i: number) => {
        const tk = tks[i];
        const left = tk.offsetLeft - (railList.clientWidth - tk.offsetWidth) / 2;
        railList.scrollTo({ left: Math.max(0, left), behavior: reducedMotion ? "auto" : "smooth" });
      };
      mode = {
        go(i: number) {
          i = clamp(i, 0, N - 1);
          cardsWrap.scrollTo({ left: i * stepX, behavior: reducedMotion ? "auto" : "smooth" });
        },
        // only when focus is inside the carousel controls; elsewhere arrows keep scrolling the page
        owns: (target) => !!target.closest(".tb-cards, .tb-ctrl, .tb-rail"),
        kick: (i) => { if (i >= 0) chipIntoView(i); },
      };
      return () => {
        mo.forEach((f) => f());
        cancelAnimationFrame(raf);
        mode = { go() {}, owns: () => false, kick() {} };
        el.classList.remove("is-flat");
        [...cards, ...shades].forEach((n) => n.style.removeProperty("transform"));
        shades.forEach((s) => s.removeAttribute("style"));
      };
    }

    // Pinned stack needs room for poster | rail side by side; tablets and phones get the carousel.
    // Own media query switch instead of gsap.matchMedia: gsap never detaches its MediaQueryList
    // listeners, so every visit would leak two. Each mode runs inside its own gsap.context.
    const mq = window.matchMedia("(min-width: 1025px) and (min-height: 600px) and (prefers-reduced-motion: no-preference)");
    let modeCtx: gsap.Context | null = null;
    let modeOff: Off | null = null;
    const applyMode = () => {
      modeOff?.();
      modeCtx?.revert();
      modeCtx = gsap.context(() => { modeOff = mq.matches ? setupPinned() : setupFlat(); }, el);
    };
    const onMq = () => { applyMode(); window.requestAnimationFrame(() => ScrollTrigger.refresh()); };
    mq.addEventListener("change", onMq);
    offs.push(() => mq.removeEventListener("change", onMq));
    applyMode();

    // ---------- shared input ----------
    on(stage, "click", (e) => {
      const target = e.target as Element;
      if (suppressClick) { e.preventDefault(); e.stopPropagation(); return; }
      const arrow = target.closest<HTMLElement>(".tb-arrow");
      if (arrow) { mode.go(active + Number(arrow.dataset.dir)); return; }
      const card = target.closest<HTMLElement>(".tb-card");
      if (card && Number(card.dataset.i) !== active) { e.preventDefault(); mode.go(Number(card.dataset.i)); return; }
      // a ticket that is not up yet gets pulled; the ticket on the pass opens the slice
      const tk = target.closest<HTMLElement>(".tb-tk__a");
      if (tk && Number(tk.dataset.i) !== active) {
        e.preventDefault();
        mode.go(Number(tk.dataset.i));
        bus.emit("sfx", { name: "pop" });
        return;
      }
      if (card || tk) bus.emit("sfx", { name: "click" });
    }, { capture: true });

    // Tabbing along the rail brings the focused ticket's slice to the front.
    on(stage, "focusin", (e) => {
      const link = (e.target as Element).closest<HTMLElement>(".tb-tk__a");
      if (!link || !el.classList.contains("is-pinned")) return;
      const i = Number(link.dataset.i);
      if (i !== active) mode.go(i);
    });

    on(window, "keydown", (e) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      const dir = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
      if (!dir) return;
      const tg = (e.target as HTMLElement) ?? document.body;
      if (tg.closest("input, textarea, select, [contenteditable]:not([contenteditable='false']), [role='slider'], [role='listbox'], [role='menu'], [role='tablist'], #chrome")) return;
      if (!mode.owns(tg)) return;
      const ni = clamp(active + dir, 0, N - 1);
      if (ni === active) return; // at either end, let the page scroll on
      e.preventDefault();
      mode.go(ni);
      if (tg.closest(".tb-rail")) tkLinks[ni].focus({ preventScroll: true });
    });

    setActive(0, true);

    // ---------- intro ----------
    // First load waits for the preloader; later visits start as the transition cover peels away.
    let alive = true;
    if (!reducedMotion) {
      const ins = [...el.querySelectorAll<HTMLElement>(".tb-card__in")];
      const rises = el.querySelectorAll(".tb-rise");
      const papers = el.querySelectorAll(".tb-tk__a");
      const bar = el.querySelector(".tb-rail__bar");
      const sign = el.querySelector(".tb-sign");
      const ctrl = el.querySelectorAll(".tb-ctrl > *");
      ctx.add(() => {
        gsap.set(ins, { autoAlpha: 0, yPercent: 90, rotationX: 40, transformPerspective: 1200, transformOrigin: "50% 100%" });
        gsap.set(rises, { yPercent: 110 });
        gsap.set(papers, { yPercent: -60, autoAlpha: 0 });
        gsap.set(bar, { scaleX: 0, transformOrigin: "100% 50%" });
        gsap.set(sign, { autoAlpha: 0, y: 30, rotation: -6 });
        gsap.set(ctrl, { autoAlpha: 0, y: 16 });
        gsap.set(table.firstElementChild, { autoAlpha: 0 });
      });
      (async () => {
        if (first) await loaderGone;
        if (!alive) return;
        ctx.add(() => {
          const tl = gsap.timeline({ defaults: { ease: "expo.out" }, delay: first ? 0 : 0.2 });
          tl.to(rises, { yPercent: 0, duration: 0.9, stagger: 0.06 }, 0)
            // the stack flies up from below, back poster first, and lands on the table
            .to([...ins].reverse(), { autoAlpha: 1, yPercent: 0, rotationX: 0, duration: 1.4, stagger: 0.08 }, 0.05)
            .to(table.firstElementChild, { autoAlpha: 1, duration: 1.2, ease: "power2.out" }, 0.5)
            .to(bar, { scaleX: 1, duration: 1.1, ease: "expo.inOut" }, 0.1)
            .to(papers, {
              yPercent: 0, autoAlpha: 1, duration: 0.9, stagger: 0.06, ease: "back.out(1.6)",
              // each ticket lands with a little swing
              onStart: () => mode.kick(-1, -1),
            }, 0.55)
            .to(sign, { autoAlpha: 1, y: 0, rotation: 0, duration: 1.1 }, 0.35)
            .to(ctrl, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.05 }, 0.5);
        });
      })();
    }

    return () => {
      alive = false;
      offs.forEach((f) => f());
      modeOff?.();
      modeCtx?.revert();
      modeOff = null;
      modeCtx = null;
      flipState.forEach((s) => s.tl?.kill());
      ctx.revert();
    };
  },
};

export default page;
