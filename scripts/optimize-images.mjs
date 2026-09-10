/**
 * Pre-generates AVIF and WebP alongside every PNG in public/landing.
 *
 * Replaces what next/image did at request time. Run after re-capturing the
 * product screenshots: `npm run images`.
 */
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const DIR = "public/landing";
const QUALITY = { avif: 55, webp: 78 };

const kb = (bytes) => `${(bytes / 1024).toFixed(0)} KB`;

const files = (await readdir(DIR)).filter((f) => f.endsWith(".png"));
if (!files.length) {
  console.error(`No PNGs in ${DIR}`);
  process.exit(1);
}

for (const file of files) {
  const src = join(DIR, file);
  const base = src.replace(/\.png$/, "");
  const original = (await stat(src)).size;
  const image = sharp(src);

  await image.clone().avif({ quality: QUALITY.avif, effort: 6 }).toFile(`${base}.avif`);
  await image.clone().webp({ quality: QUALITY.webp }).toFile(`${base}.webp`);

  const avif = (await stat(`${base}.avif`)).size;
  const webp = (await stat(`${base}.webp`)).size;
  console.log(
    `${file.padEnd(18)} png ${kb(original).padStart(7)}  →  webp ${kb(webp).padStart(7)}  avif ${kb(avif).padStart(7)}`,
  );
}
