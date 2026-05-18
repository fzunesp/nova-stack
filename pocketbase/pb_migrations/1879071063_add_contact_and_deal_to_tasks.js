/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const tasks = app.findCollectionByNameOrId("tasks");
  
  tasks.fields.add(new Field({
    name: "contactId",
    type: "relation",
    collectionId: "contacts_collection",
    cascadeDelete: false,
    minSelect: 0,
    maxSelect: 1,
    required: false
  }));
  
  tasks.fields.add(new Field({
    name: "dealId",
    type: "relation",
    collectionId: "deals_collection",
    cascadeDelete: false,
    minSelect: 0,
    maxSelect: 1,
    required: false
  }));

  return app.save(tasks);
}, (app) => {
  const tasks = app.findCollectionByNameOrId("tasks");
  if (tasks) {
    tasks.fields.removeByName("contactId");
    tasks.fields.removeByName("dealId");
    return app.save(tasks);
  }
})
