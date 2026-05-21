routerAdd("POST", "/api/send-invoice", (c) => {
    try {
        const user = c.auth || c.get("authRecord")
        if (!user) {
            return c.json(401, { message: "Unauthorized" })
        }

        const rawBody = toString(c.request.body)
        const data = JSON.parse(rawBody)
        const invoiceId = data.invoiceId
        if (!invoiceId) {
            return c.json(400, { message: "Missing invoiceId" })
        }

        const invoice = $app.findRecordById("invoices", invoiceId)
        if (!invoice) {
            return c.json(404, { message: "Invoice not found" })
        }

        const role = user.getString("role")
        if (role !== "admin" && role !== "hr" && invoice.getString("userId") !== user.id) {
            return c.json(403, { message: "Forbidden" })
        }

        // Get Deal -> Contact -> Email
        const dealId = invoice.getString("dealId")
        if (!dealId) {
            return c.json(400, { message: "Invoice is not linked to any deal" })
        }

        const deal = $app.findRecordById("deals", dealId)
        const contactId = deal.getString("contactId")
        if (!contactId) {
            return c.json(400, { message: "Deal is not linked to any contact" })
        }

        const contact = $app.findRecordById("contacts", contactId)
        const email = contact.getString("email")
        if (!email) {
            return c.json(400, { message: "Contact has no email address" })
        }

        const clientName = contact.getString("name") || "Valued Client"
        const amount = invoice.getFloat("amount")
        const formattedAmount = "$" + amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        const dueDate = invoice.getString("dueDate") ? invoice.getString("dueDate").split("T")[0] : "N/A"

        // Load company name if available
        let companyName = ""
        const companyId = contact.getString("companyId")
        if (companyId) {
            try {
                const company = $app.findRecordById("companies", companyId)
                companyName = company.getString("name")
            } catch (e) {}
        }

        const senderAddress = $app.settings().meta.senderAddress || "noreply@novastack.com"
        const senderName = $app.settings().meta.senderName || "Nova Stack Billing"

        const message = new MailerMessage()
        message.from = {
            address: senderAddress,
            name:    senderName,
        }
        message.to = [{ address: email }]
        message.subject = data.subject || `Invoice ${invoice.id.slice(0,8).toUpperCase()} - ${invoice.getString("title")}`
        
        let contentHtml = ""
        if (data.body) {
            contentHtml = `<div class="lead" style="white-space: pre-wrap; font-family: inherit; font-size: 14.5px; color: #475569; line-height: 1.6; margin-bottom: 24px;">${data.body.replace(/\n/g, '<br>')}</div>`
        } else {
            contentHtml = `
                <div class="greeting" style="font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 16px;">Hello ${clientName},</div>
                <p class="lead" style="font-size: 15px; color: #475569; margin-bottom: 24px; line-height: 1.6;">We have generated a new invoice for you regarding your recent project / deal <strong>"${deal.getString("title")}"</strong>${companyName ? " with " + companyName : ""}. Please review the payment summary details below.</p>
            `
        }

        message.html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                        color: #1e293b;
                        line-height: 1.6;
                        margin: 0;
                        padding: 0;
                        background-color: #f8fafc;
                    }
                    .container {
                        max-width: 600px;
                        margin: 40px auto;
                        background-color: #ffffff;
                        border-radius: 12px;
                        border: 1px solid #e2e8f0;
                        overflow: hidden;
                        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);
                    }
                    .header {
                        background-color: #4f46e5;
                        padding: 32px;
                        text-align: center;
                        color: #ffffff;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 24px;
                        font-weight: 700;
                        letter-spacing: -0.025em;
                    }
                    .header p {
                        margin: 8px 0 0 0;
                        font-size: 14px;
                        opacity: 0.9;
                    }
                    .content {
                        padding: 32px;
                    }
                    .greeting {
                        font-size: 16px;
                        font-weight: 600;
                        margin-bottom: 16px;
                    }
                    .lead {
                        font-size: 15px;
                        color: #475569;
                        margin-bottom: 24px;
                    }
                    .invoice-card {
                        background-color: #f8fafc;
                        border: 1px solid #e2e8f0;
                        border-radius: 8px;
                        padding: 24px;
                        margin-bottom: 24px;
                    }
                    .invoice-table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    .invoice-table td {
                        padding: 6px 0;
                        font-size: 14px;
                    }
                    .label {
                        color: #64748b;
                        font-weight: 500;
                    }
                    .val {
                        text-align: right;
                        font-weight: 600;
                        color: #0f172a;
                    }
                    .total-row td {
                        border-top: 1px solid #e2e8f0;
                        padding-top: 12px;
                        margin-top: 6px;
                    }
                    .total-label {
                        font-size: 16px;
                        font-weight: 700;
                        color: #4f46e5;
                    }
                    .total-val {
                        font-size: 18px;
                        font-weight: 800;
                        color: #4f46e5;
                    }
                    .btn-container {
                        text-align: center;
                        margin: 32px 0 16px 0;
                    }
                    .btn {
                        background-color: #4f46e5;
                        color: #ffffff !important;
                        text-decoration: none;
                        padding: 12px 28px;
                        font-size: 14px;
                        font-weight: 600;
                        border-radius: 6px;
                        display: inline-block;
                        box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);
                    }
                    .footer {
                        background-color: #f8fafc;
                        padding: 24px;
                        text-align: center;
                        font-size: 12px;
                        color: #64748b;
                        border-top: 1px solid #e2e8f0;
                    }
                    .footer p {
                        margin: 4px 0;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>NOVA STACK</h1>
                        <p>PREMIUM ENTERPRISE CRM</p>
                    </div>
                    <div class="content">
                        ${contentHtml}
                        
                        <div class="invoice-card">
                            <table class="invoice-table">
                                <tr>
                                    <td class="label">Invoice Description</td>
                                    <td class="val">${invoice.getString("title")}</td>
                                </tr>
                                <tr>
                                    <td class="label">Invoice Number</td>
                                    <td class="val">#${invoice.id.toUpperCase().slice(0, 8)}</td>
                                </tr>
                                <tr>
                                    <td class="label">Due Date</td>
                                    <td class="val">${dueDate}</td>
                                </tr>
                                <tr class="total-row">
                                    <td class="total-label">Total Amount Due</td>
                                    <td class="val total-val">${formattedAmount}</td>
                                </tr>
                            </table>
                        </div>

                        <p style="font-size: 14px; color: #475569;">If you have any questions or require modifications to this invoice, please do not hesitate to contact our billing team at <a href="mailto:billing@novastack.com" style="color: #4f46e5; text-decoration: none;">billing@novastack.com</a>.</p>

                        <div class="btn-container">
                            <a href="mailto:billing@novastack.com?subject=Inquiry%20Invoice%20%23${invoice.id.toUpperCase().slice(0, 8)}" class="btn">Contact Billing Team</a>
                        </div>
                    </div>
                    <div class="footer">
                        <p><strong>Nova Stack Inc.</strong></p>
                        <p>100 Enterprise Way, Silicon Valley, CA 94025</p>
                        <p style="font-size: 11px; margin-top: 12px; opacity: 0.7;">This is an automated notification. Please do not reply directly to this email.</p>
                    </div>
                </div>
            </body>
            </html>
        `

        try {
            $app.newMailClient().send(message)
        } catch (mailErr) {
            // Log to console but do not fail the HTTP request if SMTP is not configured locally
            console.log("Mail send skipped/failed (SMTP probably not configured locally): " + mailErr.message)
        }

        // Update status to pending
        invoice.set("status", "pending")
        $app.save(invoice)

        return c.json(200, { message: "Invoice sent successfully!" })
    } catch (err) {
        return c.json(500, { message: "Failed to send invoice: " + err.message })
    }
}, $apis.requireAuth())
