/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = new Collection({
    name: 'employees',
    type: 'base',
    system: false,
    fields: [
      { name: 'name', type: 'text', required: true },
      { name: 'employee_id', type: 'text' },
      { name: 'work_email', type: 'email' },
      { name: 'personal_email', type: 'email' },
      { name: 'phone', type: 'text' },
      { name: 'dob', type: 'date' },
      { name: 'job_title', type: 'text' },
      { name: 'department', type: 'select', maxSelect: 1, values: ['HR', 'Sales', 'Engineering', 'Admin', 'Operations'] },
      { name: 'rol_type', type: 'select', maxSelect: 1, values: ['employee', 'manager', 'contractor', 'executive'] },
      { name: 'status', type: 'select', maxSelect: 1, values: ['active', 'onboarding', 'terminated', 'on_leave'] },
      { name: 'hire_date', type: 'date' },
      { name: 'userId', type: 'relation', collectionId: '_pb_users_auth_', cascadeDelete: false, minSelect: 0, maxSelect: 1 },
      { name: 'customFields', type: 'json' },
      { name: 'created_by', type: 'relation', collectionId: '_pb_users_auth_', cascadeDelete: false, minSelect: 0, maxSelect: 1 },
    ],
    indexes: [
      'CREATE UNIQUE INDEX idx_employee_id ON employees (employee_id) WHERE employee_id != ""',
      'CREATE UNIQUE INDEX idx_work_email ON employees (work_email) WHERE work_email != ""'
    ],
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''",
    options: {},
  })

  app.save(collection);

  // Re-fetch and add self-reference field
  const employees = app.findCollectionByNameOrId('employees');
  employees.fields.add(new Field({
    name: 'managerId',
    type: 'relation',
    collectionId: employees.id,
    cascadeDelete: false,
    minSelect: 0,
    maxSelect: 1,
  }));
  app.save(employees);

  // Update custom_field_definitions entityType values
  const defs = app.findCollectionByNameOrId('custom_field_definitions');
  if (defs) {
    const field = defs.fields.getByName('entityType');
    if (field && field.values) {
      if (!field.values.includes('employees')) {
        field.values.push('employees');
        app.save(defs);
      }
    }
  }

}, (app) => {
  const collection = app.findCollectionByNameOrId('employees')
  if (collection) {
    app.delete(collection)
  }
})
