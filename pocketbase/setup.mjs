async function setupCollections() {
  const base = 'http://localhost:8090/api'
  
  const authRes = await fetch(`${base}/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: 'admin@novastack.local', password: 'novastack123' })
  })
  const auth = await authRes.json()
  const token = auth.token
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }

  // Verify collections have fields
  const collections = ['contacts', 'deals', 'tasks', 'invoices', 'intake_submissions']
  for (const name of collections) {
    const col = await (await fetch(`${base}/collections/${name}`, { headers })).json()
    const fieldNames = col.fields?.map(f => f.name).join(', ')
    console.log(`${name}: ${col.fields?.length || 0} fields [${fieldNames}]`)
  }
}

setupCollections().catch(console.error)
