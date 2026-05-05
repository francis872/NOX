const fs = require('fs');
const path = require('path');
const dir = 'c:/Users/Usuario/AppData/Local/nvm/v20.20.1/node_modules/vercel/dist/chunks';
const files = fs.readdirSync(dir);
for (const f of files) {
  const src = fs.readFileSync(path.join(dir, f), 'utf8');
  if (src.includes('prebuilt') || src.includes('pre-built') || src.includes('PREBUILT')) {
    const lines = src.split('\n').filter(l => l.includes('prebuilt') || l.includes('PREBUILT'));
    if (lines.length > 0) {
      console.log('=== File:', f);
      lines.slice(0, 5).forEach(l => console.log(l.trim().slice(0, 150)));
    }
  }
}
