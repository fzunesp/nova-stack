// Phase 4: Data Backfill — reads contact.companyName text fields, 
// creates a Company record for each unique company, then links contacts back.
// Run ONCE after migrating, while PocketBase is running.

async function getAdminToken() {
    // Try new PocketBase v0.23+ superusers endpoint first
    let res = await fetch('http://localhost:8090/api/collections/_superusers/auth-with-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity: 'admin@novastack.local', password: 'novastack123' })
    })
    let data = await res.json()
    if (data.token) return data.token

    // Fall back to legacy endpoint
    res = await fetch('http://localhost:8090/api/admins/auth-with-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity: 'admin@novastack.local', password: 'novastack123' })
    })
    data = await res.json()
    return data.token
}

async function fetchAll(collection, token) {
    const res = await fetch(`http://localhost:8090/api/collections/${collection}/records?perPage=500`, {
        headers: { 'Authorization': token }
    })
    const data = await res.json()
    return data.items || []
}

async function createRecord(collection, payload, token) {
    const res = await fetch(`http://localhost:8090/api/collections/${collection}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify(payload)
    })
    return res.json()
}

async function updateRecord(collection, id, payload, token) {
    const res = await fetch(`http://localhost:8090/api/collections/${collection}/records/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify(payload)
    })
    return res.json()
}

async function run() {
    console.log('🔐 Authenticating...')
    const token = await getAdminToken()
    if (!token) { console.error('❌ Failed to authenticate. Check admin credentials.'); return }

    const contacts = await fetchAll('contacts', token)
    console.log(`📋 Found ${contacts.length} contacts`)

    // Group contacts by unique company name (non-empty)
    const companyMap = {}
    for (const c of contacts) {
        const name = (c.companyName || '').trim()
        if (!name) continue
        if (!companyMap[name]) companyMap[name] = []
        companyMap[name].push(c)
    }

    const uniqueCompanyNames = Object.keys(companyMap)
    console.log(`🏢 Found ${uniqueCompanyNames.length} unique company names to migrate`)

    let createdCompanies = 0
    let linkedContacts = 0

    for (const companyName of uniqueCompanyNames) {
        // Get the userId from the first contact that has this company
        const firstContact = companyMap[companyName][0]
        
        // Create company record
        const company = await createRecord('companies', {
            name: companyName,
            status: 'active',
            userId: firstContact.userId || '',
            created_by: firstContact.userId || ''
        }, token)

        if (!company.id) {
            console.warn(`⚠️  Failed to create company: ${companyName}`)
            continue
        }
        createdCompanies++
        console.log(`  ✅ Created company: ${companyName} (${company.id})`)

        // Link all matching contacts to this company
        for (const contact of companyMap[companyName]) {
            await updateRecord('contacts', contact.id, { companyId: company.id }, token)
            linkedContacts++
            console.log(`     ↳ Linked contact: ${contact.name}`)
        }
    }

    // Also backfill deals that have a contactId — copy the contact's companyId to the deal
    console.log('\n🔗 Backfilling deal → company links via contactId...')
    const deals = await fetchAll('deals', token)
    const freshContacts = await fetchAll('contacts', token)
    const contactById = {}
    for (const c of freshContacts) contactById[c.id] = c

    let linkedDeals = 0
    for (const deal of deals) {
        if (deal.contactId && !deal.companyId) {
            const contact = contactById[deal.contactId]
            if (contact?.companyId) {
                await updateRecord('deals', deal.id, { companyId: contact.companyId }, token)
                linkedDeals++
            }
        }
    }

    // Also backfill invoices via dealId → deal → contact → company
    console.log('📄 Backfilling invoice → company links...')
    const invoices = await fetchAll('invoices', token)
    const dealById = {}
    for (const d of deals) dealById[d.id] = d

    let linkedInvoices = 0
    for (const invoice of invoices) {
        if (invoice.dealId && !invoice.companyId) {
            const deal = dealById[invoice.dealId]
            if (deal?.companyId) {
                await updateRecord('invoices', invoice.id, { 
                    companyId: deal.companyId,
                    contactId: deal.contactId || undefined
                }, token)
                linkedInvoices++
            }
        }
    }

    console.log(`\n✅ BACKFILL COMPLETE!`)
    console.log(`   Companies created: ${createdCompanies}`)
    console.log(`   Contacts linked:   ${linkedContacts}`)
    console.log(`   Deals linked:      ${linkedDeals}`)
    console.log(`   Invoices linked:   ${linkedInvoices}`)
}

run().catch(console.error)
