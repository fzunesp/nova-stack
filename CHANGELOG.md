# Changelog

All notable changes to the Nova Stack CRM & HR Operating System will be documented in this file. Nova Stack adheres to semantic versioning.

---

## [1.2.0] - 2026-05-21
### Added
- **First-Run Workspace Setup Wizard**: A premium, step-by-step glassmorphic setup overlay for administrators. Automatically guides the administrator to personalize their name, establish their company name, and select a branded accent theme color upon their very first dashboard load.
- **HR Help Documentation**: Dedicated instruction panels in the Help Center covering HR Operations, pre-built request workflows (Vacations, Expenses, Hardware), Dynamic Form Builder templates, and the backend sequential/parallel Approval State Machine cascade.
- **Outbound Webhooks Integration**: Advanced settings dashboard allowing admins to register URL endpoints for webhook triggers on critical workspace events:
  - `deal.won` — Stage transition to won.
  - `invoice.paid` — Status transition to approved (paid).
  - `intake.approved` — Status transition to approved.
  - `contact.created` — Creation of new customer contacts.
- **Vite & TS Compiler Optimization**: Restructured nested state machines, explicit typescript typing parameters, and pruned dead/unused dependencies across all main modules to ensure clean build compiling.

---

## [1.1.0] - 2026-05-20
### Added
- **Flowmatica HR Operations Module**:
  - **Vacation Request Form**: Date range picker with auto-computed duration calculation.
  - **Expense Reimbursement Form**: File attachments for receipts, categories, and amount tracking.
  - **Hardware Request Form**: Need justification, estimated budget, and item description.
  - **Decision Queue & Analytics**: HR managers and admins can review pending submissions with reasons and notes, accompanied by a rich Recharts-powered volume and speed analysis dashboard.
- **Intake → Deal Conversion**: Single-click conversion from approved intake requests to deals in the active CRM pipeline. Automatically maps budgets, pre-fills deal details, links the original intake to the new deal, and references the customer contact.
- **Deal → Invoice Quick-Create**: Instant invoice draft generation directly from CRM deal opportunities. Pre-fills client contacts, values, project names, and links records.
- **Real-Time Notification Center**: Bell icon in header displaying unread events using real-time PocketBase subscriptions across `tasks`, `deals`, `contacts`, `invoices`, and `intake_submissions`.

---

## [1.0.0] - 2026-05-18
### Added
- **relational Database Overhaul**: Transitioned schema to strict relational constraints mapping Contacts, Deals, Invoices, and Tasks cleanly to an account-centric Companies hub.
- **Chronological Timelines**: Combined, grouped, and styled all related events, transactions, and pipeline activities chronologically inside Company profiles.
- **Admin User Management**: Admin panel inside Settings for listings, role edits (admin, hr, user), user deletion, and new user invitation.
- **Data backups & CSV Export**: Automated data exports in CSV format for Contacts, Deals, and Invoices. One-click PocketBase backup downloader.
- **Appearance & Accent Color Themes**: Multi-palette configuration context offering Indigo, Violet, Emerald, and Orange options, saved in localStorage per-user.

---

[1.2.0]: https://github.com/fzunesp/nova-stack/releases/tag/v1.2.0
[1.1.0]: https://github.com/fzunesp/nova-stack/releases/tag/v1.1.0
[1.0.0]: https://github.com/fzunesp/nova-stack/releases/tag/v1.0.0
