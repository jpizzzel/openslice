// Kinetic Type: OPENSLICE in condensed caps. Each letter hangs on a
// spring, leans toward the pointer and squashes/stretches with its velocity.
import { clamp, type Experiment, type Sub } from "./kit";

const WORD = "OPENSLICE";

export const kinetic: Experiment = {
  id: "type",
  title: "Kinetic Type",
  line: "Letters on springs. Move close to tilt them, click to make them jump.",
  label: "Kinetic Type: the word OpenSlice in tall condensed letters that lean toward the pointer, squash and stretch on springs, and jump when clicked.",
  ar: [3, 2],
  create(host, env) {
    host.insertAdjacentHTML("beforeend", `
      <div class="ktype" role="img" aria-label="${kinetic.label}">
        <div class="ktype__row">${[...WORD].map((c) => `<span class="ktype__ch" data-ch="${c}" aria-hidden="true"><i>${c}</i></span>`).join("")}</div>
      </div>`);
    const root = host.querySelector(".ktype") as HTMLElement;
    const chars = [...root.querySelectorAll<HTMLElement>(".ktype__ch")];
    const L = chars.map(() => ({ cx: 0, cy: 0, x: 0, y: 0, vx: 0, vy: 0, s: 0, vs: 0 }));
    const p = { x: 0, y: 0, on: false, amt: 0 };
    let W = 1, H = 1, until = 0, running = false;

    const measure = () => {
      // layout size (clientWidth) ignores Flip transforms
      W = root.clientWidth || 1; H = root.clientHeight || 1;
      chars.forEach((el, i) => {
        // rest positions from layout, unaffected by our own transforms
        L[i].cx = el.offsetLeft + el.offsetWidth / 2;
        L[i].cy = el.offsetTop + el.offsetHeight * 0.55;
      });
    };
    const ro = new ResizeObserver(measure);
    ro.observe(root);

    const tick = (dt: number, t: number) => {
      if (env.reduced && performance.now() > until) { env.loop.remove(sub); running = false; }
      p.amt += ((p.on ? 1 : 0) - p.amt) * (1 - Math.exp(-dt * 5));
      const sig = W * 0.16;
      for (let i = 0; i < L.length; i++) {
        const l = L[i];
        let tx = 0, ty = 0, ts = 0;
        void t;
        if (p.amt > 0.001) {
          const dx = p.x - l.cx, dy = p.y - l.cy;
          const pull = Math.exp(-(dx * dx + dy * dy) / (2 * sig * sig)) * p.amt;
          tx += dx * pull * 0.18; ty += dy * pull * 0.22;
          ts += pull * 0.16;
        }
        // springs: 1d each axis, plus scale
        l.vx += ((tx - l.x) * 170 - l.vx * 13) * dt;
        l.vy += ((ty - l.y) * 170 - l.vy * 13) * dt;
        l.vs += ((ts - l.s) * 220 - l.vs * 12) * dt;
        l.x += l.vx * dt; l.y += l.vy * dt; l.s += l.vs * dt;
        // squash and stretch from velocity (volume preserving)
        const st = clamp(Math.abs(l.vy) * 0.0016 - Math.abs(l.vx) * 0.0008, -0.3, 0.45);
        const sy = (1 + l.s) * (1 + st), sx = (1 + l.s * 0.35) / (1 + st);
        const rot = clamp(l.vx * 0.02 + l.x * 0.04, -14, 14);
        chars[i].style.transform = `translate3d(${l.x.toFixed(2)}px,${l.y.toFixed(2)}px,0) rotate(${rot.toFixed(2)}deg) scale(${sx.toFixed(3)},${sy.toFixed(3)})`;
      }
    };
    const sub: Sub = { key: env.key, heavy: false, tick };
    const run = (ms = 1600) => {
      until = performance.now() + ms;
      if (running) return;
      running = true; env.loop.add(sub);
    };

    const local = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / (r.width || 1)) * W, y: ((e.clientY - r.top) / (r.height || 1)) * H };
    };
    const move = (e: PointerEvent) => {
      const q = local(e); p.x = q.x; p.y = q.y; p.on = true;
      if (env.reduced) run();
    };
    const leave = () => { p.on = false; if (env.reduced) run(); };
    const down = (e: PointerEvent, atX?: number) => {
      const q = atX === undefined ? local(e) : { x: atX, y: H / 2 };
      p.x = q.x; p.y = q.y;
      if (e.pointerType !== "mouse" && atX === undefined) p.on = true;
      // ripple jump from the click point
      L.forEach((l, i) => {
        const d = Math.abs(l.cx - q.x) / W;
        window.setTimeout(() => { l.vy -= H * 3.2; l.vs += 1.5; }, d * 380);
        void i;
      });
      env.poke(); env.sfx("pop"); run(2600);
    };
    root.addEventListener("pointermove", move);
    root.addEventListener("pointerleave", leave);
    const onDown = (e: PointerEvent) => down(e);
    root.addEventListener("pointerdown", onDown);

    return {
      act() {
        // the same ripple jump as a click, from the middle of the word
        down({ clientX: 0, clientY: 0, pointerType: "keyboard" } as PointerEvent, W / 2);
      },
      start() { measure(); if (!env.reduced) { running = true; env.loop.add(sub); } else tick(0, 0); },
      stop() { env.loop.remove(sub); running = false; },
      destroy() {
        env.loop.remove(sub); ro.disconnect();
        root.removeEventListener("pointermove", move);
        root.removeEventListener("pointerleave", leave);
        root.removeEventListener("pointerdown", onDown);
        root.remove();
      },
    };
  },
};
