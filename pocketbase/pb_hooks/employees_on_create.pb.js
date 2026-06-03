// Generate automatic Employee ID (EMP-1001+) on creation
onModelCreate(function(e) {
    try {
        console.log("[HOOK] Processing ID for: " + e.model.get("name"));
        
        // If ID is already manually set (e.g. from frontend fallback), don't override it
        if (e.model.getString("employee_id") && e.model.getString("employee_id") !== "") {
            console.log("[HOOK] ID already exists, skipping: " + e.model.getString("employee_id"));
            return e.next();
        }

        var records = $app.findRecordsByFilter(
            "employees",
            "employee_id != ''",
            "-employee_id", 
            1,
            0
        );

        var nextNumber = 1001;
        
        if (records.length > 0) {
            var lastId = records[0].getString("employee_id");
            if (lastId && lastId.indexOf("EMP-") === 0) {
                var lastNumber = parseInt(lastId.replace("EMP-", ""), 10);
                if (!isNaN(lastNumber)) {
                    nextNumber = lastNumber + 1;
                }
            }
        }

        var newId = "EMP-" + nextNumber;
        console.log("[HOOK] Assigned new ID: " + newId);
        e.model.set("employee_id", newId);
    } catch (err) {
        console.error("[HOOK ERROR] " + err);
    }

    return e.next();
}, "employees");
