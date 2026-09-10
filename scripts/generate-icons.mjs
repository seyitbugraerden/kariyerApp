import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
const dir = new URL('../public/', import.meta.url);
const source = await readFile(new URL('favicon.svg', dir));
for (const [name, size] of [['favicon-16x16.png',16],['favicon-32x32.png',32],['apple-touch-icon.png',180]]) {
  await sharp(source).resize(size,size).png().toFile(fileURLToPath(new URL(name,dir)));
}
const sizes = [16,32,48];
const frames = await Promise.all(sizes.map(size => sharp(source).resize(size,size).png().toBuffer()));
const header = Buffer.alloc(6 + sizes.length * 16);
header.writeUInt16LE(1,2);
header.writeUInt16LE(sizes.length,4);
let offset = header.length;
frames.forEach((frame,index) => {
  const entry = 6 + index * 16;
  header[entry] = sizes[index];
  header[entry+1] = sizes[index];
  header.writeUInt16LE(1,entry+4);
  header.writeUInt16LE(32,entry+6);
  header.writeUInt32LE(frame.length,entry+8);
  header.writeUInt32LE(offset,entry+12);
  offset += frame.length;
});
await writeFile(new URL('favicon.ico',dir),Buffer.concat([header,...frames]));
