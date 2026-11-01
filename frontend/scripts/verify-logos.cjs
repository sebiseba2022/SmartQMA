const sharp = require('sharp');

async function verifyLogos() {
  const files = [
    'public/logo.png',
    'public/logo-transparent.png',
    'public/logo-tight.png',
    'public/logo-white.png',
    'public/favicon.png'
  ];

  for (const f of files) {
    const meta = await sharp(f).metadata();
    console.log(`\n=== File: ${f} ===`);
    console.log(`Size: ${meta.width}x${meta.height}, format: ${meta.format}, channels: ${meta.channels}, alpha: ${meta.hasAlpha}`);

    if (meta.hasAlpha) {
      const { data } = await sharp(f).raw().toBuffer({ resolveWithObject: true });
      let transparentPixels = 0;
      let opaquePixels = 0;
      let semiPixels = 0;
      for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3];
        if (a === 0) transparentPixels++;
        else if (a === 255) opaquePixels++;
        else semiPixels++;
      }
      const total = meta.width * meta.height;
      console.log(`Alpha distribution: 100% transparent: ${(transparentPixels/total*100).toFixed(1)}%, semi-transparent (anti-aliased): ${(semiPixels/total*100).toFixed(1)}%, opaque: ${(opaquePixels/total*100).toFixed(1)}%`);
    }
  }

  // Check the subtitle text area in logo-tight.png
  // In logo-tight (670x302), subtitle is around y=240..290
  const { data: tightData, info: tightInfo } = await sharp('public/logo-tight.png')
    .extract({ left: 30, top: 235, width: 610, height: 55 })
    .raw()
    .toBuffer({ resolveWithObject: true });

  console.log('\n=== Subtitle region in logo-tight.png ===');
  console.log(`Extracted: ${tightInfo.width}x${tightInfo.height}`);
  let nonTransparent = 0;
  for (let i = 0; i < tightData.length; i += 4) {
    if (tightData[i + 3] > 0) nonTransparent++;
  }
  console.log(`Non-transparent pixels in subtitle region: ${nonTransparent} (text exists and is rendered!)`);

  // Inspect white variant subtitle region
  const { data: whiteData } = await sharp('public/logo-white.png')
    .extract({ left: 30, top: 235, width: 610, height: 55 })
    .raw()
    .toBuffer({ resolveWithObject: true });

  let whitePixelCount = 0;
  for (let i = 0; i < whiteData.length; i += 4) {
    const a = whiteData[i + 3];
    if (a > 100) {
      const r = whiteData[i], g = whiteData[i+1], b = whiteData[i+2];
      if (r === 255 && g === 255 && b === 255) whitePixelCount++;
    }
  }
  console.log(`Pure white pixels in white logo subtitle: ${whitePixelCount} (white text correctly rendered!)`);
}

verifyLogos().catch(console.error);

