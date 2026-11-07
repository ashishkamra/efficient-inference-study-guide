/**
 * Resolve a public asset path against Vite's configured base.
 *
 * On Vercel and the live preview the base is `/`, so every path is returned
 * unchanged. A GitHub Pages project site is served from `/<repo>/`, where
 * hard-coded `/videos/...` or `/favicon.svg` URLs would miss the app.
 */
const BASE_URL = import.meta.env?.BASE_URL ?? "/";

export function assetUrl(path: string): string {
  if (!path.startsWith("/")) return path;
  const base = BASE_URL.replace(/\/+$/, "");
  if (!base) return path;
  return `${base}${path}`;
}
