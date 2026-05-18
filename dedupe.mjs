import fs from 'fs';

async function fetchAll(collection) {
    const res = await fetch(`http://localhost:8090/api/collections/${collection}/records?perPage=500`);
    const data = await res.json();
    return data.items || [];
}

async function deleteRecord(collection, id) {
    await fetch(`http://localhost:8090/api/collections/${collection}/records/${id}`, {
        method: 'DELETE'
    });
}

async function run() {
    let report = [];
    
    // 1. Contacts
    const contacts = await fetchAll('contacts');
    const contactEmails = {};
    for (const c of contacts) {
        const key = (c.email || c.name || '').toLowerCase().trim();
        if (!contactEmails[key]) contactEmails[key] = [];
        contactEmails[key].push(c);
    }
    
    let deletedContacts = 0;
    for (const key in contactEmails) {
        if (!key) continue;
        const group = contactEmails[key];
        if (group.length > 1) {
            group.sort((a, b) => (a.created || '').localeCompare(b.created || ''));
            for (let i = 1; i < group.length; i++) {
                await deleteRecord('contacts', group[i].id);
                deletedContacts++;
                report.push(`🗑️ Deleted duplicate contact: ${group[i].name} (${group[i].email})`);
            }
        }
    }

    // 2. Invoices
    const invoices = await fetchAll('invoices');
    const invoiceTitles = {};
    for (const i of invoices) {
        const key = (i.title || '').toLowerCase().trim() + '-' + i.amount;
        if (!invoiceTitles[key]) invoiceTitles[key] = [];
        invoiceTitles[key].push(i);
    }
    
    let deletedInvoices = 0;
    for (const key in invoiceTitles) {
        if (key === '-') continue;
        const group = invoiceTitles[key];
        if (group.length > 1) {
            group.sort((a, b) => (a.created || '').localeCompare(b.created || ''));
            for (let i = 1; i < group.length; i++) {
                await deleteRecord('invoices', group[i].id);
                deletedInvoices++;
                report.push(`🗑️ Deleted duplicate invoice: ${group[i].title} ($${group[i].amount})`);
            }
        }
    }

    // 3. Deals
    const deals = await fetchAll('deals');
    const dealTitles = {};
    for (const d of deals) {
        const key = (d.title || '').toLowerCase().trim() + '-' + d.value;
        if (!dealTitles[key]) dealTitles[key] = [];
        dealTitles[key].push(d);
    }
    
    let deletedDeals = 0;
    for (const key in dealTitles) {
        if (key === '-') continue;
        const group = dealTitles[key];
        if (group.length > 1) {
            group.sort((a, b) => (a.created || '').localeCompare(b.created || ''));
            for (let i = 1; i < group.length; i++) {
                await deleteRecord('deals', group[i].id);
                deletedDeals++;
                report.push(`🗑️ Deleted duplicate deal: ${group[i].title} ($${group[i].value})`);
            }
        }
    }
    
    // 4. Tasks
    const tasks = await fetchAll('tasks');
    const taskTitles = {};
    for (const t of tasks) {
        const key = (t.title || '').toLowerCase().trim();
        if (!taskTitles[key]) taskTitles[key] = [];
        taskTitles[key].push(t);
    }
    
    let deletedTasks = 0;
    for (const key in taskTitles) {
        if (!key) continue;
        const group = taskTitles[key];
        if (group.length > 1) {
            group.sort((a, b) => (a.created || '').localeCompare(b.created || ''));
            for (let i = 1; i < group.length; i++) {
                await deleteRecord('tasks', group[i].id);
                deletedTasks++;
                report.push(`🗑️ Deleted duplicate task: ${group[i].title}`);
            }
        }
    }

    console.log(`\n✅ DATABASE CLEANUP COMPLETE!`);
    console.log(`---------------------------------`);
    console.log(`Total duplicates removed: ${deletedContacts + deletedDeals + deletedInvoices + deletedTasks}`);
    console.log(`Contacts: -${deletedContacts}`);
    console.log(`Deals: -${deletedDeals}`);
    console.log(`Invoices: -${deletedInvoices}`);
    console.log(`Tasks: -${deletedTasks}`);
    console.log(`\nLog Details:\n` + (report.join('\n') || 'No duplicates found! Your data is clean.'));
}

run().catch(console.error);
