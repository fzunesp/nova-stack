# Day 6 — Intake Conversion, Approval Workflow, Assignment System & My Signals

## Overview

Extended the Intake system with structured conversion actions, a full approval workflow with auto-task creation, JSON data support, assignment/ownership across the system, human-readable reference IDs, and a personalized "My Signals" panel on the dashboard.

---

## 1. Intake Conversion Actions

**Goal:** Turn submissions into Contacts, Deals, or Tasks with one click.

### Service Layer

Added 3 conversion functions to `intake.service.ts`:

| Function | Creates | Duplicate handling |
|---|---|---|
| `createContactFromSubmission(id)` | Contact with name, email, notes | Reuses existing contact by email |
| `createDealFromSubmission(id)` | Contact (or reuse) + Deal in `lead` stage | Same contact reuse |
| `createTaskFromSubmission(id)` | Task with submission details in description | Always creates new |

All three auto-set `status = 'converted'` on the submission.

### UI — IntakeTable
- Replaced generic "Convert" button with 3 specific buttons: **Contact**, **Deal**, **Task**
- Buttons disabled when submission is already converted
- Shows "Converted" in italic when done

---

## 2. Approval Workflow & Flexible JSON

**Goal:** Add approval/rejection flow and accept dynamic payloads.

### Schema Changes
- `IntakeSubmission` now includes:
  - `type` (default `"general"`) — categorizes submissions
  - `data` (Json) — stores extra fields from API payload
  - `decisionNote` (String?) — approval/rejection reason
  - `decidedAt` (DateTime?) — when decision was made

### Status Flow
`new` → `in_review` → `approved` / `rejected` → `converted`

### API Route
- `POST /api/intake` now accepts **any** JSON payload
- Known fields (`name`, `email`, `message`, `type`) extracted directly
- All other fields stored in `data` as JSON

### Status Badges
| Status | Color |
|---|---|
| New | Blue |
| In Review | Yellow |
| Approved | Emerald |
| Rejected | Red |
| Converted | Green |

### UI Actions per Status
| Status | Buttons |
|---|---|
| `new` | Review \| Approve \| Reject \| \| Contact \| Deal \| Task |
| `in_review` | Approve \| Reject \| \| Contact \| Deal \| Task |
| `approved`/`rejected`/`converted` | All disabled |

### View Details
- Click any row to expand
- Shows full message, JSON data, and decision notes

---

## 3. Auto-Task on Approval

**Goal:** Reduce manual work when approving submissions.

When a submission is approved, `autoTaskOnApproval()` checks the `type` field:

| `type` | Task Title | Details Extracted |
|---|---|---|
| `vacation` | "Review vacation request for {name}" | Days, dates from `data` |
| `reimbursement` | "Process reimbursement for {name}" | Amount, category from `data` |
| `hardware` | "Handle hardware request for {name}" | Item/device from `data` |

- Only triggers on first approval (throws error if already approved)
- Unknown types are silently skipped
- All tasks include original message

---

## 4. Assignment & Reference IDs

**Goal:** Ownership and human-readable identifiers.

### Schema Changes
- **Task:** `assignedToId String?` → `assignedUser User?`
- **Deal:** `assignedToId String?` → `assignedUser User?`
- **IntakeSubmission:** `assignedToId String?`, `reference String @unique`
- **User:** Added `assignedTasks`, `assignedIntake`, `assignedDeals` relations

### Reference IDs
- Format: `INT-0001`, `INT-0002`, etc.
- Generated on `createSubmission()` by finding latest reference, extracting number, incrementing, padding to 4 digits
- Displayed as monospace badge in intake table

### Default Assignment
- All creates set `assignedToId = current userId`:
  - `createTask()` 
  - `createDeal()`
  - `createSubmission()`
- New update functions: `updateTaskAssignee()`, `updateDealAssignee()`, `updateSubmissionAssignee()`

### Intake Table — New Columns
- **Ref** — reference ID badge
- **Assignee** — "Assigned" badge or "Unassigned"

---

## 5. My Signals Panel

**Goal:** Surface items assigned to the current user.

### Service — `getMySignals()`
- Fetches items where `assignedToId` matches current session user
- Tasks (max 5, not done), Intake (max 5, undecided), Deals (max 3, not won/lost)
- Sorted by most recent activity

### Component — `MySignalsPanel.tsx`
- Section title: "Your Signals" with item count
- Each item shows: type badge, title (link), status label, new dot indicator
- Auto-hides when empty

### Command Center Layout
```
1. Today strip
2. Your Signals  ← NEW
3. Money at Risk
4. Radar
5. KPI cards
```

---

## Build Status

- `npm run build` — ✅ Passes (zero errors)
- `npm run lint` — ✅ Pre-existing warnings only
- 3 new migrations created

---

## Files Changed Summary

| File | Type | Change |
|---|---|---|
| `prisma/schema.prisma` | Modified | 3 migrations: intake JSON/type, approval fields, assignment/reference |
| `src/modules/intake/intake.service.ts` | Modified | Conversion functions, approve/reject, auto-task, reference generation, assignment |
| `src/app/api/intake/route.ts` | Modified | Flexible JSON payload support |
| `src/app/(dashboard)/intake/actions.ts` | Modified | 3 conversion + 2 approval actions |
| `src/components/intake/IntakeTable.tsx` | Modified | Reference column, assignee column, approve/reject buttons, expand detail view |
| `src/modules/crm/deal.service.ts` | Modified | Default assignment on create, assignee update |
| `src/modules/tasks/task.service.ts` | Modified | Default assignment on create, assignee update |
| `src/modules/dashboard/dashboard.service.ts` | Modified | `getMySignals()` function |
| `src/components/dashboard/MySignalsPanel.tsx` | **New** | Your Signals panel |
| `src/app/(dashboard)/crm/page.tsx` | Modified | Integration of MySignalsPanel |
