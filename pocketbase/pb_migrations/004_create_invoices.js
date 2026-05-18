/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = new Collection({
    id: 'invoices_collection',
    name: 'invoices',
    type: 'base',
    system: false,
    fields: [
      { name: 'title', type: 'text' },
      { name: 'amount', type: 'number', onlyInt: false },
      { name: 'status', type: 'select', maxSelect: 1, values: ['draft', 'pending', 'approved', 'rejected', 'archived'] },
      { name: 'issuedDate', type: 'date' },
      { name: 'dueDate', type: 'date' },
      { name: 'paidAt', type: 'date' },
      { name: 'userId', type: 'relation', collectionId: '_pb_users_auth_', cascadeDelete: false, minSelect: 0, maxSelect: 1 },
      { name: 'dealId', type: 'relation', collectionId: 'deals_collection', cascadeDelete: false, minSelect: 0, maxSelect: 1 },
      { name: 'created_by', type: 'relation', collectionId: '_pb_users_auth_', cascadeDelete: false, minSelect: 0, maxSelect: 1 },
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
  const collection = app.findCollectionByNameOrId('invoices');
  return app.delete(collection);
});