# Rosterly — Employee Management System

A full-stack employee management platform: Spring Boot 3 (Java 21) API,
React + TypeScript frontend, PostgreSQL, JWT auth with role-based access
control.

This README is deliberately honest about scope. Everything described under
**"What's implemented"** is real, working code — not scaffolding. Everything
under **"Not yet built"** is left out on purpose rather than faked, so you
know exactly what you're getting.

---

## Quick start (Docker)

```bash
cp .env.example .env
# edit .env and set JWT_SECRET and ADMIN_PASSWORD

docker compose up --build
```

- Frontend: http://localhost:5173
- API: http://localhost:8080/api/v1
- Swagger UI: http://localhost:8080/swagger-ui.html

On first boot, the backend seeds:
- One admin account (email/password from your `.env`)
- A small demo dataset (2 departments, 3 employees) — disable with
  `SEED_DEMO_DATA=false`

## Local development (backend against Dockerized Postgres, frontend via Vite)

**Backend**
```bash
# Start only Postgres from the compose file — no need to run the whole stack:
docker compose up -d postgres

cd backend
mvn spring-boot:run
```
This works out of the box because `application.yml`'s datasource defaults
(`hr_platform` / `hr_platform` / `hr_platform`) are the same values
`docker-compose.yml` initializes the `postgres` service with. If you point
`DB_URL` at a different Postgres instance instead, make sure that instance
actually has a matching role/password — Spring won't create one for you.

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

### Troubleshooting: `password authentication failed for user "hr_platform"`

This is **not** a config bug — `application.yml`, `docker-compose.yml`, and
the `.env` values all agree on the same credentials. This error means the
Postgres *data volume* was already initialized under different credentials
at some point in the past. Postgres only applies
`POSTGRES_USER`/`POSTGRES_PASSWORD`/`POSTGRES_DB` the first time it
initializes an empty data directory — never again after that, even if you
edit compose files or `.env` afterward. So if this stack (or a local
Postgres instance) was ever started before these values were finalized, the
container is silently stuck on stale credentials.

Fix:
```bash
./scripts/reset-db.sh
```
This drops the `postgres_data` volume and re-initializes it cleanly. If
you're running Postgres outside Docker instead, the equivalent fix is to log
in as a superuser and run `ALTER ROLE hr_platform WITH PASSWORD 'hr_platform';`
(or update `DB_USERNAME`/`DB_PASSWORD` to match whatever that role's actual
password already is).
Vite proxies `/api` to `localhost:8080` in dev (see `vite.config.ts`), so no
CORS configuration is needed locally.

---

## Architecture

```
Controller → Service → Repository → Database
```

- **DTOs everywhere** — entities never cross the controller boundary.
- **Centralized response envelope** (`ApiResponse<T>` / `PageResponse<T>`) —
  every endpoint returns the same shape.
- **Global exception handling** (`GlobalExceptionHandler`) — no per-controller
  try/catch; every error becomes a consistent `ErrorResponse` with a stable
  `errorCode` the frontend can branch on.
- **Specification-based filtering** for employee search — composable,
  extensible predicates instead of a wall of `findByXAndYAndZ` methods.
- **Flyway-managed schema** — `ddl-auto: validate`, never `update`, so the
  schema is explicit and reviewable in `db/migration/`.
- **Soft deletes** on Employee and Department (`deleted` + `deletedAt`),
  with restore support on Employee.

## What's implemented

**Auth & access control**
- JWT access + refresh tokens, BCrypt password hashing
- Login, refresh, forgot/reset password (reset flow is a working
  mock — see note below), admin-only account management
- Four roles (ADMIN, HR, MANAGER, EMPLOYEE) enforced via method security;
  MANAGER is transparently scoped to their own direct reports on every
  employee endpoint

**Employees**
- Full CRUD, soft delete, restore, bulk delete
- Search (name/email/code/designation), filter (department, status, gender,
  manager), pagination, sorting
- Validation: duplicate email/phone, negative salary, future date of birth,
  self-as-own-manager, circular reporting hierarchy, self-delete, deleting
  the last remaining admin

**Departments**
- CRUD, duplicate-name protection, deletion blocked while employees are
  still assigned, department head assignment

**Dashboard**
- Live aggregated stats: headcount, active/on-leave counts, new hires this
  month, total monthly payroll, department distribution, recent hires

**Frontend**
- Landing page, login/forgot-password flow, protected app shell with
  role-aware navigation
- Employees: searchable/filterable/paginated table, create/edit modal,
  bulk delete, per-row delete
- Departments: card grid, create/edit modal, delete with the same
  non-empty-department guard as the API
- Dashboard: stat cards, department bar chart (Recharts), recent hires list
- 404 page; JWT refresh handled transparently by the API client
- Design system: Tailwind + Framer Motion, a distinct visual identity
  (ink/paper palette, Fraunces + Inter + IBM Plex Mono, no default
  glassmorphism-everywhere template look)

**Mock/simplified by design, not by accident**
- Password reset actually generates and validates a real token — it just
  logs the reset link to the console instead of sending an email (see
  `AuthService.forgotPassword`). Swap in a real mailer for production.
- Employee codes (`EMP-000001`) are generated from a count-based sequence
  with a uniqueness retry loop, not a dedicated DB sequence — fine for the
  current scale, worth revisiting under high concurrent writes.

## Not yet built

These were explicitly out of scope for this pass, not silently skipped:

- **Attendance module** (clock in/out, late-entry tracking, monthly reports)
- **Leave management** (apply/approve/reject, balances, holiday calendar)
- **Salary module** beyond the base `salary` field (increment history,
  bonuses, deductions, payslip generation)
- **CSV bulk import / Excel export**
- **Photo upload** (the `photoUrl` field exists; there's no upload endpoint
  or object storage wired up yet)
- **Real email delivery** for password reset / email verification
- **Employee self-service profile page** on the frontend (the `/employees/me`
  API endpoint exists; there's no UI screen for it yet)
- ER diagram image (the schema is fully described in
  `backend/src/main/resources/db/migration/V1__init_schema.sql`, which is the
  more reliable source of truth)

Each of these follows the same patterns already in the codebase
(Specification-based filtering, soft delete, centralized error handling), so
they're additive rather than a rewrite.

## Project structure

```
backend/
  src/main/java/com/hrplatform/
    common/       # ApiResponse, ApiException, GlobalExceptionHandler
    config/       # Security, CORS, OpenAPI, startup data seeder
    security/     # JWT service/filter, UserDetails, SecurityUtils
    user/         # Auth + account management
    department/
    employee/
    dashboard/
  src/main/resources/
    application.yml, application-{dev,prod}.yml
    db/migration/V1__init_schema.sql

frontend/
  src/
    pages/        # landing, auth, dashboard, employees, departments, errors
    components/   # ui primitives, layout, employees, landing
    hooks/        # react-query hooks per domain
    lib/          # api client, auth context, zod schemas, formatting
    types/        # API contract types
```

## API documentation

Full interactive docs at `/swagger-ui.html` once the backend is running.
All endpoints are versioned under `/api/v1`.

## Default credentials (demo only)

Set in your `.env` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`). Change these
immediately in any real deployment — the seeder is idempotent and safe to
leave enabled, but the seeded password is only as strong as what you put in
`.env`.
