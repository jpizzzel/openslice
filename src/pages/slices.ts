// THE TRUNK: Peter's Pizzeria and its Saturday night, Saturday Slices.
// Every fact on this page comes from SITE.trunk.
import "../styles/pages/slices.css";
import type { Page } from "../core/page";
import { SITE, TOOLS } from "../data/site";
import { esc, footerHTML, reveal } from "./about/kit";

const T = SITE.trunk;
const ext = `target="_blank" rel="noopener"`;
const sliceos = TOOLS.find((t) => t.slug === "sliceos");

const FIGURES: [string, string][] = [
  [String(T.crew), "students on the crew"],
  [`${T.ferment}h`, "dough ferment"],
  [`${T.oven.ooni}°F`, `${T.methods[0].style} in an Ooni`],
  [`${T.oven.steel}°F`, `${T.methods[1].style} style on steels`],
  [`~${T.perNight}`, "pizzas a night"],
  [`~${T.selloutHours}h`, "to sell out"],
];

const money = (n: number) => `$${n}`;
/** "Ricotta, garlic, olive oil, rosemary" */
const list = (xs: string[]) => xs.map((x, i) => (i ? x.charAt(0).toLowerCase() + x.slice(1) : x)).join(", ");

function template() {
  return `<div class="p-trunk">
  <section class="tr-intro" aria-labelledby="tr-title" data-reveal>
    <h1 class="tr-h1" id="tr-title">${esc(T.name)}</h1>
    <p class="tr-lede">${esc(T.pizzeria)} is a student-run pizzeria in ${esc(T.where)}, started with friends in ${T.started.toLowerCase()} (${T.est}). ${esc(T.name)} is its night: ${esc(T.hours)}.</p>
    <ul class="tr-links">
      <li><a class="tr-btn" href="${T.href}" ${ext}>${esc(T.site)}</a></li>
      <li><a class="tr-btn tr-btn--ghost" href="${T.instagram.href}" ${ext}>Instagram ${esc(T.instagram.handle)}</a></li>
    </ul>
  </section>

  <section class="tr-sec" aria-labelledby="tr-num-h">
    <h2 class="tr-h2" id="tr-num-h" data-reveal>In numbers</h2>
    <dl class="tr-figs" data-reveal="list">
      ${FIGURES.map(([n, k]) => `<div><dt>${esc(k)}</dt><dd>${esc(n)}</dd></div>`).join("")}
    </dl>
  </section>

  <section class="tr-sec" aria-labelledby="tr-story-h">
    <h2 class="tr-h2" id="tr-story-h" data-reveal>How it started</h2>
    <div class="tr-copy" data-reveal>
      <p>${esc(T.origin)} Now a crew of ${T.crew} students runs the kitchen on Saturday nights.</p>
      <p class="tr-note">${esc(T.tufts)}</p>
    </div>
  </section>

  <section class="tr-sec" aria-labelledby="tr-menu-h">
    <h2 class="tr-h2" id="tr-menu-h" data-reveal>Specials <span>coming soon</span></h2>
    <ul class="tr-menu" data-reveal="list">
      ${T.menu.map((m) => `<li><span class="tr-menu__name">${esc(m.name)}</span><span class="tr-menu__price">${money(m.price)}</span><span class="tr-menu__what">${esc(list(m.toppings))}</span></li>`).join("")}
    </ul>
  </section>

  <section class="tr-sec tr-sec--last" aria-labelledby="tr-trunk-h">
    <h2 class="tr-h2" id="tr-trunk-h" data-reveal>Why it is the trunk</h2>
    <div class="tr-copy" data-reveal>
      <p>OpenSlice grew out of the pizzeria. We built ${esc(sliceos?.name ?? "SliceOS")} to run it, and the other tools came from the same habit: when we need something, we build it ourselves.</p>
      <p><a class="u-link" href="/toolbox/sliceos">More about ${esc(sliceos?.name ?? "SliceOS")}</a></p>
    </div>
  </section>
  ${footerHTML()}
</div>`;
}

const page: Page = {
  title: "The Trunk",
  section: "Trunk",
  mount({ root }) {
    root.innerHTML = template();
    return reveal(root.querySelector<HTMLElement>(".p-trunk")!);
  },
};

export default page;
