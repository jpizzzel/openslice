// Live "Slicing next" countdown to the next Saturday, 7pm local (Saturdays, 7pm til sellout).
const pad = (n: number) => String(n).padStart(2, "0");

/** doors open at this hour (local) on Saturdays */
export const OPEN_HOUR = 19;

function nextSaturday(now: Date) {
  const t = new Date(now);
  t.setHours(OPEN_HOUR, 0, 0, 0);
  t.setDate(t.getDate() + ((6 - now.getDay() + 7) % 7));
  if (t <= now) t.setDate(t.getDate() + 7);
  return t;
}

export function countdownText(now = new Date()): { label: string; value: string; open: boolean } {
  // open from 7pm until midnight; earlier on Saturday it counts down to 7pm today
  if (isOpen(now)) return { label: "Oven's hot", value: "Open til sellout", open: true };
  let s = Math.max(0, Math.floor((nextSaturday(now).getTime() - now.getTime()) / 1000));
  const d = Math.floor(s / 86400); s -= d * 86400;
  const h = Math.floor(s / 3600); s -= h * 3600;
  const m = Math.floor(s / 60); s -= m * 60;
  return { label: "Slicing next", value: `${d}d ${pad(h)}:${pad(m)}:${pad(s)}`, open: false };
}

/** Saturday mode: true all day Saturday, pizza day. */
export const isSaturday = (now = new Date()) => now.getDay() === 6;
/** The oven is on: Saturday from 7pm until midnight. */
export const isOpen = (now = new Date()) => isSaturday(now) && now.getHours() >= OPEN_HOUR;

export function countdownHTML(cls = "") {
  const c = countdownText();
  return `<div class="cd ${cls}" data-countdown><span class="cd-l">${c.label}</span><span class="cd-v" aria-live="off">${c.value}</span></div>`;
}

/** Keeps every [data-countdown] in the document ticking; pauses when hidden. */
export function startCountdowns() {
  let id = 0;
  const tick = () => {
    const c = countdownText();
    // pages and chrome key their Saturday touches off this class (all day Saturday)
    document.documentElement.classList.toggle("is-saturday", isSaturday());
    document.querySelectorAll<HTMLElement>("[data-countdown]").forEach((el) => {
      el.classList.toggle("is-open", c.open);
      const l = el.firstElementChild as HTMLElement, v = el.lastElementChild as HTMLElement;
      if (l.textContent !== c.label) l.textContent = c.label;
      v.textContent = c.value;
    });
  };
  const start = () => {
    clearTimeout(id); clearInterval(id);
    tick();
    // align to the second boundary so all digits roll together
    id = window.setTimeout(() => { tick(); id = window.setInterval(tick, 1000); }, 1000 - (Date.now() % 1000));
  };
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { clearTimeout(id); clearInterval(id); } else start();
  });
  start();
}
