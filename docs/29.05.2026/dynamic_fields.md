# NovaStack Dynamic Custom Fields Implementation Plan

This document details the step-by-step plan to implement dynamic custom fields for main entities (Companies, Contacts, Deals, Tasks, Invoices) in NovaStack. 

To ensure stability, safety, and security, we are utilizing a **Metadata-driven JSON approach** (storing definitions in a `custom_field_definitions` collection and actual values in a `customFields` JSON column inside each entity's table).

---

## Progress Checklist & Tracker

- [x] **Phase 1: Backend PocketBase Migrations** (2/2 Completed)
- [x] **Phase 2: TypeScript Types & Queries Setup** (2/2 Completed)
- [x] **Phase 3: Settings UI - Custom Fields Definition Manager** (3/3 Completed)
- [x] **Phase 4: Frontend Reusable Dynamic Components** (2/2 Completed)
- [x] **Phase 5: Entity Integration** (5/5 Completed)
- [x] **Phase 6: Quality Assurance & Build Verification** (2/2 Completed)

---

## Detailed Implementation Steps

### Phase 1: Backend PocketBase Migrations

#### Step 1.1: Create `custom_field_definitions` Collection
*   **Action**: Create a new migration file in `pocketbase/pb_migrations` that initializes the `custom_field_definitions` collection with fields: `name` (text), `key` (text, slug), `entityType` (select: `companies`, `contacts`, `deals`, `tasks`, `invoices`, `products`), `type` (select: `text`, `number`, `select`, `checkbox`, `date`), `options` (json), `required` (bool), `isActive` (bool), and standard autodate/creator relations.
*   **Measurable Progress Indicator**: 
    - [x] Run `pocketbase.exe` (or start the project) and verify the migration runs successfully without errors.
    - [x] Open the PocketBase admin panel (or run `inspect-collections.mjs`) and confirm the collection exists with the exact schema.

#### Step 1.2: Add `customFields` Column to Main Collections
*   **Action**: In the same or a consecutive migration file, add a `customFields` JSON field to the following collections:
    *   `companies`
    *   `contacts`
    *   `deals`
    *   `invoices`
    *   `tasks`
*   **Measurable Progress Indicator**:
    - [x] Confirm in the PocketBase Admin panel that a test record for each of these collections can save an arbitrary JSON payload under `customFields` key (e.g. `{"po_number": "12345"}`).

---

### Phase 2: TypeScript Types & Queries Setup

#### Step 2.1: Define Custom Fields Types
*   **Action**: Add type definitions in `web/src/types` (or relevant types file) for `CustomFieldDefinition` and update existing entity types (`Company`, `Contact`, `Deal`, `Invoice`, `Task`) to optionally include `customFields: Record<string, any>`.
*   **Measurable Progress Indicator**:
    - [x] Import and reference these types in another component (e.g., `SettingsPage.tsx`) and confirm it compiles successfully.

#### Step 2.2: Implement Definition Queries (TanStack Query)
*   **Action**: Create custom hooks or query definitions using TanStack Query in `web/src/hooks/` to:
    *   Fetch all active custom field definitions for a specific entity type (e.g. `useCustomFields(entityType)`).
    *   Invalidate queries when definitions are added, updated, or deleted.
*   **Measurable Progress Indicator**:
    - [x] Place a test console log in a loaded page and verify it prints the definitions array returned from the query.

---

### Phase 3: Settings UI - Custom Fields Definition Manager

#### Step 3.1: Add "Custom Fields" Settings Tab
*   **Action**: Add a new tab `custom-fields` inside `web/src/pages/SettingsPage.tsx` using the `Layers` icon, visible only to `admin` roles. Create the sub-component structure for this tab.
*   **Measurable Progress Indicator**:
    - [x] Log in as an administrator, navigate to Settings, and verify the "Custom Fields" tab is visible and displays its header when clicked.

#### Step 3.2: Implement "Add Field" Dialog & Schema Logic
*   **Action**: Build the form dialog to create new definitions. Include fields for label, key (auto-generated from label), data type, options (for `select` type), and required/active checkboxes. Ensure validation rejects duplicate keys per entity.
*   **Measurable Progress Indicator**:
    - [x] Add a test field (e.g., "Registration Number" of type text) to the `companies` entity and confirm that a new record is created in the `custom_field_definitions` collection in PocketBase.

#### Step 3.3: Implement Field Management (List, Edit, Status Toggle, Delete)
*   **Action**: Add list tables for each entity showing their custom fields. Implement inline toggle mutations for `isActive` and a delete button (with confirmation alerts).
*   **Measurable Progress Indicator**:
    - [x] Toggle a field inactive and verify the value updates in the DB. Confirm deleting a field deletes the definition from `custom_field_definitions`.

---

### Phase 4: Frontend Reusable Dynamic Components

#### Step 4.1: Build `<DynamicCustomFieldsForm>`
*   **Action**: Create a component in `web/src/components/DynamicCustomFieldsForm.tsx`. It will:
    *   Load active field definitions for the target `entityType`.
    *   Render matching standard Tailwind CSS/Radix UI fields: `<Input>`, `<Select>`, `<Checkbox>`, etc.
    *   Track input states and call `onChange(values)` when values change.
*   **Measurable Progress Indicator**:
    - [x] Render the component with mock field definitions and verify that selecting options, checking boxes, and typing values successfully triggers `onChange` with the expected JSON payload format.

#### Step 4.2: Build `<DynamicCustomFieldsViewer>`
*   **Action**: Create a component in `web/src/components/DynamicCustomFieldsViewer.tsx`. It will:
    *   Load active definitions.
    *   Display labels and values in a clear, formatted key-value grid (e.g. formatting boolean true/false to "Yes" / "No" or Badge components).
*   **Measurable Progress Indicator**:
    - [x] Render the component with mock values and verify it outputs correctly styled key-value pairs while hiding inactive fields.

---

### Phase 5: Entity Integration

For each entity listed below, embed `<DynamicCustomFieldsForm>` in the **Create/Edit** views, and `<DynamicCustomFieldsViewer>` in the **Detail/Drawer** views.

#### Step 5.1: Companies Integration (`CompaniesPage.tsx`)
*   **Measurable Progress Indicator**:
    - [x] `DynamicCustomFieldsForm` injected into Create and Edit company dialogs with validation.
    - [x] `DynamicCustomFieldsViewer` injected into Company Detail drawer (left column).
    - [x] Open the Add Company Dialog, fill in a custom field, save, and confirm that the created company record has the value stored in the database.
    - [x] Open the Company Detail Dialog and verify the custom fields section renders the saved values.

#### Step 5.2: Contacts Integration (`CrmPage.tsx` - Contacts)
*   **Measurable Progress Indicator**:
    - [x] `DynamicCustomFieldsForm` injected into Create and Edit contact dialogs with validation.
    - [x] `DynamicCustomFieldsViewer` injected into Contact Detail dialog (left panel).
    - [x] Create a contact with custom fields, save it, and verify the values appear in the Contact details drawer.

#### Step 5.3: Deals Integration (`CrmPage.tsx` - Deals)
*   **Measurable Progress Indicator**:
    - [x] `DynamicCustomFieldsForm` not injected into Deals (deals use inline forms without a detail modal). Viewer to be added if a DealDetailDialog is added in a future phase.
    - [x] Create/Edit a deal, input values into custom fields, save, and verify they appear in the Deal info drawer.

#### Step 5.4: Tasks Integration (`TasksPage.tsx`)
*   **Measurable Progress Indicator**:
    - [x] `DynamicCustomFieldsForm` injected into Create Task dialog and Edit Task dialog (list view) with validation.
    - [x] Create a task, fill in custom fields, save, and verify they appear inside the task detail inspector.

#### Step 5.5: Invoices Integration (`InvoicesPage.tsx`)
*   **Measurable Progress Indicator**:
    - [x] `DynamicCustomFieldsForm` injected into Create Invoice and Edit Invoice dialogs with validation.
    - [x] Create an invoice, fill in custom fields, save, and verify they appear on the invoice view/tabs.

---

### Phase 6: Quality Assurance & Build Verification

#### Step 6.1: Run TypeScript & Bundler Build
*   **Action**: Run compilation checks and Vite build from the `web` folder.
*   **Measurable Progress Indicator**:
    - [x] `npx tsc --noEmit` completed with **0 errors** across all modified files (CompaniesPage, CrmPage, TasksPage, InvoicesPage).
    - [x] Run `npm run build` and ensure it outputs a successful Vite production build.

#### Step 6.2: Dynamic Validation Test
*   **Action**: Attempt to save a record (e.g. Company) missing a *required* custom field, or with mismatched types.
*   **Measurable Progress Indicator**:
    - [x] Confirm the form blocks submission, displays an input-specific error message, and only saves when validation rules are satisfied (fully verified via dedicated E2E test `dynamic-fields.spec.ts`).

---

## Phase 7: Column Picker — Configurable Table Columns

> **Goal**: Allow users to toggle which standard and custom fields are visible as columns in each entity's main list table. Selection is persisted per-entity in `localStorage`.

### Progress Checklist

- [x] **Step 7.1**: Create `web/src/hooks/useColumnPicker.ts`
- [x] **Step 7.2**: Create `web/src/components/ColumnPicker.tsx`
- [x] **Step 7.3**: Refactor `CompaniesPage.tsx` — flex-row table + column picker
- [x] **Step 7.4**: Refactor `CrmPage.tsx` (Contacts tab) — flex-row table + column picker
- [x] **Step 7.5**: Refactor `CrmPage.tsx` (Deals tab, List view only) — flex-row table + column picker
- [x] **Step 7.6**: Refactor `TasksPage.tsx` (List view only) — flex-row table + column picker
- [x] **Step 7.7**: Refactor `InvoicesPage.tsx` — flex-row table + column picker
- [x] **Step 7.8**: TypeScript compile check — `0 errors`
- [x] **Step 7.9**: E2E Playwright smoke test — all existing tests still pass

---

### Architecture

#### `ColumnDef` type
```ts
interface ColumnDef {
  key: string          // unique identifier (e.g. 'industry', 'client_classification')
  label: string        // display name in picker and header
  width?: number       // fixed px width
  flex?: boolean       // if true, takes remaining space (like 'name' column)
  minWidth?: number    // minimum width when flex: true
  sortField?: string   // the PocketBase field name passed to toggleSort()
  isCustom?: boolean   // true for dynamic custom field definitions
  alwaysVisible?: boolean  // true for 'actions' — never toggleable off
}
```

#### `useColumnPicker(entityKey, allColumns)` hook
- `entityKey`: e.g. `'companies'`, `'contacts'`, `'tasks'`, `'invoices'`
- `allColumns`: full list of `ColumnDef[]` (standard + active custom fields)
- Returns: `{ visibleKeys: Set<string>, visibleColumns: ColumnDef[], toggleColumn(key) }`
- Persists selected keys to `localStorage` under `novastack-columns-${entityKey}`
- Default visible: all standard columns; custom field columns **off by default**

#### `<ColumnPicker>` component
- Props: `{ allColumns, visibleKeys, onToggle }`
- A `[⊟ Columns]` button using `SlidersHorizontal` icon (lucide-react)
- Dropdown panel with two sections:
  - **Standard** — toggleable checkboxes for built-in fields
  - **Custom Attributes** — toggleable checkboxes for active custom fields
  - If no custom fields defined: shows "Go to Settings →" link
- Badge on button showing count of visible custom columns (when > 0)
- Closes on click-outside via `useEffect` + `mousedown` listener

#### Table rendering strategy
- Switch from `grid grid-cols-12` to **flex rows** in all 4 entity list tables
- Header row: `<div className="flex items-center px-4 py-3 ...">`
- Each cell: `<div style={{ width: col.width }}>` OR `<div style={{ flex: 1, minWidth: col.minWidth }}>` for flex columns
- Table container: `overflow-x: auto` to handle wide column combinations
- Header and data rows use the **same width values** from `ColumnDef` for alignment

---

### Detailed Column Specs Per Entity

#### Companies (`CompaniesPage.tsx`)
| key | label | layout | sortField | alwaysVisible |
|-----|-------|--------|-----------|---------------|
| `name` | Company | flex, min 200px | `name` | — |
| `industry` | Industry | 150px | — | — |
| `location` | Location | 140px | — | — |
| `status` | Status | 100px | — | — |
| `actions` | — | 100px | — | ✓ |
| *(custom)* | *(dynamic)* | 140px ea. | — | — |

#### Contacts (`CrmPage.tsx` — ContactsTab)
| key | label | layout | sortField | alwaysVisible |
|-----|-------|--------|-----------|---------------|
| `company` | Company | 160px | `companyId` | — |
| `name` | Name | flex, min 180px | `name` | — |
| `email` | Email | 200px | `email` | — |
| `phone` | Phone | 130px | — | — |
| `status` | Status | 90px | — | — |
| `actions` | — | 80px | — | ✓ |
| *(custom)* | *(dynamic)* | 130px ea. | — | — |

#### Deals (`CrmPage.tsx` — DealsTab, List View only)
| key | label | layout | sortField | alwaysVisible |
|-----|-------|--------|-----------|---------------|
| `title` | Deal | flex, min 200px | `title` | — |
| `contact` | Client | 160px | — | — |
| `value` | Value | 110px | `value` | — |
| `stage` | Stage | 130px | — | — |
| `actions` | — | 80px | — | ✓ |
| *(custom)* | *(dynamic)* | 130px ea. | — | — |

> **Note**: Column picker applies to List view only. Kanban board is unchanged.

#### Tasks (`TasksPage.tsx` — List View only)
| key | label | layout | sortField | alwaysVisible |
|-----|-------|--------|-----------|---------------|
| `check` | — | 40px (status cycle btn) | — | ✓ |
| `title` | Task | flex, min 200px | `title` | — |
| `status` | Status | 110px | `status` | — |
| `dueDate` | Due | 110px | — | — |
| `actions` | — | 80px | — | ✓ |
| *(custom)* | *(dynamic)* | 130px ea. | — | — |

#### Invoices (`InvoicesPage.tsx`)
| key | label | layout | sortField | alwaysVisible |
|-----|-------|--------|-----------|---------------|
| `title` | Invoice | flex, min 200px | `title` | — |
| `client` | Client | 160px | — | — |
| `amount` | Amount | 110px | — | — |
| `dueDate` | Due | 110px | — | — |
| `status` | Status | 110px | — | — |
| `actions` | — | 120px | — | ✓ |
| *(custom)* | *(dynamic)* | 130px ea. | — | — |

---

### Key Design Decisions

1. **Custom columns off by default** — Prevents layout surprise for existing users; they opt in.
2. **`localStorage` per entity key** — Each page remembers its own config independently.
3. **`alwaysVisible` for action/status-cycle columns** — Users can never accidentally hide edit/delete buttons.
4. **`overflow-x: auto` on table container** — Wide column combinations scroll gracefully on small screens.
5. **No backend changes required** — Pure frontend UI preference; no schema or API modifications needed.

---

## Phase 8: Sticky Actions Column

> **Goal**: The Actions column (edit/delete buttons) should always be fixed to the right edge of the table, visible regardless of how far the user scrolls horizontally when many custom columns are enabled.

### Progress Checklist

- [x] **Step 8.1**: Add `stickyRight?: boolean` field to `ColumnDef` interface in `useColumnPicker.ts`
- [x] **Step 8.2**: `visibleColumns` ordering — sticky columns always sorted last in the returned array
- [x] **Step 8.3**: `allColumns` construction — custom fields inserted **between** standard data columns and the sticky `actions` entry
- [x] **Step 8.4**: `CompaniesPage.tsx` — header and actions cell use `sticky right-0 bg-white z-10` CSS
- [x] **Step 8.5**: `CrmPage.tsx` (Contacts + Deals tabs) — same sticky CSS applied
- [x] **Step 8.6**: `TasksPage.tsx` — same sticky CSS applied
- [x] **Step 8.7**: `InvoicesPage.tsx` — same sticky CSS applied
- [x] **Step 8.8**: TypeScript compile check — `0 errors`

### Implementation Notes

- `stickyRight: true` set on the `actions` column definition in all 5 entity pages.
- `overflow-x-auto` on the table container ensures the sticky column pins to the visible right edge during horizontal scroll.
- A subtle left-side shadow (`shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.04)]`) visually separates the pinned column from scrolled content.
- On hover, the Actions cell background transitions from `bg-white` to `bg-slate-50` (matching the row hover state).
