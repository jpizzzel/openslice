// Single source of truth for site copy. Edit here, not in page modules.

export type Status = "served" | "proofing" | "baking" | "prepping";

export const STATUS_LABEL: Record<Status, string> = {
  served: "Out of the oven",
  proofing: "Open beta",
  baking: "In the oven",
  prepping: "On the menu",
};

export interface Person {
  id: "jonah" | "peter";
  name: string;
  first: string;
  site: string;
  siteLabel: string;
  role: string;
}

export const PEOPLE: Person[] = [
  {
    id: "jonah",
    name: "Jonah Pflaster",
    first: "Jonah",
    site: "https://www.jonahpflaster.me/",
    siteLabel: "jonahpflaster.me",
    role: "Co-founder, Saturday Slices",
  },
  {
    id: "peter",
    name: "Peter Morganelli",
    first: "Peter",
    site: "https://www.petermorganelli.dev/",
    siteLabel: "petermorganelli.dev",
    role: "Co-founder, Saturday Slices",
  },
];

export interface Tool {
  slug: string;
  name: string;
  /** true while the public name is still a working title */
  codename?: boolean;
  /** short category label, shown small above the title */
  kind: string;
  platform: string;
  status: Status;
  by: Person["id"][];
  /** one line, shown in lists */
  blurb: string;
  /** longer paragraph for the detail view */
  story: string;
  /** what paid thing it replaces, if any */
  replaces?: string;
  features: string[];
  links: { label: string; href: string }[];
  /** accent color for the tool's slice */
  color: string;
  /** topping glyph id used by the art library */
  glyph: "satsuma" | "tangerine" | "voice" | "register" | "mystery";
  year: number;
}

export const TOOLS: Tool[] = [
  {
    slug: "satsuma",
    name: "Satsuma",
    kind: "File conversion",
    platform: "Windows 10 & 11",
    status: "proofing",
    by: ["jonah"],
    blurb: "Drag a file, hold Shift, drop it on a format. A converter that lives under your cursor.",
    story:
      "Peter rebuilt a paid Mac app for himself, so Jonah did the same thing for Windows. Satsuma watches for one thing: a drag with Shift, Ctrl or Alt held. A wheel opens under the pointer, you let go on a slice, and a converted copy lands next to the original. Everything runs offline with ffmpeg bundled in the zip.",
    replaces: "Tangerine (Mac only, paid)",
    features: [
      "Shift opens Convert: HEIC to JPG, MOV to MP4, clips to GIFs, PDFs to images",
      "Ctrl opens Tools: compress, merge PDFs, shrink photos, strip location data",
      "Alt opens Actions: copy path, open a terminal there, park it in Float",
      "Never overwrites. Your original stays put, copies get (1), (2)...",
      "Fully offline. No account, no uploads",
    ],
    links: [{ label: "Open beta site", href: "https://tangerineforwindows-site.vercel.app/" }],
    color: "#EF6A1F",
    glyph: "satsuma",
    year: 2026,
  },
  {
    slug: "mandarin",
    name: "Mandarin",
    codename: true,
    kind: "File conversion",
    platform: "macOS",
    status: "baking",
    by: ["peter"],
    blurb: "The drag-and-hold converter, rebuilt from scratch for the Mac. The one that started it all.",
    story:
      "Peter saw a Mac app that converts files mid-drag, liked it, and reverse engineered the idea into his own free version over a few late nights. It kicked off the whole OpenSlice habit: find a tool we would pay for, then build our own and give it away.",
    replaces: "Tangerine for Mac",
    features: [
      "Hold a modifier mid-drag to open a radial format wheel",
      "Native macOS, lives in the menu bar",
      "Converts locally, nothing leaves your machine",
    ],
    links: [],
    color: "#FF9A1F",
    glyph: "tangerine",
    year: 2026,
  },
  {
    slug: "murmur",
    name: "Murmur",
    codename: true,
    kind: "Voice to text",
    platform: "macOS",
    status: "baking",
    by: ["peter"],
    blurb: "Hold a key, talk, let go. Clean text appears wherever your cursor is.",
    story:
      "Peter recreated a popular paid dictation app because typing essays and commit messages at 2am is slower than talking. Hold the hotkey, say what you mean, and polished text is pasted into whatever app is focused.",
    replaces: "Wispr Flow",
    features: [
      "Push to talk from any app",
      "Cleans up ums, ahs and false starts",
      "Pastes straight into the focused text field",
    ],
    links: [],
    color: "#7A5CFF",
    glyph: "voice",
    year: 2026,
  },
  {
    slug: "sliceos",
    name: "SliceOS",
    codename: true,
    kind: "Small business OS",
    platform: "Web",
    status: "baking",
    by: ["jonah", "peter"],
    blurb: "The whole back of house for a small business. Built to run Saturday Slices, open sourced for yours.",
    story:
      "Saturday Slices is a student run pizza place we operate out of our house. Running it meant orders, prep lists, money and customers all at once, so we built one system to hold all of it. It is the trunk the rest of this toolbox grows out of, and we are cleaning it up to release in full.",
    features: [
      "Orders and pickup slots",
      "Prep and inventory, down to the dough balls",
      "Customer list and announcements",
      "Money in, money out, at a glance",
    ],
    links: [],
    color: "#FF3B2F",
    glyph: "register",
    year: 2026,
  },
  {
    slug: "redacted-1",
    name: "Classified",
    kind: "Still proofing",
    platform: "TBA",
    status: "prepping",
    by: ["jonah", "peter"],
    blurb: "Something we use every day and refuse to talk about until it is ready.",
    story: "This slice is still in the dough stage. Check back, or watch the repo.",
    features: [],
    links: [],
    color: "#2F7D4F",
    glyph: "mystery",
    year: 2026,
  },
  {
    slug: "redacted-2",
    name: "Classified",
    kind: "Still proofing",
    platform: "TBA",
    status: "prepping",
    by: ["jonah", "peter"],
    blurb: "Another paid app on our list. It does not know it yet.",
    story: "This slice is still in the dough stage. Check back, or watch the repo.",
    features: [],
    links: [],
    color: "#FFC93C",
    glyph: "mystery",
    year: 2026,
  },
];

export const SITE = {
  name: "OpenSlice",
  tagline: "Free tools, served hot.",
  repo: "https://github.com/jpizzzel/toolbox",
  trunk: { name: "Saturday Slices", href: "https://saturdayslices.com/" },
  since: 2023,
  where: "Out of our house",
  manifesto:
    "Two roommates who met freshman year, started a pizza place in their kitchen, and kept rebuilding the paid apps they wished were free. Saturday Slices is the trunk. Everything here is a branch, and every branch is open source.",
  facts: [
    "Roommates since freshman year",
    "Seniors, still under one roof",
    "Sell pizza out of our house",
    "Allergic to subscriptions",
    "Rebuild the apps we would pay for",
    "Ship it, then make it free",
    "Every slice open source",
  ],
};
