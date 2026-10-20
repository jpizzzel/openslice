// TOOL: one tool, plainly. Name, cover, story, features, details, links, next tool.
import "../styles/pages/tool.css";
import type { Page } from "../core/page";
import { gsap } from "../core/motion";
import { SITE, TOOLS, type Tool } from "../data/site";
import { poster } from "../art/index";
import { arrowSVG, esc, footerHTML, isClassified, makers, replacesText, rise, statusText } from "./toolbox/shared";

const N = TOOLS.length;

function linksHTML(t: Tool) {
  if (t.links.length) {
    return `<div class="td-btns">${t.links
      .map((l) => {
        const ext = /^https?:/.test(l.href);
        return `<a class="td-btn" href="${esc(l.href)}"${ext ? ` target="_blank" rel="noopener"` : ""}><span>${esc(l.label)}</span>${arrowSVG(ext ? "ne" : "right")}</a>`;
      })
      .join("")}</div>`;
  }
  if (t.status === "served") {
    return `<div class="td-btns"><a class="td-btn" href="${SITE.repo}" target="_blank" rel="noopener"><span>Get it on GitHub</span>${arrowSVG("ne")}</a></div>`;
  }
  return `<p class="td-note">Not released yet. <a class="td-a" href="${SITE.repo}" target="_blank" rel="noopener">Watch the repo</a>.</p>`;
}

function notFound(slug: string) {
  return `
<article class="p-tool td-404">
  <div class="td-404__in" data-now>
    <a class="td-back" href="/toolbox">${arrowSVG("left")}<span>Toolbox</span></a>
    <h1 class="td-name td-name--sm">Not found</h1>
    <p class="td-blurb">There is no tool called "${esc(slug)}".</p>
  </div>
</article>
${footerHTML()}`;
}

function template(t: Tool, i: number) {
  const next = TOOLS[(i + 1) % N];
  const cls = isClassified(t);
  const ppl = makers(t);
  const details: [string, string][] = [
    ["Made by", ppl.map((p) => `<a class="td-a" href="${esc(p.site)}" target="_blank" rel="noopener">${esc(p.name)}</a>`).join("<br>")],
    ["Platform", esc(t.platform)],
    ["Status", esc(statusText(t))],
    ["Replaces", esc(replacesText(t))],
    ["Year", String(t.year)],
    ["License", "MIT"],
  ];
  return `
<article class="p-tool${cls ? " is-classified" : ""}">
  <section class="td-hero" aria-labelledby="td-h1">
    <a class="td-back" href="/toolbox" data-now>${arrowSVG("left")}<span>Toolbox</span></a>
    <div class="td-copy">
      <p class="td-kind" data-now>${esc(t.kind)}</p>
      <h1 id="td-h1" class="td-name" data-now>${esc(t.name)}</h1>
      <p class="td-blurb" data-now>${esc(t.blurb)}</p>
      <div data-now>${linksHTML(t)}</div>
    </div>
    <figure class="td-cover" data-now style="--c:${t.color}">
      <div class="td-cover__in">${poster(t, { label: `${t.name} cover` })}</div>
    </figure>
  </section>

  <section class="td-body">
    <div class="td-main">
      <div class="td-block" data-later>
        <h2 class="td-h2">About</h2>
        <p class="td-story">${cls ? "Details coming soon." : esc(t.story)}</p>
      </div>
      ${!cls && t.features.length ? `
      <div class="td-block" data-later>
        <h2 class="td-h2">What it does</h2>
        <ul class="td-feats">${t.features.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
      </div>` : ""}
    </div>
    <div class="td-details" data-later>
      <h2 class="td-h2">Details</h2>
      <dl class="td-dl">${details.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>
    </div>
  </section>

  <nav class="td-nextwrap" aria-label="Next tool" data-later>
    <a class="td-next" href="/toolbox/${next.slug}">
      <span class="td-next__k">Next</span>
      <span class="td-next__name">${esc(next.name)}</span>
      <span class="td-next__kind">${esc(next.kind)}, ${esc(next.platform)}</span>
      <span class="td-next__go" aria-hidden="true">${arrowSVG("right")}</span>
    </a>
  </nav>
</article>
${footerHTML()}`;
}

const page: Page = {
  title: (p) => TOOLS.find((t) => t.slug === p.slug)?.name ?? "Not found",
  section: "Toolbox",
  mount({ root, params, first }) {
    const i = TOOLS.findIndex((t) => t.slug === params.slug);
    root.innerHTML = i < 0 ? notFound(params.slug ?? "") : template(TOOLS[i], i);
    const el = root.querySelector<HTMLElement>(".p-tool")!;
    const ctx = gsap.context(() => {}, el);
    let alive = true;
    rise(ctx, [...el.querySelectorAll("[data-now]")], [...el.querySelectorAll("[data-later]")], first, () => alive);
    return () => {
      alive = false;
      ctx.revert();
    };
  },
};

export default page;
