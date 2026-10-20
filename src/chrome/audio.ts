// "Oven room" audio. Web Audio only, fully synthesized, no files.
// The AudioContext is created lazily on a user gesture. Off by default.
import { bus } from "../core/bus";

const KEY = "os-audio";
type Sfx = "tick" | "pop" | "whoosh" | "click";

let ctx: AudioContext | null = null;
let master: GainNode;
let bed: GainNode;
let noiseBuf: AudioBuffer;
let crackleTimer = 0;
let on = false;
const subs = new Set<(on: boolean) => void>();

function stored(): boolean {
  try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
}
function store(v: boolean) {
  try { localStorage.setItem(KEY, v ? "1" : "0"); } catch { /* private mode */ }
}

function build() {
  const AC = window.AudioContext || (window as any).webkitAudioContext;
  if (!AC) return false;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0;
  // gentle glue so sfx never clip
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  master.connect(comp).connect(ctx.destination);

  // 4s of brown noise, looped for the bed and sliced for sfx
  const len = ctx.sampleRate * 4;
  noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    d[i] = last * 3.5;
  }

  bed = ctx.createGain();
  bed.gain.value = 0;
  bed.connect(master);

  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 420;
  lp.Q.value = 0.4;
  const ng = ctx.createGain();
  ng.gain.value = 0.55;
  src.connect(lp).connect(ng).connect(bed);
  src.start();

  // warm hum: low fundamental + soft octave, slowly breathing
  const hum = ctx.createGain();
  hum.gain.value = 0.05;
  hum.connect(bed);
  for (const [f, g] of [[54, 1], [108, 0.35], [162, 0.08]] as const) {
    const o = ctx.createOscillator();
    o.frequency.value = f;
    const og = ctx.createGain();
    og.gain.value = g;
    o.connect(og).connect(hum);
    o.start();
  }
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.09;
  const lfoG = ctx.createGain();
  lfoG.gain.value = 0.02;
  lfo.connect(lfoG).connect(hum.gain);
  lfo.start();
  return true;
}

/** one tiny wood-fire crackle, scheduled at random */
function crackle() {
  if (!ctx || !on) return;
  const n = 1 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) {
    const t = ctx.currentTime + i * (0.02 + Math.random() * 0.06);
    const s = ctx.createBufferSource();
    s.buffer = noiseBuf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1800 + Math.random() * 2600;
    bp.Q.value = 1.4;
    const g = ctx.createGain();
    const peak = 0.05 + Math.random() * 0.12;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03 + Math.random() * 0.04);
    s.connect(bp).connect(g).connect(bed);
    s.start(t, Math.random() * 3, 0.1);
  }
  crackleTimer = window.setTimeout(crackle, 300 + Math.random() * 2400);
}

function env(g: GainNode, t: number, peak: number, a: number, r: number) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + r);
}

export function sfx(name: Sfx) {
  if (!ctx || !on || ctx.state !== "running") return;
  const t = ctx.currentTime;
  const out = ctx.createGain();
  out.connect(master);
  if (name === "tick") {
    const o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.setValueAtTime(2400, t);
    o.frequency.exponentialRampToValueAtTime(1600, t + 0.03);
    o.connect(out);
    env(out, t, 0.06, 0.002, 0.035);
    o.start(t); o.stop(t + 0.06);
  } else if (name === "click") {
    const o = ctx.createOscillator();
    o.type = "square";
    o.frequency.setValueAtTime(900, t);
    o.frequency.exponentialRampToValueAtTime(320, t + 0.04);
    const lp = ctx.createBiquadFilter();
    lp.frequency.value = 2200;
    o.connect(lp).connect(out);
    env(out, t, 0.08, 0.002, 0.05);
    o.start(t); o.stop(t + 0.08);
  } else if (name === "pop") {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(320, t);
    o.frequency.exponentialRampToValueAtTime(980, t + 0.07);
    o.connect(out);
    env(out, t, 0.22, 0.004, 0.11);
    o.start(t); o.stop(t + 0.14);
  } else {
    const s = ctx.createBufferSource();
    s.buffer = noiseBuf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 0.9;
    bp.frequency.setValueAtTime(260, t);
    bp.frequency.exponentialRampToValueAtTime(2200, t + 0.22);
    bp.frequency.exponentialRampToValueAtTime(380, t + 0.5);
    s.connect(bp).connect(out);
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(0.5, t + 0.2);
    out.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    s.start(t, Math.random() * 3, 0.6);
  }
}

function apply() {
  if (on) {
    if (!ctx && !build()) return;
    // resume() rejects when the browser still wants a gesture; the next one wakes it
    ctx!.resume().catch(() => {});
    const t = ctx!.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setTargetAtTime(1, t, 0.05);
    bed.gain.cancelScheduledValues(t);
    bed.gain.setValueAtTime(bed.gain.value, t);
    bed.gain.linearRampToValueAtTime(0.9, t + 1.8);
    clearTimeout(crackleTimer);
    crackleTimer = window.setTimeout(crackle, 900);
  } else if (ctx) {
    const t = ctx.currentTime;
    clearTimeout(crackleTimer);
    bed.gain.cancelScheduledValues(t);
    bed.gain.setValueAtTime(bed.gain.value, t);
    bed.gain.linearRampToValueAtTime(0, t + 0.6);
    master.gain.setTargetAtTime(0, t + 0.5, 0.08);
    const c = ctx;
    setTimeout(() => { if (!on) c.suspend().catch(() => {}); }, 1100);
  }
}

export const audio = {
  get on() { return on; },
  /** call from a user gesture */
  toggle(v = !on) {
    on = v;
    store(on);
    apply();
    if (on) setTimeout(() => sfx("pop"), 60);
    subs.forEach((f) => f(on));
    bus.emit("audio:toggle", { on });
  },
  subscribe(fn: (on: boolean) => void) { subs.add(fn); fn(on); return () => subs.delete(fn); },
};

export function initAudio() {
  bus.on("sfx", ({ name }) => sfx(name));
  // Remembered "on": wait for the first gesture before making any sound.
  if (stored()) {
    on = true;
    const wake = () => {
      removeEventListener("pointerdown", wake, true);
      removeEventListener("keydown", wake, true);
      if (on) apply();
    };
    addEventListener("pointerdown", wake, true);
    addEventListener("keydown", wake, true);
  }
  document.addEventListener("visibilitychange", () => {
    if (!ctx || !on) return;
    (document.hidden ? ctx.suspend() : ctx.resume()).catch(() => {});
  });
}
