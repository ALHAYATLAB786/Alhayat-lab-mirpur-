import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function drawAlHayatIcon(size, maskable = false) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  const scale = maskable ? 0.76 : 0.92;
  const cx = size / 2;
  const cy = size / 2;

  for (let y = 0; y < size; y++) {
    const rowOffset = y * (size * 4 + 1);
    raw[rowOffset] = 0; // filter 0
    for (let x = 0; x < size; x++) {
      const nx = (x - cx) / (size * 0.5 * scale);
      const ny = (y - cy) / (size * 0.5 * scale);

      // Default background: clean clinical white (full bleed for maskable, rounded-rect or full royal border)
      let r = 255;
      let g = 255;
      let b = 255;
      const a = 255;

      // Outer subtle border on non-maskable
      if (!maskable && (Math.abs(x - cx) > size * 0.47 || Math.abs(y - cy) > size * 0.47)) {
        r = 38;
        g = 49;
        b = 140;
      }

      // Royal Indigo Arch (#26318C)
      const distArch = Math.hypot(nx, ny + 0.06);
      if (distArch >= 0.64 && distArch <= 0.77 && ny < 0.36) {
        r = 38;
        g = 49;
        b = 140;
      }

      // Microscope base & stand (#26318C)
      if (ny >= 0.36 && ny <= 0.46 && nx >= -0.34 && nx <= 0.24) {
        r = 38;
        g = 49;
        b = 140;
      }
      // Microscope stage
      if (ny >= 0.16 && ny <= 0.23 && nx >= -0.26 && nx <= 0.12) {
        r = 38;
        g = 49;
        b = 140;
      }
      // Microscope tube
      if (ny >= -0.46 && ny <= 0.08 && nx >= -0.11 && nx <= 0.01) {
        r = 38;
        g = 49;
        b = 140;
      }
      // Microscope curved C-arm
      const distArm = Math.hypot(nx + 0.02, ny - 0.04);
      if (distArm >= 0.19 && distArm <= 0.29 && nx > -0.02 && ny > -0.24 && ny < 0.38) {
        r = 38;
        g = 49;
        b = 140;
      }

      // Medical Red Cross on Right (#E1251B)
      const crossVert = nx >= 0.34 && nx <= 0.45 && ny >= -0.16 && ny <= 0.16;
      const crossHoriz = nx >= 0.24 && nx <= 0.55 && ny >= -0.05 && ny <= 0.06;
      if (crossVert || crossHoriz) {
        r = 225;
        g = 37;
        b = 27;
      }

      // Medical Green Capsule accent on Left (#2E7D32)
      const capDist = Math.hypot(nx + 0.38, ny + 0.02);
      if (capDist <= 0.085) {
        r = 46;
        g = 125;
        b = 50;
      }

      // Bottom royal indigo banner bar
      if (ny >= 0.56 && ny <= 0.68 && nx >= -0.58 && nx <= 0.58) {
        r = 38;
        g = 49;
        b = 140;
      }
      // Crimson sub-bar
      if (ny >= 0.72 && ny <= 0.78 && nx >= -0.42 && nx <= 0.42) {
        r = 225;
        g = 37;
        b = 27;
      }

      const px = rowOffset + 1 + x * 4;
      raw[px] = r;
      raw[px + 1] = g;
      raw[px + 2] = b;
      raw[px + 3] = a;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const compressed = zlib.deflateSync(raw, {level: 9});
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const pubDir = path.resolve('public');
fs.mkdirSync(pubDir, {recursive: true});
fs.writeFileSync(path.join(pubDir, 'pwa-192x192.png'), drawAlHayatIcon(192, false));
fs.writeFileSync(path.join(pubDir, 'pwa-512x512.png'), drawAlHayatIcon(512, false));
fs.writeFileSync(path.join(pubDir, 'pwa-maskable-512x512.png'), drawAlHayatIcon(512, true));
fs.writeFileSync(path.join(pubDir, 'apple-touch-icon.png'), drawAlHayatIcon(180, false));
console.log('Generated PWA PNG icons successfully.');
