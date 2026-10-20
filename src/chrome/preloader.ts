// Preloader. Paper screen with a giant tomato wordmark and a percentage
// counter, then Jonah and Peter shove an ink wall across the screen left to
// right: paper ahead of the wall, ink under it, the live site behind them.
// API: runPreloader() -> { done(): Promise<void> }; markLoaderGone() fires the
// moment the wall clears the viewport.
import { gsap, reducedMotion } from "../core/motion";
import { markLoaderGone } from "../core/ready";
import { mascot } from "../art";

const MIN = 1200, MAX = 3000;

export function runPreloader() {
  const root = document.getElementById("loader");
  const t0 = performance.now();
  if (!root) {
    return { async done() { markLoaderGone(); } };
  }
  document.documentElement.classList.add("is-loading");
  let seen = false;
  try { seen = sessionStorage.getItem("os-seen") === "1"; sessionStorage.setItem("os-seen", "1"); } catch { /* ignore */ }
  const min = reducedMotion ? 0 : seen ? 700 : MIN;

  // progress: real signals set the floor, time smooths it
  let target = 8, shown = 0, raf = 0;
  const num = root.querySelector<HTMLElement>(".ld-num");
  const bar = root.querySelector<HTMLElement>(".ld-bar i");
  const bump = (v: number) => { target = Math.max(target, v); };
  document.fonts?.ready.then(() => bump(55));
  if (document.readyState === "complete") bump(80);
  else addEventListener("load", () => bump(80), { once: true });

  let routeReady = false;
  let finish!: () => void;
  const counted = new Promise<void>((r) => (finish = r));
  const step = () => {
    const el = performance.now() - t0;
    // time-eased creep capped by real milestones, so it never looks stuck or fake-fast
    const f = min ? Math.min(1, el / min) : 1;
    let goal = Math.min(94, Math.max(target * (0.5 + 0.5 * f), 70 * f));
    if (routeReady && el >= min) goal = 100;
    shown += (goal - shown) * (goal === 100 ? 0.22 : 0.08);
    if (goal === 100 && 100 - shown < 0.6) shown = 100;
    const v = Math.floor(shown);
    if (num) num.textContent = String(v).padStart(3, "0");
    if (bar) bar.style.transform = `scaleX(${shown / 100})`;
    if (shown >= 100) { finish(); return; }
    raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);

  // reveal the wordmark letters as soon as fonts are usable
  const letters = root.querySelectorAll(".ld-word span span");
  if (!reducedMotion) {
    gsap.set(letters, { yPercent: 105 });
    document.fonts?.ready.then(() => {
      gsap.to(letters, { yPercent: 0, duration: 1, ease: "expo.out", stagger: 0.035 });
    });
  }

  const crew = root.querySelector<HTMLElement>(".ld-crew");
  if (crew && !reducedMotion) {
    crew.innerHTML = `<div class="ld-m ld-m1">${mascot("jonah", "push")}</div><div class="ld-m ld-m2">${mascot("peter", "push")}</div>`;
  }

  const gone = () => {
    cancelAnimationFrame(raf);
    root.remove();
    document.documentElement.classList.remove("is-loading");
  };

  async function push() {
    const clip = root!.querySelector<HTMLElement>(".ld-clip")!;
    const paper = root!.querySelector<HTMLElement>(".ld-paper")!;
    const wall = root!.querySelector<HTMLElement>(".ld-wall")!;
    const ms = root!.querySelectorAll<HTMLElement>(".ld-m");
    const W = innerWidth;
    const wallW = wall.offsetWidth;
    const crewW = crew!.offsetWidth;
    // p = x of the wall's left edge (the pushing face)
    const s = { p: -wallW };
    const set = () => {
      const p = s.p;
      wall.style.transform = `translate3d(${p}px,0,0)`;
      crew!.style.transform = `translate3d(${p - crewW}px,0,0)`;
      const c = Math.max(0, p);
      clip.style.transform = `translate3d(${c}px,0,0)`;
      paper.style.transform = `translate3d(${-c}px,0,0)`;
    };
    set();
    root!.classList.add("is-pushing");
    let marked = false;
    const tl = gsap.timeline({
      onUpdate: () => {
        set();
        if (!marked && s.p >= W) { marked = true; markLoaderGone(); }
      },
    });
    // the wall slides in with the crew already shoving, they brace, then heave it across
    const brace = crewW * 0.95;
    tl.to(s, { p: brace, duration: 0.75, ease: "power3.out" })
      .to(s, { p: brace - 16, duration: 0.2, ease: "power2.out" })
      .to(s, { p: W + crewW + 40, duration: 1.15, ease: "power3.in" });
    // strain: little shoves and bobs while walking
    ms.forEach((m, i) => {
      gsap.fromTo(m, { y: 0, rotate: 0 }, { y: -10 - i * 4, rotate: i ? 2 : -2, duration: 0.18, ease: "sine.inOut", yoyo: true, repeat: 11, delay: 0.1 + i * 0.09 });
    });
    await tl;
    if (!marked) markLoaderGone();
    gone();
  }

  return {
    async done() {
      routeReady = true;
      await counted;
      if (reducedMotion) {
        await gsap.to(root, { autoAlpha: 0, duration: 0.3, ease: "power1.out" });
        markLoaderGone();
        gone();
        return;
      }
      await gsap.to(root.querySelectorAll(".ld-ui"), { autoAlpha: 0, duration: 0.25 });
      await push();
    },
  };
}
