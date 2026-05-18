# Nova Stack — PocketBase Migration & Framework Rewrite

## Overview

This document outlines the complete migration of Nova Stack from its current architecture (Next.js + PostgreSQL + Prisma) to a new stack: **React SPA + Vite + shadcn/ui + PocketBase**.

## Current Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 App Router (SSR + RSC) |
| Database | PostgreSQL 15 (Docker) |
| ORM | Prisma 7.8 |
| Auth | Custom HMAC-signed cookies |
| Email | Nodemailer + Mailpit |
| Styling | Tailwind CSS v4 |
| Deployment | Docker Compose (app + postgres + mailpit) |

## Target Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite (SPA, no SSR) |
| Routing | React Router v7 |
| UI Components | shadcn/ui (Radix UI + Tailwind CSS v4) |
| State | TanStack Query (server) + Zustand (client) |
| Forms | React Hook Form + Zod |
| Database | PocketBase v0.38.0 (embedded SQLite) |
| Auth | PocketBase JWT (stateless) |
| Email | PocketBase SMTP + Mailpit |
| Styling | Tailwind CSS v4 (same as current) |
| Tables | TanStack Table |
| Deployment | Docker Compose (pocketbase + mailpit) |

## Why This Change

### Why PocketBase
- Single binary backend (~12MB), no external database dependency
- Built-in admin dashboard, auth, and REST API
- Simpler Docker setup (1 container vs 2)
- Extensible with Go or JavaScript hooks
- Aligns with Nova Stack's philosophy: fast, simple, operational

### Why React SPA (not Next.js SSR)
- PocketBase's author explicitly warns against JS SSR: SDK instance sharing bugs, OAuth2 complications, realtime proxying issues
- SPA talks directly to PocketBase from the browser — the architecture PocketBase was designed for
- No middle Node.js layer = fewer round trips, simpler auth, no SSR pitfalls
- React has the largest ecosystem and most PocketBase community examples

### Why shadcn/ui
- 80+ production-tested, accessible components
- Fully customizable (not a component library — copy-paste code you own)
- Built on Radix UI primitives + Tailwind CSS v4
- Largest community adoption in the React ecosystem
- Vibrant, active development

## Architecture

### Folder Structure
```
nova-stack/
├── pocketbase/
│   ├── pb_data/              # SQLite database + files (gitignored)
│   └── pb_migrations/        # JS migration files (committed)
│       ├── 001_create_users.js
│       ├── 002_create_contacts.js
│       ├── 003_create_deals.js
│       ├── 004_create_tasks.js
│       ├── 005_create_invoices.js
│       └── 006_create_intake_submissions.js
│
├── web/                      # React SPA (replaces src/)
│   ├── src/
│   │   ├── components/       # shadcn/ui components
│   │   │   ├── ui/           # Base shadcn primitives (Button, Input, Dialog, etc.)
│   │   │   ├── layout/       # Sidebar, Topbar
│   │   │   ├── crm/          # Contact/deal components
│   │   │   ├── dashboard/    # KPI, radar, activity components
│   │   │   ├── invoices/     # Invoice components
│   │   │   ├── tasks/        # Task components
│   │   │   └── intake/       # Intake components
│   │   ├── pages/            # React Router page components
│   │   ├── lib/
│   │   │   └── pocketbase.ts # PocketBase client singleton
│   │   ├── hooks/            # useAuth, useContacts, useDeals, etc.
│   │   └── services/         # Data layer (replaces current modules/)
│   ├── vite.config.ts
│   ├── package.json
│   └── index.html
│
├── scripts/
│   ├── migrate-from-postgres.ts  # Data migration script
│   └── seed.ts                   # Development seed script
│
├── docker-compose.yml        # pocketbase + mailpit
├── Dockerfile                # Multi-stage: build SPA, serve with PocketBase
├── .gitignore
└── docs/
    ├── ai-context.md
    ├── roadmap.md
    ├── nova_stack_next_steps_master_plan.md
    └── rewrite/
        └── migration-plan.md  (this document)
```

## Database Schema Mapping

### Current Prisma Models → PocketBase Collections

| Prisma Model | PocketBase Collection | Type |
|---|---|---|
| User | users | auth |
| Contact | contacts | base |
| Deal | deals | base |
| Task | tasks | base |
| Invoice | invoices | base |
| IntakeSubmission | intake_submissions | base |

### Field Mapping

**users** (auth collection)
- email (email, unique, identity)
- name (text)
- displayName (text)
- companyName (text)
- onboardingCompleted (bool, default: false)

**contacts** (base collection)
- name (text, required)
- email (email)
- phone (text)
- companyName (text)
- notes (text)
- userId (relation → users)

**deals** (base collection)
- title (text, required)
- value (number)
- stage (select: lead, contacted, quoted, won, lost)
- expectedCloseDate (date)
- contactId (relation → contacts)
- userId (relation → users)
- assignedToId (relation → users, optional)

**tasks** (base collection)
- title (text, required)
- description (text)
- status (select: todo, in_progress, done)
- dueDate (date)
- userId (relation → users)
- assignedToId (relation → users, optional)

**invoices** (base collection)
- title (text, required)
- amount (number, required)
- status (select: draft, sent, paid, cancelled)
- issuedDate (date)
- dueDate (date)
- paidAt (date)
- userId (relation → users)
- dealId (relation → deals, optional)

**intake_submissions** (base collection)
- name (text, required)
- email (email, required)
- message (text, required)
- type (select: general, vacation, reimbursement, hardware)
- source (select: external, internal)
- status (select: new, in_review, approved, rejected, converted)
- reference (text, unique)
- data (json)
- decisionNote (text)
- decidedAt (date)
- assignedToId (relation → users, optional)
- userId (relation → users)

### API Rules (per-collection access control)

All base collections will have:
- **List rule:** `userId = @request.auth.id`
- **View rule:** `userId = @request.auth.id`
- **Create rule:** `userId = @request.auth.id`
- **Update rule:** `userId = @request.auth.id`
- **Delete rule:** `userId = @request.auth.id`

This enforces single-tenant isolation — users only see their own data.

## Migration Phases

### Phase 1: PocketBase Setup
1. Create `pocketbase/` directory structure
2. Write `pb_migrations/` JS files for all 6 collections
3. Set up `docker-compose.yml` with PocketBase service
4. Create `web/` directory with Vite + React + TypeScript scaffold
5. Install dependencies: React, React Router, shadcn/ui, TanStack Query, Zustand, PocketBase SDK
6. Create `web/src/lib/pocketbase.ts` client singleton

### Phase 2: Auth Layer
1. Implement PocketBase JWT auth with httpOnly cookie storage
2. Create `useAuth()` hook (login, logout, session management)
3. Build login page and onboarding/setup flow
4. Implement route guards (redirect unauthenticated users)
5. Handle dev mode bypass (AUTH_BYPASS)

### Phase 3: Frontend Rewrite (all 6 modules)
1. **Dashboard** — KPIs, Radar, Today Strip, Activity Feed, Money at Risk, My Signals
2. **CRM** — Contacts list, contact detail, deals list, deals board (Kanban), deal detail, create/edit forms
3. **Invoices** — Invoice list, invoice detail, create invoice, mark paid/sent/cancel, PDF generation, email sending
4. **Tasks** — Task list, create/edit task, status management
5. **Intake** — Intake submissions table, approve/reject, convert to contact/deal/task
6. **Activity** — Activity feed page
7. **Help** — Documentation/tabs page

### Phase 4: Data Migration
1. Write `scripts/migrate-from-postgres.ts`
2. Export all data from PostgreSQL via Prisma
3. Import into PocketBase via JS SDK (superuser client)
4. Verify data integrity (counts, relations, references)
5. Write `scripts/seed.ts` for development data

### Phase 5: Cleanup & Production
1. Remove `prisma/` directory, Prisma dependencies
2. Remove PostgreSQL from docker-compose
3. Update Dockerfile: multi-stage build (Vite build → PocketBase serves SPA)
4. Update `.gitignore`, `.dockerignore`
5. Update `README.md`, `docs/ai-context.md`, `docs/roadmap.md`
6. Test Docker Compose one-command startup

## Key Technical Decisions

| Decision | Rationale |
|---|---|
| React SPA (not Next.js SSR) | PocketBase designed for direct browser-to-API communication; SSR causes SDK sharing bugs, OAuth2 complications |
| shadcn/ui | Most production-tested React component ecosystem; fully owned code, not a black-box library |
| TanStack Query | Handles caching, refetching, optimistic updates — replaces Prisma's server-side data fetching |
| Zustand | Lightweight client state for UI-only state (modals, sidebar, filters) |
| React Router v7 | Standard SPA routing; file-based routing not needed for this app size |
| Keep Tailwind CSS v4 | Same styling system, zero migration needed for existing styles |
| PocketBase as separate service | Keeps backend and frontend decoupled; easier to develop and debug |
| Single-tenant design | Each user only sees their own data via API rules; no multi-tenant complexity |

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| PocketBase pre-1.0, no backward compat | Read changelog on upgrade; pb_migrations are version-controlled |
| SQLite doesn't scale horizontally | Acceptable for Nova Stack's target: small businesses, single-tenant |
| Full rewrite is large scope | Phase-by-phase delivery; each module is independently testable |
| PDF generation moves from server to client | Keep pdf-lib in frontend; generate PDFs client-side, or use PocketBase hooks |
| Email sending via PocketBase SMTP | PocketBase has built-in SMTP; configure same Mailpit for dev |

## Estimated Scope

- **PocketBase setup + migrations:** ~2 days
- **Auth layer:** ~1 day
- **Frontend rewrite (6 modules):** ~5-7 days
- **Data migration script:** ~1 day
- **Docker + production:** ~1 day
- **Total:** ~10-12 days of focused development
