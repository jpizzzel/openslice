// Exp. 08 Cheese Pull: drag the slice away from the pie and verlet cheese
// strands stretch between them, thin out, and snap one by one.
import { C, Stage, TAU, clamp, drag, dots, pepperoni, rng, type Experiment } from "./kit";

const SEG = 14;
interface Strand {
  e: 0 | 1;    // which wedge edge
  f: number;   // fraction along the edge (0 tip .. 1 crust)
  xs: Float32Array; ys: Float32Array; ox: Float32Array; oy: Float32Array;
  snap: number; // snap distance in R units
  cut: number;  // -1 intact, else index where it broke
  life: number; // 1 while intact, fades after snapping
  w: number;
}

export const cheese: Experiment = {
  id: "cheese",
  title: "Cheese Pull",
  line: "The best part of any slice. Pull it away and see how far the cheese goes.",
  label: "Cheese Pull: drag a pizza slice away from the pie. Strings of melted cheese stretch between them and snap one by one if you pull too far.",
  hint: "Drag the slice",
  tone: "tomato",
  ar: [1, 1],
  create(host, env) {
    const rnd = rng(21);
    let cx = 0, cy = 0, R = 1, sc = 1;
    const bis = 0.32, half = 0.36; // wedge bisector angle and half width (radians)
    const off = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0 };
    let held = false, grabDX = 0, grabDY = 0, idleT = 0, touched = false, everSnapped = false;
    const strands: Strand[] = [];
    const peps = (() => { const r = rng(4); const out: number[][] = []; for (let i = 0; i < 9; i++) out.push([r() * TAU, 0.3 + r() * 0.5, 0.11 + r() * 0.04]); return out; })();

    const mk = (e: 0 | 1, f: number): Strand => ({
      e, f, xs: new Float32Array(SEG), ys: new Float32Array(SEG), ox: new Float32Array(SEG), oy: new Float32Array(SEG),
      snap: 1.1 + rnd() * 1.1, cut: -1, life: 1, w: 3 + rnd() * 4,
    });
    const reseed = () => {
      strands.length = 0;
      for (const e of [0, 1] as const) for (const f of [0.18, 0.42, 0.66, 0.88]) strands.push(mk(e, f));
      strands.push(mk(0, 0.05));
      for (const s of strands) lay(s);
    };
    const edgeA = (e: 0 | 1) => bis + (e ? half : -half);
    // reused anchor points (pie side / slice side): no per-frame allocation
    const pa = { x: 0, y: 0 }, pb = { x: 0, y: 0 };
    const anchor = (s: Strand, slice: boolean) => {
      const a = edgeA(s.e), r = R * s.f * 0.92;
      // cheese clings a bit inside each surface
      const n = (s.e ? -1 : 1) * 0.04;
      const o = slice ? pb : pa;
      o.x = cx + Math.cos(a + n) * r + (slice ? off.x : 0);
      o.y = cy + Math.sin(a + n) * r + (slice ? off.y : 0);
      return o;
    };
    function lay(s: Strand) {
      const a = anchor(s, false), b = anchor(s, true);
      for (let i = 0; i < SEG; i++) {
        const q = i / (SEG - 1);
        s.xs[i] = s.ox[i] = a.x + (b.x - a.x) * q;
        s.ys[i] = s.oy[i] = a.y + (b.y - a.y) * q;
      }
      s.cut = -1; s.life = 1; s.snap = 1.1 + rnd() * 1.1;
    }

    const stage = new Stage({
      host, env, label: cheese.label,
      resize(w, h, pw) {
        const k = pw ? w / pw : 1;
        R = Math.min(w, h) * 0.3; sc = R / 120;
        cx = w * 0.42; cy = h * 0.47;
        off.x *= k; off.y *= k; off.tx *= k; off.ty *= k;
        reseed();
        if (env.reduced && !touched) {
          // static frame: slice pulled out mid stretch
          off.x = Math.cos(bis) * R * 0.75; off.y = Math.sin(bis) * R * 0.75 + R * 0.1;
          for (let i = 0; i < 90; i++) ropes(1 / 60);
        }
      },
      frame(dt, t) {
        if (dt > 0) update(dt, t);
        draw();
      },
    });

    function ropes(dt: number) {
      const g = 900 * sc;
      for (const s of strands) {
        const a = anchor(s, false), b = anchor(s, true);
        const D = Math.hypot(b.x - a.x, b.y - a.y);
        if (s.cut < 0 && D > s.snap * R) {
          s.cut = Math.floor(SEG / 2 + (rnd() - 0.5) * 4);
          env.sfx("pop", 50); everSnapped = true;
        }
        if (s.cut >= 0) s.life -= dt * 0.9;
        const restSeg = s.cut < 0 ? (D * 1.06 + 6 * sc) / (SEG - 1) : Math.max(0.5, (R * 0.5 * s.life) / (SEG - 1));
        // verlet
        for (let i = 0; i < SEG; i++) {
          const x = s.xs[i], y = s.ys[i];
          s.xs[i] += (x - s.ox[i]) * 0.97;
          s.ys[i] += (y - s.oy[i]) * 0.97 + g * dt * dt;
          s.ox[i] = x; s.oy[i] = y;
        }
        for (let it = 0; it < 8; it++) {
          s.xs[0] = a.x; s.ys[0] = a.y;
          s.xs[SEG - 1] = b.x; s.ys[SEG - 1] = b.y;
          for (let i = 0; i < SEG - 1; i++) {
            if (i === s.cut) continue;
            const dx = s.xs[i + 1] - s.xs[i], dy = s.ys[i + 1] - s.ys[i];
            const d = Math.hypot(dx, dy) || 1e-4;
            const diff = (d - restSeg) / d * 0.5;
            const pinA = i === 0, pinB = i + 1 === SEG - 1;
            const ka = pinA ? 0 : pinB ? 1 : 0.5, kb = pinB ? 0 : pinA ? 1 : 0.5;
            s.xs[i] += dx * diff * 2 * ka; s.ys[i] += dy * diff * 2 * ka;
            s.xs[i + 1] -= dx * diff * 2 * kb; s.ys[i + 1] -= dy * diff * 2 * kb;
          }
        }
      }
    }

    function update(dt: number, t: number) {
      if (!held) {
        if (!touched && !env.reduced) {
          // idle: a slow tease pull that never snaps
          idleT += dt;
          const q = 0.5 - 0.5 * Math.cos(idleT * 1.1);
          off.tx = Math.cos(bis) * R * 0.55 * q; off.ty = Math.sin(bis) * R * 0.55 * q - R * 0.12 * q;
        } else { off.tx = 0; off.ty = 0; }
        // spring home
        off.vx += ((off.tx - off.x) * 60 - off.vx * 9) * dt;
        off.vy += ((off.ty - off.y) * 60 - off.vy * 9) * dt;
        off.x += off.vx * dt; off.y += off.vy * dt;
      } else {
        const k = 1 - Math.exp(-dt * 18);
        const nx = off.x + (off.tx - off.x) * k, ny = off.y + (off.ty - off.y) * k;
        off.vx = (nx - off.x) / dt; off.vy = (ny - off.y) / dt;
        off.x = nx; off.y = ny;
      }
      const sub = 2;
      for (let i = 0; i < sub; i++) ropes(dt / sub);
      // fresh strands when the slice is back home
      if (Math.hypot(off.x, off.y) < 4 * sc) {
        let any = false;
        for (const s of strands) if (s.cut >= 0 && s.life < 0.6) { lay(s); any = true; }
        if (any && everSnapped) { env.sfx("tick"); everSnapped = false; }
      }
      void t;
    }

    function wedge(g: CanvasRenderingContext2D, ox: number, oy: number) {
      g.beginPath();
      g.moveTo(cx + ox, cy + oy);
      g.arc(cx + ox, cy + oy, R, bis - half, bis + half);
      g.closePath();
    }
    function pie(g: CanvasRenderingContext2D) {
      g.beginPath();
      g.moveTo(cx, cy);
      g.arc(cx, cy, R, bis + half, bis - half + TAU);
      g.closePath();
    }
    function toppings(g: CanvasRenderingContext2D, ox: number, oy: number, inSlice: boolean, lw: number) {
      for (const [a, d, r] of peps) {
        let da = ((a - bis) % TAU + TAU) % TAU; if (da > Math.PI) da -= TAU;
        const inside = Math.abs(da) < half - 0.12;
        if (inside !== inSlice) continue;
        pepperoni(g, cx + ox + Math.cos(a) * d * R, cy + oy + Math.sin(a) * d * R, r * R, lw, Math.round(a * 10));
      }
    }
    function body(g: CanvasRenderingContext2D, shape: () => void, ox: number, oy: number, inSlice: boolean, lw: number) {
      shape(); g.fillStyle = C.cheese; g.fill();
      g.save(); shape(); g.clip();
      // crust ring
      g.beginPath(); g.arc(cx + ox, cy + oy, R, 0, TAU); g.arc(cx + ox, cy + oy, R * 0.86, 0, TAU, true);
      g.fillStyle = C.crust; g.fill("evenodd");
      g.beginPath(); g.arc(cx + ox, cy + oy, R * 0.86, 0, TAU); g.lineWidth = lw * 0.7; g.strokeStyle = C.ink; g.stroke();
      // halftone shade
      g.fillStyle = dots(g, C.cheeseDeep, 6, 1.5, stage.dpr);
      g.beginPath(); g.arc(cx + ox + R * 0.45, cy + oy + R * 0.5, R * 0.95, 0, TAU); g.fill();
      toppings(g, ox, oy, inSlice, lw);
      g.restore();
      shape(); g.lineWidth = lw; g.strokeStyle = C.ink; g.lineJoin = "round"; g.stroke();
    }

    function strandPath(g: CanvasRenderingContext2D, s: Strand, from: number, to: number) {
      g.beginPath();
      g.moveTo(s.xs[from], s.ys[from]);
      for (let i = from + 1; i < to; i++) {
        const mx = (s.xs[i] + s.xs[i + 1]) / 2, my = (s.ys[i] + s.ys[i + 1]) / 2;
        g.quadraticCurveTo(s.xs[i], s.ys[i], mx, my);
      }
      g.lineTo(s.xs[to], s.ys[to]);
    }

    function draw() {
      const g = stage.ctx, w = stage.w, h = stage.h, lw = Math.max(1.6, 3 * sc);
      g.clearRect(0, 0, w, h);
      const lift = clamp(Math.hypot(off.x, off.y) / R, 0, 1);
      // shadows
      g.fillStyle = dots(g, C.ink, 7, 1.7, stage.dpr);
      g.globalAlpha = 0.3;
      g.beginPath(); g.arc(cx + 8 * sc, cy + 12 * sc, R, bis + half, bis - half + TAU); g.lineTo(cx + 8 * sc, cy + 12 * sc); g.fill();
      g.beginPath(); g.moveTo(cx + off.x + 14 * sc * (1 + lift), cy + off.y + 20 * sc * (1 + lift));
      g.arc(cx + off.x + 14 * sc * (1 + lift), cy + off.y + 20 * sc * (1 + lift), R, bis - half, bis + half); g.fill();
      g.globalAlpha = 1;
      // the gap inside the pie shows the plate (a darker cheese pool)
      body(g, () => pie(g), 0, 0, false, lw);
      // strands behind the slice
      g.lineCap = "round"; g.lineJoin = "round";
      for (const s of strands) {
        const a = anchor(s, false), b = anchor(s, true);
        const D = Math.hypot(b.x - a.x, b.y - a.y);
        if (s.cut < 0 && D < 3) continue;
        if (s.cut >= 0 && s.life <= 0) continue;
        const thin = clamp(Math.sqrt((R * 0.35) / Math.max(D, R * 0.35)), 0.25, 1);
        const ww = Math.max(1.2, s.w * sc * thin * (s.cut >= 0 ? clamp(s.life, 0, 1) : 1));
        const nSeg = s.cut < 0 ? 1 : 2;
        for (let k = 0; k < nSeg; k++) {
          const p = s.cut < 0 ? 0 : k ? s.cut + 1 : 0, q = s.cut < 0 ? SEG - 1 : k ? SEG - 1 : s.cut;
          if (q - p < 1) continue;
          strandPath(g, s, p, q);
          g.strokeStyle = C.ink; g.lineWidth = ww + lw * 0.9; g.stroke();
          g.strokeStyle = C.cheese; g.lineWidth = ww; g.stroke();
          g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = Math.max(0.6, ww * 0.25); g.stroke();
        }
        if (s.cut >= 0 && s.life > 0) {
          // droplets on the broken ends
          for (let i = s.cut; i <= s.cut + 1; i++) {
            g.beginPath(); g.arc(s.xs[i], s.ys[i], ww * 0.75 + 1, 0, TAU);
            g.fillStyle = C.cheese; g.fill(); g.lineWidth = lw * 0.6; g.strokeStyle = C.ink; g.stroke();
          }
        }
      }
      body(g, () => wedge(g, off.x, off.y), off.x, off.y, true, lw);
      // a little "grab" ring when held
      if (held) {
        g.beginPath(); g.arc(cx + off.x + grabDX, cy + off.y + grabDY, 10 * sc, 0, TAU);
        g.lineWidth = 1.5; g.strokeStyle = C.ink; g.setLineDash([3, 4]); g.stroke(); g.setLineDash([]);
      }
    }

    const offDrag = drag(stage.canvas, {
      down(e) {
        const p = stage.pos(e);
        // grab point relative to the slice centre (or its centroid if missed)
        const scx = cx + off.x + Math.cos(bis) * R * 0.55, scy = cy + off.y + Math.sin(bis) * R * 0.55;
        const d = Math.hypot(p.x - scx, p.y - scy);
        if (d < R * 0.6) { grabDX = p.x - cx - off.x; grabDY = p.y - cy - off.y; }
        else { grabDX = scx - cx - off.x; grabDY = scy - cy - off.y; }
        held = true; touched = true;
        off.tx = p.x - cx - grabDX; off.ty = p.y - cy - grabDY;
        env.poke(); env.sfx("click"); stage.kick();
      },
      move(e, active) {
        if (!active) return;
        const p = stage.pos(e);
        off.tx = p.x - cx - grabDX; off.ty = p.y - cy - grabDY;
        stage.kick();
      },
      up() { held = false; stage.kick(3500); },
    });

    return {
      act() {
        // a quick tug: fling the slice out and let it spring home
        touched = true; held = false;
        off.vx += Math.cos(bis) * R * 9; off.vy += Math.sin(bis) * R * 9;
        env.poke(); env.sfx("click"); stage.kick(3500);
      },
      start: () => stage.start(),
      stop: () => stage.stop(),
      destroy() { offDrag(); stage.destroy(); },
    };
  },
};
