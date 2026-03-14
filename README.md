<p align="center">
  <img src="icon.svg" alt="Zenith Logo" width="80" />
</p>

<h1 align="center">Zenith — CoreInventory</h1>

<p align="center">
  <strong>A modular, real-time Inventory Management System built to replace manual registers with a centralized, auditable platform.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/python-3.13-blue?logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3ECF8E?logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-v4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
</p>

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [Development Workflow](#development-workflow)
- [Edge Cases & Design Decisions](#edge-cases--design-decisions)
- [Target Users](#target-users)
- [Roadmap](#roadmap)
- [License](#license)

---

## Overview

**Zenith CoreInventory** is a full-stack Inventory Management System (IMS) that digitizes and streamlines all stock-related operations within a business. It provides a centralized, real-time dashboard for tracking products, managing warehouse locations, and processing all inventory movements — receipts, deliveries, internal transfers, and stock adjustments — with a complete audit trail.

The system follows a **Stock Ledger** architecture where every inventory change is recorded as an immutable ledger entry, ensuring full traceability, auditability, and the ability to reverse any operation.

---

## Key Features

| Feature | Description |
|---|---|
| **Dashboard KPIs** | Real-time overview of total SKUs, total units, low-stock alerts, pending receipts, deliveries, and transfers |
| **Product Management** | Full CRUD for products with categories, SKUs, units of measure, and configurable reorder points |
| **Location Hierarchy** | Hierarchical location model (Warehouse → Rack) with support for virtual vendor/customer locations |
| **Stock Moves** | Unified move system handling Receipts, Deliveries, Transfers, and Adjustments through a single workflow |
| **Move Validation** | Two-step process: create a draft move, then validate it to atomically update stock levels |
| **Stock Level Tracking** | Real-time per-product-per-location stock levels, automatically updated upon move validation |
| **Supabase Auth** | Email/password authentication with sign-up, login, and session management via Supabase Auth |
| **Move History** | Searchable history of all stock movements with status tracking |
| **Optimistic Locking** | Concurrency-safe stock updates using SQLAlchemy's `version_id_col` on `StockBalance` |
| **Auto Revert (Cancellations)** | Cancelled documents automatically create reverse ledger entries to maintain accurate balances |
| **Interactive API Docs** | Auto-generated Swagger UI at `/docs` for all endpoints |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         Frontend (React 19)                      │
│  Vite · Tailwind CSS v4 · Recharts · Lucide · React Router v7   │
│                                                                  │
│  Auth Wall → Dashboard │ Products │ Locations │ Operations       │
└──────────────────────┬───────────────────────────────────────────┘
                       │ REST (fetch)
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Backend API (FastAPI)                          │
│  Python 3.13 · SQLAlchemy 2.0 (async) · Pydantic v2             │
│                                                                  │
│  /api/v1/auth      → Sign-up, Login (Supabase Auth)             │
│  /api/v1/dashboard → KPI aggregations                           │
│  /api/v1/products  → Product & Category CRUD                    │
│  /api/v1/locations → Location CRUD (hierarchical)               │
│  /api/v1/operations→ Stock Moves (create, validate, list)       │
│  /api/v1/stock     → Stock Level queries                        │
└──────────────────────┬───────────────────────────────────────────┘
                       │ asyncpg (Connection Pooler)
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│              Supabase (PostgreSQL + Auth)                        │
│                                                                  │
│  11 Tables · Row-Level Security · JWT Auth · Connection Pooler   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Backend

| Technology | Purpose |
|---|---|
| **Python 3.13** | Runtime |
| **FastAPI** | Async web framework with auto OpenAPI docs |
| **SQLAlchemy 2.0** | Async ORM with declarative models |
| **asyncpg** | High-performance async PostgreSQL driver |
| **Pydantic v2** | Request/response validation and serialization |
| **Supabase Python SDK** | Auth integration (sign-up, sign-in) |
| **Alembic** | Database migration management |
| **Ruff** | Linting and formatting |
| **Mypy** | Static type checking |
| **Pytest** | Testing framework |

### Frontend

| Technology | Purpose |
|---|---|
| **React 19** | UI library |
| **Vite 6** | Build tool and dev server |
| **TypeScript 5.7** | Type safety |
| **Tailwind CSS v4** | Utility-first styling (CSS-first config) |
| **React Router v7** | Client-side routing |
| **Recharts** | Dashboard charts and data visualization |
| **Lucide React** | Icon library |
| **Supabase JS** | Client-side auth & session management |

---

## Database Schema

The system uses **11 tables** organized into two model files:

### Core Domain (`domain.py`)

```
┌─────────────┐     ┌───────────┐     ┌────────────────────┐
│    roles     │◄────│   users   │     │  product_categories │
│─────────────│     │───────────│     │────────────────────│
│ id (PK)     │     │ id (PK)   │     │ id (PK)            │
│ name (UQ)   │     │ email (UQ)│     │ name (UQ)          │
└─────────────┘     │ role_id   │     │ created_at         │
                    │ created_at│     └────────┬───────────┘
                    └───────────┘              │
                                               ▼
┌─────────────┐     ┌───────────────┐     ┌──────────────┐
│  locations   │◄────│    documents   │     │   products    │
│─────────────│     │───────────────│     │──────────────│
│ id (PK)     │     │ id (PK)       │     │ id (PK)      │
│ name        │     │ type (enum)   │     │ name         │
│ type (enum) │     │ status (enum) │     │ sku (UQ)     │
│ parent_id   │     │ reference_num │     │ category_id  │
│ created_at  │     │ created_by    │     │ unit_of_measure │
└──────┬──────┘     │ source_loc    │     │ reorder_point│
       │            │ dest_loc      │     │ created_at   │
       │            │ created_at    │     │ updated_at   │
       │            │ updated_at    │     └──────────────┘
       │            └───────┬───────┘
       │                    │
       ▼                    ▼
┌───────────────┐  ┌────────────────────────┐
│ stock_balances │  │  stock_ledger_entries   │
│───────────────│  │────────────────────────│
│ id (PK)       │  │ id (PK)                │
│ product_id    │  │ document_id            │
│ location_id   │  │ product_id             │
│ quantity      │  │ location_id            │
│ version (OL)  │  │ quantity_change (+/-)  │
│ last_updated  │  │ created_by             │
└───────────────┘  │ created_at             │
                   └────────────────────────┘
```

### Inventory Module (`inventory.py`)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   profiles    │     │  stock_moves  │     │ stock_levels  │
│──────────────│     │──────────────│     │──────────────│
│ id (PK)      │     │ id (PK)      │     │ product_id(PK)│
│ email (UQ)   │◄────│ created_by   │     │ location_id(PK)│
│ role         │     │ product_id   │     │ quantity      │
│ created_at   │     │ from_loc_id  │     │ last_updated  │
└──────────────┘     │ to_loc_id    │     └──────────────┘
                     │ quantity     │
                     │ type (enum)  │
                     │ status (enum)│
                     │ created_at   │
                     │ completed_at │
                     └──────────────┘
```

### Enums

| Enum | Values |
|---|---|
| `LocationType` | `warehouse`, `rack`, `production`, `vendor`, `customer`, `virtual_customer`, `virtual_vendor` |
| `StockMoveType` | `receipt`, `delivery`, `transfer`, `adjustment` |
| `StockMoveStatus` | `draft`, `pending`, `done`, `cancelled` |
| `DocumentType` | `receipt`, `delivery`, `transfer`, `adjustment` |
| `DocumentStatus` | `draft`, `waiting`, `ready`, `done`, `canceled` |

---

## API Reference

Base URL: `http://localhost:8001/api/v1`

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/signup` | Register a new user via Supabase Auth |
| `POST` | `/auth/login` | Sign in and receive JWT tokens |

### Dashboard

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/dashboard/kpis` | Aggregated KPIs (total SKUs, units, low stock, pending ops) |

### Products

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/products/categories` | List all product categories |
| `POST` | `/products/categories` | Create a new category |
| `GET` | `/products` | List all products |
| `POST` | `/products` | Create a new product |
| `PUT` | `/products/{id}` | Update a product |
| `DELETE` | `/products/{id}` | Delete a product |

### Locations

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/locations` | List all locations |
| `POST` | `/locations` | Create a new location |
| `PUT` | `/locations/{id}` | Update a location |
| `DELETE` | `/locations/{id}` | Delete a location |

### Operations (Stock Moves)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/operations/moves` | List all moves (filterable by `type` and `status`) |
| `POST` | `/operations/moves` | Create a stock move (any type) |
| `PUT` | `/operations/moves/{id}` | Update a move's status |
| `POST` | `/operations/moves/{id}/validate` | Validate & apply a move (updates stock levels) |
| `GET` | `/operations/receipts` | List receipt moves |
| `POST` | `/operations/receipts` | Create a receipt move |
| `GET` | `/operations/deliveries` | List delivery moves |
| `POST` | `/operations/deliveries` | Create a delivery move |
| `GET` | `/operations/transfers` | List transfer moves |
| `POST` | `/operations/transfers` | Create a transfer move |
| `GET` | `/operations/adjustments` | List adjustment moves |
| `POST` | `/operations/adjustments` | Create an adjustment move |

### Stock

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/stock/levels` | List all current stock levels (per product per location) |

### Health

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |

> 📘 **Full interactive docs** available at `http://localhost:8001/docs` when the backend is running.

---

## Project Structure

```
Zenith/
├── backend/                        # Python FastAPI Backend
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py             # Dependency injection (DB session)
│   │   │   └── routes/
│   │   │       ├── auth.py         # Sign-up / Login (Supabase)
│   │   │       ├── dashboard.py    # KPI aggregation queries
│   │   │       ├── locations.py    # Location CRUD
│   │   │       ├── operations.py   # Stock Moves (all types)
│   │   │       ├── products.py     # Product & Category CRUD
│   │   │       └── stock.py        # Stock level queries
│   │   ├── core/
│   │   │   ├── config.py           # Pydantic Settings (env vars)
│   │   │   ├── db.py               # SQLAlchemy async engine + session
│   │   │   └── supabase_client.py  # Supabase Python client
│   │   ├── models/
│   │   │   ├── base.py             # Declarative Base
│   │   │   ├── domain.py           # Core tables (User, Product, Location, Document, Ledger)
│   │   │   └── inventory.py        # Stock tables (StockMove, StockLevel, Profile)
│   │   ├── schemas/
│   │   │   ├── auth.py             # Auth request/response schemas
│   │   │   ├── locations.py        # Location schemas
│   │   │   ├── operations.py       # StockMove schemas
│   │   │   └── products.py         # Product & Category schemas
│   │   ├── services/
│   │   │   ├── auth.py             # User upsert logic
│   │   │   └── inventory.py        # Stock level management & move validation
│   │   └── main.py                 # FastAPI app entry point
│   ├── scripts/
│   │   └── init_db.py              # Table creation script
│   ├── testdata/
│   │   ├── generate_csv.py         # Realistic test data generator
│   │   └── populate_db.py          # CSV → Database loader
│   ├── .env.example                # Environment variable template
│   ├── pyproject.toml              # Ruff & Mypy config
│   └── requirements.txt            # Python dependencies
│
├── core-inventory-app/             # React + Vite Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth.tsx            # Login/Sign-up component
│   │   │   └── Layout/
│   │   │       ├── Sidebar.tsx     # Navigation sidebar
│   │   │       └── Topbar.tsx      # Top navigation bar
│   │   ├── lib/
│   │   │   ├── api.ts              # API client (fetch wrapper)
│   │   │   └── supabase.ts         # Supabase JS client initialization
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx       # KPI cards + charts
│   │   │   ├── Products.tsx        # Product management
│   │   │   ├── Locations.tsx       # Location management
│   │   │   └── Operations/
│   │   │       ├── Receipts.tsx    # Incoming stock
│   │   │       ├── Deliveries.tsx  # Outgoing stock
│   │   │       ├── Transfers.tsx   # Internal transfers
│   │   │       ├── Adjustments.tsx # Stock adjustments
│   │   │       └── History.tsx     # Move audit log
│   │   ├── App.tsx                 # Root component + routing
│   │   ├── main.tsx                # Entry point
│   │   └── index.css               # Global styles + design tokens
│   ├── .env.local                  # Frontend environment variables
│   └── package.json                # Node dependencies
│
├── .gitignore
└── README.md                       # ← You are here
```

---

## Getting Started

### Prerequisites

- **Python 3.13+**
- **Node.js 18+** and **npm**
- A **Supabase** project (free tier works) — [Create one here](https://supabase.com/dashboard)

### Backend Setup

```bash
# 1. Navigate to backend
cd backend

# 2. Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate        # macOS/Linux
# .venv\Scripts\activate          # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials (see Environment Variables below)

# 5. Initialize database tables
python scripts/init_db.py

# 6. (Optional) Seed with realistic test data
python testdata/generate_csv.py
python testdata/populate_db.py

# 7. Start the API server
fastapi run app/main.py --port 8001
```

The API is now live at **http://localhost:8001** with interactive docs at **http://localhost:8001/docs**.

### Frontend Setup

```bash
# 1. Navigate to frontend
cd core-inventory-app

# 2. Install dependencies
npm install

# 3. Configure environment
# Edit .env.local with your Supabase URL, anon key, and API URL

# 4. Start the dev server
npm run dev
```

The app is now live at **http://localhost:5173**.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | Supabase PostgreSQL **connection pooler** URL | `postgresql://postgres.xxxx:password@aws-0-region.pooler.supabase.com:6543/postgres` |
| `SUPABASE_URL` | Supabase project URL | `https://xxxx.supabase.co` |
| `SUPABASE_KEY` | Supabase anon/public API key | `eyJhbGci...` |

> ⚠️ **Important:** Use the **Connection Pooler** URL (port `6543`) from Supabase Dashboard → Settings → Database → Connection String → ✅ "Use connection pooling". The direct URL (port `5432`) uses IPv6 and may fail on networks without IPv6 support.

> ⚠️ **Special Characters:** If your database password contains `#`, `@`, or other special characters, URL-encode them (e.g., `#` → `%23`).

### Frontend (`core-inventory-app/.env.local`)

| Variable | Description | Example |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public API key | `eyJhbGci...` |
| `VITE_API_URL` | Backend API base URL | `http://localhost:8001/api/v1` |

---

## Development Workflow

### Running Both Servers

You need **two terminal windows** running simultaneously:

```bash
# Terminal 1 — Backend
cd backend && source .venv/bin/activate && fastapi run app/main.py --port 8001

# Terminal 2 — Frontend
cd core-inventory-app && npm run dev
```

### Code Quality (Backend)

```bash
# Linting
ruff check .

# Auto-fix
ruff check --fix .

# Type checking
mypy app/

# Run tests
pytest
```

### Stock Move Workflow

The inventory system follows a **two-step validation pattern**:

```
1. CREATE MOVE  →  Status: "draft"    (no stock changes yet)
2. VALIDATE     →  Status: "done"     (stock levels updated atomically)
```

This ensures that stock is never modified until an operator explicitly validates the operation.

---

## Edge Cases & Design Decisions

### Concurrency — Optimistic Locking

The `StockBalance` table includes a `version` column managed by SQLAlchemy's `version_id_col`. When two concurrent requests try to update the same stock record, the second request will fail with a conflict error (`409`) — preventing silent overwrites.

### Cancellations — Automatic Ledger Reversal

When a document is cancelled, the system automatically creates **reverse ledger entries** (negating the original `quantity_change`) to maintain an accurate audit trail. Stock balances are recalculated accordingly.

### Stock Adjustments

Adjustments use an **absolute quantity** approach: the operator specifies the counted quantity, and the system computes and records the difference as a ledger entry. This supports physical inventory counting workflows.

### Database URL Translation

The backend automatically detects `postgresql://` URLs and converts them to `postgresql+asyncpg://` for compatibility with the async driver. No manual URL editing is required.

---

## Target Users

| Role | Capabilities |
|---|---|
| **Inventory Manager** | Full access: manage products, locations, all stock operations, dashboard analytics |
| **Warehouse Staff** | Operational access: create and validate receipts, deliveries, transfers, and adjustments |

---

## Roadmap

- [ ] OTP-based password reset
- [ ] Role-based access control (RBAC) enforcement on API endpoints
- [ ] Barcode/QR scanning support
- [ ] Batch operations (bulk receipts/deliveries)
- [ ] Export to CSV/PDF reports
- [ ] Email notifications for low-stock alerts
- [ ] Mobile-responsive warehouse picking interface
- [ ] Alembic migration pipeline for schema evolution

---

## License

This project is private and proprietary. All rights reserved.
