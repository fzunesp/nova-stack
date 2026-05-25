/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // add isActive field
  collection.fields.addAt(collection.fields.length, new Field({
    "help": "If disabled, the user will not be able to log in.",
    "hidden": false,
    "id": "bool_isactive",
    "name": "isActive",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // update authRule to prevent inactive users from logging in
  collection.authRule = "isActive = true"

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // remove isActive field
  collection.fields.removeById("bool_isactive")

  // reset authRule
  collection.authRule = ""

  return app.save(collection)
})
