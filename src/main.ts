import "@fontsource-variable/bricolage-grotesque/wght.css";
import "@fontsource-variable/big-shoulders-display/wght";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource-variable/jetbrains-mono/wght.css";
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
