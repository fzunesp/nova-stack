/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = new Collection({
    id: 'audit_logs_collection',
    name: 'audit_logs',
    type: 'base',
    system: false,
    fields: [
      { id: 'text1', name: 'targetCollection', type: 'text' },
      { id: 'text2', name: 'targetRecord', type: 'text' },
      { id: 'select1', name: 'eventType', type: 'select', maxSelect: 1, values: ['create', 'update', 'delete'] },
      { id: 'date1', name: 'eventTimestamp', type: 'date' },
      { id: 'text3', name: 'dataBefore', type: 'text', maxSize: 50000 },
      { id: 'text4', name: 'dataAfter', type: 'text', maxSize: 50000 },
    ],
    indexes: [],
    listRule: '@request.auth.id != ""',
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    options: {},
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId('audit_logs');
  return app.delete(collection);
});
