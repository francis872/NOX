const fs = require('fs');
const src = fs.readFileSync('c:/Users/Usuario/AppData/Local/nvm/v20.20.1/node_modules/vercel/dist/chunks/chunk-LOS2AA5C.js', 'utf8');
// Find VERCEL_DIR2 definition
let i = 0;
while (i < src.length) {
  const pos = src.indexOf('VERCEL_DIR2', i);
  if (pos < 0) break;
  const ctx = src.slice(pos - 5, pos + 200);
  if (ctx.includes('=') && !ctx.startsWith('pos')) {
    console.log(`pos ${pos}:`, ctx.slice(0, 200));
  }
  i = pos + 1;
}
