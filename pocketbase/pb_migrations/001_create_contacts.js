/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = new Collection({
    id: 'contacts_collection',
    name: 'contacts',
    type: 'base',
    system: false,
    fields: [
      { name: 'name', type: 'text' },
      { name: 'email', type: 'email' },
      { name: 'phone', type: 'text' },
      { name: 'companyName', type: 'text' },
      { name: 'notes', type: 'text' },
      { name: 'userId', type: 'relation', collectionId: '_pb_users_auth_', cascadeDelete: false, minSelect: 0, maxSelect: 1 },
      { name: 'created_by', type: 'relation', collectionId: '_pb_users_auth_', cascadeDelete: false, minSelect: 0, maxSelect: 1 },
      { name: 'status', type: 'select', maxSelect: 1, values: ['draft', 'active', 'archived'] },
    ],
    indexes: [],
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    options: {},
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId('contacts');
  return app.delete(collection);
});