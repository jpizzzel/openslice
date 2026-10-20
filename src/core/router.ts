import { match, NOT_FOUND } from "./routes";
import type { Cleanup, Page } from "./page";
import { bus } from "./bus";
import { ScrollTrigger, scrollTop } from "./motion";
import { enter, leave } from "./transition";
import { SITE } from "../data/site";
import { markFirstRender } from "./ready";

let cleanup: Cleanup | void;
let busy = false;
let queued: string | null = null;
let first = true;

const view = () => document.getElementById("view") as HTMLElement;

async function render(pathname: string) {
  const m = match(pathname);
  const mod = m ? await m.route.load() : await NOT_FOUND();
  const page: Page = mod.default;
  const params = m?.params ?? {};
  const el = view();

  if (!first) await leave(el);
  try { cleanup?.(); } catch (e) { console.error(e); }
  cleanup = undefined;
  ScrollTrigger.getAll().forEach((t) => t.kill());
  el.replaceChildren();
  el.dataset.page = page.section.toLowerCase();
  document.body.dataset.page = el.dataset.page;
  scrollTop();

  const t = typeof page.title === "function" ? page.title(params) : page.title;
  document.title = t ? `${t} | ${SITE.name}` : `${SITE.name}: ${SITE.tagline}`;

  // Pages may wait on loaderGone inside mount(), so the loader must not wait
  // for mount to settle. Signal as soon as mount has been called.
  const mounting = page.mount({ root: el, params, first });
  if (first) markFirstRender();
  cleanup = await mounting;
  bus.emit("route:after", { path: pathname, section: page.section });
  ScrollTrigger.refresh();
  if (!first) await enter(el);
  first = false;
}

export async function navigate(to: string, push = true) {
  const url = new URL(to, location.href);
  if (url.origin !== location.origin) { location.href = to; return; }
  if (push && url.pathname === location.pathname && url.hash) return;
  if (push && url.pathname === location.pathname) return;
  if (busy) { queued = url.pathname; return; }
  busy = true;
  bus.emit("route:before", { to: url.pathname });
  if (push) history.pushState({}, "", url.pathname + url.search + url.hash);
  try { await render(url.pathname); } finally { busy = false; }
  if (queued) { const q = queued; queued = null; navigate(q); }
}

export function initRouter() {
  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element).closest?.("a[href]") as HTMLAnchorElement | null;
    if (!a || a.target === "_blank" || a.hasAttribute("download") || a.dataset.native !== undefined) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    e.preventDefault();
    navigate(url.pathname + url.search + url.hash);
  });
  window.addEventListener("popstate", () => navigate(location.pathname, false));
  return render(location.pathname);
}
