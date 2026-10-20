import "../styles/pages/slices.css";
import type { Page } from "../core/page";
import { gsap, ScrollTrigger, reducedMotion, finePointer } from "../core/motion";
import { bus } from "../core/bus";
import { SITE, STATUS_LABEL, TOOLS, rings as ringsNow, type Tool } from "../data/site";
import { glyph, halftone, poster, type GlyphId } from "../art";
import { countdownHTML } from "../chrome/countdown";
import { ringsSVG, treeSVG } from "./slices/tree";
import { esc, footerHTML, responsive, whenReady } from "./about/kit";

const T = SITE.trunk;

const DAYS: { d: string; long: string; what: string; when?: string; g: GlyphId }[] = [
  { d: "Mon", long: "Monday", what: "Building", g: "laptop" },
  { d: "Tue", long: "Tuesday", what: "Building", g: "keyboard" },
  { d: "Wed", long: "Wednesday", what: "Building", g: "terminal" },
  { d: "Thu", long: "Thursday", what: "Building", g: "wrench" },
  { d: "Fri", long: "Friday", what: "Building", g: "dough" },
  { d: "Sat", long: "Saturday", what: "Slices", when: "7pm til sellout", g: "pizza" },
  { d: "Sun", long: "Sunday", what: "Building", g: "coffee" },
];

/** The spec strip: every number comes from SITE.trunk. `max` sets the dial's full sweep. */
const STATS: { k: string; n: number; approx?: boolean; unit: string; sr: string; sub: string; max: number }[] = [
  { k: "Crew", n: T.crew, unit: "students", sr: `${T.crew} students`, sub: "One kitchen", max: 16 },
  { k: "Ferment", n: T.ferment, unit: "hours", sr: `${T.ferment} hour ferment`, sub: "Three days of dough", max: 96 },
  { k: "Ooni", n: T.oven.ooni, unit: "°F", sr: `${T.oven.ooni} degrees Fahrenheit in the Ooni`, sub: "Neapolitan style", max: 1000 },
  { k: "Steel", n: T.oven.steel, unit: "°F", sr: `${T.oven.steel} degrees Fahrenheit on the steels`, sub: "New York style", max: 1000 },
  { k: "Per night", n: T.perNight, approx: true, unit: "pizzas", sr: `About ${T.perNight} pizzas a night`, sub: "About a dozen pies a night", max: 16 },
  { k: "Sellout", n: T.selloutHours, approx: true, unit: T.selloutHours === 1 ? "hour" : "hours", sr: `Sold out in ${T.sellout}`, sub: `Sold out, usually in ${T.sellout}`, max: 4 },
];
const MENU_GLYPH: GlyphId[] = ["cheese-drip", "basil", "slice"];
const SWEEP = 270;
/** needle angle for a value on a dial that sweeps -135..135 degrees */
const needle = (n: number, max: number) => -SWEEP / 2 + SWEEP * Math.min(1, n / max);

/** a little oven knob: ink ring, halftone shade, ticks, tomato needle */
function dialSVG(n: number, max: number) {
  const ht = halftone(1, "#141210", 3.6);
  let ticks = "";
  for (let i = 0; i <= 10; i++) {
    const a = ((-SWEEP / 2 + (SWEEP * i) / 10 - 90) * Math.PI) / 180;
    const r0 = i % 5 ? 33 : 30, r1 = 38;
    ticks += `M${(50 + Math.cos(a) * r0).toFixed(1)} ${(50 + Math.sin(a) * r0).toFixed(1)}L${(50 + Math.cos(a) * r1).toFixed(1)} ${(50 + Math.sin(a) * r1).toFixed(1)}`;
  }
  return `<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false"><defs>${ht.def}</defs>
    <circle cx="52" cy="52" r="44" fill="#141210"/>
    <circle cx="50" cy="50" r="44" fill="#f7f4ef" stroke="#141210" stroke-width="3"/>
    <path d="M50 6A44 44 0 0 1 50 94Z" fill="${ht.fill}" opacity=".45"/>
    <path d="${ticks}" stroke="#141210" stroke-width="2.4" stroke-linecap="round"/>
    <g class="sl-dial__needle" transform="rotate(${needle(n, max).toFixed(1)} 50 50)">
      <path d="M50 50L50 17" stroke="#d92a1f" stroke-width="5" stroke-linecap="round"/>
    </g>
    <circle cx="50" cy="50" r="8" fill="#141210"/><circle cx="48" cy="48" r="2.4" fill="#f7f4ef"/>
  </svg>`;
}

/** a number that can count up without nudging the layout: the final value holds the width */
const num = (n: number) => `<b class="sl-num"><span class="sl-num__g">${n}</span><span class="sl-num__v" data-to="${n}">${n}</span></b>`;

const bySlug = new Map(TOOLS.map((t) => [t.slug, t]));
const toolName = (t: Tool) => (t.status === "prepping" ? "Classified" : t.name);
const sliceos = TOOLS.find((t) => t.slug === "sliceos");
const rings = ringsNow();
const ord = (n: number) => {
  const t = n % 100, o = n % 10;
  return `${n}${t > 10 && t < 14 ? "th" : o === 1 ? "st" : o === 2 ? "nd" : o === 3 ? "rd" : "th"}`;
};
/** worded like the footer: "3 rings, a 4th on the way." */
const ringsLine = rings.full
  ? `<strong>${rings.full} ring${rings.full === 1 ? "" : "s"},</strong><span class="sl-rings__next">a ${ord(rings.growing)} on the way.</span>`
  : `<strong>Ring one</strong><span class="sl-rings__next">is on the way.</span>`;
const ext = `target="_blank" rel="noopener"`;
const arr = `<span class="sl-btn__arr" aria-hidden="true">&#8599;</span>`;
/** the origin line, with a footnote mark on Tufts for the disclaimer */
const origin = esc(T.origin).replace("Tufts", `Tufts<sup class="sl-fn" aria-hidden="true">*</sup>`);
const [heartA, heartB] = T.heart.split(", ");

function template() {
  return `<div class="p-slices">
  <section class="sl-hero" aria-labelledby="sl-title">
    <p class="sl-hero__kicker mono" aria-hidden="true"><span>Fig. 01</span><span>Where everything grows from</span><span>Est. ${T.est}</span></p>
    <h1 class="sl-hero__title" id="sl-title">
      <span class="sl-l"><span class="sl-li caps-red">The</span></span>
      <span class="sl-l"><span class="sl-li caps-red">Trunk</span></span>
      <span class="sl-hero__name">
        <span class="sl-hero__from mono"><span class="sl-l"><span class="sl-li">from ${esc(T.pizzeria)}, ${esc(T.where)}</span></span></span>
        <span class="serif"><span class="sl-l"><span class="sl-li"><em>${esc(T.name)}</em></span></span></span>
      </span>
    </h1>
    <span class="sl-hero__box" aria-hidden="true">${glyph("pizza")}</span>
    <div class="sl-hero__copy">
      <p class="sl-hero__lede"><em>${esc(T.tagline)}</em> ${esc(T.pitch)}</p>
      <dl class="sl-hero__meta">
        <div><dt class="label">Pizzeria</dt><dd>${esc(T.pizzeria)}</dd></div>
        <div><dt class="label">Where</dt><dd>${esc(T.where)}</dd></div>
        <div><dt class="label">Hours</dt><dd>${esc(T.hours)}</dd></div>
        <div><dt class="label">Runs on</dt><dd>${sliceos ? `<a class="u-link" href="/toolbox/${sliceos.slug}">${sliceos.name}</a>` : "SliceOS"}</dd></div>
      </dl>
      <div class="sl-hero__ctas">
        <a class="sl-btn" href="${T.href}" ${ext} data-cursor="Order"><span>Visit ${T.site}</span>${arr}</a>
        <a class="sl-btn sl-btn--line" href="${T.instagram.href}" ${ext} data-cursor="Follow"><span><span class="sr-only">Instagram: </span>${esc(T.instagram.handle)}</span>${arr}</a>
      </div>
    </div>
  </section>

  <section class="sl-stats" aria-labelledby="sl-stats-h">
    <header class="sl-sec__head">
      <p class="label">Fig. 02</p>
      <h2 id="sl-stats-h"><span class="caps-red">By the</span> <em class="serif">numbers.</em></h2>
      <p class="sl-sec__sub serif">Small kitchen, big numbers. Read straight off the dials.</p>
    </header>
    <ol class="sl-stats__row">
      ${STATS.map((s, i) => `<li class="sl-stat">
        <p class="sl-stat__top mono" aria-hidden="true"><span>Stub ${String(i + 1).padStart(2, "0")}</span><span>${s.k}</span></p>
        <span class="sl-stat__dial" data-a="${needle(s.n, s.max).toFixed(1)}">${dialSVG(s.n, s.max)}</span>
        <p class="sl-stat__n"><span aria-hidden="true">${s.approx ? `<i class="sl-stat__approx">~</i>` : ""}${num(s.n)}<span class="sl-stat__u">${s.unit}</span></span><span class="sr-only">${esc(s.sr)}.</span></p>
        <p class="sl-stat__sub serif">${esc(s.sub)}</p>
      </li>`).join("")}
    </ol>
  </section>

  <section class="sl-story" aria-labelledby="sl-story-h">
    <header class="sl-story__head">
      <p class="label">Fig. 03 / How it started</p>
      <h2 id="sl-story-h"><span class="caps-red">Three</span> <em class="serif">in the morning.</em></h2>
    </header>
    <div class="sl-story__clock" aria-hidden="true">
      <span class="sl-story__time">3:00</span><span class="sl-story__am serif">am</span>
      <span class="sl-story__cup">${glyph("coffee")}</span>
    </div>
    <div class="sl-story__copy">
      <p class="sl-story__when mono"><span>${esc(T.started)}</span><span>Est. ${T.est}</span><span>${esc(T.where)}</span></p>
      <blockquote class="sl-story__q">
        <p class="serif">&ldquo;${origin}&rdquo;</p>
        <footer class="label">From the ${esc(T.pizzeria)} story, on ${T.site}</footer>
      </blockquote>
      <p class="sl-story__fn"><span aria-hidden="true">* </span>${esc(T.tufts)}</p>
    </div>
    <p class="sl-story__heart serif"><span class="sl-l"><span class="sl-rv">${esc(heartA)},</span></span> <span class="sl-l"><span class="sl-rv"><em>${esc(heartB)}</em></span></span></p>
  </section>

  <section class="sl-ovens" aria-labelledby="sl-ovens-h">
    <header class="sl-sec__head">
      <p class="label">Fig. 04</p>
      <h2 id="sl-ovens-h"><span class="caps-red">Two styles,</span> <em class="serif">one kitchen.</em></h2>
      <p class="sl-sec__sub serif">The dough ferments for ${T.ferment} hours. Then it picks an oven.</p>
    </header>
    <div class="sl-ovens__duel">
      ${T.methods.map((m, i) => `<article class="sl-oven sl-oven--${i ? "b" : "a"}" aria-labelledby="sl-oven-${i}">
        <p class="sl-oven__top mono"><span>Spec sheet</span><span>Style ${i ? "B" : "A"}</span></p>
        <span class="sl-oven__g" aria-hidden="true">${glyph(i ? "slice" : "oven")}</span>
        <h3 class="sl-oven__name" id="sl-oven-${i}">${esc(m.style)}</h3>
        <p class="sl-oven__how serif">${esc(m.oven)}</p>
        <p class="sl-oven__t"><span aria-hidden="true">${num(m.temp)}<span class="sl-oven__deg">°F</span></span><span class="sr-only">${m.temp} degrees Fahrenheit</span></p>
        <div class="sl-oven__therm" aria-hidden="true"><span class="sl-oven__fill" style="--k:${(m.temp / 1000).toFixed(3)}"></span><span class="sl-oven__scale"><i>0</i><i>500</i><i>1000°F</i></span></div>
      </article>`).join(`<span class="sl-ovens__vs" aria-hidden="true">vs</span>`)}
    </div>
  </section>

  <section class="sl-menu" aria-labelledby="sl-menu-h">
    <div class="sl-menu__board">
      <header class="sl-menu__head">
        <p class="sl-menu__src mono">Fig. 05 / From the menu at ${T.site}</p>
        <h2 id="sl-menu-h"><span class="caps-red">Specials</span> <em class="serif">coming soon.</em></h2>
        <p class="sl-menu__sub serif">Three new pies on the ${esc(T.name)} menu, prices and all. They're marked coming soon over there, so they're marked coming soon here.</p>
      </header>
      <ol class="sl-menu__list">
        ${T.menu.map((m, i) => `<li class="sl-tkt">
          <p class="sl-tkt__top mono" aria-hidden="true"><span>Special</span><span>No. ${String(i + 1).padStart(2, "0")}</span></p>
          <span class="sl-tkt__g" aria-hidden="true">${glyph(MENU_GLYPH[i % MENU_GLYPH.length])}</span>
          <h3 class="sl-tkt__name">${esc(m.name)}</h3>
          <ul class="sl-tkt__tops" aria-label="Toppings">${m.toppings.map((t) => `<li><span aria-hidden="true">1x</span> ${esc(t)}</li>`).join("")}</ul>
          <p class="sl-tkt__price"><span class="mono">Price</span><span class="sl-tkt__dots" aria-hidden="true"></span><b>$${m.price}</b></p>
          <p class="sl-tkt__note">${esc(m.note)}</p>
        </li>`).join("")}
      </ol>
      <p class="sl-menu__foot"><span class="mono">Full menu</span><a class="u-link" href="${T.href}" ${ext}>${T.site}</a></p>
    </div>
  </section>

  <section class="sl-week" aria-labelledby="sl-week-h">
    <header class="sl-week__head">
      <p class="label">Fig. 06</p>
      <h2 id="sl-week-h"><span class="caps-red">Saturday</span> <em class="serif">rhythm.</em></h2>
      <p class="sl-week__sub">Six days of building. Then ${esc(T.hours.replace("Saturdays", "Saturday"))}. Repeat until graduation, then keep going.</p>
    </header>
    <ol class="sl-week__strip">
      ${DAYS.map(
        (d, i) => `<li class="sl-day${d.d === "Sat" ? " sl-day--sat" : ""}">
          <span class="sl-day__no" aria-hidden="true"><span>Order</span><span>No. ${String(i + 1).padStart(2, "0")}</span></span>
          <span class="sl-day__d"><abbr title="${d.long}">${d.d}</abbr></span>
          <span class="sl-day__g" aria-hidden="true">${glyph(d.g)}</span>
          <span class="sl-day__what"><span aria-hidden="true">1x</span> ${d.what}${d.when ? `<span class="sl-day__when">${d.when}</span>` : ""}</span>
          <span class="sl-day__bar" aria-hidden="true"><span></span></span>
          ${d.d === "Sat" ? `<span class="sl-day__stamp" aria-hidden="true"></span>` : ""}
        </li>`,
      ).join("")}
    </ol>
    <div class="sl-week__ticker" aria-hidden="true"><div class="sl-week__tape">${[0, 1]
      // two runs for a seamless loop; render each glyph separately so svg ids stay unique
      .map(() => DAYS.map((d) => `<span${d.d === "Sat" ? ' class="is-sat"' : ""}>${d.d === "Sat" ? "Pizza day" : "Build day"}</span><i>${glyph("slice")}</i>`).join(""))
      .join("")}</div></div>
  </section>

  <section class="sl-tree" aria-labelledby="sl-tree-h">
    <div class="sl-tree__pin">
      <header class="sl-tree__head">
        <p class="label">Fig. 07</p>
        <h2 id="sl-tree-h"><span class="caps-red">One trunk,</span> <em class="serif">many branches.</em></h2>
      </header>
      <div class="sl-tree__stage">
        <div class="sl-tree__art">${treeSVG(TOOLS, { name: toolName })}</div>
        <p class="sl-tree__tag sl-tree__tag--branches"><span class="label">Branches</span><span>Tools</span></p>
        <p class="sl-tree__tag sl-tree__tag--trunk"><span class="label">Trunk / ${esc(T.pizzeria)}</span><span>${esc(T.name)}</span></p>
        <p class="sl-tree__tag sl-tree__tag--roots"><span class="label">Roots</span><span>Two roommates</span></p>
        <div class="sl-tip" role="status" aria-live="polite" hidden>
          <span class="sl-tip__art" aria-hidden="true"></span>
          <span class="sl-tip__kind label"></span>
          <strong class="sl-tip__name"></strong>
          <span class="sl-tip__status mono"></span>
        </div>
      </div>
      <nav class="sl-tree__list" aria-label="Branches of the tree">
        <p class="label">Every branch</p>
        <ol>
          ${TOOLS.map(
            (t, i) => `<li><a href="/toolbox/${t.slug}" data-slug="${t.slug}" data-cursor="Open" style="--c:${t.color}">
              <span class="mono">${String(i + 1).padStart(2, "0")}</span>
              <span class="sl-tree__lname">${esc(toolName(t))}</span>
              <span class="sl-tree__lstatus label">${STATUS_LABEL[t.status]}</span>
            </a></li>`,
          ).join("")}
        </ol>
        <figure class="sl-rings">
          <span class="sl-rings__art">${ringsSVG(SITE.since)}</span>
          <figcaption>
            <span class="label">Growth rings</span>
            ${ringsLine}
            <span class="sl-rings__cap">One per year since fall ${SITE.since}. The red one is still growing.</span>
          </figcaption>
        </figure>
      </nav>
      <div class="sl-tree__progress" aria-hidden="true"><span></span></div>
    </div>
  </section>

  ${
    sliceos
      ? `<section class="sl-os" aria-labelledby="sl-os-h">
    <a class="sl-os__poster" href="/toolbox/${sliceos.slug}" data-cursor="Peek" aria-hidden="true" tabindex="-1">${poster(sliceos)}</a>
    <div class="sl-os__copy">
      <p class="label">Fig. 08 / ${esc(sliceos.kind)}</p>
      <h2 id="sl-os-h" class="sl-os__h"><span class="caps-red">${esc(sliceos.name)}</span><em class="serif">the back of house</em></h2>
      <p class="sl-os__blurb">${esc(sliceos.blurb)}</p>
      <ul class="sl-os__feat">${sliceos.features.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
      <p class="sl-os__note"><span class="sl-os__pill mono">${STATUS_LABEL[sliceos.status]}</span><span class="serif">It runs ${esc(T.pizzeria)}'s ${esc(T.name)}. We're cleaning it up for the toolbox so it can run your shop too.</span></p>
      <a class="sl-btn sl-btn--ink" href="/toolbox/${sliceos.slug}" data-cursor="Open"><span>Read about ${esc(sliceos.name)}</span><span class="sl-btn__arr" aria-hidden="true">&rarr;</span></a>
    </div>
  </section>`
      : ""
  }

  <section class="sl-end" aria-labelledby="sl-end-h">
    <p class="label sl-end__k">Fig. 09 / See you Saturday</p>
    <h2 id="sl-end-h" class="sl-end__h">
      <span class="sl-l"><span class="sl-rv caps-red">${esc(T.motto[0])}</span></span>
      <span class="sl-l"><span class="sl-rv serif"><em>${esc(T.motto[1])}</em></span></span>
    </h2>
    <div class="sl-end__aside">
      <p class="sl-end__sub serif">${esc(T.night)} ${esc(T.hours)}.</p>
      ${countdownHTML("sl-end__cd")}
    </div>
    <ul class="sl-end__links">
      <li><a class="sl-stub" href="${T.href}" ${ext} data-cursor="Visit">
        <span class="sl-stub__k mono">The site</span>
        <strong class="sl-stub__v">${T.site}</strong>
        <span class="sl-stub__d">${esc(T.pages.filter((p) => p !== "Slice Status").join(", ").replace(/, ([^,]*)$/, " and $1"))}</span>${arr}
      </a></li>
      <li><a class="sl-stub sl-stub--hot" href="${T.href}" ${ext} data-cursor="Check">
        <span class="sl-stub__k mono">Before you go</span>
        <strong class="sl-stub__v">Slice Status</strong>
        <span class="sl-stub__d">Check it on ${T.site}. They sell out fast.</span>${arr}
      </a></li>
      <li><a class="sl-stub" href="${T.instagram.href}" ${ext} data-cursor="Follow">
        <span class="sl-stub__k mono">Location / Instagram</span>
        <strong class="sl-stub__v">${esc(T.instagram.handle)}</strong>
        <span class="sl-stub__d">The location is shared there.</span>${arr}
      </a></li>
    </ul>
    <p class="sl-end__blog"><span class="mono">On the blog</span><span class="serif"><em>${esc(T.blog.title)}</em>, by ${esc(T.blog.by)}</span></p>
    <p class="sl-end__fn mono" aria-hidden="true"><span>${esc(T.pizzeria)}</span><span>${esc(T.name)}</span><span>${esc(T.where)}</span><span>Est. ${T.est}</span></p>
  </section>
  ${footerHTML()}
</div>`;
}

/** Pair fruits with branches. Prefer a matching data-slug, else spread fruits along the branch order. */
function pairFruits(branches: SVGPathElement[], fruits: SVGElement[]) {
  return fruits.map((f, i) => {
    const slug = f.dataset.slug;
    let bi = slug ? branches.findIndex((b) => b.dataset.slug === slug) : -1;
    if (bi < 0) bi = branches.length ? Math.min(branches.length - 1, Math.round(((i + 1) / fruits.length) * branches.length) - 1) : -1;
    return { f, bi: Math.max(0, bi) };
  });
}

/**
 * Fruits swing from their stems and leaves rustle when the pointer brushes
 * past: one damped angular spring per item, driven by pointer velocity.
 * Each item's drawing is wrapped in an inner <g> so the spring never fights
 * the GSAP scale tweens on the outer group. The ticker only runs while
 * something is still moving; item centres are cached and re-read lazily
 * after a scroll or resize (no layout reads in the frame loop).
 */
function makeSwing(stage: HTMLElement, fruits: SVGElement[], leaves: SVGElement[]) {
  if (!finePointer) return null;
  const NS = "http://www.w3.org/2000/svg";
  type Item = { g: SVGGElement; px: number; py: number; cx: number; cy: number; a: number; v: number; k: number; c: number; gain: number; max: number };
  const wrap = (el: SVGElement, k: number, c: number, gain: number, max: number, pivotTop: boolean): Item | null => {
    const g = document.createElementNS(NS, "g") as SVGGElement;
    while (el.firstChild) g.appendChild(el.firstChild);
    el.appendChild(g);
    let bb: DOMRect;
    try { bb = g.getBBox(); } catch { return null; }
    // fruits hang from the top of their stem, leaves pivot at their centre
    const px = bb.x + bb.width / 2, py = pivotTop ? bb.y : bb.y + bb.height / 2;
    return { g, px, py, cx: 0, cy: 0, a: 0, v: 0, k, c, gain, max };
  };
  const items = [
    ...fruits.map((f) => wrap(f, 60, 4.2, 0.09, 26, true)),
    ...leaves.map((l) => wrap(l, 160, 7, 0.16, 34, false)),
  ].filter((x): x is Item => !!x);
  if (!items.length) return null;

  let dirty = true, running = false, lx = 0, ly = 0, has = false;
  const measure = () => {
    dirty = false;
    for (const it of items) {
      const r = it.g.getBoundingClientRect();
      it.cx = r.left + r.width / 2; it.cy = r.top + r.height / 2;
    }
  };
  const tick = (_t: number, dms: number) => {
    const dt = Math.min(0.05, dms / 1000);
    let moving = false;
    for (const it of items) {
      if (it.a === 0 && it.v === 0) continue;
      it.v += (-it.k * it.a - it.c * it.v) * dt;
      it.a += it.v * dt;
      if (Math.abs(it.a) < 0.02 && Math.abs(it.v) < 0.05) { it.a = 0; it.v = 0; }
      else moving = true;
      it.g.setAttribute("transform", `rotate(${it.a.toFixed(2)} ${it.px.toFixed(1)} ${it.py.toFixed(1)})`);
    }
    if (!moving) { gsap.ticker.remove(tick); running = false; }
  };
  const move = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    if (dirty) measure();
    if (!has) { lx = e.clientX; ly = e.clientY; has = true; return; }
    const vx = e.clientX - lx, vy = e.clientY - ly;
    lx = e.clientX; ly = e.clientY;
    const R = 90;
    for (const it of items) {
      const dx = e.clientX - it.cx, dy = e.clientY - it.cy;
      const d2 = dx * dx + dy * dy;
      if (d2 > R * R) continue;
      const fall = 1 - Math.sqrt(d2) / R;
      // horizontal sweeps push hardest; a little vertical for leaves
      it.v += (vx + vy * 0.25 * Math.sign(dx || 1)) * it.gain * 60 * fall;
      it.v = Math.max(-it.max * 8, Math.min(it.max * 8, it.v));
      if (!running) { running = true; gsap.ticker.add(tick); }
    }
  };
  const leave = () => { has = false; };
  const stale = () => { dirty = true; };
  stage.addEventListener("pointermove", move, { passive: true });
  stage.addEventListener("pointerleave", leave);
  window.addEventListener("scroll", stale, { passive: true });
  window.addEventListener("resize", stale);
  return () => {
    stage.removeEventListener("pointermove", move);
    stage.removeEventListener("pointerleave", leave);
    window.removeEventListener("scroll", stale);
    window.removeEventListener("resize", stale);
    gsap.ticker.remove(tick);
  };
}

const page: Page = {
  title: "The Trunk",
  section: "Slices",
  mount({ root, first }) {
    root.innerHTML = template();
    const el = root.querySelector<HTMLElement>(".p-slices")!;
    let alive = true;
    const offs: (() => void)[] = [];
    const ctx = gsap.context(() => {}, el);

    const stage = el.querySelector<HTMLElement>(".sl-tree__stage")!;
    const svg = stage.querySelector<SVGSVGElement>(".sl-tree__art svg");
    const branches = svg ? [...svg.querySelectorAll<SVGPathElement>('[data-part="branch"]')] : [];
    const fruits = svg ? [...svg.querySelectorAll<SVGElement>('[data-part="fruit"]')] : [];
    const pairs = pairFruits(branches, fruits);
    const links = new Map([...el.querySelectorAll<HTMLAnchorElement>(".sl-tree__list a")].map((a) => [a.dataset.slug!, a]));

    // Branch drawing setup: pathLength="1" makes the dash math trivial.
    branches.forEach((b) => {
      if (!b.getAttribute("pathLength")) b.setAttribute("pathLength", "1");
      b.style.strokeDasharray = "1";
    });
    fruits.forEach((f) => {
      f.style.transformBox = "fill-box";
      f.style.transformOrigin = "50% 50%";
      f.style.cursor = "pointer";
      // keyboard: every fruit is a real stop that opens its tool
      const t = bySlug.get(f.dataset.slug || "");
      if (t) {
        f.setAttribute("tabindex", "0");
        f.setAttribute("role", "link");
        f.setAttribute("aria-label", `${toolName(t)}, ${STATUS_LABEL[t.status]}`);
      }
    });
    if (svg && fruits.length) {
      // the fruits are focusable links, so the drawing can't be aria-hidden
      svg.removeAttribute("aria-hidden");
      svg.removeAttribute("focusable");
      svg.setAttribute("role", "group");
      svg.setAttribute("aria-label", `The tree: ${T.name} from ${T.pizzeria} is the trunk, every tool is a branch`);
    }
    const leaves = svg ? [...svg.querySelectorAll<SVGGElement>('[data-part="leaf"]')] : [];
    // growth ring strokes (pathLength=1); the live ring keeps its dashes
    const ringEls = [...el.querySelectorAll<SVGPathElement>(".sl-ring:not([stroke-dasharray])")];
    ringEls.forEach((r) => { r.style.strokeDasharray = "1"; });
    const swing = reducedMotion ? null : makeSwing(stage, fruits, leaves);
    if (swing) offs.push(swing);

    // Tooltip card for fruits.
    const tip = el.querySelector<HTMLElement>(".sl-tip")!;
    const showTip = (f: SVGElement) => {
      const t = bySlug.get(f.dataset.slug || "");
      if (!t) return;
      tip.querySelector(".sl-tip__art")!.innerHTML = glyph(t.glyph);
      tip.querySelector(".sl-tip__kind")!.textContent = t.kind;
      tip.querySelector(".sl-tip__name")!.textContent = toolName(t);
      tip.querySelector(".sl-tip__status")!.textContent = STATUS_LABEL[t.status];
      tip.style.setProperty("--c", t.color);
      const fr = f.getBoundingClientRect();
      const sr = stage.getBoundingClientRect();
      const x = fr.left + fr.width / 2 - sr.left;
      const y = fr.top - sr.top;
      tip.hidden = false;
      const flip = x > sr.width * 0.66;
      tip.classList.toggle("is-flip", flip);
      // no room above the fruit (top of the stage or under the fixed header): hang it below
      const below = fr.top - tip.offsetHeight - 16 < Math.max(0, sr.top) + 8 || fr.top - tip.offsetHeight - 16 < 72;
      tip.classList.toggle("is-below", below);
      // keep the card inside the stage horizontally (small screens)
      const tw = tip.offsetWidth, anchor = flip ? 0.9 : 0.5;
      const left = Math.min(Math.max(x - tw * anchor, 0), Math.max(0, sr.width - tw));
      gsap.killTweensOf(tip);
      gsap.set(tip, { x: left + tw * anchor, y: below ? y + fr.height : y });
      if (reducedMotion) gsap.set(tip, { autoAlpha: 1, scale: 1, yPercent: below ? 12 : -110 });
      else gsap.fromTo(tip, { autoAlpha: 0, scale: 0.85, yPercent: below ? 0 : -90 }, { autoAlpha: 1, scale: 1, yPercent: below ? 12 : -110, duration: 0.45, ease: "back.out(2)" });
      links.get(t.slug)?.classList.add("is-hot");
      if (!reducedMotion && f.dataset.shown !== "0") gsap.to(f, { scale: 1.18, duration: 0.5, ease: "back.out(3)", overwrite: "auto" });
      bus.emit("sfx", { name: "tick" });
    };
    const hideTip = (f: SVGElement) => {
      gsap.to(tip, { autoAlpha: 0, duration: reducedMotion ? 0 : 0.2, onComplete: () => { tip.hidden = true; } });
      links.get(f.dataset.slug || "")?.classList.remove("is-hot");
      if (!reducedMotion && f.dataset.shown !== "0") gsap.to(f, { scale: 1, duration: 0.5, ease: "back.out(3)", overwrite: "auto" });
    };
    fruits.forEach((f) => {
      const enter = () => showTip(f);
      const leave = () => hideTip(f);
      const click = () => {
        const a = links.get(f.dataset.slug || "");
        if (a) a.click();
      };
      const key = (e: KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); click(); }
      };
      f.addEventListener("pointerenter", enter);
      f.addEventListener("pointerleave", leave);
      f.addEventListener("focus", enter);
      f.addEventListener("blur", leave);
      f.addEventListener("keydown", key);
      f.addEventListener("click", click);
      offs.push(() => {
        f.removeEventListener("pointerenter", enter);
        f.removeEventListener("pointerleave", leave);
        f.removeEventListener("focus", enter);
        f.removeEventListener("blur", leave);
        f.removeEventListener("keydown", key);
        f.removeEventListener("click", click);
      });
    });
    // Hovering a list entry lights up its fruit.
    links.forEach((a, slug) => {
      const f = fruits.find((x) => x.dataset.slug === slug);
      if (!f) return;
      const on = () => showTip(f);
      const off = () => hideTip(f);
      a.addEventListener("pointerenter", on);
      a.addEventListener("pointerleave", off);
      a.addEventListener("focus", on);
      a.addEventListener("blur", off);
      offs.push(() => {
        a.removeEventListener("pointerenter", on);
        a.removeEventListener("pointerleave", off);
        a.removeEventListener("focus", on);
        a.removeEventListener("blur", off);
      });
    });

    const cleanup = () => {
      alive = false;
      offs.forEach((f) => f());
      gsap.killTweensOf([tip, ...fruits]);
      ctx.revert();
    };

    if (reducedMotion) {
      el.classList.add("is-static");
      branches.forEach((b) => (b.style.strokeDashoffset = "0"));
      return cleanup;
    }

    // Hero intro.
    ctx.add(() => {
      gsap.set(".sl-li", { yPercent: 115 });
      gsap.set(".sl-hero__box", { autoAlpha: 0, scale: 0.6, rotation: -30 });
      gsap.set(".sl-hero__copy > *, .sl-hero__kicker", { autoAlpha: 0, y: 20 });
    });
    whenReady(first, () => alive, () =>
      ctx.add(() => {
        // non-first visits: start as the transition cover peels away
        gsap.timeline({ defaults: { ease: "expo.out" }, delay: first ? 0 : 0.2 })
          .to(".sl-li", { yPercent: 0, duration: 0.9, stagger: 0.06 })
          .to(".sl-hero__box", { autoAlpha: 1, scale: 1, rotation: 8, duration: 1.4, ease: "elastic.out(1, 0.5)" }, 0.35)
          .to(".sl-hero__copy > *, .sl-hero__kicker", { autoAlpha: 1, y: 0, duration: 1, stagger: 0.06 }, 0.5);
      }),
    );

    ctx.add(() => {
      gsap.to(".sl-hero__box", { yPercent: 60, rotation: 40, ease: "none", scrollTrigger: { trigger: ".sl-hero", start: "top top", end: "bottom top", scrub: true } });

      // Count a number up from zero once its trigger enters. The final value is
      // already in the markup (and in sr-only text), so this is decoration only.
      const countUp = (els: HTMLElement[], trigger: Element, delay = 0) => {
        els.forEach((v, i) => {
          const to = Number(v.dataset.to) || 0;
          const o = { n: 0 };
          v.textContent = "0";
          gsap.to(o, {
            n: to, duration: 1.8, ease: "expo.out", delay: delay + i * 0.08,
            onUpdate: () => { v.textContent = String(Math.round(o.n)); },
            scrollTrigger: { trigger, start: "top 85%", once: true },
          });
        });
      };

      // By the numbers: stubs drop in, dials swing to their value, digits roll.
      const stats = gsap.utils.toArray<HTMLElement>(".sl-stat");
      gsap.from(stats, { y: 70, rotation: (i: number) => (i % 2 ? 3 : -3), autoAlpha: 0, duration: 1.1, ease: "expo.out", stagger: 0.07, scrollTrigger: { trigger: ".sl-stats__row", start: "top 85%", once: true } });
      stats.forEach((s, i) => {
        const nd = s.querySelector(".sl-dial__needle");
        const a = Number(s.querySelector<HTMLElement>(".sl-stat__dial")?.dataset.a) || 0;
        if (nd) gsap.fromTo(nd, { rotation: -SWEEP / 2, svgOrigin: "50 50" }, { rotation: a, svgOrigin: "50 50", duration: 1.6, ease: "elastic.out(1, 0.55)", delay: 0.25 + i * 0.08, scrollTrigger: { trigger: ".sl-stats__row", start: "top 85%", once: true } });
      });
      countUp(gsap.utils.toArray<HTMLElement>(".sl-stat .sl-num__v"), el.querySelector(".sl-stats__row")!, 0.25);

      // The story: the clock ticks in, the quote rises, the heart line slides up.
      gsap.from(".sl-story__time, .sl-story__am", { yPercent: 40, autoAlpha: 0, duration: 1.2, ease: "expo.out", stagger: 0.1, scrollTrigger: { trigger: ".sl-story__clock", start: "top 85%", once: true } });
      gsap.from(".sl-story__cup", { rotation: -40, scale: 0.4, autoAlpha: 0, duration: 1.4, ease: "elastic.out(1, 0.5)", delay: 0.3, scrollTrigger: { trigger: ".sl-story__clock", start: "top 85%", once: true } });
      gsap.from(".sl-story__copy > *", { y: 30, autoAlpha: 0, duration: 1, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: ".sl-story__copy", start: "top 85%", once: true } });
      gsap.fromTo(".sl-story__heart .sl-rv", { yPercent: 110 }, { yPercent: 0, duration: 1.1, ease: "expo.out", stagger: 0.12, scrollTrigger: { trigger: ".sl-story__heart", start: "top 95%", once: true } });

      // Two styles: the spec sheets slide in from opposite sides, thermometers fill.
      gsap.from(".sl-oven--a", { xPercent: -14, rotation: -4, autoAlpha: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: ".sl-ovens__duel", start: "top 85%", once: true } });
      gsap.from(".sl-oven--b", { xPercent: 14, rotation: 4, autoAlpha: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: ".sl-ovens__duel", start: "top 85%", once: true } });
      gsap.from(".sl-ovens__vs", { scale: 0, rotation: -90, duration: 1.2, ease: "elastic.out(1, 0.5)", delay: 0.4, scrollTrigger: { trigger: ".sl-ovens__duel", start: "top 85%", once: true } });
      gsap.fromTo(".sl-oven__fill", { scaleX: 0 }, { scaleX: (_i: number, t: HTMLElement) => Number(t.style.getPropertyValue("--k")) || 1, duration: 1.8, ease: "expo.out", delay: 0.35, stagger: 0.12, scrollTrigger: { trigger: ".sl-ovens__duel", start: "top 85%", once: true } });
      countUp(gsap.utils.toArray<HTMLElement>(".sl-oven .sl-num__v"), el.querySelector(".sl-ovens__duel")!, 0.35);

      // The menu board: tickets get tossed onto the board, stamps thunk down.
      gsap.from(".sl-tkt", { y: 120, rotation: (i: number) => [-10, 6, -7][i % 3], autoAlpha: 0, duration: 1.2, ease: "expo.out", stagger: 0.1, scrollTrigger: { trigger: ".sl-menu__list", start: "top 85%", once: true } });
      gsap.from(".sl-tkt__note", { scale: 1.8, autoAlpha: 0, duration: 0.5, ease: "back.out(2.4)", stagger: 0.1, delay: 0.7, scrollTrigger: { trigger: ".sl-menu__list", start: "top 85%", once: true } });

      // Closing: the motto rises line by line, the stubs follow.
      gsap.fromTo(".sl-end__h .sl-rv", { yPercent: 110 }, { yPercent: 0, duration: 1.2, ease: "expo.out", stagger: 0.12, scrollTrigger: { trigger: ".sl-end__h", start: "top 95%", once: true } });
      gsap.from(".sl-end__links > li", { y: 50, autoAlpha: 0, duration: 1, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: ".sl-end__links", start: "top 90%", once: true } });

      // Saturday rhythm: days drop in, Saturday lands last with a bounce.
      const days = gsap.utils.toArray<HTMLElement>(".sl-day");
      gsap.from(days, { y: 60, autoAlpha: 0, duration: 1, ease: "expo.out", stagger: 0.07, scrollTrigger: { trigger: ".sl-week__strip", start: "top 82%", once: true } });
      gsap.fromTo(".sl-day__bar > span", { scaleY: 0 }, { scaleY: 1, duration: 1.2, ease: "expo.out", stagger: 0.07, delay: 0.3, scrollTrigger: { trigger: ".sl-week__strip", start: "top 82%", once: true } });

      // A highlight that walks through the week and rests on Saturday.
      const walk = gsap.timeline({ repeat: -1, repeatDelay: 0.6, paused: true });
      days.forEach((d, i) => {
        const sat = d.classList.contains("sl-day--sat");
        walk.to(d, { y: sat ? -18 : -8, duration: sat ? 0.5 : 0.22, ease: sat ? "back.out(3)" : "power2.out" }, i * 0.28)
          .to(d.querySelector(".sl-day__g"), { rotation: sat ? 360 : 12, duration: sat ? 0.9 : 0.3, ease: sat ? "expo.out" : "power2.out" }, i * 0.28)
          .to(d, { y: 0, duration: 0.5, ease: "power3.out" }, i * 0.28 + (sat ? 1.2 : 0.25))
          .to(d.querySelector(".sl-day__g"), { rotation: 0, duration: 0.4, ease: "power2.out" }, i * 0.28 + (sat ? 1.2 : 0.3));
      });
      const tape = gsap.to(".sl-week__tape", { xPercent: -50, duration: 26, ease: "none", repeat: -1, paused: true });
      ScrollTrigger.create({
        trigger: ".sl-week",
        start: "top bottom",
        end: "bottom top",
        onToggle: (s) => {
          s.isActive ? walk.play() : walk.pause();
          s.isActive ? tape.play() : tape.pause();
        },
      });

      // SliceOS poster tilts as it scrolls by.
      gsap.fromTo(".sl-os__poster", { rotation: -8, y: 80 }, { rotation: 3, y: -40, ease: "none", scrollTrigger: { trigger: ".sl-os", start: "top bottom", end: "bottom top", scrub: true } });
      el.querySelectorAll<HTMLElement>(".sl-os__h").forEach((h) => {
        gsap.from(h.children, { yPercent: 100, opacity: 0, duration: 1.2, ease: "expo.out", stagger: 0.1, scrollTrigger: { trigger: h, start: "top 85%", once: true } });
      });
    });

    // Poster tilt follows the pointer on desktop.
    if (finePointer) {
      const p = el.querySelector<HTMLElement>(".sl-os__poster");
      if (p) {
        const rx = gsap.quickTo(p.firstElementChild, "rotationY", { duration: 0.6, ease: "power3.out" });
        const ry = gsap.quickTo(p.firstElementChild, "rotationX", { duration: 0.6, ease: "power3.out" });
        const move = (e: PointerEvent) => {
          const r = p.getBoundingClientRect();
          rx(((e.clientX - r.left) / r.width - 0.5) * 16);
          ry(-((e.clientY - r.top) / r.height - 0.5) * 16);
        };
        const out = () => { rx(0); ry(0); };
        p.addEventListener("pointermove", move);
        p.addEventListener("pointerleave", out);
        offs.push(() => {
          p.removeEventListener("pointermove", move); p.removeEventListener("pointerleave", out);
          // paused quickTo tweens stay in the global timeline and would retain the page
          rx.tween.kill(); ry.tween.kill();
        });
      }
    }

    // The tree: pinned, branches draw with scroll, fruit springs in when its branch completes.
    const buildTree = (pinIt: boolean) => {
      // desktop "pin" is CSS sticky inside a tall section (see slices.css): no
      // pin spacer, no reparenting, no layout shift while scrolling
      const n = Math.max(1, branches.length);
      const spanOf = (i: number) => ({ start: (i / n) * 0.82, end: ((i + 1) / n) * 0.82 + 0.06 });
      const thresholds = pairs.map(({ bi }) => Math.min(0.99, spanOf(bi).end));
      fruits.forEach((f) => { f.dataset.shown = "0"; });
      gsap.set(fruits, { scale: 0, opacity: 0 });
      gsap.set(branches, { strokeDashoffset: 1, opacity: 0 });
      gsap.set(leaves, { scale: 0, transformOrigin: "50% 50%" });
      gsap.set(".sl-tree__tag", { autoAlpha: 0, y: 20 });
      gsap.set(ringEls, { strokeDashoffset: 1 });

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: pinIt ? ".sl-tree" : ".sl-tree__pin",
          start: pinIt ? "top top" : "top 75%",
          end: pinIt ? "bottom bottom" : "bottom 60%",
          scrub: 0.6,
          onUpdate: (s) => {
            const p = s.progress;
            pairs.forEach(({ f }, i) => {
              const want = p >= thresholds[i];
              if (want && f.dataset.shown !== "1") {
                f.dataset.shown = "1";
                gsap.to(f, { scale: 1, opacity: 1, duration: 0.9, ease: "elastic.out(1.1, 0.45)", overwrite: "auto" });
                links.get(f.dataset.slug || "")?.parentElement?.classList.add("is-on");
                bus.emit("sfx", { name: "pop" });
              } else if (!want && f.dataset.shown === "1") {
                f.dataset.shown = "0";
                gsap.to(f, { scale: 0, opacity: 0, duration: 0.3, ease: "power2.in", overwrite: "auto" });
                links.get(f.dataset.slug || "")?.parentElement?.classList.remove("is-on");
              }
            });
          },
        },
      });
      // Placeholder art may not have branches yet; keep the timeline a real length.
      tl.to({}, { duration: 1 }, 0);
      branches.forEach((b, i) => {
        const s = spanOf(i);
        tl.to(b, { strokeDashoffset: 0, duration: s.end - s.start }, s.start)
          .to(b, { opacity: 1, duration: 0.01 }, s.start);
        // the two leaves on this branch sprout as the stroke passes them
        [0.45, 0.72].forEach((at, j) => {
          const leaf = leaves[i * 2 + j];
          if (leaf) tl.to(leaf, { scale: 1, duration: 0.05, ease: "back.out(3)" }, s.start + (s.end - s.start) * at * 0.9);
        });
      });
      tl.fromTo(".sl-tree__progress > span", { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0)
        .to(".sl-tree__tag--roots", { autoAlpha: 1, y: 0, duration: 0.12 }, 0)
        .to(".sl-tree__tag--trunk", { autoAlpha: 1, y: 0, duration: 0.12 }, 0.12)
        .to(".sl-tree__tag--branches", { autoAlpha: 1, y: 0, duration: 0.12 }, 0.3)
        // growth rings draw from the pith outwards as the tree finishes
        .to(ringEls, { strokeDashoffset: 0, duration: 0.05, stagger: 0.04 }, 0.72)
        .fromTo(".sl-tree__art", { scale: 0.94 }, { scale: 1, duration: 1 }, 0);
    };

    offs.push(responsive(el, "(min-width: 900px)", () => buildTree(true), () => buildTree(false)));

    return cleanup;
  },
};

export default page;
