/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const invoices = app.findCollectionByNameOrId('invoices')

  invoices.fields.add(new Field({
    name: 'companyId',
    type: 'relation',
    collectionId: 'companies_collection',
    cascadeDelete: false,
    minSelect: 0,
    maxSelect: 1,
    required: false
  }))

  invoices.fields.add(new Field({
    name: 'contactId',
    type: 'relation',
    collectionId: 'contacts_collection',
    cascadeDelete: false,
    minSelect: 0,
    maxSelect: 1,
    required: false
  }))

  invoices.fields.add(new Field({
    name: 'invoiceNumber',
    type: 'text',
    required: false
  }))

  invoices.fields.add(new Field({
    name: 'taxRate',
    type: 'number',
    required: false
  }))

  return app.save(invoices)
}, (app) => {
  const invoices = app.findCollectionByNameOrId('invoices')
  if (invoices) {
    invoices.fields.removeByName('companyId')
    invoices.fields.removeByName('contactId')
    invoices.fields.removeByName('invoiceNumber')
    invoices.fields.removeByName('taxRate')
    return app.save(invoices)
  }
})
