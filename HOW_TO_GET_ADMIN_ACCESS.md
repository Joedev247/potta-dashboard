# How to Get Admin Access

## 🔍 Current Situation

You're seeing the "Access Denied" message because:
- ✅ Your authentication is working (you're logged in)
- ❌ Your user account has role `'user'` instead of `'admin'`
- ✅ The system is correctly protecting admin routes

**This is expected behavior!** The admin system is working correctly.

## 🎯 Solution: Create or Update to Admin Account

You have several options to get admin access:

---

## Option 1: Direct Database Update (Fastest - Development Only)

If you have direct database access, you can update your user's role:

### PostgreSQL Example:
```sql
-- Find your user
SELECT id, username, email, role FROM users WHERE email = 'your_email@example.com';

-- Update your role to admin
UPDATE users SET role = 'admin' WHERE email = 'your_email@example.com';

-- Verify the update
SELECT id, username, email, role FROM users WHERE email = 'your_email@example.com';
```

### MySQL Example:
```sql
-- Find your user
SELECT id, username, email, role FROM users WHERE email = 'your_email@example.com';

-- Update your role to admin
UPDATE users SET role = 'admin' WHERE email = 'your_email@example.com';

-- Verify the update
SELECT id, username, email, role FROM users WHERE email = 'your_email@example.com';
```

**After updating:**
1. Log out of the application
2. Log back in (this refreshes your JWT token with the new role)
3. Try accessing `/admin` again

---

## Option 2: Create Admin User via Backend Script/Seeder

If your backend has a seeder or script to create admin users:

### Example Backend Script:
```typescript
// scripts/create-admin.ts or similar
import { UserService } from './services/user.service';

async function createAdmin() {
  const adminUser = await UserService.create({
    username: 'admin',
    email: 'admin@example.com',
    password: 'secure_password_here',
    role: 'admin',
    isInternal: true,
  });
  
  console.log('Admin user created:', adminUser);
}

createAdmin();
```

**Run the script:**
```bash
npm run create-admin
# or
ts-node scripts/create-admin.ts
```

---

## Option 3: Use Backend API Directly (If You Have Backend Access)

If you can make direct API calls to your backend (using Postman, curl, etc.):

### Step 1: Get an Admin Token First
You need an existing admin account OR use a backend endpoint that bypasses admin check for initial setup.

### Step 2: Register New Admin User
```bash
curl -X POST http://localhost:3005/api/admin/register \
  -H "Content-Type: application/json" \
  -H "token: <existing_admin_token>" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "secure_password",
    "role": "admin",
    "isInternal": true
  }'
```

---

## Option 4: Update Existing User via Backend API (If Available)

Some backends have an endpoint to update user roles. Check your backend documentation for:
- `PUT /api/users/:id/role`
- `PUT /api/admin/users/:id/role`
- Or similar endpoints

---

## ✅ Verification Steps

After creating/updating an admin account:

### 1. Check Your Role in Browser Console
```javascript
// Open browser console (F12) and run:
const user = JSON.parse(localStorage.getItem('user') || '{}');
console.log('Current Role:', user.role);

// Expected: 'admin'
```

### 2. Check Your Token
```javascript
const token = localStorage.getItem('accessToken');
console.log('Token exists:', !!token);
console.log('Token length:', token?.length);
```

### 3. Log Out and Log Back In
**Important:** You must log out and log back in to refresh your JWT token with the new role.

1. Click logout
2. Clear localStorage (optional but recommended):
   ```javascript
   localStorage.clear();
   ```
3. Log back in with your admin credentials
4. Try accessing `/admin` again

### 4. Test Admin Access
Once logged in as admin:
- Navigate to `/admin` - should work ✅
- Navigate to `/admin/onboarding` - should work ✅
- Navigate to `/admin/logs` - should work ✅

---

## 🔧 Troubleshooting

### Issue: Still Getting "Access Denied" After Role Update

**Possible Causes:**
1. **Token Not Refreshed**: You need to log out and log back in
2. **Backend Token Cache**: Backend might be caching the old token
3. **Role Not in Token**: Backend JWT might not include role in token payload

**Solutions:**
1. Clear browser storage:
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   ```
2. Log out completely
3. Log back in
4. Check Network tab to see if token header is being sent

### Issue: Can't Access Database

**Alternative:**
- Contact your backend developer to:
  1. Create an admin user for you
  2. Update your existing user's role
  3. Provide a backend script to create admin users

### Issue: Backend Doesn't Have Admin Registration Endpoint

**Solution:**
- You'll need database access or a backend script
- Or ask backend developer to add an endpoint for creating the first admin user

---

## 📋 Quick Checklist

- [ ] Identify which option you can use (database, script, API, etc.)
- [ ] Create/update user with `role: 'admin'`
- [ ] Verify role in database: `SELECT role FROM users WHERE email = 'your_email'`
- [ ] Log out of the application
- [ ] Clear browser storage (optional)
- [ ] Log back in with admin credentials
- [ ] Verify role in localStorage: `JSON.parse(localStorage.getItem('user')).role`
- [ ] Try accessing `/admin` route
- [ ] Should see admin dashboard ✅

---

## 🎯 Expected Result

Once you have admin access:
- ✅ No more "Access Denied" message
- ✅ Can access `/admin` dashboard
- ✅ Can access `/admin/onboarding` page
- ✅ Can access `/admin/logs` page
- ✅ Can register new users
- ✅ Can manage users and organizations
- ✅ Can review onboarding documents and steps

---

## 📝 Notes

- **Security**: Admin access is protected for a reason - only grant it to trusted users
- **Development**: In development, you can use database updates for convenience
- **Production**: In production, use proper admin registration workflows
- **Token Refresh**: Always log out and log back in after role changes to refresh JWT token

---

## 🆘 Still Having Issues?

If you've tried all options and still can't get admin access:

1. **Check Backend Logs**: Look for errors when trying to access admin endpoints
2. **Verify Backend Configuration**: Ensure backend is checking roles correctly
3. **Check JWT Payload**: Verify that the JWT token includes the role field
4. **Contact Backend Developer**: They can help create an admin account or debug the issue

---

**Remember:** The "Access Denied" message means the security system is working correctly! You just need to get an admin account set up. 🔒

