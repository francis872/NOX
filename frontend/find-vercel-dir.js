const xdg = require('C:/Users/Usuario/AppData/Local/nvm/v20.20.1/node_modules/vercel/node_modules/xdg-app-paths');
console.log('xdg keys:', Object.keys(xdg));
const xdgFn = xdg.default || xdg;
const paths = xdgFn('com.vercel.cli').dataDirs();
console.log('Vercel data dirs:', paths);
