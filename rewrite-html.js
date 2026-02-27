const fs = require('fs');

const path = 'index.html';

// Step 1: Replace Gallery block
let lines = fs.readFileSync(path, 'utf8').split('\n');
const startIndex = lines.findIndex(l => l.includes('<div class="gallery">'));

let sidebarStartIndex = lines.findIndex(l => l.includes('Sidebar') && l.includes('<!--'));
if (sidebarStartIndex === -1) {
  sidebarStartIndex = lines.findIndex(l => l.includes('Sidebar'));
}

if (startIndex !== -1 && sidebarStartIndex !== -1) {
  const endIndex = sidebarStartIndex - 3;
  const newContent = '                <div class="gallery" id="image-gallery"></div>';
  lines.splice(startIndex, endIndex - startIndex + 1, newContent);
  fs.writeFileSync(path, lines.join('\n'));
  console.log("Successfully replaced the HTML gallery lines!");
} else {
  console.log("Gallery already replaced or not found. Start:", startIndex, "Sidebar:", sidebarStartIndex);
}

// Step 2: Inject JS
let html = fs.readFileSync(path, 'utf8');
const scriptCode = [
  "<script>",
  "    document.addEventListener('DOMContentLoaded', async () => {",
  "        const gallery = document.getElementById('image-gallery');",
  "        if(!gallery) return;",
  "        try {",
  "            const response = await fetch('gallery-data.json');",
  "            const images = await response.json();",
  "            ",
  "            images.forEach(imgData => {",
  "                const el = document.createElement('div');",
  "                el.className = 'image';",
  "                el.innerHTML = '<img class=\"lazy-load-image\" data-src=\"' + imgData.thumbnail + '\" src=\"data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 4 3\\'%3E%3C/svg%3E\" alt=\"' + imgData.description + '\" />' +",
  "                               '<div class=\"overlay\">' +",
  "                               '  <p class=\"date\">' + imgData.dateFormatted + '</p>' +",
  "                               '  <p class=\"description\">' + imgData.description + '</p>' +",
  "                               '  <button>' +",
  "                               '    <a href=\"' + imgData.original + '\" target=\"_blank\">' +",
  "                               '      <i class=\"fa-light fa-arrow-up-right-from-square\"></i>' +",
  "                               '    </a>' +",
  "                               '  </button>' +",
  "                               '</div>';",
  "                gallery.appendChild(el);",
  "            });",
  "",
  "            const observerOptions = {",
  "                root: null,",
  "                rootMargin: '100px',",
  "                threshold: 0",
  "            };",
  "",
  "            const observer = new IntersectionObserver((entries, observer) => {",
  "                entries.forEach(entry => {",
  "                    if (entry.isIntersecting) {",
  "                        const img = entry.target;",
  "                        img.src = img.getAttribute('data-src');",
  "                        img.onload = () => { img.classList.add('image-loaded'); };",
  "                        observer.unobserve(img);",
  "                    }",
  "                });",
  "            }, observerOptions);",
  "",
  "            const lazyImages = document.querySelectorAll('.lazy-load-image');",
  "            lazyImages.forEach(img => observer.observe(img));",
  "",
  "        } catch(e) {",
  "            console.error('Error loading gallery data:', e);",
  "        }",
  "    });",
  "</script>"
].join('\n');

if (!html.includes('const response = await fetch')) {
  html = html.replace('</body>', scriptCode + '\n</body>');
  fs.writeFileSync(path, html);
  console.log("Successfully injected the script tag.");
}
