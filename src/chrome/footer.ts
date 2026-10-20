// Shared site footer. Pages append `renderFooter()` at the end of their root.
// Static HTML; styles live in chrome.css under .site-footer. The chrome adds
// .is-peek when the wordmark is on screen: Jonah and Peter climb up behind it and
// hang their hands over the top of the letters. The chrome also fits the wordmark
// to the width, keeps "You were in" current and, on Saturdays, makes it shimmer.
import { PEOPLE, SITE } from "../data/site";
import { mascot, miniTree } from "../art";
import { isSaturday } from "./countdown";
import { placeFor } from "./sections";

// a white glove from above, gripping an edge: knuckles behind, four fingertips curled over
const GLOVE = `<svg viewBox="0 0 44 34" aria-hidden="true"><path class="g-back" d="M3 15C3 6 11 2 22 2S41 6 41 15Z"/><path d="M4 13h9v11a4.5 4.5 0 0 1-9 0ZM13.5 13h9v13a4.5 4.5 0 0 1-9 0ZM23 13h9v12.5a4.5 4.5 0 0 1-9 0ZM32 13h8.5v9.5a4.25 4.25 0 0 1-8.5 0Z"/><path class="g-crease" d="M9 6.5q4 3 8 1M24 5q4 2.5 9 1"/></svg>`;

/** Years the trunk has been growing, counting the first one: 2023 -> ring 1. */
export const rings = (now = new Date()) => Math.max(1, now.getFullYear() - SITE.since + 1);

export function renderFooter(): string {
  const people = PEOPLE.map((p) => `
    <div class="sf-col">
      <span class="sf-k">${p.first}</span>
      <a class="u-link" href="${p.site}" target="_blank" rel="noopener" data-cursor="Visit">${p.siteLabel}</a>
    </div>`).join("");
  const years = rings();
  const apron = isSaturday();
  return `
  <footer class="site-footer" aria-label="Site footer">
    <div class="sf-grid">
      <p class="sf-lede serif">Made by two roommates and one very tired oven.</p>
      ${people}
      <div class="sf-col">
        <span class="sf-k">The trunk</span>
        <a class="u-link" href="/slices">${SITE.trunk.name}</a>
        <a class="u-link" href="${SITE.trunk.href}" target="_blank" rel="noopener">saturdayslices.com</a>
      </div>
      <div class="sf-col">
        <span class="sf-k">Source</span>
        <a class="u-link" href="${SITE.repo}" target="_blank" rel="noopener" data-cursor="GitHub">${SITE.repo.replace(/^https?:\/\/(www\.)?/, "").replace(/\//g, "/<wbr>")}</a>
        <span class="sf-v">MIT licensed. Every slice open source.</span>
      </div>
    </div>
    <div class="sf-word" aria-hidden="true">
      <div class="sf-peek"><span class="sf-m sf-m1">${mascot("jonah", "wave", { apron })}</span><span class="sf-m sf-m2">${mascot("peter", "stand", { apron })}</span></div>
      <span class="sf-wm">OPENSLICE<sup>&copy;</sup></span>
      <div class="sf-grip"><i class="sf-g sf-g1">${GLOVE}</i><i class="sf-g sf-g2">${GLOVE}</i><i class="sf-g sf-g3">${GLOVE}</i></div>
    </div>
    <div class="sf-base">
      <span class="sf-ring"><span class="sf-tree" aria-hidden="true">${miniTree(years)}</span><span>Growing since ${SITE.since}. Ring ${years}.</span></span>
      <span class="sf-where">You were in: <b data-sf-where>${placeFor(location.pathname, document.body.dataset.page)}</b></span>
      <a class="u-link" href="#view" data-native data-sf-top>Back to top</a>
    </div>
  </footer>`;
}
