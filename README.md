# Nova Stack

Nova Stack is a self-hosted, single-tenant business operating system for small and medium businesses who want to own their software, keep their data private, and pay once — not forever.

Built on **Vite + React**, **PocketBase** (embedded SQLite), and deployed via **Docker Compose**.

Features real-time CRM, HR operations, invoicing, and customizable sticky notes.

---

## Features

- **Companies** — Account-centric hub. All contacts, deals, invoices, and tasks link up to a company.
- **CRM** — Contacts with full profile timelines, deal pipeline (lead → won/lost), unified activity history per contact.
- **Tasks** — Assignable tasks with priority, due dates, and status tracking.
- **Invoices** — Full invoice lifecycle with line items, product catalog integration, and outstanding/paid summaries.
- **Products** — Product catalog that feeds directly into invoice line items.
- **Intake** — Internal/external submission intake with approval workflows (general, vacation, reimbursement, hardware).
- **Dashboard** — Command Center: KPIs, Work Queue, Radar signals, Money at Risk, Activity Feed.
- **Global Search** — CTRL+K to search across all 7 collections instantly.
- **Themes** — 4 accent color schemes (Indigo, Violet, Emerald, Orange), persisted per user.

---

## Quick Start

### Option 1: Docker (Recommended)

```bash
docker compose up
```

Then open:
- **App:** [http://localhost:5173](http://localhost:5173)
- **PocketBase Admin:** [http://localhost:8090/_/](http://localhost:8090/_/)

On first run, go to the PocketBase Admin UI to create your first admin user, then log in to the app.

**Stopping:**
```bash
docker compose down
```

**Reset everything (fresh start):**
```bash
docker compose down -v
docker compose up
```

---

### Option 2: Run Locally (Development)

**Prerequisites:** Node.js 18+, a PocketBase binary.

**1. Start PocketBase**
```bash
cd pocketbase
./pocketbase serve
```
PocketBase runs on `http://localhost:8090`. Migrations run automatically on startup.

**2. Install and start the web app**
```bash
cd web
npm install
npm run dev
```
App runs on [http://localhost:5173](http://localhost:5173).

**3. Create your first user**

Go to [http://localhost:8090/_/](http://localhost:8090/_/) → Collections → `users` → New record.
Set `role` to `admin`.

Then log in at [http://localhost:5173/login](http://localhost:5173/login).

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Vite + React (SPA) + TypeScript |
| UI | TailwindCSS + shadcn/ui |
| Backend / Database | PocketBase (embedded SQLite) |
| Auth | PocketBase built-in auth |
| Deployment | Docker Compose |

---

## Project Structure

```
nova-stack/
├── web/                  # React SPA (Vite)
│   └── src/
│       ├── pages/        # One file per route
│       ├── components/   # Shared UI components
│       ├── hooks/        # useAuth, usePaginatedQuery, useGlobalSearch, etc.
│       ├── services/     # BaseService + 7 entity services
│       └── lib/          # PocketBase client
├── pocketbase/
│   ├── pb_migrations/    # Auto-applied schema migrations (45+)
│   └── pocketbase        # Binary (not committed — download separately)
└── docker-compose.yml
```

---

## Roles

| Role | Access |
|---|---|
| `admin` | Full access — all modules, Settings > Users tab |
| `hr` | Access to Intake module + HR-gated dashboard panels |
| `user` | Standard access — CRM, Tasks, Invoices, Dashboard |

Roles are assigned in PocketBase Admin or via Settings > Users (admin only).

---

## Upgrading

```bash
docker compose pull
docker compose up
```

PocketBase migrations apply automatically on container startup. No manual steps required.

---

## Environment Variables

Set in `docker-compose.yml` or a `.env` file in the project root:

| Variable | Default | Description |
|---|---|---|
| `VITE_PB_URL` | `http://localhost:8090` | PocketBase server URL |

---

## Philosophy

> Own your software. Pay once. Keep forever.

Nova Stack is built for businesses who are tired of SaaS subscriptions, vendor lock-in, and their data being held hostage. It runs on your server, your intranet, or your laptop. Your data never leaves your infrastructure.
