/**
 * Finds photos in src/assets/photos by name, so pages and gallery.json can
 * say "gallery/wedding-01" without caring whether the file is a .jpg, a .png
 * or the .svg placeholder.
 *
 * A real photo always beats a placeholder with the same name — dropping
 * wedding-01.jpg next to wedding-01.svg is all it takes to swap one in.
 */
import type { ImageMetadata } from 'astro';

/**
 * Every photo under src/assets/photos, eagerly imported so Astro optimises it
 * at build time. Upper-case extensions are listed too: camera files are often
 * IMG_1234.JPG, and the GitHub Actions pipeline builds on case-sensitive Linux, where a
 * lower-case-only pattern would silently skip them.
 */
const modules = import.meta.glob<ImageMetadata>(
  '../assets/photos/**/*.{jpg,jpeg,png,webp,avif,svg,JPG,JPEG,PNG,WEBP,AVIF,SVG}',
  { eager: true, import: 'default' }
);

const PREFIX = '../assets/photos/';

/** Raster formats first: a real photo wins over its .svg placeholder. */
const PREFERENCE = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'svg'];

/** Lower-cased relative path -> original relative path + metadata. */
const index = new Map<string, { path: string; meta: ImageMetadata }>();
for (const [path, meta] of Object.entries(modules)) {
  const rel = path.slice(PREFIX.length);
  index.set(rel.toLowerCase(), { path: rel, meta });
}

/**
 * Look up a photo by its path inside src/assets/photos, with or without an
 * extension. Matching ignores case, so "Wedding-01" finds "wedding-01.JPG".
 * Throws with a list of nearby files if nothing matches, so a typo in
 * gallery.json fails the build loudly instead of shipping a broken image.
 */
export function photo(name: string): ImageMetadata {
  const key = name.trim().replace(/^\/+/, '').toLowerCase();

  if (/\.[a-z0-9]{3,4}$/.test(key)) {
    const exact = index.get(key);
    if (exact) return exact.meta;
  } else {
    for (const ext of PREFERENCE) {
      const hit = index.get(`${key}.${ext}`);
      if (hit) return hit.meta;
    }
  }

  const folder = key.includes('/') ? key.slice(0, key.lastIndexOf('/') + 1) : '';
  const nearby = [...index.values()]
    .map((entry) => entry.path)
    .filter((p) => p.toLowerCase().startsWith(folder) && !p.slice(folder.length).includes('/'))
    .sort();

  throw new Error(
    `Photo "${name}" was not found in src/assets/photos/. ` +
      (nearby.length
        ? `Files in ${folder || 'that folder'}: ${nearby.join(', ')}`
        : `The folder "${folder}" is empty or does not exist.`)
  );
}

export function isPlaceholder(meta: ImageMetadata): boolean {
  return meta.format === 'svg';
}
