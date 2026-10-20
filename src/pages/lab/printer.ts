// Exp. 07 Order Ticket Printer: a tiny kitchen printer. Click to print a
// randomised (but deterministic) order ticket that drops onto a pile.
import { gsap } from "../../core/motion";
import { Flip } from "gsap/Flip";
import { rng, type Experiment } from "./kit";

gsap.registerPlugin(Flip);

const MENU = [
  "Pepperoni slice", "Plain cheese, no notes", "Extra cheese pull", "Basil, one leaf",
  "Garlic knot", "Crust only (respect)", "Hot honey drizzle", "Open source sauce",
  "Side of ranch", "Slice of the week", "Mystery topping", "Folded NY style",
  "Burnt bottom, on purpose", "Free refill of vibes", "Commit message, cheesy", "Midnight slice",
];
const NOTES = ["Free forever", "Ships Saturday", "No tip, just a star", "Fork it", "Thank u, come back", "Hot and fresh"];

export const printer: Experiment = {
  id: "printer",
  title: "Order Ticket Printer",
  line: "The kitchen printer from the shop, tiny edition. Every order rings up at $0.00.",
  label: "Order Ticket Printer: press print and a receipt with a random pizza order slides out of a tiny printer and lands on a growing pile.",
  hint: "Press print",
  tone: "basil",
  ar: [3, 4],
  create(host, env) {
    host.insertAdjacentHTML("beforeend", `
      <div class="tkt">
        <div class="tkt__pile" aria-hidden="true"></div>
        <div class="tkt__feed" aria-hidden="true"></div>
        <div class="tkt__printer">
          <div class="tkt__top"><span class="tkt__brand">Slice-o-matic</span><span class="tkt__led"></span></div>
          <div class="tkt__slot"></div>
        </div>
        <button type="button" class="lab-chip lab-chip--btn tkt__btn" aria-label="Print an order ticket">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="6" rx="1" fill="none" stroke="currentColor" stroke-width="2"/><rect x="3" y="9" width="18" height="8" rx="2" fill="currentColor"/><rect x="7" y="14" width="10" height="7" fill="#f7f4ef" stroke="currentColor" stroke-width="2"/></svg>
          <span>Print</span>
        </button>
        <p class="sr-only" aria-live="polite" data-live></p>
      </div>`);
    const root = host.querySelector(".tkt") as HTMLElement;
    const feed = root.querySelector(".tkt__feed") as HTMLElement;
    const pile = root.querySelector(".tkt__pile") as HTMLElement;
    const btn = root.querySelector(".tkt__btn") as HTMLButtonElement;
    const live = root.querySelector("[data-live]") as HTMLElement;
    const printerEl = root.querySelector(".tkt__printer") as HTMLElement;
    let num = 41, busy = false, queued = false, started = false;
    const tweens: gsap.core.Animation[] = [];

    const ticket = (n: number) => {
      const r = rng(n * 7919);
      const items = MENU.slice().sort(() => r() - 0.5).slice(0, 2 + Math.floor(r() * 3));
      const rows = items.map((it) => `<li><span>${1 + Math.floor(r() * 3)}x</span><span>${it}</span><span>$0.00</span></li>`).join("");
      const bars = Array.from({ length: 34 }, () => `<i style="--w:${1 + Math.floor(r() * 3)}"></i>`).join("");
      const el = document.createElement("div");
      el.className = "tkt__ticket";
      el.innerHTML = `
        <p class="tkt__h">Saturday Slices</p>
        <p class="tkt__sub"><span>Lab ticket</span><span>#${String(n).padStart(4, "0")}</span></p>
        <ul>${rows}</ul>
        <p class="tkt__tot"><span>Total</span><span>$0.00</span></p>
        <p class="tkt__note">* ${NOTES[n % NOTES.length]} *</p>
        <div class="tkt__bars">${bars}</div>`;
      return { el, items };
    };

    const settle = (el: HTMLElement, instant: boolean) => {
      const state = Flip.getState(el);
      pile.appendChild(el);
      const k = pile.children.length;
      const rot = ((num * 37) % 22) - 11;
      const x = ((num * 53) % 30) - 15;
      gsap.set(el, { xPercent: -50 + x, rotation: rot, yPercent: 0 });
      if (!instant) {
        tweens.push(Flip.from(state, { duration: 0.9, ease: "back.out(1.4)", onComplete: () => gsap.set(el, { clearProps: "zIndex" }) }));
      }
      // keep the pile short
      while (pile.children.length > 5) pile.firstElementChild!.remove();
      void k;
    };

    const print = () => {
      if (busy) { queued = true; return; }
      busy = true;
      num++;
      const { el, items } = ticket(num);
      live.textContent = `Printed ticket ${num}: ${items.join(", ")}. Total $0.00.`;
      if (env.reduced) {
        feed.appendChild(el);
        settle(el, true);
        busy = false;
        env.sfx("click");
        return;
      }
      feed.appendChild(el);
      const lines = el.querySelectorAll("p, li, .tkt__bars").length;
      gsap.set(el, { yPercent: -100 });
      root.classList.add("is-printing");
      const tl = gsap.timeline({
        onComplete: () => {
          root.classList.remove("is-printing");
          settle(el, false);
          env.sfx("whoosh");
          busy = false;
          if (queued) { queued = false; window.setTimeout(print, 120); }
        },
      });
      // jerky line-by-line feed, like a thermal printer
      for (let i = 1; i <= lines; i++) {
        tl.to(el, { yPercent: -100 + (100 * i) / lines, duration: 0.09, ease: "power1.out", onStart: () => env.sfx("tick", 40) }, i === 1 ? 0 : ">+0.035");
      }
      tl.to(printerEl, { y: 2, duration: 0.05, yoyo: true, repeat: 3, ease: "none" }, 0);
      tl.to(el, { rotation: -3, duration: 0.25, ease: "power2.out" }, ">+0.25");
      tweens.push(tl);
    };

    const onClick = () => { env.poke(); env.sfx("click"); print(); };
    btn.addEventListener("click", onClick);
    const onPrinter = () => { env.poke(); print(); };
    printerEl.addEventListener("click", onPrinter);

    // a couple of earlier orders already on the pile
    for (let i = 0; i < 2; i++) {
      num++;
      const { el } = ticket(num);
      feed.appendChild(el);
      settle(el, true);
    }

    return {
      start() {
        if (started) return;
        started = true;
        if (!env.reduced) tweens.push(gsap.delayedCall(0.7, print));
      },
      stop() { /* nothing loops; tweens finish on their own */ },
      destroy() {
        tweens.forEach((t) => t.kill());
        btn.removeEventListener("click", onClick);
        printerEl.removeEventListener("click", onPrinter);
        root.remove();
      },
    };
  },
};
