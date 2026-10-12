# PhotoPop Website

Marketing and booking site for PhotoPop — photo booth rental in Colombo, Sri Lanka.

Built from the specification in `../Website_Architecture.md`.

- **Stack:** Astro 7 (static output) + Tailwind CSS 4
- **Hosting:** GitHub Pages, published by the GitHub Actions pipeline in `.github/workflows/deploy.yml`
- **Repository:** public — never commit anything you wouldn't print on a flyer
- **Booking:** embedded Google Form — no server, no secrets, no backend to maintain
- **Running cost:** the domain only

**Launching or updating content? Start with [`docs/LAUNCH_GUIDE.md`](docs/LAUNCH_GUIDE.md)** —
details, photos and hosting, step by step.

---

## Quick start

Needs Node.js 22 or newer.

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:4321

| Command | Does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build into `dist/` — what the pipeline runs |
| `npm run preview` | Serve the built `dist/` locally |
| `npm run brand` | Regenerate logo, link-preview card and icons from `brand/photopop-logo.png` |
| `npm run preview:bundle` | Whole site as one shareable file in `preview/` (run `build` first) |
| `npm run placeholders` | Recreate the pink placeholder photos |

---

## Where things live

| What | Where |
|---|---|
| **Prices, packages, contact details, social handles, SEO copy, launch state** | [`src/config.yaml`](src/config.yaml) |
| Photos (hero, team, gallery) | `src/assets/photos/` — a `.jpg` beats a `.svg` placeholder of the same name |
| About-page founders' section | `about` in `config.yaml` — off, with names left blank (the repo is public) |
| Strip GPS/camera data from photos before committing | `npm run photos:clean` |
| Gallery order, captions, categories | `src/data/gallery.json` |
| Logo master | `brand/photopop-logo.png` → `npm run brand` |
| FAQ questions and answers | `src/pages/faq.astro` |
| Terms / Privacy wording | `src/pages/terms.astro`, `src/pages/privacy.astro` |
| Brand colours and fonts | `src/styles/global.css` (`@theme` block) |
| Old-address redirects | `redirects` in `astro.config.mjs` |
| Build-and-deploy pipeline | `.github/workflows/deploy.yml` — `develop` builds, `main` publishes |
| What to photograph | [`docs/IMAGE_SHOT_LIST.md`](docs/IMAGE_SHOT_LIST.md) |
| Google Form setup | [`docs/GOOGLE_FORM_SETUP.md`](docs/GOOGLE_FORM_SETUP.md) |

---

## Before launch

Values still holding placeholders — each is covered in the launch guide:

- [ ] **Phone / WhatsApp** — `+94XXXXXXXXX`. Until it's real, WhatsApp buttons stay hidden and visitors are offered email.
- [ ] **Email addresses** must receive mail — `hello@` and `bookings@photopop.lk` are linked throughout.
- [ ] **Social handles** — confirm each account exists, or blank it to hide it.
- [ ] **Google Form ID** — until set, `/book` shows a WhatsApp/email panel.
- [ ] **Real photos** — at least the hero.
- [ ] **Domain** — register `photopop.lk` and add it as the GitHub Pages custom domain.
- [ ] **Analytics** (optional) — no tracking script loads until a GA4 ID is set.

### After your first real events

Set `launch.pre_launch: false` and fill in `metrics` and `testimonials`. Until
then the site shows a founding-client offer instead of event counters, and the
testimonial section doesn't render. The spec's sample config pre-filled "50+
events, 48 five-star reviews" and three named testimonials; publishing those as
real would be fabricated reviews.

The business structured data never includes a review rating — Google doesn't
allow a local business to mark up reviews of itself on its own site, genuine or
not. Star ratings in search come from the Google Business Profile.

---

## Design

Single-accent palette built around the logo:

| Token | Hex | Use |
|---|---|---|
| Logo pink | `#FA70A5` | Measured from the logo; ≈ `brand-400` |
| `brand-500` | `#F04E96` | Large display text, icons, decorative |
| `brand-600` | `#D02873` | **Buttons and small pink text** — passes WCAG AA (4.96:1) with white |
| `ink` | `#1A1A1D` | Body text, dark sections |
| `ink-muted` | `#6E6E76` | Captions — 5:1 on white |

The brighter pinks fail contrast with white text at button size (3.4:1), so
buttons use `brand-600`. Large headings can use `brand-500` because large text
only needs 3:1.

**Typeface: DM Sans.** Google Sans isn't licensed for use outside Google's own
products and isn't served by Google Fonts. DM Sans — commissioned by Google
from Colophon — is the closest openly licensed relative. To change it, edit the
two `--font-*` tokens in `global.css` and the font `<link>` in
`src/components/SEO.astro`.

Flat by design: hairline borders, no drop shadows, one accent colour, generous
white space.

## Notes on the build

- **Static only.** No adapter, no SSR, no API routes. The spec's Telegram +
  SendGrid form pipeline (§7) was swapped for a Google Form so no server is
  needed. Going back means adding an Astro adapter and one API route.
- **Photos are optimised at build time.** `src/components/Photo.astro` resizes
  each photo to the widths its slot needs, as WebP, with a `srcset`. EXIF
  (including GPS) is stripped. An integration in `astro.config.mjs` then deletes
  the originals from `dist/` so they can't be downloaded — they'd otherwise be
  copied in unused, metadata and all.
- **URLs have no trailing slash or extension.** Pages build as `about.html`,
  which GitHub Pages serves at `/about`. Links, canonical tags and the sitemap all
  use that one form, so no redirect hops.
- **`/book`, not `/book/quote`.** Every marketing link in the spec points at
  `/book`. The `redirects` setting in `astro.config.mjs` writes a forwarding
  page at the old path, which works on any host.
- **The site address comes from the pipeline.** `site` in `astro.config.mjs`
  reads `SITE_URL`, which the workflow sets to the live Pages address — so
  canonical links, the sitemap, `robots.txt` (generated by
  `src/pages/robots.txt.ts`) and preview-card URLs follow a custom domain
  automatically. Local builds default to `https://photopop.lk`.
- **No founders' names in the code.** The repository is public, so team
  members live in `about.team` in `config.yaml`, left blank until the owners
  choose to be named. `npm run photos:clean` strips GPS and camera data from
  committed photos for the same reason.
- **Zero client JS on most pages.** Only the header menu, gallery filter and
  lightbox, and FAQ search ship any script. FAQ accordions are native
  `<details>` and work with JavaScript off.
- **`npm audit`** reports two "high" items, both one issue: `http-cache-semantics`
  inside Astro, used for caching remote images on a server. This site is static
  and loads no remote images, so it isn't reachable; npm's offered fix is a
  downgrade to Astro 2. Recheck after Astro updates.
