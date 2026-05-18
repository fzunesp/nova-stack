/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const contacts = app.findCollectionByNameOrId('contacts')

  contacts.fields.add(new Field({
    name: 'companyId',
    type: 'relation',
    collectionId: 'companies_collection',
    cascadeDelete: false,
    minSelect: 0,
    maxSelect: 1,
    required: false
  }))

  contacts.fields.add(new Field({
    name: 'title',
    type: 'text',
    required: false
  }))

  return app.save(contacts)
}, (app) => {
  const contacts = app.findCollectionByNameOrId('contacts')
  if (contacts) {
    contacts.fields.removeByName('companyId')
    contacts.fields.removeByName('title')
    return app.save(contacts)
  }
})
