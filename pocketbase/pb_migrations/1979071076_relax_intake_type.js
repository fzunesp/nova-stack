/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("intake_submissions")
  if (!collection) throw new Error("intake_submissions not found")

  // Change type from select to text to allow dynamic template keys
  if (collection.fields.getByName("type")) {
    collection.fields.removeByName("type")
  }
  
  collection.fields.add(new Field({
    name: "type",
    type: "text",
    required: false,
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("intake_submissions")
  if (!collection) return

  if (collection.fields.getByName("type")) {
    collection.fields.removeByName("type")
  }

  collection.fields.add(new Field({
    name: "type",
    type: "select",
    maxSelect: 1,
    values: ["general", "vacation", "reimbursement", "hardware"],
    required: false,
  }))

  return app.save(collection)
})
