import "../styles/pages/notfound.css";
import type { Page } from "../core/page";
import { mascot } from "../art";
import { reveal } from "./about/kit";

const page: Page = {
  title: "Not found",
  section: "Lost",
  mount({ root }) {
    root.innerHTML = `<div class="p-404">
      <section class="nf" aria-labelledby="nf-h" data-reveal>
        <div class="nf__art" aria-hidden="true">${mascot("jonah", "stand")}</div>
        <div class="nf__text">
          <h1 id="nf-h" class="nf__h">Page not found.</h1>
          <p class="nf__p">We checked behind the oven. Nothing here.</p>
          <nav class="nf__links" aria-label="Find your way back">
            <a class="nf__btn" href="/">Go home</a>
            <a class="nf__btn nf__btn--ghost" href="/toolbox">Browse the toolbox</a>
          </nav>
        </div>
      </section>
    </div>`;
    const el = root.querySelector<HTMLElement>(".p-404")!;
    return reveal(el);
  },
};

export default page;
