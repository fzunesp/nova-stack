/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const users = app.findRecordsByFilter("users", "id != ''");
  const employeesColl = app.findCollectionByNameOrId("employees");
  
  let count = 1;

  for (const user of users) {
    // Check if employee already exists for this user
    try {
      const existing = app.findFirstRecordByFilter("employees", `userId = "${user.id}"`);
      if (existing) continue;
    } catch (e) {
      // Record not found, proceed to create
    }

    const employee = new Record(employeesColl);
    
    // Set basic info
    const name = user.getString("name") || user.getString("email").split('@')[0];
    employee.set("name", name);
    employee.set("work_email", user.getString("email"));
    employee.set("userId", user.id);
    employee.set("status", "active");
    
    // Map role to rol_type
    const userRole = user.getString("role");
    let rolType = "employee";
    if (userRole === "admin") rolType = "executive";
    else if (userRole === "manager") rolType = "manager";
    employee.set("rol_type", rolType);

    // Generate formatted employee_id (e.g., EMP-1001)
    const empId = `EMP-${(1000 + count).toString()}`;
    employee.set("employee_id", empId);

    app.save(employee);
    count++;
  }
}, (app) => {
  // Rollback logic
})
