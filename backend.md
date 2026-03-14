# CoreInventory - Backend Implementation Plan

## Overview
CoreInventory is a modular Inventory Management System (IMS) designed to digitize and track all stock-related operations across warehouses. This backend coordinates closely with the frontend dashboard and provides robust APIs for product management, stock ledger tracking, and operational flows (Receipts, Deliveries, Transfers, and Adjustments).

## Project Type
**BACKEND**

## Proposed Tech Stack
- **Database:** Supabase (PostgreSQL) - Enables relational integrity, robust querying, and Row Level Security for multi-role environments.
- **Authentication:** Supabase Auth (Supports OTP-based password resets inherently).
- **Backend Framework:** Python (FastAPI) - For high performance async APIs.
- **API Style:** RESTful JSON APIs.
- **Validation:** Pydantic (Python) to ensure safe stock input at the system boundaries.

## Core Database Models (Conceptual Schema)
Given the need to track stock accurately, we will use a **Stock Ledger** pattern rather than simply storing static integer counts. This ensures complete auditability.

### 1. `roles`
- `id` (UUID, Primary Key)
- `name` (String, Unique) - e.g., 'manager', 'staff'

### 2. `users`
- `id` (UUID, Primary Key, references Supabase auth.users)
- `email` (String, Unique)
- `role_id` (UUID, Foreign Key -> `roles.id`)
- `created_at` (Timestamp)

### 3. `locations` (Warehouses, Racks)
- `id` (UUID, Primary Key)
- `name` (String) - e.g., 'Main Store', 'Production Rack'
- `type` (String) - e.g., 'warehouse', 'rack', 'virtual_customer', 'virtual_vendor'
- `parent_id` (UUID, Foreign Key -> `locations.id`, nullable)
- `created_at` (Timestamp)

### 4. `product_categories`
- `id` (UUID, Primary Key)
- `name` (String)
- `created_at` (Timestamp)

### 5. `products`
- `id` (UUID, Primary Key)
- `name` (String)
- `sku` (String, Unique)
- `category_id` (UUID, Foreign Key -> `product_categories.id`)
- `unit_of_measure` (String) - e.g., 'kg', 'units'
- `reorder_point` (Integer, default 0) - For low stock alerts
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

### 6. `stock_balances` (Current Stock Snapshot)
- `id` (UUID, Primary Key)
- `product_id` (UUID, Foreign Key -> `products.id`)
- `location_id` (UUID, Foreign Key -> `locations.id`)
- `quantity` (Integer, default 0)
- `version` (Integer, default 1) - **Optimistic Locking:** Must correspond to the expected version when updated to prevent concurrent overwrites.
- `last_updated_at` (Timestamp)

### 7. `documents` (Transactions)
Master records grouping ledger entries (e.g., A specific User Receipt containing multiple products).
- `id` (UUID, Primary Key)
- `type` (String) - Enum: 'receipt', 'delivery', 'transfer', 'adjustment'
- `status` (String) - Enum: 'draft', 'waiting', 'ready', 'done', 'canceled'
- `reference_number` (String, Unique)
- `created_by` (UUID, Foreign Key -> `users.id`)
- `source_location_id` (UUID, Foreign Key -> `locations.id`, nullable)
- `destination_location_id` (UUID, Foreign Key -> `locations.id`, nullable)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

### 8. `stock_ledger_entries` (Immutable Transaction Logs)
A transaction table where every stock change is logged.
- `id` (UUID, Primary Key)
- `document_id` (UUID, Foreign Key -> `documents.id`)
- `product_id` (UUID, Foreign Key -> `products.id`)
- `location_id` (UUID, Foreign Key -> `locations.id`)
- `quantity_change` (Integer) - (+ for incoming to location, - for outgoing from location)
- `created_at` (Timestamp)
- `created_by` (UUID, Foreign Key -> `users.id`)

* **Cancellations**: If a document (like a Delivery) is cancelled after completion, the system automatically appends reverse `stock_ledger_entries` (e.g., + Delivery Reversion) to revert the stock, keeping the history truly immutable.

## Implementation Phases
**Phase 1: Foundation**
- Initialize Repo and Linter.
- Establish Supabase connection and raw database schema.

**Phase 2: Product & Location Setup**
- API to create, view, list products, categories, and warehouses.

**Phase 3: Stock Movement Operations**
- Implement Receipts (Incoming).
- Implement Deliveries (Outgoing).
- Implement Transfers (Location A to Location B).
- Implement Adjustments (Reconciliation).

**Phase 4: Dashboard Aggregations**
- APIs for KPIs calculating real-time aggregates from the stock ledger.

## Verification / Phase X
- Pass `security_scan.py` for vulnerability checks (if applicable).
- Adhere strictly to the clean-code and backend-specialist rules.
- Type check and lint successful using `ruff` / `mypy`.

---

## Project Scope Clarity
To ensure absolute clarity before we write code, here is what this backend WILL create, and what REMAINS for the frontend/other teams.

### What the Backend WILL Build (Implemented Here)
1. **PostgreSQL Database Schema (in Supabase)**: All tables, relations, and the immutable ledger structure.
2. **Python FastAPI Web Server**: Set up in the `backend/` folder.
3. **Core REST APIs**:
   - `POST /auth/login` (or direct Supabase auth depending on preference, though usually handled via Supabase client, we will provide the required hooks).
   - `GET /products`, `POST /products` (Product Management)
   - `POST /operations/receipts` (Increases stock)
   - `POST /operations/deliveries` (Decreases stock)
   - `POST /operations/transfers` (Moves stock)
   - `POST /operations/adjustments` (Fixes stock)
   - `POST /operations/{id}/cancel` (Auto-reverts ledger for cancellations)
   - `GET /dashboard/kpis` (Aggregates total stock, low stock, pending items)
4. **Concurrency & Safety**:
   - Implementation of Optimistic Locking (version tracking) on stock updates.
   - Pydantic validation for all incoming payloads.

### What Remains to be Done (By Frontend/Other Teams)
1. **UI Dashboard**: The visual rendering of KPIs, charts, and tables (React/Next/Vite).
2. **Client-Side Auth Flow**: The login screens, OTP input forms, and session token storage in the browser.
3. **Client-side routing & filters**: The dynamic filters (by document type, status) will be handled by passing query params to our backend APIs, but the UI dropdowns must be built by the frontend team.
4. **Left Sidebar Navigation**: The actual buttons and visual structure.

By the end of this task, you will have a fully functioning `backend/` directory with a runable FastAPI server that the frontend can connect to.

## ✅ PHASE X COMPLETE
- Lint: ✅ Pass (Ruff + Mypy Type Checking)
- Security: ✅ Pass (No Critical Vulnerabilities)
- Build: ✅ Success (Python .venv initialized)
- Date: 2026-03-14
