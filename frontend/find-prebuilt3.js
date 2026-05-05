const fs = require('fs');
const src = fs.readFileSync('c:/Users/Usuario/AppData/Local/nvm/v20.20.1/node_modules/vercel/dist/chunks/chunk-WR7S7PWN.js', 'utf8');
// Find what's checked for prebuilt
const prebuiltIdx = src.indexOf('Prebuilt deployment cannot');
console.log('idx:', prebuiltIdx);
if (prebuiltIdx >= 0) {
  console.log(src.slice(prebuiltIdx - 300, prebuiltIdx + 600));
}
// Search for the error message
const errIdx = src.indexOf('prebuilt');
if (errIdx >= 0) console.log('\nFirst occurrence:', src.slice(errIdx, errIdx + 200));
