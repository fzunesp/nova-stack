/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    name: 'webhooks',
    type: 'base',
    listRule: '@request.auth.role = "admin"',
    viewRule: '@request.auth.role = "admin"',
    createRule: '@request.auth.role = "admin"',
    updateRule: '@request.auth.role = "admin"',
    deleteRule: '@request.auth.role = "admin"',
    fields: [
      {
        name: 'url',
        type: 'text',
        required: true,
      },
      {
        name: 'event',
        type: 'select',
        required: true,
        maxSelect: 1,
        values: ['deal.won', 'invoice.paid', 'intake.approved', 'contact.created'],
      },
      {
        name: 'isActive',
        type: 'bool',
        required: false,
        defaultValue: true,
      },
    ],
    indexes: [
      'CREATE INDEX idx_webhooks_event ON webhooks (event)',
    ],
  })

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId('webhooks')
  return app.delete(collection)
})
