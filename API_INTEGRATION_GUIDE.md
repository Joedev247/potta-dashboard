# API Integration Guide

This document outlines the changes made to integrate real API endpoints throughout the frontend application.

## Overview

All mock/dummy data has been replaced with real API calls using a centralized API service layer. The application now fetches data from backend endpoints as specified in `API_ENDPOINTS.md`.

## API Service Structure

### Base Client (`lib/api/client.ts`)
- Centralized API client with authentication token handling
- Automatic error handling and response parsing
- Support for GET, POST, PUT, DELETE requests
- Support for file uploads

### Service Modules
- `lib/api/auth.ts` - Authentication endpoints
- `lib/api/payments.ts` - Payment, refund, chargeback, order endpoints
- `lib/api/balance.ts` - Balance and transaction endpoints
- `lib/api/reports.ts` - Report generation endpoints
- `lib/api/invoicing.ts` - Invoice, customer, product endpoints
- `lib/api/browse.ts` - API keys, webhooks, apps, logs endpoints
- `lib/api/users.ts` - User profile and settings endpoints
- `lib/api/organization.ts` - Organization endpoints
- `lib/api/notifications.ts` - Notification endpoints
- `lib/api/statistics.ts` - Statistics and analytics endpoints
- `lib/api/onboarding.ts` - Onboarding flow endpoints

## Key Changes

### 1. AuthContext (`contexts/AuthContext.tsx`)
- ✅ Updated to use `authService` for login, signup, logout
- ✅ Fetches user profile from API on mount
- ✅ Stores access tokens in localStorage
- ✅ Added loading state
- ✅ Removed dummy user data

### 2. Payments Page (`app/payments/page.tsx`)
- ✅ Added state for payments, refunds, chargebacks, orders
- ✅ Added loading states for each tab
- ✅ Created fetch functions for each data type
- ✅ Updated filters to pass parameters to API
- ⏳ Update create link function to use real API (in progress)
- ⏳ Update display sections to use fetched data (in progress)

## Environment Configuration

Add to `.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

For production:
```env
NEXT_PUBLIC_API_BASE_URL=https://api.instanvi.com
```

## Usage Pattern

### Fetching Data
```typescript
import { paymentsService } from '@/lib/api';
import { useEffect, useState } from 'react';

function MyComponent() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const response = await paymentsService.getPayments({
        page: 1,
        limit: 20,
        status: 'paid'
      });
      
      if (response.success && response.data) {
        setData(response.data.payments);
      }
      setLoading(false);
    };
    
    fetchData();
  }, []);
}
```

### Creating Resources
```typescript
const handleCreate = async (formData) => {
  const response = await paymentsService.createPaymentLink({
    type: 'Fixed',
    amount: 1000,
    currency: 'XAF',
    paymentMethods: ['MTN Mobile Money']
  });
  
  if (response.success) {
    // Handle success
  } else {
    // Handle error
    console.error(response.error);
  }
};
```

## Remaining Tasks

### High Priority
1. ✅ Create API service layer
2. ✅ Update AuthContext
3. ⏳ Complete Payments page integration
4. ⏳ Update Reports page
5. ⏳ Update Invoicing page
6. ⏳ Update Browse page
7. ⏳ Update Balance page

### Medium Priority
8. ⏳ Update Statistics page
9. ⏳ Update Notifications page
10. ⏳ Update Settings page
11. ⏳ Update Onboarding pages

## Error Handling

All API calls return a standardized response:
```typescript
{
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

Always check `response.success` before accessing `response.data`.

## Authentication

The API client automatically includes the Bearer token from localStorage in the Authorization header. Tokens are stored after successful login:
- `accessToken` - Used for API requests
- `refreshToken` - Used to refresh expired tokens

## Notes

- All API endpoints follow the patterns defined in `API_ENDPOINTS.md`
- PostgreSQL database is required for the backend
- All endpoints support pagination where applicable
- Error handling is consistent across all service modules


