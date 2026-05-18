# Backend API — Code Rules & Conventions

> **Purpose**: AI and developer reference for maintaining clean, consistent, and modern code in the `backend-api` package.
> **Stack**: Express.js · TypeScript · Prisma ORM · Zod · JWT · PostgreSQL

---

## 1. Project Structure

```
src/
├── app.ts                          # Express bootstrap & server start
├── config/
│   ├── index.ts                    # Environment config (dotenv)
│   └── database.ts                 # Prisma client singleton
├── middleware/
│   ├── auth.middleware.ts          # JWT authentication
│   ├── role.guard.ts               # Role-based access control
│   ├── masjid-ownership.guard.ts   # Resource ownership check
│   ├── error.handler.ts            # Global error handler + request logger
│   └── upload.middleware.ts        # Multer file upload config
├── modules/
│   ├── auth/                       # Authentication module
│   ├── admin/                      # Super Admin module
│   ├── takmir/                     # Takmir (Masjid Admin) modules
│   │   ├── dashboard/
│   │   ├── finance/
│   │   ├── donation/
│   │   ├── inventory/
│   │   ├── event/
│   │   └── profile/
│   ├── location/                   # Location hierarchy module
│   └── public/                     # Public-facing endpoints
├── types/                          # Global TypeScript type augmentations
└── utils/
    ├── logger.ts                   # Console logger utility
    └── response.ts                 # Standardised API response helpers
```

### Module Internal Structure

Every module **MUST** follow this file layout:

```
modules/<module-name>/
├── <module>.routes.ts        # Route definitions (Router)
├── <module>.controller.ts    # Request handling & delegation
├── <module>.service.ts       # Business logic
└── <module>.dto.ts           # Zod schemas + inferred types
```

> [!IMPORTANT]
> **Never** put business logic in controllers. Controllers only parse input, call services, and send responses.

---

## 2. Naming Conventions

### 2.1 Files

| Category          | Pattern                            | Example                         |
|-------------------|------------------------------------|---------------------------------|
| Module routes     | `<module>.routes.ts`               | `auth.routes.ts`                |
| Module controller | `<module>.controller.ts`           | `admin.controller.ts`           |
| Module service    | `<module>.service.ts`              | `finance.service.ts`            |
| Module DTO        | `<module>.dto.ts`                  | `auth.dto.ts`                   |
| Middleware        | `<name>.middleware.ts`             | `auth.middleware.ts`            |
| Guard             | `<name>.guard.ts`                  | `role.guard.ts`                 |
| Utility           | `<name>.ts` (in `utils/`)          | `response.ts`, `logger.ts`     |
| Config            | `<name>.ts` (in `config/`)         | `database.ts`                   |
| Type augmentation | `<name>.d.ts` or `<name>.ts`       | `express.d.ts`                  |

**Rules:**
- All filenames use **kebab-case** (lowercase with hyphens): `masjid-ownership.guard.ts`
- Module files use **dot-notation** to indicate role: `auth.service.ts`
- Index files (`index.ts`) are used **only** for barrel exports from a module directory

### 2.2 Variables & Functions

| Kind              | Convention      | Example                                     |
|-------------------|-----------------|---------------------------------------------|
| Local variable    | `camelCase`     | `const hashedPassword = ...`                |
| Function          | `camelCase`     | `function sendSuccess() {}`                 |
| Arrow function    | `camelCase`     | `const formatDate = () => {}`               |
| Boolean variable  | `is/has/can`    | `isAuthenticated`, `hasPermission`          |
| Private method    | `camelCase`     | `private buildWhereClause()`                |
| Constant          | `UPPER_SNAKE`   | `const MAX_UPLOAD_SIZE = 5 * 1024 * 1024`   |
| Enum member       | `UPPER_SNAKE`   | `Role.SUPER_ADMIN`, `Role.MASJID_ADMIN`     |

### 2.3 Classes & Types

| Kind              | Convention       | Example                                     |
|-------------------|------------------|---------------------------------------------|
| Class             | `PascalCase`     | `AdminService`, `LocationController`        |
| Interface         | `PascalCase`     | `ApiResponse`, `UpdateProfileData`          |
| Type alias        | `PascalCase`     | `CreateMasjidDto`                           |
| Zod schema (var)  | `camelCase`      | `const registerDto = z.object({...})`       |
| Zod inferred type | `PascalCase`     | `type RegisterDto = z.infer<typeof registerDto>` |
| Generic parameter | Single uppercase | `<T>`, `<TData>`                            |

### 2.4 API Routes & Endpoints

| Rule                                     | Example                         |
|------------------------------------------|---------------------------------|
| Use **kebab-case** for multi-word paths  | `/api/takmir/:masjidId/finance` |
| Use **plural nouns** for resources       | `/api/admin/masjids` (not `/masjid`) |
| Use route params for resource IDs        | `/:id`, `/:masjidId`           |
| Use query params for filtering/sorting   | `?page=1&limit=20`             |
| Nest sub-resources under parents         | `/api/takmir/:masjidId/event`   |
| Prefix all routes with `/api`            | `/api/auth/login`              |

---

## 3. Architecture Patterns

### 3.1 Controller-Service Pattern (Strict Separation)

```typescript
// ✅ CORRECT — Controller delegates to service
class FinanceController {
  private service = new FinanceService();

  createFinance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = createFinanceDto.parse(req.body);
      const result = await this.service.create(req.params.masjidId, dto);
      sendCreated(res, 'Finance record created.', result);
    } catch (err) {
      next(err);
    }
  };
}

// ❌ WRONG — Business logic in controller
class FinanceController {
  create = async (req: Request, res: Response) => {
    const finance = await prisma.finance.create({ data: req.body }); // NO!
    res.json(finance);
  };
}
```

### 3.2 Controller Method Signature

All controller methods **MUST** use arrow function class properties to preserve `this` binding:

```typescript
// ✅ Arrow function property (auto-binds `this`)
getCountries = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await this.service.getCountries();
    sendSuccess(res, 'Countries fetched', data);
  } catch (err) {
    next(err);
  }
};

// ❌ Regular method (loses `this` when passed as callback)
async getCountries(req: Request, res: Response, next: NextFunction) { ... }
```

### 3.3 Error Handling

- **Controller level**: Wrap in `try/catch`, delegate to `next(err)`.
- **Service level**: Throw plain `Error` with descriptive messages. Never catch and swallow errors silently.
- **Global handler**: `errorHandler` middleware in `middleware/error.handler.ts` handles all uncaught errors.

```typescript
// Service — throw descriptive errors
async verifyMasjid(masjidId: string, verified: boolean) {
  const masjid = await prisma.masjid.findUnique({ where: { id: masjidId } });
  if (!masjid) {
    throw new Error('Masjid not found.');
  }
  // ...
}
```

### 3.4 Database Transactions

Use Prisma interactive transactions (`$transaction`) for operations that must be atomic:

```typescript
const result = await prisma.$transaction(async (tx) => {
  const admin = await tx.user.create({ data: { ... } });
  const masjid = await tx.masjid.create({ data: { adminId: admin.id, ... } });
  return masjid;
});
```

---

## 4. Validation & DTOs (Zod)

### 4.1 Schema Definition

- Define schemas using **Zod** in `<module>.dto.ts` files
- Export both the Zod schema (for runtime validation) and the inferred type (for TypeScript)
- Schema variable name: `camelCase` with `Dto` suffix
- Inferred type name: `PascalCase` with `Dto` suffix

```typescript
// auth.dto.ts
import { z } from 'zod';

export const registerDto = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type RegisterDto = z.infer<typeof registerDto>;
```

### 4.2 Validation in Controllers

Always validate at the **controller** level using `.parse()`:

```typescript
// ✅ Parse in controller, pass typed DTO to service
const dto = createFinanceDto.parse(req.body);
const result = await this.service.create(masjidId, dto);

// ❌ Don't pass raw req.body to services
const result = await this.service.create(masjidId, req.body);
```

---

## 5. API Response Format

### 5.1 Standard Envelope

All API responses **MUST** use the standardised response helpers from `utils/response.ts`:

```typescript
// Success response
sendSuccess(res, 'Data fetched successfully.', data);
// → { success: true, message: "...", data: {...} }

// Created response (HTTP 201)
sendCreated(res, 'Record created.', data);
// → { success: true, message: "...", data: {...} }

// Error response
sendError(res, 'Validation failed.', 400);
// → { success: false, message: "..." }
```

### 5.2 Response Rules

- **Always** include a human-readable `message` field
- **Never** return raw Prisma objects with sensitive fields (e.g., `password`)
- Use Prisma `select` or `include` to shape returned data
- End messages with a period for consistency: `'Masjid not found.'`

---

## 6. Middleware & Guards

### 6.1 Ordering

Middleware is applied in this strict order on protected routes:

```
authenticate → requireRole → [ownershipGuard] → controller
```

### 6.2 Guard Conventions

- Guard files end with `.guard.ts`
- Guards are **factory functions** that return middleware:

```typescript
export const requireRole = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // validation logic
    next();
  };
};
```

### 6.3 Authentication

- JWT token is extracted from `Authorization: Bearer <token>` header
- Authenticated user is attached to `req.user`
- Type augmentation for `req.user` lives in `types/`

---

## 7. Prisma & Database

### 7.1 Client Singleton

Use the shared Prisma client from `config/database.ts`. **Never** instantiate `new PrismaClient()` in services:

```typescript
// ✅ Correct
import prisma from '../../config/database';

// ❌ Wrong
const prisma = new PrismaClient();
```

### 7.2 Query Best Practices

```typescript
// ✅ Select only needed fields to avoid leaking sensitive data
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true,
    role: true,
    createdAt: true,
  },
});

// ✅ Use `include` for relations, scope with `select`
const masjid = await prisma.masjid.findUnique({
  where: { id: masjidId },
  include: {
    admin: {
      select: { id: true, name: true, email: true },
    },
  },
});

// ✅ Default ordering: newest first
orderBy: { createdAt: 'desc' }
```

### 7.3 Prisma Schema Conventions

| Element     | Convention       | Example                          |
|-------------|------------------|----------------------------------|
| Model       | `PascalCase`     | `model Masjid {}`                |
| Field       | `camelCase`      | `adminId`, `createdAt`           |
| Relation    | `camelCase`      | `admin User @relation(...)`      |
| Enum        | `PascalCase`     | `enum Role { SUPER_ADMIN ... }`  |
| Enum member | `UPPER_SNAKE`    | `MASJID_ADMIN`                   |
| Table name  | use `@@map()`    | `@@map("masjids")`               |

---

## 8. TypeScript Rules

### 8.1 Strictness

- **Enable** `strict: true` in `tsconfig.json`
- **Never** use `any` — prefer `unknown` and narrow with type guards
- **Always** type function parameters and return types for public APIs
- Use `as const` for literal arrays/objects where applicable

### 8.2 Import Style

```typescript
// ✅ Named imports (tree-shakeable)
import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { sendSuccess, sendError } from '../../utils/response';

// ❌ Wildcard imports (bloats bundle, obscures dependencies)
import * as express from 'express';
```

### 8.3 Type vs Interface

- Use `interface` for object shapes that may be extended
- Use `type` for unions, intersections, and Zod-inferred types

```typescript
// Interface for extendable shapes
interface UpdateProfileData {
  name?: string;
  phone?: string;
}

// Type for unions / Zod inference
type FinanceType = 'DEBIT' | 'CREDIT';
type RegisterDto = z.infer<typeof registerDto>;
```

---

## 9. Clean Code Principles

### 9.1 Single Responsibility

- One class = one responsibility. `AdminService` handles admin operations only.
- One file = one primary export. Don't mix controllers and services in the same file.

### 9.2 Method Size & Complexity

- Keep methods under **30 lines**. Extract helpers for complex logic.
- Maximum **one level of nesting** inside try blocks.
- Prefer **early returns** (guard clauses) over nested if/else.

```typescript
// ✅ Early return (guard clause)
async getSkDkm(masjidId: string) {
  const masjid = await prisma.masjid.findUnique({ where: { id: masjidId } });
  if (!masjid) throw new Error('Masjid not found.');
  if (!masjid.skDkmUrl) throw new Error('SK DKM document not found.');
  return { filePath: masjid.skDkmUrl, masjidName: masjid.name };
}

// ❌ Nested conditionals
async getSkDkm(masjidId: string) {
  const masjid = await prisma.masjid.findUnique({ where: { id: masjidId } });
  if (masjid) {
    if (masjid.skDkmUrl) {
      return { filePath: masjid.skDkmUrl, masjidName: masjid.name };
    } else {
      throw new Error('SK DKM document not found.');
    }
  } else {
    throw new Error('Masjid not found.');
  }
}
```

### 9.3 Comments & Documentation

- Use **JSDoc** (`/** */`) on service class methods to describe purpose
- Use **inline comments** sparingly — only for *why*, not *what*
- Use section dividers in `app.ts` for visual separation:

```typescript
// ─── Global Middleware ──────────────────────────────────────
// ─── API Routes ─────────────────────────────────────────────
```

### 9.4 Dead Code

- **Never** commit commented-out code
- **Remove** unused imports, variables, and functions
- **Delete** empty files or placeholder implementations

---

## 10. Security Rules

| Rule                                        | Implementation                                     |
|---------------------------------------------|---------------------------------------------------|
| Hash passwords with high cost factor        | `bcrypt.hash(password, 12)`                        |
| Never return password fields in responses   | Use Prisma `select` to exclude `password`          |
| Validate all inputs at boundary             | Zod `.parse()` in controllers                      |
| Use Helmet for HTTP headers                 | `app.use(helmet())`                                |
| Apply CORS configuration                   | `app.use(cors())` — configure origins in production|
| Check resource ownership                    | `masjid-ownership.guard.ts` middleware             |
| Use parameterised queries only              | Prisma handles this automatically                  |
| Store secrets in `.env`, never in code      | `config/index.ts` reads from `process.env`         |

---

## 11. File Upload Rules

- Use **Multer** middleware configured in `upload.middleware.ts`
- Store uploads in a dedicated `uploads/` directory, separated by access:
  - `uploads/public/` — publicly accessible files (served via static middleware)
  - `uploads/private/` — restricted files (served via authenticated endpoints)
- Validate file type and size at the middleware level
- Store only the **relative path** in the database, not the absolute path

---

## 12. Environment & Configuration

- All environment variables are loaded in `config/index.ts` via `dotenv`
- Access config via the imported `config` object, **never** via `process.env` directly in modules
- Required variables should have validation/defaults in the config file

```typescript
// ✅ Correct
import { config } from '../../config';
const port = config.port;

// ❌ Wrong
const port = process.env.PORT;
```

---

## 13. Git & Code Quality

- **Commit messages**: Use conventional commits (`feat:`, `fix:`, `refactor:`, `chore:`)
- **Branch naming**: `feature/<name>`, `fix/<name>`, `refactor/<name>`
- **No console.log in production code** — use the `logger` utility from `utils/logger.ts`
- **Run lint before commit**: Ensure no TypeScript errors (`tsc --noEmit`)
