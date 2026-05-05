const fs = require('fs');
const src = fs.readFileSync('c:/Users/Usuario/AppData/Local/nvm/v20.20.1/node_modules/vercel/dist/chunks/chunk-PD5HCBBY.js', 'utf8');
// Find getGlobalPathConfig definition
let i = 0;
while (i < src.length) {
  const pos = src.indexOf('getGlobalPathConfig', i);
  if (pos < 0) break;
  const ctx = src.slice(pos - 20, pos + 400);
  if (ctx.includes('function') || ctx.includes('=>') || ctx.includes('join') || ctx.includes('home')) {
    console.log(`pos ${pos}:`, ctx.slice(0, 300));
    console.log('---');
  }
  i = pos + 1;
}
