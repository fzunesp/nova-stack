import fetch from 'node-fetch';

async function run() {
  const base = 'http://localhost:8090/api';
  
  // Authenticate as superuser to fetch contacts
  const authRes = await fetch(`${base}/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: 'admin@novastack.local', password: 'novastack123' })
  });
  const auth = await authRes.json();
  const headers = { 'Authorization': auth.token };

  const res = await fetch(`${base}/collections/contacts/records?perPage=1`, { headers });
  const data = await res.json();
  
  console.log('=== ONE CONTACT RECORD FROM DB ===');
  console.log(JSON.stringify(data.items?.[0] || 'No contacts found', null, 2));
}

run().catch(console.error);
