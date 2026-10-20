import "./styles/fonts.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/chrome.css";

import { initScroll } from "./core/motion";
import { initRouter } from "./core/router";
import { initChrome } from "./chrome/chrome";

async function boot() {
  initScroll();
  initChrome();
  // give the preloaded fonts a short moment so the first paint is in the real type
  await Promise.race([
    document.fonts.ready.catch(() => {}),
    new Promise((r) => setTimeout(r, 600)),
  ]);
  await initRouter();
}

boot();
