// MARQUEE: two crossing tilted bands. Speed and direction follow scroll velocity.
import { gsap, ScrollTrigger } from "../../core/motion";
import type { Kit } from "./kit";

const FRONT = ["Free tools, served hot", "Open source", "No subscriptions"];
const BACK = ["Hot out of the kitchen", "Fork it", "Made at 2am", "Pay $0"];

function run(words: string[], copies: number) {
  const chunk = words.map((w) => `<span class="mq__w">${w}</span><span class="mq__s">✶</span>`).join("");
  return Array.from({ length: copies }, () => `<span class="mq__chunk">${chunk}</span>`).join("");
}

export function marqueeHTML() {
  return `
  <section class="h-mq" aria-label="Free tools, served hot. Open source. No subscriptions.">
    <div class="mq mq--back" aria-hidden="true"><div class="mq__track">${run(BACK, 4)}</div></div>
    <div class="mq mq--front" aria-hidden="true"><div class="mq__track">${run(FRONT, 4)}</div></div>
  </section>`;
}

export function initMarquee(kit: Kit) {
  const sec = kit.root.querySelector<HTMLElement>(".h-mq")!;
  if (kit.reduced) return;
  const bands = [...sec.querySelectorAll<HTMLElement>(".mq")].map((band, i) => {
    const track = band.querySelector<HTMLElement>(".mq__track")!;
    const chunk = track.querySelector<HTMLElement>(".mq__chunk")!;
    return { track, chunk, x: 0, base: i === 0 ? -38 : 60, w: 0 };
  });
  const measure = () => bands.forEach((b) => (b.w = b.chunk.offsetWidth));
  measure();
  const ro = new ResizeObserver(measure);
  ro.observe(sec);
  kit.onCleanup(() => ro.disconnect());

  let vel = 0;
  let dir = 1;
  let boost = 0;
  kit.add(() => {
    ScrollTrigger.create({
      trigger: sec,
      start: "top bottom",
      end: "bottom top",
      onUpdate: (s) => { vel = s.getVelocity(); dir = s.direction; },
    });
    gsap.fromTo(sec.querySelector(".mq--front"), { xPercent: 6 }, {
      xPercent: -6, ease: "none",
      scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: true },
    });
  });

  kit.loop(sec, (_t, dt) => {
    vel *= Math.pow(0.04, dt); // getVelocity only updates while scrolling; let it decay
    boost += (Math.min(Math.abs(vel) / 120, 14) - boost) * Math.min(1, dt * 6);
    for (const b of bands) {
      if (!b.w) continue;
      b.x += b.base * dir * (1 + boost) * dt;
      b.x = ((b.x % b.w) - b.w) % b.w; // keep in (-w, 0]
      const skew = Math.max(-8, Math.min(8, (vel / 300) * (b.base < 0 ? 1 : -1)));
      b.track.style.transform = `translate3d(${b.x.toFixed(1)}px,0,0) skewX(${skew.toFixed(2)}deg)`;
    }
  });
}
