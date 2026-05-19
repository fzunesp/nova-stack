/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  // Resolve the intake_submissions collection ID dynamically
  const intakeColl = app.findCollectionByNameOrId('intake_submissions')
  if (!intakeColl) throw new Error('intake_submissions collection not found')

  const collection = new Collection({
    name: 'approval_tasks',
    type: 'base',
    system: false,
    fields: [
      {
        name: 'submissionId',
        type: 'relation',
        collectionId: intakeColl.id,
        cascadeDelete: true,
        minSelect: 1,
        maxSelect: 1,
        required: true,
      },
      {
        name: 'assignedToId',
        type: 'relation',
        collectionId: '_pb_users_auth_',
        cascadeDelete: false,
        minSelect: 1,
        maxSelect: 1,
        required: true,
      },
      { name: 'stepLabel',   type: 'text',   required: false },        // e.g. "Manager Review"
      { name: 'stepOrder',   type: 'number', required: false },        // 0-indexed
      { name: 'isActive',    type: 'bool',   required: false },        // false = skipped
      {
        name: 'status',
        type: 'select',
        maxSelect: 1,
        values: ['pending', 'completed'],
        required: true,
      },
      { name: 'comment',     type: 'text', required: false },          // decision note
      { name: 'completedAt', type: 'date', required: false },
    ],
    indexes: [],
    listRule:   null,
    viewRule:   null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    options: {},
  })

  // Add autodate fields
  collection.fields.add(new Field({
    name: 'created', type: 'autodate',
    onCreate: true, onUpdate: false,
    hidden: false, presentable: false, system: false
  }))
  collection.fields.add(new Field({
    name: 'updated', type: 'autodate',
    onCreate: true, onUpdate: true,
    hidden: false, presentable: false, system: false
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId('approval_tasks')
  return app.delete(collection)
})
