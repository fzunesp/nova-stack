/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users")

  // Remove authRule so the frontend can handle inactive user checks
  collection.authRule = ""

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("users")

  // Revert - reapply the authRule for inactive users
  collection.authRule = "isActive = true"

  return app.save(collection)
})
