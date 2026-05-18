async function seed() {
  const base = 'http://localhost:8090/api'
  
  const authRes = await fetch(`${base}/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: 'admin@novastack.local', password: 'novastack123' })
  })
  const auth = await authRes.json()
  const token = auth.token
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }

  // Create demo users
  const users = []
  for (let i = 1; i <= 3; i++) {
    const userRes = await fetch(`${base}/collections/users/records`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email: `user${i}@demo.com`,
        password: 'password123',
        passwordConfirm: 'password123',
        name: `Demo User ${i}`,
      })
    })
    if (userRes.ok) {
      const user = await userRes.json()
      users.push(user)
      console.log(`Created user: ${user.email}`)
    } else {
      const err = await userRes.json()
      console.log(`User user${i}@demo.com may already exist:`, err.message)
      // Try to fetch existing
      const listRes = await fetch(`${base}/collections/users/records?filter=(email='user${i}@demo.com')`, { headers })
      const list = await listRes.json()
      if (list.items?.[0]) users.push(list.items[0])
    }
  }

  if (users.length === 0) {
    console.error('No users created/found, aborting seed')
    return
  }

  const userId = users[0].id

  // Create contacts
  const contacts = []
  for (let i = 1; i <= 15; i++) {
    const res = await fetch(`${base}/collections/contacts/records`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: `Contact ${i}`,
        email: `contact${i}@example.com`,
        phone: `+1-555-01${String(i).padStart(2, '0')}`,
        companyName: `Company ${i % 5 + 1}`,
        notes: `Notes for contact ${i}`,
        userId,
        created_by: userId,
        status: 'active',
      })
    })
    if (res.ok) {
      const data = await res.json()
      contacts.push(data)
    }
  }
  console.log(`Created ${contacts.length} contacts`)

  // Create deals
  const stages = ['lead', 'contacted', 'quoted', 'won', 'lost']
  const dealStatuses = ['active', 'active', 'pending', 'approved', 'rejected']
  const deals = []
  for (let i = 1; i <= 12; i++) {
    const res = await fetch(`${base}/collections/deals/records`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: `Deal ${i}`,
        value: Math.floor(Math.random() * 50000) + 5000,
        stage: stages[i % stages.length],
        expectedCloseDate: new Date(Date.now() + i * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        contactId: contacts[i % contacts.length]?.id || null,
        userId,
        assignedToId: users[i % users.length]?.id || userId,
        created_by: userId,
        status: dealStatuses[i % dealStatuses.length],
      })
    })
    if (res.ok) {
      const data = await res.json()
      deals.push(data)
    }
  }
  console.log(`Created ${deals.length} deals`)

  // Create tasks
  const taskStatuses = ['draft', 'active', 'approved']
  const tasks = []
  for (let i = 1; i <= 20; i++) {
    const res = await fetch(`${base}/collections/tasks/records`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: `Task ${i}: ${['Call back', 'Send proposal', 'Review contract', 'Update CRM', 'Schedule meeting'][i % 5]}`,
        description: `Detailed description for task ${i}`,
        status: taskStatuses[i % taskStatuses.length],
        dueDate: new Date(Date.now() + i * 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        userId,
        assignedToId: users[i % users.length]?.id || userId,
        created_by: userId,
      })
    })
    if (res.ok) {
      const data = await res.json()
      tasks.push(data)
    }
  }
  console.log(`Created ${tasks.length} tasks`)

  // Create products
  const products = []
  const demoProducts = [
    { name: 'Software Development', sku: 'DEV-SR', price: 150, status: 'active', description: 'Senior software engineering hourly rate' },
    { name: 'Cloud Consulting', sku: 'CNS-CLD', price: 200, status: 'active', description: 'AWS/GCP Cloud architecture and migration consulting' },
    { name: 'UI/UX Design', sku: 'DSN-UI', price: 125, status: 'active', description: 'Product design, mockups, and layout design' },
    { name: 'Project Management', sku: 'MGT-PRJ', price: 100, status: 'active', description: 'Agile project management and coordination' },
    { name: 'Monthly Support Retainer', sku: 'RET-MTH', price: 1500, status: 'active', description: '10 hours of monthly maintenance and updates' },
  ]
  for (const prod of demoProducts) {
    const res = await fetch(`${base}/collections/products/records`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...prod, userId, created_by: userId })
    })
    if (res.ok) {
      const data = await res.json()
      products.push(data)
    }
  }
  console.log(`Created ${products.length} products`)

  // Create invoices
  const invoiceStatuses = ['draft', 'pending', 'approved', 'rejected']
  const invoices = []
  for (let i = 1; i <= 10; i++) {
    const issued = new Date(Date.now() - i * 10 * 24 * 60 * 60 * 1000)
    const due = new Date(issued.getTime() + 30 * 24 * 60 * 60 * 1000)
    
    // Build seed line items
    const lineItems = []
    let computedAmount = 0
    if (products.length > 0) {
      const count = Math.floor(Math.random() * 3) + 1
      const shuffled = [...products].sort(() => 0.5 - Math.random())
      const selected = shuffled.slice(0, count)
      for (const p of selected) {
        const qty = Math.floor(Math.random() * 5) + 1
        const total = p.price * qty
        computedAmount += total
        lineItems.push({
          productId: p.id,
          name: p.name,
          price: p.price,
          quantity: qty,
          total
        })
      }
    } else {
      computedAmount = Math.floor(Math.random() * 10000) + 1000
    }

    const res = await fetch(`${base}/collections/invoices/records`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: `Invoice #${2025 + i}`,
        amount: computedAmount,
        status: invoiceStatuses[i % invoiceStatuses.length],
        issuedDate: issued.toISOString().split('T')[0],
        dueDate: due.toISOString().split('T')[0],
        paidAt: invoiceStatuses[i % invoiceStatuses.length] === 'approved' ? due.toISOString().split('T')[0] : null,
        userId,
        dealId: deals[i % deals.length]?.id || null,
        created_by: userId,
        lineItems: JSON.stringify(lineItems),
      })
    })
    if (res.ok) {
      const data = await res.json()
      invoices.push(data)
    }
  }
  console.log(`Created ${invoices.length} invoices`)

  // Create intake submissions
  const intakeTypes = ['general', 'vacation', 'reimbursement', 'hardware']
  const intakeStatuses = ['draft', 'pending', 'approved', 'rejected', 'archived']
  const sources = ['external', 'internal']
  const intakes = []
  for (let i = 1; i <= 8; i++) {
    const res = await fetch(`${base}/collections/intake_submissions/records`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: `Submission ${i}`,
        email: `submitter${i}@example.com`,
        message: `This is a test intake submission ${i}`,
        type: intakeTypes[i % intakeTypes.length],
        source: sources[i % sources.length],
        status: intakeStatuses[i % intakeStatuses.length],
        reference: `REF-${String(i).padStart(4, '0')}`,
        data: JSON.stringify({ extraInfo: `Extra data ${i}` }),
        decisionNote: i > 3 ? `Decision note for submission ${i}` : '',
        decidedAt: i > 3 ? new Date().toISOString().split('T')[0] : null,
        userId,
        assignedToId: users[i % users.length]?.id || userId,
        created_by: userId,
      })
    })
    if (res.ok) {
      const data = await res.json()
      intakes.push(data)
    }
  }
  console.log(`Created ${intakes.length} intake submissions`)

  console.log('\nSeed complete!')
}

seed().catch(console.error)
