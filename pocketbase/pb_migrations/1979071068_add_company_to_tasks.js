/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const tasks = app.findCollectionByNameOrId('tasks')

  tasks.fields.add(new Field({
    name: 'companyId',
    type: 'relation',
    collectionId: 'companies_collection',
    cascadeDelete: false,
    minSelect: 0,
    maxSelect: 1,
    required: false
  }))

  tasks.fields.add(new Field({
    name: 'priority',
    type: 'select',
    maxSelect: 1,
    values: ['low', 'medium', 'high'],
    required: false
  }))

  return app.save(tasks)
}, (app) => {
  const tasks = app.findCollectionByNameOrId('tasks')
  if (tasks) {
    tasks.fields.removeByName('companyId')
    tasks.fields.removeByName('priority')
    return app.save(tasks)
  }
})
