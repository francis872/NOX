const fs = require('fs');
const src = fs.readFileSync('c:/Users/Usuario/AppData/Local/nvm/v20.20.1/node_modules/vercel/dist/chunks/chunk-PD5HCBBY.js', 'utf8');
// Search for global_path function definition (lowercase)
let found = false;
let i = 0;
while (i < src.length) {
  const pos = src.indexOf('function global_path', i);
  if (pos < 0) break;
  console.log('global_path func at', pos, ':', src.slice(pos, pos + 500));
  found = true;
  i = pos + 1;
}
if (!found) {
  // Try to find the actual definition another way
  const idx = src.indexOf('global_path_default = ');
  if (idx >= 0) console.log('global_path_default = at', idx, ':', src.slice(idx, idx + 300));
}
