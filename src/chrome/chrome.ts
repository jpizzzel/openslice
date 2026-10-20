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
import { NAV, activeIndex } from "./sections";

const repoLabel = () => {
  const m = SITE.repo.match(/github\.com\/[^/]+\/([^/]+)/);
  return `github / ${m ? m[1] : "repo"}`;
};

const audioBtn = (cls: string) => `
  <button class="ch-audio ${cls}" type="button" aria-pressed="false">
    <span class="ch-lbl">Oven</span> <b class="ch-audio-v">Off</b>
    <svg class="ch-wave" viewBox="0 0 16 8" aria-hidden="true"><g><path d="M0 4 Q3 0.5 6 4 T12 4 T18 4 T24 4 T30 4 T36 4 T42 4 T48 4"/></g></svg>
    <span class="sr-only">ambient sound</span>
  </button>`;

function markup() {
  const links = NAV.map((n, i) => `<li><a href="${n.href}" data-i="${i}"><span>${n.label}</span></a></li>`).join("");
  const bigLinks = NAV.map((n, i) => `<li><a href="${n.href}"><span class="mm-n">0${i + 1}</span><span class="mm-t">${n.label}</span></a></li>`).join("");
  return `
  <header class="ch" data-chrome-root>
    <div class="ch-bar" aria-hidden="true"></div>
    <a class="ch-mark" href="/" aria-label="${SITE.name}, home">
      <span class="ch-word" aria-hidden="true">OPENSLICE<i>©</i></span>
    </a>
    <div class="ch-meta" aria-hidden="true"><span>est. ${SITE.since}</span><span>two roommates</span><span>one oven</span></div>
    <nav class="ch-nav" aria-label="Primary">
      <span class="ch-lbl">Menu</span>
      <div class="ch-lw"><ul class="ch-list">${links}</ul><span class="ch-arrow" aria-hidden="true">&rarr;</span></div>
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
    b.querySelector(".ch-audio-v")!.textContent = on ? "On" : "Off";
  }));

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
  items.forEach((a) => a.addEventListener("pointerenter", () => bus.emit("sfx", { name: "tick" })));
  host.addEventListener("click", (e) => {
    if ((e.target as Element).closest("a")) bus.emit("sfx", { name: "click" });
  });

  /* ---------- theme: readable on flour and dark pages ---------- */
  const syncTheme = () => { body.dataset.chrome = view.dataset.theme === "dark" ? "dark" : "light"; };
  new MutationObserver(syncTheme).observe(view, { attributes: true, attributeFilter: ["data-theme"] });
  syncTheme();

  /* ---------- scroll hint + footer awareness ---------- */
  const scrollHint = $(".ch-scroll");
  let scrolled = false;
  const onScroll = () => {
    const s = window.scrollY > 40;
    if (s !== scrolled) { scrolled = s; scrollHint.classList.toggle("is-gone", s); body.classList.toggle("is-scrolled", s); }
  };
  addEventListener("scroll", onScroll, { passive: true });
  let footIO: IntersectionObserver | null = null;
  const watchFooter = () => {
    footIO?.disconnect();
    body.classList.remove("footer-in");
    const f = view.querySelector(".site-footer");
    if (!f) return;
    footIO = new IntersectionObserver(([en]) => body.classList.toggle("footer-in", en.isIntersecting), { rootMargin: "0px 0px -40px 0px" });
    footIO.observe(f);
  };

  /* ---------- mobile overlay menu ---------- */
  const mm = $(".mm");
  const mbtn = $<HTMLButtonElement>(".ch-mbtn");
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
      lenis?.stop();
      document.addEventListener("keydown", trap);
      const big = mm.querySelectorAll(".mm-t, .mm-n");
      tl = gsap.timeline();
      if (reducedMotion) tl.fromTo(mm, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 });
      else tl
        .fromTo(mm, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.6, ease: "expo.inOut" })
        .fromTo(big, { yPercent: 110 }, { yPercent: 0, duration: 0.8, ease: "expo.out", stagger: 0.05 }, 0.25)
        .fromTo(".mm-slice", { rotate: -40, scale: 0.6, autoAlpha: 0 }, { rotate: 0, scale: 1, autoAlpha: 1, duration: 0.9, ease: "back.out(1.6)" }, 0.35)
        .fromTo(".mm-foot > *, .mm-top > *", { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.04, ease: "power3.out" }, 0.4);
      (mm.querySelector(".mm-list a") as HTMLElement).focus({ preventScroll: true });
    } else {
      document.removeEventListener("keydown", trap);
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
    body.classList.remove("is-scrolled");
    syncTheme();
    watchFooter();
    cursor?.recheck();
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
