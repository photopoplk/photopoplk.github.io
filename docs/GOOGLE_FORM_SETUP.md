# Google Form Setup — PhotoPop Booking

The `/book` page embeds a Google Form. Until you create one and paste its ID
into `src/config.yaml`, the page shows a WhatsApp/email fallback panel instead —
the site works either way, so there is no rush, but the form is what makes
enquiries land in a spreadsheet automatically.

Total time: about 20 minutes.

---

## 1. Create the form

Go to [forms.google.com](https://forms.google.com) and create a blank form.

- **Title:** `Get Your PhotoPop Quote`
- **Description:** `Tell us about your event and we'll send a tailored quote within 2 hours. No commitment.`

Then add the questions below, in this order. They match the fields the booking
page promises, so keep the wording close.

### Section 1 — Your Event

| # | Question | Type | Required | Options / notes |
|---|----------|------|----------|-----------------|
| 1 | What type of event is it? | Multiple choice | Yes | Wedding · Birthday · Corporate event · Festival / public event · Other |
| 2 | Event date | Date | Yes | — |
| 3 | Roughly how many guests? | Multiple choice | Yes | Under 50 · 50–100 · 100–200 · 200–350 · 350+ |
| 4 | Venue or area | Short answer | Yes | Helps us price travel |

### Section 2 — What You're After

| # | Question | Type | Required | Options / notes |
|---|----------|------|----------|-----------------|
| 5 | Which package interests you? | Multiple choice | No | Silver (2 hrs) · Gold (3 hrs) · Platinum (4 hrs) · Diamond (full day) · Not sure yet |
| 6 | Any add-ons? | Checkboxes | No | Custom branding · Premium backdrop · Extended hours |
| 7 | Anything else we should know? | Paragraph | No | e.g. outdoor venue, specific colours, tight setup window |

### Section 3 — How to Reach You

| # | Question | Type | Required | Options / notes |
|---|----------|------|----------|-----------------|
| 8 | Your name | Short answer | Yes | — |
| 9 | Email address | Short answer | Yes | Turn on **Response validation → Text → Email** |
| 10 | WhatsApp / phone number | Short answer | Yes | Add help text: `Include the country code, e.g. +94 77 123 4567` |
| 11 | Best time to reach you | Multiple choice | No | Morning (8–12) · Afternoon (12–5) · Evening (5–9) · Anytime |

---

## 2. Point the confirmation at the thank-you page

**Settings → Presentation → Confirmation message:**

```
Thanks! Your request is in — we'll be in touch within 2 hours.
See what happens next: https://photopop.lk/thank-you
```

Google Forms cannot redirect automatically, so the link is how people reach
`/thank-you`. Keep the URL in the message.

Also under Settings → Responses, turn **on**:

- **Collect email addresses** → off (question 9 already does this, and leaving
  it on forces respondents to sign into a Google account)
- **Send responders a copy of their response** → *If respondent requests it*

---

## 3. Get notified when someone submits

1. Open the **Responses** tab.
2. Click the three-dot menu → **Get email notifications for new responses**.
3. To collect everything in a sheet, click the Sheets icon → **Create a new
   spreadsheet**. This is also what the Telegram/Sheets automation in
   `08_Automation/Automation_Workflow.md` reads from, if you wire that up later.

---

## 4. Put the form ID into the site

Click **Send** → the `<>` embed tab. You get HTML like:

```html
<iframe src="https://docs.google.com/forms/d/e/1FAIpQLSc7XkQ.../viewform?embedded=true" ...>
```

Copy **only the part between `/d/e/` and `/viewform`** — that long string
starting `1FAIpQLS` is the form ID.

Paste it into `src/config.yaml`:

```yaml
booking:
  google_form_id: "1FAIpQLSc7XkQ..."
```

Commit and push, then merge into main to publish. The form replaces the fallback
panel automatically.

---

## 5. Check it

- Load `/book` — the form should appear inside the page.
- Submit a test response and confirm it lands in the Responses tab and that you
  get the notification email.
- Delete the test response.
- If the form is cut off at the bottom, raise `booking.form_height_px` in
  `config.yaml`. A cross-origin iframe cannot resize itself, so the height is
  fixed — leave some slack.

---

## Notes

- **Prefilled package links.** The pricing cards link to `/book?package=gold`.
  Google Forms cannot read that parameter through the embed, so the package
  question is asked in the form itself. Not a problem — just do not expect the
  dropdown to arrive pre-selected.
- **Privacy.** The `/privacy` page automatically switches to the Google Forms
  wording once a form ID is set, so it stays accurate. Nothing to edit there.
- **If you outgrow Forms.** The original spec (`Website_Architecture.md` §7)
  designs a custom form posting to Telegram + SendGrid. That needs a server
  runtime; this site is currently static. Switching later means adding an Astro
  adapter and an API route — a half-day of work, not a rewrite.
