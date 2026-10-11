<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="400" alt="Laravel Logo"></a></p>

<p align="center">
<a href="https://github.com/laravel/framework/actions"><img src="https://github.com/laravel/framework/workflows/tests/badge.svg" alt="Build Status"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/dt/laravel/framework" alt="Total Downloads"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/v/laravel/framework" alt="Latest Stable Version"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/l/laravel/framework" alt="License"></a>
</p>

## Quick local start (macOS / Linux)

After installing dependencies and preparing the database, start both the API and
the React student client from the repository root:

```bash
npm start
```

Open `http://127.0.0.1:5173`. The API runs at `http://127.0.0.1:8000`.
For a seeded local database, sign in with `admin@example.com` / `password`.
The launcher reuses servers already running from this project and starts only
missing servers. Repeating `npm start` is safe. It refuses to reuse a port owned
by another project. Press Ctrl+C to stop servers started in that terminal.
This local launcher uses `lsof`, which is included with macOS.

Install the two separate sets of JavaScript dependencies on a fresh checkout:

```bash
npm ci
npm --prefix student-frontend ci
```

For local development without PostgreSQL, set `DB_CONNECTION=sqlite` and
`DB_DATABASE=database/database.sqlite` in `.env`, then run:

```bash
touch database/database.sqlite
php artisan config:clear
php artisan migrate
```

On a **new, empty local database only**, run `php artisan db:seed` to add demo
accounts and records. The seeder deletes existing academic data.
Ensure `APP_KEY` and `JWT_SECRET` are configured using the setup instructions below.
The React client defaults to `http://127.0.0.1:8000/api/v1`; override this with
`VITE_API_BASE_URL` in `student-frontend/.env` if needed.

## About Laravel

Laravel is a web application framework with expressive, elegant syntax. We believe development must be an enjoyable and creative experience to be truly fulfilling. Laravel takes the pain out of development by easing common tasks used in many web projects, such as:

- [Simple, fast routing engine](https://laravel.com/docs/routing).
- [Powerful dependency injection container](https://laravel.com/docs/container).
- Multiple back-ends for [session](https://laravel.com/docs/session) and [cache](https://laravel.com/docs/cache) storage.
- Expressive, intuitive [database ORM](https://laravel.com/docs/eloquent).
- Database agnostic [schema migrations](https://laravel.com/docs/migrations).
- [Robust background job processing](https://laravel.com/docs/queues).
- [Real-time event broadcasting](https://laravel.com/docs/broadcasting).

Laravel is accessible, powerful, and provides tools required for large, robust applications.

## Learning Laravel

Laravel has the most extensive and thorough [documentation](https://laravel.com/docs) and video tutorial library of all modern web application frameworks, making it a breeze to get started with the framework.

In addition, [Laracasts](https://laracasts.com) contains thousands of video tutorials on a range of topics including Laravel, modern PHP, unit testing, and JavaScript. Boost your skills by digging into our comprehensive video library.

You can also watch bite-sized lessons with real-world projects on [Laravel Learn](https://laravel.com/learn), where you will be guided through building a Laravel application from scratch while learning PHP fundamentals.

## Agentic Development

Laravel's predictable structure and conventions make it ideal for AI coding agents like Claude Code, Cursor, and GitHub Copilot. Install [Laravel Boost](https://laravel.com/docs/ai) to supercharge your AI workflow:

```bash
composer require laravel/boost --dev

php artisan boost:install
```

Boost provides your agent 15+ tools and skills that help agents build Laravel applications while following best practices.

## Contributing

Thank you for considering contributing to the Laravel framework! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## Student API setup

Install dependencies and configure the application:

```powershell
composer install
Copy-Item .env.example .env
php artisan key:generate
php artisan jwt:secret
```

Set these PostgreSQL values in `.env`:

```dotenv
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=student_information_api
DB_USERNAME=student_api_user
DB_PASSWORD=your_password
```

Run the database, generate the OpenAPI document, and start Laravel:

```powershell
php artisan migrate
php artisan l5-swagger:generate
php artisan serve
```

Swagger UI: `http://localhost:8000/api/docs` (or `http://localhost:8000/api/documentation`, which redirects to the same page)

JWT endpoints:

- `POST /api/v1/auth/login` with `email` and `password`
- `GET /api/v1/auth/me` with a bearer token
- `POST /api/v1/auth/logout` with a bearer token

Use `Authorization: Bearer <access_token>` for protected endpoints. Passwords must be stored as bcrypt hashes; the application uses the `BCRYPT_ROUNDS` setting when creating hashes.

## CRUD resources

All resource endpoints require a bearer JWT and return `{ success, message, data }`.

- `/api/v1/students`: list, create, retrieve, update, and deactivate students. List supports `search`, `program_id`, `year_level`, `status`, `sort`, `direction`, and `per_page`.
- `/api/v1/programs`: list, create, retrieve, update, and delete programs. List supports `search`, `degree_level`, `status`, `sort`, `direction`, and `per_page`.
- `/api/v1/courses`: list, create, retrieve, update, and delete courses. List supports `search`, `program_id`, `status`, `sort`, `direction`, and `per_page`.
- `/api/v1/academic-terms`: list, create, retrieve, update, and delete academic terms. List supports `search`, `term_type`, `academic_year`, `status`, `sort`, `direction`, and `per_page`.
- `/api/v1/course-offerings`: standard CRUD for course, academic-term, and instructor links. `capacity` must be greater than zero; instructors use the existing `faculty` user role.
- `/api/v1/enrollments`: list, create, retrieve, patch, and delete enrollments. Duplicate student/offering pairs return `409 Conflict`.
- `/api/v1/grades`: list, create, retrieve, and update grades. Numeric grades use the `0-100` range and only the assigned offering instructor can create or update them.
- `/api/v1/students/{id}/enrollments`, `/api/v1/students/{id}/grades`, and `/api/v1/course-offerings/{id}/students`: nested enrollment and grade lookups.
- `/api/v1/students/{id}/academic-record`: returns enrollments grouped by academic term with grades attached.

Validation failures use `{ success: false, errors: { field: [messages] } }`.

## Administration

Admins use **User accounts** to create accounts, edit names and email addresses,
reset passwords, assign roles, and activate or suspend accounts. Accounts linked
to student records or teaching assignments retain their role until those records
are reassigned. Admins cannot deactivate or demote themselves.

**System settings** controls the institution name, support email, colour theme
(`teal`, `indigo`, `forest`, `plum`, `sunset`, or `graphite`), and logo displayed in
the application. These settings persist in the database. Logos must be PNG, JPEG,
or WebP images up to 512 KB and are stored with the settings; audit entries record
only whether a custom logo is set, not the image itself.

Administration endpoints (admin only): `GET/POST /api/v1/admin/users`,
`PATCH /api/v1/admin/users/{user}`, `GET/PUT /api/v1/admin/settings`, and
`POST/DELETE /api/v1/admin/settings/logo` (multipart field `logo`).
All active users can read display settings at `GET /api/v1/system-info`.
`GET /api/v1/branding` is public (no token) and returns only the institution name,
theme, and logo so the sign-in page can be branded.
Inactive, pending, and suspended accounts cannot log in or use existing tokens.

### Security and access control

Admins use **Security & access** (`/admin/security`) to configure:

- Minimum password length for new and reset passwords (8–128 characters).
- Absolute session duration (5–480 minutes), including existing sessions when reduced.
- Failed login attempt limits and temporary lockout duration.
- Required authenticator-app MFA by role.
- None/read/manage module permissions within each role's existing responsibilities.

All users can enroll through **Profile → Security & sign-in** (`/profile#security`). Enter the current
password, scan the locally rendered QR code, and confirm an authenticator code.
Save the eight recovery codes shown once; each replaces a verification code once.
Secrets are encrypted using the application key and recovery codes are hashed.
Used authenticator codes cannot be replayed. Enabling/disabling MFA and password
resets invalidate older sessions. Required MFA cannot be disabled by the user.
MFA is optional by default; no existing demo account is forced to enroll.
Admins must enroll themselves before requiring MFA for the Admin role.

Policy edits require the admin's current password and are audited. Administrative
permissions remain fixed to prevent lockout; academic permissions cannot grant
Admin registrar duties or let students/faculty bypass ownership restrictions.
The backend enforces policy on every request. Refresh or sign in again to update
navigation after another administrator changes your role's permissions.

Endpoints: `GET/PUT /api/v1/admin/security`, `GET /api/v1/security/mfa`, and
`POST /api/v1/security/mfa/{setup,confirm,disable,recovery}`. Login returns
`202 {mfa_required: true}` after a correct password for an enrolled account;
resubmit email/password with `code` to complete sign-in. No access token is
issued until verification succeeds. Users required to enroll receive restricted
access to MFA setup until enrollment is complete.

### Audit history

Admins can open **Audit logs** (`/admin/audit-logs`) to review authenticated
account and academic record creation, updates and deletion, system setting
changes, successful/failed credential-based logins, and logout. The read-only
`GET /api/v1/admin/audit-logs` endpoint supports `search`, `action`, `from`, `to`,
and `page` (25 entries per page). Dates are filtered in UTC; the UI displays
local browser times. Entries preserve the actor name and role at the time of
an action and before/after values for changed fields. Failed logins are marked
unauthenticated; submitted credentials are never stored.

Passwords, password hashes, remember tokens, and JWTs are excluded; password
resets record only a boolean indicator. Academic writes and their audit entries
share a database transaction. There are no application routes for modifying or
deleting history. This is application-level history, not tamper-proof storage
against direct database access. History begins when the migration is installed;
seed/import jobs without an authenticated actor and direct SQL writes are not
captured, and old activity cannot be reconstructed.

## Authorization

All API resources require a JWT. Role middleware and object-level checks enforce:

- `admin`: manages user accounts, roles, account status, and institution settings through `/admin/users` and `/admin/settings`. Cannot access academic management endpoints.
- `registrar`: manages students, programs, courses, terms, offerings, and enrollments.
- `faculty`: views only assigned course offerings and manages grades only for those offerings. The existing `faculty` database role is the instructor role.
- `student`: views only the linked student profile, enrollments, grades, and academic record. Changing the student ID in the URL returns `403`.

Missing route-model resources return `404`; authenticated but unauthorized access returns `403`.

## Project setup

This repository contains the Laravel REST API for a Student Information Management system. It uses PostgreSQL, JWT authentication, OpenAPI/Swagger, and Vite-managed frontend assets.

### Prerequisites

- PHP 8.3 or newer with the PostgreSQL extension enabled
- Composer 2
- PostgreSQL 14 or newer
- Node.js 20 or newer and npm

### Install

```powershell
composer install
Copy-Item .env.example .env
php artisan key:generate
php artisan jwt:secret
npm install
```

Configure `.env` with a PostgreSQL database that already exists:

```dotenv
APP_URL=http://127.0.0.1:8000
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=student_information_api
DB_USERNAME=student_api_user
DB_PASSWORD=your_local_password
JWT_TTL=60
BCRYPT_ROUNDS=12
```

`.env.example` contains placeholders only. Do not commit `.env`, `APP_KEY`, `JWT_SECRET`, or database passwords.

### Database and seed data

```powershell
php artisan migrate
php artisan db:seed
```

For a clean local database:

```powershell
php artisan migrate:fresh --seed
```

### Run the application

```powershell
php artisan serve --host=127.0.0.1 --port=8000
```

The API is available at `http://127.0.0.1:8000/api/v1`. Generate frontend assets when needed with `npm run build`; use `npm run dev` for Vite development.

### Run the frontend client

In a second PowerShell terminal:

```powershell
Set-Location student-frontend
npm install
Copy-Item .env.example .env
npm run dev
```

The frontend reads `VITE_API_BASE_URL` from `student-frontend/.env`; the default points to the Laravel API above. Keep the local `.env` file private and do not commit it.

### Frontend checks

From `student-frontend/`, run:

```powershell
npm run lint
npm run build
npm test
```

The Playwright tests under `tests/e2e/` exercise the running Laravel API without API mocks. Start Laravel in another terminal and use seeded local test data, then enable the live checks in the frontend terminal:

```powershell
$env:E2E_API_TESTS = "1"
$env:E2E_EMAIL = "registrar@example.com"
$env:E2E_PASSWORD = "password"
npx playwright install chromium
npm run test:e2e
```

The real API smoke tests cover successful login and live dashboard counts, invalid credentials, and mobile navigation to the live enrollment list. Store screenshots and the Playwright report in the submission evidence folder after running them against the local seeded API.

### Authentication

1. Call `POST /api/v1/auth/login` with an email and password.
2. Copy `access_token` from the response.
3. Send `Authorization: Bearer <access_token>` to protected endpoints.
4. Call `POST /api/v1/auth/logout` to revoke the token.

Seeded local accounts all use the password `password`:

| Role | Email |
| --- | --- |
| Admin | `admin@example.com` |
| Registrar | `registrar@example.com` |
| Faculty/instructor | `faculty@example.com` |
| Student | `student@example.com` |

Change or remove seeded credentials before using the application outside local development.

### Swagger/OpenAPI

Generate the specification after changing OpenAPI attributes:

```powershell
php artisan l5-swagger:generate
```

Open Swagger UI at `http://127.0.0.1:8000/api/docs` (`/api/documentation` redirects to the same page and the raw specification is served from `/docs`).

The specification covers every endpoint group: authentication, students, programs, courses, academic terms, course offerings, enrollments (including `/students/{id}/enrollments` and `/course-offerings/{id}/students`), grades (including `/students/{id}/grades`), the academic record, and the user directory. Annotations live in `app/Docs/`, one class per endpoint group, together with the shared request, resource, and response schemas referenced by `#/components/schemas`.

### Tests

```powershell
php artisan test
```

The test suite uses the SQLite in-memory database configured in `phpunit.xml` and refreshes migrations between tests. It covers authentication, CRUD, validation, authorization, duplicate enrollment conflicts, grade permissions, collections, search, filtering, sorting, and pagination.

### API collection and ERD

- Import [docs/postman/student-information-api.postman_collection.json](docs/postman/student-information-api.postman_collection.json) into Postman or Insomnia. Run one of **Authentication > Login as Admin / Registrar / Faculty / Student** first; it saves the token automatically and every request then runs as that user. Use **Me** to check who is logged in.
- Copy [docs/erd.dbml](docs/erd.dbml) into [dbdiagram.io](https://dbdiagram.io/) to render the database relationship diagram.
- Review [docs/ai-development-log.md](docs/ai-development-log.md) for the task, tool, result, human-review, and evidence history.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
