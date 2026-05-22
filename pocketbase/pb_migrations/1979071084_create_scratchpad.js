/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const scratchpad = new Collection({
    name: 'scratchpad',
    type: 'base',
    system: false,
    fields: [
      { name: 'userId', type: 'relation', collectionId: '_pb_users_auth_', cascadeDelete: true, minSelect: 1, maxSelect: 1, required: true },
      { name: 'content', type: 'text', required: false },
    ],
    indexes: [
      'CREATE UNIQUE INDEX idx_scratchpad_user ON scratchpad(userId)',
    ],
    listRule: "@request.auth.id = userId",
    viewRule: "@request.auth.id = userId",
    createRule: "@request.auth.id = userId",
    updateRule: "@request.auth.id = userId",
    deleteRule: "@request.auth.id = userId",
    options: {},
  })

  return app.save(scratchpad)
}, (app) => {
  const collection = app.findCollectionByNameOrId('scratchpad')
  return app.delete(collection)
})
