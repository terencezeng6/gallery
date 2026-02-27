const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const indexOriginalStr = fs.readFileSync('index_original.html', 'utf8');
const $ = cheerio.load(indexOriginalStr);

const imageSrcs = [];

$('.gallery .image').each((i, el) => {
  const $el = $(el);
  const imgPath = $el.find('img').attr('src');
  if (imgPath && imgPath.startsWith('images/')) {
    imageSrcs.push(imgPath);
  }
});

console.log(`Found ${imageSrcs.length} images in original index.html`);

// Create images_clean directory
const cleanDir = path.join(__dirname, 'images_clean');
if (!fs.existsSync(cleanDir)) {
  fs.mkdirSync(cleanDir);
}

// Copy each image to its respective path in images_clean
let successCount = 0;
imageSrcs.forEach(src => {
  const srcPath = path.join(__dirname, src);
  // Decode URI since html src might have %20
  const decodedSrc = decodeURIComponent(srcPath);
  const destPath = path.join(__dirname, decodeURIComponent(src).replace('images/', 'images_clean/'));

  // Ensure dest directory exists
  const destDir = path.dirname(destPath);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  if (fs.existsSync(decodedSrc)) {
    fs.copyFileSync(decodedSrc, destPath);
    successCount++;
  } else {
    console.warn(`File not found: ${decodedSrc}`);
  }
});

console.log(`Successfully copied ${successCount} images to images_clean.`);
