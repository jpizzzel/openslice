// MANIFESTO: big serif sentence lighting up word by word as you scroll,
// with tiny ink glyphs tucked between the words.
import { gsap } from "../../core/motion";
import { glyph, type GlyphId } from "../../art";
import { SITE } from "../../data/site";
import { esc, type Kit } from "./kit";

// word (lowercased, punctuation stripped) -> glyph shown right after it
const AFTER: Record<string, GlyphId> = {
  roommates: "headphones",
  pizza: "slice",
  kitchen: "oven",
  apps: "laptop",
  free: "star",
  trunk: "pizza",
  branch: "basil",
  source: "github",
};
const ACCENT = new Set(["saturday", "slices", "free", "open", "source"]);

export function manifestoHTML() {
  const used = new Set<string>();
  const words = SITE.manifesto.split(/\s+/).map((w) => {
    const key = w.toLowerCase().replace(/[^a-z]/g, "");
    const cls = ACCENT.has(key) ? "mf-w mf-w--hot" : "mf-w";
    let out = `<span class="${cls}">${esc(w)}</span>`;
    if (AFTER[key] && !used.has(key)) {
      used.add(key);
      out += ` <span class="mf-g" aria-hidden="true">${glyph(AFTER[key])}</span>`;
    }
    return out;
  });
  return `
  <section class="h-mf" aria-labelledby="mf-title">
    <div class="h-mf__head">
      <h2 id="mf-title" class="label">The recipe</h2>
      <p class="label">(01)</p>
    </div>
    <p class="h-mf__text serif">${words.join(" ")}</p>
    <div class="h-mf__foot">
      <p class="label">Est. ${SITE.since}</p>
      <p class="h-mf__sig serif">Jonah &amp; Peter</p>
      <p class="label">${esc(SITE.where)}</p>
    </div>
  </section>`;
}

export function initManifesto(kit: Kit) {
  const sec = kit.root.querySelector<HTMLElement>(".h-mf")!;
  if (kit.reduced) return;
  const items = [...sec.querySelectorAll<HTMLElement>(".mf-w, .mf-g")];
  kit.add(() => {
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: sec.querySelector(".h-mf__text"), start: "top 78%", end: "bottom 50%", scrub: 0.5 },
    });
    items.forEach((el, i) => {
      if (el.classList.contains("mf-g")) {
        tl.fromTo(el, { scale: 0.35, rotation: -50, opacity: 0.13 }, { scale: 1, rotation: 0, opacity: 1, duration: 1.4, ease: "back.out(2.5)" }, i * 0.5);
      } else {
        tl.fromTo(el, { opacity: 0.13 }, { opacity: 1, duration: 1 }, i * 0.5);
      }
    });
    gsap.from(sec.querySelector(".h-mf__sig"), {
      yPercent: 60, rotation: -6, opacity: 0, duration: 1.4, ease: "expo.out",
      scrollTrigger: { trigger: sec.querySelector(".h-mf__foot"), start: "top 90%" },
    });
  });
}
