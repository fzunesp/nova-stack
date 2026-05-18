/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = new Collection({
    id: 'companies_collection',
    name: 'companies',
    type: 'base',
    system: false,
    fields: [
      { name: 'name',     type: 'text', required: true },
      { name: 'industry', type: 'text' },
      { name: 'website',  type: 'url' },
      { name: 'phone',    type: 'text' },
      { name: 'address',  type: 'text' },
      { name: 'city',     type: 'text' },
      { name: 'country',  type: 'text' },
      { name: 'notes',    type: 'text' },
      { name: 'status',   type: 'select', maxSelect: 1, values: ['lead', 'active', 'inactive'] },
      { name: 'userId',     type: 'relation', collectionId: '_pb_users_auth_', cascadeDelete: false, minSelect: 0, maxSelect: 1 },
      { name: 'created_by', type: 'relation', collectionId: '_pb_users_auth_', cascadeDelete: false, minSelect: 0, maxSelect: 1 },
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
  const collection = app.findCollectionByNameOrId('companies')
  return app.delete(collection)
})
