// Exp. 01 Topping Rain: toppings fall with simple circle physics and pile
// onto a side view pizza. Click to drop a handful, drag to stir.
import { C, Stage, TAU, clamp, drag, leaf, pepperoni, dots, rng, type Experiment } from "./kit";

type Kind = 0 | 1 | 2 | 3; // pepperoni, basil, olive, mushroom
interface Body { x: number; y: number; vx: number; vy: number; r: number; a: number; va: number; k: Kind; s: number; fade: number }

const MAX = 120;

export const toppings: Experiment = {
  id: "toppings",
  title: "Topping Rain",
  line: "Pepperoni weather. Click to drop a handful, drag to stir the pile.",
  label: "Topping Rain: pepperoni, basil, olives and mushrooms fall and pile up on a pizza. Click to drop more, drag to stir.",
  hint: "Click to drop / drag to stir",
  tone: "paper",
  ar: [4, 5],
  heavy: true,
  create(host, env) {
    const bodies: Body[] = [];
    const R = rng(7);
    let sc = 1, floor = 0, x0 = 0, x1 = 0, spawn = 0, seeded = false;
    const ptr = { x: -999, y: -999, px: 0, py: 0, vx: 0, vy: 0, down: false, moved: 0, inside: false };
    const sprites: HTMLCanvasElement[] = [];

    const add = (x: number, y: number, vx = 0, vy = 0) => {
      const k = (R() < 0.42 ? 0 : R() < 0.5 ? 1 : R() < 0.55 ? 2 : 3) as Kind;
      const base = k === 0 ? 15 : k === 1 ? 14 : k === 2 ? 10 : 12;
      bodies.push({ x, y, vx, vy, r: base * sc * (0.85 + R() * 0.3), a: R() * TAU, va: (R() - 0.5) * 6, k, s: (R() * 4) | 0, fade: 1 });
      if (bodies.length > MAX) {
        // retire the oldest settled topping
        const old = bodies.find((b) => b.fade === 1);
        if (old) old.fade = 0.999;
      }
    };

    const buildSprites = (dpr: number) => {
      sprites.length = 0;
      const S = 40; // reference radius
      for (let k = 0; k < 4; k++) {
        for (let v = 0; v < 4; v++) {
          const c = document.createElement("canvas");
          const px = Math.ceil((S * 2 + 8) * dpr);
          c.width = c.height = px;
          const g = c.getContext("2d")!;
          g.scale(dpr, dpr);
          g.translate(S + 4, S + 4);
          const lw = 4.5;
          if (k === 0) pepperoni(g, 0, 0, S - 2, lw, v + 1);
          else if (k === 1) leaf(g, 0, 0, S - 1, v * 0.7, lw);
          else if (k === 2) {
            g.beginPath(); g.arc(0, 0, S * 0.66, 0, TAU);
            g.lineWidth = S * 0.5; g.strokeStyle = C.ink; g.stroke();
            g.beginPath(); g.arc(-S * 0.2, -S * 0.25, S * 0.12, 0, TAU); g.fillStyle = C.ink3; g.fill();
          } else {
            // mushroom slice
            g.rotate(v * 1.3);
            g.beginPath();
            g.moveTo(-S * 0.22, S * 0.75);
            g.lineTo(-S * 0.22, S * 0.05);
            g.bezierCurveTo(-S * 0.95, S * 0.1, -S * 0.95, -S * 0.85, 0, -S * 0.85);
            g.bezierCurveTo(S * 0.95, -S * 0.85, S * 0.95, S * 0.1, S * 0.22, S * 0.05);
            g.lineTo(S * 0.22, S * 0.75);
            g.closePath();
            g.fillStyle = C.paper; g.fill();
            g.save(); g.clip(); g.fillStyle = dots(g, C.ink3, 7, 1.6, dpr); g.fillRect(-S, -S * 0.2, S * 2, S); g.restore();
            g.lineWidth = lw; g.strokeStyle = C.ink; g.lineJoin = "round"; g.stroke();
          }
          sprites.push(c);
        }
      }
    };

    const stage = new Stage({
      host, env, heavy: true, label: toppings.label,
      resize(w, h, pw, ph) {
        sc = clamp(Math.min(w, h * 0.8) / 380, 0.6, 2.2);
        floor = h * 0.74; x0 = w * 0.1; x1 = w * 0.9;
        if (pw) {
          const kx = w / pw, ky = h / ph, kr = Math.min(kx, ky);
          for (const b of bodies) { b.x *= kx; b.y *= ky; b.r *= kr; }
        }
        buildSprites(stage ? stage.dpr : Math.min(2, devicePixelRatio || 1));
        if (!seeded) {
          seeded = true;
          // a starting pile so the first frame is already a composition
          for (let i = 0; i < 46; i++) add(x0 + 30 * sc + R() * (x1 - x0 - 60 * sc), floor - 20 - R() * h * 0.5);
          for (let i = 0; i < 160; i++) step(1 / 60);
        }
      },
      frame(dt, t) {
        if (dt > 0) {
          spawn -= dt;
          if (spawn <= 0 && !env.reduced) {
            spawn = bodies.length < 80 ? 0.22 : 0.8;
            add(x0 + R() * (x1 - x0), -30 * sc, (R() - 0.5) * 40);
          }
          const n = 2;
          for (let i = 0; i < n; i++) step(dt / n);
        }
        draw(t);
      },
    });

    function step(dt: number) {
      const g = 1500 * sc;
      const n = bodies.length;
      for (let i = 0; i < n; i++) {
        const b = bodies[i];
        b.vy += g * dt;
        b.vx *= 0.999; b.va *= 0.98;
        // stir
        if (ptr.down) {
          const dx = b.x - ptr.x, dy = b.y - ptr.y, rr = 70 * sc;
          const d2 = dx * dx + dy * dy;
          if (d2 < rr * rr) {
            const f = 1 - Math.sqrt(d2) / rr;
            b.vx += (ptr.vx * 0.9 - b.vx) * f * 0.35;
            b.vy += (ptr.vy * 0.9 - b.vy) * f * 0.35;
            b.va += ptr.vx * 0.002 * f;
          }
        }
        b.x += b.vx * dt; b.y += b.vy * dt; b.a += b.va * dt;
      }
      // pairwise
      for (let i = 0; i < n; i++) {
        const a = bodies[i];
        for (let j = i + 1; j < n; j++) {
          const b = bodies[j];
          const dx = b.x - a.x, dy = b.y - a.y, rr = a.r + b.r;
          if (dx > rr || dx < -rr || dy > rr || dy < -rr) continue;
          const d2 = dx * dx + dy * dy;
          if (d2 >= rr * rr || d2 < 1e-6) continue;
          const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, o = (rr - d) * 0.5;
          a.x -= nx * o; a.y -= ny * o; b.x += nx * o; b.y += ny * o;
          const rvx = b.vx - a.vx, rvy = b.vy - a.vy, vn = rvx * nx + rvy * ny;
          if (vn < 0) {
            const jn = -vn * 0.6;
            a.vx -= nx * jn; a.vy -= ny * jn; b.vx += nx * jn; b.vy += ny * jn;
            // friction along the tangent so piles hold their shape
            const tx = -ny, ty = nx, vt = rvx * tx + rvy * ty, jt = vt * 0.22;
            a.vx += tx * jt; a.vy += ty * jt; b.vx -= tx * jt; b.vy -= ty * jt;
            a.va += vt * 0.01; b.va -= vt * 0.01;
          }
        }
      }
      // pizza top, its rounded edges, and the walls of the tile
      const W = stage ? stage.w : 0, H = stage ? stage.h : 0;
      const cr = 16 * sc;
      for (const b of bodies) {
        if (b.x > x0 && b.x < x1 && b.y + b.r > floor && b.y < floor + 40 * sc) {
          b.y = floor - b.r;
          if (b.vy > 0) b.vy *= -0.12;
          b.vx *= 0.86; b.va = b.vx / b.r;
        } else {
          for (const cx of [x0, x1]) {
            const dx = b.x - cx, dy = b.y - (floor + cr), rr = b.r + cr;
            const d2 = dx * dx + dy * dy;
            if (d2 < rr * rr && d2 > 1e-6) {
              const d = Math.sqrt(d2), nx = dx / d, ny = dy / d;
              b.x = cx + nx * rr; b.y = floor + cr + ny * rr;
              const vn = b.vx * nx + b.vy * ny;
              if (vn < 0) { b.vx -= nx * vn * 1.1; b.vy -= ny * vn * 1.1; }
            }
          }
        }
        if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx) * 0.4; }
        if (b.x > W - b.r) { b.x = W - b.r; b.vx = -Math.abs(b.vx) * 0.4; }
        if (b.fade < 1) b.fade -= dt * 2.5;
      }
      for (let i = bodies.length - 1; i >= 0; i--) {
        const b = bodies[i];
        if (b.y > H + 80 || b.fade <= 0) bodies.splice(i, 1);
      }
    }

    function draw(t: number) {
      const g = stage.ctx, w = stage.w, h = stage.h, lw = Math.max(1.5, 2.6 * sc);
      g.clearRect(0, 0, w, h);
      // backdrop: halftone "table" shadow under the pie and a ruled line
      g.fillStyle = dots(g, C.ink, 6, 1.1, stage.dpr);
      g.globalAlpha = 0.22;
      g.beginPath(); g.ellipse(w / 2, floor + 62 * sc, (x1 - x0) * 0.55, 16 * sc, 0, 0, TAU); g.fill();
      g.globalAlpha = 1;

      // peel handle
      g.lineWidth = lw; g.strokeStyle = C.ink; g.lineCap = "round"; g.lineJoin = "round";
      g.fillStyle = C.crust;
      const py = floor + 34 * sc;
      g.beginPath(); g.roundRect(x1 - 10 * sc, py, w - x1 + 30 * sc, 10 * sc, 5 * sc); g.fill(); g.stroke();
      g.beginPath(); g.roundRect(x0 - 14 * sc, py - 4 * sc, x1 - x0 + 24 * sc, 8 * sc, 4 * sc); g.fill(); g.stroke();

      // pizza slab, side view: crust, sauce, cheese with drips
      const th = 30 * sc;
      g.beginPath(); g.roundRect(x0 - 4 * sc, floor, x1 - x0 + 8 * sc, th, [6 * sc, 6 * sc, 14 * sc, 14 * sc]);
      g.fillStyle = C.crust; g.fill();
      g.save(); g.clip();
      g.fillStyle = dots(g, C.cheeseDeep, 5, 1.3, stage.dpr); g.fillRect(x0, floor + th * 0.45, x1 - x0, th);
      g.restore();
      g.stroke();
      g.beginPath(); g.rect(x0, floor, x1 - x0, 7 * sc); g.fillStyle = C.tomato; g.fill();
      // cheese band with drips
      g.beginPath();
      g.moveTo(x0 - 2 * sc, floor - 2 * sc);
      g.lineTo(x1 + 2 * sc, floor - 2 * sc);
      g.lineTo(x1 + 2 * sc, floor + 6 * sc);
      const drips = 9;
      for (let i = drips; i >= 0; i--) {
        const x = x0 + ((x1 - x0) * i) / drips;
        const len = (i % 3 === 1 ? 18 : i % 2 ? 10 : 5) * sc * (1 + 0.15 * Math.sin(t * 1.3 + i));
        g.quadraticCurveTo(x + 9 * sc, floor + 6 * sc, x + 6 * sc, floor + 6 * sc + len * 0.6);
        g.quadraticCurveTo(x + 3 * sc, floor + 6 * sc + len, x, floor + 6 * sc + len * 0.6);
        g.quadraticCurveTo(x - 2 * sc, floor + 6 * sc, x - 6 * sc, floor + 6 * sc);
      }
      g.closePath();
      g.fillStyle = C.cheese; g.fill(); g.stroke();

      // toppings
      const S = 40;
      for (const b of bodies) {
        const sp = sprites[b.k * 4 + b.s];
        if (!sp) continue;
        const k = b.r / (S - 2);
        g.save();
        g.globalAlpha = clamp(b.fade, 0, 1);
        g.translate(b.x, b.y); g.rotate(b.a); g.scale(k, k);
        g.drawImage(sp, -S - 4, -S - 4, S * 2 + 8, S * 2 + 8);
        g.restore();
      }

      // stirring spoon ring
      if (ptr.inside) {
        g.beginPath(); g.arc(ptr.x, ptr.y, (ptr.down ? 22 : 14) * sc, 0, TAU);
        g.setLineDash([4 * sc, 5 * sc]); g.lineWidth = 1.5; g.strokeStyle = C.ink; g.stroke(); g.setLineDash([]);
      }
    }

    const off = drag(stage.canvas, {
      down(e) {
        const p = stage.pos(e);
        Object.assign(ptr, { x: p.x, y: p.y, px: p.x, py: p.y, vx: 0, vy: 0, down: true, moved: 0, inside: true });
        env.poke(); stage.kick();
      },
      move(e, active) {
        const p = stage.pos(e);
        const now = 1 / 60;
        ptr.vx = (p.x - ptr.x) / now; ptr.vy = (p.y - ptr.y) / now;
        ptr.moved += Math.abs(p.x - ptr.x) + Math.abs(p.y - ptr.y);
        ptr.x = p.x; ptr.y = p.y; ptr.inside = true;
        if (active) { stage.kick(); if (ptr.moved > 40) env.sfx("tick", 140); }
        else if (env.reduced) stage.kick(400);
      },
      up() {
        ptr.down = false;
        if (ptr.moved < 12) {
          for (let i = 0; i < 7; i++) add(ptr.x + (R() - 0.5) * 50 * sc, ptr.y - R() * 30 * sc, (R() - 0.5) * 220, -R() * 260);
          env.sfx("pop");
        }
        stage.kick(2500);
      },
    });
    const leave = () => { ptr.inside = false; ptr.down = false; stage.kick(300); };
    stage.canvas.addEventListener("pointerleave", leave);

    return {
      start: () => stage.start(),
      stop: () => stage.stop(),
      destroy() { off(); stage.canvas.removeEventListener("pointerleave", leave); stage.destroy(); },
    };
  },
};
