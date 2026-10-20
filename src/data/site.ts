// Single source of truth for site copy. Edit here, not in page modules.

export type Status = "served" | "proofing" | "baking" | "prepping";

export const STATUS_LABEL: Record<Status, string> = {
  served: "Out of the oven",
  proofing: "Open beta",
  baking: "In the oven",
  prepping: "Still prepping",
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
    replaces: "Tangerine (Mac only)",
    features: [
      "Shift opens Convert: HEIC to JPG, MOV to MP4, clips to GIFs, PDFs to images",
      "Ctrl opens Tools: compress, merge PDFs, shrink photos, strip location data",
      "Alt opens Actions: copy path, open a terminal there, park it in Float",
      "Never overwrites anything. Your original stays put, copies get (1), (2) and so on",
      "Works offline. No account, no uploads",
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
    blurb: "The drag-and-hold converter, rebuilt for the Mac. This is where the habit started.",
    story:
      "Peter liked a paid Mac app that converts files mid-drag, so he built his own version. That started the whole OpenSlice habit: find a tool we'd pay for, build our own, give it away.",
    replaces: "Tangerine",
    features: [
      "Hold a modifier mid-drag to open a radial format wheel",
      "Native macOS, lives in the menu bar",
      "Converts locally. Nothing leaves your machine",
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
      "Peter rebuilt a paid dictation app because talking is faster than typing, especially at 2am. Hold the hotkey, say what you mean, let go, and the cleaned-up text lands in whatever app you're in.",
    replaces: "Wispr Flow",
    features: [
      "Push to talk from any app",
      "Cuts the ums, the ahs and the false starts",
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
    blurb: "The back of house for a small business. We built it to run Saturday Slices. Soon it can run yours.",
    story:
      "Saturday Slices is a student run pizza place we run out of our house. That means orders, prep lists, money and customers all landing on the same day, so we built one place to keep track of it. The rest of this toolbox grew out of it. We're cleaning it up so we can open source the whole thing.",
    features: [
      "Orders and pickup slots",
      "Prep and inventory, down to the dough balls",
      "Customer list and announcements",
      "Money in and money out",
    ],
    links: [],
    color: "#FF3B2F",
    glyph: "register",
    year: 2026,
  },
  {
    slug: "redacted-1",
    name: "Classified",
    kind: "Top secret",
    platform: "TBA",
    status: "prepping",
    by: ["jonah", "peter"],
    blurb: "We use it every day. Not saying more yet.",
    story: "Still in the dough. Check back later, or watch the repo.",
    features: [],
    links: [],
    color: "#2F7D4F",
    glyph: "mystery",
    year: 2026,
  },
  {
    slug: "redacted-2",
    name: "Classified",
    kind: "Top secret",
    platform: "TBA",
    status: "prepping",
    by: ["jonah", "peter"],
    blurb: "Another paid app is on our list. It doesn't know yet.",
    story: "Still in the dough. Check back later, or watch the repo.",
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
    "We met as freshman roommates and never stopped being roommates. We sell pizza out of our kitchen and rebuild the paid apps we wish were free. Saturday Slices is the trunk. Everything here is a branch, and every branch is open source.",
  facts: [
    "Roommates since freshman year",
    "Seniors, still under one roof",
    "Sell pizza out of our house",
    "Allergic to subscriptions",
    "Rebuild the apps we'd pay for",
    "Give it all away",
    "Every slice open source",
  ],
};
