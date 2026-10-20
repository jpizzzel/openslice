import { TOOLS } from "../data/site";

export const NAV = [
  { href: "/toolbox", label: "Toolbox" },
  { href: "/lab", label: "Lab" },
  { href: "/about", label: "About" },
  { href: "/slices", label: "The Trunk" },
];

/** Human label for a destination path, used by the page transition. */
export function sectionFor(path: string): string {
  const p = path.replace(/\/+$/, "") || "/";
  if (p === "/") return "Home";
  const tool = p.match(/^\/toolbox\/([^/]+)/);
  if (tool) return TOOLS.find((t) => t.slug === tool[1])?.name ?? "Toolbox";
  const nav = NAV.find((n) => n.href === p);
  return nav ? nav.label : "Lost";
}

/** Which nav item is active for a path (prefix match), or -1. */
export function activeIndex(path: string): number {
  return NAV.findIndex((n) => path === n.href || path.startsWith(n.href + "/"));
}

const tidy = (path: string) => path.replace(/\/+$/, "") || "/";

/** What the page transition says on the way to a path, in that page's own voice. */
export function transitionLine(path: string): string {
  const p = tidy(path);
  if (p === "/") return "Back to the counter";
  const tool = p.match(/^\/toolbox\/([^/]+)/);
  if (tool) {
    const t = TOOLS.find((x) => x.slug === tool[1]);
    return t ? `${t.name}, hot` : "Uh oh";
  }
  switch (p) {
    case "/toolbox": return "Opening the toolbox";
    case "/lab": return "Into the lab";
    case "/about": return "Meet the cooks";
    case "/slices": return "Out to the trunk";
    default: return "Uh oh";
  }
}

/** Where the visitor is, for the footer's "You were in" line. */
export function placeFor(path: string, page = ""): string {
  const p = tidy(path);
  const tool = p.match(/^\/toolbox\/([^/]+)/);
  if (tool) return TOOLS.find((x) => x.slug === tool[1])?.name ?? "The toolbox";
  const names: Record<string, string> = {
    home: "The front counter", toolbox: "The toolbox", lab: "The Lab",
    about: "The kitchen", slices: "The trunk", lost: "Nowhere, apparently",
  };
  return names[page] ?? (p === "/" ? names.home : names.lost);
}
