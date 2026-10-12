/**
 * Bundles the built site (dist/) into a single self-contained HTML file that
 * can be opened anywhere — phone, tablet, someone else's laptop — with no dev
 * server and no network access to this machine.
 *
 *   npm run build && npm run preview:bundle
 *   -> preview/photopop-preview.html
 *
 * Written outside dist/ on purpose: anything in dist/ gets deployed, and a
 * second copy of every page at /preview would count as duplicate content.
 *
 * How it works: the site chrome (header, footer, floating button) is taken once
 * from the home page, each page's <main> is inlined as a hidden section, and
 * internal links are rewired to swap sections client-side. Every stylesheet and
 * image is inlined, so the file has no external dependencies except the Google
 * Fonts stylesheet.
 *
 * This is a review snapshot, not the real site: the Google Form embed and other
 * third-party frames still need a live connection, and URLs do not change as
 * you navigate.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

if (!existsSync(join(dist, 'index.html'))) {
  console.error('dist/ not found — run `npm run build` first.');
  process.exit(1);
}

/** Route slug -> URL path, in the order they appear in the page switcher. */
const PAGES = [
  { id: 'home', label: 'Home', path: '/' },
  { id: 'packages', label: 'Packages', path: '/packages' },
  { id: 'gallery', label: 'Gallery', path: '/gallery' },
  { id: 'about', label: 'About', path: '/about' },
  { id: 'book', label: 'Book', path: '/book' },
  { id: 'faq', label: 'FAQ', path: '/faq' },
  { id: 'thank-you', label: 'Thank You', path: '/thank-you' },
  { id: 'terms', label: 'Terms', path: '/terms' },
  { id: 'privacy', label: 'Privacy', path: '/privacy' },
  { id: '404', label: '404', path: '/404' },
];

const read = (file) => readFileSync(join(dist, file), 'utf8');

/** Works with either build layout: about.html or about/index.html. */
function pageFile(page) {
  if (page.path === '/') return 'index.html';
  const slug = page.path.slice(1);
  for (const candidate of [`${slug}.html`, `${slug}/index.html`]) {
    if (existsSync(join(dist, candidate))) return candidate;
  }
  throw new Error(`No built file for ${page.path} — run \`npm run build\` first.`);
}

const between = (html, open, close) => {
  const start = html.indexOf(open);
  if (start === -1) return '';
  const from = html.indexOf('>', start) + 1;
  const end = html.lastIndexOf(close);
  return end === -1 ? '' : html.slice(from, end);
};

/** Inline every stylesheet the build emitted. */
function collectStyles(html) {
  const out = [];
  for (const m of html.matchAll(/<link[^>]+rel="stylesheet"[^>]*>/g)) {
    const href = m[0].match(/href="([^"]+)"/)?.[1];
    if (!href) continue;
    if (href.startsWith('http')) {
      out.push(m[0]); // Google Fonts — allowed through the artifact CSP.
    } else {
      out.push(`<style>${read(href.replace(/^\//, ''))}</style>`);
    }
  }
  return out.join('\n');
}

const MIME = {
  svg: 'image/svg+xml',
  png: 'image/png',
  webp: 'image/webp',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  avif: 'image/avif',
  ico: 'image/x-icon',
};

/** Turn a local image path into an inline data URI. */
const dataUriCache = new Map();
function toDataUri(path) {
  if (dataUriCache.has(path)) return dataUriCache.get(path);
  const file = path.replace(/^\//, '');
  const ext = file.split('.').pop().toLowerCase();
  let uri = path;
  try {
    if (ext === 'svg') {
      uri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(read(file))}`;
    } else {
      uri = `data:${MIME[ext]};base64,${readFileSync(join(dist, file)).toString('base64')}`;
    }
  } catch {
    console.warn(`  ! missing asset: ${path}`);
  }
  dataUriCache.set(path, uri);
  return uri;
}

/**
 * Inline every local image — logo, photos, lightbox targets. srcset/sizes are
 * dropped: the preview keeps each image's single fallback src (capped at
 * 1000 px), which keeps the file small enough to open quickly on a phone.
 */
function inlineImages(html) {
  return html
    .replace(/\s(srcset|sizes)="[^"]*"/g, '')
    .replace(
      /(src|href|data-full)="(\/[^"]+\.(?:svg|png|webp|jpe?g|avif|ico))"/gi,
      (_, attr, path) => `${attr}="${toDataUri(path)}"`
    );
}

/**
 * Rewrite internal links to router hooks. External links (mailto, wa.me,
 * Google Forms, socials) are left alone and open in a new tab.
 */
function rewireLinks(html) {
  return html.replace(/href="(\/[^"]*)"/g, (whole, href) => {
    if (href.startsWith('//')) return whole;
    const clean = href.split(/[?#]/)[0].replace(/\/$/, '') || '/';
    const page = PAGES.find((p) => p.path === clean);
    return page ? `href="#${page.id}" data-route="${page.id}"` : whole;
  });
}

const homeHtml = read('index.html');
const styles = collectStyles(homeHtml);
const homeBody = between(homeHtml, '<body', '</body>');

// Site chrome, taken once so IDs stay unique across the whole document.
const header = homeBody.match(/<header[\s\S]*?<\/header>/)?.[0] ?? '';
const footer = homeBody.match(/<footer[\s\S]*?<\/footer>/)?.[0] ?? '';
const skipLink = homeBody.match(/<a href="#main"[\s\S]*?<\/a>/)?.[0] ?? '';
// The floating contact button is the last top-level anchor in the body.
const floatBtn = homeBody.match(/<a href="mailto:[^"]*"[^>]*class="[^"]*fixed[\s\S]*?<\/a>/)?.[0]
  ?? homeBody.match(/<a href="https:\/\/wa\.me[^"]*"[^>]*class="[^"]*fixed[\s\S]*?<\/a>/)?.[0]
  ?? '';

// Every page's <main>, plus the scripts each page needs.
const sections = [];
const scripts = new Set();

for (const page of PAGES) {
  const html = read(pageFile(page));
  const main = html.match(/<main[\s\S]*?<\/main>/)?.[0] ?? '';
  sections.push(
    `<div class="pp-page" data-page="${page.id}" ${page.id === 'home' ? '' : 'hidden'}>${main}</div>`
  );
  for (const m of html.matchAll(/<script type="module">([\s\S]*?)<\/script>/g)) {
    scripts.add(m[1]);
  }
}

const chromeScripts = [...homeHtml.matchAll(/<script type="module">([\s\S]*?)<\/script>/g)].map(
  (m) => m[1]
);
chromeScripts.forEach((s) => scripts.add(s));

const body = inlineImages(
  rewireLinks(
    [skipLink, header, `<div id="pp-pages">${sections.join('\n')}</div>`, footer, floatBtn].join('\n')
  )
);

const switcher = PAGES.map(
  (p) =>
    `<button type="button" class="pp-pill" data-route="${p.id}" aria-current="${p.id === 'home'}">${p.label}</button>`
).join('');

const out = `<title>PhotoPop Site Preview</title>
${styles}
<style>
  /* Preview chrome only — everything below #pp-bar is the site's own CSS.
     Committed to a light ground because the site itself is a light-mode
     design; showing it on a dark host ground would misrepresent it. */
  :root { color-scheme: light; }
  html, body { background: #ffffff; }
  #pp-bar {
    background: #1a1a1d;
    color: #ffffff;
    font-family: "DM Sans", ui-sans-serif, system-ui, Arial, sans-serif;
    padding: 10px 0 12px;
  }
  #pp-bar .pp-inner { max-width: 72rem; margin: 0 auto; padding: 0 16px; }
  #pp-bar .pp-title {
    font-size: 11px; letter-spacing: .16em; text-transform: uppercase;
    color: #8b8b93; margin: 0 0 8px;
  }
  #pp-bar .pp-title b { color: #ffffff; font-weight: 500; letter-spacing: .04em; }
  #pp-scroll {
    display: flex; gap: 6px; overflow-x: auto; padding-bottom: 2px;
    scrollbar-width: none; -webkit-overflow-scrolling: touch;
  }
  #pp-scroll::-webkit-scrollbar { display: none; }
  .pp-pill {
    flex: 0 0 auto; cursor: pointer;
    background: transparent; color: #c9c9d1;
    border: 1px solid #3a3a40; border-radius: 999px;
    padding: 7px 14px; font: inherit; font-size: 13px; font-weight: 500;
    transition: background-color .15s, color .15s, border-color .15s;
  }
  .pp-pill:hover { color: #ffffff; border-color: #6a6a72; }
  .pp-pill[aria-current="true"] {
    background: #f04e96; border-color: #f04e96; color: #ffffff;
  }
  .pp-pill:focus-visible { outline: 2px solid #f04e96; outline-offset: 2px; }
  .pp-note {
    margin: 8px 0 0; font-size: 11.5px; line-height: 1.5; color: #8b8b93;
  }
  @media (prefers-reduced-motion: reduce) { .pp-pill { transition: none; } }
</style>

<div id="pp-bar">
  <div class="pp-inner">
    <p class="pp-title"><b>photopop.lk</b> &nbsp;·&nbsp; static preview</p>
    <div id="pp-scroll">${switcher}</div>
    <p class="pp-note">All 10 pages. Links work; the booking form needs the live site.</p>
  </div>
</div>

${body}

<script type="module">
// --- Preview router ---------------------------------------------------------
const pages = document.querySelectorAll('#pp-pages .pp-page');
const pills = document.querySelectorAll('.pp-pill');

function show(id) {
  let matched = false;
  pages.forEach((page) => {
    const hit = page.dataset.page === id;
    page.hidden = !hit;
    if (hit) matched = true;
  });
  if (!matched) return;
  pills.forEach((pill) => pill.setAttribute('aria-current', String(pill.dataset.route === id)));
  document.querySelectorAll('header a[data-route]').forEach((link) => {
    link.setAttribute('aria-current', link.dataset.route === id ? 'page' : 'false');
  });
  window.scrollTo({ top: 0, behavior: 'instant' });
}

document.addEventListener('click', (event) => {
  const target = event.target.closest('[data-route]');
  if (!target) return;
  event.preventDefault();
  const id = target.dataset.route;
  history.replaceState(null, '', '#' + id);
  show(id);
});

if (location.hash) show(location.hash.slice(1));
</script>

${[...scripts].map((s) => `<script type="module">${s}</script>`).join('\n')}
`;

const outDir = join(root, 'preview');
mkdirSync(outDir, { recursive: true });
const target = join(outDir, 'photopop-preview.html');
writeFileSync(target, out, 'utf8');
console.log(
  `Wrote ${target} — ${PAGES.length} pages, ${(Buffer.byteLength(out) / 1024).toFixed(0)} KB`
);
