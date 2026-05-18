/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const intake = app.findCollectionByNameOrId('intake_submissions')

  intake.fields.add(new Field({
    name: 'companyId',
    type: 'relation',
    collectionId: 'companies_collection',
    cascadeDelete: false,
    minSelect: 0,
    maxSelect: 1,
    required: false
  }))

  intake.fields.add(new Field({
    name: 'contactId',
    type: 'relation',
    collectionId: 'contacts_collection',
    cascadeDelete: false,
    minSelect: 0,
    maxSelect: 1,
    required: false
  }))

  return app.save(intake)
}, (app) => {
  const intake = app.findCollectionByNameOrId('intake_submissions')
  if (intake) {
    intake.fields.removeByName('companyId')
    intake.fields.removeByName('contactId')
    return app.save(intake)
  }
})
