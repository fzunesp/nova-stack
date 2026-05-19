/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = new Collection({
    name: 'form_definitions',
    type: 'base',
    system: false,
    fields: [
      { name: 'name',          type: 'text',    required: true },
      { name: 'key',           type: 'text',    required: true },   // e.g. vacation_request
      { name: 'prefix',        type: 'text',    required: true },   // e.g. VAC (max 3 chars)
      { name: 'description',   type: 'text',    required: false },
      { name: 'icon',          type: 'text',    required: false },  // Lucide icon name
      { name: 'isActive',      type: 'bool',    required: false },
      { name: 'fields',        type: 'json',    maxSize: 2000000 }, // FormFieldConfig[]
      { name: 'workflowSteps', type: 'json',    maxSize: 2000000 }, // WorkflowStep[]
      { name: 'isParallel',    type: 'bool',    required: false },  // true = parallel, false = sequential
      { name: 'webhookUrl',    type: 'text',    required: false },  // n8n endpoint
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
  const collection = app.findCollectionByNameOrId('form_definitions')
  return app.delete(collection)
})
