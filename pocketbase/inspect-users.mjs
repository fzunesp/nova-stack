async function run() {
  const base = 'http://localhost:8090/api'
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

  const res = await fetch(`${base}/collections/users`, {
    headers: { 'Authorization': auth.token }
  })
  const data = await res.json()
  console.log(`=== Collection: users ===`)
  console.log(JSON.stringify(data, null, 2))
}

run().catch(console.error)
