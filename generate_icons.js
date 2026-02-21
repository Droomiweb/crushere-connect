const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// We have the source image from the user's prompt (it's the last artifact).
// But since we can't easily grab it from the prompt history via Node,
// we will just copy the image provided in the prompt if we know its path,
// OR since the user uploaded an image, it was saved to the artifact directory.
// Let's find the latest PNG in the artifact directory.
const artifactDir = '/Users/Abin/.gemini/antigravity/brain/8f0cb85d-7576-46bd-9398-69a609073552';
const files = fs.readdirSync(artifactDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg'));

// Find the most recent image
let latestImage = '';
let latestTime = 0;
for (const file of files) {
  const stat = fs.statSync(path.join(artifactDir, file));
  if (stat.mtimeMs > latestTime) {
    latestTime = stat.mtimeMs;
    latestImage = path.join(artifactDir, file);
  }
}

if (!latestImage) {
  console.log('No recent image found in artifact directory.');
  process.exit(1);
}

console.log('Using image:', latestImage);

// Instead of sharp (which might not be installed), we'll just copy this image 
// as the main logo and use CSS/HTML to scale it. It's a modern standard 
// to just use a PNG or SVG for favicon.

const publicDir = '/Users/Abin/crushere-connect/public';
fs.copyFileSync(latestImage, path.join(publicDir, 'logo.png'));
fs.copyFileSync(latestImage, path.join(publicDir, 'favicon.png'));
fs.copyFileSync(latestImage, path.join(publicDir, 'apple-touch-icon.png'));

console.log('Icons copied successfully.');
