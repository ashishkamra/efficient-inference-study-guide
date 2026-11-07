#!/usr/bin/env node
/**
 * Build the static GitHub Pages artifact.
 *
 * GitHub Pages project sites are served from `/<repo>/`, so the app is built
 * with `GITHUB_PAGES_BASE` set: Vite rewrites asset URLs, TanStack Start
 * derives the router basepath, and every route is prerendered to real HTML.
 *
 * This wrapper then makes the static output self-contained:
 *  - rewrites the handful of platform/root-absolute URLs (`/favicon.svg`,
 *    `/__grok/*`, `/videos/*`) that React renders at runtime,
 *  - writes the PWA manifest that the Nitro middleware normally serves,
 *  - copies a client-routing fallback to `404.html`,
 *  - adds `.nojekyll` so `__grok/` is not stripped by Jekyll.
 *
 * Deploy `.output/public`. Vercel keeps using `npm run build` untouched.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { injectGrokPwaHead } from "./grok-pwa-shared.mjs";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUTPUT = join(ROOT, ".output/public");
const APP_NAME = "Ridge · Efficient LLM inference";
const THEME_COLOR = "#f3efe6";

function resolveRepository() {
  const fromEnv = (process.env.GITHUB_REPOSITORY ?? "").trim();
  if (fromEnv.includes("/")) return fromEnv;
  try {
    const remote = execFileSync("git", ["remote", "get-url", "origin"], {
      cwd: ROOT,
      encoding: "utf8",
    }).trim();
    const match = remote.match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/i);
    if (match) return `${match[1]}/${match[2]}`;
  } catch {
    // No git remote: fall through to the explicit env vars below.
  }
  return "";
}

function normalizeBase(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed || trimmed === "/") return "/";
  return `/${trimmed.replace(/^\/+|\/+$/g, "")}/`;
}

const repository = resolveRepository();
const [owner = "", name = ""] = repository.split("/");
const explicitBase = process.env.GITHUB_PAGES_BASE?.trim();
const isUserSite = Boolean(owner && name && name.toLowerCase() === `${owner.toLowerCase()}.github.io`);
const base = normalizeBase(explicitBase || (name ? (isUserSite ? "/" : `/${name}/`) : ""));
if (base === "/" && !isUserSite) {
  throw new Error(
    "Cannot determine the GitHub Pages base path. Set GITHUB_PAGES_BASE (for example /my-repo/).",
  );
}
const host = (process.env.GITHUB_PAGES_HOST ?? "").trim() || (owner ? `${owner.toLowerCase()}.github.io` : "");
if (!host) {
  throw new Error("Cannot determine the GitHub Pages host. Set GITHUB_PAGES_HOST.");
}
const baseNoSlash = base.replace(/\/$/, "");

console.log(`[pages] repository ${repository || "(local)"}`);
console.log(`[pages] base ${base}`);
console.log(`[pages] host ${host}`);

rmSync(join(ROOT, ".output"), { recursive: true, force: true });
const build = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build"], {
  cwd: ROOT,
  stdio: "inherit",
  env: { ...process.env, GITHUB_PAGES_BASE: base },
});
if (build.error) throw build.error;
if (build.status !== 0) process.exit(build.status ?? 1);

if (!existsSync(join(OUTPUT, "index.html"))) {
  throw new Error(`Prerender did not produce ${join(OUTPUT, "index.html")}`);
}

/** Every root-absolute URL React rendered, plus platform PWA tags. */
function rewriteHtml(html, clientStylesheet) {
  // Root head already emits base-aware manifest/icon links; the preview PWA
  // injector also adds absolute copies. Keep exactly one of each.
  let next = html.replace(
    /<link\b[^>]*\brel="(?:manifest|apple-touch-icon)"[^>]*>/gi,
    "",
  );

  next = injectGrokPwaHead(next, { host, cwd: ROOT });

  // Prerendering runs against the SSR environment's asset manifest, so the
  // HTML references the SSR hashed stylesheet — a file the client build never
  // emits. Point it at the real client bundle stylesheet.
  if (clientStylesheet) {
    next = next.replace(/assets\/styles-[A-Za-z0-9_-]+\.css/g, `assets/${clientStylesheet}`);
  }

  next = next.replace(
    /\b(href|src|poster|action)="(\/(?!\/)[^"]*)"/g,
    (whole, attribute, path) => {
      if (path === baseNoSlash || path.startsWith(`${baseNoSlash}/`)) return whole;
      return `${attribute}="${baseNoSlash}${path}"`;
    },
  );

  // The share-card URL is absolute (it must be for social crawlers), but the
  // file lives under the project base on Pages.
  next = next.replaceAll(`https://${host}/`, `https://${host}${base}`);
  return next;
}

function htmlFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) files.push(...htmlFiles(path));
    else if (entry.endsWith(".html")) files.push(path);
  }
  return files;
}

const files = htmlFiles(OUTPUT);
const assetsDir = join(OUTPUT, "assets");
const clientStylesheet = existsSync(assetsDir)
  ? readdirSync(assetsDir).find((file) => /^styles-.*\.css$/.test(file))
  : undefined;
for (const file of files) {
  writeFileSync(file, rewriteHtml(readFileSync(file, "utf8"), clientStylesheet));
}
console.log(`[pages] rewrote ${files.length} prerendered pages`);

// The Nitro middleware serves this dynamically on Vercel; static hosting
// needs it on disk, scoped to the project base.
const manifestDir = join(OUTPUT, "__grok");
mkdirSync(manifestDir, { recursive: true });
writeFileSync(
  join(manifestDir, "manifest.webmanifest"),
  `${JSON.stringify(
    {
      name: APP_NAME,
      short_name: "Ridge",
      id: base,
      start_url: base,
      scope: base,
      display: "standalone",
      background_color: THEME_COLOR,
      theme_color: THEME_COLOR,
      icons: [
        {
          src: `${base}__grok/icon-180.png`,
          sizes: "180x180",
          type: "image/png",
        },
      ],
    },
    null,
    2,
  )}\n`,
);

// Client-side fallback for unknown/deep links. Real routes are prerendered.
// Keep this standalone: copying the home document would serialize the home
// router state and then hydrate against a different URL (React error #418).
writeFileSync(
  join(OUTPUT, "404.html"),
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Page not found · Ridge</title>
<meta name="robots" content="noindex">
<link rel="icon" type="image/svg+xml" href="${base}favicon.svg">
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 24px;
    background: #f3efe6;
    color: #241f19;
    font-family: "Figtree", ui-sans-serif, system-ui, sans-serif;
  }
  main { max-width: 34rem; }
  .kicker {
    margin: 0 0 12px;
    font-family: ui-monospace, "IBM Plex Mono", monospace;
    font-size: 12px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: #a4481f;
  }
  h1 {
    margin: 0 0 12px;
    font-family: "Fraunces", Georgia, serif;
    font-size: clamp(2rem, 6vw, 3rem);
    line-height: 1.05;
  }
  p { margin: 0 0 24px; color: #5d554a; line-height: 1.6; }
  a {
    display: inline-flex;
    min-height: 44px;
    align-items: center;
    padding: 0 20px;
    border-radius: 999px;
    background: #a4481f;
    color: #fffaf2;
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
  }
  a:focus-visible { outline: 2px solid #241f19; outline-offset: 3px; }
</style>
</head>
<body>
<main>
  <p class="kicker">404 · Ridge inference studio</p>
  <h1>That page is not in the study guide.</h1>
  <p>The lecture, lab, or reference you asked for does not exist. Head back to the path and pick up where you left off.</p>
  <a href="${base}">Back to the study path</a>
</main>
</body>
</html>
`,
);

// Jekyll ignores directories starting with `_`, which would drop `__grok/`.
writeFileSync(join(OUTPUT, ".nojekyll"), "");

console.log(`[pages] wrote manifest, 404.html and .nojekyll`);
console.log(`[pages] artifact ready at ${relative(ROOT, OUTPUT)}`);
