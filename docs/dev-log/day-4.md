# Day 4 — Invoice Lifecycle, Revenue Flow UX, Navigation & Docker

## Overview

Focused on three major areas: completing the invoice state machine, improving the Contact → Deal → Invoice → Paid user flow, and achieving a true one-command Docker startup.

---

## 1. Invoice Lifecycle — Full State Machine

**Goal:** Production-ready invoice state transitions with strict enforcement.

### Changes

- **`src/modules/invoices/invoice.service.ts`**
  - Added `InvoiceStatus` type: `'draft' | 'sent' | 'paid' | 'cancelled'`
  - Added `VALID_TRANSITIONS` map enforcing:
    - `draft → sent, paid, cancelled`
    - `sent → paid, cancelled`
    - `paid → (terminal)`
    - `cancelled → (terminal)`
  - Added `validateInvoiceTransition()` function

- **`src/app/(dashboard)/invoices/actions.ts`**
  - Updated `markInvoicePaidAction` — rejects cancelled invoices, validates transition
  - Added `cancelInvoiceAction` — rejects paid invoices, clears `paidAt`, revalidates all paths
  - Updated `markInvoiceSentAction` — rejects cancelled invoices, validates transition

- **`src/components/invoices/CancelInvoiceButton.tsx`** — **New**
  - Client component with `window.confirm` dialog
  - Disabled when invoice is paid or cancelled
  - Red-themed styling matching existing patterns

- **`src/components/invoices/MarkPaidButton.tsx`**
  - Added `status` prop
  - Disabled when status is `paid` or `cancelled`

- **`src/components/invoices/InvoiceActionButtons.tsx`**
  - Added `CancelInvoiceButton`
  - Hides all actions for terminal states (paid/cancelled)

- **`src/app/(dashboard)/invoices/page.tsx`**
  - Added cancelled row styling (red tint, reduced opacity)

### Already Correct (No Changes Needed)
- `prisma/schema.prisma` — Already had `status` and `paidAt` fields
- `src/components/crm/DealInfo.tsx` — Already displayed all 4 status badges
- `src/modules/dashboard/dashboard.service.ts` — Already excluded cancelled from revenue metrics

---

## 2. Core Revenue Workflow UX

**Goal:** A new user understands what to do next at every step without instructions.

### Changes

- **`src/components/crm/ContactHeader.tsx`**
  - Added helper text: "Deals track opportunities with this contact" under Add Deal button

- **`src/components/crm/CreateInvoiceFromDealButton.tsx`**
  - Added `hasInvoice` and `invoiceId` props
  - When invoice exists → shows "View Invoice" link instead of create button
  - When deal has no value → disabled with tooltip: "Add a deal value to create an invoice"
  - Removed redundant client-side validation (server handles it)

- **`src/components/crm/DealHeader.tsx`**
  - Passes `hasInvoice`/`invoiceId` to CreateInvoiceFromDealButton
  - Conditional helper text:
    - No invoice + no value: "Add a deal value to create an invoice"
    - No invoice + has value: "Generate an invoice once this deal is confirmed"

- **`src/app/(dashboard)/invoices/page.tsx`**
  - Changed subtitle to: "Invoices are typically created from Deals"
  - Improved empty state: "Create one from a Deal to start tracking revenue"
  - Primary CTA changed to "Go to Deals" (was "Create your first invoice")
  - Added Deal column with link back to the source deal

---

## 3. Invoice Creation Flow & Navigation

**Goal:** After creating an invoice, user lands on that specific invoice. Easy navigation back to Deal.

### Changes

- **`src/app/(dashboard)/crm/deals/invoice-actions.ts`**
  - Changed redirect from `/invoices` → `/invoices/${invoiceId}`

- **`src/app/(dashboard)/invoices/new/actions.ts`**
  - Captures returned invoice ID
  - Changed redirect from `/invoices` → `/invoices/${invoiceId}`

- **`src/app/(dashboard)/invoices/[id]/page.tsx`** — **New**
  - Full invoice detail page showing:
    - Title, status badge, amount
    - Issued date, due date, paid date
    - Linked deal (with link back)
    - Contact info (with link back)
    - Action buttons (Mark Paid, Cancel, Send, PDF)
  - Back navigation:
    - Has deal → "← Back to Deal" → `/crm/deals/[dealId]`
    - No deal → "← Back to Invoices" → `/invoices`

### Flow Now
```
Create Invoice → lands on /invoices/[id]
  ↳ Has deal? → "← Back to Deal" → /crm/deals/[dealId]
  ↳ No deal?  → "← Back to Invoices" → /invoices
```

---

## 4. Docker — One-Command Startup

**Goal:** `docker compose up` does everything. No manual steps.

### Changes

- **`scripts/start.sh`** — **New**
  - Startup script with clear console logging:
    ```
    [1/3] Generating Prisma Client... → Prisma Client ready
    [2/3] Applying database migrations... → Database ready
    [3/3] Seeding database... → Seeding complete
    =========================================
      App running at http://localhost:3000
    =========================================
    ```
  - Seeds only in development mode (`NODE_ENV=development`)
  - Creates data directory if missing
  - Uses `exec` to replace shell with Node process

- **`Dockerfile`**
  - Changed CMD from `npm start` → `/bin/sh /app/scripts/start.sh`
  - Added `chmod +x` for startup script
  - Added `bash` to apk install (for script compatibility)

- **`docker-compose.yml`**
  - Removed `env_file` dependency — all env vars set directly
  - Set `NODE_ENV=development` for auto-seeding
  - Removed manual migration/seed instructions

- **`.dockerignore`**
  - Added `.env` and `.git` to prevent leaking secrets

- **`README.md`**
  - Simplified Docker section to one command
  - Removed manual migration/seed steps
  - Added reset instructions

---

## Build Status

- `npm run build` — ✅ Passes (zero errors)
- `npm run lint` — ✅ Passes (1 pre-existing error, 7 pre-existing warnings)
- New route registered: `/invoices/[id]`

---

## Files Changed Summary

| File | Type | Change |
|---|---|---|
| `src/modules/invoices/invoice.service.ts` | Modified | Added state machine validation |
| `src/app/(dashboard)/invoices/actions.ts` | Modified | Cancel action, transition validation |
| `src/components/invoices/CancelInvoiceButton.tsx` | **New** | Cancel button component |
| `src/components/invoices/MarkPaidButton.tsx` | Modified | Status-aware disabled states |
| `src/components/invoices/InvoiceActionButtons.tsx` | Modified | Cancel button, hide for terminal states |
| `src/app/(dashboard)/invoices/page.tsx` | Modified | Helper text, deal column, cancelled styling |
| `src/components/crm/ContactHeader.tsx` | Modified | Helper text under Add Deal |
| `src/components/crm/CreateInvoiceFromDealButton.tsx` | Modified | View Invoice link, disabled states |
| `src/components/crm/DealHeader.tsx` | Modified | Helper text, hasInvoice prop |
| `src/app/(dashboard)/invoices/[id]/page.tsx` | **New** | Invoice detail page with back nav |
| `src/app/(dashboard)/crm/deals/invoice-actions.ts` | Modified | Redirect to invoice detail |
| `src/app/(dashboard)/invoices/new/actions.ts` | Modified | Redirect to invoice detail |
| `scripts/start.sh` | **New** | Docker startup script |
| `Dockerfile` | Modified | Uses start.sh as CMD |
| `docker-compose.yml` | Modified | Inline env vars, no manual steps |
| `.dockerignore` | Modified | Added .env, .git |
| `README.md` | Modified | Simplified Docker instructions |
