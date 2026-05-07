# Nova Stack — Strategic Development Plan

## Purpose

This document exists to:

- preserve project continuity across AI chats
- maintain strategic direction
- avoid feature drift
- provide a clear development sequence
- restore context quickly in future sessions

When starting a new AI session, provide:

- `docs/ai-context.md`
- this document
- today's specific objective

This should allow rapid continuity without re-explaining the entire project.

---

# Current State

Nova Stack has evolved from a lightweight CRM into a broader operational platform.

Current implemented systems include:

## Core CRM
- Contacts
- Deals
- Tasks
- Dashboard

## Revenue System
- Invoices
- Invoice lifecycle
- Revenue metrics
- Invoice generation from deals
- Revenue tracking dashboard

## Dashboard Systems
- KPIs
- Radar
- Today view
- Activity feed
- Signals

## Intake System
- Dynamic intake architecture
- JSON payload support
- Assignment workflows
- Approval flows
- Human-readable intake IDs

## Infrastructure
- Docker Compose
- Mailpit
- Prisma
- PostgreSQL migration (in progress/completing)

---

# Product Direction

Nova Stack is NOT intended to become:

- enterprise ERP
- enterprise HR suite
- bloated CRM

Nova Stack IS intended to become:

> A lightweight operational workspace for small businesses.

The platform should centralize:

- contacts
- operational tasks
- intake requests
- approvals
- revenue workflows
- coordination
- lightweight HR operations

while remaining:

- fast
- approachable
- low-friction
- visually calm
- operationally focused

---

# Guiding Product Philosophy

## Primary User

Non-technical small business users.

Examples:
- service companies
- small operations teams
- local businesses
- field operators
- administrative staff

Users should NEVER feel like:
- database admins
- IT operators
- enterprise software operators

---

# Core Design Rules

## UX Rules

Prioritize:
- clarity
- speed
- visibility
- actionable information
- low cognitive load

Avoid:
- excessive configuration
- enterprise complexity
- permission overload
- nested workflows
- over-modularization

---

## Architecture Rules

### Business Logic

Business logic belongs in:
- services
- server actions

Never in:
- presentation components
- client rendering logic

---

## Infrastructure Rules

Nova Stack should be:
- Docker-first
- simple to deploy
- simple to back up
- simple to restore

Goal:

```bash
docker compose up
```

should start the entire operational platform.

---

# Strategic Development Sequence

This section represents the recommended implementation order.

Future AI sessions should generally follow this sequence unless debugging or urgent fixes interrupt the roadmap.

---

# Phase 1 — Stabilization (CURRENT)

Goal:
Solidify infrastructure and operational consistency.

## Priority 1 — PostgreSQL Stabilization

Status:
In progress.

Objectives:
- complete migration from SQLite
- validate Prisma consistency
- ensure Docker stability
- eliminate stale SQLite references
- validate migrations
- validate seed consistency
- ensure app + Docker use same database

Required outcomes:
- local dev stable
- Docker stable
- VPS-ready architecture

---

## Priority 2 — Environment Standardization

Objectives:
- unify env handling
- standardize DATABASE_URL strategy
- eliminate duplicate config patterns
- separate dev vs docker env cleanly

Recommended strategy:

### Local Dev

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/novastack
```

### Docker Internal

```env
DATABASE_URL=postgresql://postgres:postgres@db:5432/novastack
```

---

## Priority 3 — Backup & Persistence

Objectives:
- verify postgres volume persistence
- create backup strategy
- document restore process
- ensure upgrades are safe

Future:
- automated backup support
- export/restore UI

---

# Phase 2 — Productivity Layer

Goal:
Make Nova Stack feel extremely fast and operational.

---

## Priority 1 — Global Search

Purpose:
Instant access to operational data.

Search should include:
- contacts
- deals
- invoices
- tasks
- intake requests

Desired UX:
- keyboard-driven
- instant filtering
- lightweight modal
- global availability

Potential shortcut:

```text
CMD+K
CTRL+K
```

---

## Priority 2 — Command Palette

Purpose:
Turn Nova Stack into an operational command center.

Examples:
- create contact
- create deal
- create invoice
- create intake
- jump to dashboard
- assign intake
- mark task complete

Goal:
Reduce navigation friction.

---

## Priority 3 — Notifications

Types:
- assignment notifications
- approval notifications
- invoice notifications
- overdue warnings
- stale deal alerts

Potential channels:
- in-app
- email
- future webhook integration

---

# Phase 3 — Smart Operations

Goal:
Increase operational intelligence.

---

## Suggestions Engine

Examples:
- stale deals needing follow-up
- invoices missing payment
- intake not assigned
- tasks overdue
- contacts without deals
- deals missing invoices

This should feel:
- lightweight
- operational
- helpful

NOT:
- invasive AI automation

---

## Smart Dashboard Signals

Expand Radar and Signals into:
- predictive operational visibility
- risk awareness
- opportunity surfacing

Potential future:
- scoring systems
- operational health indicators

---

# Phase 4 — HR Operations

Goal:
Build lightweight HR workflows.

Important:
Nova Stack is NOT becoming Workday or BambooHR.

The HR layer should remain:
- operational
- lightweight
- practical

---

## Initial HR Workflows

### Vacation Requests
- intake form
- approval flow
- assignment
- status tracking

### Reimbursement Requests
- receipt upload
- approval
- accounting notification

### Hardware Requests
- request hardware
- approve/reject
- assignment routing

---

## Future HR Possibilities

Potential future additions:
- onboarding checklists
- employee acknowledgements
- policy acceptance
- lightweight document workflows

Avoid:
- payroll
- enterprise HRIS complexity

---

# Phase 5 — Automation & Integrations

Goal:
Connect Nova Stack externally.

---

## n8n Integration Layer

Recommended architecture:

Nova Stack = source of truth
n8n = automation layer

Nova Stack should trigger:
- webhooks
- operational events
- workflow actions

n8n should handle:
- Slack
- Gmail
- Sheets
- external systems
- automation chains

---

## API Layer

Potential future:
- public API
- webhook subscriptions
- automation triggers

---

# Phase 6 — Distribution & Commercialization

Goal:
Turn Nova Stack into a deployable business product.

---

## Deployment Model

Primary deployment:
- VPS
- Docker Compose
- PostgreSQL

Goal:
Very low technical barrier.

---

## Operational Simplicity

Client experience should feel like:
- install Docker
- run one command
- use application

Users should never manually:
- manage DBs
- run migrations
- configure infrastructure

---

## Commercial Direction

Potential business models:
- setup service
- managed hosting
- support plans
- customization
- workflow consulting

---

# Long-Term Vision

Nova Stack becomes:

> A lightweight operational workspace for small businesses.

Core identity:
- operational
- coordinated
- lightweight
- fast
- practical

NOT:
- enterprise ERP
- bloated CRM
- giant HR platform

The system should help businesses:
- coordinate work
- process requests
- manage revenue
- assign responsibilities
- maintain visibility
- reduce operational friction

inside one clean operational environment.

---

# AI Session Continuity Instructions

When starting a new AI session:

Provide:
- ai-context.md
- this roadmap
- today's objective

Then say:

```text
Ralph Day X
```

Example:

```text
Ralph Day 8
Current objective:
Implement Global Search.
```

This should restore project continuity rapidly.

