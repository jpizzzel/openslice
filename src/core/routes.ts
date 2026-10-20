import type { Page } from "./page";

export interface Route {
  pattern: RegExp;
  keys: string[];
  load: () => Promise<{ default: Page }>;
}

function route(path: string, load: Route["load"]): Route {
  const keys: string[] = [];
  const src = path.replace(/:(\w+)/g, (_, k) => {
    keys.push(k);
    return "([^/]+)";
  });
  return { pattern: new RegExp(`^${src}/?$`), keys, load };
}

export const ROUTES: Route[] = [
  route("/", () => import("../pages/home")),
  route("/toolbox", () => import("../pages/toolbox")),
  route("/toolbox/:slug", () => import("../pages/tool")),
  route("/lab", () => import("../pages/lab")),
  route("/about", () => import("../pages/about")),
  route("/slices", () => import("../pages/slices")),
];

export const NOT_FOUND = () => import("../pages/notfound");

export function match(pathname: string) {
  for (const r of ROUTES) {
    const m = pathname.match(r.pattern);
    if (m) {
      const params: Record<string, string> = {};
      r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
      return { route: r, params };
    }
  }
  return null;
}
