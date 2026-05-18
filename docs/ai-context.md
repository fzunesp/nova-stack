# Nova Stack AI Context

## Overview

Nova Stack is a lightweight operations platform designed for non-technical small businesses.

The system combines:

- CRM
- Tasks
- Revenue tracking
- Intake workflows
- Assignment
- Approvals
- HR-style operational requests

Primary philosophy:

- Fast
- Simple
- Operational
- Minimal configuration
- Avoid enterprise bloat

---

# Tech Stack

## Frontend / Backend

- Next.js App Router
- TypeScript
- React Server Components
- TailwindCSS

## Database

- PocketBase (SQLite, single binary)
- JS migrations in pocketbase/pb_migrations/
- JS hooks in pocketbase/pb_hooks/

## Infrastructure

- Docker Compose
- Mailpit for development email testing

## Development Workflow

Architecture and planning:
- ChatGPT

Implementation:
- DeepSeek / Qwen / other coding models

---

# Core Modules

## CRM

### Contacts
Stores customer/client information.

### Deals
Pipeline opportunities linked to contacts.

### Tasks
Operational tasks tied to contacts or deals.

---

## Revenue System

### Invoices

Invoices are normally generated from Deals.

Invoice lifecycle:

draft → sent → paid

draft/sent → cancelled

Rules:
- paid = terminal state
- cancelled = terminal state

Dashboard metrics:
- Revenue = paid invoices only
- Outstanding = draft + sent

---

# Intake System

Purpose:
Generalized intake workflow engine.

Supports:
- HR requests
- reimbursement requests
- hardware requests
- operational forms
- future automation

Architecture:
- dynamic JSON payload support
- assignment support
- approval support

Each intake has:
- human-readable reference ID
- example:
  INT-0001

---

# Dashboard Architecture

Dashboard has been separated into focused sections.

## Current Sections

### Today
Immediate actionable work.

### Radar
Urgent / Attention / Opportunity operational signals.

### KPIs
Business metrics:
- revenue
- outstanding
- active deals
- conversion rate
- tasks

### Activity
Recent operational events.

---

# UX Principles

Critical product philosophy:

- Built for non-technical users
- Minimal onboarding friction
- Progressive complexity
- Avoid enterprise-style overload
- High visibility of actionable information

System should feel:
- fast
- calm
- operational
- intelligent

---

# Architecture Rules

## Business Logic

All business logic belongs in:
- services
- server actions

Never inside UI components.

---

## UI Philosophy

- lightweight
- responsive
- contextual actions
- minimal modal overload

---

## Database Philosophy

- strong relational consistency
- scalable foundation
- Docker-first deployment

---

# Current Priorities

1. PostgreSQL migration
2. Global Search
3. Command Palette
4. Notifications
5. Smart Suggestions
6. Intake templates
7. HR workflows

---

# Planned HR Direction

Nova Stack is NOT intended to become a massive HR suite.

Goal:
Operational HR workflows.

Examples:
- vacation requests
- reimbursement requests
- hardware requests
- approvals
- assignment workflows

Simple and operational.

---

# Deployment Philosophy

Target deployment:
- Docker Compose
- Simple VPS hosting
- Minimal technical setup for clients

Users should never manage:
- databases
- migrations
- infrastructure manually

Everything should feel:
- turnkey
- operational
- low friction

---

# Important Product Identity

Nova Stack is evolving into:

"A lightweight operations platform"

NOT:
- just a CRM
- just HR software
- just task management

The core idea:
Centralize operational workflows into one clean system.