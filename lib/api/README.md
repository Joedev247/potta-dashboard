# Instavi Payment API Integration

This directory contains the complete API integration for the Instavi Payment API.

## Structure

- `types.ts` - TypeScript type definitions for all API schemas
- `client.ts` - API client with authentication and error handling
- `auth.ts` - Authentication endpoints
- `users.ts` - User management endpoints (customer and admin)
- `payments.ts` - Payment processing endpoints
- `webhooks.ts` - Webhook and IPN endpoints
- `admin.ts` - Admin-specific endpoints
- `index.ts` - Main export file

## Usage

### Basic API Client Usage

```typescript
import { apiClient, authApi, paymentApi, userApi } from '@/lib/api';

// Login
const response = await authApi.login({ email: 'user@example.com', password: 'password' });
// Token is automatically stored in apiClient

// Make a payment
const payment = await paymentApi.makePayment({
  amount: 1000,
  currency: 'XAF',
  paymentProvider: 'MTN',
  phoneNumber: '+237612345678',
  description: 'Payment for order #123'
});

// Get user transactions
const transactions = await userApi.getCustomerTransactions();
```

### Using React Hooks

```typescript
import { usePayments, useUserTransactions, useAdmin } from '@/hooks/useApi';

function MyComponent() {
  const { makePayment, loading, error } = usePayments();
  
  const handlePayment = async () => {
    try {
      const result = await makePayment.execute({
        amount: 1000,
        currency: 'XAF',
        paymentProvider: 'MTN',
        phoneNumber: '+237612345678'
      });
      console.log('Payment successful:', result);
    } catch (err) {
      console.error('Payment failed:', err);
    }
  };
  
  return (
    <button onClick={handlePayment} disabled={loading}>
      {loading ? 'Processing...' : 'Make Payment'}
    </button>
  );
}
```

## Available Endpoints

### Authentication
- `POST /api/auth/login` - Login for internal users

### Customer Endpoints
- `PUT /api/users/customer/genarate-credentials` - Generate new credentials
- `GET /api/users/customer/transactions` - Get all transactions
- `GET /api/users/customer/transactions/{id}` - Get transaction by ID

### Admin Endpoints
- `POST /api/users/admin/register` - Register user or service
- `PUT /api/users/admin/change-status` - Change user status
- `POST /api/users/admin/created-provider` - Create new provider
- `PUT /api/users/admin/activated-provider` - Enable/disable provider
- `GET /api/users/admin/find` - Find user
- `GET /api/users/admin/logs` - Get logs
- `GET /api/users/admin/logs/{id}` - Get log by ID

### Payment Endpoints
- `POST /api/paiments/make-payment` - Make payment
- `GET /api/paiments/payment-status/{transaction_id}` - Get payment status
- `GET /api/paiments/verify-account-holder-active` - Verify account holder active
- `GET /api/paiments/verify-account-holder-basic-info` - Get account holder info

### Webhook Endpoints
- `PUT /api/paiments/webhooks/mtn-callback` - Handle MTN callback
- `GET/POST/PUT/DELETE/PATCH/OPTIONS/HEAD /api/paiments/ipn/momo` - IPN endpoints

### Admin Endpoints
- `GET /api/admin/queues` - Get admin queues

## Environment Variables

Create a `.env.local` file with:

```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Error Handling

All API calls throw errors with the following structure:

```typescript
interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}
```

Example error handling:

```typescript
try {
  await paymentApi.makePayment(paymentData);
} catch (error: ApiError) {
  if (error.statusCode === 401) {
    // Handle unauthorized
  } else if (error.statusCode === 400) {
    // Handle validation errors
    console.error(error.errors);
  }
}
```

## Authentication

The API client automatically handles authentication tokens. After login, the token is stored and included in all subsequent requests. The token is persisted in localStorage.

To logout and clear the token:

```typescript
import { authApi } from '@/lib/api';
authApi.logout();
```


