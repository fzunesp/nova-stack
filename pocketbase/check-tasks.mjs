const base = 'http://localhost:8090/api';

async function checkTask() {
  const authRes = await fetch(`${base}/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: 'admin@novastack.local', password: 'novastack123' })
  });
  const auth = await authRes.json();
  const headers = { 'Authorization': `Bearer ${auth.token}`, 'Content-Type': 'application/json' };

  const res = await fetch(`${base}/collections/tasks/records?perPage=50`, { headers });
  const data = await res.json();
  console.log('Tasks found:', data.totalItems);
  if (data.items) {
    data.items.forEach(t => console.log(`- ${t.id}: ${t.title}`));
  }
}

checkTask().catch(console.error);
