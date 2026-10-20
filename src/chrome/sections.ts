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
