const https = require('https');

const TOKEN = 'vca_4QjvxGE66YYlH5dxRCKoa8XqS6eeCyjew1yBlANgw7ZTevBTAf0xSgQe';
const ORG_ID = 'team_WT8oQMULEuIcLcMA9I0vtpTC';
const DEPLOY_URL = 'nox-platform-l5ognyb5q-thisharmonyconecct-4448s-projects.vercel.app';

// Get deployment info
const options = {
  hostname: 'api.vercel.com',
  path: `/v13/deployments/${encodeURIComponent(DEPLOY_URL)}?teamId=${ORG_ID}`,
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${TOKEN}`,
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    const json = JSON.parse(data);
    console.log('id:', json.id);
    console.log('state:', json.readyState);
    console.log('error:', JSON.stringify(json.errorCode || json.error || ''));
    if (json.id) {
      // Get build logs
      const logOpts = {
        hostname: 'api.vercel.com',
        path: `/v2/deployments/${json.id}/events?teamId=${ORG_ID}&limit=100&follow=0`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${TOKEN}` }
      };
      const logReq = https.request(logOpts, (logRes) => {
        let logData = '';
        logRes.on('data', (c) => logData += c);
        logRes.on('end', () => {
          console.log('Log status:', logRes.statusCode);
          // Parse NDJSON
          const lines = logData.split('\n').filter(Boolean);
          for (const l of lines.slice(-60)) {
            try {
              const obj = JSON.parse(l);
              if (obj.type === 'command' || obj.type === 'stderr' || obj.type === 'stdout') {
                console.log(`[${obj.type}] ${(obj.payload?.text || '').slice(0, 200)}`);
              }
            } catch(e) {}
          }
        });
      });
      logReq.on('error', console.error);
      logReq.end();
    }
  });
});

req.on('error', console.error);
req.end();
