import type { Page } from "../core/page";

const page: Page = {
  title: "lab",
  section: "lab",
  mount({ root }) {
    root.innerHTML = `<section style="padding:20vh 10vw"><h1 class="caps-red" style="font-size:var(--t-2xl)">lab</h1></section>`;
  },
};

export default page;
