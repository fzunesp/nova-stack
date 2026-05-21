/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const deals = app.findCollectionByNameOrId('deals')
  const intake = app.findCollectionByNameOrId('intake_submissions')

  if (deals) {
    deals.fields.add(new Field({
      name: 'intakeId',
      type: 'relation',
      collectionId: 'intake_collection',
      cascadeDelete: false,
      minSelect: 0,
      maxSelect: 1,
      required: false
    }))
    app.save(deals)
  }

  if (intake) {
    intake.fields.add(new Field({
      name: 'dealId',
      type: 'relation',
      collectionId: 'deals_collection',
      cascadeDelete: false,
      minSelect: 0,
      maxSelect: 1,
      required: false
    }))
    // Also make sure 'converted' is an allowed value in the status select field if it's there
    const statusField = intake.fields.getByName('status')
    if (statusField && statusField.values) {
      if (!statusField.values.includes('converted')) {
        statusField.values.push('converted')
      }
    }
    app.save(intake)
  }
}, (app) => {
  const deals = app.findCollectionByNameOrId('deals')
  const intake = app.findCollectionByNameOrId('intake_submissions')

  if (deals) {
    deals.fields.removeByName('intakeId')
    app.save(deals)
  }

  if (intake) {
    intake.fields.removeByName('dealId')
    const statusField = intake.fields.getByName('status')
    if (statusField && statusField.values) {
      statusField.values = statusField.values.filter(v => v !== 'converted')
    }
    app.save(intake)
  }
})
