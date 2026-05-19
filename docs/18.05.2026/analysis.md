# Nova Stack — Code-Verified Critical Analysis
*Date: 18 May 2026 — Full codebase audit after Day 8*

---

## First-Pass Errors — Corrected

Three initial criticisms were wrong because they were based on docs, not code:

| First Analysis Said | Code Reality |
|---|---|
| "No production-ready auth" | ❌ Wrong — LoginPage, RegisterPage, ProtectedRoute, Zustand useAuth, PocketBase authWithPassword, role system (admin/hr/user), password change in Settings |
| "Global Search is future work" | ❌ Wrong — Fully shipped: CTRL+K, 6 collections (now 7 with companies fix), debounce, keyboard nav, grouped results |
| "No per-record timeline" | ❌ Wrong — Contact timeline AND Company detail view both built |

---

## What Is Actually Built (Verified Line-by-Line)

### Core Shell
- ✅ Dark sidebar nav — collapsible icon mode, mobile hamburger, smooth transitions
- ✅ Topbar — page title, Global Search bar, Bell icon, Quick Create dropdown
- ✅ Quick Create (`+ New`) — opens create dialog on target page via React Router state
- ✅ Global Search CTRL+K — 7 collections, debounce 200ms, keyboard nav ↑↓ Enter ESC
- ✅ Theme system — 4 accent colors (Indigo, Violet, Emerald, Orange), CSS variables, persisted to localStorage
- ✅ Settings — Profile tab, Security (password change), Appearance (theme picker)

### Auth & Users
- ✅ Email/password login via PocketBase `authWithPassword`
- ✅ Public self-registration page (⚠️ security gap — see below)
- ✅ Role-based UI gating: `isAdmin`, `isHr`, `isHrOrAdmin`
- ✅ Session persistence via PocketBase authStore
- ✅ Password change: Settings > Security

### CRM
- ✅ Contacts CRUD — full create/edit/delete, linked to Companies via `companyId`
- ✅ Contacts grouped by Company in the list table
- ✅ Contact profile + unified timeline — deals, tasks, invoices on chronological timeline
- ✅ Deals CRUD — pipeline stages: lead/contacted/quoted/won/lost
- ✅ Deals require a Contact (enforced in UI — red border + disabled submit)
- ✅ Server-side pagination + search + sort via `usePaginatedQuery` hook

### Companies
- ✅ Full CRUD — name, industry, website, phone, address, city, country, notes, status
- ✅ Company detail view — contacts list, deals list, invoices list, revenue + won deals metrics
- ✅ Status: lead / active / inactive with badge display
- ✅ Company as FK anchor across all entities (6 migrations)

### Tasks
- ✅ Full CRUD — priority, due date, assignedToId
- ✅ Linked to Contact + Deal + Company via FK migrations

### Invoices
- ✅ Full lifecycle — draft → pending → approved / rejected / archived
- ✅ Invoice requires a Deal (enforced in UI)
- ✅ Line items — product picker, qty, price, auto-calc total, expandable row breakdown
- ✅ Outstanding + Paid summary cards

### Products
- ✅ Full CRUD — name, SKU, price, description, status
- ✅ Feeds into invoice line items (auto-fills name + price)

### Intake
- ✅ Types: general / vacation / reimbursement / hardware
- ✅ Source: internal / external
- ✅ Assignment + approval workflow (draft → pending → approved/rejected)

### Dashboard
- ✅ TodayStrip — due tasks, overdue invoices, stale deals
- ✅ ActivityFeed — admin/HR only
- ✅ MyWorkQueue — all items assigned to current user, priority-grouped
- ✅ MySignalsPanel — personalized: my tasks, my intakes, my deals
- ✅ MoneyAtRiskStrip — overdue invoices total + open deals value
- ✅ RadarPanel — Urgent / Attention / Opportunities signals
- ✅ BusinessKpiGrid — revenue, outstanding, active deals, conversion rate, tasks

### Architecture
- ✅ `BaseService<T>` abstract class — shared CRUD + validation
- ✅ Status state machine — `STATUS_TRANSITIONS` per entity type, throws `AppError` on invalid transitions
- ✅ 7 typed entity services — companies, contacts, deals, tasks, invoices, intake, products
- ✅ 45 PocketBase migrations — full schema evolution audit trail
- ✅ React Query throughout — `useQuery`, `useMutation`, cache invalidation

---

## Genuine Gaps (Code-Confirmed Missing)

### 🔴 Critical — Deployment Blockers

**1. Open self-registration**
`RegisterPage.tsx` is unguarded. Anyone can create an account including admin roles. Cannot safely share a URL until this is fixed.
- Fix: Disable self-registration in PocketBase collection rules
- Better: Admin-only user invite flow in Settings > Users

**2. No backup or data export**
- No "Download Backup" button
- No CSV export from any table
- No invoice PDF generation
- Docker volume wipe = total data loss

### 🟡 Real but Less Urgent

**3. Companies missing from Global Search** *(Fixed in this session — see progress below)*

**4. Search results don't deep-link to records**
Clicking a search result navigates to the list page (`/crm`, `/invoices`), not to the specific record. No per-record URL routes exist.

**5. Bell icon is decorative**
Red dot is hardcoded. No notification system behind it.

**6. README describes the wrong stack**
Still says Next.js + Prisma + SQLite. Actual: Vite + React SPA + PocketBase.

**7. No update path**
No upgrade instructions, no version tracking, no changelog.

---

## Revised Assessment

| Original Criticism | Verdict After Code Review |
|---|---|
| "No auth" | Retracted — fully wrong |
| "No global search" | Retracted — fully wrong |
| "No per-record timeline" | Retracted — wrong |
| "Crowded market, no differentiator" | Still valid |
| "Non-technical users vs Docker tension" | Still valid |
| "JSON line items will hurt" | Partially valid — fine for SMB scale, no cross-item reporting |
| "No roadmap 'done' definition" | Still valid |
| "PocketBase ceiling" | Still valid — PostgreSQL migration = full rewrite |
| "n8n integration is vague" | Still valid — not started |

---

## Strategic Questions (Must Be Answered Before Phase 6)

1. **Who deploys this?** Owner or IT person? Determines desktop installer vs Docker story.
2. **Business model?** One-time license? Setup service? Open source?
3. **PostgreSQL or stay PocketBase?** Commit to one. Migration risk is high.

---

## The Honest Bottom Line

After reading the full code: this is significantly more complete than the documentation suggests. In 8 days a genuinely functional, architecturally clean, polished business application was built.

**Real blockers to first deployment:** Open registration + no backup/export. Both are 1–2 sessions of work.

**The real risk:** Building indefinitely without a real user. Close those two gaps and ship to one actual business this week.
