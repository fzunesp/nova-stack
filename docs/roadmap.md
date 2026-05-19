# Nova Stack Roadmap

---

# Phase 1 — Foundation ✅

## Core System
- Contacts
- Deals
- Tasks
- Invoices
- Dashboard

## Infrastructure
- Prisma
- SQLite
- Docker setup
- Mailpit integration

## Revenue Loop
- Generate invoices from deals
- Invoice email sending
- Mark paid flow
- Cancel invoice flow
- Revenue metrics

---

# Phase 2 — Operational Layer ✅

## Intake System
- Dynamic intake creation
- JSON payload support
- Assignment
- Approval workflows
- Human-readable intake IDs

## Dashboard Improvements
- Radar system
- Today system
- Signals
- Activity feed
- KPI separation

## UX Improvements
- Empty state guidance
- Workflow continuity
- Operational navigation

---

# Phase 3 — Platform Stabilization 🚧

## Database
- PostgreSQL migration
- Production-ready persistence
- Backup strategy

## Search & Navigation
- Global search
- Command palette
- Fast navigation

## Notifications
- Assignment notifications
- Approval notifications
- Invoice notifications

---

# Phase 4 — Smart Operations

## Suggestions Engine
Examples:
- stale deals
- missing follow-ups
- missing invoices
- unassigned intake

## Automation Expansion
- webhook layer
- n8n integration
- external workflows

## Templates
- intake templates
- workflow templates
- operational presets

---

# Phase 5 — HR Operations ✅

Goal:
Lightweight operational HR.

NOT:
enterprise HR suite.

## Planned Features (Completed 18 May 2026)
- [x] vacation requests
- [x] reimbursement workflows
- [x] hardware requests
- [x] approvals
- [x] assignment routing

Potential future:
- onboarding checklists
- employee document acknowledgment

---

# Phase 6 — Deployment & Distribution

## VPS Deployment
- Docker-first deployment
- PostgreSQL persistence
- production environment configuration

## Client Simplicity
Goal:
single-command startup.

Example:
docker compose up

---

# Long-Term Vision

Nova Stack becomes:

"A unified lightweight operations platform"

Combining:
- CRM
- operational workflows
- intake
- approvals
- revenue
- task coordination

Into:
one operational workspace.

---

# Guiding Principles

## Avoid
- enterprise bloat
- over-configuration
- excessive permissions complexity
- unnecessary modules

## Prioritize
- operational clarity
- speed
- simplicity
- actionable visibility
- low-friction workflows