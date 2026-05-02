# Development Log: Day 1

**Date:** April 28, 2026  
**Project:** Nova Stack  

## 1. Overview
Initialized the core infrastructure for Nova Stack, a single-tenant, self-hosted modular business operating system. Established the fundamental Next.js App Router architecture and completed the initial CRM module foundation, including database models, data access layers, and UI components for managing Contacts and Deals.

## 2. Features Completed
- **Global Application Shell**: Implemented a persistent layout (`layout.tsx`) featuring a fixed left sidebar navigation and a sticky topbar.
- **CRM Module Foundation**: Established the `src/modules/crm` domain.
- **Contacts Management**:
  - Service layer for Contact CRUD operations.
  - Server Component landing page (`/crm`) with a responsive data table.
  - Empty state handling.
  - Interactive "Add Contact" form (`/crm/new`) powered by Next.js Server Actions with inline validation.
- **Deals Pipeline**:
  - Service layer for Deal CRUD operations.
  - Server Component deals listing (`/crm/deals`) showing deal stages, values, and linked contacts.
  - "Add Deal" flow (`/crm/deals/new`) supporting relational assignment to existing contacts.
- **Routing**: Set up automatic server-side redirection from the root (`/`) to the CRM dashboard (`/crm`).

## 3. Technical Stack
- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite
- **ORM**: Prisma 7 (using `@prisma/adapter-better-sqlite3`)

## 4. Folder Structure Overview
The repository follows a feature-driven modular architecture to ensure clear boundaries between different business domains.

```text
src/
├── app/
│   ├── (dashboard)/        # Authenticated application shell
│   │   ├── crm/            # CRM Routes (Contacts, Deals)
│   │   └── layout.tsx      # Global Sidebar/Topbar wrapper
│   └── page.tsx            # Root redirect logic
├── components/
│   ├── crm/                # UI components specific to CRM (Tables, Forms)
│   └── layout/             # Shared layout components (Sidebar, Topbar)
├── generated/
│   └── prisma/             # Explicitly defined Prisma client output directory
├── lib/
│   └── db.ts               # Prisma singleton client instantiation
└── modules/
    ├── crm/                # CRM Domain Logic (Services, Types)
    ├── hr/                 # Placeholder for HR domain
    ├── invoices/           # Placeholder for Invoices domain
    └── tasks/              # Placeholder for Tasks domain
```

## 5. Database Schema Summary
The SQLite database was initialized with the core CRM entities:

- **Contact**: Represents a person or entity.
  - Fields: `id`, `name` (required), `email`, `phone`, `companyName`, `notes`, `createdAt`.
- **Deal**: Represents a potential sales opportunity.
  - Fields: `id`, `title` (required), `value`, `stage` (default: "lead"), `expectedCloseDate`, `createdAt`.
  - Relations: Belongs to one `Contact` (`contactId`).

## 6. Key Architectural Decisions
- **Single-Tenant & Self-Hosted**: SQLite was chosen as the default database provider to optimize for localized, single-tenant self-hosting scenarios, keeping deployment simple and minimizing operational overhead.
- **Prisma 7 Adapter Pattern**: Configured Prisma with the `better-sqlite3` driver adapter to adhere to modern Prisma 7 conventions, guaranteeing stable edge/serverless compatibility.
- **Modular Monolith**: Code is strictly separated by domain in `src/modules/*` rather than grouping all services together. This ensures the codebase scales gracefully as new modules are introduced without tangling dependencies.
- **Server Actions over API Routes**: Form submissions utilize Next.js Server Actions directly, reducing the need for intermediate REST API layers and ensuring end-to-end type safety from the UI down to the database.

## 7. Known Next Steps
- Construct a high-level CRM Dashboard view (metrics, recent activity) at `/crm`.
- Implement a Kanban board view for Deals to allow visual pipeline management.
- Build "Edit" and "Delete" functionality for existing Contacts and Deals.
- Scaffold the foundation for the next planned module (e.g., Tasks).
