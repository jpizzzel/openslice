// Exp. 05 Slice Clock: an analog clock made of twelve slices. Every hour that
// has passed since noon/midnight has been eaten. Click a slice to sneak a bite.
import { C, TAU, rng, type Experiment, type Sub } from "./kit";

const CX = 200, CY = 200, R = 150;
const pt = (a: number, r: number) => [CX + Math.sin(a) * r, CY - Math.cos(a) * r] as const;
const f = (n: number) => n.toFixed(2);

function slicePath(i: number, r = R) {
  const a0 = (i / 12) * TAU, a1 = ((i + 1) / 12) * TAU;
  const [x0, y0] = pt(a0, r), [x1, y1] = pt(a1, r);
  return `M${CX} ${CY} L${f(x0)} ${f(y0)} A${r} ${r} 0 0 1 ${f(x1)} ${f(y1)} Z`;
}
function crustPath(i: number) {
  const a0 = (i / 12) * TAU + 0.004, a1 = ((i + 1) / 12) * TAU - 0.004, r = R - 9;
  const [x0, y0] = pt(a0, r), [x1, y1] = pt(a1, r);
  return `M${f(x0)} ${f(y0)} A${r} ${r} 0 0 1 ${f(x1)} ${f(y1)}`;
}

export const clock: Experiment = {
  id: "clock",
  title: "Slice Clock",
  line: "Tells time by appetite. Each hour past twelve, a slice disappears.",
  label: "Slice Clock: an analog clock built from twelve pizza slices. Slices for the hours already passed are eaten. Click a slice to take a bite.",
  hint: "Click a slice",
  tone: "dough",
  ar: [1, 1],
  create(host, env) {
    const rnd = rng(5);
    const slices = Array.from({ length: 12 }, (_, i) => {
      const mid = ((i + 0.5) / 12) * TAU;
      const peps = [[0.62, 0.11], [0.36, 0.07]].map(([d, rr], k) => {
        const a = mid + (k ? 0.11 : -0.06) * (i % 2 ? 1 : -1);
        const [x, y] = pt(a, R * d);
        return `<circle cx="${f(x)}" cy="${f(y)}" r="${R * rr}" class="pep"/>`;
      }).join("");
      const [lx, ly] = pt(mid, 1);
      const crumbs = Array.from({ length: 5 }, () => {
        const [x, y] = pt(mid + (rnd() - 0.5) * 0.4, R * (0.3 + rnd() * 0.6));
        return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(1.5 + rnd() * 2.2)}"/>`;
      }).join("");
      return `
        <g class="clk-slot" data-i="${i}" style="--lx:${f(lx)};--ly:${f(ly)}">
          <g class="clk-ghost"><path d="${slicePath(i, R - 2)}"/><g class="clk-crumbs">${crumbs}</g></g>
          <g class="clk-slice">
            <path d="${slicePath(i)}" class="cheese"/>
            <path d="${slicePath(i)}" fill="url(#clk-dots)" mask="url(#clk-shade)"/>
            ${peps}
            <path d="${crustPath(i)}" class="crust"/>
            <path d="${slicePath(i)}" class="edge"/>
          </g>
        </g>`;
    }).join("");
    const ticks = Array.from({ length: 60 }, (_, i) => {
      const a = (i / 60) * TAU, big = i % 5 === 0;
      const [x0, y0] = pt(a, 182), [x1, y1] = pt(a, big ? 170 : 176);
      return `<line x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y1)}" class="${big ? "big" : ""}"/>`;
    }).join("");
    const nums = [12, 3, 6, 9].map((n, k) => {
      const [x, y] = pt((k / 4) * TAU, 194);
      return `<text x="${f(x)}" y="${f(y)}" dy="0.36em">${n}</text>`;
    }).join("");

    host.insertAdjacentHTML("beforeend", `
      <div class="clk">
        <svg viewBox="0 0 400 400" role="img" aria-label="${clock.label}">
          <defs>
            <pattern id="clk-dots" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <circle cx="3" cy="3" r="1.25" fill="${C.cheeseDeep}"/>
            </pattern>
            <linearGradient id="clk-g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0.35" stop-color="#000"/><stop offset="1" stop-color="#fff"/>
            </linearGradient>
            <mask id="clk-shade" maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="400">
              <rect x="40" y="40" width="320" height="320" fill="url(#clk-g)"/>
            </mask>
          </defs>
          <circle cx="${CX + 8}" cy="${CY + 10}" r="188" fill="url(#clk-dots)" opacity=".7" class="clk-shadow"/>
          <circle cx="${CX}" cy="${CY}" r="188" class="clk-plate"/>
          <circle cx="${CX}" cy="${CY}" r="${R + 6}" class="clk-plate-in"/>
          <g class="clk-ticks">${ticks}</g>
          <g class="clk-nums">${nums}</g>
          <g class="clk-pie">${slices}</g>
          <g class="clk-hand clk-h"><line x1="${CX}" y1="${CY + 14}" x2="${CX}" y2="${CY - 82}"/></g>
          <g class="clk-hand clk-m"><line x1="${CX}" y1="${CY + 18}" x2="${CX}" y2="${CY - 124}"/></g>
          <g class="clk-hand clk-s"><line x1="${CX}" y1="${CY + 24}" x2="${CX}" y2="${CY - 112}"/><circle cx="${CX}" cy="${CY - 124}" r="10" class="pep"/></g>
          <circle cx="${CX}" cy="${CY}" r="9" class="clk-cap"/>
        </svg>
        <p class="clk-read mono" aria-live="off"><span data-t>00:00</span><span data-e>0 eaten</span></p>
      </div>`);

    const root = host.querySelector(".clk") as HTMLElement;
    const svg = root.querySelector("svg")!;
    const hH = root.querySelector(".clk-h") as SVGGElement;
    const hM = root.querySelector(".clk-m") as SVGGElement;
    const hS = root.querySelector(".clk-s") as SVGGElement;
    const tEl = root.querySelector("[data-t]")!;
    const eEl = root.querySelector("[data-e]")!;
    const slots = [...root.querySelectorAll<SVGGElement>(".clk-slot")];
    const bitten = new Map<number, number>();
    let lastSec = -1, secTurns = 0, lastMin = -1, eaten = -1;

    const render = (force = false) => {
      const d = new Date();
      const s = d.getSeconds();
      if (s === lastSec && !force) return;
      // continuous seconds counter so the hand never spins backwards at :00
      if (lastSec >= 0 && s < lastSec) secTurns++;
      lastSec = s;
      const m = d.getMinutes(), h = d.getHours();
      hS.style.transform = `rotate(${(secTurns * 60 + s) * 6}deg)`;
      hM.style.transform = `rotate(${m * 6 + s * 0.1}deg)`;
      hH.style.transform = `rotate(${(h % 12) * 30 + m * 0.5}deg)`;
      const now = performance.now();
      for (const [i, until] of bitten) if (now > until) { bitten.delete(i); slots[i].classList.remove("is-bitten"); env.sfx("tick"); }
      if (m !== lastMin || force) {
        lastMin = m;
        const e = h % 12;
        if (e !== eaten) {
          eaten = e;
          slots.forEach((el, i) => el.classList.toggle("is-eaten", i < e));
        }
        const hh = String(h).padStart(2, "0"), mm = String(m).padStart(2, "0");
        tEl.textContent = `${hh}:${mm}`;
        eEl.textContent = e === 0 ? "fresh pie" : `${e} eaten / ${12 - e} left`;
        svg.setAttribute("aria-label", `Slice Clock showing ${hh}:${mm}. ${e} of 12 slices eaten. Click a remaining slice to take a bite.`);
      }
    };

    const sub: Sub = { key: env.key, heavy: false, tick: () => render() };
    let timer = 0;

    const click = (e: Event) => {
      const slot = (e.target as Element).closest?.(".clk-slot") as SVGGElement | null;
      if (!slot || slot.classList.contains("is-eaten")) return;
      const i = Number(slot.dataset.i);
      env.poke();
      if (bitten.has(i)) return;
      bitten.set(i, performance.now() + 3200);
      slot.classList.add("is-bitten");
      env.sfx("pop");
      if (env.reduced) window.setTimeout(() => render(true), 3300);
    };
    const over = (e: PointerEvent) => {
      const slot = (e.target as Element).closest?.(".clk-slot");
      if (slot && !slot.classList.contains("is-eaten") && e.pointerType === "mouse") env.sfx("tick", 120);
    };
    root.addEventListener("click", click);
    root.addEventListener("pointerover", over);
    render(true);

    return {
      start() {
        render(true);
        if (env.reduced) timer = window.setInterval(() => render(), 1000);
        else env.loop.add(sub);
      },
      stop() { env.loop.remove(sub); clearInterval(timer); },
      destroy() {
        env.loop.remove(sub); clearInterval(timer);
        root.removeEventListener("click", click);
        root.removeEventListener("pointerover", over);
        root.remove();
      },
    };
  },
};
