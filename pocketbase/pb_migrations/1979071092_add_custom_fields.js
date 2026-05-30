/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  // 1. Create custom_field_definitions collection
  const collection = new Collection({
    name: 'custom_field_definitions',
    type: 'base',
    system: false,
    fields: [
      { name: 'name',          type: 'text',    required: true },
      { name: 'key',           type: 'text',    required: true },
      { name: 'entityType',    type: 'select',  required: true, maxSelect: 1, values: ['companies', 'contacts', 'deals', 'tasks', 'invoices', 'products'] },
      { name: 'type',          type: 'select',  required: true, maxSelect: 1, values: ['text', 'number', 'select', 'checkbox', 'date'] },
      { name: 'options',       type: 'json',    maxSize: 2000000 },
      { name: 'required',      type: 'bool',    required: false },
      { name: 'isActive',      type: 'bool',    required: false },
      { name: 'created_by',    type: 'relation', collectionId: '_pb_users_auth_', cascadeDelete: false, minSelect: 0, maxSelect: 1 }
    ],
    indexes: [],
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''",
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

  app.save(collection)

  // 2. Add customFields column to companies, contacts, deals, invoices, tasks, products
  const entities = ['companies', 'contacts', 'deals', 'invoices', 'tasks', 'products']
  for (const entityName of entities) {
    const coll = app.findCollectionByNameOrId(entityName)
    if (coll) {
      coll.fields.add(new Field({
        name: 'customFields',
        type: 'json',
        maxSize: 2000000,
        required: false
      }))
      app.save(coll)
    }
  }
}, (app) => {
  // Rollback customFields column from entities
  const entities = ['companies', 'contacts', 'deals', 'invoices', 'tasks', 'products']
  for (const entityName of entities) {
    const coll = app.findCollectionByNameOrId(entityName)
    if (coll) {
      try {
        coll.fields.removeByName('customFields')
        app.save(coll)
      } catch (err) {
        // ignore if not present
      }
    }
  }

  // Delete custom_field_definitions collection
  try {
    const collection = app.findCollectionByNameOrId('custom_field_definitions')
    if (collection) {
      app.delete(collection)
    }
  } catch (err) {
    // ignore
  }
})
