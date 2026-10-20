import { match, NOT_FOUND } from "./routes";
import type { Cleanup, Page } from "./page";
import { bus } from "./bus";
import { lenis, reducedMotion, ScrollTrigger, scrollTop } from "./motion";
import { enter, leave } from "./transition";
import { SITE } from "../data/site";
import { markFirstRender } from "./ready";

let cleanup: Cleanup | void;
let busy = false;
let queued: { path: string; push: boolean } | null = null;
let first = true;
/** pathname + search of the page currently in #view (the hash is not a page) */
let shown = "";

const view = () => document.getElementById("view") as HTMLElement;

/** "/about/" -> "/about"; the root stays "/" */
const tidy = (p: string) => (p.length > 1 ? p.replace(/\/+$/, "") || "/" : p);
const pageKey = (u: URL | Location) => tidy(u.pathname) + u.search;

/** Bring an in-page target (#id) into view and hand it focus, or say it is missing. */
function toHash(hash: string, smooth: boolean): boolean {
  if (!hash || hash === "#") return false;
  let id = hash.slice(1);
  try { id = decodeURIComponent(id); } catch { /* keep raw */ }
  const el = document.getElementById(id);
  if (!el) return false;
  if (lenis) lenis.scrollTo(el, { immediate: !smooth || reducedMotion, offset: -16 });
  else el.scrollIntoView({ behavior: smooth && !reducedMotion ? "smooth" : "auto", block: "start" });
  if (!el.matches("a[href], button, input, select, textarea, [tabindex]")) el.setAttribute("tabindex", "-1");
  el.focus({ preventScroll: true });
  return true;
}

async function loadPage(pathname: string): Promise<{ page: Page; params: Record<string, string> }> {
  const m = match(pathname);
  const mod = m ? await m.route.load() : await NOT_FOUND();
  return { page: mod.default, params: m?.params ?? {} };
}

const BURNT: Page = {
  title: "Kitchen fire",
  section: "Lost",
  mount({ root }) {
    root.innerHTML = `<section style="padding:30vh 10vw"><h1 class="caps-red" style="font-size:var(--t-2xl)">Kitchen fire.</h1><p class="serif" style="font-size:var(--t-lg)">Something burned on this page. <a class="u-link" href="/" data-native>Back to the front</a>.</p></section>`;
  },
};

async function render(pathname: string, search = "", hash = "") {
  let loaded: Awaited<ReturnType<typeof loadPage>>;
  try {
    loaded = await loadPage(pathname);
  } catch (e) {
    // A page chunk failed to load (offline, or a deploy replaced the hashed files).
    // After the first paint a full load of the same URL is the honest recovery.
    console.error(e);
    if (!first) { location.reload(); return new Promise<void>(() => {}); }
    loaded = { page: BURNT, params: {} };
  }
  const { page, params } = loaded;
  const el = view();

  if (!first) await leave(el);
  try { cleanup?.(); } catch (e) { console.error(e); }
  cleanup = undefined;
  ScrollTrigger.getAll().forEach((t) => t.kill());
  el.replaceChildren();
  el.dataset.page = page.section.toLowerCase();
  document.body.dataset.page = el.dataset.page;
  scrollTop();
  shown = pathname + search;

  const t = typeof page.title === "function" ? page.title(params) : page.title;
  document.title = t ? `${t} | ${SITE.name}` : `${SITE.name}: ${SITE.tagline}`;

  // Pages may wait on loaderGone inside mount(), so the loader must not wait
  // for mount to settle. Signal as soon as mount has been called.
  try {
    const mounting = page.mount({ root: el, params, first });
    if (first) markFirstRender();
    cleanup = await mounting;
  } catch (e) {
    // Never leave the visitor behind a transition cover with a dead page.
    console.error(e);
    if (first) markFirstRender();
    el.replaceChildren();
    BURNT.mount({ root: el, params, first });
  }
  bus.emit("route:after", { path: pathname, section: page.section });
  ScrollTrigger.refresh();
  if (!first) await enter(el);
  first = false;
  // deep link to a section of the new page: go there once it is laid out
  if (hash) requestAnimationFrame(() => toHash(hash, false));
}

export async function navigate(to: string, push = true) {
  const url = new URL(to, location.href);
  if (url.origin !== location.origin) { location.href = to; return; }
  const path = tidy(url.pathname);
  const target = path + url.search + url.hash;
  if (busy) { queued = { path: target, push }; return; }
  // same page, only the fragment differs: scroll, do not re-render
  if (url.pathname + url.search === location.pathname + location.search && pageKey(url) === shown) {
    if (push && url.hash !== location.hash) history.pushState(history.state, "", target);
    if (!toHash(url.hash, true) && push && !url.hash) {
      // a link to the page you are on: take it from the top
      if (lenis) lenis.scrollTo(0, { duration: 1.2 });
      else scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
    }
    return;
  }
  busy = true;
  bus.emit("route:before", { to: path });
  if (push) history.pushState({}, "", target);
  else if (path !== url.pathname) history.replaceState(history.state, "", target);
  try { await render(path, url.search, url.hash); } finally { busy = false; }
  drain();
}

/** Run the navigation that arrived while a render was in flight. */
function drain() {
  if (!queued) return;
  const q = queued; queued = null;
  // a history step queued mid-transition: follow wherever the address bar is now
  navigate(q.push ? q.path : location.href, q.push);
}

/** Links the router leaves to the browser. */
function isNative(a: Element, url: URL): boolean {
  if (a.hasAttribute("download") || (a as HTMLElement).dataset.native !== undefined) return true;
  const target = a.getAttribute("target");
  if (target && target !== "_self") return true;
  if (url.origin !== location.origin) return true; // other sites, mailto:, tel:, ...
  if (/\.[a-z0-9]{2,5}$/i.test(url.pathname)) return true; // files: /og.png, /site.webmanifest
  return false;
}

export function initRouter() {
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element).closest?.("a[href]");
    if (!a || a.closest(".pt")) return;
    const raw = a instanceof SVGAElement ? a.href.baseVal : (a as HTMLAnchorElement).href;
    let url: URL;
    try { url = new URL(raw, location.href); } catch { return; }
    if (isNative(a, url)) return;
    e.preventDefault();
    navigate(url.pathname + url.search + url.hash);
  });
  window.addEventListener("popstate", () => navigate(location.href, false));
  const url = new URL(location.href);
  const path = tidy(url.pathname);
  if (path !== url.pathname) history.replaceState(history.state, "", path + url.search + url.hash);
  // the first render is a navigation too: a back/forward step or a link activated
  // under the preloader waits for it instead of mounting a second page alongside
  busy = true;
  const done = render(path, url.search, url.hash);
  done.finally(() => { busy = false; drain(); }).catch(() => {});
  return done;
}
