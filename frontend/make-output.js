const fs = require('fs');
const path = require('path');

const outDir = '.vercel/output';
const staticDir = outDir + '/static';

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(staticDir, { recursive: true });

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}
copyDir('build', staticDir);

const config = {
  version: 3,
  routes: [
    { src: '/api/(.*)', dest: 'https://backend-ten-silk-u6zw9pm14c.vercel.app/api/$1' },
    { handle: 'filesystem' },
    { src: '/(.*)', dest: '/index.html' }
  ]
};
fs.writeFileSync(outDir + '/config.json', JSON.stringify(config, null, 2));
console.log('Done:', fs.readdirSync(staticDir).length, 'entries');
