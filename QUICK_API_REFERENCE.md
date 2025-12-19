# API Services Quick Reference Guide

**Last Updated:** December 9, 2025

---

## All Available Services

### 1. Authentication (`authService`)
```typescript
import { authService } from '@/lib/api';

// Sign up
await authService.signup({ email, password, username, firstName, lastName })

// Sign in
await authService.login({ email, password })

// Verify email token
await authService.verifyEmailToken(token, callbackURL)

// Password reset
await authService.forgotPassword(email)
await authService.resetPassword(token, newPassword)

// 2FA
await authService.verify2FA(token, code)

// Legacy
await authService.legacyLogin(username, password)
await authService.resendVerificationEmail(email)
```

### 2. Users (`usersService`)
```typescript
import { usersService } from '@/lib/api';

// Profile
await usersService.getProfile()
await usersService.updateProfile({ firstName, lastName, phone, username })

// Settings
await usersService.getSettings()
await usersService.updateSettings({ twoFactorEnabled, emailNotifications, smsNotifications })
await usersService.toggle2FA(enabled)
```

### 3. Payments (`paymentsService`)
```typescript
import { paymentsService } from '@/lib/api';

// Make payment
await paymentsService.makePayment({
  amount, currency, phoneNumber, type, description, metadata
})

// Check status
await paymentsService.getPaymentStatus(transactionId)

// Verify account
await paymentsService.verifyAccountHolderActive(phoneNumber, type)
await paymentsService.verifyAccountHolderBasicInfo(phoneNumber, type)

// Lists
await paymentsService.getPayments({ page, limit, status, startDate, endDate })
await paymentsService.getRefunds({ page, limit })
await paymentsService.getChargebacks({ page, limit })
```

### 4. Balance (`balanceService`)
```typescript
import { balanceService } from '@/lib/api';

// Get balance
await balanceService.getBalance(currency)

// Transactions
await balanceService.getTransactions({ page, limit, type, startDate, endDate })
```

### 5. Orders (`ordersService`)
```typescript
import { ordersService } from '@/lib/api';

// CRUD
await ordersService.createOrder({ customer_id, items, currency, organization_id, metadata })
await ordersService.listOrders({ page, limit })
await ordersService.getOrder(orderId)
await ordersService.updateOrderStatus(orderId, { status })
```

### 6. Invoices (`invoicingService`)
```typescript
import { invoicingService } from '@/lib/api';

// CRUD
await invoicingService.createInvoice({ customer_id, line_items, due_date, currency, notes })
await invoicingService.getInvoices({ page, limit, organization_id })
await invoicingService.getInvoice(invoiceId)
await invoicingService.updateInvoice(invoiceId, { line_items, due_date, notes })
await invoicingService.updateInvoiceStatus(invoiceId, { status })

// Actions
await invoicingService.sendInvoice(invoiceId)
await invoicingService.downloadInvoice(invoiceId)
```

### 7. Refunds (`refundsService`)
```typescript
import { refundsService } from '@/lib/api';

// CRUD
await refundsService.createRefund({ payment_id, amount, reason, description })
await refundsService.listRefunds({ page, limit })
await refundsService.getRefund(refundId)
```

### 8. Chargebacks (`chargebacksService`)
```typescript
import { chargebacksService } from '@/lib/api';

// CRUD
await chargebacksService.createChargeback({ payment_id, reason, description, evidence })
await chargebacksService.listChargebacks({ page, limit })
await chargebacksService.getChargeback(chargebackId)
await chargebacksService.updateChargebackStatus(chargebackId, { status })
```

### 9. Customers (`customersService`)
```typescript
import { customersService } from '@/lib/api';

// CRUD
await customersService.createCustomer({ firstName, lastName, email, phone, address, organization_id })
await customersService.listCustomers({ organization_id })
await customersService.getCustomer(customerId)
await customersService.updateCustomer(customerId, { firstName, lastName, email, phone, address })
await customersService.deleteCustomer(customerId)
```

### 10. Products (`productsService`)
```typescript
import { productsService } from '@/lib/api';

// CRUD
await productsService.createProduct({ name, description, price, currency, sku, isActive, organization_id })
await productsService.listProducts({ organization_id })
await productsService.getProduct(productId)
await productsService.updateProduct(productId, { name, description, price, sku })
await productsService.deleteProduct(productId)

// Status
await productsService.activateProduct(productId)
await productsService.deactivateProduct(productId)
```

### 11. Bank Accounts (`bankAccountsService`)
```typescript
import { bankAccountsService } from '@/lib/api';

// CRUD
await bankAccountsService.createBankAccount({ bankName, accountNumber, accountHolderName, currency, swiftCode, iban })
await bankAccountsService.listBankAccounts()
await bankAccountsService.getBankAccount(accountId)
await bankAccountsService.updateBankAccount(accountId, { bankName, accountHolderName, swiftCode, iban })

// Verify
await bankAccountsService.verifyBankAccount(accountId)
```

### 12. Applications (`applicationsService`)
```typescript
import { applicationsService } from '@/lib/api';

// CRUD
await applicationsService.createApplication({ name, description, environment, organization_id, config })
await applicationsService.listApplications({ organization_id, page, limit })
await applicationsService.getApplication(applicationId, organizationId)
await applicationsService.updateApplication(applicationId, { name, description, status, environment, config }, organizationId)
await applicationsService.deleteApplication(applicationId, organizationId)

// Credentials
await applicationsService.regenerateCredentials(applicationId, organizationId)
```

### 13. Organization (`organizationService`)
```typescript
import { organizationService } from '@/lib/api';

// Organization
await organizationService.getOrganization()
await organizationService.updateOrganization(id, { name, address, city, region })
```

### 14. Reports (`reportsService`)
```typescript
import { reportsService } from '@/lib/api';

// Reports
await reportsService.getSettlements({ startDate, endDate, status })
await reportsService.getBalanceReport({ startDate, endDate, currency })
await reportsService.exportReport({ reportType, format, startDate, endDate, filters })
```

### 15. Onboarding (`onboardingService`)
```typescript
import { onboardingService } from '@/lib/api';

// Onboarding
await onboardingService.submitStakeholderInfo({ firstName, lastName, email, phone, dateOfBirth, nationality, address, city, region, country })
await onboardingService.submitBusinessActivity({ businessName, businessType, industry, businessRegistrationNumber, vatNumber, website, description })
await onboardingService.submitPaymentMethods({ paymentMethods })
await onboardingService.uploadIDDocument(formData)
await onboardingService.getProgress()
```

---

## Response Format (All Services)

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
```

**Usage:**
```typescript
const response = await customersService.getCustomer('customer_123');

if (response.success) {
  console.log(response.data); // Type-safe data
} else {
  console.error(response.error?.message);
}
```

---

## Pagination

Services that support pagination accept these parameters:
```typescript
interface PaginationParams {
  page?: number;      // Default: 1
  limit?: number;     // Default: 10
}
```

**Response includes:**
```typescript
pagination: {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
```

---

## Common Patterns

### Create → List → Get → Update → Delete
```typescript
// Create
const createRes = await customersService.createCustomer({...});
const customerId = createRes.data?.id;

// List
const listRes = await customersService.listCustomers({ page: 1, limit: 10 });

// Get
const getRes = await customersService.getCustomer(customerId);

// Update
const updateRes = await customersService.updateCustomer(customerId, {...});

// Delete
const deleteRes = await customersService.deleteCustomer(customerId);
```

### Handle Pagination
```typescript
let allItems = [];
let page = 1;
let hasMore = true;

while (hasMore) {
  const response = await ordersService.listOrders({ page, limit: 50 });
  if (response.success) {
    allItems.push(...response.data.orders);
    hasMore = response.data.pagination.hasNext;
    page++;
  } else {
    break;
  }
}
```

### Error Handling
```typescript
try {
  const response = await paymentsService.makePayment({...});
  
  if (!response.success) {
    // API returned an error response
    console.error('API Error:', response.error?.code, response.error?.message);
    return;
  }
  
  // Success
  console.log('Payment:', response.data);
} catch (error) {
  // Network error or other exception
  console.error('Network Error:', error);
}
```

---

## Import Variations

### Option 1: Import specific service
```typescript
import { customersService } from '@/lib/api';
```

### Option 2: Import all services
```typescript
import * as API from '@/lib/api';
const { customersService, ordersService, productsService } = API;
```

### Option 3: Use destructuring in page
```typescript
import { customersService, ordersService } from '@/lib/api';
```

---

## Key Features

✅ **Type Safe:** Full TypeScript support with interfaces  
✅ **Error Handling:** Consistent error response format  
✅ **Pagination:** Built-in pagination support  
✅ **Authentication:** Automatic Bearer token handling  
✅ **File Upload:** Support for multipart/form-data  
✅ **File Download:** Support for blob responses (PDFs, CSVs, etc.)

---

## Files Modified/Created

### Created (7 new services)
- `lib/api/customers.ts`
- `lib/api/products.ts`
- `lib/api/orders.ts`
- `lib/api/refunds.ts`
- `lib/api/chargebacks.ts`
- `lib/api/bank-accounts.ts`
- `lib/api/applications.ts`

### Enhanced (3 existing services)
- `lib/api/auth.ts` - Added: forgotPassword, resetPassword, legacyLogin, resendVerificationEmail
- `lib/api/payments.ts` - Added: makePayment, getPaymentStatus, verifyAccountHolder*
- `lib/api/invoicing.ts` - Added: updateInvoice, updateInvoiceStatus

### Updated
- `lib/api/index.ts` - Exports all new services

---

## Still Need From Backend

The following endpoints are documented but require backend implementation:

**User Management:**
- `GET /customer/transactions`
- `GET /customer/transactions/:id`
- `PUT /customer/genarate-credentials`

**Organizations:**
- `POST /organizations`
- `GET /organizations/:id`
- `DELETE /organizations/:id`

**Onboarding:**
- `GET /onboarding/organizations/:organizationId/progress`
- `GET /onboarding/documents`
- `GET /onboarding/organizations/:organizationId/documents`
- `DELETE /onboarding/documents/:id`

**Reports:**
- `GET /reports/transactions`
- `GET /reports/transactions/export`
- `GET /reports/financial/export`

**Admin (7 endpoints):**
- All `/api/admin/*` endpoints

---

## Example Page Integration

```typescript
'use client';

import { useEffect, useState } from 'react';
import { customersService, Customer } from '@/lib/api';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    const response = await customersService.listCustomers({ page: 1, limit: 20 });
    if (response.success) {
      setCustomers(response.data.customers);
    }
    setLoading(false);
  }

  async function handleCreate(data: any) {
    const response = await customersService.createCustomer(data);
    if (response.success) {
      setCustomers([...customers, response.data]);
    }
  }

  return (
    <div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <h1>Customers ({customers.length})</h1>
          <ul>
            {customers.map(customer => (
              <li key={customer.id}>{customer.firstName} {customer.lastName}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
```

---

**Ready to integrate?** Start using these services in your pages! 🚀
