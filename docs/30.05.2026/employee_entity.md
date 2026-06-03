# NovaStack Employee Entity Architecture Plan

This document details the transition from a **User-centric** model to an **Employee-centric** model. This separation allows the application to track all workforce members, regardless of whether they have application login credentials.

## 1. Database Schema Changes (PocketBase)

We will create a new `employees` collection and migrate existing HR/Task/Deal relations.

### **Phase 1: Collection Creation**
- [x] **Task 1.1**: Create `employees` collection. ✅
- [x] **Task 1.3**: Set up API Rules & Security (including `employee_private`). ✅
- [x] **Task 1.2**: Create a migration to backfill `employees` for all existing `users`. ✅

### **Phase 2: Relational Updates**
- [x] **Task 2.1**: Update `intake_submissions` collection. ✅
- [x] **Task 2.2**: Update `tasks` collection. ✅
- [x] **Task 2.3**: Update `deals` collection. ✅

---

## 2. UI Layer Changes (React/Refine)

The UI will shift to using the `Employee` record as the primary identity for business logic, maintaining strict parity with NovaStack's advanced UI patterns.

### **Phase 3: Navigation & Routing**
- [x] **Task 3.1**: Create a new top-level Sidebar item: **Requests** (Icon: `Inbox` or `ClipboardList`). ✅
- [x] **Task 3.2**: Move existing HR operational features to the **Requests** section. ✅
- [x] **Task 3.3**: Redefine the **HR** Sidebar item as the **Employee Directory**. ✅
- [x] **Task 3.4**: Create `useEmployee` hook for global identity bridging (User -> Employee). ✅

### **Phase 4: Page Adaptations & UI Patterns**
- [x] **Task 4.1**: Create **Employee Directory** page (`/hr`). ✅
- [x] **Task 4.2**: Update **Requests Page** (`RequestsPage.tsx`). ✅
- [x] **Task 4.3**: Update **CRM & Tasks**. ✅

### **Phase 5: Profile & Privacy**
- [x] **Task 5.1**: Split Profile UI. ✅
- [x] **Task 5.2**: Implement **Restricted Data Tabbing**. ✅

---

## 3. Implementation Status

| Component | Status | Priority |
| :--- | :---: | :--- |
| **Backend: `employees` collection** | ✅ | Critical |
| **Backend: Data Migration** | ✅ | High |
| **Frontend: `useEmployee` hook** | ✅ | High |
| **Frontend: Employee Directory** | ✅ | Medium |
| **Frontend: HR Module Update** | ✅ | Medium |
| **Frontend: CRM/Task Mapping** | ✅ | Low |

*Legend: ⚪ Todo | 🔵 In Progress | ✅ Completed*
