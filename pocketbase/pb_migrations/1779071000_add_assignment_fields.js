/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const assignedToField = {
    name: "assignedToId",
    type: "relation",
    collectionId: "_pb_users_auth_",
    cascadeDelete: false,
    minSelect: 0,
    maxSelect: 1,
  }

  const assignedAtField = {
    name: "assignedAt",
    type: "date",
  }

  // contacts: add assignedToId + assignedAt
  const contacts = app.findCollectionByNameOrId("contacts_collection")
  contacts.fields.add(new Field(assignedToField))
  contacts.fields.add(new Field(assignedAtField))
  app.save(contacts)

  // deals: add assignedAt only (already has assignedToId)
  const deals = app.findCollectionByNameOrId("deals_collection")
  deals.fields.add(new Field(assignedAtField))
  app.save(deals)

  // tasks: add assignedAt only (already has assignedToId)
  const tasks = app.findCollectionByNameOrId("tasks_collection")
  tasks.fields.add(new Field(assignedAtField))
  app.save(tasks)

  // invoices: add assignedToId + assignedAt
  const invoices = app.findCollectionByNameOrId("invoices_collection")
  invoices.fields.add(new Field(assignedToField))
  invoices.fields.add(new Field(assignedAtField))
  app.save(invoices)

  // intake_submissions: add assignedAt only (already has assignedToId)
  const intake = app.findCollectionByNameOrId("intake_collection")
  intake.fields.add(new Field(assignedAtField))
  app.save(intake)
}, (app) => {
  const collections = [
    "contacts_collection",
    "deals_collection",
    "tasks_collection",
    "invoices_collection",
    "intake_collection",
  ]

  collections.forEach((name) => {
    const col = app.findCollectionByNameOrId(name)
    col.fields.removeByName("assignedToId")
    col.fields.removeByName("assignedAt")
    app.save(col)
  })
})
