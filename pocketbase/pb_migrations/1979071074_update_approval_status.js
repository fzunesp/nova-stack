/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const coll = app.findCollectionByNameOrId('approval_tasks')
  if (!coll) return

  const statusField = coll.fields.getByName('status')
  if (statusField) {
    statusField.values = ['pending', 'approved', 'rejected']
    app.save(coll)
  }
}, (app) => {
  const coll = app.findCollectionByNameOrId('approval_tasks')
  if (!coll) return

  const statusField = coll.fields.getByName('status')
  if (statusField) {
    statusField.values = ['pending', 'completed']
    app.save(coll)
  }
})
