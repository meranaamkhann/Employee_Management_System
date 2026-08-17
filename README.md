# Rosterly — Full-Stack HR Management Platform

Rosterly is a full-stack Human Resource Management System built with **Java Spring Boot, PostgreSQL, React, and TypeScript**.

It models core HR workflows including employee management, organizational hierarchy, attendance, leave management, payroll, authentication, role-based access control, onboarding, audit logging, file uploads, transactional email, and automated testing.

The project was built as a **backend-focused portfolio project** with emphasis on authorization, business rules, data consistency, testing, database migrations, and CI/CD rather than simple CRUD operations.

> **Project status:** Portfolio project deployed for demonstration purposes. It is not presented as a live paid HR product or enterprise HRIS.

---

## Features

### Authentication & Authorization

* JWT-based authentication
* Short-lived access tokens
* Refresh-token rotation
* Refresh-token revocation
* Secure logout
* BCrypt password hashing
* Password change
* Forgot-password flow
* Password reset tokens
* Account activation/deactivation
* Role-based access control
* Authentication rate limiting
* Stateless Spring Security
* Method-level authorization

### User Roles

Rosterly supports five roles:

| Role         | Access                                                         |
| ------------ | -------------------------------------------------------------- |
| **ADMIN**    | Full HR and system access                                      |
| **IT_ADMIN** | Account and access management                                  |
| **HR**       | Employee, department, attendance, leave and payroll management |
| **MANAGER**  | Data and workflows for their managed employees                 |
| **EMPLOYEE** | Own profile, attendance, leave and payslips                    |

A major design goal is **separation of responsibilities**.

For example, `IT_ADMIN` can manage accounts and roles without automatically receiving unrestricted access to sensitive HR/payroll information.

---

# Organizational Hierarchy

Rosterly supports employee-manager relationships.

```text
Director
   │
   ├── Engineering Manager
   │      ├── Backend Developer
   │      └── Frontend Developer
   │
   └── HR Manager
          └── HR Executive
```

The backend validates manager assignments and prevents:

* An employee managing themselves
* Circular reporting relationships
* Invalid manager references
* Assigning deleted employees as managers

Manager-scoped authorization is enforced on the backend rather than relying on frontend filtering.

A manager requesting employee, attendance, leave or payroll data receives data within their permitted organizational scope.

---

# Employee Management

Employees can be:

* Created
* Updated
* Soft deleted
* Restored
* Searched
* Filtered
* Paginated
* Sorted
* Exported to CSV

Employee records include information such as:

* Employee code
* Name
* Email
* Phone
* Gender
* Date of birth
* Designation
* Department
* Manager
* Joining date
* Salary
* Employment status
* Address
* Emergency contact
* Notes
* Profile photo

Validation protects important business rules including:

* Duplicate email prevention
* Duplicate phone prevention
* Duplicate employee code prevention
* Invalid salary values
* Invalid dates
* Self-manager assignment
* Circular manager hierarchy
* Invalid department references

Employee deletion uses **soft deletion** rather than immediately removing the underlying record.

---

# Department Management

Departments support:

* Creation
* Updating
* Soft deletion
* Department descriptions
* Department budgets
* Department heads
* Employee assignment
* Duplicate-name protection

A department cannot be removed while employees are still assigned to it.

---

# Dashboard

The dashboard provides aggregated organizational information including:

* Total employees
* Active employees
* Employees currently on leave
* New hires
* Monthly payroll totals
* Department distribution
* Recent hires

Aggregation is performed at the database/query level rather than loading the entire employee dataset into application memory.

---

# Attendance Management

Employees can:

* Clock in
* Clock out
* View attendance records
* View monthly attendance summaries

Authorized HR/Admin users can perform administrative attendance operations.

Attendance statuses include:

```text
PRESENT
LATE
HALF_DAY
ABSENT
ON_LEAVE
```

The system handles rules such as:

* One attendance record per employee per day
* Clock-in/clock-out tracking
* Late classification
* Half-day classification
* Monthly attendance summaries
* Manager-scoped attendance access

The application uses the `Asia/Kolkata` timezone for attendance-related date/time handling.

---

# Leave Management

The leave workflow allows employees to submit requests and authorized users to review them.

Supported operations include:

* Apply for leave
* View leave requests
* Approve leave
* Reject leave
* Cancel leave
* Restore balances after cancellation
* View leave balances
* Manage holidays
* Allocate annual leave
* Manager-scoped approval

Example workflow:

```text
Employee
   │
   │ Submit Leave Request
   ▼
PENDING
   │
   ├───────────────┐
   ▼               ▼
APPROVED         REJECTED
   │
   ▼
Balance Deducted
```

Approved paid leave automatically affects the employee's leave balance.

When an approved leave is cancelled, the applicable balance can be restored.

Managers are restricted to their permitted employee scope while HR/Admin users can handle broader organizational workflows.

---

# Payroll

Payroll is connected to actual employee, attendance and leave information.

The payroll calculation considers:

* Employee salary
* Basic salary
* HRA
* Conveyance
* Special allowance
* Provident Fund
* Professional tax
* Unpaid leave
* Recorded absence
* Bonus

Conceptually:

```text
Gross Salary
     │
     ├── Basic
     ├── HRA
     ├── Conveyance
     └── Special Allowance
     │
     ▼
Deductions
     │
     ├── PF
     ├── Professional Tax
     ├── Unpaid Leave
     └── Absence
     │
     ▼
Net Salary
```

Payroll supports:

* Monthly payroll generation
* Individual payslip generation
* Salary-component calculation
* Attendance-based deductions
* Leave-based deductions
* Bonus
* Payroll notes
* Draft payslips
* Finalized payslips
* Paid status
* Payslip filtering
* Employee payslip access
* PDF payslip generation
* Payroll auditing

Once a payslip is finalized, the system prevents inappropriate modification of finalized payroll data.

> Payroll calculations are implemented as application logic for this portfolio project and should not be treated as a complete statutory Indian payroll/tax engine.

---

# Payslip PDF Generation

Generated payslips can be converted into PDF documents.

A typical payslip contains:

```text
Employee Information
        │
        ▼
Salary Components
        │
        ├── Basic
        ├── HRA
        ├── Allowances
        └── Bonus
        │
        ▼
Deductions
        │
        ├── PF
        ├── Professional Tax
        ├── Unpaid Leave
        └── Absence
        │
        ▼
Net Salary
```

PDF generation is handled on the backend using OpenPDF.

---

# CSV Export

Authorized users can export employee information as CSV.

This is useful for:

* HR reporting
* Spreadsheet analysis
* Data backups
* Administrative workflows

The export is generated server-side.

---

# Employee Profile Photos

Rosterly integrates with **Cloudinary** for employee profile photo storage.

Supported operations include:

* Upload employee photo
* Replace photo
* Remove photo
* Store Cloudinary public ID
* Persist photo metadata

The application stores the relevant Cloudinary reference rather than storing uploaded image binaries directly inside PostgreSQL.

---

# Transactional Email

Rosterly integrates with **Resend** for transactional email.

The email workflow is used for account-related operations such as:

```text
Forgot Password
      │
      ▼
Generate Reset Token
      │
      ▼
Send Email
      │
      ▼
Reset Password
```

Password-reset responses are intentionally generic to reduce account enumeration.

---

# Audit Trail

Rosterly maintains a persistent audit trail for important system operations.

Audit records can contain:

* Entity type
* Entity ID
* Action
* Performing user
* Performing role
* Description
* Timestamp

Examples of auditable operations include:

* Employee changes
* Department changes
* Attendance operations
* Leave operations
* Payroll operations
* Account operations

The frontend provides an Activity page for authorized users.

API endpoint:

```text
GET /api/v1/audit-logs
```

---

# Authentication Architecture

The authentication flow uses JWT access tokens and rotating refresh tokens.

```text
                LOGIN
                  │
                  ▼
          Validate Credentials
                  │
                  ▼
        ┌────────────────────┐
        │ Access Token       │
        │ Refresh Token      │
        └────────────────────┘
                  │
                  ▼
             API Request
                  │
                  ▼
          JWT Authentication
                  │
                  ▼
          Role Authorization
```

Refresh-token rotation works conceptually as:

```text
Refresh Request
      │
      ▼
Validate Refresh Token
      │
      ├── Invalid ──► Reject
      │
      ▼
Check Revocation
      │
      ├── Revoked ──► Reject
      │
      ▼
Revoke Existing Token
      │
      ▼
Issue New Token Pair
```

Refresh tokens contain a unique `jti` and revoked tokens are persisted.

Password changes can invalidate previously issued sessions using the user's token-valid-after timestamp.

---

# Security

Security mechanisms include:

* Spring Security
* JWT authentication
* BCrypt password hashing
* Refresh-token rotation
* Refresh-token revocation
* Token invalidation after password changes
* Role-based authorization
* Manager-scoped authorization
* Method-level `@PreAuthorize`
* Authentication rate limiting
* CORS configuration
* Security headers
* HSTS
* Referrer policy
* Frame protection
* Generic password-reset responses
* Server-side validation
* Database constraints
* Soft deletion

The application does not rely solely on frontend role checks for authorization.

---

# Concurrency & Data Integrity

Rosterly uses optimistic locking with JPA `@Version` on important domain entities.

This helps detect conflicting updates such as:

```text
User A reads employee
       │
       ▼
Employee version = 5

User B updates employee
       │
       ▼
Employee version = 6

User A attempts stale update
       │
       ▼
Conflict detected
```

Database constraints additionally protect invariants such as:

* Unique employee email
* Unique employee code
* Unique department name
* One attendance record per employee/day
* One leave balance per employee/type/year
* One payslip per employee/month

---

# Self-Serve Onboarding

Rosterly includes a public registration flow.

New registrations receive a default employee-level role rather than being able to register themselves as privileged users.

The intended onboarding model supports automatically associating a newly registered account with an existing HR employee record based on matching email.

> **Implementation note:** the repository currently contains the auto-linking helper, but the registration flow does not yet invoke it. Therefore, the automatic email-match onboarding should be wired into the registration path before describing this behavior as fully implemented.

This distinction is intentionally documented rather than claiming functionality that the current execution path does not provide.

---

# Engineering Practices

Rosterly was built with backend engineering practices beyond basic CRUD.

## Layered Architecture

```text
Controller
    │
    ▼
Service
    │
    ▼
Repository
    │
    ▼
PostgreSQL
```

Controllers handle HTTP concerns while business logic remains inside services.

---

## DTO-Based API

The API uses DTOs instead of directly exposing JPA entities.

```text
Database Entity
       │
       ▼
     Mapper
       │
       ▼
     DTO
       │
       ▼
    REST API
```

This provides a cleaner boundary between persistence and API contracts.

---

# Database Migrations

Rosterly uses **Flyway** for database schema management.

Migration history includes areas such as:

```text
V1  Initial schema
V2  Self-registration + audit + optimistic locking
V3  Employee photo metadata
V4  Attendance
V5  Leave management
V6  Payroll
V7  Revoked refresh tokens
V8  Token-valid-after support
```

Hibernate is configured to validate the schema rather than automatically modify it:

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: validate
```

This keeps database changes explicit and version controlled.

---

# Testing

The backend includes both unit and integration testing.

## Unit Tests

JUnit and Mockito are used for service-level testing.

Examples include:

```text
AttendanceServiceTest
DepartmentServiceTest
EmployeeServiceTest
JwtServiceTest
LeaveServiceTest
PayrollServiceTest
```

These tests cover business rules and service behavior without requiring a full application deployment.

---

# Integration Testing

Integration testing uses **Testcontainers** with a real PostgreSQL container.

```text
JUnit
  │
  ▼
Spring Boot Test
  │
  ▼
Testcontainers
  │
  ▼
PostgreSQL Container
  │
  ▼
Real Database Queries
```

This helps verify database behavior that an in-memory database may not reproduce accurately.

Example:

```bash
cd backend
mvn -Dtest=EmployeeIntegrationTest test
```

Docker must be running for Testcontainers-based tests.

---

# Code Coverage

JaCoCo is used for backend code coverage.

After running tests:

```text
backend/target/site/jacoco/index.html
```

The coverage report is also collected by CI.

---

# CI/CD

GitHub Actions automates the project's validation and build process.

The pipeline includes:

```text
                    Git Push / PR
                         │
                         ▼
                 ┌───────────────┐
                 │ GitHub Actions │
                 └───────┬───────┘
                         │
             ┌───────────┴───────────┐
             ▼                       ▼
        Backend Checks          Frontend Checks
             │                       │
       ┌─────┴─────┐           ┌─────┴─────┐
       │ Maven Test│           │ npm ci    │
       │ Package   │           │ ESLint    │
       │ JaCoCo    │           │ TypeScript│
       └───────────┘           └───────────┘
             │                       │
             └───────────┬───────────┘
                         ▼
                  Docker Build
                         │
                         ▼
                    GHCR Publish
```

Dependabot is configured for dependency updates across:

* Maven
* npm
* GitHub Actions

---

# Tech Stack

## Backend

| Technology            | Purpose                        |
| --------------------- | ------------------------------ |
| **Java 21**           | Backend language               |
| **Spring Boot 3**     | Backend framework              |
| **Spring Web**        | REST APIs                      |
| **Spring Security**   | Authentication & authorization |
| **Spring Data JPA**   | Database access                |
| **PostgreSQL**        | Relational database            |
| **Flyway**            | Database migrations            |
| **JJWT**              | JWT handling                   |
| **MapStruct**         | DTO mapping                    |
| **Lombok**            | Boilerplate reduction          |
| **Bucket4j**          | Rate limiting                  |
| **OpenPDF**           | PDF generation                 |
| **Cloudinary**        | Image storage                  |
| **Resend**            | Transactional email            |
| **Springdoc OpenAPI** | API documentation              |

## Frontend

| Technology          | Purpose                 |
| ------------------- | ----------------------- |
| **React**           | UI                      |
| **TypeScript**      | Type safety             |
| **Vite**            | Frontend tooling        |
| **React Router**    | Routing                 |
| **TanStack Query**  | Server-state management |
| **Axios**           | HTTP client             |
| **React Hook Form** | Form management         |
| **Zod**             | Validation              |
| **Tailwind CSS**    | Styling                 |
| **Framer Motion**   | Animations              |
| **Recharts**        | Data visualization      |
| **Lucide React**    | Icons                   |

## DevOps & Testing

* Docker
* Docker Compose
* GitHub Actions
* GitHub Container Registry
* Dependabot
* JUnit
* Mockito
* Testcontainers
* JaCoCo
* Render
* Vercel

---

# Project Architecture

```text
Rosterly
│
├── Frontend
│   │
│   ├── React
│   ├── TypeScript
│   ├── Vite
│   ├── TanStack Query
│   └── Tailwind CSS
│
│              HTTPS
│                │
│                ▼
│
├── Backend
│   │
│   ├── Controllers
│   ├── Services
│   ├── Repositories
│   ├── Security
│   ├── DTOs
│   ├── Validation
│   └── Audit
│
│                │
│                ▼
│
├── PostgreSQL
│   │
│   └── Flyway migrations
│
├── Cloudinary
│   └── Employee photos
│
└── Resend
    └── Transactional email
```

---

# Project Structure

```text
rosterly/
│
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/hrplatform/
│   │   │   │
│   │   │   └── resources/
│   │   │       └── db/migration/
│   │   │
│   │   └── test/
│   │
│   ├── Dockerfile
│   ├── pom.xml
│   └── .java-version
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── pages/
│   │
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── .nvmrc
│
├── scripts/
│   ├── check-env.js
│   ├── reset-db.js
│   └── reset-db.sh
│
├── .github/
│   └── workflows/
│       ├── ci-cd.yml
│       ├── deploy.yml
│       ├── dependabot.yml
│       └── keep-alive.yml
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

# API

All application endpoints are versioned under:

```text
/api/v1
```

Main API groups:

| Module         | Endpoint              |
| -------------- | --------------------- |
| Authentication | `/api/v1/auth`        |
| Users          | `/api/v1/users`       |
| Employees      | `/api/v1/employees`   |
| Departments    | `/api/v1/departments` |
| Dashboard      | `/api/v1/dashboard`   |
| Attendance     | `/api/v1/attendance`  |
| Leave          | `/api/v1/leave`       |
| Holidays       | `/api/v1/holidays`    |
| Payroll        | `/api/v1/payroll`     |
| Audit Logs     | `/api/v1/audit-logs`  |

OpenAPI documentation is available when the backend is running:

```text
http://localhost:8080/swagger-ui.html
```

---

# Running Locally

## Prerequisites

Install:

* Java 21
* Maven 3.9+
* Node.js 20+
* npm
* Docker Desktop / Docker Engine
* Docker Compose

---

## Clone

```bash
git clone <GITHUB_REPO_URL>

cd Employee_Management_System
```

---

## Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

At minimum configure:

```env
JWT_SECRET=your-long-random-secret

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-strong-password
```

Optional integrations:

```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

RESEND_API_KEY=
MAIL_FROM_ADDRESS=
MAIL_FROM_NAME=
```

Never commit real credentials.

---

# Docker Development

Start the complete application:

```bash
docker compose up --build
```

Typical local services:

```text
Frontend
http://localhost:5173

Backend
http://localhost:8080

Swagger
http://localhost:8080/swagger-ui.html

PostgreSQL
localhost:5433
```

---

# Run Backend Separately

Start PostgreSQL:

```bash
docker compose up -d postgres
```

Then:

```bash
cd backend
mvn spring-boot:run
```

---

# Run Frontend Separately

```bash
cd frontend
npm install
npm run dev
```

The Vite development server proxies API requests to the backend.

---

# Environment Variables

The project uses `.env.example` as the configuration template.

| Variable                | Description                    |
| ----------------------- | ------------------------------ |
| `JWT_SECRET`            | Secret used to sign JWTs       |
| `ADMIN_EMAIL`           | Initial administrator email    |
| `ADMIN_PASSWORD`        | Initial administrator password |
| `SEED_DEMO_DATA`        | Enables demo data              |
| `FRONTEND_URL`          | Frontend URL                   |
| `DB_URL`                | PostgreSQL JDBC URL            |
| `DB_USERNAME`           | Database username              |
| `DB_PASSWORD`           | Database password              |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name          |
| `CLOUDINARY_API_KEY`    | Cloudinary API key             |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret          |
| `RESEND_API_KEY`        | Resend API key                 |
| `MAIL_FROM_ADDRESS`     | Email sender                   |
| `MAIL_FROM_NAME`        | Email sender name              |
| `CORS_ALLOWED_ORIGINS`  | Allowed frontend origins       |

---

# Database

Rosterly uses PostgreSQL.

Flyway manages schema changes.

```text
Application
     │
     ▼
Hibernate / JPA
     │
     ▼
PostgreSQL
     ▲
     │
   Flyway
```

Hibernate validates the schema:

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: validate
```

Database structure therefore remains controlled by migration files instead of automatic Hibernate schema generation.

---

# Database Reset

If the local PostgreSQL volume was created with old credentials, changing `.env` will not modify the existing database volume.

Use:

```bash
npm run reset-db
```

or:

```bash
npm run reset-db
```

> **Warning:** resetting the database is destructive and removes local Docker database data.

---

# Deployment

Rosterly uses:

```text
Frontend → Vercel
Backend  → Render
Database → PostgreSQL
Photos   → Cloudinary
Email    → Resend
```

Architecture:

```text
                  ┌─────────────────┐
                  │     Vercel      │
                  │ React Frontend  │
                  └────────┬────────┘
                           │
                           │ HTTPS
                           ▼
                  ┌─────────────────┐
                  │     Render      │
                  │ Spring Boot API │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │   PostgreSQL    │
                  └─────────────────┘

                       External
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
         Cloudinary                 Resend
        Photo Storage          Transactional Email
```

---

# Live Demo

**Frontend:** `<VERCEL_LIVE_DEMO_URL>`

**Backend:** `<RENDER_BACKEND_URL>`

**GitHub:** `<GITHUB_REPO_URL>`

Replace the placeholders above with the actual deployed URLs.

---

# Engineering Highlights

The main engineering challenges in Rosterly were not the CRUD screens themselves.

The project focuses on connecting multiple domains safely:

```text
             Authentication
                   │
                   ▼
              Employees
                   │
          ┌────────┼────────┐
          ▼        ▼        ▼
      Hierarchy Attendance Leave
          │        │        │
          └────────┼────────┘
                   ▼
                Payroll
                   │
                   ▼
              Payslips
                   │
                   ▼
              Audit Trail
```

This creates dependencies between otherwise separate modules.

For example:

* Attendance affects payroll deductions.
* Approved leave affects leave balances.
* Unpaid leave affects payroll.
* Employee managers determine manager-scoped authorization.
* Employee deletion affects hierarchy validation.
* Account roles determine which employee information a user can access.
* Payroll state determines whether salary information can still be modified.
* Important state changes are recorded in the audit trail.

The goal was therefore to build the application around **business rules and authorization boundaries**, rather than simply exposing database tables through REST endpoints.

---

# Known Implementation Notes

## Automatic Employee Linking

The repository contains an `tryAutoLinkEmployee(...)` helper intended to automatically link a newly registered user to an existing employee record using a matching email address.

However, the current registration flow does not invoke that helper.

Therefore:

```text
Self Registration
       │
       ▼
Account Created
       │
       ▼
Default Employee Role
```

The automatic email-match linking is currently an implementation gap rather than something that should be claimed as fully operational.

This is documented intentionally so the README reflects the actual codebase.

---

## Employee Code Generation

Employee codes follow a format similar to:

```text
EMP-000001
EMP-000002
EMP-000003
```

The implementation uses a count-based candidate with uniqueness retry.

This is sufficient for the portfolio application's intended scale, but a database sequence/identity-based strategy would be preferable for high-concurrency production systems.

---

## Payroll Disclaimer

Payroll calculations are implemented specifically for this project.

They include configured calculations for:

* PF
* Professional tax
* Unpaid leave
* Absence
* Salary components

They should **not** be interpreted as a complete statutory Indian payroll/tax engine.

---

# Future Improvements

Potential future improvements include:

* Complete automatic employee linking during registration
* Configurable payroll policies
* Configurable leave policies
* Employee bulk import
* More extensive integration testing
* Frontend end-to-end testing
* Richer analytics
* Advanced HR reports
* Organization-level configuration
* Production-grade backup/recovery documentation
* More granular audit-log permissions
* Additional external-service integration tests

---

# Why Rosterly?

Rosterly was built to explore what happens when a typical CRUD application grows into a system with interconnected business rules.

Instead of treating:

```text
Employees
Attendance
Leave
Payroll
Authentication
```

as isolated modules, the project connects them into one workflow.

For example:

```text
Employee
   │
   ▼
Attendance ──────┐
   │             │
   ▼             ▼
Leave ────────► Payroll
                  │
                  ▼
               Payslip
                  │
                  ▼
             Audit Trail
```

That required working with:

* Spring Security
* JWT authentication
* Authorization boundaries
* JPA/Hibernate
* PostgreSQL
* Flyway migrations
* Transactional service logic
* Optimistic locking
* Database constraints
* Integration testing
* Docker
* CI/CD

The project was built primarily to strengthen my **Java backend engineering** skills while creating a realistic full-stack HR workflow.

---

# License

This project is currently a portfolio project.

If distributing the repository publicly, add the appropriate license here.

---

## Author

**Asad Khan**

B.Tech IT — Final Year

Interested in:

* Java Backend Development
* Spring Boot
* Distributed Systems
* Databases
* AI/ML
* Software Engineering
