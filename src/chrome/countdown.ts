// Live "Slicing next" countdown to the next Saturday, 5pm local.
const pad = (n: number) => String(n).padStart(2, "0");

function nextSaturday(now: Date) {
  const t = new Date(now);
  t.setHours(17, 0, 0, 0);
  t.setDate(t.getDate() + ((6 - now.getDay() + 7) % 7));
  if (t <= now) t.setDate(t.getDate() + 7);
  return t;
}

export function countdownText(now = new Date()): { label: string; value: string; open: boolean } {
  if (now.getDay() === 6) return { label: "Oven's hot", value: "Open today", open: true };
  let s = Math.max(0, Math.floor((nextSaturday(now).getTime() - now.getTime()) / 1000));
  const d = Math.floor(s / 86400); s -= d * 86400;
  const h = Math.floor(s / 3600); s -= h * 3600;
  const m = Math.floor(s / 60); s -= m * 60;
  return { label: "Slicing next", value: `${d}d ${pad(h)}:${pad(m)}:${pad(s)}`, open: false };
}

export function countdownHTML(cls = "") {
  const c = countdownText();
  return `<div class="cd ${cls}" data-countdown><span class="cd-l">${c.label}</span><span class="cd-v" aria-live="off">${c.value}</span></div>`;
}

/** Keeps every [data-countdown] in the document ticking; pauses when hidden. */
export function startCountdowns() {
  let id = 0;
  const tick = () => {
    const c = countdownText();
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
