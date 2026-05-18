/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("audit_logs_collection")

  // update collection data
  unmarshal({
    "listRule": "@request.auth.role = \"admin\" || @request.auth.role = \"hr\"",
    "viewRule": "@request.auth.role = \"admin\" || @request.auth.role = \"hr\""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("audit_logs_collection")

  // update collection data
  unmarshal({
    "listRule": "@request.auth.id != \"\"",
    "viewRule": null
  }, collection)

  return app.save(collection)
})
