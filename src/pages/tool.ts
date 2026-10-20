import type { Page } from "../core/page";

const page: Page = {
  title: "tool",
  section: "tool",
  mount({ root }) {
    root.innerHTML = `<section style="padding:20vh 10vw"><h1 class="caps-red" style="font-size:var(--t-2xl)">tool</h1></section>`;
  },
};

export default page;
