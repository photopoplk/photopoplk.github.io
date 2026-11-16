/**
 * Prints the questions of the Google Form set in src/config.yaml, in the
 * shape `booking.form_sections` expects. Run it after changing the Google
 * Form, then copy the output over `form_sections` in config.yaml.
 *
 *   npm run form:fields
 *
 * It reads the form's public page — the form must be accepting responses and
 * must not require sign-in.
 */
import { readFileSync } from 'node:fs';
import { load } from 'js-yaml';

const config = load(readFileSync(new URL('../src/config.yaml', import.meta.url), 'utf8'));
const id = config.booking?.google_form_id?.trim();
if (!id) {
  console.error('booking.google_form_id is empty in src/config.yaml.');
  process.exit(1);
}

const res = await fetch(`https://docs.google.com/forms/d/e/${id}/viewform`);
if (!res.ok) {
  console.error(`Could not load the form (HTTP ${res.status}). Is it published and public?`);
  process.exit(1);
}
const html = await res.text();
const match = html.match(/FB_PUBLIC_LOAD_DATA_ = (.*?);<\/script>/s);
if (!match) {
  console.error('Could not find the form data in the page. Google may have changed its layout.');
  process.exit(1);
}

const items = JSON.parse(match[1])[1][1];
// Google's internal question-type numbers → the site's field types.
const TYPES = { 0: 'text', 1: 'textarea', 2: 'radio', 3: 'radio', 4: 'checkbox', 9: 'date' };
const SECTION_BREAK = 8;
const q = (s) => JSON.stringify(s);

const sections = [{ title: 'Your details', fields: [] }];
const skipped = [];
for (const item of items) {
  const [, title, help, type, parts] = item;
  if (type === SECTION_BREAK) {
    sections.push({ title, fields: [] });
    continue;
  }
  if (!parts) continue; // headings, images, videos
  if (!(type in TYPES)) {
    skipped.push(title);
    continue;
  }
  const [entry, rawOptions, required] = parts[0];
  const options = (rawOptions ?? []).filter((o) => o[0] !== '' && !o[4]).map((o) => o[0]);
  const other = (rawOptions ?? []).some((o) => o[4] === 1);
  // Text answers Google checks as an email address.
  const isEmail = type === 0 && JSON.stringify(parts[0][4] ?? '').includes('102');
  const lines = [
    `        - entry: "${entry}"`,
    `          label: ${q(title)}`,
    `          type: ${isEmail ? 'email' : TYPES[type]}`,
  ];
  if (required) lines.push('          required: true');
  if (help) lines.push(`          help: ${q(help)}`);
  if (other) lines.push('          other: true');
  if (options.length) lines.push(`          options: [${options.map(q).join(', ')}]`);
  sections.at(-1).fields.push(lines.join('\n'));
}

console.log('  form_sections:');
for (const s of sections.filter((s) => s.fields.length)) {
  console.log(`    - title: ${q(s.title)}\n      fields:\n${s.fields.join('\n')}`);
}
console.error(
  '\nCheck before pasting: phone fields come out as `text` (change to `tel`), and ' +
    'add `prefill: package` back to the package question and `autocomplete` lines if you want them.'
);
if (skipped.length) {
  console.error(`Not supported on the site, left out: ${skipped.join(', ')}`);
}
