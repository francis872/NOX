const fs = require('fs');
const os = require('os');
const path = require('path');

// Search for vercel auth config more broadly
function search(dir, depth = 0) {
  if (depth > 3) return;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory() && (e.name === 'vercel' || e.name === '.vercel' || e.name === 'now' || e.name === '.now')) {
        console.log('DIR:', full);
        try {
          const files = fs.readdirSync(full, { withFileTypes: true });
          for (const f of files) {
            const fp = path.join(full, f.name);
            console.log('  FILE:', fp);
            if (f.name.endsWith('.json')) {
              const content = fs.readFileSync(fp, 'utf8').slice(0, 500);
              console.log('  CONTENT:', content);
            }
          }
        } catch(e2) {}
      } else if (e.isDirectory() && depth < 2) {
        search(full, depth + 1);
      }
    }
  } catch(e) {}
}

// Common locations
const searchPaths = [
  os.homedir(),
  process.env.APPDATA,
  process.env.LOCALAPPDATA,
  process.env.USERPROFILE,
];

for (const p of searchPaths) {
  if (p) search(p);
}
