# Implementation Plan: Customizable Grid Fields with Reordering and Mapping

This document details the plan to implement a column customization and reordering system across all entity grids (Companies, Contacts, Deals, Tasks, Invoices, Products, and Employees) in NovaStack CRM.

## Core Objectives
1. **Column Visibility & Persistent Order:** Allow users to choose which columns are visible and reorder them. Persistent state will be stored in `localStorage` for each table.
2. **Locked Actions Column:** The final "Actions" column (and optional start columns like expand/checkbox) must remain pinned in their respective positions. Specifically, the "Actions" column must always remain the last column, with its sticky-right functionality preserved exactly.
3. **No Database Technical Names:** Replace raw collection keys/fields in the selection menu with human-readable, user-friendly labels.
4. **Consistency:** Apply this behavior uniformly across all pages that display grids.

---

## 1. Grid Definition & Human-Readable Mapping

We will map ALL standard technical field keys from the database collections to friendly display names. Only a curated set of columns will be visible by default (`defaultHidden: false`), while all other fields will be hidden by default but available for users to enable and reorder.

| Entity Grid | Technical Field Key | Human-Readable Label | Default Status |
| :--- | :--- | :--- | :--- |
| **Companies** | `name` <br> `industry` <br> `website` <br> `phone` <br> `location` <br> `address` <br> `city` <br> `country` <br> `notes` <br> `status` <br> `created` <br> `updated` | Company Name <br> Industry <br> Website <br> Phone Number <br> Location <br> Address <br> City <br> Country <br> Notes <br> Status <br> Created At <br> Updated At | Visible <br> Visible <br> Hidden <br> Hidden <br> Visible <br> Hidden <br> Hidden <br> Hidden <br> Hidden <br> Visible <br> Hidden <br> Hidden |
| **Contacts** | `company` <br> `name` <br> `email` <br> `phone` <br> `title` <br> `notes` <br> `status` <br> `created` <br> `updated` | Company <br> Contact Name <br> Email Address <br> Phone Number <br> Job Title <br> Notes <br> Status <br> Created At <br> Updated At | Visible <br> Visible <br> Visible <br> Hidden <br> Hidden <br> Hidden <br> Hidden <br> Hidden <br> Hidden |
| **Deals** | `title` <br> `company` <br> `contact` <br> `owner` <br> `value` <br> `stage` <br> `expectedCloseDate` <br> `notes` <br> `status` <br> `created` <br> `updated` | Deal Title <br> Company <br> Client Contact <br> Assigned Owner <br> Deal Value <br> Deal Stage <br> Expected Close Date <br> Notes <br> Status <br> Created At <br> Updated At | Visible <br> Hidden <br> Visible <br> Visible <br> Visible <br> Visible <br> Hidden <br> Hidden <br> Hidden <br> Hidden <br> Hidden |
| **Tasks** | `task` <br> `assignee` <br> `status` <br> `priority` <br> `due` <br> `description` <br> `company` <br> `contact` <br> `deal` <br> `created` <br> `updated` | Task Name <br> Assigned To <br> Status <br> Priority <br> Due Date <br> Description <br> Company <br> Contact <br> Deal <br> Created At <br> Updated At | Visible <br> Visible <br> Visible <br> Hidden <br> Visible <br> Hidden <br> Hidden <br> Hidden <br> Hidden <br> Hidden <br> Hidden |
| **Invoices** | `title` <br> `invoiceNumber` <br> `amount` <br> `taxRate` <br> `status` <br> `dueDate` <br> `created` <br> `updated` | Invoice Title <br> Invoice Number <br> Total Amount <br> Tax Rate (%) <br> Status <br> Due Date <br> Created At <br> Updated At | Visible <br> Hidden <br> Visible <br> Hidden <br> Visible <br> Hidden <br> Hidden <br> Hidden |
| **Products** | `name` <br> `sku` <br> `price` <br> `status` <br> `description` <br> `created` <br> `updated` | Product Name <br> SKU / Item Code <br> Price <br> Status <br> Description <br> Created At <br> Updated At | Visible <br> Visible <br> Visible <br> Visible <br> Hidden <br> Hidden <br> Hidden |
| **Employees** | `name` <br> `employee_id` <br> `work_email` <br> `personal_email` <br> `phone` <br> `dob` <br> `job_title` <br> `department` <br> `rol_type` <br> `status` <br> `hire_date` <br> `created` <br> `updated` | Employee Name <br> Employee ID <br> Work Email <br> Personal Email <br> Phone Number <br> Date of Birth <br> Job Title <br> Department <br> Role Type <br> Status <br> Hire Date <br> Created At <br> Updated At | Visible <br> Visible <br> Hidden <br> Hidden <br> Hidden <br> Hidden <br> Visible <br> Visible <br> Hidden <br> Visible <br> Hidden <br> Hidden <br> Hidden |

---

## 2. Refactoring the Hook: `useColumnPicker.ts`

Currently, `useColumnPicker` only tracks a `Set` of visible column keys and returns columns in their original defined order. We will extend it to track:
- `visibleKeys: Set<string>`
- `orderedKeys: string[]` (storing the custom order of all configurable columns)

### Key Logic
- When initial state is loaded:
  - If a saved settings object exists in `localStorage`:
    - Merge old/new columns: Filter saved `orderedKeys` to keep only currently valid keys. Append any new fields (e.g. newly created custom fields) to the end of the order list.
  - If no settings exist:
    - Default order is the original order of configurable columns in `allColumns`.
- Exclude `alwaysVisible` and `stickyRight` columns (e.g. `expand`, `checkbox`, `actions`) from the reordering options to keep them pinned.
- Expose methods:
  - `moveColumn(key: string, direction: 'up' | 'down')`: Moves a column key in the custom ordering list.
  - `resetColumns()`: Resets visibility and order to defaults.
- Return `visibleColumns` ordered according to the persistent custom order.

---

## 3. UI Update: `ColumnPicker.tsx`

We will update the `ColumnPicker` dropdown to display a premium and user-friendly interface:
- A list of configurable columns (standard and custom).
- Toggle checkbox/icon for visibility.
- Up / Down arrow buttons or drag-and-drop handles next to each item to reorder columns.
- The "Actions" column will not be present in this menu (since it is immutable and always visible).

---

## 4. Integration Verification

We will verify each grid module to ensure:
- The updated hook is correctly instantiated.
- Grids compile and render the headers and cells in the dynamically sorted order.
- Pinned columns (`expand`, `checkbox` at start, `actions` at the end) remain in their correct layout position and retain all original event handlers and style properties.

---

## 5. Implementation Status: Completed

All objectives of the customizable grid columns rollout have been successfully completed:
1. **Refactored useColumnPicker:** Upgraded to support persistent custom column order in local storage (`orderedConfigurableColumns`, `moveColumn`, `resetColumns`).
2. **Standardized ColumnPicker UI:** Added Reordering (Up/Down controls) and reset capabilities.
3. **Consolidated Grid Components:** Migrated all remaining pages (`ProductsPage`, `TasksPage`, `InvoicesPage`, `EmployeesPage`, and `CrmPage` for Contacts & Deals) to use the new hook.
4. **Dynamic Rendering & Fallbacks:** Ensured cells render seamlessly according to the custom-ordered columns, mapping both standard properties and custom fields dynamically.
5. **Verified Build Integrity:** Successfully compiled and built the frontend web app with no TypeScript errors.
