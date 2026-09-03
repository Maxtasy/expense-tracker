import sharp from "sharp";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";

const svgPath = fileURLToPath(new URL("../src/app/icon.svg", import.meta.url));

async function buildIco(pngBuffers) {
  const count = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  let offset = 6 + count * 16;
  const entries = [];
  const datas = [];

  for (const { size, data } of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    datas.push(data);
    offset += data.length;
  }

  return Buffer.concat([header, ...entries, ...datas]);
}

async function main() {
  const sizes = [16, 32, 48];
  const pngBuffers = await Promise.all(
    sizes.map(async (size) => ({
      size,
      data: await sharp(svgPath).resize(size, size).png().toBuffer(),
    })),
  );

  const ico = await buildIco(pngBuffers);
  writeFileSync(new URL("../src/app/favicon.ico", import.meta.url), ico);
  console.log("Wrote src/app/favicon.ico");

  const appleIcon = await sharp(svgPath).resize(180, 180).flatten({ color: "#0b0e14" }).png().toBuffer();
  writeFileSync(new URL("../src/app/apple-icon.png", import.meta.url), appleIcon);
  console.log("Wrote src/app/apple-icon.png");
}

main();
