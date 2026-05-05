const fs = require('fs');
const src = fs.readFileSync('c:/Users/Usuario/AppData/Local/nvm/v20.20.1/node_modules/vercel/dist/chunks/chunk-PD5HCBBY.js', 'utf8');
// Look for VERCEL_CONFIG_DIR and the global path function
const patterns = ['VERCEL_CONFIG_DIR', 'VERCEL_DIR', '.vercel', 'config_dir', 'configDir'];
for (const p of patterns) {
  const idx = src.indexOf(p);
  if (idx >= 0) {
    console.log(`\n"${p}" at ${idx}:`, src.slice(idx - 100, idx + 300));
  }
}
