<p align="center">
  <img src="public/og.png" alt="OpenSlice in big tomato red letters next to a pepperoni slice. Free tools, served hot." width="720" />
</p>

# OpenSlice

Free tools, served hot.

Hi. We're Jonah Pflaster and Peter Morganelli. We moved in together as freshman roommates in fall 2023, we're seniors now, and we still share a kitchen. Junior year, a few friends stayed up until three in the morning and started Peter's Pizzeria, a student run pizzeria in Somerville, MA. Its night is [Saturday Slices](https://saturdayslices.com/): Saturdays, 7pm til sellout.

We also have a habit. We find an app we'd happily pay for, rebuild it for ourselves, and give it away. OpenSlice is where those rebuilds live. This repo is the website, and the site is the menu.

## What's on the menu

| Tool | What it is | Status |
| --- | --- | --- |
| Satsuma | Drag a file, hold Shift, drop it on a format. A file converter for Windows 10 and 11, our take on Tangerine. Jonah's. | Open beta: [tangerineforwindows-site.vercel.app](https://tangerineforwindows-site.vercel.app/) |
| Mandarin | The same drag and hold converter, rebuilt for the Mac. Peter's, and the one that started all this. | In the oven |
| Murmur | Hold a key, talk, let go. Dictation in the spirit of Wispr Flow. | In the oven |
| SliceOS | The system we built to run Saturday Slices at Peter's Pizzeria: orders, prep, customers, money. | In the oven |

Mandarin, Murmur and SliceOS are working titles, so the names might change before they ship. There are also two classified slices on the list that we're not talking about yet.

## A quick tour

- Home. Our own pizza box, folded in CSS 3D. The lid flips, steam curls up and the tools pop out. Next to it is an order ticket with one line per tool, all at $0.00. Scroll and everything packs back in, the lid shuts and the box slides down onto the menu board. Hover a row on the board and that tool's poster follows your cursor.
- Toolbox (`/toolbox`). Every tool is a kitchen ticket hanging off a rail, and a split-flap NOW SERVING sign up top tells you which one you're on.
- Tool pages (`/toolbox/:slug`). The story, the features, a receipt with a barcode made from the slug (subtotal $0.00, subscription: none), and an "Order up!" sign once there's a link to grab. If there isn't one yet, the sign says "Still in the oven".
- Lab (`/lab`). The test kitchen. Eight toys that don't do anything useful: Topping Rain, Sauce Spiral, Dough Stretch, Halftone Mirror, Slice Clock, Kinetic Type, Order Ticket Printer and Cheese Pull.
- About (`/about`). Our timeline, freshman through senior and then "Forever". Each tool shows up in the year it shipped.
- The Trunk (`/slices`). Saturday Slices, from Peter's Pizzeria in Somerville, is the trunk and every tool is a branch. The page has the shop's numbers, its story, the specials board and the Saturday rhythm. The tree is drawn from data, so it grows a branch per tool and a ring per year (a new ring closes every September 1).
- 404. A giant 404 with a bite out of the 0, an empty greasy box and a flashlight. The page you wanted got eaten.
- Saturday mode. The shop opens Saturdays at 7pm, and the site knows it. The countdown runs to seven and then flips to "Oven's hot", the marquee changes its tune, the footer wordmark shimmers and the two of us show up in aprons.
- Footer. A small ink tree next to a stump that counts our rings. It gets a little fuller every year.

## Running the site

You need Node and npm.

```sh
npm install
npm run dev         # local dev server
npm run build       # typecheck, then build to dist/
npm run preview     # serve the built site locally
npm run typecheck   # just tsc, no build
```

### Checking our work

These run against a built `dist/`, so `npm run build` first. They use Playwright with a local Chromium. If yours lives somewhere other than the default path, point `SHOOT_CHROMIUM` at the binary.

```sh
npm run qa                       # full check, every route, desktop and mobile
npm run qa -- --fast             # skip the scroll frame timing, much quicker
npm run qa -- --routes /,/lab    # only these routes
npm run qa -- --only mobile      # only one viewport (desktop or mobile)
npm run qa -- --dist other-dist  # check a different build folder
npm run qa -- --report qa.md     # also write the report to a file
npm run size                     # bundle sizes, and what the first page downloads
node scripts/shoot.mjs           # screenshots into shots/
```

`qa` serves the build with `vite preview` and goes through every route at 1440px and 390px. It looks for runtime errors, failed requests, horizontal overflow, heading order, missing accessible names, duplicate ids and serious axe-core issues, and it measures LCP, CLS and scroll frame times. Then it clicks through the nav (titles, route changes, the back button) a few times and watches for heap, listener and DOM node growth. It prints a markdown report and exits non-zero if anything is an error. `--loops` and `--sample` tune the leak loops and the scroll sample length.

`size` takes `--dist` and `--route`. `shoot.mjs` takes a list of routes plus `--mobile`, `--out`, `--dist`, `--wait` and `--scroll 800,1600` if you want shots further down the page.

## Stack

Vite and TypeScript, no framework. Animation is GSAP (with ScrollTrigger) and smooth scrolling is Lenis. Fonts are self hosted through Fontsource: Bricolage Grotesque, Big Shoulders Display, Instrument Serif and JetBrains Mono. Almost every drawing is an SVG string written in code, so there's barely an image folder. Posters with a lot of text get swapped for an `<img>` of the same SVG (`src/art/flatten.ts`) so the browser rasters them once instead of on every frame of a scroll.

## Where things live

```
src/
  main.ts            boot: chrome, preloader, router
  data/site.ts       all the copy and every tool, in one file
  core/              router, routes, page contract, transitions, motion, event bus
  chrome/            what sticks around between pages
    chrome.ts          header and nav
    lid.ts             the pizza box lid art, shared by the preloader and the home box
    preloader.ts       the lid and oven dial you see while it loads
    footer.ts          footer with the little tree
    countdown.ts       "Slicing next" countdown and Saturday mode
    cursor.ts, audio.ts, sections.ts
  art/               SVG drawing kit
    mascots.ts         the two of us as pizza slices
    glyphs.ts          topping and object glyphs
    posters.ts         a generated poster per tool
    scenes.ts, props.ts, core.ts
    tree.ts            the footer tree
    flatten.ts         turns heavy inline SVG into images
  pages/             one module per route, with a folder for its parts
    home.ts, home/     box.ts, ticket.ts, hero, menu board, marquee, manifesto, duo, CTA
    toolbox.ts         the ticket rail
    tool.ts            a single tool page
    toolbox/shared.ts  helpers both of those use
    lab.ts, lab/       registry.ts lists the experiments, one file each
    about.ts           the timeline
    about/kit.ts       helpers shared by about, the trunk and the 404
    slices.ts          the trunk page
    slices/tree.ts     the trunk tree and the rings, drawn from TOOLS
    notfound.ts        404
  styles/            tokens, base, chrome, and one CSS file per page in pages/
scripts/
  qa.mjs             automated QA
  size.mjs           bundle size report
  shoot.mjs          screenshots
public/              favicon, icons, social image, manifest, robots.txt
```

If you only want to change words, `src/data/site.ts` is the file. Pages read from it, so nothing about a tool should be hardcoded anywhere else.

## Adding a tool

1. Open `src/data/site.ts`.
2. Add an object to the `TOOLS` array. Here's a made up one:

   ```ts
   {
     slug: "provolone",              // becomes /toolbox/provolone
     name: "Provolone",
     codename: true,                 // optional: working title, drop it once the name is final
     kind: "Screenshots",            // small category label above the title
     platform: "macOS",
     status: "baking",               // "served" | "proofing" | "baking" | "prepping"
     by: ["jonah", "peter"],         // "jonah" | "peter"
     blurb: "One line for the lists.",
     story: "A paragraph for the detail page. Why we built it, what it replaces.",
     replaces: "Some paid app",      // optional
     features: ["One short line per feature"],
     links: [{ label: "Download", href: "https://example.com" }],
     color: "#2F7D4F",               // accent for its slice
     glyph: "mystery",               // "satsuma" | "tangerine" | "voice" | "register" | "mystery"
     year: 2026,                     // the year it shipped
   },
   ```

3. Run `npm run dev` and open `/toolbox/provolone`.

That's it. You don't touch any page files. The new tool gets its own page and a ticket on the toolbox rail, a line on the home order ticket and menu board, a generated poster, a spot on the about timeline for its `year`, and a new branch on the trunk (the tree gets taller to fit it).

The glyph has to be one of the values in the `Tool["glyph"]` union. `"mystery"` is fine until the tool gets a drawing of its own. A brand new glyph means adding it to that union and drawing it in `src/art/glyphs.ts`. Posters pick a layout by glyph and fall back to one picked from the slug, so you don't have to touch `src/art/posters.ts` unless you want to.

When it ships, flip `status` to `"proofing"` (open beta) or `"served"` (out of the oven) and add the real links. A `"prepping"` tool is classified: it gets redacted everywhere and folded into the "+N classified" line. The labels the site shows ("Open beta", "In the oven" and so on) are in `STATUS_LABEL` in the same file.

## Deploying

We deploy on Vercel. Import the repo and keep the defaults (build command `npm run build`, output `dist`). `vercel.json` rewrites every path that isn't an asset or a file to `index.html`, so deep links like `/toolbox/satsuma` work on refresh, and it gives everything under `/assets/` a long immutable cache.

## Contributing

Found a bug, or want to fix a typo? Read [CONTRIBUTING.md](CONTRIBUTING.md). It's short.

## License

MIT. See [LICENSE](LICENSE). Fork it and build your own toolbox if you want.

Made by Jonah ([jonahpflaster.me](https://www.jonahpflaster.me/)) and Peter ([petermorganelli.dev](https://www.petermorganelli.dev/)) out of our house.
