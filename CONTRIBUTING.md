# Contributing

Thanks for stopping by. This is a two person project, so we keep the process light.

Bugs and ideas go in [issues](https://github.com/jpizzzel/toolbox/issues). For a bug, tell us the page, your browser, and what you expected to happen. A screenshot helps a lot.

Small fixes like typos, broken links or a layout glitch on your phone can go straight to a pull request. For anything bigger, open an issue first so we can talk it through before you spend a weekend on it.

Before you open a PR:

1. Run `npm run build`. It typechecks and builds, and it should pass. (`npm run typecheck` is the quick version while you work.)
2. Run `npm run qa -- --fast` on that build. It should finish with no errors. If you changed scrolling or animation, run the full `npm run qa` too, since `--fast` skips the frame timing.
3. Look at the page yourself at desktop width and at phone width (around 390px). `node scripts/shoot.mjs /your/route --mobile` will screenshot it for you.
4. If you touched animation, make sure it still behaves with reduced motion turned on.
5. If you added a dependency or a big drawing, run `npm run size` and tell us what changed.

A few house rules. Copy and tool info belong in `src/data/site.ts`, not in page files. A new tool should only need an entry in `TOOLS`; if you find yourself editing the tree or the ticket rail to make it show up, something's off. Each page keeps its CSS in `src/styles/pages/` and scopes it under its own root class. No new runtime dependencies unless there's a really good reason. And please, no em dashes in the copy. We have strong feelings about this.

By contributing you agree your work is released under the [MIT License](LICENSE).
