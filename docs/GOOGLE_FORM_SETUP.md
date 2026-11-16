# Google Form Setup — PhotoPop Booking

The `/book` page shows the site's own booking form, which sends every answer
straight into a Google Form behind the scenes. Visitors never see Google, but
you still get everything Google Forms gives you: the Responses tab, the linked
Sheet and the notification emails. Until you create a form and paste its ID
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

## 4. Connect the form to the site

Open the form's **Send** → link tab and copy the link. It looks like
`https://docs.google.com/forms/d/e/1FAIpQLSc7XkQ.../viewform`. Copy **only the
part between `/d/e/` and `/viewform`**. That long string starting `1FAIpQLS`
is the form ID.

Paste it into `src/config.yaml`:

```yaml
booking:
  google_form_id: "1FAIpQLSc7XkQ..."
```

Then let the site read your questions:

```bash
npm run form:fields
```

It prints a `form_sections:` block with every question, Google's ID for it
(`entry`) and its options. Copy it over `booking.form_sections` in
`config.yaml`, then make these small edits:

- Change the phone question's `type: text` to `type: tel`.
- Add `prefill: package` to the package question. Links like
  `/book?package=gold` from the pricing cards then pre-select it.
- Rename the section titles if you like. Keep **one section per Google Form
  section** in the same order, because Google checks the number of sections.

Commit and push, then merge into main to publish.

---

## 5. Check it

- Load `/book` and fill in the form with a test entry (name `TEST – delete me`).
- After **Get my quote** the site should open `/thank-you`.
- Confirm the answer arrives in the Responses tab with every field filled in,
  and that you get the notification email. Then delete the test response.

---

## Whenever you edit the Google Form

The site only sends answers for the questions listed in `config.yaml`, using
Google's ID for each one and the exact option wording.

- **Add, remove or reword a question or option in Google Forms** → run
  `npm run form:fields` again and update `form_sections`. Otherwise Google
  quietly drops that answer, or the whole response if the question is required.
- **Making a question required in Google** → mark it `required: true` in
  `config.yaml` too. Otherwise visitors can skip it and Google rejects
  the response.
- Re-test with one entry afterwards (step 5).

---

## Notes

- **How the submit works.** The site sends the answers to Google's own
  `formResponse` address. Google doesn't let other sites read its reply, so
  the page checks every answer itself (required fields, email format, phone
  format, dates from today onwards) and then treats a delivered request as
  success. If the visitor is offline, they get an error message with your
  WhatsApp and email, and their answers stay on the page.
- **Spam.** A hidden "website" field catches simple bots. Their submissions
  are skipped and never reach your form.
- **Without JavaScript** the form still works. It posts to Google and shows
  Google's confirmation message, which links to `/thank-you`.
- **Respondents must not need to sign in.** Keep *Collect email addresses* off
  and *Limit to 1 response* off, or Google will refuse submissions from the site.
- **Privacy.** The `/privacy` page automatically switches to the Google Forms
  wording once a form ID is set, so it stays accurate. Nothing to edit there.
- **If you outgrow Forms.** The original spec (`Website_Architecture.md` §7)
  designs a custom form posting to Telegram + SendGrid. That needs a server
  runtime; this site is currently static. Switching later means adding an Astro
  adapter and an API route — a half-day of work, not a rewrite.
