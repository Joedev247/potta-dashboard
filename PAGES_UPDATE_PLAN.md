# Pages Update Plan - API Integration

This document outlines the systematic update plan for integrating API endpoints across all pages.

## Status

### ✅ Completed
1. API Service Layer - All service modules created
2. AuthContext - Fully integrated with API
3. Payments Page - Partially integrated (fetch functions created, display needs update)

### ⏳ In Progress
- Payments page display sections

### 📋 Remaining Pages

1. **Payments Page** (`app/payments/page.tsx`)
   - ✅ Fetch functions created
   - ✅ Create link integrated
   - ⏳ Replace mock data in display sections
   - ⏳ Add loading states
   - ⏳ Update data formatting

2. **Reports Page** (`app/reports/page.tsx`)
   - Replace `mockSettlements` and `mockInvoices`
   - Integrate settlement and balance report fetching
   - Update export functionality

3. **Invoicing Page** (`app/invoicing/page.tsx`)
   - Replace `mockInvoices`
   - Integrate invoice CRUD operations
   - Update all tabs (Recurring, Credit notes, Customers, Products)

4. **Browse Page** (`app/browse/page.tsx`)
   - Replace `mockApiLogs`
   - Integrate API keys management
   - Integrate access tokens CRUD
   - Integrate webhooks CRUD
   - Integrate apps CRUD

5. **Balance Page** (`app/balance/page.tsx`)
   - Fetch balance from API
   - Fetch transactions from API
   - Integrate payout requests

6. **Statistics Page** (`app/statistics/page.tsx`)
   - Replace mock statistics
   - Integrate statistics API calls

7. **Notifications Page** (`app/notifications/page.tsx`)
   - Fetch notifications from API
   - Integrate mark as read functionality

## Implementation Pattern

For each page:

1. Import API services
2. Replace mock data with state variables
3. Create fetch functions using `useCallback`
4. Add `useEffect` hooks to fetch on mount/filter changes
5. Update display sections to use fetched data
6. Add loading states and error handling
7. Format API data for display (use format utilities)

## Next Steps

Starting with completing Payments page, then systematically updating all remaining pages.


