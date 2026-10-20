// THE ORDER TICKET: the hero's facts as a kitchen ticket stub. Every line is
// read from site data; classified tools collapse into one redacted line.
import { SITE, TOOLS, STATUS_LABEL } from "../../data/site";
import { esc } from "./kit";

export const servedTools = () => TOOLS.filter((t) => t.status !== "prepping");
export const secretTools = () => TOOLS.filter((t) => t.status === "prepping");

/** a redaction bar that reads as "redacted" to assistive tech */
export const redacted = (ch = 9) =>
  `<span class="redact" style="--ch:${ch}"><span class="sr-only">Redacted</span></span>`;

export function ticketHTML() {
  const served = servedTools();
  const secret = secretTools();
  const items = [
    `<li class="tk-li"><span class="tk-q">1x</span><span class="tk-n">Roommates since ${SITE.since}</span><span class="tk-p">$0.00</span></li>`,
    ...served.map(
      (t) => `<li class="tk-li"><span class="tk-q">1x</span><span class="tk-n"><a class="tk-a u-link" href="/toolbox/${t.slug}" data-cursor="Open">${esc(t.name)}</a> <span class="tk-s">${esc(STATUS_LABEL[t.status].toLowerCase())}</span></span><span class="tk-p">$0.00</span></li>`,
    ),
    secret.length
      ? `<li class="tk-li tk-li--secret"><span class="tk-q">+${secret.length}</span><span class="tk-n">classified</span><span class="tk-p">${redacted(5)}</span></li>`
      : "",
  ].join("");

  return `
  <aside class="h-tk" aria-label="Order ticket">
    <div class="tk">
      <div class="tk-head">
        <p class="tk-brand">${esc(SITE.name)} kitchen</p>
        <p class="tk-row"><span>Ticket</span><span>No. ${SITE.since}</span></p>
        <p class="tk-row"><span>Order for</span><span>Students, engineers, small businesses</span></p>
      </div>
      <ol class="tk-items">${items}</ol>
      <dl class="tk-tot">
        <div><dt>Subscriptions</dt><dd>$0.00/mo</dd></div>
        <div class="tk-total"><dt>Total</dt><dd>$0.00</dd></div>
        <div><dt>Tip</dt><dd><a class="u-link" href="${SITE.repo}" target="_blank" rel="noopener" data-cursor="Star">a GitHub star</a></dd></div>
      </dl>
      <p class="tk-stamp" aria-hidden="true"><span>Paid</span><span>in full</span></p>
      <div class="tk-stub">
        <p class="tk-thanks">Fed by <a class="u-link" href="${SITE.trunk.href}" target="_blank" rel="noopener">${esc(SITE.trunk.name)}</a> regulars. Thank you, come again.</p>
        <span class="tk-code" aria-hidden="true"></span>
      </div>
    </div>
  </aside>`;
}
