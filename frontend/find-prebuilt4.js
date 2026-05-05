const fs = require('fs');
const path = require('path');
const dir = 'c:/Users/Usuario/AppData/Local/nvm/v20.20.1/node_modules/vercel/dist/chunks';
const files = fs.readdirSync(dir);
for (const f of files) {
  const src = fs.readFileSync(path.join(dir, f), 'utf8');
  const idx = src.indexOf('Prebuilt deployment cannot');
  if (idx >= 0) {
    console.log('Found in:', f);
    console.log(src.slice(idx - 500, idx + 800));
    break;
  }
}
