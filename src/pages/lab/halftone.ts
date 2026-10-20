// Exp. 04 Halftone Mirror: a giant slice drawn as a field of halftone dots.
// Dots swell and push away around the pointer like a lens. No camera.
import { C, Stage, TAU, clamp, drag, type Experiment } from "./kit";

// palette index per cell
const COLS = [C.ink2, C.paper, C.cheese, C.tomato, C.basilLight, C.crust];

export const halftone: Experiment = {
  id: "halftone",
  title: "Halftone Mirror",
  line: "A slice printed in dots. Move over it and the dots get out of your way.",
  label: "Halftone Mirror: a large pizza slice made of halftone dots that swell and part around the pointer like a magnifying lens.",
  hint: "Hover or drag",
  tone: "ink",
  ar: [4, 5],
  heavy: true,
  create(host, env) {
    let xs = new Float32Array(0), ys = new Float32Array(0), vs = new Float32Array(0);
    let cs = new Uint8Array(0), n = 0, step = 10, sig = 100;
    const p = { x: 0, y: 0, tx: 0, ty: 0, on: false, amp: 0, tamp: 0, idle: 0 };
    let t0 = 0;

    // slice described in a unit box (0..1). tip at bottom, crust arc on top.
    const tip = [0.5, 0.95];
    const A = [0.1, 0.17], B = [0.9, 0.17];
    const pep = [[0.38, 0.33, 0.085], [0.62, 0.3, 0.075], [0.5, 0.52, 0.08], [0.43, 0.72, 0.055], [0.71, 0.45, 0.045]];
    const basil = [[0.56, 0.62, 0.055]];
    const side = (ax: number, ay: number, bx: number, by: number, x: number, y: number) => (bx - ax) * (y - ay) - (by - ay) * (x - ax);
    function sample(u: number, v: number): [number, number] {
      // returns [value 0..1, colour index]
      // crust: an arc that bulges above the AB line
      const arcCx = 0.5, arcCy = 0.62, arcR = Math.hypot(A[0] - arcCx, A[1] - arcCy);
      const dArc = Math.hypot(u - arcCx, v - arcCy);
      const inCone = side(A[0], A[1], tip[0], tip[1], u, v) <= 0 && side(tip[0], tip[1], B[0], B[1], u, v) <= 0;
      if (inCone && dArc < arcR + 0.02 && dArc > arcR - 0.075) {
        const edge = dArc > arcR - 0.01 || dArc < arcR - 0.065;
        return edge ? [0.95, 1] : [0.62 + 0.25 * (u - 0.1), 5];
      }
      if (!inCone || dArc > arcR) return [0.1, 0];
      // outline near the cone edges
      const eA = Math.abs(side(A[0], A[1], tip[0], tip[1], u, v)) / Math.hypot(tip[0] - A[0], tip[1] - A[1]);
      const eB = Math.abs(side(tip[0], tip[1], B[0], B[1], u, v)) / Math.hypot(tip[0] - B[0], tip[1] - B[1]);
      if (Math.min(eA, eB) < 0.012) return [0.95, 1];
      for (const [x, y, r] of pep) {
        const d = Math.hypot(u - x, v - y);
        if (d < r) return [d > r - 0.012 ? 0.95 : 0.7 + 0.25 * (1 - d / r), d > r - 0.012 ? 1 : 3];
      }
      for (const [x, y, r] of basil) {
        const d = Math.hypot((u - x) * 0.7, v - y);
        if (d < r) return [0.85, 4];
      }
      // cheese body, shaded darker toward the right and the tip
      const shade = 0.45 + 0.35 * u + 0.15 * Math.sin(u * 23 + v * 17) * 0.5;
      return [clamp(shade, 0.3, 0.9), 2];
    }

    const stage = new Stage({
      host, env, heavy: true, label: halftone.label,
      resize(w, h) {
        step = clamp(Math.min(w, h) / 46, 7, 15);
        sig = Math.min(w, h) * 0.17;
        const cols = Math.ceil(w / step) + 2, rows = Math.ceil(h / (step * 0.866)) + 2;
        const max = cols * rows;
        xs = new Float32Array(max); ys = new Float32Array(max); vs = new Float32Array(max); cs = new Uint8Array(max);
        // the slice box, kept upright and centred, slightly tilted
        const bw = Math.min(w * 0.86, h * 0.8), bx = (w - bw) / 2, by = (h - bw * 1.08) / 2 + bw * 0.02;
        const tilt = -0.12, co = Math.cos(tilt), si = Math.sin(tilt);
        n = 0;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const x = (c - 0.5 + (r % 2 ? 0.5 : 0)) * step, y = (r - 0.5) * step * 0.866;
            // inverse rotate around centre into slice space
            const dx = x - w / 2, dy = y - h / 2;
            const lx = dx * co + dy * si + w / 2, ly = -dx * si + dy * co + h / 2;
            const u = (lx - bx) / bw, v = (ly - by) / (bw * 1.08);
            const [val, col] = sample(u, v);
            xs[n] = x; ys[n] = y; vs[n] = val; cs[n] = col; n++;
          }
        }
        if (!p.tx) { p.x = p.tx = w * 0.62; p.y = p.ty = h * 0.4; }
      },
      frame(dt, t) {
        if (!t0) t0 = t;
        const w = stage.w, h = stage.h;
        if (dt > 0) {
          if (!p.on) {
            p.idle += dt;
            // idle orbit, a lazy lissajous
            const k = t * 0.45;
            p.tx = w * (0.5 + 0.3 * Math.sin(k * 1.3));
            p.ty = h * (0.46 + 0.28 * Math.sin(k * 0.9 + 1));
            p.tamp = 0.75;
          } else p.tamp = 1;
          const e = 1 - Math.exp(-dt * (p.on ? 10 : 2.5));
          p.x += (p.tx - p.x) * e; p.y += (p.ty - p.y) * e;
          p.amp += (p.tamp - p.amp) * (1 - Math.exp(-dt * 4));
        } else if (!p.amp) p.amp = env.reduced && !p.on ? 0.6 : p.amp;
        draw(t - t0);
      },
    });

    function draw(t: number) {
      const g = stage.ctx, w = stage.w, h = stage.h;
      g.clearRect(0, 0, w, h);
      const half = step * 0.5, s2 = 1 / (2 * sig * sig), amp = p.amp, wave = env.reduced ? 0 : 1;
      for (let col = 0; col < COLS.length; col++) {
        g.beginPath();
        for (let i = 0; i < n; i++) {
          if (cs[i] !== col) continue;
          let x = xs[i], y = ys[i];
          const dx = x - p.x, dy = y - p.y, d2 = dx * dx + dy * dy;
          const lens = Math.exp(-d2 * s2) * amp;
          const v = vs[i];
          let r: number;
          if (col === 0) r = half * (0.14 + lens * 0.55);
          else r = half * clamp(v * (0.78 + 0.12 * wave * Math.sin(t * 1.6 + x * 0.018 + y * 0.012)) * (1 + lens * 0.7), 0.05, 1.18);
          if (lens > 0.02) { const d = Math.sqrt(d2) || 1; x += (dx / d) * lens * step * 1.4; y += (dy / d) * lens * step * 1.4; }
          g.moveTo(x + r, y); g.arc(x, y, r, 0, TAU);
        }
        g.fillStyle = COLS[col];
        g.fill();
      }
      // registration marks, printer style
      g.strokeStyle = C.ink3; g.lineWidth = 1;
      const m = 14, L = 10;
      for (let k = 0; k < 4; k++) {
        const x = k & 1 ? w - m : m, y = k & 2 ? h - m : m;
        g.beginPath(); g.moveTo(x - L, y); g.lineTo(x + L, y); g.moveTo(x, y - L); g.lineTo(x, y + L); g.stroke();
        g.beginPath(); g.arc(x, y, L * 0.5, 0, TAU); g.stroke();
      }
    }

    const off = drag(stage.canvas, {
      down(e) { const q = stage.pos(e); p.tx = q.x; p.ty = q.y; p.on = true; env.poke(); env.sfx("click"); stage.kick(); },
      move(e) {
        const q = stage.pos(e);
        p.tx = q.x; p.ty = q.y; p.on = true;
        if (env.reduced) { p.x = q.x; p.y = q.y; p.amp = 1; stage.kick(200); }
      },
      up(e) { if (e.pointerType !== "mouse") p.on = false; stage.kick(800); },
    });
    const leave = () => { p.on = false; stage.kick(1200); };
    stage.canvas.addEventListener("pointerleave", leave);

    return {
      act() {
        // hop the lens to a new spot on the slice
        p.on = true; p.tx = stage.w * (0.25 + Math.random() * 0.5); p.ty = stage.h * (0.25 + Math.random() * 0.5);
        if (env.reduced) { p.x = p.tx; p.y = p.ty; p.amp = 1; }
        env.poke(); env.sfx("click"); stage.kick(1500);
        window.setTimeout(() => { p.on = false; stage.kick(1200); }, 1400);
      },
      start: () => stage.start(),
      stop: () => stage.stop(),
      destroy() { off(); stage.canvas.removeEventListener("pointerleave", leave); stage.destroy(); },
    };
  },
};
