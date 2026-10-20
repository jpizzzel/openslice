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
    blurb: "The back of house for a small business. We built it to run Saturday Slices at Peter's Pizzeria. Soon it can run yours.",
    story:
      "Saturday Slices is the Saturday night at Peter's Pizzeria, a student run pizzeria in Somerville that started with a few friends in junior year and now runs on a crew of over a dozen students. That means orders, prep lists, money and customers all landing on the same night, so we built one place to keep track of it. The rest of this toolbox grew out of it. We're cleaning it up so we can open source the whole thing.",
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

/** One special on the Saturday Slices menu, as listed on saturdayslices.com. */
export interface MenuItem {
  name: string;
  toppings: string[];
  /** US dollars */
  price: number;
  note: string;
}

/** One of the two ways the pies get baked. */
export interface Method {
  style: string;
  oven: string;
  /** degrees Fahrenheit */
  temp: number;
}

/** The real pizzeria behind it all. Facts only, as published on saturdayslices.com. */
export interface Trunk {
  /** the Saturday night itself */
  name: string;
  href: string;
  /** href without the scheme, for display */
  site: string;
  pizzeria: string;
  where: string;
  est: number;
  /** when it started, in school years */
  started: string;
  hours: string;
  /** students on the crew */
  crew: number;
  /** dough ferment, in hours */
  ferment: number;
  /** oven temperatures, degrees Fahrenheit */
  oven: { ooni: number; steel: number };
  methods: Method[];
  /** pizzas per night, roughly */
  perNight: number;
  sellout: string;
  /** how long a night's pies last, roughly, in hours */
  selloutHours: number;
  instagram: { handle: string; href: string };
  tagline: string;
  pitch: string;
  origin: string;
  heart: string;
  motto: [string, string];
  night: string;
  /** shown wherever Tufts is mentioned */
  tufts: string;
  /** sections of saturdayslices.com (no paths: link the home page) */
  pages: string[];
  blog: { title: string; by: string };
  menu: MenuItem[];
}

const TRUNK: Trunk = {
  name: "Saturday Slices",
  href: "https://saturdayslices.com/",
  site: "saturdayslices.com",
  pizzeria: "Peter's Pizzeria",
  where: "Somerville, MA",
  est: 2025,
  started: "Junior year",
  hours: "Saturdays, 7pm til sellout",
  crew: 12,
  ferment: 72,
  oven: { ooni: 900, steel: 550 },
  methods: [
    { style: "Neapolitan", oven: "Fired in an Ooni", temp: 900 },
    { style: "New York", oven: "Baked on pizza steels", temp: 550 },
  ],
  perNight: 12,
  sellout: "about an hour",
  selloutHours: 1,
  instagram: { handle: "@peterspizzeria_", href: "https://www.instagram.com/peterspizzeria_/" },
  tagline: "Handmade with love.",
  pitch:
    "A student-run pizzeria from the heart of Somerville. Twelve passionate students, one kitchen, a 72-hour ferment, and a love for community.",
  origin:
    "A few friends stayed up until three in the morning with an idea: build community for Tufts and make great, affordable pizza.",
  heart: "A hole in the wall, with a lot of heart.",
  motto: ["We make pizza.", "We make community."],
  night: "Every Saturday night is more than a meal.",
  tufts: "Not affiliated with Tufts University.",
  pages: ["Menu", "Blog", "Gallery", "Slice Status", "Community Pictures"],
  blog: { title: "How Bambino and their Vito Slice Inspired Me from Dublin, Ireland", by: "Peter M." },
  menu: [
    { name: "Bianca", toppings: ["Ricotta", "Garlic", "Olive oil", "Rosemary"], price: 3, note: "Coming soon" },
    { name: "Pesto", toppings: ["House-made pesto sauce", "Our mozzarella blend", "Fresh basil"], price: 4, note: "Coming soon" },
    { name: "Vodka", toppings: ["House-made vodka sauce", "Our mozzarella blend", "Fresh basil"], price: 4, note: "Coming soon" },
  ],
};

export const SITE = {
  name: "OpenSlice",
  tagline: "Free tools, served hot.",
  repo: "https://github.com/jpizzzel/toolbox",
  trunk: TRUNK,
  since: 2023,
  where: "Somerville, MA",
  manifesto:
    "We met as freshman roommates and never stopped being roommates. We started a student pizzeria in Somerville with a few friends, and we rebuild the paid apps we wish were free. Saturday Slices is the trunk. Everything here is a branch, and every branch is open source.",
  facts: [
    "Roommates since freshman year",
    "Seniors, still under one roof",
    "Slinging pizza on Saturdays",
    "Allergic to subscriptions",
    "Rebuild the apps we'd pay for",
    "Give it all away",
    "Every slice open source",
  ],
};

/**
 * The trunk's growth rings. A ring closes every Sept 1 after the fall of
 * SITE.since; `full` counts the closed ones and `growing` is the number of the
 * ring still in progress (always full + 1). One source for the footer and /slices.
 */
export function rings(now = new Date()) {
  let full = 0;
  while (new Date(SITE.since + full + 1, 8, 1) <= now) full++;
  return { full, growing: full + 1 };
}
