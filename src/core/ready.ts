// Resolves when the preloader has fully left the screen. Pages mounted with
// ctx.first === true should await this before playing intro animations.
let resolve!: () => void;
export const loaderGone = new Promise<void>((r) => (resolve = r));
export const markLoaderGone = () => resolve();

// Resolves once the first page's mount() has been called (DOM is in place).
let resolveRender!: () => void;
export const firstRender = new Promise<void>((r) => (resolveRender = r));
export const markFirstRender = () => resolveRender();
