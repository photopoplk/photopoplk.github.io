/**
 * Generates every logo-derived file the site serves from two master images.
 *
 *   npm run brand
 *
 * Inputs: brand/photopop-logo.png   the full logo — transparent background
 *                                   (a white-background version also works)
 *         brand/favicon.png         the app-icon design, square, ideally 512 px
 *
 * Output: public/images/logo.webp          header logo, 3x for sharp screens
 *         public/images/logo.png           general use: search engines, emails
 *         public/images/og-image.png       1200x630 link-preview card
 *         public/favicon.ico               16/32/48 px, for browser tabs
 *         public/favicon.png               48 px
 *         public/apple-touch-icon.png      180 px, for phone home screens
 *         public/icon-512.png              512 px, for Google and app installs
 *
 * To change either design: replace the file in brand/ and run this again.
 * The masters stay out of public/ so the full-size originals never ship.
 * Run `npm run photos:clean` after replacing them, before committing.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const logoMaster = join(root, 'brand', 'photopop-logo.png');
const iconMasterPath = join(root, 'brand', 'favicon.png');
const publicDir = join(root, 'public');
const imagesDir = join(publicDir, 'images');
mkdirSync(imagesDir, { recursive: true });

const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

/**
 * Only for a logo on a white background: rendered artwork often sits on
 * #FEFEFE with ±1 noise, which shows as a faint grey box on a pure white page.
 * Snapping near-white to #FFFFFF fixes that without touching the artwork.
 */
async function snapNearWhite(input) {
  const { data, info } = await sharp(input)
    .flatten({ background: WHITE })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += info.channels) {
    if (data[i] >= 249 && data[i + 1] >= 249 && data[i + 2] >= 249) {
      data[i] = data[i + 1] = data[i + 2] = 255;
    }
  }
  return sharp(data, { raw: info }).png().toBuffer();
}

// --- Trim the empty margin around the logo -----------------------------------
// A transparent logo trims on its alpha edge; a white-background one on white.
// A small threshold keeps the soft drop shadow under the "pop" sticker.
const transparent = (await sharp(logoMaster).metadata()).hasAlpha;
const trimmed = transparent
  ? await sharp(logoMaster).trim({ threshold: 2 }).png().toBuffer({ resolveWithObject: true })
  : await sharp(await snapNearWhite(logoMaster))
      .trim({ background: '#ffffff', threshold: 4 })
      .toBuffer({ resolveWithObject: true });
const logo = trimmed.data;
const { width: logoW, height: logoH } = trimmed.info;

const written = [];
const save = (path, buffer) => {
  writeFileSync(path, buffer);
  written.push(
    `${path.replace(root + '\\', '').replace(root + '/', '')}  ${(buffer.length / 1024).toFixed(1)} KB`
  );
};

// --- Header logo -------------------------------------------------------------
// Displayed 44–48 px tall; 132 px gives a crisp ~3x version for phone screens.
// Transparency is kept, so it sits cleanly on any background.
const headerLogo = await sharp(logo).resize({ height: 132 }).webp({ quality: 92, alphaQuality: 100, effort: 6 }).toBuffer({ resolveWithObject: true });
save(join(imagesDir, 'logo.webp'), headerLogo.data);
save(
  join(imagesDir, 'logo.png'),
  await sharp(logo)
    .resize({ height: 240 })
    .png({ palette: true, quality: 95, effort: 10, compressionLevel: 9 })
    .toBuffer()
);

// --- Link-preview card (WhatsApp, Facebook, LinkedIn, X) ---------------------
// Platforms that crop previews to a square keep the centre, so the logo stays
// inside the middle 630 px — it survives either crop intact.
const OG_W = 1200;
const OG_H = 630;
const ogLogo = await sharp(logo).resize({ width: 600 }).png().toBuffer({ resolveWithObject: true });
const decoration = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_W}" height="${OG_H}">
     <circle cx="1090" cy="70" r="250" fill="#FFE4EF" opacity="0.7"/>
     <circle cx="110" cy="600" r="190" fill="#FFF4F8"/>
   </svg>`
);
save(
  join(imagesDir, 'og-image.png'),
  await sharp({ create: { width: OG_W, height: OG_H, channels: 3, background: WHITE } })
    .composite([
      { input: decoration, top: 0, left: 0 },
      {
        input: ogLogo.data,
        left: Math.round((OG_W - ogLogo.info.width) / 2),
        top: Math.round((OG_H - ogLogo.info.height) / 2),
        // A white-background logo needs multiply so its ground disappears; a
        // transparent one composites normally.
        blend: transparent ? 'over' : 'multiply',
      },
    ])
    .png({ compressionLevel: 9, effort: 10 })
    .toBuffer()
);

// --- Icons, from the dedicated favicon design --------------------------------
// Palette PNGs: icons are small, flat-ish artwork — quantising roughly thirds
// the file size with no visible change. Transparency (the tile's rounded
// corners) is kept for browser tabs.
const icon = (size, { opaque = false } = {}) => {
  let img = sharp(iconMasterPath).resize(size, size, { kernel: 'lanczos3', fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
  // iPhones fill transparent areas of home-screen icons with black; give that
  // one a white ground so the corners match the tile.
  if (opaque) img = img.flatten({ background: WHITE });
  return img.png({ palette: true, quality: 95, effort: 10, compressionLevel: 9 }).toBuffer();
};

const [i16, i32, i48, i512] = await Promise.all([16, 32, 48, 512].map((s) => icon(s)));
const i180 = await icon(180, { opaque: true });
save(join(publicDir, 'favicon.png'), i48);
save(join(publicDir, 'apple-touch-icon.png'), i180);
save(join(publicDir, 'icon-512.png'), i512);

/**
 * A real .ico container with PNG-encoded entries (supported since Windows
 * Vista and by every current browser). Browsers request /favicon.ico on their
 * own, so serving one avoids a 404 on every page load.
 */
function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(entries.length, 4);
  let offset = 6 + 16 * entries.length;
  const dir = entries.map(({ size, png }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2); // palette colours
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // colour planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(png.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += png.length;
    return e;
  });
  return Buffer.concat([header, ...dir, ...entries.map((x) => x.png)]);
}

save(
  join(publicDir, 'favicon.ico'),
  buildIco([
    { size: 16, png: i16 },
    { size: 32, png: i32 },
    { size: 48, png: i48 },
  ])
);

console.log(
  `Logo (${transparent ? 'transparent' : 'white background'}) trimmed to ${logoW}x${logoH}; ` +
    `header logo is ${headerLogo.info.width}x${headerLogo.info.height}. Wrote:`
);
for (const line of written) console.log('  ' + line);
