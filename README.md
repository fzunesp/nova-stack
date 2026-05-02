# Nova Stack

Nova Stack is a single-tenant, self-hosted modular business operating system. Built on Next.js, SQLite, and Prisma, it provides a fast, localized platform for managing essential business operations without the overhead of complex, multi-tenant cloud architectures.

## Features

- **CRM (Customer Relationship Management)**: Manage contacts, organizations, and track sales opportunities with a customizable deal pipeline.
- **Tasks**: Create, manage, and track tasks with a simple Kanban board or list view, complete with status tracking.
- **Invoices**: Generate, track, and manage invoices natively within the platform, linking them directly to deals and contacts.

## Installation

Nova Stack is designed to be easily runnable locally. Follow these steps to get started:

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Copy `.env.example` to `.env`. The defaults are configured for immediate local use.
   ```bash
   cp .env.example .env
   ```

3. **Initialize Database**
   Run the database migrations to set up the SQLite schema:
   ```bash
   npx prisma migrate dev
   ```

4. **Seed Database** (Optional)
   Populate the database with sample data (contacts, deals, tasks, invoices):
   ```bash
   npm run seed
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser.

### Option 2: Run with Docker (Recommended)

1. Build and start the containers:
   ```bash
   docker compose up --build
   ```
2. Run database migrations (only needed on first run):
   ```bash
   docker compose exec app npx prisma db push
   ```
3. Open the application: [http://localhost:3000](http://localhost:3000)
4. Login using: `admin@nova-stack.local`

**Included Services:**
- App runs on port 3000
- Mailpit UI (Email Testing) runs on: [http://localhost:8025](http://localhost:8025)

**Seeding the Database (Docker):**
```bash
docker compose exec app npm run seed
```

## Default Login Instructions

When running in development mode (`NODE_ENV=development`), the application automatically bypasses strict authentication and logs you in as the default admin user. 

If you have seeded the database, the active profile belongs to:
- **Email:** `admin@nova-stack.local`
- **Role:** Admin User

*Note: True authentication is required for production deployment.*

## Database Management

### Reset Database
If you need to wipe all data and start fresh, run:
```bash
npx prisma migrate reset
```
This command will drop the database, re-run all migrations, and optionally prompt you to seed the database again.

### Re-seed Database
You can re-run the seed script at any time to populate new mock data:
```bash
npm run seed
```

## Email Setup (Development)

Nova Stack is configured to use [MailHog](https://github.com/mailhog/MailHog) or [Mailpit](https://github.com/axllent/mailpit) for local email testing. This ensures emails are captured locally and never accidentally sent to real addresses.

### How to Run Locally

Using Docker (recommended for Mailpit):
```bash
docker run -d --name mailpit -p 1025:1025 -p 8025:8025 axllent/mailpit
```

### Configuration
Ensure your `.env` has the following variables set (these are the defaults):
- `EMAIL_HOST=localhost`
- `EMAIL_PORT=1025`

### Viewing Emails
Once Mailpit is running, you can view captured emails via its web interface at:
**[http://localhost:8025](http://localhost:8025)**

## Environment Variables
The application uses fallback values for missing environment variables during development to prevent crashes. However, it is highly recommended to maintain an accurate `.env` file for stability. See `.env.example` for all configurable variables.
