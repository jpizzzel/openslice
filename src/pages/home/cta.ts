// CTA: two giant links, to the trunk and to the toolbox.
import { gsap } from "../../core/motion";
import { glyph, type GlyphId } from "../../art";
import { TOOLS } from "../../data/site";
import { esc, type Kit } from "./kit";

const roll = (word: string) =>
  [...word].map((ch, i) => {
    const c = ch === " " ? "&nbsp;" : esc(ch);
    return `<span class="cta-ch" style="--i:${i}"><span class="cta-in"><span>${c}</span><span>${c}</span></span></span>`;
  }).join("");

const LINKS: { href: string; k: string; word: string; sub: string; g: GlyphId }[] = [
  { href: "/slices", k: "The trunk", word: "Saturday Slices", sub: "Where it started: the pizza place we run out of our house.", g: "slice" },
  { href: "/toolbox", k: "The branches", word: "The Toolbox", sub: `${TOOLS.length} slices, all free, all open source.`, g: "box-open" },
];

export function ctaHTML() {
  return `
  <section class="h-cta" aria-labelledby="cta-title">
    <div class="h-cta__head">
      <p class="label">(04)</p>
      <h2 id="cta-title" class="h-cta__title serif">Pick a <em>slice.</em></h2>
    </div>
    <ul class="h-cta__list">
      ${LINKS.map((l, i) => `
      <li>
        <a class="cta" href="${l.href}" data-cursor="Go">
          <span class="cta__k label">0${i + 1} / ${l.k}</span>
          <span class="cta__word" aria-label="${esc(l.word)}"><span aria-hidden="true">${roll(l.word)}</span></span>
          <span class="cta__sub">${esc(l.sub)}</span>
          <span class="cta__arrow" aria-hidden="true">${glyph("arrow")}</span>
          <span class="cta__g" aria-hidden="true">${glyph(l.g)}</span>
        </a>
      </li>`).join("")}
    </ul>
  </section>`;
}

export function initCta(kit: Kit) {
  const sec = kit.root.querySelector<HTMLElement>(".h-cta")!;
  if (kit.reduced) return;
  const links = [...sec.querySelectorAll<HTMLElement>(".cta")];
  kit.add(() => {
    links.forEach((a) => {
      gsap.from(a.querySelectorAll(".cta-in"), {
        yPercent: 100, duration: 1.2, ease: "expo.out", stagger: 0.025,
        scrollTrigger: { trigger: a, start: "top 88%" },
      });
    });
  });
  if (!kit.fine) return;
  links.forEach((a) => {
    const g = a.querySelector<HTMLElement>(".cta__g")!;
    let qx!: (v: number) => void, qy!: (v: number) => void, qr!: (v: number) => void;
    kit.add(() => {
      gsap.set(g, { xPercent: -50, yPercent: -50, scale: 0, rotation: -30 });
      qx = gsap.quickTo(g, "x", { duration: 0.7, ease: "power3" });
      qy = gsap.quickTo(g, "y", { duration: 0.7, ease: "power3" });
      qr = gsap.quickTo(g, "rotation", { duration: 1, ease: "power3" });
    });
    let last = 0;
    const move = (e: PointerEvent) => {
      const r = a.getBoundingClientRect();
      qx(e.clientX - r.left); qy(e.clientY - r.top);
      qr(Math.max(-30, Math.min(30, (e.clientX - last) * 1.2)));
      last = e.clientX;
    };
    const enter = (e: PointerEvent) => {
      const r = a.getBoundingClientRect();
      last = e.clientX;
      gsap.set(g, { x: e.clientX - r.left, y: e.clientY - r.top });
      gsap.to(g, { scale: 1, duration: 0.8, ease: "elastic.out(1, 0.45)", overwrite: "auto" });
    };
    const leave = () => gsap.to(g, { scale: 0, duration: 0.35, ease: "power3.in", overwrite: "auto" });
    a.addEventListener("pointermove", move, { passive: true });
    a.addEventListener("pointerenter", enter);
    a.addEventListener("pointerleave", leave);
    kit.onCleanup(() => {
      a.removeEventListener("pointermove", move);
      a.removeEventListener("pointerenter", enter);
      a.removeEventListener("pointerleave", leave);
    });
  });
}
