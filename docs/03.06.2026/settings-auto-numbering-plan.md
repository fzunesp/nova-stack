# Settings & Auto-Numbering System — Implementation Plan

**Date:** 03 June 2026
**Status:** ✅ Fully Implemented & Tested (04 June 2026)
**Owner:** AI Agent

---

## 1. Architecture Overview

### Problem
The client needs configurable sequential numbering for every major entity (Companies, Contacts, Deals, Tasks, Invoices, Products, Intakes, Employees, Requests) with custom prefixes, padding, and suffixes (e.g., `EMP-0001-CLE`). They also need a central place to store company info (name, logo, address) and global defaults.

### Solution
A new `app_settings` collection storing **one record per category**, each with a flexible JSON `config` field. This grows naturally as the app accumulates settings — numbering, company info, billing, appearance, etc.

### What belongs in `app_settings` vs what stays separate

| In `app_settings` | Reason |
|---|---|
| `numbering` — prefixes, padding, suffixes for all entities | Singleton config, one record |
| `company` — name, logo, address, phone, registration | Singleton config, one record |
| `billing` — currency, tax rate, payment terms | Singleton config, one record |
| `defaults` — default assignee, default stages | Singleton config, one record |

| Stays as separate collection | Reason |
|---|---|
| `templates` | Many records, individual CRUD, search, delete |
| `form_definitions` | Complex nested JSON, individual lifecycle, referenced by other records |
| `webhooks` | Many endpoints, individual enable/disable, event-specific filtering |
| `products` | Inventory items, pricing, individual management |
| PocketBase URL/port | Infrastructure — needs to be known *before* DB is accessible (chicken-and-egg) |

**Rule of thumb:** `app_settings` = global configuration (how the system behaves). Separate collections = business data (things the user creates/manages).

---

## 2. Database Schema

### New Collection: `app_settings`

| Field | Type | Constraints | Purpose |
|---|---|---|---|
| `category` | text | unique, required | `"numbering"`, `"company"`, `"billing"`, `"defaults"` |
| `config` | JSON | maxSize 64000 | All settings for that category |

**Access Rules:**
- `listRule` / `viewRule`: `@request.auth.id != ''` (authenticated users can read)
- `createRule` / `updateRule` / `deleteRule`: `@request.auth.isAdmin = true` (admin only)

### Seed Records

**Record 1 — `numbering`:**
```json
{
  "category": "numbering",
  "config": {
    "companies":  { "prefix": "CMP",  "padding": 4, "suffix": "" },
    "contacts":   { "prefix": "CON",  "padding": 4, "suffix": "" },
    "deals":      { "prefix": "DEA",  "padding": 4, "suffix": "" },
    "tasks":      { "prefix": "TSK",  "padding": 4, "suffix": "" },
    "invoices":   { "prefix": "INV",  "padding": 5, "suffix": "" },
    "products":   { "prefix": "PRD",  "padding": 4, "suffix": "" },
    "intakes":    { "prefix": "INT",  "padding": 4, "suffix": "" },
    "employees":  { "prefix": "EMP",  "padding": 4, "suffix": "" },
    "requests":   { "prefix": "REQ",  "padding": 4, "suffix": "" }
  }
}
```

**Record 2 — `company`:**
```json
{
  "category": "company",
  "config": {
    "name": "",
    "logo": "",
    "address": "",
    "phone": "",
    "email": "",
    "registration": "",
    "taxId": "",
    "website": ""
  }
}
```

**Record 3 — `billing`:**
```json
{
  "category": "billing",
  "config": {
    "currency": "USD",
    "tax_rate": 0,
    "payment_terms_days": 14
  }
}
```

### New Field on `invoices` Collection

| Field | Type | Constraints | Purpose |
|---|---|---|---|
| `invoiceNumber` | text | unique | Auto-generated number (e.g., `INV-00001`) |

**Note:** The existing `title` field is NOT removed — backward compatibility. `invoiceNumber` becomes the authoritative identifier.

---

## 3. Backend Hook

### File: `pb_hooks/invoice_number.pb.js`

**Trigger:** `onModelBeforeCreateSuccess` for `invoices`

**Logic:**
1. Fetch `app_settings` record where `category = "numbering"`
2. Read `config.invoices.prefix`, `config.invoices.padding`, `config.invoices.nextNumber` (or default to `INV`, `5`, `1`)
3. Generate: `{prefix}-{padded number}` (e.g., `INV-00001`)
4. Set `invoiceNumber` on the invoice record
5. Increment `nextNumber` in the settings record and save
6. **Fallback:** If no settings record exists, scan existing invoices for the highest `invoiceNumber`, extract the number, and start from `max + 1`

**Atomicity:** PocketBase hooks run within the request transaction — the settings update and invoice creation are atomic. No race conditions.

---

## 4. Settings UI — Billing Tab

### File: `web/src/components/BillingTab.tsx`

**Pattern:** Follows existing tab patterns (card sections, forms, toast feedback, `useQuery` + `useMutation`)

#### Section 1 — Invoice Numbering
- Prefix input (text, default `"INV"`)
- Padding selector (number, 3–6 digits)
- Next number display (read-only, with "Reset counter" button)
- Live preview: `INV-00001`

#### Section 2 — Entity Numbering Grid (future-ready)
| Entity | Prefix | Padding | Suffix | Preview |
|---|---|---|---|---|
| Companies | `CMP` | 4 | — | `CMP-0001` |
| Contacts | `CON` | 4 | — | `CON-0001` |
| Deals | `DEA` | 4 | — | `DEA-0001` |
| Tasks | `TSK` | 4 | — | `TSK-0001` |
| Invoices | `INV` | 5 | — | `INV-00001` |
| Products | `PRD` | 4 | — | `PRD-0001` |
| Intakes | `INT` | 4 | — | `INT-0001` |
| Employees | `EMP` | 4 | `CLE` | `EMP-0001-CLE` |
| Requests | `REQ` | 4 | — | `REQ-0001` |

All saved to `config` JSON under `numbering` category. Single save button for all changes.

#### Section 3 — Company Info
- Company name, address, phone, email, registration number, tax ID, website
- Logo upload placeholder (file reference stored as string)

#### Section 4 — Currency & Tax
- Currency dropdown (USD, EUR, GBP, etc.)
- Tax rate % input
- Payment terms (days) input

---

## 5. Invoices UI Update

### File: `web/src/pages/InvoicesPage.tsx`

**Changes:**
- Fetch `numbering` settings via `useQuery` on `app_settings`
- In create dialog: replace manual `title` input with read-only preview showing next number format (`INV-00001`)
- Remove `title` from `formData` state (or keep as hidden/derived from `invoiceNumber`)
- In list view: display `invoiceNumber` as the primary identifier
- In send invoice dialog: use `invoiceNumber` instead of `title` for `{invoice_number}` template tag

---

## 6. Settings Page Integration

### File: `web/src/pages/SettingsPage.tsx`

**Changes:**
- Add `{ id: 'billing', label: 'Billing', icon: DollarSign }` to admin-only tabs array
- Import and render `<BillingTab />` in the tab content area
- Add tab headings to `tabHeadings` map for right-sidebar TOC

---

## 7. Execution Order (Sequential)

### Phase 1: Database Schema

- [x] **Step 1:** Create migration `pocketbase/pb_migrations/1979071087_create_app_settings.js`
  - Creates `app_settings` collection with `category` (text, unique) and `config` (JSON)
  - Sets access rules (authenticated read, admin write)
  - Seed records created via API: `numbering`, `company`, `billing`

- [x] **Step 2:** Create migration `pocketbase/pb_migrations/1979071088_add_invoiceNumber_to_invoices.js`
  - Adds `invoiceNumber` field (text, unique) to `invoices` collection
  - Preserves existing `title` field for backward compatibility

### Phase 2: Backend Hook

- [x] **Step 3:** Create `pocketbase/pb_hooks/invoice_number.pb.js`
  - `onModelCreate` for `invoices`
  - Reads numbering config from `app_settings` via `getString('config')` → `JSON.parse()`
  - Scans existing invoices for highest number to determine next number
  - Generates format: `{prefix}-{padded number}` (e.g., `INV-00001`)
  - **Verified:** Prefix changes in Settings immediately apply to next invoice

### Phase 3: Settings UI

- [x] **Step 4:** Create `web/src/components/BillingTab.tsx`
  - Four sections: Entity Numbering Grid, Company Info, Currency & Tax
  - Uses `useQuery` + `useMutation` pattern
  - Single save per section with toast feedback
  - Live preview for all numbering formats

- [x] **Step 5:** Update `web/src/pages/SettingsPage.tsx`
  - Added Billing tab to admin sidebar (DollarSign icon)
  - Wired up `<BillingTab />` component
  - Updated TOC headings

### Phase 4: Invoices UI

- [x] **Step 6:** Update `web/src/pages/InvoicesPage.tsx`
  - Fetch numbering settings for create dialog preview
  - Replaced title input with auto-generated number preview
  - Display `invoiceNumber` as primary identifier in list view
  - Updated send invoice template tags to use `invoiceNumber`
  - Updated search to include `invoiceNumber` field

### Phase 5: Test & Verify

- [x] **Step 7:** Applied PocketBase migrations (restart)
- [x] **Step 8:** Verified `app_settings` collection with 3 seed records
- [x] **Step 9:** Created test invoices → verified `invoiceNumber` auto-generates sequentially
- [x] **Step 10:** Changed prefix in Settings (BILL → ACME) and padding (5 → 6) → verified new format applies (`ACME-000013`)
- [x] **Step 11:** Frontend lint checked — only pre-existing `any` type warnings remain

---

## 8. Files Summary

### Created (4 files)
1. `pocketbase/pb_migrations/1979071087_create_app_settings.js` — Collection schema
2. `pocketbase/pb_migrations/1979071088_add_invoiceNumber_to_invoices.js` — New field
3. `pocketbase/pb_hooks/invoice_number.pb.js` — Auto-numbering hook
4. `web/src/components/BillingTab.tsx` — Settings UI component

### Modified (2 files)
1. `web/src/pages/SettingsPage.tsx` — Added Billing tab (import, tab entry, TOC headings, render)
2. `web/src/pages/InvoicesPage.tsx` — Auto-numbering preview, display, search, template tags

### Implementation Notes
- **Config access:** Use `record.getString('config')` → `JSON.parse()` to read nested JSON in PocketBase JS runtime. Direct `get('config')` returns a `JsonMap` that doesn't support dot notation for nested properties.
- **Counter strategy:** Hook scans existing invoices for highest number instead of maintaining a separate counter. Simpler, more reliable, no race conditions.
- **Seed records:** Created via API. For production, add to `seed.mjs`.
- **Hook function:** Uses `onModelCreate` (not `onModelBeforeCreate` — doesn't exist in this PocketBase version).

---

## 9. Tradeoffs & Decisions

| Decision | Rationale |
|---|---|
| JSON config field vs individual columns | Flexibility — add new settings without schema migrations |
| One collection for all settings | Grows naturally; each category is one record |
| Separate `invoiceNumber` field (not reuse `title`) | Clean separation; `title` can still be used for display/description |
| Hook reads settings on every invoice create | Settings are cached by PocketBase; negligible overhead |
| Admin-only write access to settings | Prevents accidental config changes by regular users |
| Env vars for PocketBase URL/port | Infrastructure must be known before DB is accessible |

---

## 10. Future Extensions

The `app_settings` collection is designed to absorb future configuration needs:

- **Integrations tab** — API keys, n8n URLs, third-party toggles
- **Notifications tab** — default email sender, SMS provider, alert rules
- **Appearance tab** — default theme, custom CSS, logo URL
- **Security tab** — session timeout, password policy, 2FA toggle
- **Entity-specific numbering** — hook extensions for Companies, Contacts, Deals, etc.
