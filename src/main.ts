import "./styles/fonts.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/chrome.css";

import { initScroll } from "./core/motion";
import { initRouter } from "./core/router";
import { initChrome } from "./chrome/chrome";
import { runPreloader } from "./chrome/preloader";

async function boot() {
  initScroll();
  initChrome();
  const loader = runPreloader();
  await document.fonts.ready.catch(() => {});
  await initRouter();
  await loader.done();
}

boot();
