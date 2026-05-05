const https = require('https');

const TOKEN = 'vca_4QjvxGE66YYlH5dxRCKoa8XqS6eeCyjew1yBlANgw7ZTevBTAf0xSgQe';
const PROJECT_ID = 'prj_0ZddE87ZMfouU4ynao4lNbka46gA';
const ORG_ID = 'team_WT8oQMULEuIcLcMA9I0vtpTC';

// Update project settings: set Node.js to 20.x and buildCommand to npm run build
const body = JSON.stringify({
  nodeVersion: '20.x',
  buildCommand: 'npm run build',
  outputDirectory: 'build',
  framework: null,
});

const options = {
  hostname: 'api.vercel.com',
  path: `/v9/projects/${PROJECT_ID}?teamId=${ORG_ID}`,
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    try {
      const json = JSON.parse(data);
      console.log('nodeVersion:', json.nodeVersion);
      console.log('buildCommand:', json.buildCommand);
      console.log('outputDirectory:', json.outputDirectory);
      if (json.error) console.log('ERROR:', JSON.stringify(json.error));
    } catch(e) {
      console.log('Response:', data.slice(0, 500));
    }
  });
});

req.on('error', (e) => console.error('Error:', e));
req.write(body);
req.end();
