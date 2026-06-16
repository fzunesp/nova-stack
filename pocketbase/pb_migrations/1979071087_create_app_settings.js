/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = new Collection({
    name: 'app_settings',
    type: 'base',
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.role = "admin"',
    updateRule: '@request.auth.role = "admin"',
    deleteRule: '@request.auth.role = "admin"',
    fields: [
      {
        name: 'category',
        type: 'text',
        required: true,
      },
      {
        name: 'config',
        type: 'json',
      },
    ],
    indexes: [
      'CREATE UNIQUE INDEX idx_app_settings_category ON app_settings (category)',
    ],
  })

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId('app_settings')
  return app.delete(collection)
})
