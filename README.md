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
