# Admin API Backend Guide

This document describes the API endpoints and backend requirements needed to support the Admin Dashboard in the frontend repository. The goal is to allow a single initial admin to be created, and for that admin to authenticate and manage users, organizations, applications, onboarding documents and steps, and system logs.

Target audience: Backend engineers responsible for implementing or verifying these endpoints.

---

## Summary of requirements

- A secure admin authentication flow with token issuance for admin users.
- An initial "create first admin" flow (frontend provides `/admin/setup` page) that can create a user and set the `role: 'admin'` in the database.
- Endpoints to list and search users, organizations, and applications (with filters/pagination).
- Admin-only endpoints for verifying documents and approving onboarding steps.
- All admin endpoints must require an admin token (see Auth requirements below).

---

## Authentication / Authorization

- Admin endpoints MUST require a valid admin token in the `token` header (the frontend uses `localStorage.accessToken` and sends the token in the `token` header).
- Tokens are issued by the auth/login or auth/sign-in endpoints and must carry the user's role claims.
- Admin endpoints should verify the token and ensure the user's role is `admin`.
- Example header:

```
token: <JWT or admin session token>
Content-Type: application/json
```

- Optionally support Basic auth for internal API calls using API user / API password; however the admin dashboard expects `token` header auth for admin operations.

---

## First admin creation (setup)

Frontend behavior:
- The `/admin/setup` page calls the public signup endpoint to create a user, then expects the backend to mark that account as an admin (or the backend can provide a dedicated admin register endpoint).

Backend options:
1. Add a dedicated endpoint:
   - POST `/api/users/admin/register`
   - Body: { username, email, password, firstName?, lastName? }
   - Creates a user with `role: 'admin'` and returns token + user object.
   - Returns HTTP 201 on success with { data: { user, token } }

2. Or: allow the frontend to call `/api/auth/sign-up` then immediately call an admin-only endpoint to promote the created user to admin. This requires a bootstrap secret or process to allow the first user to be promoted automatically.

Recommended: Implement option 1 for clarity and security.

---

## Required Admin Endpoints (detailed)

This section lists the endpoints the frontend admin UI expects, with suggested request/response shapes and notes.

1) Register admin (recommended)
- POST `/api/users/admin/register`
- Auth: public or protected by a bootstrap secret (only for first admin)
- Body:
  ```json
  {
    "username": "admin",
    "email": "admin@example.com",
    "password": "securePass",
    "firstName": "Admin",
    "lastName": "User"
  }
  ```
- Response 201:
  ```json
  {
    "success": true,
    "data": {
      "user": { "id": "...", "email": "admin@example.com", "role": "admin", "username": "admin" },
      "token": "<admin-token>"
    }
  }
  ```
- Notes: The response should include a token and the user object with `role: 'admin'`.

2) Find / List users
- GET `/api/users/admin/find` or `/api/admin/find`
- Auth: `token` header (admin)
- Query parameters: `q` (search), `username`, `email`, `id`, `page`, `limit`
- Response 200:
  ```json
  {
    "success": true,
    "data": {
      "users": [ { "id": "...", "email": "...", "role": "user|admin|service", "status": "ACTIVE|INACTIVE" } ],
      "pagination": { "page": 1, "limit": 20, "total": 100 }
    }
  }
  ```
- Notes: Support search by username/email/id and server-side pagination.

3) Change user status
- PUT `/api/users/admin/change-status` or `/api/admin/change-status`
- Auth: `token` header
- Body:
  ```json
  { "id": "user-id", "status": "ACTIVE" }
  ```
- Response: updated user object

4) List organizations
- GET `/api/organizations` (for general) and GET `/api/organizations/admin/pending` (admin-specific pending list)
- Admin should be able to call `/api/organizations` with admin token to list all orgs with filters
- Query params: `page`, `limit`, `status`, `q`
- Response: organizations + pagination (see `Organization` schema in frontend docs)

5) Change organization status
- PUT `/api/organizations/admin/{id}/status`
- Auth: `token`
- Body:
  ```json
  { "status": "ACTIVE|SUSPENDED|REJECTED", "reason": "string", "admin_notes": "string" }
  ```
- Response: updated organization object

6) List applications
- GET `/api/applications`
- Auth: admin token
- Query params: `page`, `limit`, `ownerId`, `environment`, `q`
- Response: applications list with pagination

7) Application by ID
- GET `/api/applications/{id}`
- Auth: admin token
- Response: application details including `api_key` (only show to admin)

8) Onboarding documents (admin)
- GET `/api/onboarding/admin/documents/pending`
- PUT `/api/onboarding/admin/documents/{id}/verify`
  Body: `{ "status": "APPROVED|REJECTED", "rejectionReason": "optional" }`
- Responses: normalized document model

9) Onboarding steps (admin)
- GET `/api/onboarding/admin/steps/pending`
- PUT `/api/onboarding/admin/steps/{id}/approve`
  Body: `{ "status": "APPROVED|REJECTED", "rejectionReason": "optional" }`

10) Logs
- GET `/api/users/admin/logs` or `/api/admin/logs`
- GET `/api/users/admin/logs/{id}`
- Response: logs with pagination

11) Queues
- GET `/api/admin/queues`
- Response: queue monitoring data

---

## Missing or inconsistent endpoints noted (action items for backend)

- The frontend currently expects a POST `/api/users/admin/register` (or `/api/admin/register`) which creates an admin and returns token + user. Please confirm which path you prefer and make it available.
- Confirm the user find/list endpoint path and query parameters. Frontend currently calls `/admin/find` in the `adminService` implementation. Please make sure `/api/users/admin/find` or `/api/admin/find` behaves as expected.
- Ensure `GET /api/applications` is accessible by admin and returns `api_key` when requested by an admin.

---

## Pagination and filtering

- For all list endpoints, implement `page` and `limit` query params and return pagination meta: `page`, `limit`, `total`, `totalPages`.
- Return consistent response shape: `{ success: true, data: { items: [...], pagination: {...} } }` or `{ success: true, data: { users: [...], pagination: {...} } }`.

---

## Errors and HTTP codes

- Use standard HTTP codes. On validation errors return 400 with `{ success: false, error: { code: 'VALIDATION_ERROR', message: '...' } }`.
- Unauthorized access: 401 or 403 as appropriate.
- Not found: 404.

---

## Examples (curl)

Create admin (recommended):

```bash
curl -X POST https://api.example.com/api/users/admin/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","email":"admin@example.com","password":"StrongPass123"}'
```

List users:

```bash
curl -X GET "https://api.example.com/api/users/admin/find?page=1&limit=50" \
  -H "token: <ADMIN_TOKEN>"
```

Verify document:

```bash
curl -X PUT https://api.example.com/api/onboarding/admin/documents/123/verify \
  -H "token: <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"status":"APPROVED"}'
```

---

## Security notes

- Admin tokens must be protected and short-lived or revocable.
- Ensure audit logs are written for all admin actions (who performed the action, timestamp, target resource, reason).
- Rate-limit admin operations where appropriate and require MFA for production admin accounts.

---

## Acceptance criteria for backend

- POST `/api/users/admin/register` implemented and returns token + user with role `admin` OR documented secure bootstrap flow exists and team confirms.
- GET `/api/users/admin/find` or `/api/admin/find` returns users and supports search and pagination.
- GET `/api/applications` returns applications and admin can view API keys.
- Admin endpoints accept `token` header and enforce `role === 'admin'`.
- Admin actions are recorded in logs.

---

If you want, I can also open a pull request with these changes to the README and include sample controller implementations (Express / NestJS) for the backend team.
