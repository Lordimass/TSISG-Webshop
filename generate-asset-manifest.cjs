/**
 * Run as part of predploy to generate dist/assets/asset-manifest.json.
 * That json is then used by 404.html to mimic the functionality of
 * index.html, allowing the BrowserRouter to function correctly on
 * GitHub Pages.
 */

const fs = require('fs');
const path = require('path');

function getAssetFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  var array
  if (!arrayOfFiles) {
    array = []
  } else {
    array = arrayOfFiles
  }

  files.forEach((file) => {
    if (fs.statSync(dirPath + '/' + file).isDirectory()) {
        array = getAssetFiles(dirPath + '/' + file, array);
    } else {
        array.push(file);
    }
  });

  return array;
}

const assetsDir = path.join(__dirname, 'dist', 'assets');
const manifestPath = path.join(__dirname, 'dist', 'assets', 'asset-manifest.json');

try {
  // Check if the directory exists
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  const assetFiles = getAssetFiles(assetsDir);

  fs.writeFileSync(manifestPath, JSON.stringify(assetFiles));
} catch (error) {
  console.error('Error generating asset manifest:', error);
  process.exit(1); // Exit with an error code
}