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
| Mandarin | The same drag and hold converter, rebuilt for the Mac. Peter's, and the one that started all this. | In development |
| Murmur | Hold a key, talk, let go. Dictation in the spirit of Wispr Flow. | In development |
| SliceOS | The system we built to run Saturday Slices at Peter's Pizzeria: orders, prep, customers, money. | In development |

Mandarin, Murmur and SliceOS are working titles, so the names might change before they ship. There are also two classified slices on the list that we're not talking about yet.

## A quick tour

- Home. The name, one sentence, and a stack of tool covers you can drag or swipe through. Below that, a plain list of every tool and a short note about us.
- Toolbox (`/toolbox`). The same covers, bigger, with the list of tools and the details for whichever one is in front.
- Tool pages (`/toolbox/:slug`). What it does, the features, the details, and a link to grab it once it's out.
- Lab (`/lab`). Five small toys we made along the way. They sit still until you hover or tap.
- About (`/about`). Who we are, a short timeline and how to reach us.
- The Trunk (`/slices`). Saturday Slices at Peter's Pizzeria in Somerville, the thing the rest of this grew out of.

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
  main.ts            boot: chrome, router
  data/site.ts       all the copy and every tool, in one file
  core/              router, routes, page contract, transitions, motion, event bus
  chrome/            what sticks around between pages
    chrome.ts          header and nav
    footer.ts          footer
    cursor.ts, sections.ts
  art/               SVG drawing kit
    mascots.ts         the two of us as pizza slices
    glyphs.ts          small object glyphs
    posters.ts         a generated cover per tool
    scenes.ts, props.ts, core.ts
    flatten.ts         turns heavy inline SVG into images
  pages/             one module per route, with a folder for its parts
    home.ts            name, covers, tools list, about us
    toolbox.ts         the covers and the tools list
    tool.ts            a single tool page
    toolbox/stack.ts   the draggable covers, shared by home and the toolbox
    toolbox/shared.ts  small helpers for those pages
    lab.ts, lab/       registry.ts lists the toys, one file each
    about.ts           who we are and the timeline
    about/kit.ts       helpers shared by about, the trunk and the 404
    slices.ts          the trunk page
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

That's it. You don't touch any page files. The new tool gets its own page, a generated cover in the stack, and a row in the tools list.

The glyph has to be one of the values in the `Tool["glyph"]` union. `"mystery"` is fine until the tool gets a drawing of its own. A brand new glyph means adding it to that union and drawing it in `src/art/glyphs.ts`. Posters pick a layout by glyph and fall back to one picked from the slug, so you don't have to touch `src/art/posters.ts` unless you want to.

When it ships, flip `status` to `"proofing"` (open beta) or `"served"` (released) and add the real links. A `"prepping"` tool is unannounced: its details stay hidden and it is folded into the "+N more in progress" line. The labels the site shows ("Open beta", "In development" and so on) are in `STATUS_LABEL` in the same file.

## Deploying

We deploy on Vercel. Import the repo and keep the defaults (build command `npm run build`, output `dist`). `vercel.json` rewrites every path that isn't an asset or a file to `index.html`, so deep links like `/toolbox/satsuma` work on refresh, and it gives everything under `/assets/` a long immutable cache.

## Contributing

Found a bug, or want to fix a typo? Read [CONTRIBUTING.md](CONTRIBUTING.md). It's short.

## License

MIT. See [LICENSE](LICENSE). Fork it and build your own toolbox if you want.

Made by Jonah ([jonahpflaster.me](https://www.jonahpflaster.me/)) and Peter ([petermorganelli.dev](https://www.petermorganelli.dev/)) out of our house.
