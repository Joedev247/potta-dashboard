# Admin Logic Refactoring Summary

## Overview
This document summarizes the refactoring of the admin logic workflow to align with the **Frontend Admin API Integration Guide v1.0**.

## Changes Made

### 1. API Client Updates (`lib/api/client.ts`)

#### Admin Endpoint Detection
- Added detection for admin endpoints:
  - `/admin/`
  - `/organizations/admin/`
  - `/onboarding/admin/`

#### Authentication Header
- **Admin endpoints now use `token` header** (not `Authorization` header)
- This matches the Frontend Admin API Guide specification
- The token is obtained from login and stored in localStorage as `accessToken`

**Before:**
```typescript
// Admin endpoints used Authorization header
headers['Authorization'] = `Bearer ${token}`;
```

**After:**
```typescript
// Admin endpoints use token header
if (isAdminEndpoint && token) {
  headers['token'] = token;
}
```

### 2. Admin Service Refactoring (`lib/api/admin.ts`)

#### Endpoint Path Updates
All admin endpoints have been updated to match the guide:

| Old Endpoint | New Endpoint | Status |
|-------------|-------------|--------|
| `/api/users/admin/register` | `/api/admin/register` | ✅ Updated |
| `/api/users/admin/change-status` | `/api/admin/change-status` | ✅ Updated |
| `/api/users/admin/created-provider` | `/api/admin/created-provider` | ✅ Updated |
| `/api/users/admin/activated-provider` | `/api/admin/activated-provider` | ✅ Updated |
| `/api/users/admin/find` | `/api/admin/find` | ✅ Updated |
| `/api/users/admin/logs` | `/api/admin/logs` | ✅ Updated |
| `/api/users/admin/logs/:id` | `/api/admin/logs/:id` | ✅ Updated |

#### New Organization Admin Endpoints
Added support for organization management:

- **GET `/api/organizations/admin/pending`**
  - Get all pending organizations awaiting admin review
  - Returns: `Organization[]`

- **PUT `/api/organizations/admin/:id/status`**
  - Change organization status (ACTIVE, SUSPENDED, REJECTED, PENDING)
  - Request body: `{ status, reason?, admin_notes? }`
  - Returns: `Organization`

#### Type Updates
- Updated `RegisterUserData` to include `isInternal?: boolean` (defaults to `true`)
- Updated `CreateProviderData` to match guide:
  - Removed: `type`, `config`
  - Added: `status?: 'ACTIVE' | 'INACTIVE' | 'PENDING'` (defaults to `'PENDING'`)
- Added `Organization` and `ChangeOrganizationStatusData` types

#### Response Normalization
All endpoints now properly normalize backend responses:
- Handles both `data.data` and `data` response structures
- Normalizes field names (snake_case ↔ camelCase)
- Provides consistent error handling

### 3. Admin Page Updates (`app/admin/page.tsx`)

#### Provider Form Changes
Updated to match the guide's API specification:

**Before:**
```typescript
{
  name: string;
  type: string;
  config: string;
}
```

**After:**
```typescript
{
  name: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
}
```

#### Type Import Fix
- Fixed User type import conflict by explicitly importing from `@/lib/api/admin`
- Resolves type conflicts between admin User and auth User types

### 4. Onboarding Admin Endpoints

The onboarding admin endpoints were already correctly implemented:
- ✅ `GET /api/onboarding/admin/documents/pending`
- ✅ `PUT /api/onboarding/admin/documents/:id/verify`
- ✅ `GET /api/onboarding/admin/steps/pending`
- ✅ `PUT /api/onboarding/admin/steps/:id/approve`

These endpoints are handled by `onboardingService` and work correctly with the updated API client.

## Authentication Flow

### Admin Login
1. Admin user logs in via `/api/login` endpoint
2. Backend returns JWT token in response
3. Token is stored in localStorage as `accessToken`
4. Token is used for all admin API calls via `token` header

### Admin API Calls
```typescript
// API Client automatically detects admin endpoints
// and uses token header instead of Authorization header

// Example: GET /api/admin/logs
headers: {
  'token': '<admin_jwt_token>',
  'Content-Type': 'application/json'
}
```

## Error Handling

### 403 Forbidden Errors
The API client now provides specific error messages for admin endpoints:

```typescript
{
  code: 'ADMIN_ACCESS_REQUIRED',
  message: 'Admin access required. Your account does not have admin privileges.',
  details: {
    status: 403,
    hasToken: true,
    endpoint: '/admin/logs'
  }
}
```

### Common Error Codes
- `AUTH_REQUIRED`: No token found
- `AUTH_EXPIRED`: Token expired or invalid
- `ADMIN_ACCESS_REQUIRED`: User doesn't have admin role
- `FORBIDDEN`: Access forbidden (generic)

## Testing Checklist

- [ ] Admin login works and token is stored
- [ ] Admin endpoints use `token` header (check Network tab)
- [ ] User management endpoints work:
  - [ ] Register user
  - [ ] Find users
  - [ ] Change user status
- [ ] Provider management works:
  - [ ] Create provider (with name and status only)
  - [ ] Activate/deactivate provider for user
- [ ] Organization management works:
  - [ ] Get pending organizations
  - [ ] Change organization status
- [ ] Onboarding admin endpoints work:
  - [ ] Get pending documents
  - [ ] Verify documents
  - [ ] Get pending steps
  - [ ] Approve/reject steps
- [ ] System logs work:
  - [ ] Get logs (paginated)
  - [ ] Get log by ID
- [ ] Error handling works:
  - [ ] 401 errors show appropriate messages
  - [ ] 403 errors show admin access required message
  - [ ] 400 errors show validation messages

## Migration Notes

### Breaking Changes
1. **Provider Creation**: The `createProvider` endpoint now only accepts `name` and `status` (removed `type` and `config`)
2. **Endpoint Paths**: All admin endpoints moved from `/api/users/admin/*` to `/api/admin/*`
3. **Authentication**: Admin endpoints now use `token` header instead of `Authorization` header

### Backward Compatibility
- The API client automatically detects admin endpoints and uses the correct header
- No changes needed in components that use `adminService` - they will automatically use the new endpoints

## Files Modified

1. `lib/api/client.ts` - Added admin endpoint detection and token header support
2. `lib/api/admin.ts` - Complete refactor to match guide specifications
3. `app/admin/page.tsx` - Updated provider form to match new API

## Files Unchanged (Already Correct)

1. `lib/api/onboarding.ts` - Onboarding admin endpoints already correct
2. `app/admin/onboarding/page.tsx` - Already using correct service methods
3. `app/admin/logs/page.tsx` - Already using correct service methods

## Next Steps

1. Test all admin endpoints with a real admin account
2. Verify token header is being sent correctly (check Network tab)
3. Test error handling with non-admin users
4. Update any documentation that references old endpoint paths
5. Consider adding organization management UI to admin dashboard

## References

- **Frontend Admin API Integration Guide v1.0** - Primary reference document
- **ADMIN_SYSTEM_EXPLANATION.md** - System architecture documentation

