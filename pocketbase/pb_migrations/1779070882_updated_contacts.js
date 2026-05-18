/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("contacts_collection")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != \"\"",
    "deleteRule": "userId = @request.auth.id || @request.auth.role = \"admin\" || @request.auth.role = \"hr\"",
    "listRule": "userId = @request.auth.id || @request.auth.role = \"admin\" || @request.auth.role = \"hr\"",
    "updateRule": "userId = @request.auth.id || @request.auth.role = \"admin\" || @request.auth.role = \"hr\"",
    "viewRule": "userId = @request.auth.id || @request.auth.role = \"admin\" || @request.auth.role = \"hr\""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("contacts_collection")

  // update collection data
  unmarshal({
    "createRule": null,
    "deleteRule": null,
    "listRule": null,
    "updateRule": null,
    "viewRule": ""
  }, collection)

  return app.save(collection)
})
