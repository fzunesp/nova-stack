/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = new Collection({
    id: 'tasks_collection',
    name: 'tasks',
    type: 'base',
    system: false,
    fields: [
      {
        name: 'title',
        type: 'text',
      },
      {
        name: 'description',
        type: 'text',
      },
      {
        name: 'status',
        type: 'select',
        maxSelect: 1,
        values: ['todo', 'in_progress', 'done'],
      },
      {
        name: 'dueDate',
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
  const collection = app.findCollectionByNameOrId('tasks');
  return app.delete(collection);
});
