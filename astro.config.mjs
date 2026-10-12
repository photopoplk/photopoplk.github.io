// @ts-check
import { readdirSync, readFileSync, statSync, unlinkSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

/**
 * Astro copies every imported photo's original file into the build, even when
 * the site only ever serves resized WebP versions. Those originals are large,
 * and phone photos carry EXIF metadata — including GPS coordinates of where a
 * client's event happened. The resized versions are already stripped of it.
 *
 * After the build, this deletes any image in dist/_astro that no page, style
 * or script references. It runs inside `astro build`, so it applies on
 * the GitHub Actions pipeline too, not just on this machine.
 */
function stripUnusedOriginals() {
  // .svg too: a placeholder overridden by a real photo is imported but never shown.
  const IMAGE = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.tif', '.tiff', '.svg']);
  const TEXT = new Set(['.html', '.css', '.js', '.mjs', '.xml', '.json', '.txt']);

  /** @param {string} dir @returns {string[]} */
  const walk = (dir) =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)]
    );

  return {
    name: 'photopop:strip-unused-originals',
    hooks: {
      /** @param {{ dir: URL, logger: import('astro').AstroIntegrationLogger }} options */
      'astro:build:done': ({ dir, logger }) => {
        const out = fileURLToPath(dir);
        const files = walk(out);
        const text = files
          .filter((f) => TEXT.has(extname(f).toLowerCase()))
          .map((f) => readFileSync(f, 'utf8'))
          .join('\n');

        let removed = 0;
        let bytes = 0;
        for (const file of files) {
          if (!file.includes('_astro') || !IMAGE.has(extname(file).toLowerCase())) continue;
          const name = file.slice(file.lastIndexOf(file.includes('\\') ? '\\' : '/') + 1);
          if (text.includes(name)) continue;
          bytes += statSync(file).size;
          unlinkSync(file);
          removed += 1;
        }
        if (removed) {
          logger.info(
            `Removed ${removed} unused original photo${removed === 1 ? '' : 's'} ` +
              `(${(bytes / 1024 / 1024).toFixed(1)} MB) — only resized, metadata-free copies ship.`
          );
        }
      },
    },
  };
}

// https://astro.build/config
export default defineConfig({
  // The address the site is served from. The GitHub Actions pipeline sets
  // SITE_URL to the live GitHub Pages address — photopoplk.github.io today,
  // photopop.lk automatically once that custom domain is connected — so
  // canonical links, the sitemap and link-preview images always point at the
  // site people are actually on. Local builds fall back to the final domain.
  site: process.env.SITE_URL || 'https://photopop.lk',

  // Pages build to about.html (not about/index.html) and URLs never end in a
  // slash. GitHub Pages serves about.html at /about directly, so the nav links,
  // canonical tags and sitemap all agree on one URL with no redirect.
  build: { format: 'file' },
  trailingSlash: 'never',

  // Old addresses that may already be printed or shared. Astro writes a small
  // page at each that forwards to the new one — works on any host.
  redirects: {
    '/book/quote': '/book',
    '/quote': '/book',
    '/booking': '/book',
  },

  integrations: [
    sitemap({
      // /thank-you is noindex and disallowed in robots.txt — listing it in the
      // sitemap too would send search engines contradictory signals.
      filter: (page) => !page.includes('/thank-you'),
    }),
    stripUnusedOriginals(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
