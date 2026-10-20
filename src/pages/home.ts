// HOME: the name, one sentence and the covers stack; a plain index of the tools; who we are.
import "../styles/pages/home.css";
import type { Page } from "../core/page";
import { gsap } from "../core/motion";
import { SITE, TOOLS, type Tool } from "../data/site";
import { mascot } from "../art/index";
import { stackHTML, ctrlHTML, mountStack, panelsHTML, showPanel } from "./toolbox/stack";
import { arrowSVG, esc, footerHTML, isClassified, rise, statusText } from "./toolbox/shared";

const N = TOOLS.length;
const listed = TOOLS.filter((t) => !isClassified(t));
const hidden = N - listed.length;

const nowHTML = (t: Tool) => `
  <div class="hm-now">
    <div class="hm-now__txt">
      <p class="hm-now__name">${esc(t.name)}<span class="hm-now__kind">${esc(t.kind)}</span></p>
      <p class="hm-now__blurb">${esc(t.blurb)}</p>
    </div>
    <a class="hm-open" href="/toolbox/${t.slug}"><span>Open ${esc(t.name)}</span>${arrowSVG("right")}</a>
  </div>`;

function rowHTML(t: Tool) {
  return `
      <li>
        <a class="hm-row" href="/toolbox/${t.slug}">
          <span class="hm-row__name">${esc(t.name)}</span>
          <span class="hm-row__what">${esc(t.kind)}, ${esc(t.platform)}</span>
          <span class="hm-row__rep">${t.replaces ? `<span class="hm-row__k">Replaces </span>${esc(t.replaces)}` : ""}</span>
          <span class="hm-row__st">${esc(statusText(t))}</span>
          <span class="hm-row__go" aria-hidden="true">${arrowSVG("right")}</span>
        </a>
      </li>`;
}

function template() {
  return `
<div class="p-home">
  <section class="hm-hero" aria-labelledby="hm-h1">
    <div class="hm-copy">
      <h1 id="hm-h1" class="hm-h1" data-now>${esc(SITE.name)}</h1>
      <p class="hm-intro" data-now>${esc(SITE.intro)}</p>
    </div>
    <div class="hm-covers" data-now>
      ${stackHTML(TOOLS, "Tool covers")}
      <div class="hm-cap">
        ${ctrlHTML(N)}
        ${panelsHTML(TOOLS, nowHTML)}
      </div>
    </div>
  </section>

  <section class="hm-index" aria-labelledby="hm-index-h">
    <div class="hm-sechead" data-later>
      <h2 id="hm-index-h" class="hm-h2">Tools</h2>
      <a class="hm-link" href="/toolbox">Browse the covers</a>
    </div>
    <div class="hm-cols" aria-hidden="true" data-later>
      <span>Name</span><span>What it is</span><span>Replaces</span><span>Status</span>
    </div>
    <ul class="hm-rows" data-later>${listed.map(rowHTML).join("")}
      ${hidden ? `<li class="hm-more">+${hidden} more in progress</li>` : ""}
    </ul>
  </section>

  <section class="hm-who" aria-labelledby="hm-who-h">
    <div class="hm-who__art" aria-hidden="true" data-later>
      <span class="hm-who__m">${mascot("jonah", "stand")}</span>
      <span class="hm-who__m">${mascot("peter", "stand")}</span>
    </div>
    <div class="hm-who__txt" data-later>
      <h2 id="hm-who-h" class="hm-h2">Who we are</h2>
      ${SITE.who.map((p) => `<p>${esc(p)}</p>`).join("")}
      <p class="hm-who__links">
        <a class="hm-link" href="/about">About us</a>
        <a class="hm-link" href="/slices">${esc(SITE.trunk.name)}</a>
      </p>
    </div>
  </section>
  ${footerHTML()}
</div>`;
}

const page: Page = {
  title: "",
  section: "Home",
  mount({ root, first }) {
    root.innerHTML = template();
    const el = root.querySelector<HTMLElement>(".p-home")!;
    const ctx = gsap.context(() => {}, el);
    let alive = true;

    const cap = el.querySelector<HTMLElement>(".hm-cap")!;
    const stack = mountStack(el.querySelector<HTMLElement>(".cv")!, {
      tools: TOOLS,
      controls: el.querySelector<HTMLElement>(".cv-ctrl"),
      keyScopes: [el.querySelector<HTMLElement>(".hm-cap")!],
      onChange: (i) => showPanel(cap, i),
    });

    rise(ctx, [...el.querySelectorAll("[data-now]")], [...el.querySelectorAll("[data-later]")], first, () => alive);

    return () => {
      alive = false;
      stack.destroy();
      ctx.revert();
    };
  },
};

export default page;
