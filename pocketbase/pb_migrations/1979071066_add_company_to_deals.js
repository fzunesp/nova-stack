/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const deals = app.findCollectionByNameOrId('deals')

  deals.fields.add(new Field({
    name: 'companyId',
    type: 'relation',
    collectionId: 'companies_collection',
    cascadeDelete: false,
    minSelect: 0,
    maxSelect: 1,
    required: false
  }))

  deals.fields.add(new Field({
    name: 'notes',
    type: 'text',
    required: false
  }))

  return app.save(deals)
}, (app) => {
  const deals = app.findCollectionByNameOrId('deals')
  if (deals) {
    deals.fields.removeByName('companyId')
    deals.fields.removeByName('notes')
    return app.save(deals)
  }
})
