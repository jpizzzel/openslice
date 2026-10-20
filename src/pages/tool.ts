import "../styles/pages/tool.css";
import type { Page } from "../core/page";
import { gsap, reducedMotion, finePointer } from "../core/motion";
import { SplitText } from "gsap/SplitText";
import { loaderGone } from "../core/ready";
import { bus } from "../core/bus";
import { SITE, STATUS_LABEL, TOOLS, type Tool } from "../data/site";
import { glyph, mascot, poster, type Pose } from "../art/index";
import {
  arrowSVG, esc, footerHTML, isClassified, makers, pad, redact, replacesText, statusPill,
} from "./toolbox/shared";

gsap.registerPlugin(SplitText);

const N = TOOLS.length;
const POSE: Record<string, Pose> = { jonah: "point", peter: "wave" };

/** Splits a story into a highlighted lead clause and the rest. */
function storyHTML(t: Tool) {
  if (isClassified(t)) return redact(t.story, 3);
  const m = t.story.match(/^(.+?[,.:])\s(.*)$/s);
  if (!m) return esc(t.story);
  return `<span class="td-lead">${esc(m[1])}</span> ${esc(m[2])}`;
}

function featuresHTML(t: Tool) {
  if (!t.features.length) {
    const widths = [78, 54, 66];
    return widths
      .map((w, i) => `
      <li class="td-feat is-redacted">
        <span class="td-feat__num mono">${pad(i + 1)}</span>
        <span class="td-feat__txt"><span class="rd rd--block" style="--w:${w}%;--rd:${i * 0.4}s"><span class="sr-only">Redacted</span></span></span>
        <i class="td-feat__line" aria-hidden="true"></i>
      </li>`)
      .join("");
  }
  return t.features
    .map((f, i) => `
      <li class="td-feat">
        <span class="td-feat__num mono">${pad(i + 1)}</span>
        <span class="td-feat__txt"><span class="td-feat__in">${esc(f)}</span></span>
        <i class="td-feat__line" aria-hidden="true"></i>
      </li>`)
    .join("");
}

function linksHTML(t: Tool) {
  if (!t.links.length) {
    return `
      <p class="td-soon serif">Recipe drops soon.</p>
      <div class="td-btns">
        <a class="td-btn" href="${SITE.repo}" target="_blank" rel="noopener" data-cursor="GitHub">
          <span>Watch the repo</span>${arrowSVG("ne")}
        </a>
      </div>`;
  }
  return `<div class="td-btns">${t.links
    .map((l) => {
      const ext = /^https?:/.test(l.href);
      return `<a class="td-btn" href="${esc(l.href)}"${ext ? ` target="_blank" rel="noopener"` : ""} data-cursor="Go">
        <span>${esc(l.label)}</span>${arrowSVG(ext ? "ne" : "right")}</a>`;
    })
    .join("")}</div>`;
}

function notFound(slug: string) {
  return `
<article class="p-tool td-404">
  <div class="td-404__art" aria-hidden="true">${mascot("jonah", "point")}</div>
  <div class="td-404__copy">
    <p class="label">Toolbox / ${esc(slug)}</p>
    <h1 class="td-404__h serif">This slice is not on the menu.</h1>
    <p class="td-404__p">We looked in the oven, the fridge and under the couch. Nothing called "${esc(slug)}" yet.</p>
    <a class="td-btn td-btn--ink" href="/toolbox" data-cursor="Back"><span>Back to the toolbox</span>${arrowSVG("left")}</a>
  </div>
</article>
${footerHTML()}`;
}

function template(t: Tool, i: number) {
  const next = TOOLS[(i + 1) % N];
  const ppl = makers(t);
  const cls = isClassified(t);
  const chars = [...t.name.toUpperCase()].map((c) => `<span class="td-ch">${esc(c)}</span>`).join("");
  return `
<article class="p-tool${cls ? " is-classified" : ""}" style="--tc:${t.color}">
  <section class="td-hero">
    <div class="td-top">
      <a class="td-back td-fade" href="/toolbox" data-cursor="Back">${arrowSVG("left")}<span>Toolbox</span></a>
      <span class="td-fade mono td-idx">${pad(i + 1)} / ${pad(N)}</span>
      <span class="td-fade td-kind">${esc(t.kind)}</span>
      <span class="td-fade">${statusPill(t)}</span>
      <span class="td-fade td-plat label">${esc(t.platform)}</span>
    </div>

    <div class="td-mega mega" aria-hidden="true">${pad(i + 1)}</div>

    <figure class="td-poster" data-cursor="${cls ? "Shh" : "Tilt"}">
      <div class="td-poster__tilt">
        <div class="td-poster__art">${poster(t, { label: `${t.name} poster` })}</div>
        ${cls ? `<span class="td-stamp td-stamp--big" aria-hidden="true">Classified</span>` : ""}
      </div>
    </figure>

    <div class="td-title">
      <h1 class="td-name" aria-label="${esc(t.name)}" style="--chars:${t.name.length}">
        <span class="td-name__mask" aria-hidden="true">${chars}</span>
      </h1>
      ${t.codename ? `<span class="td-wt" aria-label="working title">Working<br>title</span>` : ""}
      ${cls ? `<span class="td-wt td-wt--cls" aria-hidden="true">Top<br>secret</span>` : ""}
    </div>
    <p class="td-blurb serif td-fade">${cls ? redact(t.blurb, 4) : esc(t.blurb)}</p>

    <dl class="td-facts">
      <div class="td-fade"><dt class="label">Made by</dt><dd>${ppl.map((p) => esc(p.name)).join("<br>")}</dd></div>
      <div class="td-fade"><dt class="label">Status</dt><dd>${esc(STATUS_LABEL[t.status])}</dd></div>
      <div class="td-fade"><dt class="label">Replaces</dt><dd>${cls ? `<span class="rd">Classified</span>` : esc(replacesText(t))}</dd></div>
      <div class="td-fade"><dt class="label">Year</dt><dd>${t.year}</dd></div>
    </dl>
  </section>

  <section class="td-story" aria-labelledby="td-story-h">
    <div class="td-side">
      <h2 id="td-story-h" class="label">${cls ? "The story, mostly" : "The story"}</h2>
      <div class="td-glyph" aria-hidden="true">${glyph(t.glyph)}</div>
    </div>
    <p class="td-story__text serif">${storyHTML(t)}</p>
  </section>

  <section class="td-feats" aria-labelledby="td-feats-h">
    <div class="td-side">
      <h2 id="td-feats-h" class="label">${cls ? "What it does" : "What it does"}</h2>
      <p class="td-side__n caps-red">${pad(t.features.length || 3)}<span>${cls ? "redacted" : "things"}</span></p>
    </div>
    <ol class="td-feat-list">${featuresHTML(t)}</ol>
  </section>

  <section class="td-credits" aria-label="Credits and links">
    <div class="td-card td-card--credits">
      <h2 class="td-card__h">Credits</h2>
      <dl class="td-card__grid">
        <div><dt class="label">Made by</dt><dd>${ppl
          .map((p) => `<a class="u-link" href="${p.site}" target="_blank" rel="noopener">${esc(p.name)}</a>`)
          .join("<br>")}</dd></div>
        <div><dt class="label">Platform</dt><dd>${esc(t.platform)}</dd></div>
        <div><dt class="label">Replaces</dt><dd>${cls ? `<span class="rd">Something paid</span>` : esc(replacesText(t))}</dd></div>
        <div><dt class="label">Year</dt><dd>${t.year}</dd></div>
        <div><dt class="label">License</dt><dd>MIT</dd></div>
      </dl>
      <div class="td-card__mascots n${ppl.length}" aria-hidden="true">
        ${ppl.map((p) => `<span class="td-mascot">${mascot(p.id, POSE[p.id] ?? "stand")}</span>`).join("")}
      </div>
      ${cls ? `<span class="td-stamp td-stamp--card" aria-hidden="true">Classified</span>` : ""}
    </div>
    <div class="td-card td-card--links">
      <h2 class="td-card__h">${t.links.length ? "Grab a slice" : "Still in the oven"}</h2>
      ${linksHTML(t)}
      <p class="td-card__foot label">Free forever. Open source, MIT.</p>
    </div>
  </section>

  <a class="td-next" href="/toolbox/${next.slug}" data-cursor="Next" style="--nc:${next.color}">
    <span class="td-next__top"><span class="label">Next slice</span><span class="mono">${pad(((i + 1) % N) + 1)} / ${pad(N)}</span></span>
    <span class="td-next__name" style="--chars:${next.name.length}">
      <span class="td-next__roll"><span>${esc(next.name)}</span><span aria-hidden="true">${esc(next.name)}</span></span>
    </span>
    <span class="td-next__kind label">${esc(next.kind)} / ${esc(next.platform)}</span>
    <span class="td-next__poster" aria-hidden="true"><span class="td-next__tilt">${poster(next)}</span></span>
  </a>
</article>
${footerHTML()}`;
}

const page: Page = {
  title: (p) => TOOLS.find((t) => t.slug === p.slug)?.name ?? "Slice not found",
  section: "Toolbox",
  mount({ root, params, first }) {
    const i = TOOLS.findIndex((t) => t.slug === params.slug);
    if (i < 0) {
      root.innerHTML = notFound(params.slug ?? "");
      return;
    }
    const t = TOOLS[i];
    root.innerHTML = template(t, i);
    const el = root.querySelector<HTMLElement>(".p-tool")!;
    const offs: (() => void)[] = [];
    let alive = true;

    const ctx = gsap.context(() => {
      if (reducedMotion) return;

      // hero parallax
      gsap.to(".td-poster", {
        yPercent: -14, rotation: 4, ease: "none",
        scrollTrigger: { trigger: ".td-hero", start: "top top", end: "bottom top", scrub: 0.6 },
      });
      gsap.to(".td-mega", {
        yPercent: 30, ease: "none",
        scrollTrigger: { trigger: ".td-hero", start: "top top", end: "bottom top", scrub: 0.6 },
      });

      // story, line by line
      const story = el.querySelector<HTMLElement>(".td-story__text")!;
      SplitText.create(story, {
        type: "lines", mask: "lines", linesClass: "td-sl", autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.lines, {
            yPercent: 112, rotation: 2.5, duration: 1.3, ease: "expo.out", stagger: 0.11,
            scrollTrigger: { trigger: story, start: "top 78%", toggleActions: "play none none reverse" },
          }),
      });
      gsap.from(".td-glyph", {
        rotation: -40, scale: 0.6, autoAlpha: 0, duration: 1.2, ease: "back.out(1.7)",
        scrollTrigger: { trigger: ".td-story", start: "top 75%" },
      });

      // features: lines draw in
      el.querySelectorAll<HTMLElement>(".td-feat").forEach((row, n) => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: row, start: "top 88%" } });
        tl.from(row.querySelector(".td-feat__line"), { scaleX: 0, duration: 1.3, ease: "expo.inOut" }, n * 0.04)
          .from(row.querySelector(".td-feat__num"), { yPercent: 100, autoAlpha: 0, duration: 0.8, ease: "expo.out" }, 0.3)
          .from(row.querySelector(".td-feat__in, .rd--block"), { yPercent: 110, duration: 1, ease: "expo.out" }, 0.35);
      });
      gsap.from(".td-side__n", {
        yPercent: 60, autoAlpha: 0, duration: 1, ease: "expo.out",
        scrollTrigger: { trigger: ".td-feats", start: "top 75%" },
      });

      // credits: physical cards tossed onto the table
      gsap.fromTo(".td-card--credits", { rotation: -9, yPercent: 30, xPercent: -8 }, {
        rotation: 0, yPercent: 0, xPercent: 0, ease: "none",
        scrollTrigger: { trigger: ".td-credits", start: "top bottom", end: "center 60%", scrub: 0.8 },
      });
      gsap.fromTo(".td-card--links", { rotation: 9, yPercent: 45, xPercent: 10 }, {
        rotation: 0, yPercent: 0, xPercent: 0, ease: "none",
        scrollTrigger: { trigger: ".td-credits", start: "top bottom", end: "center 55%", scrub: 0.8 },
      });
      gsap.from(".td-mascot", {
        yPercent: 75, rotation: 10, duration: 1.3, ease: "back.out(1.5)", stagger: 0.15,
        scrollTrigger: { trigger: ".td-card--credits", start: "top 60%" },
      });

      // next slice
      gsap.from(".td-next__roll", {
        yPercent: 100, duration: 1.3, ease: "expo.out",
        scrollTrigger: { trigger: ".td-next", start: "top 80%" },
      });
    }, el);

    // springy tilt on the hero poster
    if (finePointer && !reducedMotion) {
      const fig = el.querySelector<HTMLElement>(".td-poster")!;
      const tilt = el.querySelector<HTMLElement>(".td-poster__tilt")!;
      gsap.set(tilt, { transformPerspective: 900 });
      const rx = gsap.quickTo(tilt, "rotationX", { duration: 0.9, ease: "elastic.out(1, 0.5)" });
      const ry = gsap.quickTo(tilt, "rotationY", { duration: 0.9, ease: "elastic.out(1, 0.5)" });
      const move = (e: PointerEvent) => {
        const r = fig.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - 0.5) * 22);
        rx(((e.clientY - r.top) / r.height - 0.5) * -18);
      };
      const leave = () => { rx(0); ry(0); };
      fig.addEventListener("pointermove", move);
      fig.addEventListener("pointerleave", leave);
      offs.push(() => { fig.removeEventListener("pointermove", move); fig.removeEventListener("pointerleave", leave); });
    }

    const nextEl = el.querySelector<HTMLElement>(".td-next")!;
    const pop = () => bus.emit("sfx", { name: "pop" });
    nextEl.addEventListener("pointerenter", pop);
    offs.push(() => nextEl.removeEventListener("pointerenter", pop));

    // intro
    if (!reducedMotion) {
      const chs = el.querySelectorAll(".td-ch");
      const fades = el.querySelectorAll(".td-fade");
      const wt = el.querySelectorAll(".td-wt");
      const stamp = el.querySelector(".td-stamp--big");
      ctx.add(() => {
        gsap.set(chs, { yPercent: 115, rotation: 8 });
        gsap.set(fades, { autoAlpha: 0, y: 18 });
        gsap.set(".td-poster__art", { autoAlpha: 0, yPercent: 40, rotation: 16, scale: 0.9 });
        if (wt.length) gsap.set(wt, { autoAlpha: 0, scale: 1.8, rotation: -30 });
        if (stamp) gsap.set(stamp, { autoAlpha: 0, scale: 2.2 });
      });
      (async () => {
        if (first) await loaderGone;
        if (!alive) return;
        ctx.add(() => {
          const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
          tl.to(chs, { yPercent: 0, rotation: 0, duration: 1.3, stagger: 0.045 }, 0)
            .to(".td-poster__art", { autoAlpha: 1, yPercent: 0, rotation: 0, scale: 1, duration: 1.6 }, 0.1)
            .to(fades, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.05 }, 0.3);
          if (wt.length) tl.to(wt, { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.7, ease: "back.out(2.2)" }, 0.9);
          if (stamp) tl.to(stamp, { autoAlpha: 1, scale: 1, duration: 0.5, ease: "back.out(2.5)", onStart: () => bus.emit("sfx", { name: "pop" }) }, 1.1);
        });
      })();
    }

    return () => {
      alive = false;
      offs.forEach((f) => f());
      ctx.revert();
    };
  },
};

export default page;
