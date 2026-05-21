# Session Summary — 20 May 2026
*Session Overview, Key Decisions, and Planning*

---

## 1. Work Accomplished Today
* **Form Schema Audit**: Inspected `DynamicFormRenderer.tsx` and `HrPage.tsx` to understand the data validation flow and state transition architecture.
* **Code Review & Architectural Critique**: Performed a line-by-line review of the active codebase. Identified:
  * An unused/dead OOP service layer (`web/src/services/`).
  * Backend security gaps (unprotected self-registration and role escalation vulnerabilities on the `users` collection API).
  * Scalability bottlenecks (large database dumps via `getFullList()` inside dashboard components).
  * Concurrency issues (client-side generated sequence IDs resulting in duplicate requests/app crashes).
  * Concurrency risks in backend hooks (recursive hook triggers inside post-save triggers).
* **Delivered Honest Strategic Review**: Saved to `docs/20.05.2026/brutal_honest_review.md`.
* **Product & Pricing Strategy Feedback**: Discussed pricing evaluations (software licenses vs. turnkey consultative setups), target audience considerations, and how to scale a self-hosted business suite successfully.

---

## 2. Key Decisions Made
* **Path 2 Selected (Codebase Simplification)**: We will simplify the database query architecture by removing the unused OOP service layer (`web/src/services/`) and utilizing direct PocketBase SDK calls within pages and React-Query hooks.
* **Stick with the Official SDK**: We will continue using the official PocketBase JavaScript SDK (rather than writing custom manual REST calls) to leverage its automatic authentication, session synchronization, file upload handling, and SSE subscription managers.
* **Target Pricing Model**: Discussed market positioning at a $1,500 target price point, highlighting the need to shift from selling raw code files to selling a bundled "turnkey implementation service" (migration, n8n setup, hosting).

---

## 3. Tomorrow's Plan (Next Steps)
1. **Clean up Unused Services**: Delete the legacy/dead files in `web/src/services/` to eliminate technical debt and reduce bundle overhead.
2. **Secure User Collection API Rules**: Write a migration to block public self-registration/role-escalation on the PocketBase backend.
3. **Hardening Database Routines**:
   * Migrate the client-side sequence ID generation to a server-side `onModelBeforeCreate` JSVM hook to prevent duplicates.
   * Restructure `task_on_update.pb.js` writes to avoid recursive trigger cycles.
4. **Optimizing Dashboard Aggregation**: Replace heavy client-side `getFullList()` fetches with paginated queries or a custom backend statistics endpoint.
