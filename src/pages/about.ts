import "../styles/pages/about.css";
import type { Page } from "../core/page";
import { PEOPLE, SITE, TOOLS, type Person } from "../data/site";
import { mascot } from "../art";
import { esc, footerHTML, reveal } from "./about/kit";

const T = SITE.trunk;

/** Short, factual lines only. */
const TIMELINE: [string, string][] = [
  [String(SITE.since), "Freshman year. We become roommates."],
  [String(SITE.since + 1), "Sophomore year. Still roommates."],
  [String(T.est), `Junior year. We start ${T.pizzeria} with friends. Its Saturday night is ${T.name}.`],
  [String(SITE.since + 3), "Senior year. We start OpenSlice and put our tools in one place."],
];

const PRINCIPLES = [
  "We rebuild apps we would pay for, then give them away.",
  "We use everything ourselves first.",
  "Open source by default.",
];

const released = TOOLS.filter((t) => t.status !== "prepping");
const ext = `target="_blank" rel="noopener"`;
const bare = (href: string) => href.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

function personHTML(p: Person) {
  const mine = released.filter((t) => t.by.includes(p.id));
  return `<article class="ab-person" aria-labelledby="ab-p-${p.id}">
    <h3 class="ab-person__name" id="ab-p-${p.id}">${esc(p.name)}</h3>
    <p class="ab-person__site"><a class="u-link" href="${p.site}" ${ext}>${esc(p.siteLabel)}</a></p>
    <p class="ab-person__k">Made</p>
    <ul class="ab-person__tools">
      ${mine.map((t) => `<li><a class="u-link" href="/toolbox/${t.slug}">${esc(t.name)}</a> <span>${esc(t.platform)}</span></li>`).join("")}
    </ul>
  </article>`;
}

function template() {
  const [j, p] = PEOPLE;
  const contact: [string, string, string][] = [
    [j.first, j.site, j.siteLabel],
    [p.first, p.site, p.siteLabel],
    ["Source code", SITE.repo, bare(SITE.repo)],
    [T.name, T.href, T.site],
    ["Instagram", T.instagram.href, T.instagram.handle],
  ];
  return `<div class="p-about">
  <section class="ab-intro" aria-labelledby="ab-title">
    <div class="ab-intro__text" data-reveal>
      <h1 class="ab-h1" id="ab-title">About</h1>
      <p class="ab-lede">We are ${esc(j.name)} and ${esc(p.name)}. We have been roommates since freshman year in fall ${SITE.since}. We are seniors now, and still building.</p>
      <p class="ab-body">We rebuild the apps we would pay for and give them away. In junior year we also started ${esc(T.pizzeria)} with friends. Its night is <a class="u-link" href="/slices">${esc(T.name)}</a>.</p>
    </div>
    <div class="ab-intro__art" aria-hidden="true" data-reveal>
      <span class="ab-m ab-m--j">${mascot("jonah", "stand")}</span>
      <span class="ab-m ab-m--p">${mascot("peter", "stand")}</span>
    </div>
  </section>

  <section class="ab-sec" aria-labelledby="ab-time-h">
    <h2 class="ab-h2" id="ab-time-h" data-reveal>Timeline</h2>
    <ol class="ab-time" data-reveal="list">
      ${TIMELINE.map(([y, line]) => `<li><span class="ab-time__y">${y}</span><p>${esc(line)}</p></li>`).join("")}
    </ol>
  </section>

  <section class="ab-sec" aria-labelledby="ab-duo-h">
    <h2 class="ab-h2" id="ab-duo-h" data-reveal>Who we are</h2>
    <div class="ab-duo" data-reveal="list">${personHTML(j)}${personHTML(p)}</div>
  </section>

  <section class="ab-sec" aria-labelledby="ab-how-h">
    <h2 class="ab-h2" id="ab-how-h" data-reveal>How we work</h2>
    <ul class="ab-how" data-reveal="list">${PRINCIPLES.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
  </section>

  <section class="ab-sec ab-sec--last" aria-labelledby="ab-hi-h">
    <h2 class="ab-h2" id="ab-hi-h" data-reveal>Contact</h2>
    <dl class="ab-contact" data-reveal="list">
      ${contact.map(([k, href, label]) => `<div><dt>${esc(k)}</dt><dd><a class="u-link" href="${href}" ${ext}>${esc(label)}</a></dd></div>`).join("")}
    </dl>
  </section>
  ${footerHTML()}
</div>`;
}

const page: Page = {
  title: "About",
  section: "About",
  mount({ root }) {
    root.innerHTML = template();
    return reveal(root.querySelector<HTMLElement>(".p-about")!);
  },
};

export default page;
