/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const employeesColl = app.findCollectionByNameOrId('employees');

  const collection = new Collection({
    name: 'employee_private',
    type: 'base',
    system: false,
    fields: [
      { 
        name: 'employeeId', 
        type: 'relation', 
        collectionId: employeesColl.id, 
        cascadeDelete: true, 
        minSelect: 1, 
        maxSelect: 1, 
        required: true 
      },
      { name: 'salary_info', type: 'json' },
      { name: 'bank_details', type: 'json' },
      { name: 'tax_id', type: 'text' },
      { name: 'created_by', type: 'relation', collectionId: '_pb_users_auth_', cascadeDelete: false, minSelect: 0, maxSelect: 1 },
    ],
    indexes: [
      'CREATE UNIQUE INDEX idx_private_employee_id ON employee_private (employeeId)'
    ],
    // Access restricted to the employee themselves or their manager
    listRule: "employeeId.userId = @request.auth.id || employeeId.managerId.userId = @request.auth.id",
    viewRule: "employeeId.userId = @request.auth.id || employeeId.managerId.userId = @request.auth.id",
    createRule: "@request.auth.id != ''", 
    updateRule: "employeeId.userId = @request.auth.id || employeeId.managerId.userId = @request.auth.id",
    deleteRule: "@request.auth.id != ''",
    options: {},
  })

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId('employee_private')
  if (collection) {
    app.delete(collection)
  }
})
