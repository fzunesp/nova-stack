async function seedTemplates() {
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
  const headers = {
    'Authorization': `Bearer ${auth.token}`,
    'Content-Type': 'application/json'
  }

  // Check if we already have templates seeded
  const checkRes = await fetch(`${base}/collections/templates/records?perPage=1`, { headers })
  if (checkRes.ok) {
    const checkData = await checkRes.json()
    if (checkData.items && checkData.items.length > 0) {
      console.log('Templates already seeded. Skipping.')
      return
    }
  }

  const defaultTemplates = [
    {
      title: 'Invoice Overdue Reminder',
      subject: 'Reminder: Invoice {invoice_number} is Overdue',
      content: `Hi {client_name},

This is a friendly reminder that invoice {invoice_number} for {invoice_amount} was due on {due_date} and is now overdue.

Please let us know when we can expect payment, or if you have any questions regarding the invoice.

Best regards,
{sender_name}`,
      category: 'invoice_reminder'
    },
    {
      title: 'Introductory Pitch',
      subject: 'Zero-Cloud Software Integration for {company_name}',
      content: `Hi {contact_name},

Thanks for reaching out! We specialize in Zero-Cloud systems integration, helping businesses own their software forever without monthly SaaS fees.

I would love to jump on a quick 15-minute call to discuss your business goals and see if we can help you streamline operations. You can book a time directly in my calendar: [Calendar Link]

Best regards,
{sender_name}`,
      category: 'proposal'
    },
    {
      title: 'Follow-up After Meeting',
      subject: 'Great speaking with you today!',
      content: `Hi {contact_name},

It was great speaking with you today about {deal_title}.

I am drafting the formal proposal based on our discussion and will have it sent over by tomorrow. In the meantime, please let me know if there are any additional requirements we should capture.

Best regards,
{sender_name}`,
      category: 'email'
    },
    {
      title: 'SMS Update: Invoice Sent',
      subject: '',
      content: `Hi {contact_name}, we have sent over invoice {invoice_number} for {invoice_amount}. Please check your email. Thank you!`,
      category: 'sms'
    }
  ]

  console.log('Seeding templates...')
  for (const template of defaultTemplates) {
    const res = await fetch(`${base}/collections/templates/records`, {
      method: 'POST',
      headers,
      body: JSON.stringify(template)
    })
    if (res.ok) {
      console.log(`✓ Seeded template: ${template.title}`)
    } else {
      console.error(`Failed to seed template ${template.title}:`, await res.text())
    }
  }
}

seedTemplates().catch(console.error)
