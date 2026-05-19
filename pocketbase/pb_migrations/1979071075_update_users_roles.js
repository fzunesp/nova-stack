/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users")

  // Update list/view rules so authenticated users can see the directory
  collection.listRule = "@request.auth.id != ''"
  collection.viewRule = "@request.auth.id != ''"

  // Add 'manager' to the roles
  const roleField = collection.fields.getByName("role")
  if (roleField) {
    const currentValues = roleField.values || []
    if (!currentValues.includes("manager")) {
      currentValues.push("manager")
      roleField.values = currentValues
    }
  }

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("users")

  // Revert rules
  collection.listRule = "id = @request.auth.id"
  collection.viewRule = "id = @request.auth.id"

  // Remove 'manager'
  const roleField = collection.fields.getByName("role")
  if (roleField) {
    roleField.values = (roleField.values || []).filter(v => v !== "manager")
  }

  return app.save(collection)
})
