// THE MENU BOARD: every tool as a pizzeria menu line. Hovering a row makes
// the tool's poster follow the cursor like a card tossed on the table.
import { gsap } from "../../core/motion";
import { poster } from "../../art";
import { flattenSvgs } from "../../art/flatten";
import { STATUS_LABEL, PEOPLE, type Tool } from "../../data/site";
import { servedTools, secretTools, redacted } from "./ticket";
import { esc, type Kit } from "./kit";
import { isSaturday } from "../../chrome/countdown";

const names = (ids: string[]) =>
  ids.map((id) => PEOPLE.find((p) => p.id === id)?.first ?? id).join(" & ");

interface Row { href: string; name: string; codename?: boolean; status: Tool["status"]; kind: string; platform: string; by: string[]; replaces?: string; color: string; secret: number; tool: Tool }

/** classified tools collapse into one redacted line, so the board never repeats itself */
function rows(): Row[] {
  const out: Row[] = servedTools().map((t) => ({
    href: `/toolbox/${t.slug}`, name: t.name, codename: t.codename, status: t.status, kind: t.kind,
    platform: t.platform, by: t.by, replaces: t.replaces, color: t.color, secret: 0, tool: t,
  }));
  const s = secretTools();
  if (s.length) {
    out.push({
      href: `/toolbox/${s[0].slug}`, name: s[0].name, status: s[0].status, kind: s[0].kind,
      platform: s[0].platform, by: s[0].by, color: s[0].color, secret: s.length, tool: s[0],
    });
  }
  return out;
}

export function menuHTML() {
  const list = rows();
  const html = list.map((t, i) => {
    const was = t.secret
      ? `<span class="mb-was mb-was--redact">${redacted(10)}</span>`
      : t.replaces
        ? `<s class="mb-was"><span class="sr-only">Instead of </span>${esc(t.replaces)}</s>`
        : `<span class="mb-was mb-was--none">Always</span>`;
    const name = t.secret
      ? `<span class="mb-name__in mb-name__in--secret">${esc(t.name)}</span><sup class="mb-x">x${t.secret}</sup>`
      : `<span class="mb-name__in">${esc(t.name)}</span>${t.codename ? `<sup class="mb-wt">working title</sup>` : ""}`;
    return `
      <li class="mb-row${t.secret ? " mb-row--secret" : ""}" style="--c:${t.color}">
        <a class="mb-link" href="${t.href}" data-i="${i}" data-cursor="Open">
          <span class="mb-no">${String(i + 1).padStart(2, "0")}</span>
          <span class="mb-main">
            <span class="mb-name">${name}</span>
            <span class="mb-meta">
              <span class="mb-pill mb-pill--${t.status}">${STATUS_LABEL[t.status]}</span>
              <span>${esc(t.kind)}</span><span class="mb-dot">/</span><span>${esc(t.platform)}</span><span class="mb-dot">/</span><span>by ${names(t.by)}</span>
            </span>
          </span>
          <span class="mb-lead" aria-hidden="true"></span>
          <span class="mb-price">${was}<span class="mb-now"><span class="sr-only">Price: </span>$0</span></span>
          <span class="mb-thumb" aria-hidden="true">${poster(t.tool)}</span>
        </a>
      </li>`;
  }).join("");
  return `
  <section class="h-mb" aria-labelledby="mb-title">
    <header class="h-mb__head">
      <div class="h-mb__drop" aria-hidden="true"></div>
      <p class="label">(01) ${isSaturday() ? "Saturday's menu, oven's on" : "Today's menu"}</p>
      <h2 id="mb-title" class="h-mb__title"><span class="h-mb__t1">The</span> <span class="h-mb__t2">Menu</span></h2>
      <p class="h-mb__note serif">Everything is made from scratch and costs nothing. <em>Seconds are encouraged.</em></p>
      <dl class="h-mb__legend">
        <div><dt class="label">Prices in</dt><dd>USD, forever</dd></div>
        <div><dt class="label">Tipping</dt><dd>A GitHub star</dd></div>
        <div><dt class="label">Kitchen</dt><dd>Open source</dd></div>
      </dl>
    </header>
    <ol class="mb-list">${html}</ol>
    <div class="mb-float" aria-hidden="true">
      ${list.map((t) => `<div class="mb-card" style="--c:${t.color}">${poster(t.tool)}</div>`).join("")}
    </div>
  </section>`;
}

export function initMenu(kit: Kit) {
  const sec = kit.root.querySelector<HTMLElement>(".h-mb")!;
  const rows = [...sec.querySelectorAll<HTMLElement>(".mb-row")];

  if (!kit.reduced) {
    kit.add(() => {
      gsap.from(sec.querySelectorAll(".h-mb__t1, .h-mb__t2"), {
        yPercent: 100, duration: 1.4, ease: "expo.out", stagger: 0.1,
        scrollTrigger: { trigger: sec, start: "top 75%" },
      });
      rows.forEach((row) => {
        gsap.from(row.querySelectorAll(".mb-no, .mb-main, .mb-price"), {
          y: 50, opacity: 0, duration: 1.1, ease: "expo.out", stagger: 0.06,
          scrollTrigger: { trigger: row, start: "top 92%" },
        });
        gsap.from(row.querySelector(".mb-lead"), {
          scaleX: 0, transformOrigin: "0 50%", duration: 1.4, ease: "expo.out",
          scrollTrigger: { trigger: row, start: "top 92%" },
        });
      });
    });
  }

  if (!kit.fine || kit.reduced) return;

  const float = sec.querySelector<HTMLElement>(".mb-float")!;
  const cards = [...float.querySelectorAll<HTMLElement>(".mb-card")];
  // the floating posters follow the pointer on transforms: as images they are rastered once
  kit.onCleanup(flattenSvgs(float.querySelectorAll<SVGSVGElement>(".mb-card > svg")));
  let active = -1;
  let cx = 0, cy = 0, lastX = 0, inside = false;

  type Q = ReturnType<typeof gsap.quickTo>;
  let qx!: Q, qy!: Q, qr!: Q;
  kit.add(() => {
    gsap.set(float, { xPercent: -50, yPercent: -50, scale: 0.4, autoAlpha: 0, rotation: -8 });
    gsap.set(cards, { autoAlpha: 0 });
    qx = gsap.quickTo(float, "x", { duration: 0.65, ease: "power3" });
    qy = gsap.quickTo(float, "y", { duration: 0.65, ease: "power3" });
    qr = gsap.quickTo(float, "rotation", { duration: 0.9, ease: "power3" });
  });

  const place = () => {
    const r = sec.getBoundingClientRect();
    qx(cx - r.left);
    qy(cy - r.top);
  };
  const show = (i: number) => {
    if (i === active) return;
    const prev = cards[active];
    active = i;
    if (prev) gsap.to(prev, { autoAlpha: 0, yPercent: -12, duration: 0.35, ease: "power2.out", overwrite: true });
    gsap.fromTo(cards[i], { autoAlpha: 0, yPercent: 14, scale: 1.08 }, { autoAlpha: 1, yPercent: 0, scale: 1, duration: 0.55, ease: "expo.out", overwrite: true });
    gsap.to(float, { scale: 1, autoAlpha: 1, duration: 0.7, ease: "elastic.out(1, 0.55)", overwrite: "auto" });
  };
  const hide = () => {
    active = -1;
    gsap.to(float, { scale: 0.4, autoAlpha: 0, duration: 0.4, ease: "power3.in", overwrite: "auto" });
    gsap.to(cards, { autoAlpha: 0, duration: 0.3, delay: 0.2, overwrite: true });
  };

  const list = sec.querySelector<HTMLElement>(".mb-list")!;
  const onMove = (e: PointerEvent) => {
    cx = e.clientX; cy = e.clientY;
    const vx = e.clientX - lastX;
    lastX = e.clientX;
    qr(Math.max(-18, Math.min(18, vx * 0.9)) - 4);
    place();
  };
  const onOver = (e: PointerEvent) => {
    const a = (e.target as Element).closest<HTMLElement>(".mb-link");
    if (!a) return;
    if (!inside) {
      inside = true;
      cx = e.clientX; cy = e.clientY; lastX = cx;
      const r = sec.getBoundingClientRect();
      gsap.set(float, { x: cx - r.left, y: cy - r.top });
    }
    show(Number(a.dataset.i));
  };
  const onLeave = () => { inside = false; hide(); };
  const onScroll = () => { if (inside) place(); };

  list.addEventListener("pointermove", onMove, { passive: true });
  list.addEventListener("pointerover", onOver);
  list.addEventListener("pointerleave", onLeave);
  window.addEventListener("scroll", onScroll, { passive: true });
  kit.onCleanup(() => {
    list.removeEventListener("pointermove", onMove);
    list.removeEventListener("pointerover", onOver);
    list.removeEventListener("pointerleave", onLeave);
    window.removeEventListener("scroll", onScroll);
  });
}
