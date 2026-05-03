# Day 5 — Dashboard Refactor, Radar Intelligence, Intake System & Help Center

## Overview

Refactored the dashboard into separate, focused pages. Added a multi-layered attention system (Today strip, Money at Risk, smart Radar). Built a complete Intake/submission inbox system with API endpoint. Created a comprehensive Help center with tabbed guides.

---

## 1. Dashboard Separation of Concerns

**Goal:** Each page has a single, clear responsibility.

### Changes

- **`/crm` — Command Center** (cleaned up)
  - Removed: Activity feed, Contacts table, FirstRunPanel
  - Kept: KPIs (compact), Radar
  - Renamed from "Business Overview" to "Command Center"
  - Data fetching reduced from 4 parallel queries to 2

- **`/crm/contacts` — New page**
  - Contacts table with Add Contact CTA
  - Empty state component
  - Pulls `getAllContacts()` independently

- **`/activity` — New page**
  - Full-width ActivityFeed timeline
  - Pulls `getRecentActivity()` independently
  - Max width constrained for readability

- **`src/components/dashboard/BusinessKpiGrid.tsx`**
  - Grid changed from `grid-cols-2 lg:grid-cols-5` → `grid-cols-3 lg:grid-cols-5`
  - Gap reduced from 4 → 3

- **`src/components/dashboard/KpiCard.tsx`**
  - Padding reduced from `p-6` → `p-4`
  - Value font from `text-3xl` → `text-2xl`
  - Icon container from `h-12 w-12` → `h-9 w-9`
  - Subtle color changes for compact feel

### New Command Center layout order
```
1. Today strip
2. Money at Risk
3. Radar (urgent / attention / opportunities)
4. KPI cards
```

---

## 2. Radar System Enhancement

**Goal:** Action-oriented, time-contextual, properly sorted attention items.

### Changes to `dashboard.service.ts`

- **Action-driven labels:**
  - `Task overdue` → `Overdue by 3 days — complete it`
  - `Task due in 2 days` → `Due in 2 days — plan ahead`
  - `Expected close Apr 30` → `Past expected close by 5 days — update stage`
  - `Invoice overdue` → `Sent 12 days ago — follow up`
  - `Deal needs follow-up (contacted)` → `In contacted for 20 days — follow up`
  - `Invoice sent — awaiting payment` → `Sent 4 days ago — awaiting payment`
  - `Lead — ready to invoice` → `Valued at $5,000 with Acme — create invoice`
  - `Draft invoice — ready to send` → `Draft — send to client`

- **Corrected links:**
  - Tasks → `/tasks/[id]/edit` (was `/tasks`)
  - Contacts → `/crm/[id]` (was `/crm/deals/new?contactId=...`)

- **Sorting:**
  - Urgent: most overdue first (descending)
  - Attention: closest deadlines first (ascending)
  - Opportunities: highest value deals first, newest contacts first

- **Item limit:** 7 → 5 per section

- Added `RadarItemInternal` with `sortKey` for sorting; strips before returning via `RadarItem[]`

- Added `daysBetween()` helper function

---

## 3. Today Summary Strip

### `src/components/dashboard/TodayStrip.tsx` — New

- Blue bar at top of Command Center
- Shows counts: "2 tasks due · 1 invoice overdue · 3 deals need follow-up"
- Each number is a clickable link to the relevant page
- Items with 0 hidden; entire strip hidden if all 0

### `getTodaySummary()` in service

```typescript
{
  dueTasks: number,           // tasks dueDate <= now AND status != 'done'
  overdueInvoices: number,    // invoices status='sent' AND issuedDate < 7 days ago
  dealsNeedingAttention: number // deals in contacted/quoted AND createdAt < 14 days ago
}
```

Three parallel `prisma.count()` queries via `Promise.all`.

---

## 4. Money at Risk Indicator

### `src/components/dashboard/MoneyAtRiskStrip.tsx` — New

- Amber warning bar below Today strip
- Format: `⚠️ $12.4K at risk · $3.2K overdue · $9.2K open deals`
- Uses `fmtK()` for compact number formatting ($1.2K, $4.5M)
- Hidden when `totalAtRisk === 0`

### `getMoneyAtRisk()` in service

```typescript
{
  overdueInvoicesTotal: number, // SUM of sent invoices >7 days old
  openDealsValue: number,       // SUM of pipeline deals (not won/lost) with value > 0
  totalAtRisk: number           // sum of both
}
```

---

## 5. Intake System (Submission Inbox)

**Goal:** Receive and display external submissions via API.

### Database

- New `IntakeSubmission` model:
  - `id`, `name`, `email`, `message`
  - `source` (default `"external"`)
  - `status` (default `"new"` → `reviewed` / `converted`)
  - `createdAt`, `userId`

- Migration: `20260503175030_add_intake_submission`

### Files Created

| File | Purpose |
|---|---|
| `src/modules/intake/intake.service.ts` | `getAllSubmissions()`, `createSubmission()`, `updateSubmissionStatus()` — userId-scoped |
| `src/app/api/intake/route.ts` | `POST /api/intake` — accepts `{name, email, message}` JSON |
| `src/app/(dashboard)/intake/page.tsx` | Inbox table with empty state |
| `src/app/(dashboard)/intake/actions.ts` | `markReviewedAction`, `markConvertedAction` |
| `src/components/intake/IntakeTable.tsx` | Client table with status badges (blue/yellow/green) and action buttons |

### API Example
```bash
curl -X POST http://localhost:3000/api/intake \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@example.com","message":"Hello"}'
```

---

## 6. Help Center

### `src/app/(dashboard)/help/page.tsx` — New

- Client-side tabbed interface with 8 tabs
- Each tab has detailed, numbered how-to guides
- Written for beginners (plain English, 15-year-old level)

### Tabs & Content

| Tab | Sections |
|---|---|
| **Command Center** | What it is, how to use (4 steps), business role, quick tips |
| **Contacts** | What they are, create/view/edit, business role (step 1 in flow) |
| **Deals** | What they are, stage lifecycle (Lead→Contacted→Quoted→Won/Lost), create/manage, Board View |
| **Invoices** | Status lifecycle (Draft→Sent→Paid/Cancelled), create from deal vs manually, Send/PDF/Cancel, business role |
| **Tasks** | Statuses (Todo/In Progress/Done), create/manage, how tasks connect everything |
| **Intake** | What it is, submission statuses, API format + curl example, processing workflow |
| **Activity** | What it is, timeline content, read-only audit trail |
| **KPIs** | Detailed calculation breakdown for all 5 metrics + summary table |

### Sidebar
- Added "Help" link with `?` icon above Settings

---

## 7. Sidebar Navigation — Final State

```typescript
navigation = [
  { name: 'CRM',      href: '/crm' },
  { name: 'Contacts', href: '/crm/contacts' },
  { name: 'Deals',    href: '/crm/deals' },
  { name: 'Invoices', href: '/invoices' },
  { name: 'Tasks',    href: '/tasks' },
  { name: 'Intake',   href: '/intake' },
  { name: 'Activity', href: '/activity' },
]
(+ Help and Settings at bottom)
```

Each item has a dedicated SVG icon. Active state uses `bg-blue-50 text-blue-700`.

---

## 8. .gitignore

Added:
```
*.db
*.db-journal
data/
```

Prevents committing SQLite database files and Docker data directory.

---

## Build Status

- `npm run build` — ✅ Passes (zero errors)
- `npm run lint` — ✅ Passes (1 pre-existing error, 6 pre-existing warnings)
- New routes: `/activity`, `/crm/contacts`, `/help`, `/intake`, `/api/intake`

---

## Git

- **Commit:** `6c0e071` — 37 files changed, +2180 / −221
- **Pushed** to `origin/main`
