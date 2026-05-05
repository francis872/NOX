const fs = require('fs');
const path = require('path');
const src = fs.readFileSync('c:/Users/Usuario/AppData/Local/nvm/v20.20.1/node_modules/vercel/dist/chunks/chunk-PD5HCBBY.js', 'utf8');
// Find what vercel checks for --prebuilt
const idx = src.indexOf('prebuilt deployment cannot');
const idx2 = src.toLowerCase().indexOf('prebuilt deployment cannot');
console.log('idx:', idx, 'idx2:', idx2);
if (idx2 >= 0) {
  console.log(src.slice(idx2 - 200, idx2 + 500));
}
// Also look for vercelOutputDir
const idx3 = src.indexOf('vercelOutputDir');
if (idx3 >= 0) console.log('\nvercelOutputDir context:', src.slice(idx3 - 100, idx3 + 300));
