// Sauce Spiral: draw with a ladle of tomato sauce. The ladle trails the
// pointer, strokes smooth out and spread a little as they settle. It starts
// with one finished spiral and never draws on its own.
import { C, Stage, TAU, clamp, drag, lerp, type Experiment } from "./kit";

interface Pt { x: number; y: number; w: number; tw: number }

export const sauce: Experiment = {
  id: "sauce",
  title: "Sauce Spiral",
  line: "Draw with the pointer to ladle sauce. It spreads as it settles.",
  label: "Sauce Spiral: draw with the pointer to ladle tomato sauce. The sauce smooths and spreads. A clear button wipes it.",
  ar: [1, 1],
  create(host, env) {
    let cx = 0, cy = 0, R = 1, sc = 1;
    let strokes: Pt[][] = [];
    let cur: Pt[] | null = null;
    const ladle = { x: 0, y: 0, tx: 0, ty: 0, vis: 0, down: false };
    let auto = false, autoU = 0, autoHold = 0;
    let wipe = 0; // 1 -> 0 fade while clearing
    let layer = document.createElement("canvas");
    layer.width = 0;
    let lg = layer.getContext("2d")!;

    const stage = new Stage({
      host, env, label: sauce.label,
      resize(w, h, pw) {
        const k = pw ? w / pw : 1;
        cx = w / 2; cy = h / 2; R = Math.min(w, h) * 0.42; sc = R / 160;
        for (const s of strokes) for (const p of s) { p.x *= k; p.y *= k; p.w *= k; p.tw *= k; }
        ladle.x *= k; ladle.y *= k; ladle.tx *= k; ladle.ty *= k;
        const old = layer;
        layer = document.createElement("canvas");
        layer.width = stage.canvas.width; layer.height = stage.canvas.height;
        lg = layer.getContext("2d")!;
        if (old.width) lg.drawImage(old, 0, 0, layer.width, layer.height);
        if (!old.width) {
          // the still frame: one finished spiral
          spiral(1);
          bakeAll();
        }
      },
      frame(dt, t) {
        if (dt > 0) update(dt, t);
        draw();
      },
    });

    function spiral(u: number) {
      const s: Pt[] = [];
      const steps = Math.floor(u * 260);
      for (let i = 0; i <= steps; i++) {
        const q = i / 260, a = q * TAU * 4.2;
        const r = R * 0.8 * q + R * 0.02;
        s.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, w: 22 * sc, tw: 22 * sc });
      }
      strokes.push(s);
    }

    function addPoint(x: number, y: number, speed: number) {
      if (!cur) return;
      const last = cur[cur.length - 1];
      if (last) {
        const d = Math.hypot(x - last.x, y - last.y);
        if (d < 2.5 * sc) return;
        // fill gaps so fast flicks stay continuous
        const n = Math.min(12, Math.floor(d / (5 * sc)));
        for (let i = 1; i < n; i++) {
          const q = i / n;
          cur.push({ x: lerp(last.x, x, q), y: lerp(last.y, y, q), w: 3 * sc, tw: last.tw });
        }
      }
      const tw = clamp(30 - speed * 0.012, 11, 30) * sc;
      cur.push({ x, y, w: 3 * sc, tw });
    }

    function bake(s: Pt[]) {
      lg.setTransform(stage.dpr, 0, 0, stage.dpr, 0, 0);
      paintStroke(lg, s);
    }
    function bakeAll() { for (const s of strokes) bake(s); strokes = []; }

    function update(dt: number, t: number) {
      // ladle inertia: it trails the pointer like a heavy spoon
      const k = 1 - Math.exp(-dt * (ladle.down ? 14 : 9));
      const ox = ladle.x, oy = ladle.y;
      ladle.x += (ladle.tx - ladle.x) * k;
      ladle.y += (ladle.ty - ladle.y) * k;
      const speed = Math.hypot(ladle.x - ox, ladle.y - oy) / Math.max(dt, 1e-3);
      if (ladle.down && cur) addPoint(ladle.x, ladle.y, speed);

      if (auto) {
        if (autoHold > 0) {
          autoHold -= dt;
          if (autoHold <= 0) wipe = 1;
        } else if (wipe === 0) {
          autoU = Math.min(1, autoU + dt * 0.13);
          const a = autoU * TAU * 4.2, r = R * 0.8 * autoU + R * 0.02;
          ladle.tx = cx + Math.cos(a) * r; ladle.ty = cy + Math.sin(a) * r;
          if (!cur) { cur = []; strokes.push(cur); ladle.x = ladle.tx; ladle.y = ladle.ty; }
          addPoint(ladle.tx, ladle.ty, 300);
          ladle.vis = Math.min(1, ladle.vis + dt * 3);
          if (autoU >= 1) { cur = null; auto = false; }
        }
      }

      // spreading
      for (const s of strokes) for (const p of s) {
        p.w += (p.tw - p.w) * (1 - Math.exp(-dt * 2.2));
        if (s !== cur) p.tw += dt * 0.6 * sc; // keeps creeping a touch
      }
      // bake finished strokes
      for (let i = strokes.length - 1; i >= 0; i--) {
        const s = strokes[i];
        if (s === cur) continue;
        if (s.every((p) => p.w > p.tw - 0.4 * sc)) { bake(s); strokes.splice(i, 1); }
      }
      if (wipe > 0) {
        wipe -= dt * 2.2;
        if (wipe <= 0) {
          wipe = 0; strokes = []; cur = null;
          lg.setTransform(1, 0, 0, 1, 0, 0); lg.clearRect(0, 0, layer.width, layer.height);
          if (auto) { autoU = 0; autoHold = 0; }
          if (redraw) { redraw = false; auto = !env.reduced; if (env.reduced) { spiral(1); bakeAll(); } }
        }
      }
      if (!auto && !ladle.down) ladle.vis = Math.max(0, ladle.vis - dt * 0.8);
      void t;
    }

    // keyboard play: wipe, then the ladle draws one spiral and stops
    let redraw = false;
    function restartAuto() {
      auto = false; autoU = 0; autoHold = 0; cur = null; redraw = true;
      if (strokes.length || layer.width) wipe = 1;
    }

    function paintStroke(g: CanvasRenderingContext2D, s: Pt[]) {
      if (s.length < 2) {
        if (s.length === 1) { g.beginPath(); g.arc(s[0].x, s[0].y, s[0].w / 2, 0, TAU); g.fillStyle = C.tomato; g.fill(); }
        return;
      }
      g.save();
      g.lineCap = "round"; g.lineJoin = "round";
      const pass = (col: string, add: number, mul: number, ox: number, oy: number) => {
        g.strokeStyle = col;
        for (let i = 1; i < s.length; i++) {
          const a = s[i - 1], b = s[i];
          g.lineWidth = (a.w + b.w) * 0.5 * mul + add;
          g.beginPath(); g.moveTo(a.x + ox, a.y + oy); g.lineTo(b.x + ox, b.y + oy); g.stroke();
        }
      };
      pass(C.tomatoDeep, 4 * sc, 1, 1.5 * sc, 2 * sc);
      pass(C.tomato, 0, 1, 0, 0);
      g.globalAlpha = 0.55;
      pass(C.tomatoLight, 0, 0.22, -2.5 * sc, -2.5 * sc);
      g.restore();
    }

    function draw() {
      const g = stage.ctx, w = stage.w, h = stage.h, lw = Math.max(1.5, 3 * sc);
      g.clearRect(0, 0, w, h);

      // sauce: baked layer + live strokes
      g.save();
      g.globalAlpha = wipe > 0 ? clamp(wipe, 0, 1) : 1;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.drawImage(layer, 0, 0);
      g.setTransform(stage.dpr, 0, 0, stage.dpr, 0, 0);
      for (const s of strokes) paintStroke(g, s);
      g.restore();

      // ladle
      if (ladle.vis > 0.01) {
        const a = clamp(ladle.vis, 0, 1);
        g.save(); g.globalAlpha = a;
        g.translate(ladle.x, ladle.y);
        const r = 17 * sc;
        g.lineCap = "round"; g.strokeStyle = C.ink;
        g.beginPath(); g.moveTo(r * 0.7, -r * 0.7); g.quadraticCurveTo(r * 2.4, -r * 2.2, r * 3.6, -r * 4.4);
        g.lineWidth = lw * 2.4; g.stroke();
        g.strokeStyle = C.paper; g.lineWidth = lw * 1.1; g.stroke();
        g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fillStyle = C.paper; g.fill();
        g.lineWidth = lw; g.strokeStyle = C.ink; g.stroke();
        g.beginPath(); g.arc(0, r * 0.15, r * 0.66, 0, TAU); g.fillStyle = C.tomato; g.fill();
        g.restore();
      }
    }

    const off = drag(stage.canvas, {
      down(e) {
        const p = stage.pos(e);
        if (auto) { auto = false; cur = null; strokes.forEach((s) => s.forEach((q) => (q.tw = Math.max(q.w, q.tw * 0.9)))); }
        if (wipe > 0) { wipe = 0; strokes = []; lg.setTransform(1, 0, 0, 1, 0, 0); lg.clearRect(0, 0, layer.width, layer.height); }
        redraw = false;
        ladle.down = true; ladle.tx = p.x; ladle.ty = p.y; ladle.vis = 1;
        if (env.reduced) { ladle.x = p.x; ladle.y = p.y; }
        else if (Math.hypot(ladle.x - p.x, ladle.y - p.y) > 60 * sc) { ladle.x = p.x; ladle.y = p.y; }
        cur = []; strokes.push(cur);
        addPoint(ladle.x, ladle.y, 0);
        env.poke(); env.sfx("click"); stage.kick();
      },
      move(e, active) {
        const p = stage.pos(e);
        ladle.tx = p.x; ladle.ty = p.y;
        if (!auto) ladle.vis = Math.max(ladle.vis, 0.9);
        if (active) {
          if (env.reduced) { ladle.x = p.x; ladle.y = p.y; addPoint(p.x, p.y, 200); }
          stage.kick(2600);
        } else if (env.reduced) stage.kick(500);
      },
      up() { ladle.down = false; cur = null; stage.kick(2600); },
    });

    // the ladle reset button travels with the stage into the modal
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "lab-btn";
    btn.textContent = "Clear";
    btn.setAttribute("aria-label", "Clear the sauce");
    const reset = () => {
      env.sfx("whoosh"); env.poke();
      cur = null; ladle.down = false;
      if (env.reduced) {
        strokes = []; lg.setTransform(1, 0, 0, 1, 0, 0); lg.clearRect(0, 0, layer.width, layer.height); stage.kick(200);
      } else { wipe = 1; auto = false; redraw = false; stage.kick(1200); }
    };
    btn.addEventListener("click", reset);
    host.appendChild(btn);

    return {
      act() {
        // the ladle draws a fresh spiral
        env.poke(); env.sfx("whoosh");
        if (env.reduced) { reset(); spiral(1); bakeAll(); stage.kick(200); }
        else { restartAuto(); stage.kick(); }
      },
      start: () => stage.start(),
      stop: () => stage.stop(),
      destroy() { off(); btn.removeEventListener("click", reset); btn.remove(); stage.destroy(); },
    };
  },
};
