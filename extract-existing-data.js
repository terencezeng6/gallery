const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const htmlPath = path.join(__dirname, 'index_original.html');
const jsonPath = path.join(__dirname, 'gallery-data.json');

const html = fs.readFileSync(htmlPath, 'utf8');
const $ = cheerio.load(html);

const galleryData = [];

$('.gallery .image').each((i, el) => {
  const $el = $(el);
  const imgPath = $el.find('img').attr('src');
  const dateText = $el.find('.date').text().trim();
  const descriptionText = $el.find('.description').text().trim();

  if (imgPath && imgPath.startsWith('images/')) {
    galleryData.push({
      original: decodeURIComponent(imgPath).replace('images/', 'images_clean/'),
      thumbnail: decodeURIComponent(imgPath).replace('images/', 'assets/thumbnails/images_clean_').replace(/\//g, '_') + '.webp',
      dateFormatted: dateText,
      description: descriptionText
    });
  }
});

fs.writeFileSync(jsonPath, JSON.stringify(galleryData, null, 2));
console.log(`Extracted ${galleryData.length} records to gallery-data.json (Clean restore)`);
