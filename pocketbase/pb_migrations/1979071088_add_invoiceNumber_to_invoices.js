/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const invoices = app.findCollectionByNameOrId("invoices_collection")

  const invoiceNumberField = new Field({
    name: "invoiceNumber",
    type: "text",
    required: false,
  })

  invoices.fields.add(invoiceNumberField)

  app.save(invoices)
}, (app) => {
  const invoices = app.findCollectionByNameOrId("invoices_collection")
  invoices.fields.removeByName("invoiceNumber")
  app.save(invoices)
})
