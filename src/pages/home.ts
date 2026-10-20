import type { Page } from "../core/page";

const page: Page = {
  title: "home",
  section: "home",
  mount({ root }) {
    root.innerHTML = `<section style="padding:20vh 10vw"><h1 class="caps-red" style="font-size:var(--t-2xl)">home</h1></section>`;
  },
};

export default page;
