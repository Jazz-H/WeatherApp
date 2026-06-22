// Rasterizes public/icon.svg into the PNG app icons a PWA manifest needs.
// Run with: node scripts/generate-icons.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const src = path.join(root, "public", "icon.svg");
const outDir = path.join(root, "public", "icons");

await mkdir(outDir, { recursive: true });

// Standard "any" icons — the SVG already has a rounded dark background.
for (const size of [192, 512]) {
  await sharp(src)
    .resize(size, size)
    .png()
    .toFile(path.join(outDir, `icon-${size}.png`));
}

// Maskable icon — pad to ~80% safe zone on the brand background so it isn't
// clipped by Android's circular/rounded masks.
const MASKABLE = 512;
const inner = Math.round(MASKABLE * 0.78);
const pad = Math.round((MASKABLE - inner) / 2);
const logo = await sharp(src).resize(inner, inner).png().toBuffer();
await sharp({
  create: {
    width: MASKABLE,
    height: MASKABLE,
    channels: 4,
    background: "#0f2027",
  },
})
  .composite([{ input: logo, top: pad, left: pad }])
  .png()
  .toFile(path.join(outDir, "icon-maskable-512.png"));

// Apple touch icon (no transparency; iOS adds its own rounding).
await sharp(src).resize(180, 180).png().toFile(path.join(outDir, "apple-touch-icon.png"));

console.log("Generated PWA icons in public/icons/");
