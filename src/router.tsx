import { createRouter } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { previewPathRewrite } from "@/lib/preview-path-prefix";
import { routeTree } from "./routeTree.gen";

/**
 * GitHub Pages project sites live under `/<repo>/`; Vite exposes that base as
 * `BASE_URL`. Vercel and the live preview keep `/`. TanStack Start injects the
 * same value server-side, but the client router is created here first.
 */
const basepath = import.meta.env.BASE_URL.replace(/\/+$/, "") || "/";

export function getRouter() {
  return createRouter({
    routeTree,
    basepath,
    rewrite: previewPathRewrite(),
    defaultErrorComponent: AppErrorComponent,
  });
}
