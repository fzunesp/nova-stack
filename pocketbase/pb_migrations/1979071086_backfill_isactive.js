/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")
  
  // Set isActive to true for all existing users
  const users = app.findRecordsByFilter(collection.name, "isActive = false")
  for (const user of users) {
    user.set("isActive", true)
    app.save(user)
  }

  return null
}, (app) => {
  return null
})
