const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgBuffer = fs.readFileSync(path.join(__dirname, '../public/icon.svg'));

async function generate() {
  const configs = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'icon-192x192.png', size: 192 },
    { name: 'icon-512x512.png', size: 512 },
  ];

  for (const { name, size } of configs) {
    const outPath = path.join(__dirname, '../public', name);
    await sharp(svgBuffer).resize(size, size).png().toFile(outPath);
    console.log(`✓ Generated ${name} (${size}x${size})`);
  }

  console.log('\nAll icons generated successfully.');
}

generate().catch(err => {
  console.error('Icon generation failed:', err.message);
  process.exit(1);
});
