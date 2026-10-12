# Photo Shot List

What to capture for each photo slot on the site. Every slot currently holds a
pink placeholder in `src/assets/photos/`.

**How to swap one in:** put your photo next to the placeholder with the same
name — `gallery/wedding-01.jpg` beside `gallery/wedding-01.svg`. The real photo
wins automatically. Full steps, including adding *new* gallery photos, are in
[LAUNCH_GUIDE.md → Part 2](LAUNCH_GUIDE.md#part-2--photos).

**No resizing or compressing needed.** Shoot at full quality; the build makes
phone- and desktop-sized WebP versions and strips location data. The sizes
below describe the *shape* each slot displays in, not a file size to hit.

---

## Hero — the most important photo on the site

| File | Shape | Shot |
|---|---|---|
| `hero` | Tall, 4:5 | The booth in use: guests mid-laugh, branded backdrop visible, prints in hand. Shoot **portrait**, subject near the centre — the frame crops the edges. |

If you only replace one placeholder before launch, make it this one.

## Team — About page (not needed yet)

The founders' section is switched off (`about.show_team: false` in
`config.yaml`), so these photos aren't shown or published. Shoot them whenever
you're ready to introduce yourselves.

| File | Shape | Shot |
|---|---|---|
| `team/member-1` | Portrait, cropped from the top | Good light, natural expression, plain or softly blurred background |
| `team/member-2` | Same | Same treatment, so the pair look like a set |

## Gallery

Twelve slots across four categories. Mixed shapes are deliberate — a masonry
grid looks flat if everything is square. Your photos keep their own shape, so
these are suggestions, not requirements.

| File | Suggested shape | Shot |
|---|---|---|
| `gallery/wedding-01` | Square | Couple at the booth, mid-reaction |
| `gallery/wedding-02` | Portrait | Bridal party crowded into frame |
| `gallery/wedding-03` | Landscape | Wide: booth in the venue, guests queuing |
| `gallery/corporate-01` | Square | Product launch guests, branded backdrop |
| `gallery/corporate-02` | Landscape | Close on a print showing the custom overlay |
| `gallery/corporate-03` | Portrait | Single attendee, conference lanyard visible |
| `gallery/birthday-01` | Square | Cake moment captured in the booth |
| `gallery/birthday-02` | Portrait | Friends buried in props |
| `gallery/birthday-03` | Landscape | Group holding fresh prints |
| `gallery/festival-01` | Square | Public event, crowd energy |
| `gallery/festival-02` | Landscape | Queue at the booth |
| `gallery/festival-03` | Square | Close-up of a print strip |

You're not limited to twelve — add as many as you like (see the launch guide).

---

## Logo, link-preview card and icons

All generated from `brand/photopop-logo.png` by `npm run brand`. Nothing to
shoot. The preview card is what appears under a photopop.lk link shared on
WhatsApp or Facebook.

## Before you publish anyone's photo

- **Get consent.** A quick "mind if we use this on our site?" at the event is
  enough — but get it.
- **Captions:** event type and town only (`Wedding | Galle`). No full names,
  venue names or exact dates unless the client has said yes.
- Not sure about consent for a face? Don't use it. There are always other shots.
- **iPhone users:** set *Settings → Camera → Formats → Most Compatible* before
  the event. The default HEIC format can't be used on the site.
