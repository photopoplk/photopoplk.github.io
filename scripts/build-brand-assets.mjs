/**
 * Generates every logo-derived file the site serves from one master image.
 *
 *   npm run brand
 *
 * Input:  brand/photopop-logo.png   (the full-size logo on a white background)
 * Output: public/images/logo.webp          header logo, 3x for sharp screens
 *         public/images/logo.png           general use: search engines, emails
 *         public/images/og-image.png       1200x630 link-preview card
 *         public/favicon.ico               16/32/48 px, for browser tabs
 *         public/favicon.png               48 px
 *         public/apple-touch-icon.png      180 px, for phone home screens
 *         public/icon-512.png              512 px, for Google and app installs
 *
 * To change the logo: replace brand/photopop-logo.png and run this again.
 * The master is kept out of public/ so the 800 KB original never ships.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const master = join(root, 'brand', 'photopop-logo.png');
const publicDir = join(root, 'public');
const imagesDir = join(publicDir, 'images');
mkdirSync(imagesDir, { recursive: true });

const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

/**
 * The rendered logo sits on #FEFEFE with ±1 noise rather than true white.
 * Invisible alone, but it shows as a faint grey box when placed on a pure
 * white page. Snapping near-white to #FFFFFF fixes that without touching the
 * lettering, the sticker's white outline, or the drop shadow (all darker).
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

// --- Trim the generous white margin around the artwork ----------------------
// A small threshold keeps the soft drop shadow under the "pop" sticker.
const trimmed = await sharp(await snapNearWhite(master))
  .trim({ background: '#ffffff', threshold: 4 })
  .toBuffer({ resolveWithObject: true });
const logo = trimmed.data;
const { width: logoW, height: logoH } = trimmed.info;

/**
 * Pixel box of the saturated pink lettering — the "pop" sticker — plus the
 * rightmost column of the black "photo" wordmark that sits to its left, so an
 * icon crop can stop short of it.
 */
async function findPinkBox(buffer) {
  const { data, info } = await sharp(buffer).raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: c } = info;
  let x0 = w, y0 = h, x1 = 0, y1 = 0;
  const darkCols = new Uint8Array(w);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * c;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      if (r > 200 && g < 140 && b > 110 && r - g > 90) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      } else if (r < 110 && g < 110 && b < 110) {
        darkCols[x] = 1;
      }
    }
  }
  if (x1 <= x0) throw new Error('Could not find the pink "pop" lettering in the logo.');
  let wordmarkEnd = -1;
  for (let x = x0 - 1; x >= 0; x--) {
    if (darkCols[x]) {
      wordmarkEnd = x;
      break;
    }
  }
  return { x0, y0, x1, y1, wordmarkEnd };
}

const written = [];
const save = (path, buffer) => {
  writeFileSync(path, buffer);
  written.push(`${path.replace(root + '\\', '').replace(root + '/', '')}  ${(buffer.length / 1024).toFixed(1)} KB`);
};

// --- Header logo -------------------------------------------------------------
// Displayed 44 px tall; 132 px gives a crisp 3x version for phone screens.
save(
  join(imagesDir, 'logo.webp'),
  await sharp(logo).resize({ height: 132 }).webp({ quality: 92, effort: 6 }).toBuffer()
);
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
const ogLogoW = 600;
const ogLogo = await sharp(logo).resize({ width: ogLogoW }).toBuffer({ resolveWithObject: true });
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
        // Multiply makes the logo's white ground see-through, so it never
        // notches the decorative circles behind it.
        blend: 'multiply',
      },
    ])
    .png({ compressionLevel: 9, effort: 10 })
    .toBuffer()
);

// --- Icons: the pink "pop" sticker on its stick ------------------------------
// The full wordmark is unreadable at tab size; the sticker alone holds up.
// The sticker is wider than the trimmed logo is tall, so crop it as a
// rectangle (sticker plus stick) and centre that on a square white canvas.
const pink = await findPinkBox(logo);
const pad = Math.round((pink.x1 - pink.x0) * 0.06); // room for the white outline
// Stop short of the black "photo" so no sliver of it leaks into the icon.
const cropLeft = Math.max(0, pink.x0 - pad, pink.wordmarkEnd + 3);
const cropTop = Math.max(0, pink.y0 - pad);
const cropRight = Math.min(logoW, pink.x1 + pad);
const sticker = await sharp(logo)
  .extract({
    left: cropLeft,
    top: cropTop,
    width: cropRight - cropLeft,
    height: logoH - cropTop, // down to the bottom, so the stick is included
  })
  .toBuffer({ resolveWithObject: true });

const side = Math.round(Math.max(sticker.info.width, sticker.info.height) * 1.08);
const iconMaster = await sharp({
  create: { width: side, height: side, channels: 3, background: WHITE },
})
  .composite([
    {
      input: sticker.data,
      left: Math.round((side - sticker.info.width) / 2),
      top: Math.round((side - sticker.info.height) / 2),
    },
  ])
  .png()
  .toBuffer();

// Palette PNGs: icons are small, flat-ish artwork — quantising roughly
// thirds the file size with no visible change.
const icon = (size) =>
  sharp(iconMaster)
    .resize(size, size, { kernel: 'lanczos3' })
    .png({ palette: true, quality: 95, effort: 10, compressionLevel: 9 })
    .toBuffer();

const [i16, i32, i48, i180, i512] = await Promise.all([16, 32, 48, 180, 512].map(icon));
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

console.log(`Logo master trimmed to ${logoW}x${logoH}. Wrote:`);
for (const line of written) console.log('  ' + line);
