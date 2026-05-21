/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    id: 'contact_interactions_collection',
    name: 'contact_interactions',
    type: 'base',
    system: false,
    fields: [
      { name: 'contactId', type: 'relation', collectionId: 'contacts_collection', cascadeDelete: true, minSelect: 1, maxSelect: 1, required: true },
      { name: 'userId', type: 'relation', collectionId: '_pb_users_auth_', cascadeDelete: false, minSelect: 0, maxSelect: 1 },
      { name: 'content', type: 'text', required: true },
      { name: 'type', type: 'select', required: true, maxSelect: 1, values: ['call', 'email', 'meeting', 'note', 'sms', 'proposal'] },
    ],
    indexes: [
      'CREATE INDEX idx_ci_contact_id ON contact_interactions(contactId)',
    ],
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id = userId || @request.auth.role = 'admin'",
    deleteRule: "@request.auth.id = userId || @request.auth.role = 'admin'",
    options: {},
  })

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId('contact_interactions')
  return app.delete(collection)
})
