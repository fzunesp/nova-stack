/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users")

  collection.fields.addAt(collection.fields.length, new Field({
    "help": "If true, the user must change their password on next login.",
    "hidden": false,
    "id": "bool_mustchangepw",
    "name": "mustChangePassword",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("users")

  collection.fields.removeById("bool_mustchangepw")

  return app.save(collection)
})
