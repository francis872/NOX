const fs = require('fs');
const src = fs.readFileSync('c:/Users/Usuario/AppData/Local/nvm/v20.20.1/node_modules/vercel/dist/index.js', 'utf8');
// Search for auth path
const patterns = ['auth.json', 'credentials', 'authConfig', 'getToken', 'readConfig', 'globalConfig'];
for (const p of patterns) {
  const idx = src.indexOf(p);
  if (idx >= 0) {
    console.log(`\n=== "${p}" at ${idx}:`);
    console.log(src.slice(idx - 100, idx + 400));
  }
}
