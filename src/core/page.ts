// Contract every page module implements. Pages render into `root` and
// return a cleanup function that kills tweens, ScrollTriggers and listeners.
export interface PageContext {
  root: HTMLElement;
  params: Record<string, string>;
  /** true when this is the first page shown after the preloader */
  first: boolean;
}

export type Cleanup = () => void;

export interface Page {
  title: string | ((params: Record<string, string>) => string);
  /** short label shown in the chrome, eg "Toolbox" */
  section: string;
  mount(ctx: PageContext): Cleanup | void | Promise<Cleanup | void>;
}
