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

  // 1. Create or fetch demo users
  const users = []
  const userEmails = ['admin@nova-stack.local', 'sarah.hr@nova-stack.local', 'mark.sales@nova-stack.local']
  const userRoles = ['admin', 'hr', 'user']
  const userNames = ['System Admin', 'Sarah Jenkins (HR)', 'Mark Torres (Sales)']

  for (let i = 0; i < 3; i++) {
    const listRes = await fetch(`${base}/collections/users/records?filter=(email='${userEmails[i]}')`, { headers })
    const list = await listRes.json()
    
    if (list.items?.[0]) {
      users.push(list.items[0])
    } else {
      const userRes = await fetch(`${base}/collections/users/records`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: userEmails[i],
          password: 'password123',
          passwordConfirm: 'password123',
          name: userNames[i],
          role: userRoles[i],
          emailVisibility: true
        })
      })
      if (userRes.ok) {
        users.push(await userRes.json())
      }
    }
  }

  if (users.length === 0) {
    console.error('No users created/found, aborting seed')
    return
  }

  const adminId = users[0].id
  const hrId = users[1].id
  const salesId = users[2].id

  // Helper to clear existing data for a clean slate
  const collectionsToClear = ['intake_submissions', 'invoices', 'tasks', 'deals', 'contacts', 'companies', 'products']
  console.log('Clearing old data...')
  for (const coll of collectionsToClear) {
    const res = await fetch(`${base}/collections/${coll}/records?perPage=500`, { headers })
    if (res.ok) {
      const data = await res.json()
      for (const item of data.items) {
         await fetch(`${base}/collections/${coll}/records/${item.id}`, { method: 'DELETE', headers })
      }
    }
  }

  // 2. Create Companies
  console.log('\nCreating Companies...')
  const companyTemplates = [
    { name: 'TechFlow Solutions', industry: 'Software', city: 'San Francisco', country: 'USA', website: 'https://techflow.example.com', status: 'active' },
    { name: 'Apex Financial', industry: 'Banking', city: 'New York', country: 'USA', website: 'https://apex-fin.example.com', status: 'lead' },
    { name: 'Lumina Health', industry: 'Healthcare', city: 'Boston', country: 'USA', website: 'https://lumina.example.com', status: 'active' },
    { name: 'Nexus Manufacturing', industry: 'Manufacturing', city: 'Chicago', country: 'USA', website: 'https://nexus-mfg.example.com', status: 'active' },
    { name: 'Horizon Retail', industry: 'Retail', city: 'Austin', country: 'USA', website: 'https://horizon.example.com', status: 'inactive' },
    { name: 'Quantum Logistics', industry: 'Logistics', city: 'Seattle', country: 'USA', website: 'https://quantumlog.example.com', status: 'lead' }
  ]

  const companies = []
  for (const template of companyTemplates) {
    const res = await fetch(`${base}/collections/companies/records`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...template, userId: adminId, created_by: adminId })
    })
    if (res.ok) companies.push(await res.json())
  }
  console.log(`✓ Created ${companies.length} companies`)

  // 3. Create Contacts linked to Companies
  console.log('Creating Contacts...')
  const contactTemplates = [
    // TechFlow
    { name: 'Elena Rostova', title: 'CTO', email: 'elena@techflow.example.com', companyIdx: 0, status: 'active' },
    { name: 'Marcus Chen', title: 'VP Engineering', email: 'marcus@techflow.example.com', companyIdx: 0, status: 'active' },
    // Apex
    { name: 'David Wallace', title: 'CFO', email: 'david.w@apex-fin.example.com', companyIdx: 1, status: 'active' },
    // Lumina
    { name: 'Sarah Connor', title: 'Procurement Director', email: 'sconnor@lumina.example.com', companyIdx: 2, status: 'active' },
    { name: 'Dr. James Wilson', title: 'Head of Research', email: 'jwilson@lumina.example.com', companyIdx: 2, status: 'active' },
    // Nexus
    { name: 'Robert Baratheon', title: 'Operations Manager', email: 'robert@nexus-mfg.example.com', companyIdx: 3, status: 'active' },
    // Horizon
    { name: 'Amanda Clarke', title: 'Regional Director', email: 'aclarke@horizon.example.com', companyIdx: 4, status: 'archived' },
    // Quantum
    { name: 'Priya Patel', title: 'Logistics Coordinator', email: 'ppatel@quantumlog.example.com', companyIdx: 5, status: 'active' }
  ]

  const contacts = []
  for (const template of contactTemplates) {
    const company = companies[template.companyIdx]
    const res = await fetch(`${base}/collections/contacts/records`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: template.name,
        title: template.title,
        email: template.email,
        phone: `+1-555-01${String(Math.floor(Math.random() * 99)).padStart(2, '0')}`,
        companyId: company.id,
        status: template.status,
        userId: salesId,
        assignedToId: salesId,
        created_by: adminId
      })
    })
    if (res.ok) {
      contacts.push(await res.json())
    } else {
      console.error(`Failed to create contact ${template.name}:`, await res.text())
    }
  }
  console.log(`✓ Created ${contacts.length} contacts`)

  // 4. Create Deals
  console.log('Creating Deals...')
  const dealTemplates = [
    { title: 'Enterprise Software License Q3', value: 125000, stage: 'won', companyIdx: 0, contactIdx: 0 },
    { title: 'Cloud Infrastructure Migration', value: 85000, stage: 'contacted', companyIdx: 0, contactIdx: 1 },
    { title: 'Financial Audit System', value: 210000, stage: 'quoted', companyIdx: 1, contactIdx: 2 },
    { title: 'Medical Records Sync Tool', value: 65000, stage: 'lead', companyIdx: 2, contactIdx: 4 },
    { title: 'Factory Automation Dashboard', value: 95000, stage: 'won', companyIdx: 3, contactIdx: 5 },
    { title: 'POS Integration Pilot', value: 25000, stage: 'lost', companyIdx: 4, contactIdx: 6 },
    { title: 'Fleet Tracking API', value: 45000, stage: 'quoted', companyIdx: 5, contactIdx: 7 }
  ]

  const deals = []
  for (let i = 0; i < dealTemplates.length; i++) {
    const t = dealTemplates[i]
    const company = companies[t.companyIdx]
    const contact = contacts[t.contactIdx]
    
    // Status depends on stage
    const statusMap = { 'won': 'approved', 'lost': 'rejected', 'lead': 'active', 'contacted': 'active', 'quoted': 'pending' }
    
    const res = await fetch(`${base}/collections/deals/records`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: t.title,
        value: t.value,
        stage: t.stage,
        expectedCloseDate: new Date(Date.now() + (i * 5 - 10) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        companyId: company.id,
        contactId: contact.id,
        status: statusMap[t.stage],
        userId: salesId,
        assignedToId: salesId,
        created_by: adminId
      })
    })
    if (res.ok) {
      deals.push(await res.json())
    } else {
      console.error(`Failed to create deal ${t.title}:`, await res.text())
    }
  }
  console.log(`✓ Created ${deals.length} deals`)

  // 5. Create Products
  console.log('Creating Products...')
  const productTemplates = [
    { name: 'Enterprise Platform License', sku: 'LIC-ENT-01', price: 50000, status: 'active', description: 'Annual enterprise platform software license' },
    { name: 'Cloud Migration Consulting', sku: 'CNS-CLD-01', price: 200, status: 'active', description: 'Hourly rate for cloud architecture design' },
    { name: 'Implementation Package', sku: 'SVC-IMP-01', price: 15000, status: 'active', description: 'Standard onboarding and implementation service' },
    { name: 'Custom Integration Dev', sku: 'DEV-INT-01', price: 150, status: 'active', description: 'Hourly rate for custom API integrations' },
    { name: 'Premium 24/7 Support', sku: 'SUP-PRM-01', price: 2500, status: 'active', description: 'Monthly premium support retainer' },
  ]
  
  const products = []
  for (const prod of productTemplates) {
    const res = await fetch(`${base}/collections/products/records`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...prod, userId: adminId, created_by: adminId })
    })
    if (res.ok) {
      products.push(await res.json())
    } else {
      console.error(`Failed to create product ${prod.name}:`, await res.text())
    }
  }
  console.log(`✓ Created ${products.length} products`)

  // 6. Create Invoices
  console.log('Creating Invoices...')
  const invoiceTemplates = [
    { title: 'INV-2026-001: TechFlow License', dealIdx: 0, status: 'approved', products: [{ idx: 0, qty: 1 }, { idx: 2, qty: 1 }] },
    { title: 'INV-2026-002: Apex Retainer', dealIdx: 2, status: 'pending', products: [{ idx: 4, qty: 3 }] },
    { title: 'INV-2026-003: Nexus Implementation', dealIdx: 4, status: 'approved', products: [{ idx: 2, qty: 1 }, { idx: 3, qty: 40 }] },
    { title: 'INV-2026-004: Quantum Phase 1', dealIdx: 6, status: 'draft', products: [{ idx: 1, qty: 100 }] },
  ]

  const invoices = []
  for (let i = 0; i < invoiceTemplates.length; i++) {
    const t = invoiceTemplates[i]
    const deal = deals[t.dealIdx]
    
    const lineItems = []
    let amount = 0
    for (const p of t.products) {
      const prod = products[p.idx]
      const total = prod.price * p.qty
      amount += total
      lineItems.push({
        productId: prod.id,
        name: prod.name,
        price: prod.price,
        quantity: p.qty,
        total
      })
    }

    const issued = new Date(Date.now() - (i * 15) * 24 * 60 * 60 * 1000)
    const due = new Date(issued.getTime() + 30 * 24 * 60 * 60 * 1000)

    const res = await fetch(`${base}/collections/invoices/records`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: t.title,
        amount: amount,
        status: t.status,
        issuedDate: issued.toISOString().split('T')[0],
        dueDate: due.toISOString().split('T')[0],
        paidAt: t.status === 'approved' ? due.toISOString().split('T')[0] : null,
        companyId: deal.companyId,
        contactId: deal.contactId,
        dealId: deal.id,
        userId: salesId,
        created_by: adminId,
        lineItems: JSON.stringify(lineItems),
      })
    })
    if (res.ok) {
      invoices.push(await res.json())
    } else {
      console.error(`Failed to create invoice ${t.title}:`, await res.text())
    }
  }
  console.log(`✓ Created ${invoices.length} invoices`)

  // 7. Create Tasks
  console.log('Creating Tasks...')
  const taskTemplates = [
    { title: 'Send revised quote to David', dealIdx: 2, priority: 'high', status: 'active', user: salesId },
    { title: 'Follow up on technical requirements', dealIdx: 1, priority: 'medium', status: 'active', user: salesId },
    { title: 'Schedule kickoff meeting with Elena', dealIdx: 0, priority: 'high', status: 'approved', user: salesId }, // Completed
    { title: 'Draft custom integration SOW', dealIdx: 4, priority: 'medium', status: 'active', user: adminId },
    { title: 'Review POS blockers', dealIdx: 5, priority: 'low', status: 'approved', user: salesId }
  ]

  const tasks = []
  for (let i = 0; i < taskTemplates.length; i++) {
    const t = taskTemplates[i]
    const deal = deals[t.dealIdx]
    
    const res = await fetch(`${base}/collections/tasks/records`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: t.title,
        description: `Follow up required for ${deal.title}. Ensure all notes are up to date in the CRM.`,
        status: t.status,
        priority: t.priority,
        dueDate: new Date(Date.now() + (i * 2 - 2) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        companyId: deal.companyId,
        contactId: deal.contactId,
        dealId: deal.id,
        userId: t.user,
        assignedToId: t.user,
        created_by: adminId
      })
    })
    if (res.ok) {
      tasks.push(await res.json())
    } else {
      console.error(`Failed to create task ${t.title}:`, await res.text())
    }
  }
  console.log(`✓ Created ${tasks.length} tasks`)

  // 8. Create Intake Submissions
  console.log('Creating Intakes...')
  const intakes = []
  
  // 8a. External Leads
  for (let i = 0; i < 2; i++) {
    const res = await fetch(`${base}/collections/intake_submissions/records`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: `Inbound Lead ${i+1}`,
        email: `lead${i+1}@startup.example.com`,
        message: 'We are interested in your cloud migration services.',
        type: 'general',
        source: 'external',
        status: 'pending',
        reference: `EXT-L${i+1}`,
        userId: adminId,
        assignedToId: salesId,
        created_by: adminId
      })
    })
    if (res.ok) intakes.push(await res.json())
  }

  // 8b. Internal HR Requests
  const resHr = await fetch(`${base}/collections/intake_submissions/records`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'Mark Torres',
      email: 'mark.sales@nova-stack.local',
      message: 'Requesting PTO for family vacation next month (10th - 15th).',
      type: 'vacation',
      source: 'internal',
      status: 'pending',
      reference: 'HR-VAC-001',
      userId: salesId,
      assignedToId: hrId,
      created_by: salesId
    })
  })
  if (resHr.ok) intakes.push(await resHr.json())

  // Hardware request
  const resHw = await fetch(`${base}/collections/intake_submissions/records`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'Sarah Jenkins',
      email: 'sarah.hr@nova-stack.local',
      message: 'Need a new external monitor for the home office setup.',
      type: 'hardware',
      source: 'internal',
      status: 'approved',
      decisionNote: 'Approved. Budget limit $300.',
      decidedAt: new Date().toISOString(),
      reference: 'HR-HW-001',
      userId: hrId,
      assignedToId: adminId,
      created_by: hrId
    })
  })
  if (resHw.ok) intakes.push(await resHw.json())

  console.log(`✓ Created ${intakes.length} intake submissions`)

  console.log('\n✅ Meaningful Seed Complete! Real-world relational data has been injected.')
}

seed().catch(console.error)
