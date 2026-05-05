const fs = require('fs');
const src = fs.readFileSync('c:/Users/Usuario/AppData/Local/nvm/v20.20.1/node_modules/vercel/dist/chunks/chunk-PD5HCBBY.js', 'utf8');
// Find the export of global_path_default
const idx = src.lastIndexOf('global_path_default');
console.log('Last occurrence at:', idx);
console.log(src.slice(idx - 200, idx + 400));

// Also look for vercel dir in env
const envIdx = src.indexOf('VERCEL_CONFIG_DIR');
if (envIdx >= 0) console.log('\nVERCEL_CONFIG_DIR at:', src.slice(envIdx - 100, envIdx + 300));

// Look for homedir usage
const homedirIdx = src.indexOf('homedir');
if (homedirIdx >= 0) console.log('\nhomedir at:', src.slice(homedirIdx - 100, homedirIdx + 300));
