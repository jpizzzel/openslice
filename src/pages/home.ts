// HOME: hero burst, marquee, manifesto, menu board, the duo, CTA, footer.
import "../styles/pages/home.css";
import type { Page } from "../core/page";
import { gsap, reducedMotion, finePointer, ScrollTrigger } from "../core/motion";
import { loaderGone } from "../core/ready";
import { createLoop, type Kit } from "./home/kit";
import { heroHTML, initHero } from "./home/hero";
import { marqueeHTML, initMarquee } from "./home/marquee";
import { manifestoHTML, initManifesto } from "./home/manifesto";
import { menuHTML, initMenu } from "./home/menu";
import { duoHTML, initDuo } from "./home/duo";
import { ctaHTML, initCta } from "./home/cta";

// The footer is owned by the chrome; use it when it exists.
const footerMod = import.meta.glob<{ renderFooter?: () => string }>("../chrome/footer.ts", { eager: true });
const renderFooter = Object.values(footerMod)[0]?.renderFooter;

const page: Page = {
  title: "",
  section: "Home",
  mount({ root, first }) {
    root.innerHTML = `
      <div class="p-home${reducedMotion ? " is-reduced" : ""}">
        ${heroHTML()}
        ${marqueeHTML()}
        ${manifestoHTML()}
        ${menuHTML()}
        ${duoHTML()}
        ${ctaHTML()}
        ${renderFooter ? renderFooter() : "<!-- footer -->"}
      </div>`;

    const el = root.querySelector<HTMLElement>(".p-home")!;
    const gctx = gsap.context(() => {}, el);
    const loop = createLoop();
    const cleanups: (() => void)[] = [];
    let alive = true;

    const kit: Kit = {
      root: el,
      reduced: reducedMotion,
      fine: finePointer,
      add: (fn) => { if (alive) gctx.add(fn); },
      onCleanup: (fn) => cleanups.push(fn),
      loop: (target, fn) => loop.add(target, fn),
    };

    const intro = (first ? loaderGone : Promise.resolve()).then(
      () => new Promise<void>((r) => (alive ? requestAnimationFrame(() => r()) : undefined)),
    );

    initHero(kit, intro);
    initMarquee(kit);
    initManifesto(kit);
    initMenu(kit);
    initDuo(kit);
    initCta(kit);

    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(() => alive && refresh());

    return () => {
      alive = false;
      loop.kill();
      cleanups.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });
      gctx.revert();
    };
  },
};

export default page;
