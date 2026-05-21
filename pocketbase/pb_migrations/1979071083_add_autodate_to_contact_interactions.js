/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId('contact_interactions')

  collection.fields.add(new Field({
    hidden: false,
    id: 'autodate_ci_created',
    name: 'created',
    onCreate: true,
    onUpdate: false,
    presentable: false,
    system: false,
    type: 'autodate',
  }))

  collection.fields.add(new Field({
    hidden: false,
    id: 'autodate_ci_updated',
    name: 'updated',
    onCreate: true,
    onUpdate: true,
    presentable: false,
    system: false,
    type: 'autodate',
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId('contact_interactions')

  collection.fields.removeById('autodate_ci_created')
  collection.fields.removeById('autodate_ci_updated')

  return app.save(collection)
})
