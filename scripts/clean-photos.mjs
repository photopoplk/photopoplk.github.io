/**
 * Strips hidden metadata — GPS location, camera serial, capture time — from
 * every photo in src/assets/photos, in place.
 *
 *   npm run photos:clean
 *
 * Run it before committing new photos. The repository is public: the built
 * site already serves metadata-free copies, but the files committed here are
 * the originals, and anyone can download them from GitHub.
 *
 * Each photo is turned upright first (phones store portraits sideways with a
 * rotation tag that's about to be removed), then re-saved at high quality.
 * Files with nothing to strip are left untouched, so it's safe to run anytime.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const photosDir = join(root, 'src', 'assets', 'photos');

const ENCODERS = {
  '.jpg': (img) => img.jpeg({ quality: 92, mozjpeg: true }),
  '.jpeg': (img) => img.jpeg({ quality: 92, mozjpeg: true }),
  '.png': (img) => img.png({ compressionLevel: 9 }),
  '.webp': (img) => img.webp({ quality: 92 }),
};

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)]
  );

let cleaned = 0;
let checked = 0;

for (const file of walk(photosDir)) {
  const encode = ENCODERS[extname(file).toLowerCase()];
  if (!encode) continue; // .svg placeholders carry no camera metadata
  checked += 1;

  const input = readFileSync(file);
  const meta = await sharp(input).metadata();
  const hasMetadata = Boolean(meta.exif || meta.xmp || meta.iptc) || (meta.orientation ?? 1) > 1;
  if (!hasMetadata) continue;

  // .rotate() with no angle applies the EXIF orientation, so the pixels end up
  // upright before the tag that described the rotation is dropped.
  const output = await encode(sharp(input).rotate()).toBuffer();
  writeFileSync(file, output);
  cleaned += 1;
  console.log(`  cleaned  ${relative(root, file)}`);
}

console.log(
  cleaned
    ? `Removed location and camera data from ${cleaned} of ${checked} photo${checked === 1 ? '' : 's'}.`
    : `Checked ${checked} photo${checked === 1 ? '' : 's'} — nothing to remove.`
);
