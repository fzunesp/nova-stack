const PocketBase = require('pocketbase')

const pb = new PocketBase('http://localhost:8090')

async function seed() {
  console.log('Seeding database...')

  // Auth as admin
  await pb.admins.authWithPassword('admin@novastack.local', 'novastack123')

  // Create test users
  const users = []
  for (let i = 1; i <= 3; i++) {
    try {
      const user = await pb.collection('users').create({
        email: `user${i}@demo.com`,
        password: 'password123',
        passwordConfirm: 'password123',
        name: `Demo User ${i}`,
      })
      users.push(user)
      console.log(`Created user: ${user.email}`)
    } catch (e) {
      console.log(`User ${i} may already exist`)
    }
  }

  // Get first user for relations
  const allUsers = await pb.collection('users').getFullList()
  const mainUser = allUsers[0]

  if (!mainUser) {
    console.log('No users found, cannot seed')
    return
  }

  // Seed contacts
  const contacts = [
    { name: 'Acme Corp', email: 'contact@acme.com', phone: '555-0101', companyName: 'Acme Corporation', notes: 'Key client', userId: mainUser.id },
    { name: 'John Smith', email: 'john@smith.com', phone: '555-0102', companyName: 'Smith Consulting', notes: 'Lead from conference', userId: mainUser.id },
    { name: 'Sarah Johnson', email: 'sarah@tech.io', phone: '555-0103', companyName: 'TechStart Inc', notes: 'Interested in enterprise plan', userId: mainUser.id },
    { name: 'Mike Brown', email: 'mike@brown.co', phone: '555-0104', companyName: 'Brown & Associates', notes: '', userId: mainUser.id },
    { name: 'Lisa Davis', email: 'lisa@design.studio', phone: '555-0105', companyName: 'Design Studio', notes: 'Referred by Sarah', userId: mainUser.id },
  ]

  for (const c of contacts) {
    try { await pb.collection('contacts').create(c); console.log(`Created contact: ${c.name}`) } 
    catch (e) { console.log(`Contact ${c.name} may exist`) }
  }

  const allContacts = await pb.collection('contacts').getFullList()

  // Seed deals
  const deals = [
    { title: 'Acme Corp - Enterprise Plan', value: 25000, stage: 'quoted', userId: mainUser.id, contactId: allContacts[0]?.id },
    { title: 'Smith Consulting - Basic', value: 5000, stage: 'contacted', userId: mainUser.id, contactId: allContacts[1]?.id },
    { title: 'TechStart - Pro Plan', value: 12000, stage: 'won', userId: mainUser.id, contactId: allContacts[2]?.id },
    { title: 'Brown & Associates - Trial', value: 0, stage: 'lead', userId: mainUser.id, contactId: allContacts[3]?.id },
    { title: 'Design Studio - Custom', value: 18000, stage: 'quoted', userId: mainUser.id, contactId: allContacts[4]?.id },
  ]

  for (const d of deals) {
    try { await pb.collection('deals').create(d); console.log(`Created deal: ${d.title}`) }
    catch (e) { console.log(`Deal ${d.title} may exist`) }
  }

  // Seed tasks
  const tasks = [
    { title: 'Follow up with Acme Corp', description: 'Send proposal by Friday', status: 'todo', dueDate: '2026-05-16', userId: mainUser.id },
    { title: 'Prepare demo for Smith', description: 'Custom dashboard demo', status: 'in_progress', dueDate: '2026-05-12', userId: mainUser.id },
    { title: 'Onboard TechStart team', description: 'Schedule training sessions', status: 'done', dueDate: '2026-05-08', userId: mainUser.id },
    { title: 'Review Q2 pipeline', description: 'Update CRM with new leads', status: 'todo', dueDate: '2026-05-20', userId: mainUser.id },
    { title: 'Update pricing sheet', description: 'Add enterprise tier details', status: 'in_progress', dueDate: '2026-05-14', userId: mainUser.id },
  ]

  for (const t of tasks) {
    try { await pb.collection('tasks').create(t); console.log(`Created task: ${t.title}`) }
    catch (e) { console.log(`Task ${t.title} may exist`) }
  }

  // Seed invoices
  const invoices = [
    { title: 'INV-001: Acme Corp', amount: 25000, status: 'sent', dueDate: '2026-05-30', userId: mainUser.id },
    { title: 'INV-002: Smith Consulting', amount: 5000, status: 'paid', dueDate: '2026-05-15', userId: mainUser.id },
    { title: 'INV-003: TechStart', amount: 12000, status: 'paid', dueDate: '2026-05-10', userId: mainUser.id },
    { title: 'INV-004: Design Studio', amount: 9000, status: 'draft', dueDate: '2026-06-01', userId: mainUser.id },
    { title: 'INV-005: Brown & Associates', amount: 3500, status: 'sent', dueDate: '2026-05-25', userId: mainUser.id },
  ]

  for (const inv of invoices) {
    try { await pb.collection('invoices').create(inv); console.log(`Created invoice: ${inv.title}`) }
    catch (e) { console.log(`Invoice ${inv.title} may exist`) }
  }

  // Seed intake submissions
  const submissions = [
    { name: 'Jane Wilson', email: 'jane@example.com', message: 'Interested in partnership', type: 'general', status: 'new', source: 'external', userId: mainUser.id },
    { name: 'Tom Baker', email: 'tom@company.net', message: 'Request for demo access', type: 'general', status: 'in_review', source: 'external', userId: mainUser.id },
    { name: 'Alice Cooper', email: 'alice@team.org', message: 'Vacation request May 15-20', type: 'vacation', status: 'approved', source: 'internal', userId: mainUser.id },
    { name: 'Bob Martin', email: 'bob@dev.io', message: 'Need new laptop for development', type: 'hardware', status: 'new', source: 'internal', userId: mainUser.id },
    { name: 'Carol White', email: 'carol@client.com', message: 'Expense reimbursement for travel', type: 'reimbursement', status: 'in_review', source: 'external', userId: mainUser.id },
  ]

  for (const s of submissions) {
    try { await pb.collection('intake_submissions').create(s); console.log(`Created submission: ${s.name}`) }
    catch (e) { console.log(`Submission ${s.name} may exist`) }
  }

  console.log('\nSeeding complete!')
  console.log(`Users: ${allUsers.length}`)
  console.log(`Contacts: ${(await pb.collection('contacts').getFullList()).length}`)
  console.log(`Deals: ${(await pb.collection('deals').getFullList()).length}`)
  console.log(`Tasks: ${(await pb.collection('tasks').getFullList()).length}`)
  console.log(`Invoices: ${(await pb.collection('invoices').getFullList()).length}`)
  console.log(`Submissions: ${(await pb.collection('intake_submissions').getFullList()).length}`)
}

seed().catch(console.error)
