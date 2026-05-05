const https = require('https');

const TOKEN = 'vca_4QjvxGE66YYlH5dxRCKoa8XqS6eeCyjew1yBlANgw7ZTevBTAf0xSgQe';
const PROJECT_ID = 'prj_0ZddE87ZMfouU4ynao4lNbka46gA';
const ORG_ID = 'team_WT8oQMULEuIcLcMA9I0vtpTC';

// Update project settings: set root directory to "frontend"
const body = JSON.stringify({
  rootDirectory: 'frontend',
  nodeVersion: '20.x',
  buildCommand: 'npm run build',
  outputDirectory: 'build',
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
    const json = JSON.parse(data);
    console.log('nodeVersion:', json.nodeVersion);
    console.log('buildCommand:', json.buildCommand);
    console.log('rootDirectory:', json.rootDirectory);
    console.log('outputDirectory:', json.outputDirectory);
    if (json.error) console.log('ERROR:', JSON.stringify(json.error));
  });
});

req.on('error', console.error);
req.write(body);
req.end();
