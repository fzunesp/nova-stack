routerAdd("POST", "/api/send-welcome", (c) => {
    try {
        // 1. Auth check
        let isAuthorized = false;
        let authEmail = "unknown";

        if (c.hasSuperuserAuth()) {
            isAuthorized = true;
            authEmail = "superuser";
            console.log("[WELCOME-EMAIL] Authorized via Superuser")
        } else if (c.auth) {
            const role = c.auth.getString("role").toLowerCase();
            authEmail = c.auth.getString("email");
            console.log("[WELCOME-EMAIL] Request from user: " + authEmail + " with role: " + role)
            if (role === "admin" || role === "hr") {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            console.log("[WELCOME-EMAIL] Unauthorized request from: " + authEmail)
            return c.json(403, { message: "Only administrators or HR can send welcome emails." })
        }

        const rawBody = toString(c.request.body)
        const data = JSON.parse(rawBody)
        const userId = data.userId
        const tempPassword = data.password
        
        if (!userId || !tempPassword) {
            return c.json(400, { message: "Missing userId or password" })
        }

        const user = $app.findRecordById("users", userId)
        if (!user) {
            return c.json(404, { message: "User not found" })
        }

        const email = user.getString("email")
        const name = user.getString("name") || "New Team Member"
        const appUrl = "http://localhost:5173" // Current dev URL

        const senderAddress = $app.settings().meta.senderAddress || "onboarding@novastack.com"
        const senderName = $app.settings().meta.senderName || "Nova Stack Onboarding"

        const message = new MailerMessage()
        message.from = {
            address: senderAddress,
            name:    senderName,
        }
        message.to = [{ address: email }]
        message.subject = `Welcome to Nova Stack, ${name}!`
        
        message.html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6; margin: 0; padding: 0; background-color: #f8fafc; }
                    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
                    .header { background-color: #4f46e5; padding: 32px; text-align: center; color: #ffffff; }
                    .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
                    .content { padding: 32px; }
                    .credentials-card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin: 24px 0; }
                    .label { color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 4px; }
                    .value { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 16px; color: #0f172a; font-weight: 600; margin-bottom: 16px; }
                    .btn-container { text-align: center; margin-top: 32px; }
                    .btn { background-color: #4f46e5; color: #ffffff !important; text-decoration: none; padding: 12px 28px; font-size: 14px; font-weight: 600; border-radius: 6px; display: inline-block; }
                    .footer { padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>WELCOME TO NOVA STACK</h1>
                        <p>YOUR NEW WORKSPACE IS READY</p>
                    </div>
                    <div class="content">
                        <p>Hello <strong>${name}</strong>,</p>
                        <p>You have been invited to join the <strong>Nova Stack</strong> platform. Your account has been created and you can now log in using the credentials below.</p>
                        
                        <div class="credentials-card">
                            <div class="label">Login Email</div>
                            <div class="value">${email}</div>
                            
                            <div class="label">Temporary Password</div>
                            <div class="value">${tempPassword}</div>
                        </div>

                        <p style="font-size: 14px; color: #64748b; italic;">Important: You will be required to change this password immediately after your first login.</p>

                        <div class="btn-container">
                            <a href="${appUrl}" class="btn">Sign In to Your Account</a>
                        </div>
                    </div>
                    <div class="footer">
                        <p><strong>Nova Stack Inc.</strong></p>
                        <p>Data Privacy • Team Efficiency • Pure Ownership</p>
                    </div>
                </div>
            </body>
            </html>
        `

        try {
            $app.newMailClient().send(message)
            console.log("[WELCOME-EMAIL] Mail sent successfully to: " + email)
        } catch (mailErr) {
            console.log("[WELCOME-EMAIL] Mail send failed: " + mailErr.message)
            return c.json(500, { message: "Mail send failed: " + mailErr.message })
        }

        return c.json(200, { message: "Welcome email sent successfully" })
    } catch (err) {
        console.log("[WELCOME-EMAIL] Global error: " + err.message)
        return c.json(500, { message: "Server error: " + err.message })
    }
}, $apis.requireAuth())
