/**
 * Copy Web Component Assets Script
 * 
 * This script copies bundle.js, bundle.css, and assets (fonts, icons) from
 * @piserve-tech web component packages to src/assets for the shell to load at runtime.
 * 
 * Usage: node scripts/copy-webcomponent-assets.js
 */

const fs = require('fs');
const path = require('path');

const WEB_COMPONENTS = [
  'octa-form-builder-webcomponent',
  'octa-form-submission-webcomponent',
  'octa-form-preview-webcomponent'
];

const NODE_MODULES = path.join(__dirname, '..', 'node_modules', '@piserve-tech');
const DEST_BASE = path.join(__dirname, '..', 'src', 'assets');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return false;

  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(child => {
      copyRecursive(path.join(src, child), path.join(dest, child));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
  return true;
}

function copyWebComponent(name) {
  const srcDir = path.join(NODE_MODULES, name, 'dist');
  const destDir = path.join(DEST_BASE, name);

  if (!fs.existsSync(srcDir)) {
    console.warn(`⚠️  ${name}: Package not found in node_modules`);
    return false;
  }

  // Ensure destination exists
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  let copied = false;

  // Copy bundle.js
  const bundleJs = path.join(srcDir, 'bundle.js');
  if (fs.existsSync(bundleJs)) {
    fs.copyFileSync(bundleJs, path.join(destDir, 'bundle.js'));
    copied = true;
  }

  // Copy bundle.css
  const bundleCss = path.join(srcDir, 'bundle.css');
  if (fs.existsSync(bundleCss)) {
    fs.copyFileSync(bundleCss, path.join(destDir, 'bundle.css'));
  }

  // Copy assets folder (fonts, icons)
  const assetsDir = path.join(srcDir, 'assets');
  if (fs.existsSync(assetsDir)) {
    copyRecursive(assetsDir, destDir);
  }

  if (copied) {
    const size = (fs.statSync(path.join(destDir, 'bundle.js')).size / 1024).toFixed(1);
    console.log(`✅ ${name}: Copied (${size} KB)`);
  }

  return copied;
}

console.log('\n📦 Copying Web Component Assets...\n');

let successCount = 0;
let failCount = 0;

WEB_COMPONENTS.forEach(name => {
  if (copyWebComponent(name)) {
    successCount++;
  } else {
    failCount++;
  }
});

console.log(`\n📊 Summary: ${successCount} copied, ${failCount} skipped\n`);

if (failCount > 0) {
  console.log('💡 Run "npm install" to install missing packages\n');
}

