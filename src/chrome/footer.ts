// Shared site footer. Pages append `renderFooter()` at the end of their root.
// Static HTML; styles live in chrome.css under .site-footer. The chrome calls
// bindFooter() after each route: it fits the wordmark to the width and adds
// .is-peek when the wordmark is on screen, so Jonah and Peter climb up behind it
// and hook their hands over the top of the letters.
import { PEOPLE, SITE } from "../data/site";
import { mascot } from "../art";

// a white glove from above, gripping an edge: knuckles behind, four fingertips curled over
const GLOVE = `<svg viewBox="0 0 44 34" aria-hidden="true"><path class="g-back" d="M3 15C3 6 11 2 22 2S41 6 41 15Z"/><path d="M4 13h9v11a4.5 4.5 0 0 1-9 0ZM13.5 13h9v13a4.5 4.5 0 0 1-9 0ZM23 13h9v12.5a4.5 4.5 0 0 1-9 0ZM32 13h8.5v9.5a4.25 4.25 0 0 1-8.5 0Z"/><path class="g-crease" d="M9 6.5q4 3 8 1M24 5q4 2.5 9 1"/></svg>`;

const ext = (href: string, text: string) =>
  `<a href="${href}" target="_blank" rel="noopener">${text}<span class="sr-only"> (opens in a new tab)</span></a>`;

export function renderFooter(): string {
  const people = PEOPLE.map((p) => `<li><span class="sf-k">${p.first}</span>${ext(p.site, p.siteLabel)}</li>`).join("");
  const names = PEOPLE.map((p) => p.first).join(" and ");
  return `
  <footer class="site-footer" aria-label="Site footer">
    <div class="sf-top">
      <p class="sf-note">Made by ${names}.</p>
      <ul class="sf-links">
        ${people}
        <li><span class="sf-k">${SITE.trunk.name}</span>${ext(SITE.trunk.href, "saturdayslices.com")}</li>
        <li><span class="sf-k">Source</span>${ext(SITE.repo, "GitHub")}</li>
      </ul>
    </div>
    <div class="sf-word" aria-hidden="true">
      <div class="sf-peek"><span class="sf-m sf-m1">${mascot("jonah", "wave")}</span><span class="sf-m sf-m2">${mascot("peter", "stand")}</span></div>
      <span class="sf-wm" data-wm="OPENSLICE"></span>
      <div class="sf-grip"><i class="sf-g sf-g1">${GLOVE}</i><i class="sf-g sf-g2">${GLOVE}</i><i class="sf-g sf-g3">${GLOVE}</i></div>
    </div>
    <div class="sf-base">
      <span>MIT licensed.</span>
      <a href="#view" data-native data-sf-top>Back to top</a>
    </div>
  </footer>`;
}

let io: IntersectionObserver | null = null;
let fit: (() => void) | null = null;
let rz = 0;
addEventListener("resize", () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => fit?.()); }, { passive: true });

/** Wire the footer in `view`, if the page has one. Safe to call on every route. */
export function bindFooter(view: HTMLElement) {
  io?.disconnect();
  io = null;
  fit = null;
  const f = view.querySelector<HTMLElement>(".site-footer");
  const word = f?.querySelector<HTMLElement>(".sf-word");
  const wm = word?.querySelector<HTMLElement>(".sf-wm");
  if (!f || !word || !wm) return;
  // set the wordmark so it spans the footer's content box exactly
  fit = () => {
    const avail = word.clientWidth;
    const w = wm.getBoundingClientRect().width;
    const fs = parseFloat(getComputedStyle(word).fontSize);
    if (!avail || !w || !fs) return;
    const next = Math.floor(fs * (avail / w) * 100) / 100;
    if (Math.abs(next - fs) > 0.25) word.style.setProperty("--sf-fit", `${next}px`);
  };
  fit();
  document.fonts?.ready.then(() => fit?.());
  io = new IntersectionObserver(([en]) => f.classList.toggle("is-peek", en.intersectionRatio > 0.6), { threshold: [0, 0.6, 1] });
  io.observe(word);
}
