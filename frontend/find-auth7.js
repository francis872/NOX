const fs = require('fs');
const src = fs.readFileSync('c:/Users/Usuario/AppData/Local/nvm/v20.20.1/node_modules/vercel/dist/chunks/chunk-PD5HCBBY.js', 'utf8');
const idx = src.indexOf('global_path_default');
if (idx >= 0) {
  // Find the definition
  console.log('Found at:', idx);
  // Search for function definition
  let i = 0;
  while (i < src.length) {
    const pos = src.indexOf('global_path', i);
    if (pos < 0) break;
    const ctx = src.slice(pos - 10, pos + 400);
    if (ctx.includes('function') || ctx.includes('=>') || ctx.includes('homedir') || ctx.includes('VERCEL')) {
      console.log('pos', pos, ':', ctx.slice(0, 300));
      console.log('---');
    }
    i = pos + 1;
  }
}
