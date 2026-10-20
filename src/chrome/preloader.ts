import { markLoaderGone } from "../core/ready";

export function runPreloader() {
  return {
    async done() {
      document.getElementById("loader")?.remove();
      markLoaderGone();
    },
  };
}
