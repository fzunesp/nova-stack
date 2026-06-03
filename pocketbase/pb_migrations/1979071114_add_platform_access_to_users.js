/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // Add access_desktop field (default true for existing users)
  collection.fields.add(new Field({
    "name": "access_desktop",
    "type": "bool",
    "system": false,
    "required": false,
    "options": {}
  }))

  // Add access_mobile field (default false)
  collection.fields.add(new Field({
    "name": "access_mobile",
    "type": "bool",
    "system": false,
    "required": false,
    "options": {}
  }))

  app.save(collection)

  // Backfill existing users to have desktop access
  const records = app.findRecordsByFilter("users", "access_desktop = false")
  for (const record of records) {
    record.set("access_desktop", true)
    app.save(record)
  }
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  collection.fields.removeByName("access_desktop")
  collection.fields.removeByName("access_mobile")

  return app.save(collection)
})
