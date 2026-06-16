/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = app.findCollectionByNameOrId('invoices');
  collection.fields.add(new Field({
    name: 'entity_numbering',
    type: 'text',
  }));
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId('invoices');
  const field = collection.fields.getByName('entity_numbering');
  if (field) collection.fields.remove(field.id);
  return app.save(collection);
});
