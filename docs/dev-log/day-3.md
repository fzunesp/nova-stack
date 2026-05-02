# Nova Stack – Day 3 Development Log

**Date:** April 30, 2026
**Project:** Nova Stack

## Overview
Day 3 focused on maturing Nova Stack from a multi-module prototype into a production-ready, fully deployable application. The day covered four major pillars: completing the Invoice module with a full revenue lifecycle, introducing user authentication and session management, preparing the application for Docker-based local distribution, and establishing dev tooling for reliable seeding and onboarding state management.

## Major Features Built

### Invoice Revenue Lifecycle
- Full `paidAt` database field added to `Invoice` model with Prisma migration
- `markInvoicePaidAction` — idempotent server action to mark invoices as paid (sets `status = 'paid'` and `paidAt = now()`)
- `markInvoiceSentAction` — server action to transition invoices from `draft` → `sent`
- `MarkPaidButton` and `MarkSentButton` — client components using `useTransition` for non-blocking UI updates
- Invoice list view enhanced with contextual status-aware action buttons
- Paid invoices now visually fade (opacity + bg tint) to reduce cognitive load
- `paidAt` date displayed as green badge beneath the issued date column
- Status badges standardized: Green (Paid), Blue (Sent), Gray (Draft), Red (Cancelled)

### Deal Intelligence
- Deal service layer (`getDealById`, `getAllDeals`) updated to include `invoices` relation
- `DealInfo` component updated to render a linked invoices section showing title, status badge, and navigation link per invoice
- `DealWithContact` type extended to include optional `Invoice[]` relation

### Dashboard Revenue Accuracy
- `getBusinessMetrics()` updated to use `paidAt !== null` as the authoritative source of truth for total revenue (decoupled from fragile string matching)
- `getRecentActivity()` extended to include "Invoice marked as paid" events sourced from `paidAt` timestamps, feeding directly into the activity feed

### Authentication & Session Management
- Introduced HMAC-signed session cookies via `setSessionUserId` / `clearSession` from `src/lib/auth.ts`
- `logoutAction` server action added — clears session cookie and redirects to `/login`
- `loginAction` updated to import and use `clearSession`
- `Topbar` converted to async Server Component; now dynamically fetches and displays the current user's name/initials from the database
- Functional **Logout button** added to the Topbar, eliminating the need for manual cookie clearing

### Docker Distribution
- `Dockerfile` created using `node:22-alpine` (required for Prisma 7 / `@prisma/streams-local` engine compatibility)
- `docker-compose.yml` created with `app` + `mailpit` services
  - SQLite database persisted via `./data` volume mount at `/app/data/dev.db`
  - `EMAIL_HOST=mailpit` wired automatically in compose environment
  - Mailpit exposed on ports `1025` (SMTP) and `8025` (Web UI)
- `.dockerignore` configured to exclude `node_modules`, `.next`, local DB files, and `data/`
- `README.md` updated with "Option 2: Run with Docker" section including first-run migration and seed commands

### Developer Tooling
- `scripts/dev-reset.ts` created — upserts the `DEFAULT_DEV_USER_ID` user and forces `onboardingCompleted = true` for instant dev bypass
- `npm run dev:reset` script added to `package.json`
- `prisma/seed.ts` refactored to:
  - Import and enforce `DEFAULT_DEV_USER_ID` from `src/lib/auth.ts` for guaranteed scope alignment
  - Use `upsert` instead of `create` (non-destructive to user record)
  - Seed exclusively to the primary dev account (no secondary user)
  - Emit debug confirmation logs: userId match validation + per-entity counts

## System Improvements
- Prisma client regenerated after schema migration to ensure type safety (`paidAt` field visible in all service layers)
- `CreateInvoiceInput` type updated to make `paidAt` optional on creation (avoids breaking existing invoice creation flows)
- `EMAIL_*` environment variable naming standardized across `.env`, `.env.example`, and `src/lib/email.ts`

## Architecture Notes
- Invoice payment state is now fully decoupled: `status` field remains for UI display, `paidAt` timestamp is the definitive financial source of truth
- Docker volume design deliberately uses a separate `/app/data` directory rather than mounting over `/app/prisma` to prevent host files from shadowing schema definitions inside the container
- Session management avoids JWTs for simplicity; HMAC-signed cookie values provide tamper-proof user identity without external dependencies

## Key Design Decisions
- **`paidAt` as source of truth**: Revenue metrics are calculated from presence of `paidAt` rather than `status === 'paid'`, ensuring consistency even if status labels evolve
- **Idempotent payment action**: `markInvoicePaidAction` returns early without writing if `paidAt` already exists, preventing race conditions and double-processing
- **Node 22 in Docker**: Upgraded from node:20 after encountering `EBADENGINE` warnings from `@prisma/streams-local`, ensuring forward compatibility
- **Async Topbar as Server Component**: Avoids a separate API call or client-side hydration for user data — the current user's info is fetched once at render time server-side
- **Single dev user seeding**: Removed the secondary seeded user to ensure all seeded data is unambiguously attached to `DEFAULT_DEV_USER_ID`, eliminating the most common cause of "empty dashboard" confusion

## Current System Status
- CRM fully complete (Contacts + Deals + pipeline + dashboard)
- Tasks fully complete (CRUD + inline updates)
- Invoices fully complete (CRUD + send via email + PDF + full payment lifecycle)
- Authentication complete (login, logout, session cookies, dev bypass)
- Docker distribution complete (one-command startup, persistent SQLite volume, bundled email testing)
- Developer tooling complete (seed, dev:reset, debug logging)

## Known Next Steps
- Import/export data as CSV (contact list, invoice history)
- Enhanced customer management (contact detail page with full activity history)
- Company/workspace settings screen (logo, name, address for PDF invoices)
- Production hardening (proper password auth, rate limiting on login)
