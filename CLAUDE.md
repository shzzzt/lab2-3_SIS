# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Student Information Management system made of two separate apps in one repo:

- **Laravel 13 REST API** (repo root): PHP 8.3, PostgreSQL (SQLite works for local dev), JWT auth (`tymon/jwt-auth`), TOTP MFA (`spomky-labs/otphp`), OpenAPI via `darkaonline/l5-swagger`. All routes are under `/api/v1` in `routes/api.php`.
- **React client** (`student-frontend/`): React 18 + TypeScript, Vite, TanStack Query, React Router 7, react-hook-form + zod, Axios, Tailwind 3. It has its own `package.json`, `node_modules`, and `.env` (`VITE_API_BASE_URL`, default `http://127.0.0.1:8000/api/v1`).

The root `package.json`/Vite/Tailwind 4 setup is only Laravel's default asset pipeline; the real UI lives in `student-frontend/`.

## Commands

Backend (repo root):

```powershell
php artisan serve --host=127.0.0.1 --port=8000
php artisan test                         # Pest; SQLite in-memory via phpunit.xml
php artisan test --filter=EnrollmentGradeTest   # single file/test
vendor/bin/pint                          # code style
php artisan migrate:fresh --seed         # local only; seeder wipes academic data
php artisan l5-swagger:generate          # regenerate after editing app/Docs/*
```

Frontend (`student-frontend/`):

```powershell
npm run dev
npm run lint
npm run build      # tsc -b && vite build
npm test           # vitest; single file: npx vitest run src/path/to/file.test.tsx
npm run test:e2e   # Playwright against a live seeded API; needs E2E_API_TESTS=1, E2E_EMAIL, E2E_PASSWORD
```

`npm start` at the root (`scripts/start.mjs`) launches both servers but relies on `lsof`, so it does not work on Windows; start the two servers separately there.

Seeded accounts (password `password`): `admin@`, `registrar@`, `faculty@`, `student@example.com`.

## Backend architecture

- **Request flow**: route → middleware stack → FormRequest (`app/Http/Requests`, extending `ApiFormRequest`) → thin controller → service in `app/Services` holding the business logic and queries → model.
- **Middleware on every authenticated route**: `auth:api` (JWT), `ActiveAccount` (rejects inactive/suspended users, including existing tokens), `SecurityAccess` (enforces session duration, required-MFA restriction, and per-role module permissions from `SecurityPolicy`). `role:` (`RoleMiddleware`) gates route groups; object-level ownership checks (e.g. students only see their own record, faculty only their assigned offerings) live in services/`StudentPolicy`.
- **Roles**: `admin` handles user accounts, settings, security policy, and audit logs only, with no academic endpoints. `registrar` handles academic CRUD. `faculty` (the instructor role) sees assigned offerings and grades them. `student` sees their own data. `advisor` exists in routes but its collections are not safely scoped.
- **Response envelope**: `{ success, message, data }`; validation errors are `{ success: false, errors: { field: [...] } }`. Use the `Concerns\ApiResponse` trait (`success()`/`failure()`) in controllers. Duplicate enrollments throw `DuplicateEnrollmentException` → `409`.
- **Auditing**: `AuditObserver` + `AuditLogger` record model changes; `AuditTransaction` middleware wraps academic writes so the write and its audit entry share a transaction. Never log passwords, hashes, remember tokens, or JWTs.
- **OpenAPI**: annotations live in `app/Docs/`, one class per endpoint group plus shared `InputSchemas`/`ResourceSchemas`/`ResponseSchemas`. Keep them in sync when changing endpoints.

## Frontend architecture

`React Router → pages → TanStack Query hooks (src/hooks) → resource API modules (src/api) → Axios client (src/api/client.ts)`. `AuthContext` restores the user from the bearer token; `ProtectedRoute` handles auth and role gating. The client clears credentials on `401` and routes `403` to the forbidden page. Frontend role checks are UX only, and the API is the security boundary. See `docs/frontend-architecture.md` and `docs/api-integration-map.md`.

## Docs

`docs/erd.dbml` (schema), `docs/postman/` (API collection), and `docs/ai-development-log.md` (task/tool/result/human-review/evidence history kept for the course submission).
