const fs = require('fs');
const path = require('path');
const dir = 'c:/Users/Usuario/AppData/Local/nvm/v20.20.1/node_modules/vercel/dist/chunks';
const files = fs.readdirSync(dir);
for (const f of files) {
  const src = fs.readFileSync(path.join(dir, f), 'utf8');
  if (src.includes('global_path_default') || src.includes('globalPath') || src.includes('global-path')) {
    console.log('File:', f);
    const idx = src.indexOf('global_path_default');
    const idx2 = src.indexOf('globalPath');
    if (idx >= 0) console.log(src.slice(idx, idx + 300));
    if (idx2 >= 0) console.log(src.slice(idx2 - 50, idx2 + 300));
    break;
  }
}
