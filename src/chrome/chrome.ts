// Persistent chrome: wordmark, nav, oven audio toggle, countdown, source link,
// scroll hint, trunk link, mobile overlay menu, custom cursor.
import { bus } from "../core/bus";
import { gsap, lenis, reducedMotion } from "../core/motion";
import { loaderGone } from "../core/ready";
import { SITE } from "../data/site";
import { glyph } from "../art";
import { audio, initAudio } from "./audio";
import { countdownHTML, startCountdowns } from "./countdown";
import { initCursor } from "./cursor";
import { NAV, activeIndex, placeFor } from "./sections";

const repoLabel = () => {
  const m = SITE.repo.match(/github\.com\/[^/]+\/([^/]+)/);
  return `github / ${m ? m[1] : "repo"}`;
};

// one period every 6 units, drawn long so it can scroll under the 16 wide window
const WAVE = "M0 4 Q1.5 1.8 3 4 T6 4 T9 4 T12 4 T15 4 T18 4 T21 4 T24 4 T27 4 T30 4";
const audioBtn = (cls: string) => `
  <button class="ch-audio ${cls}" type="button" aria-pressed="false" aria-label="Background sound">
    <span class="ch-lbl ch-lbl-snd" aria-hidden="true">Sound</span><span class="ch-lbl-sat" aria-hidden="true">Oven on</span> <b class="ch-audio-v" aria-hidden="true" data-v="Off"></b>
    <svg class="ch-wave" viewBox="0 0 16 8" aria-hidden="true"><g><path d="${WAVE}"/></g></svg>
  </button>`;

function markup() {
  const links = NAV.map((n, i) => `<li><a href="${n.href}" data-i="${i}"><span>${n.label}</span></a></li>`).join("");
  const bigLinks = NAV.map((n, i) => `<li><a href="${n.href}"><span class="mm-n">0${i + 1}</span><span class="mm-t">${n.label}</span></a></li>`).join("");
  return `
  <div class="ch-bar" aria-hidden="true"></div>
  <div class="ch-veil" aria-hidden="true"><i class="ch-veil-l"></i><i class="ch-veil-d"></i></div>
  <header class="ch" data-chrome-root>
    <a class="ch-mark" href="/" aria-label="${SITE.name}, home">
      <span class="ch-word" aria-hidden="true">OPENSLICE<i>©</i></span>
    </a>
    <div class="ch-meta" aria-hidden="true"><span>est. ${SITE.since}</span><span>Saturday Slices</span><span>free forever</span></div>
    <nav class="ch-nav" aria-label="Primary">
      <button class="ch-lbl ch-nav-lbl" type="button" aria-expanded="true" aria-controls="ch-list">Menu<i aria-hidden="true"></i></button>
      <div class="ch-lw"><ul class="ch-list" id="ch-list">${links}</ul><span class="ch-arrow" aria-hidden="true">&rarr;</span></div>
    </nav>
    ${audioBtn("ch-audio-d")}
    ${countdownHTML("ch-cd")}
    <div class="ch-src"><span class="ch-lbl">Source</span><a class="u-link" href="${SITE.repo}" target="_blank" rel="noopener" data-cursor="GitHub">${repoLabel()}</a></div>
    <button class="ch-mbtn" type="button" aria-expanded="false" aria-controls="mm"><span>Menu</span><i aria-hidden="true"></i></button>
    <div class="ch-scroll" aria-hidden="true"><span>Scroll</span></div>
    <a class="ch-trunk" href="/slices"><span class="u-link">Our trunk: ${SITE.trunk.name}</span><svg viewBox="0 0 10 12" aria-hidden="true"><path d="M0 0 L10 6 L0 12Z"/></svg></a>
  </header>
  <div class="mm" id="mm" role="dialog" aria-modal="true" aria-label="Site menu" hidden>
    <div class="mm-top">
      <a class="mm-mark" href="/">OPENSLICE<i>©</i></a>
      <button class="mm-close" type="button">Close</button>
    </div>
    <ul class="mm-list">${bigLinks}</ul>
    <div class="mm-slice" aria-hidden="true">${glyph("slice")}</div>
    <div class="mm-foot">
      ${countdownHTML("mm-cd")}
      ${audioBtn("mm-audio")}
      <a class="u-link" href="${SITE.repo}" target="_blank" rel="noopener">${repoLabel()}</a>
    </div>
  </div>
  <div class="sr-only" aria-live="polite" aria-atomic="true" id="route-announcer"></div>`;
}

export function initChrome() {
  const host = document.getElementById("chrome")!;
  host.innerHTML = markup();
  const $ = <T extends Element = HTMLElement>(s: string) => host.querySelector(s) as T;
  const body = document.body;
  const view = document.getElementById("view")!;

  initAudio();
  startCountdowns();
  const cursor = initCursor();

  /* ---------- audio toggles ---------- */
  const audioBtns = host.querySelectorAll<HTMLButtonElement>(".ch-audio");
  audioBtns.forEach((b) => b.addEventListener("click", () => audio.toggle()));
  audio.subscribe((on) => audioBtns.forEach((b) => {
    b.setAttribute("aria-pressed", String(on));
    b.classList.toggle("is-on", on);
    (b.querySelector(".ch-audio-v") as HTMLElement).dataset.v = on ? "On" : "Off";
  }));

  // Saturday: the visible hint reads "Oven on"; keep the name containing what is shown
  const satName = () => {
    const sat = document.documentElement.classList.contains("is-saturday");
    const name = sat ? "Oven on, background sound" : "Background sound";
    audioBtns.forEach((b) => { if (b.getAttribute("aria-label") !== name) b.setAttribute("aria-label", name); });
  };
  // also the moment the preloader lets go (html.is-loading drops): tone the chrome
  new MutationObserver(() => { satName(); queueSample(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  satName();

  /* ---------- nav arrow (FLIP between items) ---------- */
  const list = $(".ch-list");
  const arrow = $(".ch-arrow");
  const items = [...list.querySelectorAll<HTMLAnchorElement>("a")];
  let current = -2;
  const setActive = (path: string) => {
    const i = activeIndex(path);
    if (i === current) return;
    const prev = current;
    current = i;
    items.forEach((a, j) => {
      a.classList.toggle("is-active", j === i);
      if (j === i) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    const dur = reducedMotion || prev === -2 ? 0 : 0.7;
    if (i < 0) { gsap.to(arrow, { autoAlpha: 0, x: -12, duration: dur * 0.5, ease: "power2.in" }); return; }
    const y = items[i].parentElement!.offsetTop;
    if (prev < 0) {
      gsap.fromTo(arrow, { y, x: -14, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: dur, ease: "expo.out" });
    } else {
      // squash in flight, like it's being flicked to the new row
      gsap.timeline()
        .to(arrow, { y, duration: dur, ease: "expo.inOut" }, 0)
        .to(arrow, { scaleX: 1.6, x: -4, duration: dur * 0.4, ease: "power2.in" }, 0)
        .to(arrow, { scaleX: 1, x: 0, duration: dur * 0.6, ease: "elastic.out(1, .6)" }, dur * 0.4);
    }
  };
  // row heights follow a vw clamp and the final font: keep the arrow on its row
  const reseat = () => {
    if (current < 0 || gsap.isTweening(arrow)) return;
    gsap.set(arrow, { y: items[current].parentElement!.offsetTop });
  };
  let rz = 0;
  addEventListener("resize", () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(reseat); }, { passive: true });
  document.fonts?.ready.then(reseat);
  items.forEach((a) => a.addEventListener("pointerenter", () => bus.emit("sfx", { name: "tick" })));
  host.addEventListener("click", (e) => {
    if ((e.target as Element).closest("a")) bus.emit("sfx", { name: "click" });
  });

  /* ---------- theme: readable on flour and dark pages ---------- */
  const syncTheme = () => { body.dataset.chrome = view.dataset.theme === "dark" ? "dark" : "light"; };
  // (queueSample is defined further down; observers only fire after init)
  new MutationObserver(() => { syncTheme(); queueSample(); }).observe(view, { attributes: true, attributeFilter: ["data-theme"] });
  syncTheme();

  /* ---------- tucked nav: mouse hover, or tap/click the "Menu" button ---------- */
  const nav = $(".ch-nav");
  const navBtn = $<HTMLButtonElement>(".ch-nav-lbl");
  let navOpen = false;
  const setNav = (v: boolean) => {
    navOpen = v;
    body.classList.toggle("nav-open", v);
    navBtn.setAttribute("aria-expanded", String(v || !tucked));
  };
  nav.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") setNav(true); });
  nav.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") setNav(false); });
  navBtn.addEventListener("click", (e) => { if ((e as PointerEvent).pointerType !== "mouse") setNav(!navOpen); });
  document.addEventListener("pointerdown", (e) => { if (navOpen && !nav.contains(e.target as Node)) setNav(false); }, { passive: true });
  nav.addEventListener("keydown", (e) => { if (e.key === "Escape" && navOpen) { setNav(false); navBtn.focus(); } });

  /* ---------- scroll hint, veil, tuck, footer awareness ---------- */
  const scrollHint = $(".ch-scroll");
  let scrolled = false, tucked = false, autoTuck = false;
  const applyTuck = () => {
    // past the first screenful of type (or, off the home page, once the visitor has
    // had a moment with the page header) fold the stacked nav up into "Menu +"
    const t = autoTuck || window.scrollY > 120;
    if (t === tucked) return;
    tucked = t;
    body.classList.toggle("nav-tucked", t);
    navBtn.setAttribute("aria-expanded", String(navOpen || !t));
  };

  // What is under each part of the chrome? Sample the page there and tone the items
  // to match: ink over flour, paper over oven dark, paper over tomato. Pages can say
  // so with data-theme="dark"; anything else is judged by its painted background.
  type Tone = "light" | "dark" | "red";
  const toneAt = (x: number, y: number): Tone | null => {
    // walk the paint stack top-down (not the DOM ancestry): a transparent section
    // can overlap the dark one under it, and the dark one is what shows
    const stack = document.elementsFromPoint(x, y);
    let n = 0;
    for (const el of stack) {
      if (!view.contains(el) || el === view) continue;
      if (++n > 14) break;
      const theme = (el as HTMLElement).dataset?.theme;
      if (theme) return theme === "dark" ? "dark" : "light";
      const m = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
      if (!m) continue;
      const [r, g, b, a = "1"] = m;
      if (+a < 0.5) continue;
      if (+r > 200 && +g < 90 && +b < 90) return "red";
      return 0.2126 * +r + 0.7152 * +g + 0.0722 * +b < 110 ? "dark" : "light";
    }
    return stack.length ? (view.dataset.theme === "dark" ? "dark" : "light") : null;
  };
  const fallback = (): Tone => (view.dataset.theme === "dark" ? "dark" : "light");
  /** the most common tone across a row of samples; a three-way split goes to the middle one */
  const toneRow = (y: number, xs: number[]): Tone => {
    const got = xs.map((f) => toneAt(innerWidth * f, y)).filter(Boolean) as Tone[];
    if (!got.length) return fallback();
    const count = (t: Tone) => got.filter((g) => g === t).length;
    const best = (["light", "dark", "red"] as Tone[]).sort((p, q) => count(q) - count(p))[0];
    return count(best) * 2 > got.length ? best : got[Math.floor(got.length / 2)];
  };
  const setTone = (els: (Element | null)[], t: Tone) => els.forEach((el) => {
    if (!el) return;
    if (t === "light") el.removeAttribute("data-tone"); else if (el.getAttribute("data-tone") !== t) el.setAttribute("data-tone", t);
  });
  const veil = $(".ch-veil");
  const topEls = [...host.querySelectorAll(".ch-nav, .ch-audio-d, .ch-cd, .ch-src, .ch-mbtn")];
  const railEls = [...host.querySelectorAll(".ch-mark, .ch-meta")];
  const scrollEl = $(".ch-scroll"), trunkEl = $(".ch-trunk");
  let topTone: Tone | "" = "", sampleRaf = 0;
  const sample = () => {
    sampleRaf = 0;
    if (document.documentElement.classList.contains("is-loading")) return;
    const wide = innerWidth > 720;
    const top = toneRow(wide ? 30 : 24, [0.22, 0.5, 0.78]);
    if (top !== topTone) {
      topTone = top;
      body.classList.toggle("ch-dark", top === "dark");
      body.classList.toggle("ch-red", top === "red");
      setTone([veil], top);
    }
    setTone(topEls, top);
    if (!wide) { setTone(railEls, top); return; }
    // the spine runs down past the veil: judge it by what is under its lower half
    setTone(railEls, toneAt(30, 130) ?? fallback());
    setTone([scrollEl], toneAt(34, innerHeight - 24) ?? fallback());
    setTone([trunkEl], toneAt(innerWidth - 90, innerHeight - 24) ?? fallback());
  };
  const queueSample = () => { if (!sampleRaf) sampleRaf = requestAnimationFrame(sample); };

  const onScroll = () => {
    const s = window.scrollY > 40;
    if (s !== scrolled) { scrolled = s; scrollHint.classList.toggle("is-gone", s); body.classList.toggle("is-scrolled", s); }
    applyTuck();
    queueSample();
  };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", queueSample, { passive: true });

  // the "Scroll" hint only makes sense on a page that scrolls
  const fits = () => document.documentElement.scrollHeight <= innerHeight + 40;
  let fitRaf = 0;
  const checkFits = () => {
    cancelAnimationFrame(fitRaf);
    fitRaf = requestAnimationFrame(() => scrollHint.classList.toggle("is-none", fits()));
  };
  new ResizeObserver(checkFits).observe(view);
  addEventListener("resize", checkFits, { passive: true });

  let footIO: IntersectionObserver | null = null;
  let peekIO: IntersectionObserver | null = null;
  let heat: gsap.core.Tween[] = [];
  let fitWord: (() => void) | null = null;
  const stopHeat = () => { heat.forEach((t) => t.kill()); heat = []; };
  const watchFooter = () => {
    footIO?.disconnect();
    peekIO?.disconnect();
    stopHeat();
    fitWord = null;
    body.classList.remove("footer-in");
    const f = view.querySelector<HTMLElement>(".site-footer");
    if (!f) return;
    const where = f.querySelector<HTMLElement>("[data-sf-where]");
    if (where) where.textContent = placeFor(location.pathname, body.dataset.page);
    footIO = new IntersectionObserver(([en]) => body.classList.toggle("footer-in", en.isIntersecting), { rootMargin: "0px 0px -40px 0px" });
    footIO.observe(f);
    const word = f.querySelector<HTMLElement>(".sf-word");
    const wm = word?.querySelector<HTMLElement>(".sf-wm");
    if (!word || !wm) return;
    // set the wordmark so it spans the footer's content box exactly, (c) included
    fitWord = () => {
      const avail = word.clientWidth;
      const w = wm.getBoundingClientRect().width;
      const fs = parseFloat(getComputedStyle(word).fontSize);
      if (!avail || !w || !fs) return;
      const next = Math.floor(fs * (avail / w) * 100) / 100;
      if (Math.abs(next - fs) > 0.25) word.style.setProperty("--sf-fit", `${next}px`);
    };
    fitWord();
    document.fonts?.ready.then(() => fitWord?.());
    // Saturday: a slow heat shimmer, bands of the wordmark drifting on offset sines
    let band: HTMLElement[] = [];
    if (document.documentElement.classList.contains("is-saturday") && !reducedMotion) {
      wm.querySelector(".sf-heat")?.remove();
      const text = wm.innerHTML;
      const N = 9;
      const box = document.createElement("span");
      box.className = "sf-heat";
      box.innerHTML = Array.from({ length: N }, (_, i) => {
        const t = (i / N) * 100, b = 100 - ((i + 1) / N) * 100;
        return `<span style="clip-path:inset(${t.toFixed(2)}% -4% ${Math.max(0, b - 0.4).toFixed(2)}% -4%)">${text}</span>`;
      }).join("");
      // the copies live inside the wordmark so they inherit every style it has
      wm.appendChild(box);
      wm.classList.add("is-heat");
      band = [...box.children] as HTMLElement[];
    }
    const heatOn = (v: boolean) => {
      stopHeat();
      if (!v || !band.length) return;
      // amplitude follows the type size, so a phone gets the same gentle waver
      const amp = Math.max(0.4, parseFloat(getComputedStyle(word).fontSize) * 0.006);
      heat = band.map((el, i) => gsap.fromTo(el, { x: -amp, skewX: -0.4 }, {
        x: amp, skewX: 0.4, duration: 1.7 + (i % 3) * 0.25, ease: "sine.inOut",
        yoyo: true, repeat: -1, delay: -i * 0.33,
      }));
    };
    // the crew pops up from behind the wordmark once most of it is in view
    peekIO = new IntersectionObserver(([en]) => {
      f.classList.toggle("is-peek", en.intersectionRatio > 0.6);
      heatOn(en.isIntersecting);
    }, { threshold: [0, 0.6, 1] });
    peekIO.observe(word);
  };
  addEventListener("resize", () => fitWord?.(), { passive: true });

  /* ---------- mobile overlay menu ---------- */
  const mm = $(".mm");
  const mbtn = $<HTMLButtonElement>(".ch-mbtn");
  const header = $(".ch");
  // while the overlay is up, everything behind it is out of reach (focus, AT, scroll)
  const lockBehind = (v: boolean) => {
    view.inert = v;
    header.inert = v;
    document.documentElement.classList.toggle("menu-lock", v);
  };
  let open = false;
  let tl: gsap.core.Timeline | null = null;
  const focusables = () => [...mm.querySelectorAll<HTMLElement>("a[href], button")];
  const trap = (e: KeyboardEvent) => {
    if (e.key === "Escape") { e.preventDefault(); setMenu(false); return; }
    if (e.key !== "Tab") return;
    const f = focusables(), first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  function setMenu(v: boolean, restoreFocus = true) {
    if (v === open) return;
    open = v;
    mbtn.setAttribute("aria-expanded", String(v));
    body.classList.toggle("menu-open", v);
    tl?.kill();
    bus.emit("sfx", { name: v ? "pop" : "click" });
    if (v) {
      mm.hidden = false;
      lockBehind(true);
      lenis?.stop();
      document.addEventListener("keydown", trap);
      const big = mm.querySelectorAll(".mm-t, .mm-n");
      tl = gsap.timeline();
      if (reducedMotion) tl.fromTo(mm, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 });
      else tl
        .fromTo(mm, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.6, ease: "expo.inOut" })
        .fromTo(big, { yPercent: 110 }, { yPercent: 0, duration: 0.8, ease: "expo.out", stagger: 0.05 }, 0.25)
        .fromTo(".mm-slice", { rotate: -52, scale: 0.6, autoAlpha: 0 }, { rotate: -12, scale: 1, autoAlpha: 1, duration: 0.9, ease: "back.out(1.6)" }, 0.35)
        .fromTo(".mm-foot > *, .mm-top > *", { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.04, ease: "power3.out" }, 0.4);
      (mm.querySelector(".mm-list a") as HTMLElement).focus({ preventScroll: true });
    } else {
      document.removeEventListener("keydown", trap);
      lockBehind(false);
      lenis?.start();
      tl = gsap.timeline({ onComplete: () => { mm.hidden = true; } });
      if (reducedMotion) tl.to(mm, { autoAlpha: 0, duration: 0.15 });
      else tl.to(mm, { clipPath: "inset(0 0 100% 0)", duration: 0.5, ease: "expo.inOut" });
      if (restoreFocus) mbtn.focus({ preventScroll: true });
    }
  }
  mbtn.addEventListener("click", () => setMenu(true));
  $(".mm-close").addEventListener("click", () => setMenu(false));
  // Tapping a link keeps the menu up; the page transition covers it and we drop it underneath.
  let dropUnderCover = false;
  mm.addEventListener("click", (e) => {
    const a = (e.target as Element).closest("a");
    if (!a) return;
    const same = a.origin === location.origin && a.pathname === location.pathname;
    if (same || a.target === "_blank") setMenu(false, false);
  });
  const dropMenu = () => {
    if (!open) return;
    open = false;
    tl?.kill();
    mm.hidden = true;
    mbtn.setAttribute("aria-expanded", "false");
    body.classList.remove("menu-open");
    document.removeEventListener("keydown", trap);
    lockBehind(false);
    lenis?.start();
  };
  matchMedia("(min-width: 721px)").addEventListener("change", (e) => { if (e.matches) setMenu(false, false); });

  /* ---------- skip link: let the browser jump, then focus main ---------- */
  const skip = document.querySelector<HTMLAnchorElement>(".skip");
  if (skip) {
    skip.dataset.native = "";
    skip.addEventListener("click", (e) => { e.preventDefault(); view.focus(); });
  }

  /* ---------- footer "back to top" (pages append renderFooter()) ---------- */
  document.addEventListener("click", (e) => {
    const a = (e.target as Element).closest?.("[data-sf-top]");
    if (!a) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(0, { duration: 1.6 }); else scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
    view.focus({ preventScroll: true });
  });

  /* ---------- intro after the preloader ---------- */
  if (document.getElementById("loader") && !reducedMotion) {
    const bits = host.querySelectorAll(".ch > *");
    gsap.set(bits, { autoAlpha: 0, y: -14 });
    loaderGone.then(() => gsap.to(bits, { autoAlpha: 1, y: 0, duration: 0.9, ease: "expo.out", stagger: 0.05, clearProps: "opacity,visibility,transform" }));
  }

  /* ---------- route sync ---------- */
  const sync = (path: string) => {
    setActive(path);
    host.querySelectorAll<HTMLAnchorElement>(".mm-list a").forEach((a) => {
      if (activeIndex(path) >= 0 && a.getAttribute("href") === NAV[activeIndex(path)].href) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    scrolled = false;
    scrollHint.classList.remove("is-gone");
    body.classList.remove("is-scrolled", "nav-tucked");
    tucked = false;
    setNav(false);
    syncTheme();
    watchFooter();
    checkFits();
    queueSample();
    cursor?.recheck();
    // off the home page the stack is tucked from the first frame (the swap happens
    // under the transition cover), so it never sits on top of the page's own header
    autoTuck = path !== "/";
    applyTuck();
  };
  bus.on("route:before", () => {
    if (!open) return;
    if (reducedMotion) setMenu(false, false); else dropUnderCover = true;
  });
  bus.on("route:after", ({ path }) => {
    if (dropUnderCover) { dropUnderCover = false; dropMenu(); }
    sync(path);
  });
  sync(location.pathname);
}
