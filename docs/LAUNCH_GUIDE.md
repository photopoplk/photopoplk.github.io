# PhotoPop Website — Launch Guide

Everything between "the site is built" and "photopop.lk is live", in order.

| Part | What | Time |
|---|---|---|
| [1](#part-1--your-details) | Fill in your details | 20 min |
| [2](#part-2--photos) | Add photos | as long as choosing them takes |
| [3](#part-3--publishing-with-github-pages) | Publish, then connect photopop.lk | 15 min to go live; 1–2 hours for the domain and email |
| [4](#part-4--after-your-first-events) | After your first events | 10 min |

All commands run from the website's folder — the one containing `package.json`. In VS Code, **Terminal → New Terminal** opens a terminal there.

---

## What's already done

- All 10 pages built, mobile-tested, accessibility-checked
- **Your logo** (`photopop_logo_v1.png`) is in: header, link-preview card, browser tab icon, phone home-screen icon
- Photos are optimised automatically — drop in phone photos at any size
- The code is on GitHub at **photopoplk/photopoplk.github.io** (`develop` branch), with a build-and-deploy pipeline
- Old addresses (`/book/quote`) forward to `/book`
- **The founders' section is switched off, and your names aren't anywhere in the code** — the repository is public. See [Part 4](#when-youre-ready-to-introduce-yourselves)

Everything still marked **TODO** below is yours to supply.

---

## Part 1 — Your details

Almost everything lives in one file: **`src/config.yaml`**. Open it in any text editor (Notepad works; VS Code is nicer).

### What to fill in

| Setting | Put this | If you leave it |
|---|---|---|
| `contact.phone` | `"+94771234567"` — country code, no spaces | WhatsApp buttons and phone links stay hidden; visitors are offered email instead |
| `contact.whatsapp` | Usually the same number | Same as above |
| `contact.email` | An address that **actually receives mail** — see [Part 3, step 6](#6-set-up-email) | Every "Email us" button sends mail into the void |
| `contact.bookings_email` | Same rule. Fine to use the same address as `email` | Same |
| `social.instagram` / `facebook` / `tiktok` | Just the handle: `photopoplk` — no `@`, no URL | **Blank (`""`) hides that platform everywhere.** Do this for any account you haven't created yet, so nobody clicks into a dead profile |
| `booking.google_form_id` | The long ID from your Google Form — [setup guide](GOOGLE_FORM_SETUP.md) | The Book page shows a WhatsApp/email panel instead of a form. Works, but nothing lands in a spreadsheet |
| `analytics.google_analytics_id` | `"G-XXXXXXXXXX"` — optional | No tracking at all, and the privacy page says so |
| `about.show_team` / `about.team` | Leave as they are for now | No founders' section. [Part 4](#when-youre-ready-to-introduce-yourselves) covers turning it on |

Prices, package features, add-ons and the "How it works" copy are in the same file, clearly labelled. Prices always appear on the site as **"from LKR X"** — never as an exact total.

> **The repository is public.** Anyone can read `config.yaml` on GitHub. Your phone number and email are meant to be public anyway, but don't put anything in this folder you wouldn't print on a flyer.

### Two rules for editing the file

1. **Text goes in `"double quotes"`.** If the text itself contains a `"`, write it as `\"`.
2. **Indent with spaces, never tabs.** Keep each line lined up with its neighbours.

Break either rule and the site won't build — it stops with a message naming the line, quoting it, and saying what usually causes it. Nothing broken ever goes live.

### Check your changes

```bash
npm run dev
```

Open <http://localhost:4321>. The page refreshes by itself every time you save. Press `Ctrl + C` in the terminal to stop.

---

## Part 2 — Photos

### Where photos live

```
src/assets/photos/
├── hero.svg            ← big photo beside the headline on the home page
├── team/               ← only used once the founders' section is on
│   ├── member-1.svg
│   └── member-2.svg
└── gallery/
    ├── wedding-01.svg … wedding-03.svg
    ├── corporate-01.svg … corporate-03.svg
    ├── birthday-01.svg … birthday-03.svg
    └── festival-01.svg … festival-03.svg
```

The `.svg` files are pink placeholders. What to shoot for each slot: [IMAGE_SHOT_LIST.md](IMAGE_SHOT_LIST.md).

### Replace a placeholder

**Put a photo next to it with the same name.** That's it.

```
gallery/wedding-01.svg   ← placeholder
gallery/wedding-01.jpg   ← your photo — wins automatically
```

A real photo always takes priority over a placeholder of the same name. Delete the `.svg` afterwards if you like; it makes no difference to visitors.

### Add a new gallery photo

1. Copy the photo into `src/assets/photos/gallery/`. Use a simple name — lowercase, dashes, no spaces: `wedding-04.jpg`.
2. Open `src/data/gallery.json` and add an entry to `items` (mind the comma between entries):

   ```json
   {
     "photo": "gallery/wedding-04",
     "alt": "Bride and groom laughing with oversized sunglasses props",
     "category": "weddings",
     "caption": "Wedding | Galle",
     "featured": false
   }
   ```

| Field | Meaning |
|---|---|
| `photo` | File name inside `src/assets/photos/`. The extension is optional |
| `alt` | What the photo shows, for blind visitors and Google. Describe the moment, not "photo of…" |
| `category` | `weddings`, `corporate`, `birthdays` or `festivals` — drives the filter buttons |
| `caption` | Shown on hover and in the enlarged view. Format: `Event type \| Location` |
| `featured` | `true` puts it on the home page. The first 6 featured photos are shown |

Entries appear in the order they're listed, and the filter buttons count them automatically.

**To remove a photo:** delete its entry from `gallery.json`. Deleting the file is optional.

If an entry names a file that doesn't exist, the build stops and lists the files that *are* in that folder — so a typo can't ship a broken image.

### Photo rules

- **Any size is fine.** A 12-megapixel phone photo is automatically resized to several smaller WebP versions; each visitor downloads only the size their screen needs. No manual compressing.
- **JPG, PNG or WebP only.** iPhones save as HEIC by default, which can't be read. Either set *Settings → Camera → Formats → Most Compatible* before the event, or AirDrop/email the photo to yourself, which usually converts it to JPG.
- **Portrait or landscape both work.** The gallery keeps each photo's own shape. The hero photo is cropped to a tall 4:5 frame, so keep the subject near the centre.
- **Run `npm run photos:clean` before committing new photos.** Phone photos carry hidden location data (GPS) — where your client's event was. The published site already strips it, but the files you commit go into the public repository as-is, where anyone can download them. This command removes the location and camera data from every photo in place, and turns sideways phone portraits upright. Safe to run any time; photos already clean are left alone.

### Before you publish anyone's photo

- **Get consent.** A quick "mind if we use this on our site?" at the event is enough — but get it.
- **Captions:** event type and town only. No full names, venue names or exact dates unless the client has said yes.
- Not sure about consent for a face? Don't use it. There are always other shots.

### Changing the logo

The master logo is `brand/photopop-logo.png`. If it ever changes, replace that file (keep the white background) and run:

```bash
npm run brand
```

That regenerates the header logo, the link-preview card, and all the icons from the one file.

---

## Part 3 — Publishing with GitHub Pages

The site lives in the public repository **[photopoplk/photopoplk.github.io](https://github.com/photopoplk/photopoplk.github.io)** and is published free by GitHub Pages. Running cost: the domain only — about LKR 3,000 a year by the original estimate.

> **Fine print.** GitHub's terms say Pages isn't meant to run an online business or e-commerce site. A brochure site for an in-person service like this is a common, generally accepted use. If PhotoPop ever takes payments or bookings directly through the site, move to Cloudflare Pages (free, and commercial use is explicitly allowed) — the site works there unchanged.

### How the pipeline works

| You push to | What happens | Visible at |
|---|---|---|
| `develop` | The site is **built and checked**. A green tick means it builds cleanly. Nothing goes live | Repo → **Actions** tab |
| `main` | Built, then **published** to the live site, about 2 minutes later | <https://photopoplk.github.io> |

So: work on `develop`; when you're happy, merge into `main` to publish.

### 1. One-time: switch Pages to the pipeline

GitHub Pages is currently set to publish straight from a branch, which would show the raw code. Switch it once:

**Repo → Settings → Pages → Build and deployment → Source → "GitHub Actions"**

Do this before step 2.

### 2. Publish: merge develop into main

On GitHub:

1. **Pull requests → New pull request**
2. Set **base: `main`** and **compare: `develop`** → **Create pull request**
3. The pipeline builds it and shows a check on the pull request. When it's green, **Merge pull request**

Then open the **Actions** tab: "Build and deploy" runs on `main`, with a **Deploy to GitHub Pages** step. When both steps are green, the site is live at **<https://photopoplk.github.io>**. Open it on your phone and click through every page.

### 3. Day to day

```bash
git checkout develop
```

Make your edits and check them with `npm run dev`. If you added photos:

```bash
npm run photos:clean
```

Then:

```bash
git add .
```

```bash
git commit -m "Add wedding photos from the Galle event"
```

```bash
git push
```

That builds on `develop`. To publish, open a pull request into `main` and merge it, as in step 2.

**Something went wrong after publishing?** Open the merged pull request on GitHub and press **Revert**, then merge the revert. The previous version is republished.

**Committing from another computer?** This copy is set to commit as *PhotoPop LK*, so your personal name and email never appear in the public history. Keep that on any other machine — run these once inside the folder:

```bash
git config user.name "PhotoPop LK"
```

```bash
git config user.email "340943619+photopoplk@users.noreply.github.com"
```

### 4. Register the domain

`.lk` domains are sold through the LK Domain Registry and its accredited resellers. If `photopop.lk` is taken, the plan's fallback is `photopoplk.com`.

### 5. Connect photopop.lk

1. Wherever the domain's DNS is managed (usually the registrar), add these records:

   | Type | Name | Value |
   |---|---|---|
   | A | `@` (the bare domain) | `185.199.108.153` |
   | A | `@` | `185.199.109.153` |
   | A | `@` | `185.199.110.153` |
   | A | `@` | `185.199.111.153` |
   | CNAME | `www` | `photopoplk.github.io` |

2. On GitHub: **Repo → Settings → Pages → Custom domain** → enter `photopop.lk` → **Save**. Wait for the DNS check to pass, then tick **Enforce HTTPS**. The certificate can take up to a day to appear.
3. Protect the domain: **your account's Settings → Pages → Add a domain**, and add the TXT record it shows you. This stops anyone else attaching `photopop.lk` to their own GitHub site.
4. Re-run the pipeline so every link switches to the new address: **Actions → Build and deploy → Run workflow → Branch: main**.

If you use Cloudflare for DNS, set those records to **DNS only** (grey cloud), not proxied — otherwise GitHub can't issue the HTTPS certificate.

### 6. Set up email

**Do this before launch.** The site's "Email us" buttons, the booking fallback, and the privacy page all point at `hello@photopop.lk` and `bookings@photopop.lk`. Until those addresses work, those messages bounce.

**Option A — Zoho Mail (the original plan).** A real inbox that sends and receives as `@photopop.lk`. Sign up at <https://www.zoho.com/mail/> for the free plan and add `photopop.lk`. Zoho then lists DNS records — a verification record, MX records, SPF and DKIM. Add each one where you added the records in step 5, exactly as shown. Create `hello@`, then make `bookings@` an alias of it so one inbox receives both. Check the free plan's current limits when you sign up; they change from time to time.

**Option B — Cloudflare Email Routing (quickest).** Free, but needs the domain's DNS on Cloudflare (a free account: **Add a domain**, then switch the nameservers at your registrar). Then **Email → Email Routing** forwards `hello@` and `bookings@` to your Gmail. This handles *receiving* only — replies go out from your Gmail address unless you also set up Gmail's "Send mail as".

Either way, send a test email to both addresses before launch.

### 7. Launch checks

- [ ] Open the site on your phone. Tap every menu item, and the WhatsApp/email button.
- [ ] **Send the link to yourself on WhatsApp.** A card with your logo should appear under it. If it doesn't, wait a few minutes and try again — WhatsApp caches previews.
- [ ] Submit a test quote request and check it reaches you. Delete the test response afterwards.
- [ ] Visit `/book/quote` — it should land on `/book`.
- [ ] **Google Search Console** (<https://search.google.com/search-console>): add `photopop.lk` as a Domain property, verify it with the TXT record it gives you, then under **Sitemaps** submit `https://photopop.lk/sitemap-index.xml`.
- [ ] **Google Business Profile**: add `https://photopop.lk` as the website.
- [ ] Update your Instagram/Facebook/TikTok bios to `photopop.lk/book`.

---

## Part 4 — After your first events

1. **Swap in real photos** — Part 2. The hero photo makes the biggest difference; do that first.
2. **Add real testimonials** to `testimonials` in `config.yaml`, using the commented example there as a template. Only with the client's permission, and only their real words.
3. **Fill in `metrics`** with true numbers, then set `launch.pre_launch: false`. The founding-client banner turns into an events counter and the reviews section appears.

Until then the site deliberately shows neither. Invented reviews are a legal risk, and Google penalises fake ratings in search.

For star ratings in Google itself, collect reviews on your **Google Business Profile** — Google doesn't show stars for reviews a business publishes on its own website.

### When you're ready to introduce yourselves

The About page has a founders' section, switched off. **Your names aren't in the repository at all** — they're kept in a private file, `team_section_PRIVATE.md`, stored outside this repository so it's never pushed.

To turn it on:

1. Put portraits in `src/assets/photos/team/` as `member-1.jpg` and `member-2.jpg`, then run `npm run photos:clean`.
2. Copy the `about:` block from `team_section_PRIVATE.md` into `config.yaml`, replacing the blank one. It already has `show_team: true`.
3. Push and publish as usual.

**This can't be undone.** Once your names are pushed, they stay in the public repository's history even if you switch the section off again later. Do it when you're sure.

---

## Sending a preview to someone

```bash
npm run build
```

```bash
npm run preview:bundle
```

This writes `preview/photopop-preview.html` — the whole site as one file. Send it on WhatsApp or email, and it opens in any browser with no internet connection needed (apart from the font). Handy for showing your partner changes before they're published. It's never pushed to GitHub.

---

## Command reference

| Command | Does |
|---|---|
| `npm run dev` | Live preview at localhost:4321, refreshes as you save |
| `npm run build` | Builds the real site into `dist/` — the same thing the pipeline runs |
| `npm run preview` | Serves the built `dist/` locally, to check exactly what will go live |
| `npm run photos:clean` | Removes GPS and camera data from photos before you commit them |
| `npm run brand` | Regenerates the logo, preview card and icons from `brand/photopop-logo.png` |
| `npm run preview:bundle` | One-file copy of the site for sharing (run `build` first) |
| `npm run placeholders` | Recreates the pink placeholder photos |

## When something goes wrong

| You see | It means | Do this |
|---|---|---|
| `src/config.yaml has a typo at line N` | A quote or indent problem on that line | Fix that line — the message quotes it |
| `Photo "gallery/x" was not found` | A `gallery.json` entry names a missing file | Check the spelling against the list in the message |
| An error about an *unsupported image format* or *heif* | Usually an iPhone HEIC photo, sometimes renamed to `.jpg` | Convert it to a real JPG — see Photo rules |
| The live site shows the README instead of the website | Pages is still publishing from a branch | Part 3, step 1 |
| **Deploy to GitHub Pages** fails, mentioning Pages isn't enabled, or "Not Found" | Same — the Source isn't "GitHub Actions" | Part 3, step 1, then **Re-run jobs** on the failed run |
| Deploy fails: *branch is not allowed to deploy* | Something tried to publish from a branch other than `main` | Publish by merging into `main` |
| A red ✗ on a `develop` push | The site didn't build | Open the run in **Actions**; the red step shows the same message `npm run build` would |
| WhatsApp shows no preview card | WhatsApp cached an earlier version | Wait a few minutes; try in a different chat |
| `npm` isn't recognised | Node.js isn't installed on this computer | Install the LTS version from <https://nodejs.org> |
