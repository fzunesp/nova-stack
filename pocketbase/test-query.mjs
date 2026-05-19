async function run() {
  const base = 'http://localhost:8090/api'
  
  // Authenticate as admin user in users collection
  const authRes = await fetch(`${base}/collections/users/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: 'admin@nova-stack.local', password: 'password123' })
  })
  const auth = await authRes.json()
  if (!auth.token) {
    console.error('Failed to login:', auth)
    return
  }

  const token = auth.token

  // Test 1: Query deals with filter
  console.log('--- Test 1: filter only ---')
  let res = await fetch(`${base}/collections/deals/records?filter=companyId%3D%225y4vk7br4k0mrdk%22`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  console.log('Status:', res.status)
  console.log('Body:', await res.json())

  // Test 2: Query deals with sort=-created
  console.log('--- Test 2: sort=-created ---')
  res = await fetch(`${base}/collections/deals/records?filter=companyId%3D%225y4vk7br4k0mrdk%22&sort=-created`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  console.log('Status:', res.status)
  console.log('Body:', await res.json())

  // Test 3: Query deals with sort=-id
  console.log('--- Test 3: sort=-id ---')
  res = await fetch(`${base}/collections/deals/records?filter=companyId%3D%225y4vk7br4k0mrdk%22&sort=-id`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  console.log('Status:', res.status)
  console.log('Body:', await res.json())
}

run().catch(console.error)
