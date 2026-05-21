/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Simple key-value store: which notification IDs has each user already read?
  // Using a plain collection (not auth collection) so we get standard CRUD rules.
  const collection = new Collection({
    name: 'notifications_read',
    type: 'base',
    // Only the owning user may list, view, create, or delete their own read-receipts.
    listRule: '@request.auth.id = userId',
    viewRule: '@request.auth.id = userId',
    createRule: '@request.auth.id != "" && @request.auth.id = userId',
    updateRule: null, // Read-receipts are immutable once created
    deleteRule: '@request.auth.id = userId',
    fields: [
      {
        name: 'userId',
        type: 'text',
        required: true,
        options: { min: 1, max: 100 },
      },
      {
        name: 'notifId',
        type: 'text',
        required: true,
        options: { min: 1, max: 200 },
      },
    ],
    indexes: [
      // Unique constraint so upsert logic stays clean
      'CREATE UNIQUE INDEX idx_notifications_read_unique ON notifications_read (userId, notifId)',
      // Fast lookup by user
      'CREATE INDEX idx_notifications_read_user ON notifications_read (userId)',
    ],
  })

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId('notifications_read')
  return app.delete(collection)
})
