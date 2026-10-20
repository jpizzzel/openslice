// THE DUO: the two founders, and a counter of years cooking together.
import { gsap } from "../../core/motion";
import { scene, glyph } from "../../art";
import { PEOPLE, SITE } from "../../data/site";
import { esc, type Kit } from "./kit";

export const yearsTogether = () => Math.max(1, new Date().getFullYear() - SITE.since);

export function duoHTML() {
  const years = yearsTogether();
  const people = PEOPLE.map(
    (p, i) => `
      <li class="duo-p">
        <span class="duo-p__no label">${i === 0 ? "A" : "B"}</span>
        <a class="duo-p__a" href="${p.site}" target="_blank" rel="noopener" data-cursor="Visit">
          <span class="duo-p__name serif">${esc(p.name)}</span>
          <span class="duo-p__arrow" aria-hidden="true">${glyph("arrow")}</span>
        </a>
        <span class="duo-p__meta"><span>${esc(p.role)}</span><span class="duo-p__site">${esc(p.siteLabel)}</span></span>
      </li>`,
  ).join("");

  return `
  <section class="h-duo" aria-labelledby="duo-title">
    <div class="h-duo__head">
      <p class="label">(03) The duo</p>
      <h2 id="duo-title" class="h-duo__title caps-red"><span class="h-duo__tl"><span>Still roommates,</span></span><span class="h-duo__tl"><span>still cooking</span></span></h2>
    </div>
    <figure class="h-duo__art" aria-hidden="true"><div class="h-duo__art-in">${scene("duo-wave")}</div></figure>
    <div class="h-duo__body">
      <p class="h-duo__line serif">Freshman roommates in ${SITE.since}. Seniors now, still under one roof, still building. Whatever we make for ourselves ends up here, free.</p>
      <ul class="duo-people">${people}</ul>
    </div>
    <div class="h-duo__count">
      <p class="h-duo__num mega" aria-hidden="true"><span class="h-duo__val" data-to="${years}">${years}</span></p>
      <p class="h-duo__cap"><span class="caps-red">Years building together</span><span class="label">Since ${SITE.since}, and counting. <span class="sr-only">${years} years so far.</span></span></p>
    </div>
  </section>`;
}

export function initDuo(kit: Kit) {
  const sec = kit.root.querySelector<HTMLElement>(".h-duo")!;
  if (kit.reduced) return;
  const val = sec.querySelector<HTMLElement>(".h-duo__val")!;
  const to = Number(val.dataset.to);
  kit.add(() => {
    gsap.from(sec.querySelectorAll(".h-duo__tl > span"), {
      yPercent: 110, duration: 1.3, ease: "expo.out", stagger: 0.1,
      scrollTrigger: { trigger: sec, start: "top 70%" },
    });
    gsap.fromTo(sec.querySelector(".h-duo__art-in"), { yPercent: 8, rotation: -2 }, {
      yPercent: -6, rotation: 1.5, ease: "none",
      scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: true },
    });
    gsap.from(sec.querySelectorAll(".duo-p"), {
      y: 40, opacity: 0, duration: 1.1, ease: "expo.out", stagger: 0.1,
      scrollTrigger: { trigger: sec.querySelector(".duo-people"), start: "top 88%" },
    });
    const n = { v: 0 };
    val.textContent = "0";
    gsap.timeline({ scrollTrigger: { trigger: sec.querySelector(".h-duo__count"), start: "top 85%" } })
      .from(val, { yPercent: 40, opacity: 0, duration: 1.2, ease: "expo.out" }, 0)
      .to(n, {
        v: to, duration: 2.2, ease: "expo.out",
        onUpdate: () => { val.textContent = String(Math.round(n.v)); },
      }, 0)
      .to(val, { keyframes: [{ scaleY: 1.1, scaleX: 0.95, duration: 0.14, ease: "power2.out" }, { scaleY: 1, scaleX: 1, duration: 0.9, ease: "elastic.out(1, 0.3)" }] }, 1.5);
  });
}
