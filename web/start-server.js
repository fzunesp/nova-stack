const { exec } = require('child_process');
const http = require('http');

// Start dev server
const server = exec('npm run dev', { cwd: 'C:\\Users\\ADMIN\\Documents\\GeminiApps\\nova-stack\\web' });

server.stdout.on('data', (data) => {
  console.log('[dev]', data.trim());
});

server.stderr.on('data', (data) => {
  console.error('[dev]', data.trim());
});

// Wait for port 5173
function waitForPort(port, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    function check() {
      const req = http.get('http://localhost:' + port, (res) => {
        if (res.statusCode === 200 || res.statusCode === 304) {
          resolve();
        } else {
          retry();
        }
      }).on('error', retry);
      
      function retry() {
        if (Date.now() - start > timeout) {
          reject(new Error('Timeout waiting for port ' + port));
        } else {
          setTimeout(check, 500);
        }
      }
    }
    check();
  });
}

async function main() {
  console.log('Waiting for dev server...');
  await waitForPort(5173);
  console.log('Dev server ready!');
  
  // Keep process alive so server stays running
  setInterval(() => {}, 1000);
}

main().catch(console.error);
