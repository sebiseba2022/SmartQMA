const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function buildLogos() {
  console.log('=== Step 1: Loading original logo-new.jpg ===');
  const original = sharp('public/logo-new.jpg');
  const meta = await original.metadata();
  console.log('Original dimensions:', meta.width, 'x', meta.height);

  // 1. Create the corrected full image (1024 x 572) with subtitle replaced
  // Clear region y >= 365 by drawing a white rectangle over the old subtitle
  const maskSvg = Buffer.from(`
    <svg width="${meta.width}" height="${meta.height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="365" width="${meta.width}" height="${meta.height - 365}" fill="#FFFFFF" />
      <text x="512" y="410" font-family="Inter, sans-serif" font-size="44" font-weight="500" fill="#700F23" text-anchor="middle" letter-spacing="0.8">
        Traceability at its finest
      </text>
    </svg>
  `);

  const correctedComposite = await original
    .composite([{ input: maskSvg, top: 0, left: 0 }])
    .png()
    .toBuffer();

  // Save the full standard logo.png
  await sharp(correctedComposite).png().toFile('public/logo.png');
  console.log('Saved public/logo.png');

  // 2. Perform alpha extraction with mathematical un-premultiplication to avoid halos
  const { data, info } = await sharp(correctedComposite)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  console.log(`Processing alpha for ${width}x${height}, channels: ${channels}`);

  // Create buffers for:
  // a) transparent colored logo (RGBA)
  // b) transparent white text + red knot logo (RGBA)
  // c) transparent all-white logo (RGBA)
  const coloredData = Buffer.alloc(width * height * 4);
  const whiteData = Buffer.alloc(width * height * 4);
  const allWhiteData = Buffer.alloc(width * height * 4);

  // Background luminance threshold
  // Pure white is (255, 255, 255)
  // We identify the knot region: y from 140 to 220
  for (let y = 0; y < height; y++) {
    const isKnot = (y >= 140 && y <= 225);
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * channels;
      const dstIdx = (y * width + x) * 4;

      const r = data[srcIdx];
      const g = data[srcIdx + 1];
      const b = data[srcIdx + 2];

      // Luminance (perceptual)
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      // If nearly white (>= 254), completely transparent
      if (lum >= 253.5) {
        // alpha = 0
        coloredData[dstIdx + 3] = 0;
        whiteData[dstIdx + 3] = 0;
        allWhiteData[dstIdx + 3] = 0;
        continue;
      }

      // Alpha is proportional to darkness (255 - lum)
      // Max darkness for #700F23 is lum ~ 45..55
      // Max darkness for knot is lum ~ 35..65
      // Smooth sigmoid / linear curve from lum 253 down to minLum
      const darkness = 255 - lum;
      // Alpha: 0 at darkness <= 2, 255 at darkness >= 195
      let alphaNorm = Math.min(1, Math.max(0, (darkness - 1.5) / 195.0));
      // Apply subtle gamma to preserve crisp text strokes
      alphaNorm = Math.pow(alphaNorm, 0.92);
      const alpha = Math.round(Math.min(255, Math.max(0, alphaNorm * 255)));

      if (alpha === 0) {
        coloredData[dstIdx + 3] = 0;
        whiteData[dstIdx + 3] = 0;
        allWhiteData[dstIdx + 3] = 0;
        continue;
      }

      // Un-premultiply background white: C_fg = (C_obs - (1 - alpha) * 255) / alpha
      const a = alpha / 255.0;
      const unmix = (c) => {
        const val = (c - (1 - a) * 255) / a;
        return Math.round(Math.min(255, Math.max(0, val)));
      };

      const trueR = unmix(r);
      const trueG = unmix(g);
      const trueB = unmix(b);

      // Colored logo
      coloredData[dstIdx] = trueR;
      coloredData[dstIdx + 1] = trueG;
      coloredData[dstIdx + 2] = trueB;
      coloredData[dstIdx + 3] = alpha;

      // White variant: if knot, keep true red knot colors; if text, make pure white (255,255,255)
      if (isKnot) {
        whiteData[dstIdx] = trueR;
        whiteData[dstIdx + 1] = trueG;
        whiteData[dstIdx + 2] = trueB;
        whiteData[dstIdx + 3] = alpha;
      } else {
        whiteData[dstIdx] = 255;
        whiteData[dstIdx + 1] = 255;
        whiteData[dstIdx + 2] = 255;
        whiteData[dstIdx + 3] = alpha;
      }

      // All white variant: everything pure white
      allWhiteData[dstIdx] = 255;
      allWhiteData[dstIdx + 1] = 255;
      allWhiteData[dstIdx + 2] = 255;
      allWhiteData[dstIdx + 3] = alpha;
    }
  }

  // Save transparent full logo
  await sharp(coloredData, { raw: { width, height, channels: 4 } })
    .png()
    .toFile('public/logo-transparent.png');
  console.log('Saved public/logo-transparent.png');

  // Save white variant full logo
  await sharp(whiteData, { raw: { width, height, channels: 4 } })
    .png()
    .toFile('public/logo-white-full.png');
  console.log('Saved public/logo-white-full.png');

  // Save all white variant full logo
  await sharp(allWhiteData, { raw: { width, height, channels: 4 } })
    .png()
    .toFile('public/logo-white-all.png');
  console.log('Saved public/logo-white-all.png');

  // 3. Find exact bounding box of non-transparent content to create tight cropped versions
  let cropMinX = width, cropMaxX = 0, cropMinY = height, cropMaxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const a = coloredData[(y * width + x) * 4 + 3];
      if (a > 15) {
        if (x < cropMinX) cropMinX = x;
        if (x > cropMaxX) cropMaxX = x;
        if (y < cropMinY) cropMinY = y;
        if (y > cropMaxY) cropMaxY = y;
      }
    }
  }

  console.log(`Content bounding box: x=${cropMinX}..${cropMaxX} (w=${cropMaxX - cropMinX + 1}), y=${cropMinY}..${cropMaxY} (h=${cropMaxY - cropMinY + 1})`);

  // Add clean balanced padding (e.g. 16px horizontal, 12px vertical)
  const padX = 20;
  const padY = 16;
  const tightLeft = Math.max(0, cropMinX - padX);
  const tightTop = Math.max(0, cropMinY - padY);
  const tightWidth = Math.min(width - tightLeft, (cropMaxX - cropMinX + 1) + 2 * padX);
  const tightHeight = Math.min(height - tightTop, (cropMaxY - cropMinY + 1) + 2 * padY);

  console.log(`Tight crop: left=${tightLeft}, top=${tightTop}, width=${tightWidth}, height=${tightHeight}`);

  // Save logo-tight.png (colored, cropped)
  await sharp(coloredData, { raw: { width, height, channels: 4 } })
    .extract({ left: tightLeft, top: tightTop, width: tightWidth, height: tightHeight })
    .png()
    .toFile('public/logo-tight.png');
  console.log('Saved public/logo-tight.png');

  // Save logo-white.png (white text + red knot, cropped tight)
  await sharp(whiteData, { raw: { width, height, channels: 4 } })
    .extract({ left: tightLeft, top: tightTop, width: tightWidth, height: tightHeight })
    .png()
    .toFile('public/logo-white.png');
  console.log('Saved public/logo-white.png');

  // 4. Copy all created logo files to src/assets
  const filesToCopy = [
    'logo.png',
    'logo-transparent.png',
    'logo-tight.png',
    'logo-white.png',
    'logo-white-full.png',
    'logo-white-all.png'
  ];

  for (const f of filesToCopy) {
    fs.copyFileSync(`public/${f}`, `src/assets/${f}`);
  }
  console.log('Successfully copied all logo variants to src/assets/');

  // 5. Generate high-res square favicon from the knot symbol
  // Knot bounds: x=440..583, y=150..210 (w=144, h=61)
  const knotCenterX = 511.5;
  const knotCenterY = 180;
  const knotBoxSize = 170; // square
  const knotLeft = Math.round(knotCenterX - knotBoxSize / 2);
  const knotTop = Math.round(knotCenterY - knotBoxSize / 2);

  await sharp(coloredData, { raw: { width, height, channels: 4 } })
    .extract({ left: knotLeft, top: knotTop, width: knotBoxSize, height: knotBoxSize })
    .resize(64, 64)
    .png()
    .toFile('public/favicon.png');
  fs.copyFileSync('public/favicon.png', 'src/assets/favicon.png');
  console.log('Saved public/favicon.png & src/assets/favicon.png');
}

buildLogos().catch(err => {
  console.error(err);
  process.exit(1);
});

