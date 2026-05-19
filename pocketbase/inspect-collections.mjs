async function run() {
  const base = 'http://localhost:8090/api'
  
  // Authenticate as superuser/admin to get full access to collections
  const authRes = await fetch(`${base}/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: 'admin@novastack.local', password: 'novastack123' })
  })
  const auth = await authRes.json()
  if (!auth.token) {
    console.error('Failed to login:', auth)
    return
  }

  // Fetch contacts, deals, and invoices collections
  for (const name of ['contacts', 'deals', 'invoices']) {
    const res = await fetch(`${base}/collections/${name}`, {
      headers: { 'Authorization': auth.token }
    })
    const data = await res.json()
    console.log(`=== Collection: ${name} ===`)
    console.log(JSON.stringify(data, null, 2))
  }
}

run().catch(console.error)
