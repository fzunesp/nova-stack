# NovaStack Employee Entity Architecture Plan

This document details the transition from a **User-centric** model to an **Employee-centric** model. This separation allows the application to track all workforce members, regardless of whether they have application login credentials.

## 1. Database Schema Changes (PocketBase)

We will create a new `employees` collection and migrate existing HR/Task/Deal relations.

### **Phase 1: Collection Creation**
- [ ] **Task 1.1**: Create `employees` collection with the following fields:
    - `name` (text, required)
    - `employee_id` (text, unique, e.g. "EMP-001")
    - `work_email` (email, unique)
    - `personal_email` (email)
    - `phone` (text)
    - `dob` (date)
    - `job_title` (text)
    - `department` (select: HR, Sales, Engineering, Admin, Operations)
    - `rol_type` (select: employee, manager, contractor, executive)
    - `status` (select: active, onboarding, terminated, on_leave)
    - `hire_date` (date)
    - `salary_info` (json, protected - e.g., base, currency, frequency)
    - `emergency_contact` (json - name, phone, relation)
    - `userId` (relation, 1-to-1, users, optional)
    - `managerId` (relation, self-reference, employees, optional)
    - `customFields` (json)
- [ ] **Task 1.2**: Create a migration to backfill `employees` for all existing `users`.
- [ ] **Task 1.3**: Set up API Rules & Security:
    - **General Profile**: List/View: `@request.auth.id != ""` (public directory).
    - **Strict Privacy (Salary)**: To ensure **only** the Employee and their Manager can view salary (Admins EXCLUDED):
        - *Mandatory*: Create a separate `employee_private` collection linked 1-to-1 with `employees`.
        - *API Rule (List/View)*: `employeeId = @request.auth.employeeId || employeeId.managerId = @request.auth.employeeId`
        - *Fields*: `salary_info`, `bank_details`, `tax_id`.
        - *Note*: Even the `admin` role will be blocked by this rule unless they are the direct manager.

### **Phase 2: Relational Updates**
- [ ] **Task 2.1**: Update `intake_submissions` collection:
    - Add `employeeId` (relation, employees)
    - *Migration*: Map existing `userId` to the new `employeeId` via the user-employee link.
- [ ] **Task 2.2**: Update `tasks` collection:
    - Add `assigneeId` (relation, employees)
    - *Migration*: Map existing `userId` to new `assigneeId`.
- [ ] **Task 2.3**: Update `deals` collection:
    - Add `ownerId` (relation, employees)
    - *Migration*: Map existing `userId` to new `ownerId`.

---

## 2. UI Layer Changes (React/Refine)

The UI will shift to using the `Employee` record as the primary identity for business logic.

### **Phase 3: Core Infrastructure**
- [ ] **Task 3.1**: Create `useEmployee` hook:
    - Automatically fetches the `Employee` record associated with the logged-in `userId`.
    - Provides global access to `employee.id` and `employee.department`.
- [ ] **Task 3.2**: Update `AppProviders.tsx`:
    - Ensure Employee data is loaded into a Context for fast access across components.

### **Phase 4: Page Adaptations**
- [ ] **Task 4.1**: Create **Employee Directory** page (`/hr/employees`):
    - Full CRUD for employees (Admin/HR only).
    - Implement the "Sticky Actions" and "Scrollable Form" patterns.
    - Add UI to link/unlink a `User` account to an `Employee`.
- [ ] **Task 4.2**: Update **HR Page** (`HrPage.tsx`):
    - "My Requests" now filters by `employeeId` instead of `userId`.
    - "New Request" form allows HR/Admin to select an `Employee` to submit on behalf of.
- [ ] **Task 4.3**: Update **CRM & Tasks**:
    - Change assignee dropdowns to list `Employees` instead of `Users`.
    - Show Employee names/avatars in list views.

### **Phase 5: User Profile vs Employee Profile**
- [ ] **Task 5.1**: Split the Settings/Profile UI:
    - **Account Settings**: Passwords, 2FA, Email.
    - **Work Profile**: Job title, Department, Manager, Hire date (viewed via HR module).

---

## 3. Implementation Status

| Component | Status | Priority |
| :--- | :---: | :--- |
| **Backend: `employees` collection** | ⚪ | Critical |
| **Backend: Data Migration** | ⚪ | High |
| **Frontend: `useEmployee` hook** | ⚪ | High |
| **Frontend: Employee Directory** | ⚪ | Medium |
| **Frontend: HR Module Update** | ⚪ | Medium |
| **Frontend: CRM/Task Mapping** | ⚪ | Low |

*Legend: ⚪ Todo | 🔵 In Progress | ✅ Completed*
