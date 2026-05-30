async function run() {
  const base = 'http://localhost:8090/api'
  
  const authRes = await fetch(`${base}/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: 'admin@novastack.local', password: 'novastack123' })
  })
  const auth = await authRes.json()
  if (!auth.token) {
    console.error('Superuser auth failed:', JSON.stringify(auth))
    return
  }
  console.log('Superuser authenticated ✓')

  const res = await fetch(`${base}/collections/contacts`, {
    headers: { 'Authorization': auth.token }
  })
  const data = await res.json()

  // Print just the rules and the list of field names
  console.log('\n=== CONTACTS COLLECTION ===')
  console.log('createRule:', data.createRule)
  console.log('listRule:  ', data.listRule)
  console.log('viewRule:  ', data.viewRule)
  console.log('updateRule:', data.updateRule)
  console.log('deleteRule:', data.deleteRule)
  console.log('\nFields:', data.fields?.map(f => `${f.name}(${f.type}${f.required ? ',REQUIRED' : ''})`).join(', '))
}

run().catch(console.error)
