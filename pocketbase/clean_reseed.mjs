/**
 * clean_reseed.mjs
 * 
 * Comprehensive reseed script with proper dependency ordering.
 * 
 * Flow:
 * 1. Clear all business collections (preserve users & internal)
 * 2. Sync app users (roles)
 * 3. Companies (no deps)
 * 4. Contacts (dep: companyId)
 * 5. Deals (dep: companyId, contactId)
 * 6. Products (no deps)
 * 7. Invoices (dep: dealId, companyId, contactId)
 * 8. Tasks (dep: contactId, dealId)
 * 9. Employees (dep: userId)
 * 10. Intakes (dep: userId, assignedToId)
 * 11. Approvals (dep: submissionId)
 */

const base = process.env.PB_URL || 'http://localhost:8090/api';
console.log(`PB_URL = [${base}]`);

async function api(method, path, body = null, token) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${base}${path}`, opts);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    console.error(`  API ${method} ${path} failed (${res.status}):`, JSON.stringify(data, null, 2));
    return null;
  }
  // DELETE returns 204 No Content
  if (method === 'DELETE') return { ok: true };
  return res.json();
}

async function seed() {
  // Verify required environment variables exist
  if (!process.env.PB_ADMIN_EMAIL || !process.env.PB_ADMIN_PASSWORD) {
    console.error('Missing PB_ADMIN_EMAIL or PB_ADMIN_PASSWORD environment variables');
    process.exit(1);
  }

  // Authenticate as app admin user (users collection)
  const auth = await api('POST', '/collections/users/auth-with-password', {
    identity: process.env.PB_ADMIN_EMAIL,
    password: process.env.PB_ADMIN_PASSWORD
  });

  if (!auth?.token) {
    console.error('Auth failed');
    return;
  }

  const token = auth.token;
  const adminId = auth.record.id;

  console.log('--- Starting Full Reseed ---');
  console.log(`  Admin ID: ${adminId}`);
  
  // 1. Clear all business collections
  const collectionsToClear = [
    'invoices', 'deals', 'contacts', 'companies', 'products',
    'tasks', 'intake_submissions', 'approval_tasks', 'employees',
    'employee_private', 'audit_logs', 'notifications_read',
    'scratchpad', 'templates', 'webhooks', 'contact_interactions'
  ];
  console.log('Clearing business collections...');
  for (const coll of collectionsToClear) {
    const list = await api('GET', `/collections/${coll}/records?perPage=500`, null, token);
    if (list?.items) {
      let deleted = 0;
      for (const item of list.items) {
        const del = await api('DELETE', `/collections/${coll}/records/${item.id}`, null, token);
        if (del?.ok) deleted++;
      }
      console.log(`  Cleared ${coll}: ${deleted} records`);
    }
  }

  // 2. Sync Users
  console.log('Syncing users...');
  const userTemplates = [
    { email: 'alex.thorne@nova-stack.local', name: 'Alexander Thorne', role: 'admin' },
    { email: 'beatrice.vance@nova-stack.local', name: 'Beatrice Vance', role: 'admin' },
    { email: 'clara.oswald@nova-stack.local', name: 'Clara Oswald', role: 'hr' },
    { email: 'daniel.jackson@nova-stack.local', name: 'Daniel Jackson', role: 'user' },
    { email: 'elizabeth.bennet@nova-stack.local', name: 'Elizabeth Bennet', role: 'user' }
  ];
  const appUsers = [];
  for (const t of userTemplates) {
    const list = await api('GET', `/collections/users/records?filter=(email='${t.email}')`, null, token);
    let user;
    if (list?.items?.[0]) {
      user = await api('PATCH', `/collections/users/records/${list.items[0].id}`, {
        role: t.role, isActive: true, name: t.name, access_desktop: true
      }, token);
    } else {
      user = await api('POST', '/collections/users/records', {
        ...t, password: 'password123', passwordConfirm: 'password123',
        emailVisibility: true, isActive: true, access_desktop: true
      }, token);
    }
    if (user) appUsers.push(user);
  }
  const hrId = appUsers.find(u => u.role === 'hr')?.id || adminId;
  console.log(`  Users synced: ${appUsers.length}, HR ID: ${hrId}`);

  // 3. Companies (no deps)
  console.log('Seeding companies...');
  const companyNames = ['Stellar', 'Verdant', 'Blue Marble', 'Ironclad', 'Meridian', 'Zenith', 'Ember', 'Catalyst', 'Silver', 'Granite', 'Neon'];
  const companies = [];
  for (const name of companyNames) {
    const co = await api('POST', '/collections/companies/records', {
      name: `${name} Group`, status: 'active', created_by: adminId, userId: adminId
    }, token);
    if (co) companies.push(co);
  }
  console.log(`  Companies created: ${companies.length}`);

  // 4. Contacts (dep: companyId)
  console.log('Seeding contacts...');
  const contacts = [];
  for (const co of companies) {
    for (let i = 1; i <= 4; i++) {
      const slug = co.name.toLowerCase().replace(/ /g, '');
      const contact = await api('POST', '/collections/contacts/records', {
        name: `Contact ${i} at ${co.name}`,
        email: `contact${i}_${Date.now()}_${i}@${slug}.com`,
        companyId: co.id,
        status: 'active',
        userId: adminId
      }, token);
      if (contact) contacts.push(contact);
      else console.error(`  Failed to create contact for ${co.name}`);
    }
  }
  console.log(`  Contacts created: ${contacts.length}`);

  // 5. Deals (dep: companyId, contactId)
  console.log('Seeding deals...');
  const deals = [];
  let contactIdx = 0;
  for (const co of companies) {
    const coContacts = contacts.slice(contactIdx, contactIdx + 4);
    const c1 = coContacts[0];
    const c2 = coContacts[1];
    contactIdx += 4;

    if (c1) {
      const deal = await api('POST', '/collections/deals/records', {
        title: `${co.name} - Phase 1`,
        value: 5000,
        stage: 'won',
        companyId: co.id,
        contactId: c1.id,
        status: 'active',
        created_by: adminId,
        userId: adminId,
        assignedToId: adminId
      }, token);
      if (deal) deals.push(deal);
    }
    if (c2) {
      const deal = await api('POST', '/collections/deals/records', {
        title: `${co.name} - Phase 2`,
        value: 10000,
        stage: 'quoted',
        companyId: co.id,
        contactId: c2.id,
        status: 'active',
        created_by: adminId,
        userId: adminId,
        assignedToId: adminId
      }, token);
      if (deal) deals.push(deal);
    }
  }
  console.log(`  Deals created: ${deals.length}`);

  // 6. Products (no deps)
  console.log('Seeding products...');
  const products = [];
  for (let i = 1; i <= 11; i++) {
    const product = await api('POST', '/collections/products/records', {
      name: `Product ${String.fromCharCode(64 + i)}`,
      sku: `SKU-PRD-${100 + i}`,
      price: 100 * i,
      status: 'active',
      created_by: adminId,
      userId: adminId
    }, token);
    if (product) products.push(product);
  }
  console.log(`  Products created: ${products.length}`);

  // 7. Invoices (dep: dealId, companyId, contactId)
  console.log('Seeding invoices...');
  let invoiceCount = 0;
  for (const deal of deals) {
    const product = products[Math.floor(Math.random() * products.length)];
    const invoice = await api('POST', '/collections/invoices/records', {
      title: `INV-${deal.id.slice(0, 5).toUpperCase()}`,
      invoiceNumber: `INV-${deal.id.slice(0, 5).toUpperCase()}`,
      amount: product.price,
      status: 'pending',
      issuedDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      dealId: deal.id,
      companyId: deal.companyId,
      contactId: deal.contactId,
      lineItems: [{ productId: product.id, name: product.name, price: product.price, quantity: 1, total: product.price }],
      taxRate: 0,
      userId: adminId,
      created_by: adminId,
      assignedToId: adminId
    }, token);
    if (invoice) invoiceCount++;
  }
  console.log(`  Invoices created: ${invoiceCount}`);

  // 8. Tasks (dep: contactId, dealId)
  console.log('Seeding tasks...');
  let taskCount = 0;
  for (let i = 1; i <= 16; i++) {
    const co = companies[i % companies.length];
    const coDeals = deals.filter(d => d.companyId === co.id);
    const deal = coDeals[0] || deals[0];
    const coContacts = contacts.filter(c => c.companyId === co.id);
    const contact = coContacts[0] || contacts[0];

    const task = await api('POST', '/collections/tasks/records', {
      title: `Task ${i}: Follow up with ${co.name}`,
      status: 'active',
      priority: 'medium',
      companyId: co.id,
      contactId: contact?.id || '',
      dealId: deal?.id || '',
      userId: adminId,
      created_by: adminId,
      assignedToId: adminId
    }, token);
    if (task) taskCount++;
  }
  console.log(`  Tasks created: ${taskCount}`);

  // 9. Employees (dep: userId)
  console.log('Seeding employees...');
  const employees = [];
  for (let i = 0; i < 10; i++) {
    const u = appUsers[i % appUsers.length];
    const emp = await api('POST', '/collections/employees/records', {
      name: i < 5 ? u.name : `External Staff ${i}`,
      employee_id: `EMP-${1000 + i}`,
      work_email: i < 5 ? u.email : `staff${i}@nova-stack.local`,
      status: 'active',
      userId: i < 5 ? u.id : null,
      created_by: adminId
    }, token);
    if (emp) employees.push(emp);
  }
  console.log(`  Employees created: ${employees.length}`);

  // 10. Intakes (dep: userId, assignedToId)
  console.log('Seeding intakes...');
  const intakes = [];
  for (let i = 0; i < 8; i++) {
    const emp = employees[i % employees.length];
    const intake = await api('POST', '/collections/intake_submissions/records', {
      name: emp.name,
      email: emp.work_email,
      message: 'Seeded request.',
      type: 'vacation',
      source: 'internal',
      status: 'pending',
      userId: emp.userId || adminId,
      created_by: adminId,
      assignedToId: hrId
    }, token);
    if (intake) intakes.push(intake);
  }
  console.log(`  Intakes created: ${intakes.length}`);

  // 11. Approvals (dep: submissionId)
  console.log('Seeding approvals...');
  let approvalCount = 0;
  for (let i = 0; i < 6; i++) {
    const intake = intakes[i % intakes.length];
    const approval = await api('POST', '/collections/approval_tasks/records', {
      submissionId: intake.id,
      assignedToId: hrId,
      stepLabel: 'Manager Review',
      stepOrder: 1,
      isActive: true,
      status: 'pending'
    }, token);
    if (approval) approvalCount++;
  }
  console.log(`  Approvals created: ${approvalCount}`);

  console.log('--- Reseed: Complete ---');
  console.log(`  Summary: ${companies.length} companies, ${contacts.length} contacts, ${deals.length} deals, ${products.length} products, ${invoiceCount} invoices, ${taskCount} tasks, ${employees.length} employees, ${intakes.length} intakes, ${approvalCount} approvals`);
}

seed().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
