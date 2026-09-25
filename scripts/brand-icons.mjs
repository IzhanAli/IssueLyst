/**
 * Renders every favicon and app icon from the one source mark,
 * public/brand/logo.svg. Run after editing the mark: `npm run icons`.
 *
 * The apple-touch-icon is drawn full-bleed (no corner radius, no
 * transparency) because iOS applies its own mask and fills transparent
 * pixels with black.
 */
import { copyFile, readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const SRC = "public/brand/logo.svg";
const svg = await readFile(SRC);
const square = Buffer.from(svg.toString().replace(/rx="15"/, 'rx="0"'));

const png = (source, size) =>
  sharp(source, { density: 72 * Math.ceil(size / 64) * 2 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

/** An ICO whose entries are embedded PNGs — valid since Windows Vista, and what every browser reads. */
function ico(images) {
  const header = Buffer.alloc(6 + images.length * 16);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, i) => {
    const e = 6 + i * 16;
    header.writeUInt8(size >= 256 ? 0 : size, e);
    header.writeUInt8(size >= 256 ? 0 : size, e + 1);
    header.writeUInt16LE(1, e + 4);
    header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(data.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map((i) => i.data)]);
}

const outputs = {
  "public/favicon-96x96.png": await png(svg, 96),
  "public/icon-192.png": await png(svg, 192),
  "public/icon-512.png": await png(svg, 512),
  "public/apple-touch-icon.png": await sharp(await png(square, 180)).flatten({ background: "#0A66FF" }).png().toBuffer(),
  "public/favicon.ico": ico(await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await png(svg, size) })))),
};

for (const [path, data] of Object.entries(outputs)) {
  await writeFile(path, data);
  console.log(`${path.padEnd(30)} ${(data.length / 1024).toFixed(1).padStart(6)} KB`);
}
await copyFile(SRC, "public/favicon.svg");
console.log("public/favicon.svg");
