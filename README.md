# Frontend

Single React application for platform admin, institution, branch, office staff, and parent portal experiences.

## Commands

```sh
npm install
npm run dev
npm run typecheck
npm test
npm run build
```

The frontend communicates with the backend through `VITE_API_BASE_URL`.

## Structure Rules

- Module code lives under `src/modules/<module>/`.
- Shared frontend-only code lives under `src/shared/`.
- Reusable UI components may remain under `src/components/`.
- Module API files must call through `src/api/client/apiClient.ts`; do not create separate fetch or Axios clients.
- The frontend must not connect directly to Supabase business tables.

Frontend schemas = form and UI validation.
Backend schemas = API request and response validation.
Backend models = SQLAlchemy persistence definitions.
Alembic migrations = actual PostgreSQL schema changes.

Frontend schemas under `src/shared/schemas/` or `src/modules/<module>/schemas/` are for UI forms, filters, and optional response validation only. They are not authoritative business schemas and are not database schemas.

## Authentication

The frontend uses a backend-owned username/password login flow. It submits credentials only to FastAPI and receives an application access token from the backend after credential verification.

Required local values:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

The public home page lets users choose a portal. Portal choice controls headings and preferred destination only; the backend decides the actual role, permissions, tenant, branch, and modules.

The signup option is an account-request flow. It does not grant access automatically and depends on the backend `sms_signup_requests` extension table being manually created.

The central API client attaches:

```text
Authorization: Bearer <application-access-token>
X-Access-Assignment-ID: <selected-assignment-id>
```

The frontend must not use Supabase to read or write application `sms_*` tables, and it must not contain backend database URLs, password hashes, or application token signing secrets.

## Fee Module Checkpoint

The Fees navigation entry now opens `src/modules/fees/pages/FeesPage.tsx`.

The page reads real fee account data from:

```text
GET /api/v1/fees/accounts
```

It shows totals and account rows returned by the backend. It does not create fake finance data, post payments, generate receipts or approve adjustments yet.

Users with `fee.basic_assign` can open the setup modal and create the first fee account for an active enrollment. The frontend sends only enrollment and amount inputs; the backend derives tenant, branch, student and academic year from the protected context and enrollment.
