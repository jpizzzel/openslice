// Shared site footer. Pages append `renderFooter()` at the end of their root.
// Static HTML; styles live in chrome.css under .site-footer. The chrome adds
// .is-peek when the wordmark is on screen and Jonah and Peter pop up behind it.
import { PEOPLE, SITE } from "../data/site";
import { mascot } from "../art";

export function renderFooter(): string {
  const people = PEOPLE.map((p) => `
    <div class="sf-col">
      <span class="sf-k">${p.first}</span>
      <a class="u-link" href="${p.site}" target="_blank" rel="noopener" data-cursor="Visit">${p.siteLabel}</a>
    </div>`).join("");
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
      <div class="sf-peek"><span class="sf-m sf-m1">${mascot("jonah", "wave")}</span><span class="sf-m sf-m2">${mascot("peter", "point")}</span></div>
      <span class="sf-wm">OPENSLICE</span><i>©</i>
    </div>
    <div class="sf-base">
      <span>Made in our kitchen, ${SITE.since} to forever.</span>
      <a class="u-link" href="#view" data-native data-sf-top>Back to top</a>
    </div>
  </footer>`;
}
