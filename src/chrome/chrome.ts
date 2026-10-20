// Persistent chrome: a single row header (wordmark, nav, source link), the mobile
// menu, the custom cursor, the route announcer, and footer behavior.
import { bus } from "../core/bus";
import { gsap, lenis, reducedMotion } from "../core/motion";
import { SITE } from "../data/site";
import { initCursor } from "./cursor";
import { bindFooter } from "./footer";
import { NAV, activeIndex } from "./sections";

const ARROW = `<svg class="ch-ext" viewBox="0 0 10 10" aria-hidden="true"><path d="M2.5 7.5 7.5 2.5M3.5 2.5h4v4"/></svg>`;

function markup() {
  const links = NAV.map((n) => `<li><a href="${n.href}">${n.label}</a></li>`).join("");
  return `
  <header class="ch" data-chrome-root>
    <a class="ch-mark" href="/" aria-label="${SITE.name}, home">${SITE.name}</a>
    <nav class="ch-nav" aria-label="Primary">
      <ul class="ch-list">${links}</ul>
      <a class="ch-src" href="${SITE.repo}" target="_blank" rel="noopener">GitHub${ARROW}<span class="sr-only"> (opens in a new tab)</span></a>
    </nav>
    <button class="ch-mbtn" type="button" aria-expanded="false" aria-controls="mm">Menu</button>
  </header>
  <div class="mm" id="mm" role="dialog" aria-modal="true" aria-label="Site menu" hidden>
    <div class="mm-top">
      <a class="mm-mark" href="/">${SITE.name}</a>
      <button class="mm-close" type="button">Close</button>
    </div>
    <ul class="mm-list">${NAV.map((n) => `<li><a href="${n.href}">${n.label}</a></li>`).join("")}</ul>
    <div class="mm-foot">
      <a href="${SITE.repo}" target="_blank" rel="noopener">GitHub${ARROW}<span class="sr-only"> (opens in a new tab)</span></a>
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
  const header = $(".ch");
  const cursor = initCursor();

  /* ---------- active link ---------- */
  const setActive = (path: string) => {
    const i = activeIndex(path);
    host.querySelectorAll<HTMLAnchorElement>(".ch-list a, .mm-list a").forEach((a) => {
      if (i >= 0 && a.getAttribute("href") === NAV[i].href) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  };

  /* ---------- dark first screen: a page can set data-theme="dark" on #view ---------- */
  const syncTheme = () => { body.dataset.chrome = view.dataset.theme === "dark" ? "dark" : "light"; };
  new MutationObserver(syncTheme).observe(view, { attributes: true, attributeFilter: ["data-theme"] });
  syncTheme();

  /* ---------- header on scroll: solid once the page moves, out of the way while
     reading down, back as soon as the visitor scrolls up ---------- */
  let lastY = 0, raf = 0;
  const setState = () => {
    raf = 0;
    const y = Math.max(0, window.scrollY);
    const solid = y > 8;
    const hide = !reducedMotion && y > 160 && y > lastY + 2 && !header.contains(document.activeElement);
    const show = y < lastY - 2 || y <= 160;
    header.classList.toggle("is-solid", solid);
    if (hide) header.classList.add("is-hidden");
    else if (show) header.classList.remove("is-hidden");
    lastY = y;
  };
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(setState); };
  addEventListener("scroll", onScroll, { passive: true });
  header.addEventListener("focusin", () => header.classList.remove("is-hidden"));

  /* ---------- mobile menu ---------- */
  const mm = $(".mm");
  const mbtn = $<HTMLButtonElement>(".ch-mbtn");
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
    if (v) {
      mm.hidden = false;
      lockBehind(true);
      lenis?.stop();
      document.addEventListener("keydown", trap);
      tl = gsap.timeline();
      // opacity only: the sheet must stay focusable from the first frame
      tl.fromTo(mm, { opacity: 0 }, { opacity: 1, duration: reducedMotion ? 0.12 : 0.22, ease: "power1.out" });
      if (!reducedMotion) tl.fromTo(mm.querySelectorAll(".mm-list li"), { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power3.out", stagger: 0.04, clearProps: "transform,opacity" }, 0.05);
      (mm.querySelector(".mm-list a") as HTMLElement).focus({ preventScroll: true });
    } else {
      document.removeEventListener("keydown", trap);
      lockBehind(false);
      lenis?.start();
      tl = gsap.timeline({ onComplete: () => { mm.hidden = true; } });
      tl.to(mm, { opacity: 0, duration: reducedMotion ? 0.1 : 0.2, ease: "power1.in" });
      if (restoreFocus) mbtn.focus({ preventScroll: true });
    }
    cursor?.recheck();
  }
  mbtn.addEventListener("click", () => setMenu(true));
  $(".mm-close").addEventListener("click", () => setMenu(false));
  mm.addEventListener("click", (e) => {
    const a = (e.target as Element).closest("a");
    if (!a) return;
    // a link to the page already shown, or one leaving the site: close here.
    // Others close once the next page is in place (route:after).
    const same = a.origin === location.origin && a.pathname === location.pathname;
    if (same || a.target === "_blank") setMenu(false, false);
  });
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
    if (lenis) lenis.scrollTo(0, { duration: 1.2 }); else scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
    view.focus({ preventScroll: true });
  });

  /* ---------- route sync ---------- */
  const sync = (path: string) => {
    setActive(path);
    syncTheme();
    lastY = 0;
    header.classList.remove("is-hidden", "is-solid");
    bindFooter(view);
    cursor?.recheck();
  };
  // Leaving through the menu: the sheet stays up while the old page fades behind
  // it, then drops at once, and the new page fades in on clean flour.
  let dropOnArrive = false;
  bus.on("route:before", () => { if (open) dropOnArrive = true; });
  bus.on("route:after", ({ path }) => {
    if (dropOnArrive) {
      dropOnArrive = false;
      if (open) { setMenu(false, false); tl?.progress(1); }
    }
    sync(path);
  });
  setActive(location.pathname);
}
