/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users")

  // Only allow admin to create users
  collection.createRule = "@request.auth.role = 'admin'"

  // Prevent role escalation by normal users on update
  collection.updateRule = "(@request.auth.id = id && (@request.body.role:isset = false || @request.body.role = role)) || @request.auth.role = 'admin'"

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("users")

  collection.createRule = ""
  collection.updateRule = "id = @request.auth.id"

  return app.save(collection)
})
