/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  try {
    const existing = app.findCollectionByNameOrId("products");
    if (existing) return;
  } catch (e) {
    // collection doesn't exist, proceed
  }

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
      { name: "created_by", type: "relation", collectionId: "_pb_users_auth_", cascadeDelete: false, maxSelect: 1 },
      { name: "customFields", type: "json", required: false }
    ],
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''",
  });

  return app.save(products);
}, (app) => {
  const products = app.findCollectionByNameOrId("products");
  if (products) app.delete(products);
})
