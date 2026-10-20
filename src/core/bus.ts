// Tiny typed event bus for cross-module signals (route changes, audio, etc).
type Events = {
  "route:before": { to: string };
  "route:after": { path: string; section: string };
  "audio:toggle": { on: boolean };
  "sfx": { name: "tick" | "pop" | "whoosh" | "click" };
};

type Handler<T> = (payload: T) => void;
const map = new Map<keyof Events, Set<Handler<any>>>();

export const bus = {
  on<K extends keyof Events>(type: K, fn: Handler<Events[K]>) {
    if (!map.has(type)) map.set(type, new Set());
    map.get(type)!.add(fn);
    return () => map.get(type)!.delete(fn);
  },
  emit<K extends keyof Events>(type: K, payload: Events[K]) {
    map.get(type)?.forEach((fn) => fn(payload));
  },
};
