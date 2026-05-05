const fs = require('fs');
const src = fs.readFileSync('c:/Users/Usuario/AppData/Local/nvm/v20.20.1/node_modules/vercel/dist/index.js', 'utf8');
// Find config path references
const idx = src.indexOf('globalConfigPath');
if (idx >= 0) console.log('globalConfigPath context:', src.slice(idx, idx + 300));

// Find XDG or platform config dir
const xdgIdx = src.indexOf('XDG_CONFIG_HOME');
if (xdgIdx >= 0) console.log('XDG context:', src.slice(xdgIdx - 100, xdgIdx + 300));

// Find token storage location
const tokenIdx = src.indexOf('"token"');
if (tokenIdx >= 0) console.log('token context:', src.slice(tokenIdx - 200, tokenIdx + 400));
