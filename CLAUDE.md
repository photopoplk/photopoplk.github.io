# CLAUDE.md — PhotoPop website

Marketing site for **PhotoPop**, a photo booth rental business in Colombo,
Sri Lanka. Live at https://photopoplk.github.io (custom domain `photopop.lk`
not registered yet). Read `README.md` before changing code; owner-facing steps
are in `docs/LAUNCH_GUIDE.md`.

> **This repository is PUBLIC.** Everything committed — including history —
> can be read by anyone. See "Hard rules" below.

## Stack and commands

Astro 7 (static output) + Tailwind 4 (`@tailwindcss/vite`, tokens in
`src/styles/global.css`), DM Sans. Node 22 (`.nvmrc`). No server, no secrets.

| Command | What it does |
|---|---|
| `npm ci` | Install (cloud sessions do this automatically via `.claude/settings.json`) |
| `npm run dev` | Dev server on http://localhost:4321 |
| `npm run build` | Production build into `dist/` — **run before every commit**; it must pass |
| `npm run photos:clean` | Strip GPS/camera metadata from photos (lossless) — **run before committing any photo** |
| `npm run brand` | Regenerate logo, favicon, icons and link-preview card from `brand/` |
| `npm run form:fields` | Read the live Google Form's questions (needs network access to docs.google.com) |
| `npm run preview:bundle` | One-file preview of the built site in `preview/` (not deployed) |

## Where content lives — edit data, not pages

- `src/config.yaml` — contact details, packages, prices, comparison table,
  add-ons, launch state, booking form fields, SEO. Most changes belong here.
- `src/data/gallery.json` — gallery order, captions, alt text, categories.
- `src/assets/photos/` — site photos. A `.jpg` beats the `.svg` placeholder of
  the same name. The build resizes to WebP and drops originals from `dist/`.
- `src/pages/*.astro` — page copy that isn't in config (FAQ, Terms, Privacy, About).
- `brand/` — logo and favicon masters.

## Branches and publishing

- `develop` = work branch; GitHub Actions only **builds** it.
- `main` = live site; every push to `main` **deploys** to GitHub Pages.
- **Cloud / agent sessions:** branch off `develop`, push that branch, and open
  a pull request **into `develop`**. Never push to `main`, never open a PR into
  `main`, never merge anything. The owner reviews, merges into `develop`, and
  publishes by merging `develop` into `main`.
- Commit author for this repo is `PhotoPop LK` (the `photopoplk` GitHub account).

## Hard rules

1. **Founders stay anonymous.** Never add personal names, personal email
   addresses, personal social accounts, home locations or local computer paths
   to any file, commit message or PR. `about.show_team` stays `false` and the
   `about.team` entries stay blank until the owner says otherwise.
2. **No fabricated social proof.** PhotoPop is pre-launch. No invented event
   counts, reviews, testimonials or ratings. `launch.pre_launch: true` keeps
   those components hidden; only the owner flips it, with real numbers.
3. **No review/rating structured data, ever** (`aggregateRating`, `Review`) —
   Google does not allow self-serving review markup.
4. **Services not offered** — do not add back: 360 video booth, digital guest
   book, live social display, dual/second booth. PhotoPop has **one booth**.
5. **Facts that must stay consistent everywhere:**
   - Every package includes an on-site PhotoPop operator for the whole event
     (Diamond adds a second crew member).
   - Every package includes unlimited prints at the booth **and** cloud photo
     sharing within **24 hours** (WhatsApp-friendly — don't promise direct
     WhatsApp delivery).
   - Prices are shown as "from LKR …" — never exact totals.
6. **Gallery photos are AI-made illustrations** until real event photos exist.
   `"illustrative": true` in `gallery.json` keeps them labelled as such; set it
   to `false` only when every gallery photo is from a real PhotoPop event.
7. **Booking form must match the Google Form.** Each `entry` ID and option text
   in `booking.form_sections` must match the live form exactly, or Google
   silently drops the answer. See `docs/GOOGLE_FORM_SETUP.md`.
8. **Colours:** use the tokens in `global.css`. Buttons and small pink text use
   the darker brand pink (WCAG AA with white); the light logo pink is for large
   text and icons only.
9. Keep the site static — no adapter, server, API routes or secrets.

## Before you finish

1. `npm run build` passes.
2. Search your diff for anything that breaks rule 1 (names, emails, paths).
3. Commit with a clear message, push your branch, open the PR into `develop`.
