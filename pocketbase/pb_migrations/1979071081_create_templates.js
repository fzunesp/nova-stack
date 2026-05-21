/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    id: 'templates_collection',
    name: 'templates',
    type: 'base',
    system: false,
    fields: [
      { name: 'title', type: 'text', required: true },
      { name: 'subject', type: 'text' },
      { name: 'content', type: 'text', required: true },
      { name: 'category', type: 'select', required: true, maxSelect: 1, values: ['email', 'invoice_reminder', 'proposal', 'sms', 'other'] },
      { name: 'userId', type: 'relation', collectionId: '_pb_users_auth_', cascadeDelete: false, minSelect: 0, maxSelect: 1 },
    ],
    indexes: [],
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''",
    options: {},
  })

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId('templates')
  return app.delete(collection)
})
