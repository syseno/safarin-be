# 🕌 Masjid Ecosystem — Backend API

RESTful backend API for the **Masjid Information System**, a comprehensive platform for managing mosques (masjid) including finances, inventory, donations, events, and organizational administration.

Built with **Express.js**, **Prisma ORM**, **PostgreSQL**, and **TypeScript**.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Code Conventions](#code-conventions)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Scripts](#scripts)
- [License](#license)

---

## Features

- **Role-Based Access Control (RBAC)** — Three-tier roles: `SUPER_ADMIN`, `MASJID_ADMIN`, and `USER`
- **Authentication** — JWT-based registration, login, and session management
- **Masjid Management** — Full CRUD with verification workflow and SK-DKM document upload
- **Financial Tracking** — Income (DEBIT) & expense (CREDIT) ledger with audit trail
- **Inventory Management** — Track mosque assets with condition reporting
- **Donation Management** — Categorized donations (Sadaqah, Infaq, Zakat) with auto finance-record linking
- **Event Management** — Publish and manage masjid events with scheduling
- **Dashboard Analytics** — Summary statistics for Takmir admins
- **Hierarchical Locations** — Country → City → District → Sub-District with coordinate support
- **Public API** — Unauthenticated endpoints for searching masjids, viewing finances, and events
- **Secure File Upload** — Private document storage (SK-DKM) with public image uploads via Multer
- **Centralized Error Handling** — Global error handler with Zod, Prisma, and Multer error support

---

## Tech Stack

| Layer         | Technology                       |
| ------------- | -------------------------------- |
| Runtime       | Node.js (v18+)                   |
| Framework     | Express.js 4                     |
| Language      | TypeScript 5                     |
| ORM           | Prisma 6                         |
| Database      | PostgreSQL 16                    |
| Auth          | JSON Web Tokens (jsonwebtoken)   |
| Validation    | Zod                              |
| Security      | Helmet, bcryptjs, CORS           |
| File Upload   | Multer                           |
| Containerized | Docker Compose (PostgreSQL only) |

---

## Architecture

The project follows a **Controller → Service → Prisma** layered architecture with centralized error handling:

```
Request → Middleware (Auth / Role / Ownership Guard)
        → Controller (HTTP handling, Zod validation, error delegation)
        → Service (Business logic, transactions)
        → Prisma Client (Database)
        → Global Error Handler (catches all errors via next())
```

### Design Principles

- **Controllers** use **arrow function class properties** for automatic `this` binding — no wrapper functions needed in routes
- **Error delegation** — Controllers delegate all errors to the global error handler via `next(err)` instead of handling them inline
- **Zod DTOs** — Every mutation endpoint validates input through Zod schemas at the controller boundary
- **Service layer** — Contains all business logic; never touches `req`/`res` directly
- **Centralized config** — All environment variables accessed through `config/index.ts`

### Module Organization

```
modules/
├── auth/          # Registration, login, JWT
├── admin/         # Super Admin operations (SUPER_ADMIN only)
├── takmir/        # Masjid Admin dashboard (MASJID_ADMIN + ownership guard)
│   ├── finance/
│   ├── inventory/
│   ├── donation/
│   ├── event/
│   ├── dashboard/
│   └── profile/
├── location/      # Hierarchical location data (Country/City/District/SubDistrict)
└── public/        # Unauthenticated read-only endpoints
```

---

## Code Conventions

This project follows the conventions defined in [`code_rule.md`](./code_rule.md). Key rules:

### Controller Pattern

```typescript
export class SomeController {
  private readonly service = new SomeService();

  /** JSDoc on every public method. */
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = createDto.parse(req.body);       // Zod validation
      const result = await this.service.create(data);
      sendCreated(res, 'Created successfully.', result);
    } catch (err) {
      next(err);  // Delegate to global error handler
    }
  };
}
```

### Route Pattern

```typescript
// Direct method reference — arrow functions are auto-bound
router.post('/', controller.create);
router.get('/', controller.getList);
```

### API Response Envelope

```json
{
  "success": true,
  "message": "Description of the result.",
  "data": { }
}
```

### Naming Conventions

| Item             | Convention    | Example                  |
| ---------------- | ------------- | ------------------------ |
| Files            | `kebab-case`  | `auth.controller.ts`     |
| Classes          | `PascalCase`  | `AuthController`         |
| Methods          | `camelCase`   | `getFinanceList`         |
| Constants        | `UPPER_SNAKE` | `SALT_ROUNDS`            |
| DTO files        | `kebab-case`  | `auth.dto.ts`            |
| Route paths      | `kebab-case`  | `/masjid/:id/sk-dkm`     |

---

## Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x
- **PostgreSQL 16** — via Docker Compose or a standalone installation

---

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd masjid-ecosystem/backend-api
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the database

**Option A — Docker Compose** (requires Docker Desktop running):

```bash
# From the monorepo root (masjid-ecosystem/)
docker compose up -d
```

This spins up a PostgreSQL 16 container on port `5432` with:
- **User:** `postgres`
- **Password:** `password`
- **Database:** `masjid_ecosystem`

**Option B — Standalone PostgreSQL:**

If you have PostgreSQL already installed locally, create a database named `masjid_ecosystem` and update your `.env` file with the correct connection string.

### 4. Configure environment

```bash
cp .env.example .env
# Edit .env if needed (defaults work with docker-compose)
```

### 5. Run database migrations & generate Prisma client

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 6. Seed the database (optional)

```bash
npm run prisma:seed
```

This creates test accounts:

| Role           | Email               | Password      |
| -------------- | ------------------- | ------------- |
| `SUPER_ADMIN`  | `admin@masjid.id`   | `password123` |
| `MASJID_ADMIN` | `takmir1@masjid.id` | `password123` |
| `MASJID_ADMIN` | `takmir2@masjid.id` | `password123` |
| `USER`         | `user@masjid.id`    | `password123` |

### 7. Start the dev server

```bash
npm run dev
```

The API will be running at **http://localhost:3000**.

Verify with:
```bash
curl http://localhost:3000/api/health
```

---

## Environment Variables

| Variable         | Description                   | Default                                                                  |
| ---------------- | ----------------------------- | ------------------------------------------------------------------------ |
| `DATABASE_URL`   | PostgreSQL connection string  | `postgresql://postgres:password@localhost:5432/masjid_ecosystem?schema=public` |
| `JWT_SECRET`     | Secret key for JWT signing    | *(must be changed in production)*                                        |
| `JWT_EXPIRES_IN` | Token expiration duration     | `7d`                                                                     |
| `PORT`           | Server port                   | `3000`                                                                   |
| `NODE_ENV`       | Environment mode              | `development`                                                            |
| `UPLOAD_DIR`     | File upload directory         | `./uploads`                                                              |
| `MAX_FILE_SIZE`  | Max upload file size (bytes)  | `5242880` (5 MB)                                                         |

---

## Database

### Entity Relationship Diagram

```
┌──────────────┐       1:1        ┌──────────────────┐
│     User     │──────────────────│      Masjid      │
│              │   adminId        │                  │
│  - id        │                  │  - id            │
│  - name      │                  │  - name          │
│  - email     │                  │  - addressDetail │
│  - password  │                  │  - phone         │
│  - role      │                  │  - verified      │
│  - googleId  │                  │  - skDkmUrl      │
└──────────────┘                  │  - imageUrl      │
                                  │  - latitude      │
                                  │  - longitude     │
                                  └────────┬─────────┘
                                           │
              ┌────────────────┬───────────┼───────────┬────────────┐
              │                │           │           │            │
         ┌────▼────┐   ┌──────▼──┐  ┌─────▼────┐ ┌────▼───┐  ┌────▼────┐
         │ Finance │   │Inventory│  │ Donation │ │ Event  │  │ Profile │
         │         │   │         │  │          │ │        │  │  (self) │
         │ - title │   │ - name  │  │ - type   │ │ - title│  └─────────┘
         │ - amount│   │ - qty   │  │ - amount │ │ - date │
         │ - type  │   │ - cond. │  │ - desc.  │ │ - time │
         └─────────┘   └─────────┘  └──────────┘ └────────┘

┌─────────────────────────────────────────────────┐
│              Location Hierarchy                 │
│  Country → City → District → SubDistrict       │
│  (Masjid links to all four via foreign keys)    │
└─────────────────────────────────────────────────┘
```

### Key Enums

| Enum                 | Values                          |
| -------------------- | ------------------------------- |
| `Role`               | `SUPER_ADMIN`, `MASJID_ADMIN`, `USER` |
| `FinanceType`        | `DEBIT` (income), `CREDIT` (expense)  |
| `InventoryCondition` | `GOOD`, `DAMAGED`, `LOST`             |
| `DonationType`       | `SADAQAH`, `INFAQ`, `ZAKAT`           |

---

## API Reference

**Base URL:** `http://localhost:3000/api`

### Health Check

| Method | Endpoint       | Auth | Description            |
| ------ | -------------- | ---- | ---------------------- |
| `GET`  | `/api/health`  | ❌   | Server health status   |

---

### 🔐 Auth (`/api/auth`)

| Method | Endpoint            | Auth | Description                  |
| ------ | ------------------- | ---- | ---------------------------- |
| `POST` | `/auth/register`    | ❌   | Register a new user          |
| `POST` | `/auth/login`       | ❌   | Login and receive JWT        |
| `GET`  | `/auth/me`          | ✅   | Get current user profile     |

---

### 👑 Admin (`/api/admin`) — `SUPER_ADMIN` only

| Method  | Endpoint                     | Auth | Description                         |
| ------- | ---------------------------- | ---- | ----------------------------------- |
| `POST`  | `/admin/masjid`              | ✅   | Create a masjid (with SK-DKM file)  |
| `PATCH` | `/admin/masjid/:id/verify`   | ✅   | Verify/approve a masjid             |
| `GET`   | `/admin/masjid/unverified`   | ✅   | List unverified masjids             |
| `GET`   | `/admin/masjid`              | ✅   | List all masjids                    |
| `GET`   | `/admin/masjid/:id/sk-dkm`   | ✅   | Download SK-DKM document            |
| `GET`   | `/admin/users`               | ✅   | List all users                      |

---

### 🕌 Takmir (`/api/takmir/:masjidId`) — `MASJID_ADMIN` + Ownership Guard

All Takmir endpoints are scoped to the admin's own masjid via the `masjidId` parameter and the ownership middleware guard. `SUPER_ADMIN` can bypass the ownership check.

#### Finance

| Method   | Endpoint                                | Description                |
| -------- | --------------------------------------- | -------------------------- |
| `POST`   | `/takmir/:masjidId/finance`             | Create finance record      |
| `GET`    | `/takmir/:masjidId/finance`             | List finance records       |
| `GET`    | `/takmir/:masjidId/finance/:id`         | Get finance detail         |

#### Inventory

| Method   | Endpoint                                     | Description                |
| -------- | -------------------------------------------- | -------------------------- |
| `POST`   | `/takmir/:masjidId/inventory`                | Create inventory item      |
| `GET`    | `/takmir/:masjidId/inventory`                | List inventory items       |
| `GET`    | `/takmir/:masjidId/inventory/:id`            | Get inventory detail       |
| `PATCH`  | `/takmir/:masjidId/inventory/:id/quantity`   | Update item quantity       |
| `PATCH`  | `/takmir/:masjidId/inventory/:id/condition`  | Update item condition      |

#### Donation

| Method   | Endpoint                                | Description                |
| -------- | --------------------------------------- | -------------------------- |
| `POST`   | `/takmir/:masjidId/donation`            | Create donation            |
| `GET`    | `/takmir/:masjidId/donation`            | List donations             |
| `GET`    | `/takmir/:masjidId/donation/summary`    | Get summary by type        |

#### Event

| Method   | Endpoint                                | Description                |
| -------- | --------------------------------------- | -------------------------- |
| `POST`   | `/takmir/:masjidId/event`               | Create event               |
| `GET`    | `/takmir/:masjidId/event`               | List events                |
| `GET`    | `/takmir/:masjidId/event/:id`           | Get event detail           |
| `PUT`    | `/takmir/:masjidId/event/:id`           | Update event               |
| `DELETE` | `/takmir/:masjidId/event/:id`           | Delete event               |

#### Dashboard

| Method | Endpoint                                 | Description                |
| ------ | ---------------------------------------- | -------------------------- |
| `GET`  | `/takmir/:masjidId/dashboard`            | Get dashboard summary      |

#### Profile

| Method  | Endpoint                                 | Description                    |
| ------- | ---------------------------------------- | ------------------------------ |
| `GET`   | `/takmir/:masjidId/profile`              | Get masjid profile             |
| `PUT`   | `/takmir/:masjidId/profile`              | Update masjid profile          |

---

### 📍 Location (`/api/location`) — No Auth

| Method | Endpoint                              | Description                            |
| ------ | ------------------------------------- | -------------------------------------- |
| `GET`  | `/location/countries`                 | Get all countries                      |
| `GET`  | `/location/cities?countryId=`         | Get cities by country                  |
| `GET`  | `/location/districts?cityId=`         | Get districts by city                  |
| `GET`  | `/location/sub-districts?districtId=` | Get sub-districts by district          |

---

### 🌐 Public (`/api/public`) — No Auth

| Method | Endpoint                              | Description                         |
| ------ | ------------------------------------- | ----------------------------------- |
| `GET`  | `/public/masjid`                      | Search / list verified masjids      |
| `GET`  | `/public/masjid/:masjidId`            | Get masjid detail                   |
| `GET`  | `/public/masjid/:masjidId/finance`    | Get masjid's financial transparency |
| `GET`  | `/public/masjid/:masjidId/events`     | Get masjid's upcoming events        |

---

## Project Structure

```
backend-api/
├── prisma/
│   ├── schema.prisma                 # Database schema & models
│   └── seed.ts                       # Database seeder (test data)
├── src/
│   ├── app.ts                        # Express app entry point
│   ├── config/
│   │   ├── index.ts                  # Centralized config from env vars
│   │   └── database.ts              # Prisma client singleton
│   ├── middleware/
│   │   ├── auth.middleware.ts        # JWT authentication
│   │   ├── role.guard.ts            # Role-based access guard
│   │   ├── masjid-ownership.guard.ts # Masjid ownership verification
│   │   ├── upload.middleware.ts      # Multer file upload (public/private)
│   │   └── error.handler.ts         # Global error handler & request logger
│   ├── modules/
│   │   ├── auth/                    # register, login, me
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.dto.ts
│   │   ├── admin/                   # Super Admin operations
│   │   │   ├── admin.controller.ts
│   │   │   ├── admin.service.ts
│   │   │   ├── admin.routes.ts
│   │   │   └── admin.dto.ts
│   │   ├── takmir/                  # Masjid Admin modules
│   │   │   ├── finance/             # controller, service, routes, dto
│   │   │   ├── inventory/
│   │   │   ├── donation/
│   │   │   ├── event/
│   │   │   ├── dashboard/
│   │   │   ├── profile/            # includes profile.dto.ts (Zod)
│   │   │   └── index.ts            # Takmir router aggregator
│   │   ├── location/               # Hierarchical location data
│   │   │   ├── location.controller.ts
│   │   │   ├── location.service.ts
│   │   │   └── index.ts
│   │   └── public/                 # Public read-only endpoints
│   ├── types/
│   │   └── index.ts                # Custom TypeScript definitions
│   └── utils/
│       ├── logger.ts               # Console logger utility
│       └── response.ts             # Standardized API response helpers
├── code_rule.md                     # Code conventions (Source of Truth)
├── .env.example                     # Environment variable template
├── package.json
└── tsconfig.json
```

---

## Scripts

| Command                   | Description                                      |
| ------------------------- | ------------------------------------------------ |
| `npm run dev`             | Start dev server with hot-reload (`ts-node-dev`)  |
| `npm run build`           | Compile TypeScript to `dist/`                     |
| `npm run start`           | Run compiled production build                     |
| `npm run prisma:generate` | Generate Prisma client from schema                |
| `npm run prisma:migrate`  | Run database migrations                           |
| `npm run prisma:seed`     | Seed database with test data                      |
| `npm run prisma:studio`   | Open Prisma Studio (visual DB editor)             |

---

## License

This project is part of the **Masjid Ecosystem** monorepo. All rights reserved.
