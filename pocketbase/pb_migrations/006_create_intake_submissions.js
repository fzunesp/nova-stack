/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = new Collection({
    id: 'intake_collection',
    name: 'intake_submissions',
    type: 'base',
    system: false,
    fields: [
      {
        name: 'name',
        type: 'text',
      },
      {
        name: 'email',
        type: 'email',
      },
      {
        name: 'message',
        type: 'text',
      },
      {
        name: 'type',
        type: 'select',
        maxSelect: 1,
        values: ['general', 'vacation', 'reimbursement', 'hardware'],
      },
      {
        name: 'source',
        type: 'select',
        maxSelect: 1,
        values: ['external', 'internal'],
      },
      {
        name: 'status',
        type: 'select',
        maxSelect: 1,
        values: ['new', 'in_review', 'approved', 'rejected', 'converted'],
      },
      {
        name: 'reference',
        type: 'text',
      },
      {
        name: 'data',
        type: 'json',
        maxSize: 2000000,
      },
      {
        name: 'decisionNote',
        type: 'text',
      },
      {
        name: 'decidedAt',
        type: 'date',
      },
      {
        name: 'userId',
        type: 'relation',
        collectionId: '_pb_users_auth_',
        cascadeDelete: false,
        minSelect: 0,
        maxSelect: 1,
      },
      {
        name: 'assignedToId',
        type: 'relation',
        collectionId: '_pb_users_auth_',
        cascadeDelete: false,
        minSelect: 0,
        maxSelect: 1,
      },
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
  const collection = app.findCollectionByNameOrId('intake_submissions');
  return app.delete(collection);
});
