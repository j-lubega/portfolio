// Regenerates every derived favicon size from public/favicon.svg.
// Run after replacing favicon.svg with a different mark: node scripts/gen-favicons.cjs
// CommonJS (.cjs) because it is invoked directly with `node`, outside Astro's ESM pipeline.
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '..', 'public', 'favicon.svg');
const svg = fs.readFileSync(svgPath);
const outDir = path.join(__dirname, '..', 'public');

async function png(size, filename) {
  const out = path.join(outDir, filename);
  await sharp(svg, { density: 384 }).resize(size, size).png().toFile(out);
  console.log('wrote', filename, `${size}x${size}`);
}

// Minimal multi-image ICO writer. Modern ICOs can embed each size as a raw PNG payload; no
// external ico-encoding dependency needed for that.
function buildIco(pngBuffers, filename) {
  const count = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(count, 4);

  let offset = 6 + count * 16;
  const dirEntries = [];
  const imageData = [];
  for (const { size, buf } of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 means 256)
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // color palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(buf.length, 8); // image data size
    entry.writeUInt32LE(offset, 12); // image data offset
    offset += buf.length;
    dirEntries.push(entry);
    imageData.push(buf);
  }
  fs.writeFileSync(
    path.join(outDir, filename),
    Buffer.concat([header, ...dirEntries, ...imageData])
  );
  console.log('wrote', filename, 'with', count, 'sizes');
}

(async () => {
  const sizes = [16, 32, 48];
  const buffers = [];
  for (const size of sizes) {
    const buf = await sharp(svg, { density: 384 }).resize(size, size).png().toBuffer();
    buffers.push({ size, buf });
  }
  buildIco(buffers, 'favicon.ico');

  await png(180, 'apple-touch-icon.png');
  await png(192, 'icon-192.png');
  await png(512, 'icon-512.png');
})();
