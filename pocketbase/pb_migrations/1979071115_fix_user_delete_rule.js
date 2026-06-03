/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // Allow admins to delete users
  collection.deleteRule = "id = @request.auth.id || @request.auth.role = 'admin'"

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // Revert to self-delete only
  collection.deleteRule = "id = @request.auth.id"

  return app.save(collection)
})
