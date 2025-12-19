# Missing Endpoints for Production Readiness

This document lists all endpoints that are documented in `API_DOCUMENTATION.md` but are **NOT implemented** in the frontend API client files. These endpoints need to be implemented to make the project production-ready.

---

## 🔴 Critical Missing Endpoints

### 1. **Authentication Endpoints**
All authentication endpoints appear to be implemented ✅

### 2. **User Management / Customer Endpoints**

#### ✅ Implemented:
- `GET /api/customer/profile` ✅
- `PUT /api/customer/profile` ✅
- `GET /api/customer/settings` ✅
- `PUT /api/customer/settings` ✅
- `GET /api/customer/transactions` ✅
- `GET /api/customer/transactions/:id` ✅

#### ❌ Missing:
- None - all customer endpoints are implemented

---

### 3. **Payments Endpoints**

#### ✅ Implemented:
- `POST /api/make-payment` ✅
- `GET /api/payment-status/:transaction_id` ✅
- `GET /api/verify-account-holder-active` ✅
- `GET /api/verify-account-holder-basic-info` ✅

#### ❌ Missing:
- None - all payment endpoints are implemented

---

### 4. **Balances & Transactions Endpoints**

#### ✅ Implemented:
- `GET /api/balances` ✅
- `GET /api/balances/transactions` ✅

#### ❌ Missing:
- **Payouts endpoints** - Not documented in API_DOCUMENTATION.md but may be needed for production
  - `GET /api/payouts` (if needed)
  - `POST /api/payouts` (if needed)
  - `GET /api/payouts/:id` (if needed)

---

### 5. **Orders Endpoints**

#### ✅ Implemented:
- `POST /api/orders` ✅
- `GET /api/orders` ✅
- `GET /api/orders/:id` ✅
- `PUT /api/orders/:id/status` ✅

#### ❌ Missing:
- None - all order endpoints are implemented

---

### 6. **Invoices Endpoints**

#### ✅ Implemented:
- `POST /api/invoices` ✅
- `GET /api/invoices` ✅
- `GET /api/invoices/:id` ✅
- `PUT /api/invoices/:id` ✅
- `PUT /api/invoices/:id/send` ✅
- `PUT /api/invoices/:id/status` ✅

#### ❌ Missing:
- **Invoice Download** - Documented but implementation may need verification
  - `GET /api/invoices/:id/download` (implemented in `invoicing.ts` but may need backend support)

---

### 7. **Refunds Endpoints**

#### ✅ Implemented:
- `POST /api/refunds` ✅
- `GET /api/refunds` ✅
- `GET /api/refunds/:id` ✅

#### ❌ Missing:
- None - all refund endpoints are implemented

---

### 8. **Organizations Endpoints**

#### ✅ Implemented:
- `POST /api/organizations` ✅
- `GET /api/organizations` ✅
- `GET /api/organizations/:id` ✅
- `PUT /api/organizations/:id` ✅
- `DELETE /api/organizations/:id` ✅

#### ❌ Missing:
- None - all organization endpoints are implemented

---

### 9. **Applications Endpoints**

#### ✅ Implemented:
- `POST /api/applications` ✅
- `GET /api/applications` ✅
- `GET /api/applications/:id` ✅
- `PUT /api/applications/:id` ✅
- `PUT /api/applications/:id/regenerate-credentials` ✅
- `DELETE /api/applications/:id` ✅

#### ❌ Missing:
- None - all application endpoints are implemented

---

### 10. **Customers Endpoints**

#### ✅ Implemented:
- `POST /api/customers` ✅
- `GET /api/customers` ✅
- `GET /api/customers/:id` ✅
- `PUT /api/customers/:id` ✅
- `DELETE /api/customers/:id` ✅

#### ❌ Missing:
- None - all customer endpoints are implemented

---

### 11. **Products Endpoints**

#### ✅ Implemented:
- `POST /api/products` ✅
- `GET /api/products` ✅
- `GET /api/products/:id` ✅
- `PUT /api/products/:id` ✅
- `DELETE /api/products/:id` ✅
- `PUT /api/products/:id/activate` ✅
- `PUT /api/products/:id/deactivate` ✅

#### ❌ Missing:
- None - all product endpoints are implemented

---

### 12. **Onboarding Endpoints**

#### ✅ Implemented:
- `POST /api/onboarding/stakeholder` ✅
- `POST /api/onboarding/business` ✅
- `POST /api/onboarding/payment-methods` ✅
- `POST /api/onboarding/documents` ✅
- `GET /api/onboarding/progress` ✅
- `GET /api/onboarding/organizations/:organizationId/progress` ✅
- `GET /api/onboarding/documents` ✅
- `GET /api/onboarding/organizations/:organizationId/documents` ✅
- `DELETE /api/onboarding/documents/:id` ✅

#### ❌ Missing:
- **Admin Onboarding Endpoints** (mentioned in `onboarding.ts` but not in API_DOCUMENTATION.md):
  - `GET /api/onboarding/admin/documents/pending` (implemented but not documented)
  - `PUT /api/onboarding/admin/documents/:id/verify` (implemented but not documented)
  - `GET /api/onboarding/admin/steps/pending` (implemented but not documented)
  - `PUT /api/onboarding/admin/steps/:id/approve` (implemented but not documented)

---

### 13. **Reports Endpoints**

#### ✅ Implemented:
- `GET /api/reports/payments` ✅
- `GET /api/reports/transactions` ✅
- `GET /api/reports/financial` ✅
- `GET /api/reports/payments/export` ✅
- `GET /api/reports/transactions/export` ✅
- `GET /api/reports/financial/export` ✅

#### ❌ Missing:
- None - all report endpoints are implemented

---

### 14. **Bank Accounts Endpoints**

#### ✅ Implemented:
- `POST /api/bank-accounts` ✅
- `GET /api/bank-accounts` ✅
- `GET /api/bank-accounts/:id` ✅
- `PUT /api/bank-accounts/:id` ✅
- `PUT /api/bank-accounts/:id/verify` ✅

#### ❌ Missing:
- None - all bank account endpoints are implemented

---

### 15. **Chargebacks Endpoints**

#### ✅ Implemented:
- `POST /api/chargebacks` ✅
- `GET /api/chargebacks` ✅
- `GET /api/chargebacks/:id` ✅
- `PUT /api/chargebacks/:id/status` ✅

#### ❌ Missing:
- None - all chargeback endpoints are implemented

---

### 16. **Admin Endpoints**

#### ✅ Implemented:
- `GET /api/admin/logs` ✅
- `GET /api/admin/logs/:id` ✅
- `POST /api/admin/register` ✅
- `PUT /api/admin/change-status` ✅
- `POST /api/admin/created-provider` ✅
- `PUT /api/admin/activated-provider` ✅
- `GET /api/admin/find` ✅

#### ❌ Missing:
- **Admin Queues** (mentioned in `admin.ts` but not in API_DOCUMENTATION.md):
  - `GET /api/admin/queues` (implemented but not documented)

---

## 🟡 Additional Endpoints (Not in API Documentation but May Be Needed)

### Statistics Endpoints
- `GET /api/statistics` ✅ (implemented in `statistics.ts`)
- `GET /api/statistics/daily` ✅ (implemented in `statistics.ts`)

### Notifications Endpoints
- `GET /api/notifications` ✅ (implemented in `notifications.ts`)
- `PUT /api/notifications/:id/read` ✅ (implemented in `notifications.ts`)
- `PUT /api/notifications/read-all` ✅ (implemented in `notifications.ts`)

### Browse/API Management Endpoints (Mock implementations exist)
- `GET /api/customer/credentials` (for API keys)
- `PUT /api/customer/genarate-credentials` ✅ (implemented in `users.ts`)
- `PUT /api/customer/credentials/revoke` (for revoking API keys)
- `GET /api/customer/tokens` (for access tokens)
- `POST /api/customer/tokens` (for creating access tokens)
- `DELETE /api/customer/tokens/:id` (for revoking access tokens)
- `GET /api/webhooks` (for webhooks)
- `POST /api/webhooks` (for creating webhooks)
- `PUT /api/webhooks/:id` (for updating webhooks)
- `DELETE /api/webhooks/:id` (for deleting webhooks)
- `GET /api/apps` (for apps)
- `POST /api/apps` (for creating apps)
- `PUT /api/apps/:id` (for updating apps)
- `DELETE /api/apps/:id` (for deleting apps)

**Note:** These endpoints are implemented with mock fallbacks in `browse.ts`, but the actual backend endpoints may not exist yet.

---

## 📊 Summary

### ✅ Fully Implemented Categories:
1. Authentication (11/11 endpoints)
2. User Management / Customer (6/6 endpoints)
3. Payments (4/4 endpoints)
4. Orders (4/4 endpoints)
5. Invoices (6/6 endpoints)
6. Refunds (3/3 endpoints)
7. Organizations (5/5 endpoints)
8. Applications (6/6 endpoints)
9. Customers (5/5 endpoints)
10. Products (7/7 endpoints)
11. Reports (6/6 endpoints)
12. Bank Accounts (5/5 endpoints)
13. Chargebacks (4/4 endpoints)
14. Admin (7/7 documented endpoints)

### ⚠️ Partially Documented (Implemented but not in API docs):
- Admin Onboarding endpoints (4 endpoints)
- Admin Queues (1 endpoint)
- Statistics endpoints (2 endpoints)
- Notifications endpoints (3 endpoints)
- Browse/API Management endpoints (multiple - currently using mocks)

### 🔴 Critical Gaps for Production:

1. **Backend Verification Needed:**
   - Verify all endpoints documented in `API_DOCUMENTATION.md` are actually implemented in the backend
   - Test all endpoints to ensure they work correctly
   - Verify authentication requirements are correctly implemented

2. **Missing Backend Endpoints (if needed):**
   - Payouts endpoints (if payouts are a feature)
   - Invoice download endpoint (may need backend implementation)
   - Browse/API Management endpoints (currently using mocks - need real backend)

3. **Documentation Gaps:**
   - Admin onboarding endpoints need to be added to API_DOCUMENTATION.md
   - Admin queues endpoint needs to be added to API_DOCUMENTATION.md
   - Statistics endpoints need to be added to API_DOCUMENTATION.md
   - Notifications endpoints need to be added to API_DOCUMENTATION.md
   - Browse/API Management endpoints need to be documented if they're real backend endpoints

---

## 🎯 Action Items for Production Readiness

### High Priority:
1. ✅ **Verify backend implementation** - Test all documented endpoints
2. ✅ **Implement missing backend endpoints** - If any endpoints are missing from backend
3. ✅ **Replace mock implementations** - Replace mock data in `browse.ts` with real API calls
4. ✅ **Add missing documentation** - Document statistics, notifications, and admin endpoints

### Medium Priority:
1. ✅ **Add error handling** - Ensure all endpoints have proper error handling
2. ✅ **Add loading states** - Ensure all API calls have loading states
3. ✅ **Add retry logic** - For critical endpoints
4. ✅ **Add rate limiting handling** - Handle 429 responses

### Low Priority:
1. ✅ **Add caching** - For frequently accessed data
2. ✅ **Add offline support** - If needed
3. ✅ **Add request queuing** - For better UX

---

## 📝 Notes

- Most endpoints are already implemented in the frontend
- The main gap is **backend verification** - need to ensure backend actually implements all documented endpoints
- Some endpoints have mock implementations that need to be replaced with real API calls
- Documentation needs to be updated to include all implemented endpoints

---

**Last Updated:** Based on codebase analysis on December 2025

