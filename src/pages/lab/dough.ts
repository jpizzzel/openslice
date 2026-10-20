// Exp. 03 Dough Stretch: a soft body blob of dough (ring of points with
// neighbour springs + shape matching). Grab it anywhere, stretch, let go.
import { C, Stage, TAU, clamp, closedCurve, drag, dots, rng, type Experiment } from "./kit";

const N = 36;

export const dough: Experiment = {
  id: "dough",
  title: "Dough Stretch",
  line: "A ball of dough with feelings. Grab it, stretch it, it always springs back.",
  label: "Dough Stretch: a soft blob of pizza dough with a little face. Grab and drag to stretch it; it springs back when released.",
  hint: "Grab and pull",
  tone: "tomato",
  ar: [5, 4],
  create(host, env) {
    const px = new Float32Array(N), py = new Float32Array(N);
    const vx = new Float32Array(N), vy = new Float32Array(N);
    const rx = new Float32Array(N), ry = new Float32Array(N); // rest offsets
    const wt = new Float32Array(N); // grab weights
    const ox = new Float32Array(N), oy = new Float32Array(N); // grab offsets
    const hx = new Float32Array(N), hy = new Float32Array(N); // highlight copy
    let R = 1, homeX = 0, homeY = 0, rest1 = 0, rest2 = 0, sc = 1, seeded = false;
    let grab = -1, gx = 0, gy = 0, stretch = 0, maxStretch = 0, nextPoke = 2, blink = 0;
    const flour = (() => { const r = rng(11); return Array.from({ length: 26 }, () => [r() * TAU, Math.sqrt(r()) * 0.8, 0.8 + r() * 1.6]); })();

    const shape = () => {
      for (let i = 0; i < N; i++) {
        const a = (i / N) * TAU;
        const wob = 1 + 0.035 * Math.sin(a * 3 + 0.6) + 0.02 * Math.cos(a * 5);
        rx[i] = Math.cos(a) * R * 1.12 * wob;
        ry[i] = Math.sin(a) * R * 0.92 * wob;
      }
      rest1 = Math.hypot(rx[1] - rx[0], ry[1] - ry[0]);
      rest2 = Math.hypot(rx[2] - rx[0], ry[2] - ry[0]);
    };

    const stage = new Stage({
      host, env, label: dough.label,
      resize(w, h, pw, ph) {
        const oldHX = homeX, oldHY = homeY, k = pw ? Math.min(w / pw, h / ph) : 1;
        R = Math.min(w * 0.3, h * 0.33); sc = R / 120;
        homeX = w / 2; homeY = h * 0.5;
        shape();
        if (!seeded) {
          seeded = true;
          for (let i = 0; i < N; i++) { px[i] = homeX + rx[i]; py[i] = homeY + ry[i]; }
        } else {
          for (let i = 0; i < N; i++) { px[i] = homeX + (px[i] - oldHX) * k; py[i] = homeY + (py[i] - oldHY) * k; }
        }
      },
      frame(dt, t) {
        if (dt > 0) {
          const n = 4;
          for (let s = 0; s < n; s++) step(dt / n, t);
          if (!env.reduced && grab < 0) {
            nextPoke -= dt;
            if (nextPoke <= 0) {
              // idle wobble: a little poke from a random side
              nextPoke = 2.6 + Math.random() * 2.5;
              const i = (Math.random() * N) | 0;
              vx[i] += rx[i] * 3; vy[i] += ry[i] * 3;
            }
          }
          blink = Math.max(0, blink - dt);
          if (blink === 0 && Math.random() < dt * 0.25) blink = 0.14;
        }
        draw(t);
      },
    });

    const cen = [0, 0];
    /** centroid into a reused tuple (read it right away) */
    function centroid() {
      let x = 0, y = 0;
      for (let i = 0; i < N; i++) { x += px[i]; y += py[i]; }
      cen[0] = x / N; cen[1] = y / N;
      return cen;
    }

    function step(dt: number, t: number) {
      const [cx, cy] = centroid();
      const breathe = env.reduced ? 1 : 1 + 0.018 * Math.sin(t * 2.1);
      const kShape = 34, kAnchor = 46, kHome = 14, k1 = 240, k2 = 90, kGrab = 1100;
      for (let i = 0; i < N; i++) {
        // shape matching around the centroid plus an absolute anchor to the
        // rest pose, so a pulled region stretches out like taffy
        let fx = (cx + rx[i] * breathe - px[i]) * kShape + (homeX + rx[i] * breathe - px[i]) * kAnchor * (1 - wt[i] * (grab >= 0 ? 1 : 0)) + (homeX - cx) * kHome;
        let fy = (cy + ry[i] * breathe - py[i]) * kShape + (homeY + ry[i] * breathe - py[i]) * kAnchor * (1 - wt[i] * (grab >= 0 ? 1 : 0)) + (homeY - cy) * kHome;
        for (let n = 0; n < 4; n++) {
          // neighbours: +1, -1 (rest1/k1) and +2, -2 (rest2/k2), no per-frame arrays
          const off = n < 2 ? 1 : 2, j = (i + (n & 1 ? N - off : off)) % N;
          const L = n < 2 ? rest1 : rest2, k = n < 2 ? k1 : k2;
          const dx = px[j] - px[i], dy = py[j] - py[i];
          const d = Math.hypot(dx, dy) || 1e-3;
          const f = (d - L) * k;
          fx += (dx / d) * f; fy += (dy / d) * f;
        }
        if (grab >= 0 && wt[i] > 0.01) {
          fx += (gx + ox[i] - px[i]) * kGrab * wt[i];
          fy += (gy + oy[i] - py[i]) * kGrab * wt[i];
        }
        vx[i] += fx * dt; vy[i] += fy * dt;
        const damp = Math.exp(-dt * (grab >= 0 ? 9 : 5.5));
        vx[i] *= damp; vy[i] *= damp;
      }
      let m = 0;
      for (let i = 0; i < N; i++) {
        px[i] += vx[i] * dt; py[i] += vy[i] * dt;
        m = Math.max(m, Math.hypot(px[i] - cx, py[i] - cy) / R);
      }
      stretch += (clamp((m - 1.15) / 1.2, 0, 1) - stretch) * Math.min(1, dt * 12);
      maxStretch = Math.max(maxStretch, stretch);
    }

    function draw(t: number) {
      const g = stage.ctx, w = stage.w, h = stage.h, lw = Math.max(2, 3.4 * sc);
      g.clearRect(0, 0, w, h);
      const [cx, cy] = centroid();

      // halftone floor shadow
      g.fillStyle = dots(g, C.ink, 6, 1.4, stage.dpr);
      g.globalAlpha = 0.35;
      g.beginPath(); g.ellipse(homeX + (cx - homeX) * 0.3, homeY + R * 1.15, R * (1.25 + stretch * 0.4), R * 0.16, 0, 0, TAU); g.fill();
      g.globalAlpha = 1;

      // body
      closedCurve(g, px, py, N);
      g.fillStyle = C.dough; g.fill();
      g.save(); g.clip();
      // shaded crescent: fill with dots, then knock out a highlight copy
      g.fillStyle = dots(g, C.cheeseDeep, 5, 1.35, stage.dpr);
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < N; i++) { hx[i] = cx + (px[i] - cx) * 0.94 - R * 0.16; hy[i] = cy + (py[i] - cy) * 0.94 - R * 0.2; }
      closedCurve(g, hx, hy, N);
      g.fillStyle = C.dough; g.fill();
      // flour dust
      g.fillStyle = "#fffaf0";
      for (const [a, r, s] of flour) { g.beginPath(); g.arc(cx + Math.cos(a) * r * R - R * 0.15, cy + Math.sin(a) * r * R * 0.8 - R * 0.2, s * sc, 0, TAU); g.fill(); }
      g.restore();
      closedCurve(g, px, py, N);
      g.lineWidth = lw; g.strokeStyle = C.ink; g.lineJoin = "round"; g.stroke();

      // face, leaning toward the pull
      let fx = cx, fy = cy - R * 0.05;
      if (grab >= 0) { fx += (gx - cx) * 0.12; fy += (gy - cy) * 0.12; }
      const s = stretch, eye = R * 0.075;
      g.fillStyle = C.ink; g.strokeStyle = C.ink; g.lineCap = "round"; g.lineWidth = lw;
      for (const side of [-1, 1]) {
        const ex = fx + side * R * 0.3, ey = fy - R * 0.08;
        if (s > 0.55) {
          // squeezed > < eyes
          g.beginPath(); g.moveTo(ex - side * eye, ey - eye); g.lineTo(ex + side * eye * 0.6, ey); g.lineTo(ex - side * eye, ey + eye); g.stroke();
        } else if (blink > 0) {
          g.beginPath(); g.moveTo(ex - eye, ey); g.lineTo(ex + eye, ey); g.stroke();
        } else {
          g.beginPath(); g.ellipse(ex, ey, eye * 0.85, eye * (1.15 + s * 0.6), 0, 0, TAU); g.fill();
        }
      }
      // cheeks
      g.fillStyle = C.tomatoLight; g.globalAlpha = 0.55;
      for (const side of [-1, 1]) { g.beginPath(); g.ellipse(fx + side * R * 0.48, fy + R * 0.12, R * 0.1, R * 0.06, 0, 0, TAU); g.fill(); }
      g.globalAlpha = 1;
      // mouth: smile at rest, an "o" when stretched
      const my = fy + R * 0.16;
      if (s < 0.12) {
        g.beginPath(); g.arc(fx, my - R * 0.06, R * 0.14, 0.25 * Math.PI, 0.75 * Math.PI); g.stroke();
      } else {
        g.beginPath(); g.ellipse(fx, my, R * (0.06 + s * 0.05), R * (0.05 + s * 0.14), 0, 0, TAU);
        g.fillStyle = C.ink; g.fill();
      }
      // a sweat drop when really stretched
      if (s > 0.6) {
        const sx = fx + R * 0.62, sy = fy - R * 0.38 + Math.sin(t * 8) * 2;
        g.beginPath(); g.moveTo(sx, sy - R * 0.12); g.quadraticCurveTo(sx + R * 0.08, sy, sx, sy + R * 0.04); g.quadraticCurveTo(sx - R * 0.08, sy, sx, sy - R * 0.12);
        g.fillStyle = C.paper; g.fill(); g.lineWidth = lw * 0.6; g.stroke();
      }
    }

    const off = drag(stage.canvas, {
      down(e) {
        const p = stage.pos(e);
        const [cx, cy] = centroid();
        // nearest ring point; accept grabs inside or near the blob
        let best = 0, bd = Infinity;
        for (let i = 0; i < N; i++) { const d = Math.hypot(px[i] - p.x, py[i] - p.y); if (d < bd) { bd = d; best = i; } }
        const inside = Math.hypot(p.x - cx, p.y - cy) < R * 1.1;
        if (!inside && bd > 60 * sc) return false;
        grab = best; gx = p.x; gy = p.y; maxStretch = 0;
        for (let i = 0; i < N; i++) {
          let d = Math.abs(i - best); d = Math.min(d, N - d);
          wt[i] = Math.exp(-(d * d) / 10);
          ox[i] = (px[i] - p.x) * 0.4; oy[i] = (py[i] - p.y) * 0.4;
        }
        env.poke(); env.sfx("click"); stage.kick();
      },
      move(e, active) {
        if (!active || grab < 0) return;
        const p = stage.pos(e);
        gx = p.x; gy = p.y;
        stage.kick();
      },
      up() {
        if (grab >= 0 && maxStretch > 0.3) env.sfx("pop");
        grab = -1;
        stage.kick(3000);
      },
    });

    return {
      start: () => stage.start(),
      stop: () => stage.stop(),
      destroy() { off(); stage.destroy(); },
    };
  },
};
