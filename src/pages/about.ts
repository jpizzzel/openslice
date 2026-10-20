import "../styles/pages/about.css";
import type { Page } from "../core/page";
import { gsap, ScrollTrigger, reducedMotion, finePointer } from "../core/motion";
import { bus } from "../core/bus";
import { PEOPLE, SITE, STATUS_LABEL, TOOLS, type Person } from "../data/site";
import { glyph, mascot, scene, type GlyphId, type Pose } from "../art";
import { esc, footerHTML, responsive, springDrag, whenReady, words } from "./about/kit";

interface Chapter {
  id: string;
  label: string;
  year: string;
  /** numeric year, used to place tool glyphs that shipped that year */
  y?: number;
  title: string;
  caption: string;
  poses: [Pose, Pose];
  glyphs: GlyphId[];
}

const CHAPTERS: Chapter[] = [
  {
    id: "fresh",
    label: "Freshman",
    year: "2023",
    y: 2023,
    title: "Freshman roommates",
    caption: "Fall 2023. Two freshmen, one room, one Wi-Fi password. The first of a lot of late nights.",
    poses: ["stand", "wave"],
    glyphs: ["laptop", "coffee"],
  },
  {
    id: "soph",
    label: "Sophomore",
    year: "2024",
    y: 2024,
    title: "Roommates, on purpose",
    caption: "Year two. We picked each other again, which probably says something about both of us.",
    poses: ["sit", "point"],
    glyphs: ["keyboard", "terminal"],
  },
  {
    id: "junior",
    label: "Junior",
    year: "2025",
    y: 2025,
    title: "Still under one roof",
    caption: "Year three, still roommates. More side projects than free time, which is a bad ratio.",
    poses: ["carry", "push"],
    glyphs: ["dough", "rolling-pin"],
  },
  {
    id: "senior",
    label: "Senior",
    year: "2026",
    y: 2026,
    title: "Still at it",
    caption:
      "Saturday Slices runs out of our house. Peter rebuilds a paid Mac converter for himself, Jonah answers with one for Windows, and the toolbox starts to fill up.",
    poses: ["wave", "carry"],
    glyphs: [],
  },
  {
    id: "forever",
    label: "Forever",
    year: "20XX",
    title: "The rest of our lives",
    caption: "OpenSlice is meant to outlive our lease. New branches, same trunk. Every tool stays free.",
    poses: ["wave", "wave"],
    glyphs: ["star", "sparkle"],
  },
];

const PRINCIPLES: [string, string][] = [
  ["Find a paid tool we love.", "Rebuild it. Give it away."],
  ["Use it ourselves", "first."],
  ["Open source", "by default."],
  ["Pizza on", "Saturdays."],
];

const released = TOOLS.filter((t) => t.status !== "prepping");
const secret = TOOLS.filter((t) => t.status === "prepping");

function chapterGlyphs(c: Chapter) {
  const tools = c.y ? released.filter((t) => t.year === c.y) : secret;
  const toolG = tools.map(
    (t) => `<li class="ab-ch__g ab-ch__g--tool" style="--c:${t.color}">
      <span class="ab-ch__gart">${glyph(t.glyph)}</span>
      <span class="ab-ch__gname mono">${esc(t.status === "prepping" ? "Classified" : t.name)}</span>
    </li>`,
  );
  const deco = c.glyphs.map((g) => `<li class="ab-ch__g ab-ch__g--deco" aria-hidden="true"><span class="ab-ch__gart">${glyph(g)}</span></li>`);
  return [...deco, ...toolG].join("");
}

function chapterHTML(c: Chapter, i: number) {
  const toolsHere = (c.y ? released.filter((t) => t.year === c.y) : secret).length;
  return `<li class="ab-ch ab-ch--${c.id}" data-i="${i}">
    <article class="ab-ch__in" aria-labelledby="ab-ch-${c.id}">
      <div class="ab-ch__text">
        <p class="ab-ch__kicker mono"><span>${String(i + 1).padStart(2, "0")}</span> / ${c.label}</p>
        <h3 class="ab-ch__title" id="ab-ch-${c.id}"><span class="caps-red">${c.label} ${c.year}.</span> <em class="serif">${c.title}</em></h3>
        <p class="ab-ch__cap">${c.caption}</p>
        ${toolsHere ? `<p class="ab-ch__note label">${c.y ? "Shipped this chapter" : "Still in the dough"}: ${toolsHere}</p>` : ""}
      </div>
      <div class="ab-ch__art" aria-hidden="true">
        <span class="ab-ch__year">${c.year}</span>
        <span class="ab-ch__m ab-ch__m--a">${mascot("jonah", c.poses[0])}</span>
        <span class="ab-ch__m ab-ch__m--b">${mascot("peter", c.poses[1])}</span>
      </div>
      <ul class="ab-ch__glyphs" aria-label="Tools from this chapter">${chapterGlyphs(c)}</ul>
    </article>
  </li>`;
}

function personHTML(p: Person, i: number) {
  const mine = released.filter((t) => t.by.includes(p.id));
  const secrets = secret.filter((t) => t.by.includes(p.id)).length;
  return `<article class="ab-person ab-person--${p.id}" aria-labelledby="ab-p-${p.id}">
    <div class="ab-person__art" aria-hidden="true">
      <span class="ab-person__initial">${p.first[0]}</span>
      <span class="ab-person__m ab-person__m--stand">${mascot(p.id, "stand")}</span>
      <span class="ab-person__m ab-person__m--wave">${mascot(p.id, "wave")}</span>
    </div>
    <div class="ab-person__body">
      <p class="mono ab-person__idx">${String(i + 1).padStart(2, "0")} / ${i === 0 ? "Windows side" : "Mac side"}</p>
      <h3 class="ab-person__name" id="ab-p-${p.id}">${esc(p.first)}<span>${esc(p.name.slice(p.first.length + 1))}</span></h3>
      <dl class="ab-person__meta">
        <div><dt class="label">Role</dt><dd>${esc(p.role)}</dd></div>
        <div><dt class="label">Elsewhere</dt><dd><a class="u-link" href="${p.site}" target="_blank" rel="noopener" data-cursor="Visit">${esc(p.siteLabel)}</a></dd></div>
        <div><dt class="label">Made</dt><dd><ul class="ab-person__tools">
          ${mine
            .map(
              (t) => `<li><a href="/toolbox/${t.slug}" data-cursor="Open" style="--c:${t.color}"><span class="ab-person__dot"></span>${esc(t.name)}<span class="label">${STATUS_LABEL[t.status]}</span></a></li>`,
            )
            .join("")}
          ${secrets ? `<li class="ab-person__secret label">+ ${secrets} classified, still in the dough</li>` : ""}
        </ul></dd></div>
      </dl>
    </div>
  </article>`;
}

function template() {
  const [j, p] = PEOPLE;
  return `<div class="p-about">
  <section class="ab-hero" aria-labelledby="ab-title">
    <div class="ab-hero__stage" aria-hidden="true">
      <span class="ab-hero__num ab-hero__num--l">${String(SITE.since).slice(2)}</span>
      <span class="ab-hero__num ab-hero__num--r">26</span>
      <span class="ab-hero__art">${scene("duo-wave")}</span>
    </div>
    <h1 class="ab-hero__title" id="ab-title">
      <span class="ab-l"><span class="ab-li caps-red">Two roommates.</span></span>
      <span class="ab-l"><span class="ab-li serif"><em>One oven.</em></span></span>
      <span class="ab-l"><span class="ab-li caps-red">Every tool free.</span></span>
    </h1>
    <dl class="ab-hero__meta">
      <div><dt class="label">Roommates since</dt><dd>Fall ${SITE.since}</dd></div>
      <div><dt class="label">Where</dt><dd>${SITE.where}</dd></div>
      <div><dt class="label">Trunk</dt><dd><a class="u-link" href="/slices" data-cursor="Trunk">${SITE.trunk.name}</a></dd></div>
      <div><dt class="label">On the shelf</dt><dd>${released.length} tools, ${secret.length} secret</dd></div>
    </dl>
    <p class="ab-hero__lede"><span class="serif">${esc(SITE.manifesto)}</span></p>
    <p class="ab-hero__scroll mono" aria-hidden="true">Scroll the years <span>&darr;</span></p>
  </section>

  <section class="ab-time" aria-labelledby="ab-time-h">
    <div class="ab-time__pin">
      <header class="ab-time__head">
        <p class="label">Chapters</p>
        <h2 id="ab-time-h" class="ab-time__h"><span class="caps-red">The story</span> <em class="serif">so far</em></h2>
        <p class="ab-time__odo" aria-hidden="true">${[0, 1, 2, 3].map(() => `<span class="ab-odo__win"><span class="ab-odo__col">${"0123456789X".split("").map((d) => `<span>${d}</span>`).join("")}</span></span>`).join("")}</p>
      </header>
      <ol class="ab-time__track">${CHAPTERS.map(chapterHTML).join("")}</ol>
      <div class="ab-time__rail" aria-hidden="true">
        <span class="ab-time__line"><span class="ab-time__fill"></span></span>
        <span class="ab-time__rider">${glyph("slice")}</span>
        <ol class="ab-time__ticks">${CHAPTERS.map((c) => `<li>${c.label} <span>${c.year}</span></li>`).join("")}</ol>
      </div>
    </div>
  </section>

  <section class="ab-duo" aria-labelledby="ab-duo-h">
    <header class="ab-sec-head">
      <p class="label">The crew</p>
      <h2 id="ab-duo-h"><span class="caps-red">Two people,</span> <em class="serif">one repo.</em></h2>
    </header>
    <div class="ab-duo__grid">
      ${personHTML(j, 0)}
      <span class="ab-duo__amp serif" aria-hidden="true">&amp;</span>
      ${personHTML(p, 1)}
    </div>
  </section>

  <section class="ab-how" aria-labelledby="ab-how-h">
    <header class="ab-sec-head">
      <p class="label">House rules</p>
      <h2 id="ab-how-h"><span class="caps-red">How we</span> <em class="serif">work.</em></h2>
    </header>
    <ol class="ab-how__list">
      ${PRINCIPLES.map(
        ([a, b], i) => `<li class="ab-how__item">
          <span class="ab-how__n" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span>
          <p class="ab-how__s">${words(a)} <em class="serif">${words(b)}</em></p>
        </li>`,
      ).join("")}
    </ol>
  </section>

  <section class="ab-hi" aria-labelledby="ab-hi-h">
    <div class="ab-hi__side">
      <p class="label">Contact</p>
      <p class="ab-hi__line serif">No inbox, no form. Find us on our own sites, in the repo, or behind the counter on a Saturday.</p>
      <p class="label ab-hi__hint">${finePointer ? "Psst. The cards move. Give them a tug." : "Two cards, tossed on the table."}</p>
    </div>
    <div class="ab-hi__table">
      <article class="ab-card ab-card--credits" aria-labelledby="ab-cred-h">
        <h2 id="ab-cred-h" class="ab-card__h">Credits</h2>
        <dl class="ab-card__grid">
          <div><dt>Design &amp; build</dt><dd>Jonah &amp; Peter<br><span class="ab-card__soft">(with a little help)</span></dd></div>
          <div><dt>Built with</dt><dd>Vite<br>GSAP<br>Lenis</dd></div>
          <div><dt>Fonts</dt><dd>Bricolage Grotesque<br>Big Shoulders Display<br>Instrument Serif<br>JetBrains Mono</dd></div>
        </dl>
        <span class="ab-card__mascot" aria-hidden="true">${mascot("jonah", "point")}</span>
      </article>
      <article class="ab-card ab-card--hi" aria-labelledby="ab-hi-h">
        <h2 id="ab-hi-h" class="ab-card__h">Come say hi</h2>
        <dl class="ab-card__grid">
          <div><dt>Jonah, online</dt><dd><a href="${j.site}" target="_blank" rel="noopener">${j.siteLabel}</a></dd></div>
          <div><dt>Peter, online</dt><dd><a href="${p.site}" target="_blank" rel="noopener">${p.siteLabel}</a></dd></div>
          <div><dt>Read every line</dt><dd><a href="${SITE.repo}" target="_blank" rel="noopener">GitHub repo</a></dd></div>
          <div><dt>Hungry?</dt><dd><a href="${SITE.trunk.href}" target="_blank" rel="noopener">${SITE.trunk.name}</a></dd></div>
        </dl>
        <p class="ab-card__foot mono"><span>OpenSlice</span><span>Est. ${SITE.since}</span></p>
      </article>
    </div>
  </section>
  ${footerHTML()}
</div>`;
}

const page: Page = {
  title: "About",
  section: "About",
  mount({ root, first }) {
    root.innerHTML = template();
    const el = root.querySelector<HTMLElement>(".p-about")!;
    let alive = true;
    const offs: (() => void)[] = [];
    const ctx = gsap.context(() => {}, el);

    // Cards: spring drag + raise the one you grab.
    const cards = [...el.querySelectorAll<HTMLElement>(".ab-card")];
    cards.forEach((c) =>
      offs.push(
        springDrag(c, () => {
          cards.forEach((o) => o.classList.toggle("is-top", o === c));
          bus.emit("sfx", { name: "tick" });
        }),
      ),
    );

    // Hovering a person: little hop + pop sound.
    el.querySelectorAll<HTMLElement>(".ab-person").forEach((p) => {
      const on = () => bus.emit("sfx", { name: "pop" });
      p.addEventListener("mouseenter", on);
      offs.push(() => p.removeEventListener("mouseenter", on));
    });

    if (reducedMotion) {
      el.classList.add("is-static");
      return () => {
        alive = false;
        offs.forEach((f) => f());
        ctx.revert();
      };
    }

    ctx.add(() => {
      // Hidden until the intro runs.
      gsap.set(".ab-li", { yPercent: 110 });
      gsap.set(".ab-hero__art", { autoAlpha: 0, scale: 0.92, y: 40 });
      gsap.set(".ab-hero__num", { autoAlpha: 0, y: 80 });
      gsap.set(".ab-hero__meta > div, .ab-hero__lede, .ab-hero__scroll", { autoAlpha: 0, y: 16 });
    });

    whenReady(first, () => alive, () =>
      ctx.add(() => {
        const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
        tl.to(".ab-li", { yPercent: 0, duration: 1.3, stagger: 0.1 })
          .to(".ab-hero__num", { autoAlpha: 1, y: 0, duration: 1.6, stagger: 0.08 }, 0.1)
          .to(".ab-hero__art", { autoAlpha: 1, scale: 1, y: 0, duration: 1.6 }, 0.25)
          .to(".ab-hero__meta > div, .ab-hero__lede, .ab-hero__scroll", { autoAlpha: 1, y: 0, duration: 1, stagger: 0.05 }, 0.5);
      }),
    );

    ctx.add(() => {
      // Hero: numerals drift apart, art sinks a little.
      gsap.to(".ab-hero__num--l", { xPercent: -18, ease: "none", scrollTrigger: { trigger: ".ab-hero", start: "top top", end: "bottom top", scrub: true } });
      gsap.to(".ab-hero__num--r", { xPercent: 18, ease: "none", scrollTrigger: { trigger: ".ab-hero", start: "top top", end: "bottom top", scrub: true } });
      gsap.to(".ab-hero__art", { yPercent: 12, ease: "none", scrollTrigger: { trigger: ".ab-hero", start: "top top", end: "bottom top", scrub: true } });

      // Principles: words rise in.
      el.querySelectorAll<HTMLElement>(".ab-how__item").forEach((item) => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: item, start: "top 82%", once: true } });
        tl.from(item.querySelectorAll(".kw"), { yPercent: 110, duration: 1.1, stagger: 0.04, ease: "expo.out" })
          .from(item.querySelector(".ab-how__n"), { autoAlpha: 0, x: -30, duration: 1, ease: "expo.out" }, 0);
      });

      // Persons rise in.
      gsap.from(".ab-person", { y: 80, autoAlpha: 0, duration: 1.2, stagger: 0.15, ease: "expo.out", scrollTrigger: { trigger: ".ab-duo__grid", start: "top 80%", once: true } });

      // Cards tossed onto the table.
      gsap.from(".ab-card--credits", { y: 160, xPercent: -20, rotation: 18, autoAlpha: 0, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".ab-hi__table", start: "top 80%", once: true } });
      gsap.from(".ab-card--hi", { y: 200, xPercent: 20, rotation: -16, autoAlpha: 0, duration: 1.4, delay: 0.12, ease: "expo.out", scrollTrigger: { trigger: ".ab-hi__table", start: "top 80%", once: true } });
    });

    // Timeline: a horizontal scroll on wide screens, stacked list on small ones.
    // The pin is CSS sticky inside a section sized to the scroll distance, so
    // nothing is reparented or re-measured mid-scroll (no pin spacer, no CLS).
    const section = el.querySelector<HTMLElement>(".ab-time")!;
    const odo = [...el.querySelectorAll<HTMLElement>(".ab-time__odo .ab-odo__col")];
    const rollTo = (year: string) => {
      odo.forEach((col, k) => {
        const ch = year[k] ?? "0";
        const idx = ch === "X" ? 10 : Number(ch);
        gsap.to(col, { yPercent: -idx * (100 / 11), duration: 0.9 + k * 0.12, ease: "expo.out", overwrite: true });
      });
    };
    offs.push(responsive(el, "(min-width: 900px)", () => {
      const track = el.querySelector<HTMLElement>(".ab-time__track")!;
      const rail = el.querySelector<HTMLElement>(".ab-time__line")!;
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const size = () => { section.style.height = `${Math.round(window.innerHeight + dist())}px`; };
      size();
      ScrollTrigger.addEventListener("refreshInit", size);
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section,
          scrub: 0.8,
          start: "top top",
          end: "bottom bottom",
          invalidateOnRefresh: true,
        },
      });
      tl.to(track, { x: () => -dist() }, 0)
        .fromTo(".ab-time__fill", { scaleX: 0 }, { scaleX: 1 }, 0)
        .fromTo(".ab-time__rider", { x: 0, rotation: 0 }, { x: () => rail.offsetWidth, rotation: 720 }, 0);

      const ticks = [...el.querySelectorAll<HTMLElement>(".ab-time__ticks li")];
      gsap.set(odo, { yPercent: 0 });
      rollTo(CHAPTERS[0].year);
      el.querySelectorAll<HTMLElement>(".ab-ch").forEach((ch, i) => {
        const gl = ch.querySelectorAll(".ab-ch__g");
        gsap.set(gl, { scale: 0, autoAlpha: 0 });
        ScrollTrigger.create({
          trigger: ch,
          containerAnimation: tl,
          start: "left 60%",
          end: "right 40%",
          onToggle: (s) => {
            ticks[i]?.classList.toggle("is-on", s.isActive);
            if (s.isActive) rollTo(CHAPTERS[i].year);
          },
          onEnter: () => {
            gsap.to(gl, { scale: 1, autoAlpha: 1, duration: 0.9, stagger: 0.08, ease: "back.out(2.4)", overwrite: true });
            if (gl.length) bus.emit("sfx", { name: "pop" });
          },
          onLeaveBack: () => gsap.to(gl, { scale: 0, autoAlpha: 0, duration: 0.3, ease: "power2.in", overwrite: true }),
        });
        gsap.fromTo(ch.querySelector(".ab-ch__year"), { xPercent: 25 }, { xPercent: -25, ease: "none", scrollTrigger: { trigger: ch, containerAnimation: tl, start: "left right", end: "right left", scrub: true } });
        gsap.fromTo(ch.querySelector(".ab-ch__m--a"), { y: 40, rotation: -6 }, { y: -20, rotation: 4, ease: "none", scrollTrigger: { trigger: ch, containerAnimation: tl, start: "left right", end: "right left", scrub: true } });
        gsap.fromTo(ch.querySelector(".ab-ch__m--b"), { y: -10, rotation: 6 }, { y: 30, rotation: -4, ease: "none", scrollTrigger: { trigger: ch, containerAnimation: tl, start: "left right", end: "right left", scrub: true } });
      });
      return () => {
        ScrollTrigger.removeEventListener("refreshInit", size);
        section.style.height = "";
        gsap.killTweensOf(odo);
      };
    }, () => {
      el.querySelectorAll<HTMLElement>(".ab-ch").forEach((ch) => {
        const gl = ch.querySelectorAll(".ab-ch__g");
        gsap.from(ch.querySelectorAll(".ab-ch__m"), { y: 60, autoAlpha: 0, duration: 1.1, stagger: 0.1, ease: "expo.out", scrollTrigger: { trigger: ch, start: "top 80%", once: true } });
        gsap.from(gl, { scale: 0, autoAlpha: 0, duration: 0.9, stagger: 0.08, ease: "back.out(2.4)", scrollTrigger: { trigger: ch, start: "top 60%", once: true } });
      });
    }));

    return () => {
      alive = false;
      offs.forEach((f) => f());
      ctx.revert();
    };
  },
};

export default page;
