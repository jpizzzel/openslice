import type { Page } from "../core/page";

const page: Page = {
  title: "about",
  section: "about",
  mount({ root }) {
    root.innerHTML = `<section style="padding:20vh 10vw"><h1 class="caps-red" style="font-size:var(--t-2xl)">about</h1></section>`;
  },
};

export default page;
