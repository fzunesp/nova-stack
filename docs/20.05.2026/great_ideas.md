# Nova Stack — Great Ideas & Next-Gen Features
*Created: 20 May 2026 — Proposals for resolving small business pain points with minimal complexity*

> This roadmap tracks proposed, planned, and completed enhancements. 
> Update this file as each item is developed, approved, and integrated.

---

## 📋 Feature Proposals

### 1. Kanban Board View for CRM Deals
*Goal: Provide a highly visual, drag-and-drop workflow pipeline for sales management.*
* **Description**:
  Currently, CRM deals are listed in a table. A visual Kanban Board splits deals into columns corresponding to their stages (`lead`, `contacted`, `quoted`, `won`, `lost`). Users can quickly drag-and-drop deals or click buttons to cycle them through stages.
* **Key Tasks**:
  - [x] Add a toggle button (List View / Board View) on the CRM Deals page.
  - [x] Render a columnar layout with 5 stage cards (`Lead`, `Contacted`, `Quoted`, `Won`, `Lost`).
  - [x] Implement stage transition mutations with drag-and-drop handlers (via `@hello-pangea/dnd`).
  - [x] Display card summary totals (deal count + total value per column header).
  - [x] Optimistic cache updates on drag to prevent UI flicker.
  - [x] Full Edit/Delete actions on Kanban cards (mini pencil/trash icons).

---

### 2. Canned Responses & Quick Templates
*Goal: Automate repetitive communications by storing quick snippets (emails, payment reminders, etc.).*
* **Description**:
  A centralized registry of message templates. Business owners and salespeople often write the same follow-ups or pitch messages. Storing them locally allows copying templates (e.g., "Invoice Overdue Reminder", "Introductory Pitch") to the clipboard with a single click.
* **Key Tasks**:
  - [ ] Create a `templates` or `canned_responses` collection in PocketBase.
  - [ ] Build a "Templates" tab in settings or a floating sidebar widget.
  - [ ] Add quick-copy buttons to copy text instantly to the clipboard.
  - [ ] Integrate a template selector directly into the "Send Invoice" dialogue.

---

### 3. Customer Interaction Log (Timeline Notes)
*Goal: Move from a single static notes field to a rich chronological feed of client interactions.*
* **Description**:
  Currently, contacts only have a single `notes` text field. A true timeline logs every client interaction ("Sent proposal", "Had call", "Met for coffee"). This adds a chronological log of notes under the contact detail sheet.
* **Key Tasks**:
  - [ ] Create an `interaction_logs` collection linked to contacts.
  - [ ] Replace or extend the contact detail notes pane with a message log input.
  - [ ] Render notes as a timeline showing who posted it, when it was posted, and its contents.
  - [ ] Add tags (e.g. `call`, `email`, `meeting`, `note`) for quick categorization.

---

### 4. Floating Command Center Scratchpad (Sticky Notes)
*Goal: Provide a quick, persistent notepad on the main dashboard for daily tasks and memos.*
* **Description**:
  A sticky-note widget placed directly on the Command Center (Dashboard) so users can write down immediate thoughts, reminders, or copy-paste text. The notepad autosaves dynamically to PocketBase so it is persisted across sessions and devices.
* **Key Tasks**:
  - [ ] Create a `user_settings` or `scratchpad` table to persist text per user.
  - [ ] Design a beautiful sticky note/notepad card component with clean typography.
  - [ ] Wire up debounced auto-saving to prevent layout lag on keystrokes.
  - [ ] Add a "Clear Note" button.

---

## 📈 Roadmap Progress Tracker

| Feature | Category | Complexity | Priority | Status |
|:---|:---:|:---:|:---:|:---:|
| **Kanban Board View** | CRM & Sales | Medium | High | ✅ Complete |
| **Canned Responses** | Productivity | Low | Medium | ⚪ Proposed |
| **Customer Interaction Log** | CRM & CRM History | Medium | High | ⚪ Proposed |
| **Floating Scratchpad** | Dashboard | Low | Low | ⚪ Proposed |

*Overall Roadmap Completion: **25%** (1/4 features shipped)*
