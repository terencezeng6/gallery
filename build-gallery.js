const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const exifr = require('exifr'); // To read EXIF metadata

const IMAGE_DIR = path.join(__dirname, 'images_clean');
const THUMBNAIL_DIR = path.join(__dirname, 'assets', 'thumbnails');
const OUTPUT_FILE = path.join(__dirname, 'gallery-data.json');

const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

// Format date helper
function formatDate(date) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

// Recursively find all supported images in a directory
function walkSync(dir, filelist = []) {
  if (!fs.existsSync(dir)) return filelist;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file.startsWith('.')) continue; // Skip hidden
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      filelist = walkSync(filepath, filelist);
    } else {
      const ext = path.extname(file).toLowerCase();
      if (SUPPORTED_EXTENSIONS.includes(ext)) {
        filelist.push({ filepath, stat });
      }
    }
  }
  return filelist;
}

async function buildGallery() {
  console.log('Building gallery asset pipeline...');

  // Create thumbnails directory if it doesn't exist
  if (!fs.existsSync(THUMBNAIL_DIR)) {
    fs.mkdirSync(THUMBNAIL_DIR, { recursive: true });
  }

  // Read existing JSON data if available, to preserve manual descriptions
  let existingData = [];
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      existingData = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
      console.log(`Loaded existing data with ${existingData.length} records.`);
    } catch (e) {
      console.warn('Could not parse existing gallery-data.json');
    }
  }

  const images = walkSync(IMAGE_DIR);
  const galleryData = [];

  console.log(`Found ${images.length} images. Processing...`);

  let count = 0;
  for (const { filepath, stat } of images) {
    count++;
    // Path relative to root, e.g., 'images/spring 2025/photo.jpg'
    const relPath = path.relative(__dirname, filepath).replace(/\\/g, '/');
    const filename = path.basename(filepath);

    // Thumbnail name logic mapping
    const thumbFilename = relPath.replace(/\//g, '_') + '.webp';
    const thumbPath = path.join(THUMBNAIL_DIR, thumbFilename);
    const thumbRelPath = 'assets/thumbnails/' + thumbFilename;

    // Check if thumbnail already exists
    if (!fs.existsSync(thumbPath)) {
      console.log(`[${count}/${images.length}] Generating thumbnail for ${filename}...`);
      try {
        await sharp(filepath)
          .resize({ width: 800, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(thumbPath);
      } catch (err) {
        console.error(`Error processing ${filename}:`, err);
        continue;
      }
    }

    // Check against existing data to preserve description
    const existingRecord = existingData.find(d => d.original === relPath);

    let finalDate = null;
    let dateFormatted = '';

    if (existingRecord && existingRecord.dateFormatted) {
      dateFormatted = existingRecord.dateFormatted;
      // Best effort Parse date text to unix timestamp for sorting
      finalDate = new Date(dateFormatted).getTime();
      if (isNaN(finalDate)) {
        // Fallback if parsing fails
        finalDate = stat.birthtimeMs || stat.mtimeMs;
      }
    } else {
      // New Image logic
      let exifDate = null;
      try {
        const exifData = await exifr.parse(filepath, { pick: ['DateTimeOriginal', 'CreateDate'] });
        if (exifData && (exifData.DateTimeOriginal || exifData.CreateDate)) {
          exifDate = exifData.DateTimeOriginal || exifData.CreateDate;
        }
      } catch (e) { /* ignore EXIF errors */ }

      const d = exifDate || stat.birthtime || stat.mtime;
      finalDate = d.getTime();
      dateFormatted = formatDate(d);
    }

    galleryData.push({
      original: relPath,
      thumbnail: thumbRelPath,
      date: finalDate,
      dateFormatted: dateFormatted,
      description: existingRecord && existingRecord.description ? existingRecord.description : ''
    });
  }

  // Sort newer images first
  galleryData.sort((a, b) => b.date - a.date);

  // Write the JSON database
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(galleryData, null, 2));
  console.log(`Gallery built successfully! Wrote ${galleryData.length} records to ${path.basename(OUTPUT_FILE)}.`);
}

buildGallery().catch(console.error);
