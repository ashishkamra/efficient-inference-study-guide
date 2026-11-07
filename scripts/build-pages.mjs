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
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
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
copyFileSync(join(OUTPUT, "index.html"), join(OUTPUT, "404.html"));

// Jekyll ignores directories starting with `_`, which would drop `__grok/`.
writeFileSync(join(OUTPUT, ".nojekyll"), "");

console.log(`[pages] wrote manifest, 404.html and .nojekyll`);
console.log(`[pages] artifact ready at ${relative(ROOT, OUTPUT)}`);
