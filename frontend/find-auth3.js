const fs = require('fs');
const src = fs.readFileSync('c:/Users/Usuario/AppData/Local/nvm/v20.20.1/node_modules/vercel/dist/chunks/chunk-LOS2AA5C.js', 'utf8');
// Find getAuthConfigFilePath
const idx = src.indexOf('getAuthConfigFilePath');
if (idx >= 0) {
  console.log('getAuthConfigFilePath:', src.slice(idx - 50, idx + 500));
}
