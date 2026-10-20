import "../styles/pages/toolbox.css";
import type { Page } from "../core/page";
import { gsap, lenis, reducedMotion, finePointer } from "../core/motion";
import { loaderGone } from "../core/ready";
import { bus } from "../core/bus";
import { SITE, TOOLS, type Tool } from "../data/site";
import { poster } from "../art/index";
import {
  arrowSVG, esc, footerHTML, makers, odoColumn, pad, replacesText, setOdometer, statusPill,
} from "./toolbox/shared";

const N = TOOLS.length;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
/** small per-card "tossed on the table" jitter, deterministic */
const JIT = TOOLS.map((_, i) => [(((i * 37) % 7) - 3) * 0.9, (((i * 53) % 5) - 2) * 1.2]);

function metaValues(t: Tool) {
  return {
    makers: makers(t).map((p) => `<span class="tb-line">${esc(p.name)}</span>`).join(""),
    platform: esc(t.platform),
    status: statusPill(t),
    replaces: esc(replacesText(t)),
    year: String(t.year),
  };
}
type MetaKey = keyof ReturnType<typeof metaValues>;
const META: [MetaKey, string][] = [
  ["makers", "Makers"],
  ["platform", "Platform"],
  ["status", "Status"],
  ["year", "Year"],
  ["replaces", "Replaces"],
];

function template() {
  const first = metaValues(TOOLS[0]);
  return `
<div class="p-toolbox">
  <section class="tb-stage" aria-labelledby="tb-h1">
    <header class="tb-head tb-anim">
      <h1 id="tb-h1" class="tb-h1"><span class="tb-h1__k">Toolbox</span><span class="tb-h1__n">${pad(N)} slices</span></h1>
      <p class="tb-tag serif">${esc(SITE.tagline)}</p>
      <p class="tb-hint mono" aria-hidden="true">Scroll / drag / arrow keys</p>
    </header>

    <div class="tb-cards" role="group" aria-label="Tool posters">
      <span class="tb-table" aria-hidden="true"><i></i></span>
      ${TOOLS.map((t, i) => `
      <a class="tb-card" href="/toolbox/${t.slug}" data-i="${i}" data-cursor="Open" draggable="false" tabindex="-1"
         aria-label="${esc(`${t.name}, ${t.kind}`)}" style="--c:${t.color}">
        <span class="tb-card__in">
          <span class="tb-card__art">${poster(t)}</span>
          <span class="tb-card__sheen" aria-hidden="true"><i></i></span>
          <span class="tb-card__shade" aria-hidden="true"></span>
          <span class="tb-card__cap" aria-hidden="true"><b>${pad(i + 1)}</b>${esc(t.name)}</span>
        </span>
      </a>`).join("")}
    </div>

    <dl class="tb-meta" aria-live="polite">
      ${META.map(([k, label]) => `
      <div class="tb-meta__pair tb-anim" data-k="${k}">
        <dt class="label">${label}</dt>
        <dd><span class="mv"><span class="mv__in">${first[k]}</span></span></dd>
      </div>`).join("")}
    </dl>

    <div class="tb-count" aria-hidden="true">
      <span class="tb-count__label label tb-anim">Selected slices</span>
      <span class="tb-count__num">
        <span class="tb-count__digits odo">${odoColumn("is-tens")}${odoColumn("is-ones")}</span>
      </span>
      <span class="tb-count__total tb-anim">/${pad(N)}</span>
    </div>

    <nav class="tb-list" aria-label="All slices">
      <ol class="tb-list__track">
        ${TOOLS.map((t, i) => `
        <li class="tb-item" data-i="${i}">
          <a class="tb-item__a" href="/toolbox/${t.slug}" data-i="${i}">
            <span class="tb-item__kind label">${esc(t.kind)}${t.codename ? `<span class="tb-item__wt"> / working title</span>` : ""}</span>
            <span class="tb-item__name">${esc(t.name)}</span>
            <span class="tb-item__dash" aria-hidden="true"></span>
            <span class="tb-item__blurb">${esc(t.blurb)}</span>
          </a>
        </li>`).join("")}
      </ol>
    </nav>

    <div class="tb-swatches" aria-hidden="true">
      ${TOOLS.map((t, i) => `<button class="tb-swatch" tabindex="-1" data-i="${i}" style="--c:${t.color}"></button>`).join("")}
    </div>

    <div class="tb-ctrl tb-anim">
      <button class="tb-arrow" data-dir="-1" aria-label="Previous slice">${arrowSVG("up")}</button>
      <button class="tb-arrow" data-dir="1" aria-label="Next slice">${arrowSVG("down")}</button>
      <a class="tb-cta" href="/toolbox/${TOOLS[0].slug}" data-cursor="Open">
        <span class="tb-cta__k">View slice</span>
        <span class="tb-cta__name">${esc(TOOLS[0].name)}</span>
        <svg viewBox="0 0 10 12" aria-hidden="true"><path d="M0 0l10 6-10 6z" fill="currentColor"/></svg>
      </a>
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
    const items = [...el.querySelectorAll<HTMLElement>(".tb-item")];
    const links = [...el.querySelectorAll<HTMLAnchorElement>(".tb-item__a")];
    const track = el.querySelector<HTMLElement>(".tb-list__track")!;
    const swatches = [...el.querySelectorAll<HTMLElement>(".tb-swatch")];
    const cta = el.querySelector<HTMLAnchorElement>(".tb-cta")!;
    const ctaName = cta.querySelector<HTMLElement>(".tb-cta__name")!;
    const tens = el.querySelector<HTMLElement>(".is-tens .odo__strip")!;
    const ones = el.querySelector<HTMLElement>(".is-ones .odo__strip")!;
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
    let mode: { go(i: number): void; owns(target: Element): boolean } = { go() {}, owns: () => false };
    let suppressClick = false;
    let leaving = false;
    offs.push(bus.on("route:before", () => { leaving = true; }));

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
      links.forEach((a, n) => (n === i ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current")));
      items.forEach((it, n) => it.classList.toggle("is-active", n === i));
      cards.forEach((c, n) => c.classList.toggle("is-active", n === i));
      swatches.forEach((s, n) => s.classList.toggle("is-active", n === i));
      cta.href = `/toolbox/${t.slug}`;
      cta.setAttribute("aria-label", `View slice: ${t.name}`);
      ctaName.textContent = t.name;
      el.style.setProperty("--active", t.color);
      if (prev !== -1) {
        swapMeta(t, instant);
        bus.emit("sfx", { name: "tick" });
      }
    };

    // ---------- PINNED 3D STACK (desktop, motion ok) ----------
    function setupPinned() {
      el.classList.add("is-pinned");
      const mo: Off[] = [];
      const state = { p: 0, mx: 0, my: 0 };
      let vw = innerWidth / 100;
      let vh = innerHeight / 100;
      let centers: number[] = [];
      let settled = 0;
      let auto = false;
      let autoTimer = 0;
      let snapTimer = 0;
      // front card geometry, cached so hover never reads layout from a tilting element
      let cx = 0, cy = 0, cw = 1, ch = 1;

      const measure = () => {
        vw = innerWidth / 100;
        vh = innerHeight / 100;
        const prev = track.style.transform;
        track.style.transform = "none";
        centers = items.map((it) => it.offsetTop + it.offsetHeight / 2);
        track.style.transform = prev;
        cw = cards[0].offsetWidth || 1;
        ch = cards[0].offsetHeight || 1;
        cx = stage.clientWidth * 0.47;
        cy = stage.clientHeight * 0.48;
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
          c.style.transform = `perspective(1700px) translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,${z.toFixed(1)}px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg)`;
          c.style.opacity = o.toFixed(3);
          c.style.visibility = o < 0.01 ? "hidden" : "visible";
          c.style.zIndex = String(d <= 0 ? 200 - Math.round(-d * 10) : 100 - Math.round(d * 10));
          shades[i].style.opacity = sh.toFixed(3);
          // specular sheen: a band of light glides across each poster as it lands, and follows the hover tilt
          if (Math.abs(d) < 1.3) {
            sheens[i].style.opacity = (near * 0.9 + 0.1).toFixed(3);
            sheenBands[i].style.transform = `translate3d(${(d * 150 - 20 + state.mx * 34).toFixed(1)}%,0,0)`;
          } else if (sheens[i].style.opacity !== "0") {
            sheens[i].style.opacity = "0";
          }
        });
        // list: keep the active item vertically centered
        const f = clamp(Math.floor(p), 0, N - 1);
        const fr = p - f;
        const lcy = centers.length ? centers[f] + ((centers[Math.min(f + 1, N - 1)] ?? centers[f]) - centers[f]) * fr : 0;
        track.style.transform = `translate3d(0, ${(-lcy).toFixed(1)}px, 0)`;
        items.forEach((it, i) => {
          const a = clamp(1 - Math.abs(i - p), 0, 1);
          it.style.opacity = (0.16 + 0.84 * a * a).toFixed(3);
        });
        setOdometer(tens, ones, p + 1);
        setActive(clamp(Math.round(p), 0, N - 1));
        const settle = 1 - clamp(Math.abs(p - Math.round(p)) * 5, 0, 1);
        cta.style.opacity = settle.toFixed(3);
        cta.style.transform = `translate3d(0, ${((1 - settle) * 10).toFixed(1)}px, 0)`;
        // the "table" shadow under the front poster: tight when it lands, loose mid-flight, slides against the tilt
        const lift = 1 - settle;
        table.style.transform = `translate3d(${(-state.mx * 26).toFixed(1)}px, ${(-state.my * 10 + lift * 22).toFixed(1)}px, 0) scale(${(1 + lift * 0.22).toFixed(3)}, ${(1 + lift * 0.4).toFixed(3)})`;
        table.style.opacity = (0.75 - lift * 0.4).toFixed(3);
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
          onRefresh: () => { measure(); render(); },
          onUpdate: () => scheduleSnap(),
        },
      });
      tl.to(state, { p: N - 1, ease: "none", onUpdate: render });
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
      };

      // hover tilt of the front poster
      const qx = gsap.quickTo(state, "mx", { duration: 0.9, ease: "power3", onUpdate: render });
      const qy = gsap.quickTo(state, "my", { duration: 0.9, ease: "power3" });
      if (finePointer) {
        listen(mo, cardsWrap, "pointermove", (e) => {
          if (drag?.moved) return;
          qx(clamp(((e.clientX - cx) / cw) * 2, -1, 1));
          qy(clamp(((e.clientY - cy) / ch) * 2, -1, 1));
        });
        listen(mo, cardsWrap, "pointerleave", () => { qx(0); qy(0); });
      }

      // drag / swipe on the stage
      let drag: { x: number; y: number; s: number; moved: boolean; touch: boolean; id: number } | null = null;
      listen(mo, stage, "pointerdown", (e) => {
        if (e.button !== 0 || !e.isPrimary || (e.target as Element).closest("button, .tb-list, .tb-cta")) return;
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
        mode = { go() {}, owns: () => false };
        el.classList.remove("is-pinned", "is-dragging");
        [...cards, track, ...items, ...shades, ...sheens, ...sheenBands, cta, table].forEach((n) => n.removeAttribute("style"));
        cards.forEach((c, i) => c.style.setProperty("--c", TOOLS[i].color));
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
        setOdometer(tens, ones, p + 1);
        setActive(clamp(Math.round(p), 0, N - 1));
      };
      const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
      listen(mo, cardsWrap, "scroll", onScroll, { passive: true });
      listen(mo, window, "resize", () => { measure(); onScroll(); });
      measure();
      update();
      mode = {
        go(i: number) {
          i = clamp(i, 0, N - 1);
          cardsWrap.scrollTo({ left: i * stepX, behavior: reducedMotion ? "auto" : "smooth" });
        },
        // only when focus is inside the rail controls; elsewhere arrows keep scrolling the page
        owns: (target) => !!target.closest(".tb-cards, .tb-ctrl, .tb-swatches"),
      };
      return () => {
        mo.forEach((f) => f());
        cancelAnimationFrame(raf);
        mode = { go() {}, owns: () => false };
        el.classList.remove("is-flat");
        [...cards, ...shades].forEach((n) => n.style.removeProperty("transform"));
        shades.forEach((s) => s.removeAttribute("style"));
      };
    }

    const mm = gsap.matchMedia();
    mm.add(
      { pinned: "(min-width: 721px) and (prefers-reduced-motion: no-preference)", flat: "(max-width: 720px), (prefers-reduced-motion: reduce)" },
      (c) => (c.conditions?.pinned ? setupPinned() : setupFlat())
    );

    // ---------- shared input ----------
    on(stage, "click", (e) => {
      const target = e.target as Element;
      if (suppressClick) { e.preventDefault(); e.stopPropagation(); return; }
      const arrow = target.closest<HTMLElement>(".tb-arrow");
      if (arrow) { mode.go(active + Number(arrow.dataset.dir)); return; }
      const sw = target.closest<HTMLElement>(".tb-swatch");
      if (sw) { mode.go(Number(sw.dataset.i)); return; }
      const card = target.closest<HTMLElement>(".tb-card");
      if (card && Number(card.dataset.i) !== active) { e.preventDefault(); mode.go(Number(card.dataset.i)); return; }
      const link = target.closest<HTMLElement>(".tb-item__a");
      if (link && el.classList.contains("is-pinned") && Number(link.dataset.i) !== active) {
        e.preventDefault();
        mode.go(Number(link.dataset.i));
      }
      if (card) bus.emit("sfx", { name: "click" });
    }, { capture: true });

    // Tabbing through the pinned list brings the focused slice to the front.
    on(stage, "focusin", (e) => {
      const link = (e.target as Element).closest<HTMLElement>(".tb-item__a");
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
      if (tg.closest(".tb-list")) links[ni].focus({ preventScroll: true });
    });

    setActive(0, true);

    // ---------- intro ----------
    let alive = true;
    if (!reducedMotion) {
      const ins = el.querySelectorAll(".tb-card__in");
      const anims = el.querySelectorAll(".tb-anim");
      const listIn = el.querySelectorAll(".tb-item__a");
      const digits = el.querySelector(".tb-count__digits");
      ctx.add(() => {
        gsap.set(ins, { autoAlpha: 0, yPercent: 70, rotation: 14 });
        gsap.set([anims, listIn], { autoAlpha: 0, y: 24 });
        gsap.set(digits, { yPercent: 105 });
        gsap.set(table.firstElementChild, { autoAlpha: 0 });
      });
      (async () => {
        if (first) await loaderGone;
        if (!alive) return;
        ctx.add(() => {
          const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
          tl.to([...ins].reverse(), { autoAlpha: 1, yPercent: 0, rotation: 0, duration: 1.6, stagger: 0.07 }, 0)
            .to(table.firstElementChild, { autoAlpha: 1, duration: 1.4, ease: "power2.out" }, 0.5)
            .to(digits, { yPercent: 0, duration: 1.3 }, 0.25)
            .to(anims, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.05 }, 0.3)
            .to(listIn, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.06 }, 0.35);
        });
      })();
    }

    return () => {
      alive = false;
      offs.forEach((f) => f());
      mm.revert();
      ctx.revert();
    };
  },
};

export default page;
