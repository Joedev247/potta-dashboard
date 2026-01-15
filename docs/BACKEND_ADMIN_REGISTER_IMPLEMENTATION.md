# Backend Implementation Guide: POST /api/users/admin/register

Purpose: Implement a secure endpoint that creates the first admin (or any admin) and returns an auth token + user object with `role: 'admin'` so the frontend admin dashboard can immediately log in.

This guide provides:
- Recommended API contract
- Security / bootstrap options
- Example implementations (Express + NestJS)
- DB migration snippet
- Curl examples and acceptance criteria

---

## API Contract (recommended)

POST /api/users/admin/register
Headers: none (public bootstrap) OR `x-bootstrap-secret` (recommended for first admin)
Body (JSON):
```json
{
  "username": "admin",
  "email": "admin@example.com",
  "password": "StrongPassword123!",
  "firstName": "Admin",
  "lastName": "User",
  "bootstrapSecret": "<optional>"
}
```

Response (201 Created on success):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin",
      "status": "ACTIVE"
    },
    "token": "<JWT or session token>"
  }
}
```

Errors: 400 validation, 409 user exists, 401 unauthorized (if bootstrap protected), 500 server error.

---

## Security / Bootstrap Options

1) Bootstrap secret (recommended):
- Configure an environment variable `ADMIN_BOOTSTRAP_SECRET` used only to protect the first admin creation.
- The endpoint accepts `x-bootstrap-secret` header or `bootstrapSecret` body field.
- If secret matches and no admin exists, allow creation; otherwise reject.

2) Admin invite flow (production):
- Disable public bootstrap. Provide an internal-only endpoint or CLI that creates admins.
- Or provide an authenticated "promote user to admin" endpoint protected by internal service credentials.

3) Rate-limit and audit:
- Rate-limit the endpoint and log creation attempts.
- Create an audit log entry when an admin account is created.

4) MFA requirement:
- Require MFA setup for admin accounts before allowing sensitive operations (recommended after bootstrap).

---

## Database migration snippet (Postgres example)

SQL to ensure `role` and `status` columns exist:

```sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role VARCHAR(32) DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS status VARCHAR(16) DEFAULT 'PENDING';

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

Optional migration to seed a locked admin (if you want to create via SQL):

```sql
INSERT INTO users (id, username, email, password_hash, role, status, created_at)
VALUES ('00000000-0000-0000-0000-000000000001', 'admin', 'admin@example.com', '<hashed-password>', 'admin', 'ACTIVE', now())
ON CONFLICT (email) DO NOTHING;
```

---

## Example Implementation (Express + TypeScript)

Notes:
- Uses `bcrypt` for hashing, `jsonwebtoken` for tokens.
- `db` is an abstracted query interface (replace with your ORM).
- Ensure email uniqueness and transactional consistency.

```ts
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';

const router = express.Router();

router.post('/api/users/admin/register',
  body('username').isLength({ min: 3 }),
  body('email').isEmail(),
  body('password').isLength({ min: 8 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: errors.array() } });

    const { username, email, password, firstName, lastName, bootstrapSecret } = req.body;

    // Check bootstrap secret if configured
    const BOOTSTRAP = process.env.ADMIN_BOOTSTRAP_SECRET;
    if (BOOTSTRAP) {
      if (!bootstrapSecret && !req.header('x-bootstrap-secret')) {
        return res.status(401).json({ success: false, error: { code: 'BOOTSTRAP_REQUIRED', message: 'Bootstrap secret required' } });
      }
      const provided = bootstrapSecret || req.header('x-bootstrap-secret');
      if (provided !== BOOTSTRAP) return res.status(401).json({ success: false, error: { code: 'INVALID_BOOTSTRAP', message: 'Invalid bootstrap secret' } });
    }

    try {
      // Ensure no existing admin (optional)
      const existingAdmin = await db('users').where({ role: 'admin' }).first();
      if (existingAdmin) {
        // If you want to allow multiple admins, skip this check
        return res.status(409).json({ success: false, error: { code: 'ADMIN_EXISTS', message: 'Admin already exists' } });
      }

      // Ensure email/username uniqueness
      const exists = await db('users').where({ email }).first();
      if (exists) return res.status(409).json({ success: false, error: { code: 'USER_EXISTS', message: 'User already exists' } });

      const passwordHash = await bcrypt.hash(password, 12);

      const [user] = await db('users').insert({ username, email, password_hash: passwordHash, first_name: firstName, last_name: lastName, role: 'admin', status: 'ACTIVE', created_at: new Date() }).returning('*');

      // Issue token (JWT example)
      const token = jwt.sign({ sub: user.id, role: 'admin' }, process.env.JWT_SECRET as string, { expiresIn: '8h' });

      // Audit log
      await db('admin_audit_logs').insert({ action: 'CREATE_ADMIN', actor_id: user.id, target_id: user.id, metadata: JSON.stringify({ createdByBootstrap: !!BOOTSTRAP }), created_at: new Date() });

      return res.status(201).json({ success: true, data: { user: { id: user.id, username: user.username, email: user.email, role: user.role, status: user.status }, token } });
    } catch (err) {
      console.error('Admin register error', err);
      return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to create admin' } });
    }
  }
);

export default router;
```

---

## Example Implementation (NestJS snippet)

In a NestJS `AdminController` implement a `register()` method in `AdminService` that performs the same checks, hashing, and token issuance. Use Guards to protect promotion endpoints.

Controller example (simplified):

```ts
@Post('users/admin/register')
async register(@Body() dto: CreateAdminDto) {
  // Validation and bootstrap secret checks
  // Call adminService.createAdmin(dto)
}
```

Service example (createAdmin):
- Validate uniqueness
- Hash password
- Create user with `role = 'admin'`, `status = 'ACTIVE'`
- Create audit log
- Return user + token

---

## Curl examples

Create admin (bootstrap secret in header):

```bash
curl -X POST https://api.example.com/api/users/admin/register \
  -H "Content-Type: application/json" \
  -H "x-bootstrap-secret: $ADMIN_BOOTSTRAP_SECRET" \
  -d '{"username":"admin","email":"admin@example.com","password":"SecurePass123"}'
```

Create admin (body secret):

```bash
curl -X POST https://api.example.com/api/users/admin/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","email":"admin@example.com","password":"SecurePass123","bootstrapSecret":"your-secret"}'
```

---

## Acceptance criteria (backend)

- Endpoint exists at `POST /api/users/admin/register` or `/api/admin/register` and documented path is agreed.
- It creates a user with `role: 'admin'` and returns `token` + `user` in the response body.
- Endpoint is protected by a bootstrap secret OR internal-only access in production.
- Admin creation is audit-logged.
- If an admin already exists (optional behavior), endpoint returns 409 unless you allow multiple admins (document behavior).

---

## Notes for frontend integration

- Frontend `app/admin/setup/page.tsx` expects the response to include `data.user` and `data.token` and stores `accessToken` and `user` locally.
- Token must be accepted by admin endpoints via the `token` header.

---

If you'd like, I can also generate an example PR with an Express route file, unit tests (Jest), and a small README for the backend repo. Tell me which backend stack you use (Express, NestJS, Fastify, etc.) and I will scaffold the exact files.
