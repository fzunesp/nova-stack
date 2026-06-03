/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collections = ["intake_submissions", "tasks", "deals"];
  const employeesColl = app.findCollectionByNameOrId("employees");

  for (const collectionName of collections) {
    const coll = app.findCollectionByNameOrId(collectionName);
    if (!coll) continue;

    // 1. Add employeeId field
    const fieldName = (collectionName === "deals") ? "ownerId" : 
                      (collectionName === "tasks") ? "assigneeId" : "employeeId";

    // Only add if doesn't exist
    let fieldExists = false;
    try {
      if (coll.fields.getByName(fieldName)) fieldExists = true;
    } catch (e) {}

    if (!fieldExists) {
      coll.fields.add(new Field({
        name: fieldName,
        type: 'relation',
        collectionId: employeesColl.id,
        cascadeDelete: false,
        minSelect: 0,
        maxSelect: 1,
        required: false
      }));
      app.save(coll);
    }

    // 2. Migrate data: userId -> employeeId
    const records = app.findRecordsByFilter(collectionName, "userId != ''");
    for (const record of records) {
      const userId = record.getString("userId");
      try {
        const employee = app.findFirstRecordByFilter("employees", `userId = "${userId}"`);
        if (employee) {
          record.set(fieldName, employee.id);
          app.save(record);
        }
      } catch (e) {
        // skip
      }
    }
  }
}, (app) => {
  // Rollback logic
})
