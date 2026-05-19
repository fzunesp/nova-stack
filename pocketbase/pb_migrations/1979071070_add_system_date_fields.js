/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collections = ['contacts', 'deals', 'invoices', 'tasks', 'intake_submissions']
  
  for (const collName of collections) {
    const coll = app.findCollectionByNameOrId(collName)
    if (!coll) continue

    // Add created field if missing
    if (!coll.fields.getByName('created')) {
      coll.fields.add(new Field({
        name: 'created',
        type: 'autodate',
        onCreate: true,
        onUpdate: false,
        hidden: false,
        presentable: false,
        system: false
      }))
    }

    // Add updated field if missing
    if (!coll.fields.getByName('updated')) {
      coll.fields.add(new Field({
        name: 'updated',
        type: 'autodate',
        onCreate: true,
        onUpdate: true,
        hidden: false,
        presentable: false,
        system: false
      }))
    }

    app.save(coll)
  }
}, (app) => {
  const collections = ['contacts', 'deals', 'invoices', 'tasks', 'intake_submissions']
  
  for (const collName of collections) {
    const coll = app.findCollectionByNameOrId(collName)
    if (!coll) continue

    if (coll.fields.getByName('created')) {
      coll.fields.removeByName('created')
    }
    if (coll.fields.getByName('updated')) {
      coll.fields.removeByName('updated')
    }

    app.save(coll)
  }
})
