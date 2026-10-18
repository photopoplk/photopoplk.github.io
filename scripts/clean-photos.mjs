/**
 * Makes photos and logo masters safe and lean to commit to the PUBLIC repo.
 *
 *   npm run photos:clean
 *
 * Run it before committing new images. For everything in src/assets/photos
 * and brand/:
 *
 *  - Strips hidden metadata: GPS location, camera serials, capture times,
 *    editing history, and AI "content credentials". The published site already
 *    serves metadata-free copies, but the files committed here are what anyone
 *    can download from GitHub.
 *  - JPEGs are cleaned losslessly where possible — the metadata blocks are cut
 *    out and the image data is left exactly as it was. Only photos that need
 *    turning upright (phones store portraits sideways with a rotation tag) or
 *    shrinking are re-saved.
 *  - Photos larger than 2400 px on the long side are scaled down; that is
 *    plenty for the site and keeps the repository small.
 *  - Large PNG photos (no transparency) become high-quality JPGs. PNGs with
 *    transparency, and everything in brand/, stay PNG.
 *
 * Files with nothing to change are left untouched, so it's safe to run anytime.
 */
import { readdirSync, readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const PHOTOS = join(root, 'src', 'assets', 'photos');
const BRAND = join(root, 'brand');
const MAX_EDGE = 2400;
const PNG_TO_JPG_OVER = 600 * 1024; // opaque PNG photos above this become JPG

const walk = (dir) =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]
      )
    : [];

/**
 * Removes metadata segments from a JPEG without re-encoding it.
 * Kept: APP0 (JFIF), APP2 only when it is an ICC colour profile, APP14
 * (Adobe colour transform — some JPEGs decode wrongly without it).
 * Dropped: APP1 (EXIF, XMP), APP11 (C2PA content credentials), APP13 (IPTC),
 * other APPn blocks and comments. Returns null if the file isn't a plain JPEG.
 */
function stripJpeg(buf) {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  const out = [buf.subarray(0, 2)];
  let i = 2;
  let removed = 0;
  while (i < buf.length) {
    if (buf[i] !== 0xff) return null;
    let marker = buf[i + 1];
    while (marker === 0xff) marker = buf[++i + 1]; // fill bytes
    if (marker === 0xda) {
      out.push(buf.subarray(i)); // start of scan: the image data, copied as-is
      break;
    }
    if (marker === 0xd9) {
      out.push(buf.subarray(i, i + 2));
      break;
    }
    const length = buf.readUInt16BE(i + 2);
    const segment = buf.subarray(i, i + 2 + length);
    const isApp = marker >= 0xe0 && marker <= 0xef;
    const isIcc =
      marker === 0xe2 && segment.subarray(4, 16).toString('latin1') === 'ICC_PROFILE\0';
    const keep = !(marker === 0xfe || (isApp && marker !== 0xe0 && marker !== 0xee && !isIcc));
    if (keep) out.push(segment);
    else removed += 1;
    i += 2 + length;
  }
  return { data: Buffer.concat(out), removed };
}

/** PNG chunks that carry text, EXIF, timestamps or content credentials. */
function pngHasMetadata(buf) {
  let i = 8;
  while (i + 8 <= buf.length) {
    const length = buf.readUInt32BE(i);
    const type = buf.toString('latin1', i + 4, i + 8);
    if (['tEXt', 'iTXt', 'zTXt', 'eXIf', 'caBX', 'tIME'].includes(type)) return true;
    i += 12 + length;
  }
  return false;
}

const kb = (buf) => `${Math.round(buf.length / 1024)} KB`;
const changes = [];
let checked = 0;

for (const file of [...walk(PHOTOS), ...walk(BRAND)]) {
  const ext = extname(file).toLowerCase();
  if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) continue; // .svg placeholders: nothing to strip
  checked += 1;
  const isBrand = file.startsWith(BRAND);
  const name = relative(root, file);
  const input = readFileSync(file);
  const meta = await sharp(input).metadata();
  const longEdge = Math.max(meta.width, meta.height);
  const sideways = (meta.orientation ?? 1) > 1;
  const tooBig = !isBrand && longEdge > MAX_EDGE;

  // --- Opaque, heavy PNG photo: convert to JPG -------------------------------
  if (ext === '.png' && !isBrand && !meta.hasAlpha && input.length > PNG_TO_JPG_OVER) {
    const jpgPath = file.slice(0, -ext.length) + '.jpg';
    const output = await sharp(input)
      .rotate()
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 90, mozjpeg: true })
      .toBuffer();
    writeFileSync(jpgPath, output);
    unlinkSync(file);
    changes.push(`converted  ${name} -> .jpg  (${kb(input)} -> ${kb(output)})`);
    continue;
  }

  // --- Needs re-saving anyway: rotate upright and/or shrink -------------------
  if (sideways || tooBig) {
    let img = sharp(input).rotate();
    if (tooBig) img = img.resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside' });
    const encoded =
      ext === '.png'
        ? img.png({ compressionLevel: 9 })
        : ext === '.webp'
          ? img.webp({ quality: 90 })
          : img.jpeg({ quality: 90, mozjpeg: true });
    const output = await encoded.toBuffer();
    writeFileSync(file, output);
    const why = [sideways && 'turned upright', tooBig && `shrunk to ${MAX_EDGE}px`].filter(Boolean);
    changes.push(`re-saved   ${name}  (${why.join(', ')}; metadata removed)`);
    continue;
  }

  // --- JPEG: lossless metadata strip ----------------------------------------
  if (ext === '.jpg' || ext === '.jpeg') {
    const result = stripJpeg(input);
    if (result && result.removed > 0) {
      writeFileSync(file, result.data);
      changes.push(`cleaned    ${name}  (lossless; ${kb(input)} -> ${kb(result.data)})`);
    } else if (!result && (meta.exif || meta.xmp || meta.iptc)) {
      // Unusual JPEG layout — fall back to a high-quality re-save.
      writeFileSync(file, await sharp(input).jpeg({ quality: 92, mozjpeg: true }).toBuffer());
      changes.push(`re-saved   ${name}  (metadata removed)`);
    }
    continue;
  }

  // --- PNG / WebP: re-encode only if metadata is present ---------------------
  const dirty =
    ext === '.png'
      ? pngHasMetadata(input) || Boolean(meta.xmp || meta.exif)
      : Boolean(meta.xmp || meta.exif || meta.iptc);
  if (dirty) {
    const encoded =
      ext === '.png'
        ? sharp(input).png({ compressionLevel: 9, effort: 10 }) // lossless; keeps transparency
        : sharp(input).webp({ quality: 92 });
    const output = await encoded.toBuffer();
    writeFileSync(file, output);
    changes.push(`cleaned    ${name}  (${kb(input)} -> ${kb(output)})`);
  }
}

for (const line of changes) console.log('  ' + line);
console.log(
  changes.length
    ? `Done — ${changes.length} of ${checked} image${checked === 1 ? '' : 's'} changed.`
    : `Checked ${checked} image${checked === 1 ? '' : 's'} — nothing to remove.`
);
