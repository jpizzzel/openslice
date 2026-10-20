import type { Page } from "../core/page";

const page: Page = {
  title: "toolbox",
  section: "toolbox",
  mount({ root }) {
    root.innerHTML = `<section style="padding:20vh 10vw"><h1 class="caps-red" style="font-size:var(--t-2xl)">toolbox</h1></section>`;
  },
};

export default page;
