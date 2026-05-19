routerAdd("POST", "/api/app-backup", (c) => {
    try {
        const user = c.auth || c.get("authRecord")
        
        const role = user ? user.getString("role") : null
        if (role !== "admin") {
            return c.json(403, { message: `Requires admin role. Actual role: ${role}` })
        }

        const path = $filepath.join($app.dataDir(), "data.db")
        const bytes = $os.readFile(path)
        return c.blob(200, "application/octet-stream", bytes)
        
    } catch (err) {
        return c.json(400, { message: "Backup failed: " + err.message })
    }
}, $apis.requireAuth())
