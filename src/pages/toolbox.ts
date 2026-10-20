// TOOLBOX: the covers stack is the page. A plain list of names beside it and the
// details of the cover in front.
import "../styles/pages/toolbox.css";
import type { Page } from "../core/page";
import { gsap, finePointer } from "../core/motion";
import { TOOLS, type Tool } from "../data/site";
import { stackHTML, ctrlHTML, mountStack, panelsHTML, showPanel } from "./toolbox/stack";
import { arrowSVG, esc, footerHTML, isClassified, makers, replacesText, rise, statusText } from "./toolbox/shared";

const N = TOOLS.length;

function infoHTML(t: Tool) {
  const rows: [string, string][] = [
    ["Kind", esc(t.kind)],
    ["Platform", esc(t.platform)],
    ["Status", esc(statusText(t))],
    ["Made by", makers(t).map((p) => esc(p.name)).join("<br>")],
    ["Replaces", esc(replacesText(t))],
  ];
  return `
    <div class="tb-info__body">
      <p class="tb-info__name">${esc(t.name)}</p>
      <p class="tb-info__blurb">${esc(t.blurb)}</p>
      <dl class="tb-dl">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>
    </div>
    <a class="tb-open" href="/toolbox/${t.slug}"><span>Open ${esc(t.name)}</span>${arrowSVG("right")}</a>`;
}

function template() {
  return `
<div class="p-toolbox">
  <section class="tb" aria-labelledby="tb-h1">
    <header class="tb-head" data-now>
      <h1 id="tb-h1" class="tb-h1">Toolbox</h1>
      <p class="tb-sub">${N} tools so far, all free and open source.</p>
    </header>

    <div class="tb-stack" data-now>
      ${stackHTML(TOOLS, "Tool covers")}
      <div class="tb-ctrl">
        ${ctrlHTML(N)}
        <p class="tb-hint" aria-hidden="true">Drag or swipe the covers</p>
      </div>
    </div>

    <div class="tb-info" data-now>
      ${panelsHTML(TOOLS, infoHTML)}
    </div>

    <nav class="tb-list" aria-label="All tools" data-now>
      <ol>${TOOLS.map((t, i) => `
        <li><a href="/toolbox/${t.slug}" data-i="${i}"${i === 0 ? ` aria-current="true"` : ""}>${esc(t.name)}${isClassified(t) ? `<span class="sr-only">, not announced yet</span>` : ""}</a></li>`).join("")}
      </ol>
    </nav>
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
    const ctx = gsap.context(() => {}, el);
    let alive = true;
    const offs: (() => void)[] = [];

    const info = el.querySelector<HTMLElement>(".tb-info")!;
    const list = el.querySelector<HTMLElement>(".tb-list")!;
    const links = [...list.querySelectorAll<HTMLAnchorElement>("a")];

    const stack = mountStack(el.querySelector<HTMLElement>(".cv")!, {
      tools: TOOLS,
      controls: el.querySelector<HTMLElement>(".cv-ctrl"),
      keyScopes: [list, el.querySelector<HTMLElement>(".tb-info")!],
      pageKeys: true,
      onChange: (i) => {
        links.forEach((a, n) => (n === i ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current")));
        showPanel(info, i);
      },
    });

    // the list previews: hovering or tabbing to a name brings its cover to the front
    const preview = (e: Event) => {
      const a = (e.target as Element).closest<HTMLAnchorElement>("a[data-i]");
      if (a) stack.go(Number(a.dataset.i));
    };
    list.addEventListener("focusin", preview);
    offs.push(() => list.removeEventListener("focusin", preview));
    if (finePointer) {
      list.addEventListener("pointerover", preview);
      offs.push(() => list.removeEventListener("pointerover", preview));
    }

    rise(ctx, [...el.querySelectorAll("[data-now]")], [], first, () => alive);

    return () => {
      alive = false;
      offs.forEach((f) => f());
      stack.destroy();
      ctx.revert();
    };
  },
};

export default page;
