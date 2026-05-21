console.log("[WEBHOOKS-BOOT] webhooks.pb.js loaded successfully")

function triggerWebhooks(event, payload) {
  try {
    // Find all active webhooks for this event type
    var webhooks = $app.findRecordsByFilter('webhooks', `event = "${event}" && isActive = true`)
    if (!webhooks || webhooks.length === 0) return

    for (var i = 0; i < webhooks.length; i++) {
      var wh = webhooks[i]
      var url = wh.getString('url')
      if (!url) continue

      try {
        console.log(`[WEBHOOK] Posting ${event} payload to ${url}`)
        $http.send({
          url: url,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Nova-CRM-Webhook-Engine/1.0'
          },
          body: JSON.stringify({
            event: event,
            timestamp: new Date().toISOString(),
            payload: payload
          })
        })
      } catch (err) {
        console.error(`[WEBHOOK] Failed posting to ${url}: ${err}`)
      }
    }
  } catch (err) {
    console.error(`[WEBHOOK] Error querying active webhooks: ${err}`)
  }
}

// 1. contact.created
onModelAfterCreateSuccess(function(e) {
  var payload = {
    id: e.model.id,
    name: e.model.getString('name'),
    email: e.model.getString('email'),
    phone: e.model.getString('phone'),
    title: e.model.getString('title'),
    companyId: e.model.getString('companyId'),
    created: e.model.getString('created')
  }
  triggerWebhooks('contact.created', payload)
}, 'contacts')

// 2. intake.approved
onModelAfterUpdateSuccess(function(e) {
  var oldStatus = e.model.originalCopy().getString('status')
  var newStatus = e.model.getString('status')
  if (oldStatus !== newStatus && newStatus === 'approved') {
    var payload = {
      id: e.model.id,
      name: e.model.getString('name'),
      email: e.model.getString('email'),
      type: e.model.getString('type'),
      source: e.model.getString('source'),
      decidedAt: e.model.getString('decidedAt'),
      decisionNote: e.model.getString('decisionNote'),
      created: e.model.getString('created')
    }
    triggerWebhooks('intake.approved', payload)
  }
}, 'intake_submissions')

// 3. deal.won
onModelAfterUpdateSuccess(function(e) {
  var oldStage = e.model.originalCopy().getString('stage')
  var newStage = e.model.getString('stage')
  if (oldStage !== newStage && newStage === 'won') {
    var payload = {
      id: e.model.id,
      title: e.model.getString('title'),
      value: e.model.getFloat('value'),
      stage: newStage,
      contactId: e.model.getString('contactId'),
      companyId: e.model.getString('companyId'),
      created: e.model.getString('created')
    }
    triggerWebhooks('deal.won', payload)
  }
}, 'deals')

// 4. invoice.paid
onModelAfterUpdateSuccess(function(e) {
  var oldStatus = e.model.originalCopy().getString('status')
  var newStatus = e.model.getString('status')
  if (oldStatus !== newStatus && newStatus === 'approved') {
    var payload = {
      id: e.model.id,
      title: e.model.getString('title'),
      invoiceNumber: e.model.getString('invoiceNumber'),
      amount: e.model.getFloat('amount'),
      status: 'paid', // approved = paid in statusLabels
      dueDate: e.model.getString('dueDate'),
      dealId: e.model.getString('dealId'),
      created: e.model.getString('created')
    }
    triggerWebhooks('invoice.paid', payload)
  }
}, 'invoices')
