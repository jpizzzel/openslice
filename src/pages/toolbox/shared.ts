// Shared helpers for the toolbox index and tool detail pages.
import { PEOPLE, STATUS_LABEL, type Person, type Status, type Tool } from "../../data/site";

export const pad = (n: number) => String(n).padStart(2, "0");

const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ESC[c]);

export const makers = (t: Tool): Person[] =>
  t.by.map((id) => PEOPLE.find((p) => p.id === id)).filter((p): p is Person => !!p);

export const isClassified = (t: Tool) => t.status === "prepping";

/** UI fallback when a tool does not replace a paid app. */
export const replacesText = (t: Tool) =>
  t.replaces ?? (isClassified(t) ? "Redacted" : "Nothing. It's homemade");

export const STATUS_TONE: Record<Status, string> = {
  served: "var(--basil)",
  proofing: "var(--cheese)",
  baking: "var(--tomato)",
  prepping: "var(--ink)",
};

export function statusPill(t: Tool, cls = "") {
  return `<span class="os-pill ${cls}" style="--tone:${STATUS_TONE[t.status]}"><i aria-hidden="true"></i>${esc(STATUS_LABEL[t.status])}</span>`;
}

/** A redaction bar standing in for a value we are not ready to say out loud. */
export const redactBar = (w = "7.5em") =>
  `<span class="rd rd--bar" style="--w:${w}" aria-hidden="true"></span><span class="sr-only">Redacted</span>`;

/** "Replaces" value as HTML: classified tools get a redaction bar, never a word. */
export const replacesHTML = (t: Tool) => (isClassified(t) && !t.replaces ? redactBar() : esc(replacesText(t)));

/** Wraps a deterministic subset of words in redaction bars. */
export function redact(text: string, every = 3) {
  return text
    .split(" ")
    .map((w, i) =>
      i % every === 1 && w.replace(/[^\w]/g, "").length > 3
        ? `<span class="rd" style="--rd:${(i * 0.37) % 1.2}s">${esc(w)}</span>`
        : esc(w)
    )
    .join(" ");
}

// The persistent chrome provides an optional footer. Glob keeps the
// build green whether or not the file exists yet.
const footerMods = import.meta.glob<{ renderFooter?: () => string }>("../../chrome/footer.ts", { eager: true });
export function footerHTML(): string {
  const mod = Object.values(footerMods)[0];
  try {
    return mod?.renderFooter ? mod.renderFooter() : "<!-- footer -->";
  } catch {
    return "<!-- footer -->";
  }
}

export const arrowSVG = (dir: "up" | "down" | "left" | "right" | "ne") => {
  const rot = { up: 0, right: 90, down: 180, left: 270, ne: 45 }[dir];
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" style="transform:rotate(${rot}deg)"><path d="M12 20V4M5 11l7-7 7 7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square"/></svg>`;
};
