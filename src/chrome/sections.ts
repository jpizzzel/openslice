export const NAV = [
  { href: "/toolbox", label: "Toolbox" },
  { href: "/lab", label: "Lab" },
  { href: "/about", label: "About" },
  { href: "/slices", label: "The Trunk" },
];

/** Which nav item is active for a path (prefix match), or -1. */
export function activeIndex(path: string): number {
  return NAV.findIndex((n) => path === n.href || path.startsWith(n.href + "/"));
}
