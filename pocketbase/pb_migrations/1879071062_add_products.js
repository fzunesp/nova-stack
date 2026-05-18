/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  // 1. Create Products collection
  const products = new Collection({
    id: "products_collection_01",
    name: "products",
    type: "base",
    fields: [
      { name: "name", type: "text", required: true },
      { name: "description", type: "text" },
      { name: "price", type: "number", required: true },
      { name: "sku", type: "text" },
      { name: "status", type: "select", values: ["active", "archived"], required: true },
      { name: "created_by", type: "relation", collectionId: "_pb_users_auth_", cascadeDelete: false, maxSelect: 1 }
    ],
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''",
  });
  app.save(products);

  // 2. Add lineItems json field to Invoices
  const invoices = app.findCollectionByNameOrId("invoices");
  invoices.fields.add(new Field({
    name: "lineItems",
    type: "json",
    required: false
  }));
  app.save(invoices);

}, (app) => {
  const products = app.findCollectionByNameOrId("products");
  if (products) app.delete(products);

  const invoices = app.findCollectionByNameOrId("invoices");
  if (invoices) {
    invoices.fields.removeByName("lineItems");
    app.save(invoices);
  }
})
