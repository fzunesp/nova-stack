# Day 7 — Role-Based Access Control + Work Queue System

## Date
2026-05-17

## Summary
Implemented role-based access control (admin/hr/user) and built a personal work assignment queue system. Fixed critical `sort=-updated` bug that was silently killing all work queue queries.

---

## 1. Role-Based Access Control

### Database
- Added `role` field (Select: `admin` | `hr` | `user`, default: `user`) to PocketBase `users` collection via Admin UI
- Assigned roles: `user1@demo.com` = admin, `user2@demo.com` = hr, `user3@demo.com` = user

### Frontend Changes
- **`types.ts`** — Added `role: 'admin' | 'hr' | 'user'` to `UserRecord` interface
- **`useAuth.ts`** — Full rewrite: typed user, added `isAdmin`, `isHr`, `isHrOrAdmin` computed getters
- **`DashboardPage.tsx`** — Gated `<ActivityFeed>` behind `isHrOrAdmin` check
- **`DashboardLayout.tsx`** — Added role badge in sidebar user section (collapsed + expanded states)

### Result
| Role | Activity Feed | Data Access |
|------|--------------|-------------|
| admin | Visible | All records |
| hr | Visible | All records |
| user | Hidden | Own records only |

---

## 2. Work Queue System

### Database Schema
- **Migration `1779071000_add_assignment_fields.js`** — Added `assignedToId` (relation→users) to contacts and invoices; added `assignedAt` (date) to all 5 collections

### TypeScript Types
- Added `assignedToId?: string` and `assignedAt?: string` to all record interfaces (ContactRecord, DealRecord, TaskRecord, InvoiceRecord, IntakeRecord)

### Service Layer
- **`work-queue.ts`** — New service with:
  - `getMyWorkQueue()` — Fetches items assigned to current user from all 5 collections, sorts by urgency (pending/draft/lead/quoted first), limits to 20
  - `groupWorkQueue()` — Groups items into "Needs attention", "Waiting", "Recently updated"
- **`useMyWorkQueue.ts`** — React Query hook wrapping the service
- Updated `ALLOWED_FIELDS` on all 5 services to include `assignedToId` and `assignedAt`

### UI Component
- **`MyWorkQueue.tsx`** — High-density operator UI with:
  - Type badges (task/intake/deal/contact/invoice) with distinct colors
  - Status badges with color coding
  - Relative timestamps ("5m ago", "2h ago", "3d ago")
  - Grouped sections: Needs attention, Waiting, Recently updated
  - Hidden when empty (no noise)
  - Clickable rows navigating to respective sections

### Dashboard Integration
- Placed after ActivityFeed, before MySignalsPanel in `DashboardPage.tsx`

---

## 3. Bug Fix: `sort=-updated` → `sort=-created`

**Problem:** All work queue queries used `sort: '-updated'` but none of the collections have an `updated` field. PocketBase returned 400 errors, silently failing the entire `Promise.all` and showing an empty work queue.

**Fix:** Changed all 5 collection queries in `work-queue.ts` from `sort: '-updated'` to `sort: '-created'`.

**Root cause:** The `updated` field exists in the TypeScript types but was never created in the PocketBase schema. Only `created` is auto-managed by PocketBase.

---

## 4. Documentation
- Screen-by-screen walkthrough of all 9 pages (Login, Register, Dashboard, CRM, Tasks, Invoices, Intake, Settings, Help)
- Mapped each screen's purpose, data model, and UI patterns

---

## Files Changed

| File | Action |
|------|--------|
| `pocketbase/pb_migrations/1779071000_add_assignment_fields.js` | Created |
| `web/src/services/types.ts` | Updated (role, assignedToId, assignedAt) |
| `web/src/hooks/useAuth.ts` | Rewritten (typed user + role getters) |
| `web/src/pages/DashboardPage.tsx` | Updated (ActivityFeed gating + MyWorkQueue) |
| `web/src/components/DashboardLayout.tsx` | Updated (role badge) |
| `web/src/services/work-queue.ts` | Created |
| `web/src/hooks/useMyWorkQueue.ts` | Created |
| `web/src/components/dashboard/MyWorkQueue.tsx` | Created |
| `web/src/services/contacts.ts` | Updated ALLOWED_FIELDS |
| `web/src/services/invoices.ts` | Updated ALLOWED_FIELDS |
| `web/src/services/deals.ts` | Updated ALLOWED_FIELDS |
| `web/src/services/tasks.ts` | Updated ALLOWED_FIELDS |
| `web/src/services/intake.ts` | Updated ALLOWED_FIELDS |

---

## Test Data
- **user1@demo.com** (admin) — 18 tasks, 3 intakes, 12 deals assigned
- **user2@demo.com** (hr) — 21 tasks, 6 intakes, 12 deals assigned
- **user3@demo.com** (user) — 0 assigned (empty state)
- All passwords: `password123`

---

## Outstanding
- Work queue `sort=-updated` bug fixed but needs verification with live data
- `updated` field does not exist on any collection — may need to be added if "recently updated" grouping is to work correctly
- Assignment UI (assigning items to users) not yet built — currently only seed data has assignments
