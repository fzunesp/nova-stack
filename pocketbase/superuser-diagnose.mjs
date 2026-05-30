import fetch from 'node-fetch';

async function run() {
  const base = 'http://localhost:8090/api';
  
  // 1. Authenticate as superuser
  console.log('Authenticating as superuser...');
  const authRes = await fetch(`${base}/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: 'admin@novastack.local', password: 'novastack123' })
  });
  const auth = await authRes.json();
  if (!auth.token) {
    console.error('Superuser auth failed:', auth);
    return;
  }
  console.log('Superuser authenticated ✓');
  
  const headers = {
    'Authorization': auth.token,
    'Content-Type': 'application/json'
  };

  // 2. Try creating a contact as superuser
  console.log('\n--- Test: Create contact as superuser ---');
  const payload = {
    name: 'Superuser Test Contact',
    email: 'superuser.test@example.com'
  };
  const res = await fetch(`${base}/collections/contacts/records`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  
  console.log('Response Status:', res.status);
  console.log('Response Body:', await res.text());
}

run().catch(console.error);
