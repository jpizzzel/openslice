// Resolves once the first page's mount() has been called (DOM is in place).
let resolveRender!: () => void;
export const firstRender = new Promise<void>((r) => (resolveRender = r));
export const markFirstRender = () => resolveRender();

// There is no intro loader any more. Pages mounted with ctx.first === true may still
// await this before their entrance; it settles one frame after the first mount, so
// the entrance starts from painted DOM and nothing waits on anything else.
export const loaderGone: Promise<void> = firstRender.then(
  () => new Promise<void>((r) => requestAnimationFrame(() => r())),
);
