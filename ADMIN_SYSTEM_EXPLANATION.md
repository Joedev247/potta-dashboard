# Admin System Explanation

## 🔐 Why You're Getting 403 Forbidden Errors

### Root Cause

The **403 Forbidden** error occurs because:

1. **Backend Role-Based Access Control (RBAC)**: The backend API uses role-based authorization with the `@Roles('admin')` decorator
2. **Your Current User Role**: Your logged-in user account likely has role `'user'` or no role, but **NOT** `'admin'`
3. **Backend Validation**: When you make a request to an admin endpoint, the backend:
   - Validates your authentication token ✅
   - Checks your user's role from the token ❌
   - Rejects the request if `role !== 'admin'` → **403 Forbidden**

### The Authentication Flow

```
Frontend Request
    ↓
Bearer Token (api_user:api_password encoded)
    ↓
Backend Receives Request
    ↓
Validates Token ✅
    ↓
Extracts User Role from Token
    ↓
Checks: role === 'admin'?
    ↓
    ├─ YES → Allow Access (200 OK)
    └─ NO  → Reject Access (403 Forbidden)
```

---

## 🏗️ How the Admin System Works

### 1. **Authentication vs Authorization**

- **Authentication** (Who you are): ✅ Your token is valid
- **Authorization** (What you can do): ❌ Your role doesn't allow admin access

### 2. **User Roles**

The system supports different user roles:

- **`'user'`**: Regular user (default) - Can access user dashboard, make payments, etc.
- **`'admin'`**: Administrator - Can access admin dashboard, manage users, review onboarding
- **`'service'`**: Service account - For API integrations

### 3. **Admin Endpoints Protection**

All admin endpoints require:
- ✅ Valid authentication token
- ✅ User role = `'admin'`

**Protected Endpoints:**
- `/api/users/admin/*` - User management
- `/api/onboarding/admin/*` - Onboarding review
- `/api/users/admin/logs` - System logs

### 4. **Frontend Protection**

The frontend now includes:
- **`AdminProtectedRoute`**: Checks user role before rendering admin pages
- **Better Error Handling**: Shows user-friendly messages for 403 errors
- **Role Validation**: Prevents non-admin users from accessing admin routes

---

## 🔧 How to Fix the 403 Error

### Option 1: Get Admin Role (Recommended)

**You need to have an admin user account created with `role: 'admin'`**

1. **Backend Admin Registration**: An existing admin must register you with admin role:
   ```bash
   POST /api/users/admin/register
   {
     "username": "your_username",
     "email": "your_email@example.com",
     "password": "your_password",
     "role": "admin"  // ← This is the key!
   }
   ```

2. **Database Update**: If you have database access, update your user record:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your_email@example.com';
   ```

3. **Backend Configuration**: Ensure the backend JWT token includes the role field

### Option 2: Temporary Bypass (Development Only)

⚠️ **WARNING**: Only for development/testing. Never use in production!

If you need to test admin features during development, you can temporarily:
1. Modify backend role check to allow your user
2. Or create a test admin account

---

## 📋 Admin System Architecture

### Backend (API Server)

```
┌─────────────────────────────────────┐
│   Admin Endpoint (e.g., /admin)   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Authentication Middleware         │
│   - Validates JWT Token            │
│   - Extracts User Info              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Role-Based Authorization          │
│   @Roles('admin') Guard             │
│   - Checks: user.role === 'admin'   │
└──────────────┬──────────────────────┘
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
   ✅ Allow      ❌ Reject
   (200 OK)      (403 Forbidden)
```

### Frontend (React/Next.js)

```
┌─────────────────────────────────────┐
│   Admin Page Component              │
│   (e.g., /admin/onboarding)        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   AdminProtectedRoute                │
│   - Checks: user.role === 'admin'   │
└──────────────┬──────────────────────┘
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
   ✅ Render      ❌ Show Error
   Admin UI       "Access Denied"
```

### API Client Flow

```
┌─────────────────────────────────────┐
│   API Request                       │
│   GET /onboarding/admin/documents/   │
│   pending                            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Add Authorization Header          │
│   Bearer base64(api_user:api_pass)  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Backend Response                   │
│   Status: 403 Forbidden               │
│   Message: "Admin role required"     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Error Handler                     │
│   - Detects ADMIN_ACCESS_REQUIRED   │
│   - Shows user-friendly message     │
└─────────────────────────────────────┘
```

---

## 🎯 Admin Features Overview

### 1. **User Management** (`/admin`)
- Register new users
- Search users by username, email, or ID
- Change user status (ACTIVE/INACTIVE)
- View user details

### 2. **Onboarding Review** (`/admin/onboarding`)
- Review pending documents
- Approve/reject documents
- Review pending onboarding steps
- Approve/reject onboarding steps

### 3. **System Logs** (`/admin/logs`)
- View API request logs
- Monitor system activity
- Debug issues

---

## 🔍 Debugging 403 Errors

### Check Your User Role

1. **In Browser Console:**
   ```javascript
   const user = JSON.parse(localStorage.getItem('user'));
   console.log('User Role:', user?.role);
   ```

2. **Expected Output:**
   - ✅ `'admin'` → Should work
   - ❌ `'user'` or `undefined` → Will get 403

### Check Token

1. **In Browser Console:**
   ```javascript
   const token = localStorage.getItem('accessToken');
   console.log('Token exists:', !!token);
   console.log('Token length:', token?.length);
   ```

### Check API Credentials

1. **In Browser Console:**
   ```javascript
   const apiUser = localStorage.getItem('apiUser');
   const apiPassword = localStorage.getItem('apiPassword');
   console.log('API User:', apiUser ? 'Found' : 'Missing');
   console.log('API Password:', apiPassword ? 'Found' : 'Missing');
   ```

---

## 📝 Summary

**Why 403 Forbidden?**
- Your user account doesn't have `role: 'admin'`
- Backend requires admin role for admin endpoints
- Token is valid, but authorization fails

**How to Fix?**
- Get an admin account created with `role: 'admin'`
- Or update your existing user's role to `'admin'` in the database

**What Changed?**
- Added `AdminProtectedRoute` to check role before rendering
- Improved error messages to explain admin access requirement
- Better error handling in admin pages

The admin system is working correctly - it's protecting admin endpoints from unauthorized access! 🔒

