/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = new Collection({
    id: 'deals_collection',
    name: 'deals',
    type: 'base',
    system: false,
    fields: [
      { name: 'title', type: 'text' },
      { name: 'value', type: 'number', onlyInt: false },
      { name: 'stage', type: 'select', maxSelect: 1, values: ['lead', 'contacted', 'quoted', 'won', 'lost'] },
      { name: 'expectedCloseDate', type: 'date' },
      { name: 'contactId', type: 'relation', collectionId: 'contacts_collection', cascadeDelete: false, minSelect: 0, maxSelect: 1 },
      { name: 'userId', type: 'relation', collectionId: '_pb_users_auth_', cascadeDelete: false, minSelect: 0, maxSelect: 1 },
      { name: 'assignedToId', type: 'relation', collectionId: '_pb_users_auth_', cascadeDelete: false, minSelect: 0, maxSelect: 1 },
      { name: 'created_by', type: 'relation', collectionId: '_pb_users_auth_', cascadeDelete: false, minSelect: 0, maxSelect: 1 },
      { name: 'status', type: 'select', maxSelect: 1, values: ['draft', 'active', 'pending', 'approved', 'rejected', 'archived'] },
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
  const collection = app.findCollectionByNameOrId('deals');
  return app.delete(collection);
});