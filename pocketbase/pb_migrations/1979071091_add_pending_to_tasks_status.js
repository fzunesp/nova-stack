/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = app.findCollectionByNameOrId("tasks")

  const statusField = collection.fields.getByName("status")
  statusField.values = ['draft', 'active', 'pending', 'approved', 'archived', 'rejected', 'lead', 'inactive', 'converted']

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("tasks")

  const statusField = collection.fields.getByName("status")
  statusField.values = ['draft', 'active', 'approved', 'archived']

  return app.save(collection)
})