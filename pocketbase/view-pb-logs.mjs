import fetch from 'node-fetch';

async function run() {
  const base = 'http://localhost:8090/api';
  
  const adminAuthRes = await fetch(`${base}/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: 'admin@novastack.local', password: 'novastack123' })
  });
  const adminAuth = await adminAuthRes.json();
  
  const logsRes = await fetch(`${base}/logs?page=1&perPage=20`, {
    headers: { 'Authorization': adminAuth.token }
  });
  const logs = await logsRes.json();
  
  console.log('Top 20 logs:');
  logs.items.forEach((item, i) => {
    console.log(`[${i}]: method=${item.data?.method}, url=${item.data?.url}, status=${item.data?.status}`);
    if (item.data?.status === 400) {
      console.log('Error details:', JSON.stringify(item.data, null, 2));
    }
  });
}

run().catch(console.error);
