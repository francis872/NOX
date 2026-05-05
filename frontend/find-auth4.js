const fs = require('fs');
const src = fs.readFileSync('c:/Users/Usuario/AppData/Local/nvm/v20.20.1/node_modules/vercel/dist/chunks/chunk-LOS2AA5C.js', 'utf8');
// Find AUTH_CONFIG_FILE_PATH definition
const idx = src.indexOf('AUTH_CONFIG_FILE_PATH');
if (idx >= 0) {
  // Search for where it's set
  // Find the variable assignment
  let i = 0;
  while (i < src.length) {
    const pos = src.indexOf('AUTH_CONFIG_FILE_PATH', i);
    if (pos < 0) break;
    const ctx = src.slice(pos - 10, pos + 200);
    if (ctx.includes('=') || ctx.includes('path')) {
      console.log(`pos ${pos}:`, ctx);
    }
    i = pos + 1;
  }
}
