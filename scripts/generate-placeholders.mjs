/**
 * Generates soft-pink SVG stand-ins for every photo slot on the site, in
 * src/assets/photos/ — the folder the image pipeline reads from.
 *
 *   npm run placeholders
 *
 * Replacing one: drop a real photo next to it with the same name (e.g.
 * gallery/wedding-01.jpg beside gallery/wedding-01.svg). A real photo always
 * wins over the placeholder, so you can delete the .svg whenever you like.
 * See docs/LAUNCH_GUIDE.md.
 *
 * Logo, link-preview card and icons are not made here — see build-brand-assets.mjs.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const photosDir = join(root, 'src', 'assets', 'photos');

/**
 * Soft blush tints rather than saturated pink. Placeholders sit behind real
 * content all over the site, so they need to stay quiet.
 */
const PALETTES = [
  ['#FFF4F8', '#FFDCEA'],
  ['#FFE9F1', '#FFC8DF'],
  ['#FFF7FA', '#FFD2E4'],
  ['#FFEDF4', '#FFDCEA'],
  ['#FFE4EF', '#FFBFDA'],
  ['#FFF4F8', '#FFCBE0'],
];

/** Ink for placeholder labels — readable on every tint above. */
const LABEL = '#B52465';

function escapeXml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** A tinted panel with a camera glyph and a caption — obviously a stand-in. */
function placeholder({ width, height, label, sub = '', index = 0 }) {
  const [from, to] = PALETTES[index % PALETTES.length];
  const id = `g${index}`;
  const min = Math.min(width, height);
  const glyph = Math.round(min * 0.16);
  const cx = width / 2;
  const cy = height / 2 - (sub ? min * 0.07 : min * 0.02);
  const labelSize = Math.max(13, Math.round(min * 0.075));
  const subSize = Math.max(11, Math.round(min * 0.05));
  const stroke = Math.max(1.5, glyph * 0.06);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(label)}">
  <defs>
    <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#${id})"/>
  <circle cx="${width * 0.82}" cy="${height * 0.18}" r="${min * 0.28}" fill="#ffffff" opacity="0.4"/>
  <circle cx="${width * 0.14}" cy="${height * 0.88}" r="${min * 0.22}" fill="#ffffff" opacity="0.3"/>
  <g transform="translate(${cx - glyph / 2}, ${cy - glyph * 1.5})" opacity="0.55">
    <rect x="0" y="${glyph * 0.22}" width="${glyph}" height="${glyph * 0.72}" rx="${glyph * 0.14}" fill="none" stroke="${LABEL}" stroke-width="${stroke}"/>
    <rect x="${glyph * 0.3}" y="${glyph * 0.05}" width="${glyph * 0.4}" height="${glyph * 0.2}" rx="${glyph * 0.06}" fill="none" stroke="${LABEL}" stroke-width="${stroke}"/>
    <circle cx="${glyph * 0.5}" cy="${glyph * 0.58}" r="${glyph * 0.2}" fill="none" stroke="${LABEL}" stroke-width="${stroke}"/>
  </g>
  <text x="${cx}" y="${cy + glyph * 0.5}" font-family="DM Sans, Arial, sans-serif" font-size="${labelSize}" font-weight="500" letter-spacing="${labelSize * 0.06}" fill="${LABEL}" opacity="0.75" text-anchor="middle">${escapeXml(label)}</text>
  ${sub ? `<text x="${cx}" y="${cy + glyph * 0.5 + subSize * 1.7}" font-family="DM Sans, Arial, sans-serif" font-size="${subSize}" fill="${LABEL}" opacity="0.5" text-anchor="middle">${escapeXml(sub)}</text>` : ''}
</svg>
`;
}

/** [path under src/assets/photos, width, height, label, caption] */
const SLOTS = [
  // Portrait: the hero is a side-by-side split with the headline, not a banner.
  ['hero', 1200, 1500, 'HERO PHOTO', 'Booth in action, guests mid-laugh'],

  // Generic names: this repository is public, so no personal names in it.
  ['team/member-1', 300, 400, 'TEAM PHOTO', 'Portrait, cropped from the top'],
  ['team/member-2', 300, 400, 'TEAM PHOTO', 'Portrait, cropped from the top'],

  // Mixed aspect ratios on purpose — the masonry grid looks flat if all square.
  ['gallery/wedding-01', 400, 400, 'WEDDING', 'Couple at the booth'],
  ['gallery/wedding-02', 300, 400, 'WEDDING', 'Bridal party portrait'],
  ['gallery/wedding-03', 500, 300, 'WEDDING', 'Booth setup, wide shot'],
  ['gallery/corporate-01', 400, 400, 'CORPORATE', 'Product launch guests'],
  ['gallery/corporate-02', 500, 300, 'CORPORATE', 'Branded overlay in use'],
  ['gallery/corporate-03', 300, 400, 'CORPORATE', 'Conference attendee'],
  ['gallery/birthday-01', 400, 400, 'BIRTHDAY', 'Cake moment in the booth'],
  ['gallery/birthday-02', 300, 400, 'BIRTHDAY', 'Friends with props'],
  ['gallery/birthday-03', 500, 300, 'BIRTHDAY', 'Group shot, prints in hand'],
  ['gallery/festival-01', 400, 400, 'FESTIVAL', 'Public event crowd'],
  ['gallery/festival-02', 500, 300, 'FESTIVAL', 'Booth queue at a festival'],
  ['gallery/festival-03', 400, 400, 'FESTIVAL', 'Print strip close-up'],
];

SLOTS.forEach(([path, width, height, label, sub], i) => {
  const file = join(photosDir, `${path}.svg`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, placeholder({ width, height, label, sub, index: i }), 'utf8');
});

console.log(`Generated ${SLOTS.length} photo placeholders in src/assets/photos/`);
