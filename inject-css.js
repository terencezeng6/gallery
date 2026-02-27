const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Replace the CSS block for .image img exactly
html = html.replace(
  /\.image img\s*\{\s*height: 100%;\s*width: auto;\s*border-radius: 5px;\s*display: block;\s*\}/g,
  `.image img {
            height: 100%;
            width: auto;
            border-radius: 5px;
            display: block;
            opacity: 0;
            transition: opacity 0.8s ease-in;
        }

        .image img.image-loaded {
            opacity: 1;
        }`
);

fs.writeFileSync('index.html', html);
console.log("CSS injected.");
