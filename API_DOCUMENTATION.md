# Payment Service API Documentation

**Base URL:** `http://localhost:3005/api` (Development)  
**API Version:** 1.0  
**Documentation Date:** December 2025

---

## Table of Contents

1. [Authentication](#authentication)
2. [User Management](#user-management)
3. [Payments](#payments)
4. [Balances & Transactions](#balances--transactions)
5. [Orders](#orders)
6. [Invoices](#invoices)
7. [Refunds](#refunds)
8. [Organizations](#organizations)
9. [Applications](#applications)
10. [Customers](#customers)
11. [Products](#products)
12. [Onboarding](#onboarding)
13. [Reports](#reports)
14. [Bank Accounts](#bank-accounts)
15. [Chargebacks](#chargebacks)
16. [Admin](#admin)

---

## Authentication

### Authentication Types

The API supports two authentication methods:

1. **Bearer Token (for external users)** - Used with `Authorization: Bearer <token>` header
2. **Token Header (for internal users)** - Used with `token: <token>` header
3. **API Key (for payment endpoints)** - Used with `x-api-key: <api_key>` header

**Note:** Payment endpoints require both Bearer Token AND x-api-key.

---

### 1. Login (Internal Users - Legacy)

**Endpoint:** `POST /api/login`

**Description:** Login for internal users (legacy endpoint). External users should use `/sign-in`.

**Authentication:** None

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Authentication successful",
  "data": {
    "token": "string",
    "user": {
      "id": "string",
      "username": "string",
      "email": "string",
      "role": "string"
    }
  }
}
```

---

### 2. Sign Up

**Endpoint:** `POST /api/sign-up`

**Description:** Register a new user via external auth service.

**Authentication:** None

**Request Body:**
```json
{
  "email": "string",
  "password": "string",
  "username": "string (optional)",
  "firstName": "string (optional)",
  "lastName": "string (optional)",
  "bio": "string (optional)",
  "role": "string (optional)" // Payment service role: "admin", "user", "service"
}
```

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "string",
      "email": "string",
      "username": "string",
      "isEmailVerified": boolean
    },
    "token": "string"
  }
}
```

---

### 3. Sign In

**Endpoint:** `POST /api/auth/sign-in`

**Description:** Sign in user via external auth service. If 2FA is enabled for the user, an OTP will be sent to their email and the response will indicate 2FA verification is required.

**Authentication:** None

**Request Body:**
```json
{
  "email": "string",
  "password": "string",
  "redirectUrl": "string (optional)"
}
```

**Response (2FA not enabled):**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Sign in successful",
  "data": {
    "user": {
      "id": "string",
      "email": "string",
      "username": "string",
      "role": "string"
    },
    "token": "string",
    "redirect": boolean
  }
}
```

**Response (2FA enabled):**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "2FA verification required",
  "data": {
    "twoFactorRequired": true,
    "message": "OTP sent to your email. Please verify to complete login.",
    "email": "use***@example.com"
  }
}
```

**Note:** When 2FA is enabled, you must call `/api/auth/2fa/verify` with the OTP code to complete the sign-in process.

---

### 4. Verify Email

**Endpoint:** `POST /api/verify-email`

**Description:** Verify email address with OTP.

**Authentication:** None

**Request Body:**
```json
{
  "email": "string",
  "otp": "string"
}
```

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Email verified successfully",
  "data": {}
}
```

---

### 5. Resend Verification

**Endpoint:** `POST /api/resend-verification`

**Description:** Resend email verification code.

**Authentication:** None

**Request Body:**
```json
{
  "email": "string"
}
```

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Verification code sent",
  "data": {}
}
```

---

### 6. Forgot Password

**Endpoint:** `POST /api/forgot-password`

**Description:** Request password reset.

**Authentication:** None

**Request Body:**
```json
{
  "email": "string"
}
```

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Password reset email sent",
  "data": {}
}
```

---

### 7. Reset Password

**Endpoint:** `POST /api/reset-password`

**Description:** Reset password with token.

**Authentication:** None

**Request Body:**
```json
{
  "token": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Password reset successfully",
  "data": {}
}
```

---

### 8. Enable 2FA

**Endpoint:** `POST /api/auth/2fa/enable`

**Description:** Enable 2FA by sending an OTP code to your email address. You must verify the code using `/verify` to complete the setup.

**Authentication:** Bearer Token or Token Header

**Request Body:** None (empty body)

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "OTP sent to your email. Please verify to enable 2FA.",
  "data": {
    "email": "use***@example.com",
    "message": "OTP sent successfully"
  }
}
```

---

### 9. Verify 2FA

**Endpoint:** `POST /api/auth/2fa/verify`

**Description:** Verify the OTP code. This endpoint handles two scenarios:
- **Login flow**: Provide only the code (no authentication required). The email is automatically looked up from the OTP code.
- **Enable 2FA flow**: Provide code and authentication token in header to enable 2FA for your account.

**Authentication:** 
- For login flow: None (public endpoint)
- For enable 2FA flow: Bearer Token or Token Header (required)

**Request Body:**
```json
{
  "code": "string"
}
```

**Response (Login flow - 2FA verification):**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "2FA verification successful",
  "data": {
    "user": {
      "id": "string",
      "email": "string",
      "username": "string",
      "role": "string"
    },
    "token": "string",
    "redirect": boolean,
    "verified": true
  }
}
```

**Response (Enable 2FA flow):**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "2FA enabled successfully",
  "data": {
    "enabled": true,
    "message": "Two-factor authentication has been enabled for your account. New logins will require 2FA verification."
  }
}
```

**Note:** 
- For login: The OTP code is automatically associated with the email from your sign-in attempt. No email or token is required.
- For enabling 2FA: You must be authenticated and provide the token in the header.

---

### 10. Resend 2FA OTP for Login

**Endpoint:** `POST /api/auth/2fa/send-otp`

**Description:** Resend an OTP code to your email for 2FA verification during login. Use this if you did not receive the OTP. The email must match your sign-in attempt (must have a pending sign-in session).

**Authentication:** None

**Request Body:**
```json
{
  "email": "string"
}
```

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "OTP sent to your email",
  "data": {
    "email": "use***@example.com"
  }
}
```

**Note:** This endpoint verifies that the email has a pending sign-in session before sending the OTP for security.

---

### 11. Disable 2FA

**Endpoint:** `POST /api/auth/2fa/disable`

**Description:** Disable 2FA for the authenticated user. Requires password verification for security.

**Authentication:** Bearer Token or Token Header

**Request Body:**
```json
{
  "password": "string"
}
```

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "2FA disabled successfully",
  "data": {}
}
```

---

## User Management

**Base Path:** `/api/customer`

**Authentication:** Bearer Token or Token Header

---

### 1. Get Transactions

**Endpoint:** `GET /api/customer/transactions`

**Description:** Get all user transactions with pagination.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10)

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "All transactions",
  "data": {
    "transactions": [],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100
    }
  }
}
```

---

### 2. Get Transaction by ID

**Endpoint:** `GET /api/customer/transactions/:id`

**Description:** Get specific transaction details.

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "All transactions",
  "data": {
    "id": "string",
    "amount": 0,
    "status": "string",
    "type": "string",
    "createdAt": "string"
  }
}
```

---

### 3. Get Profile

**Endpoint:** `GET /api/customer/profile`

**Description:** Get current user profile.

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Profile retrieved successfully",
  "data": {
    "id": "string",
    "username": "string",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "phone": "string",
    "image": "string",
    "role": "string"
  }
}
```

---

### 4. Update Profile

**Endpoint:** `PUT /api/customer/profile`

**Description:** Update current user profile.

**Request Body:**
```json
{
  "username": "string (optional)",
  "firstName": "string (optional)",
  "lastName": "string (optional)",
  "bio": "string (optional)"
}
```

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Profile updated successfully",
  "data": {}
}
```

---

### 5. Get Account Settings

**Endpoint:** `GET /api/customer/settings`

**Description:** Get current user account settings.

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Account settings retrieved successfully",
  "data": {
    "twoFactorEnabled": boolean,
    "emailNotifications": boolean,
    "smsNotifications": boolean
  }
}
```

---

### 6. Update Account Settings

**Endpoint:** `PUT /api/customer/settings`

**Description:** Update current user account settings.

**Request Body:**
```json
{
  "twoFactorEnabled": boolean (optional),
  "emailNotifications": boolean (optional),
  "smsNotifications": boolean (optional)
}
```

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Account settings updated successfully",
  "data": {}
}
```

---

## Payments

**Base Path:** `/api`

**Authentication:** Bearer Token + x-api-key (Both required)

**Note:** Payment endpoints can also be accessed using an Application API key. When using an application API key, the `x-api-key` header should contain the application's API key. The application will be automatically associated with the payment.

---

### 1. Make Payment

**Endpoint:** `POST /api/make-payment`

**Description:** Initialize a payment.

**Request Body:**
```json
{
  "amount": number,
  "currency": "string",
  "phoneNumber": "string",
  "type": "DEPOSIT" | "COLLECTION",
  "description": "string (optional)",
  "metadata": {} (optional)
}
```

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Payment initialized successfully",
  "data": {
    "transaction_id": "string",
    "status": "PENDING",
    "amount": 0,
    "currency": "string"
  }
}
```

---

### 2. Get Payment Status

**Endpoint:** `GET /api/payment-status/:transaction_id`

**Description:** Get payment status by transaction ID.

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Payment status",
  "data": {
    "transaction_id": "string",
    "status": "PENDING" | "SUCCESS" | "FAILED",
    "amount": 0,
    "currency": "string"
  }
}
```

---

### 3. Verify Account Holder Active

**Endpoint:** `GET /api/verify-account-holder-active`

**Description:** Verify if account holder is active.

**Query Parameters:**
- `phoneNumber` (string, required)
- `type` (enum: "DEPOSIT" | "COLLECTION", required)

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Account holder verification completed",
  "data": {
    "isActive": boolean,
    "phoneNumber": "string"
  }
}
```

---

### 4. Verify Account Holder Basic Info

**Endpoint:** `GET /api/verify-account-holder-basic-info`

**Description:** Get basic user info for account holder.

**Query Parameters:**
- `phoneNumber` (string, required)
- `type` (enum: "DEPOSIT" | "COLLECTION", required)

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Account holder basic info verification completed",
  "data": {
    "name": "string",
    "phoneNumber": "string"
  }
}
```

---

## Balances & Transactions

**Base Path:** `/api/balances`

**Authentication:** Bearer Token + x-api-key

---

### 1. Get Balance

**Endpoint:** `GET /api/balances`

**Description:** Get user balance.

**Query Parameters:**
- `currency` (string, default: "XAF")

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Balance retrieved successfully",
  "data": {
    "balance": 0,
    "pending_balance": 0,
    "currency": "string"
  }
}
```

---

### 2. Get Transaction History

**Endpoint:** `GET /api/balances/transactions`

**Description:** Get transaction history.

**Query Parameters:**
- `limit` (number, default: 50)

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Transactions retrieved successfully",
  "data": {
    "transactions": [],
    "total": 0
  }
}
```

---

## Orders

**Base Path:** `/api/orders`

**Authentication:** Bearer Token + x-api-key

---

### 1. Create Order

**Endpoint:** `POST /api/orders`

**Description:** Create a new order.

**Request Body:**
```json
{
  "customer_id": "string",
  "organization_id": "string (optional)",
  "items": [
    {
      "productId": "string",
      "name": "string",
      "quantity": number,
      "unitPrice": number,
      "totalPrice": number
    }
  ],
  "currency": "string",
  "metadata": {} (optional)
}
```

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Order created successfully",
  "data": {
    "id": "string",
    "amount": 0,
    "status": "PENDING",
    "items": []
  }
}
```

---

### 2. List Orders

**Endpoint:** `GET /api/orders`

**Description:** List all user orders.

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Orders retrieved successfully",
  "data": []
}
```

---

### 3. Get Order by ID

**Endpoint:** `GET /api/orders/:id`

**Description:** Get order details by ID.

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Order retrieved successfully",
  "data": {
    "id": "string",
    "amount": 0,
    "status": "string",
    "items": [],
    "payments": []
  }
}
```

---

### 4. Update Order Status

**Endpoint:** `PUT /api/orders/:id/status`

**Description:** Update order status.

**Request Body:**
```json
{
  "status": "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED"
}
```

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Order status updated successfully",
  "data": {}
}
```

---

## Invoices

**Base Path:** `/api/invoices`

**Authentication:** Bearer Token + x-api-key

---

### 1. Create Invoice

**Endpoint:** `POST /api/invoices`

**Description:** Create a new invoice.

**Request Body:**
```json
{
  "customer_id": "string",
  "organization_id": "string (optional)",
  "line_items": [
    {
      "productId": "string",
      "description": "string",
      "quantity": number,
      "unitPrice": number,
      "taxRate": number (optional),
      "discountRate": number (optional)
    }
  ],
  "due_date": "string (ISO date)",
  "currency": "string",
  "notes": "string (optional)"
}
```

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Invoice created successfully",
  "data": {
    "id": "string",
    "amount": 0,
    "status": "DRAFT",
    "line_items": []
  }
}
```

---

### 2. List Invoices

**Endpoint:** `GET /api/invoices`

**Description:** List all invoices.

**Query Parameters:**
- `organization_id` (string, optional)

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Invoices retrieved successfully",
  "data": []
}
```

---

### 3. Get Invoice by ID

**Endpoint:** `GET /api/invoices/:id`

**Description:** Get invoice details by ID.

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Invoice retrieved successfully",
  "data": {
    "id": "string",
    "amount": 0,
    "status": "string",
    "line_items": [],
    "customer": {},
    "payments": []
  }
}
```

---

### 4. Update Invoice

**Endpoint:** `PUT /api/invoices/:id`

**Description:** Update invoice.

**Request Body:**
```json
{
  "line_items": [],
  "due_date": "string",
  "notes": "string"
}
```

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Invoice updated successfully",
  "data": {}
}
```

---

### 5. Send Invoice

**Endpoint:** `PUT /api/invoices/:id/send`

**Description:** Send invoice to customer.

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Invoice sent successfully",
  "data": {}
}
```

---

### 6. Update Invoice Status

**Endpoint:** `PUT /api/invoices/:id/status`

**Description:** Update invoice status.

**Request Body:**
```json
{
  "status": "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED"
}
```

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Invoice status updated successfully",
  "data": {}
}
```

---

## Refunds

**Base Path:** `/api/refunds`

**Authentication:** Bearer Token + x-api-key

---

### 1. Create Refund

**Endpoint:** `POST /api/refunds`

**Description:** Create a refund for a payment.

**Request Body:**
```json
{
  "payment_id": "string",
  "amount": number,
  "reason": "string",
  "description": "string (optional)"
}
```

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Refund created successfully",
  "data": {
    "id": "string",
    "amount": 0,
    "status": "PENDING",
    "payment_id": "string"
  }
}
```

---

### 2. List Refunds

**Endpoint:** `GET /api/refunds`

**Description:** List all user refunds.

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Refunds retrieved successfully",
  "data": []
}
```

---

### 3. Get Refund by ID

**Endpoint:** `GET /api/refunds/:id`

**Description:** Get refund details by ID.

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Refund retrieved successfully",
  "data": {
    "id": "string",
    "amount": 0,
    "status": "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED",
    "payment": {}
  }
}
```

---

## Organizations

**Base Path:** `/api/organizations`

**Authentication:** Bearer Token + x-api-key

---

### 1. Create Organization

**Endpoint:** `POST /api/organizations`

**Description:** Create a new organization.

**Request Body:**
```json
{
  "name": "string",
  "type": "string",
  "address": "string (optional)",
  "phone": "string (optional)",
  "email": "string (optional)",
  "website": "string (optional)"
}
```

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Organization created successfully",
  "data": {
    "id": "string",
    "name": "string",
    "owner": {}
  }
}
```

---

### 2. List Organizations

**Endpoint:** `GET /api/organizations`

**Description:** List all user organizations.

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Organizations retrieved successfully",
  "data": []
}
```

---

### 3. Get Organization by ID

**Endpoint:** `GET /api/organizations/:id`

**Description:** Get organization details by ID.

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Organization retrieved successfully",
  "data": {
    "id": "string",
    "name": "string",
    "owner": {}
  }
}
```

---

### 4. Update Organization

**Endpoint:** `PUT /api/organizations/:id`

**Description:** Update organization.

**Request Body:**
```json
{
  "name": "string (optional)",
  "address": "string (optional)",
  "phone": "string (optional)",
  "email": "string (optional)",
  "website": "string (optional)"
}
```

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Organization updated successfully",
  "data": {}
}
```

---

### 5. Delete Organization

**Endpoint:** `DELETE /api/organizations/:id`

**Description:** Delete organization.

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Organization deleted successfully",
  "data": {}
}
```

---

## Applications

**Base Path:** `/api/applications`

**Authentication:** Bearer Token or Token Header

**Description:** Manage applications for users and organizations. Each application has its own API credentials (api_key and api_secret) that can be used for payment API access.

---

### 1. Create Application

**Endpoint:** `POST /api/applications`

**Description:** Create a new application for the authenticated user or organization.

**Request Body:**
```json
{
  "name": "string",
  "description": "string (optional)",
  "environment": "DEVELOPMENT" | "STAGING" | "PRODUCTION" (optional, default: "DEVELOPMENT"),
  "organization_id": "string (optional)",
  "config": {
    "webhook_url": "string (optional)",
    "default_currency": "string (optional)"
  }
}
```

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Application created successfully",
  "data": {
    "id": "string",
    "name": "string",
    "api_key": "string",
    "api_secret": "string",
    "environment": "string",
    "status": "ACTIVE",
    "created_at": "string"
  }
}
```

**Note:** The `api_secret` is only returned once during creation. Store it securely.

---

### 2. List Applications

**Endpoint:** `GET /api/applications`

**Description:** List all applications for the authenticated user or organization.

**Query Parameters:**
- `organization_id` (string, optional) - Filter by organization ID

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Applications retrieved successfully",
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "api_key": "string",
      "status": "ACTIVE" | "INACTIVE" | "SUSPENDED",
      "environment": "DEVELOPMENT" | "STAGING" | "PRODUCTION",
      "total_payments": 0,
      "total_volume": 0,
      "last_used_at": "string",
      "created_at": "string"
    }
  ]
}
```

**Note:** `api_secret` is not included in the list for security reasons.

---

### 3. Get Application by ID

**Endpoint:** `GET /api/applications/:id`

**Description:** Get application details by ID.

**Query Parameters:**
- `organization_id` (string, optional) - Required if application belongs to an organization

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Application retrieved successfully",
  "data": {
    "id": "string",
    "name": "string",
    "description": "string",
    "api_key": "string",
    "status": "ACTIVE" | "INACTIVE" | "SUSPENDED",
    "environment": "DEVELOPMENT" | "STAGING" | "PRODUCTION",
    "config": {
      "webhook_url": "string",
      "default_currency": "string"
    },
    "total_payments": 0,
    "total_volume": 0,
    "last_used_at": "string",
    "created_at": "string",
    "updated_at": "string"
  }
}
```

**Note:** `api_secret` is not included in the response for security reasons.

---

### 4. Update Application

**Endpoint:** `PUT /api/applications/:id`

**Description:** Update application details.

**Query Parameters:**
- `organization_id` (string, optional) - Required if application belongs to an organization

**Request Body:**
```json
{
  "name": "string (optional)",
  "description": "string (optional)",
  "status": "ACTIVE" | "INACTIVE" | "SUSPENDED" (optional),
  "environment": "DEVELOPMENT" | "STAGING" | "PRODUCTION" (optional),
  "config": {
    "webhook_url": "string (optional)",
    "default_currency": "string (optional)"
  }
}
```

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Application updated successfully",
  "data": {
    "id": "string",
    "name": "string",
    "description": "string",
    "api_key": "string",
    "status": "string",
    "environment": "string",
    "config": {},
    "updated_at": "string"
  }
}
```

---

### 5. Regenerate API Credentials

**Endpoint:** `PUT /api/applications/:id/regenerate-credentials`

**Description:** Regenerate API key and secret for an application. The old credentials will be invalidated.

**Query Parameters:**
- `organization_id` (string, optional) - Required if application belongs to an organization

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "API credentials regenerated successfully",
  "data": {
    "id": "string",
    "api_key": "string",
    "api_secret": "string"
  }
}
```

**Note:** The new `api_secret` is only returned once. Store it securely. The old credentials will no longer work.

---

### 6. Delete Application

**Endpoint:** `DELETE /api/applications/:id`

**Description:** Delete an application. This will invalidate all API credentials for this application.

**Query Parameters:**
- `organization_id` (string, optional) - Required if application belongs to an organization

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Application deleted successfully",
  "data": null
}
```

**Warning:** Deleting an application will immediately invalidate all API credentials. Any integrations using this application's API key will stop working.

---

## Customers

**Base Path:** `/api/customers`

**Authentication:** Bearer Token + x-api-key

---

### 1. Create Customer

**Endpoint:** `POST /api/customers`

**Description:** Create a new customer.

**Request Body:**
```json
{
  "organization_id": "string (optional)",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phone": "string (optional)",
  "address": "string (optional)"
}
```

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Customer created successfully",
  "data": {
    "id": "string",
    "firstName": "string",
    "lastName": "string",
    "email": "string"
  }
}
```

---

### 2. List Customers

**Endpoint:** `GET /api/customers`

**Description:** List all customers.

**Query Parameters:**
- `organization_id` (string, optional)

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Customers retrieved successfully",
  "data": []
}
```

---

### 3. Get Customer by ID

**Endpoint:** `GET /api/customers/:id`

**Description:** Get customer details by ID.

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Customer retrieved successfully",
  "data": {
    "id": "string",
    "firstName": "string",
    "lastName": "string",
    "email": "string"
  }
}
```

---

### 4. Update Customer

**Endpoint:** `PUT /api/customers/:id`

**Description:** Update customer.

**Request Body:**
```json
{
  "firstName": "string (optional)",
  "lastName": "string (optional)",
  "email": "string (optional)",
  "phone": "string (optional)",
  "address": "string (optional)"
}
```

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Customer updated successfully",
  "data": {}
}
```

---

### 5. Delete Customer

**Endpoint:** `DELETE /api/customers/:id`

**Description:** Delete customer.

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Customer deleted successfully",
  "data": {}
}
```

---

## Products

**Base Path:** `/api/products`

**Authentication:** Bearer Token + x-api-key

---

### 1. Create Product

**Endpoint:** `POST /api/products`

**Description:** Create a new product.

**Request Body:**
```json
{
  "organization_id": "string (optional)",
  "name": "string",
  "description": "string (optional)",
  "price": number,
  "currency": "string",
  "sku": "string (optional)",
  "isActive": boolean (optional)
}
```

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Product created successfully",
  "data": {
    "id": "string",
    "name": "string",
    "price": 0
  }
}
```

---

### 2. List Products

**Endpoint:** `GET /api/products`

**Description:** List all products.

**Query Parameters:**
- `organization_id` (string, optional)

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Products retrieved successfully",
  "data": []
}
```

---

### 3. Get Product by ID

**Endpoint:** `GET /api/products/:id`

**Description:** Get product details by ID.

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Product retrieved successfully",
  "data": {
    "id": "string",
    "name": "string",
    "price": 0,
    "isActive": boolean
  }
}
```

---

### 4. Update Product

**Endpoint:** `PUT /api/products/:id`

**Description:** Update product.

**Request Body:**
```json
{
  "name": "string (optional)",
  "description": "string (optional)",
  "price": number (optional),
  "sku": "string (optional)"
}
```

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Product updated successfully",
  "data": {}
}
```

---

### 5. Delete Product

**Endpoint:** `DELETE /api/products/:id`

**Description:** Delete product.

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Product deleted successfully",
  "data": {}
}
```

---

### 6. Activate Product

**Endpoint:** `PUT /api/products/:id/activate`

**Description:** Activate product.

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Product activated successfully",
  "data": {}
}
```

---

### 7. Deactivate Product

**Endpoint:** `PUT /api/products/:id/deactivate`

**Description:** Deactivate product.

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Product deactivated successfully",
  "data": {}
}
```

---

## Onboarding

**Base Path:** `/api/onboarding`

**Authentication:** Bearer Token or Token Header

---

### 1. Submit Stakeholder Information

**Endpoint:** `POST /api/onboarding/stakeholder`

**Description:** Submit stakeholder information for onboarding.

**Query Parameters:**
- `organizationId` (string, optional)

**Request Body:**
```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phone": "string",
  "role": "string",
  "idNumber": "string (optional)",
  "idType": "string (optional)"
}
```

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Stakeholder information submitted successfully",
  "data": {}
}
```

---

### 2. Submit Business Activity

**Endpoint:** `POST /api/onboarding/business`

**Description:** Submit business activity information.

**Query Parameters:**
- `organizationId` (string, optional)

**Request Body:**
```json
{
  "businessName": "string",
  "businessType": "string",
  "industry": "string",
  "registrationNumber": "string (optional)",
  "vatNumber": "string (optional)",
  "address": "string",
  "city": "string",
  "region": "string",
  "website": "string (optional)",
  "description": "string (optional)"
}
```

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Business activity submitted successfully",
  "data": {}
}
```

---

### 3. Submit Payment Methods

**Endpoint:** `POST /api/onboarding/payment-methods`

**Description:** Configure payment methods.

**Query Parameters:**
- `organizationId` (string, optional)

**Request Body:**
```json
{
  "mobileMoneyEnabled": boolean,
  "bankTransferEnabled": boolean,
  "cardPaymentsEnabled": boolean,
  "preferredCurrency": "string"
}
```

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Payment methods configured successfully",
  "data": {}
}
```

---

### 4. Upload Document

**Endpoint:** `POST /api/onboarding/documents`

**Description:** Upload document for onboarding.

**Content-Type:** `multipart/form-data`

**Query Parameters:**
- `organizationId` (string, optional)

**Form Data:**
- `file` (file, required)
- `documentType` (enum: "ID_CARD" | "PASSPORT" | "BUSINESS_REGISTRATION" | "VAT_CERTIFICATE" | "BANK_STATEMENT" | "OTHER", required)
- `documentNumber` (string, optional)
- `issuingAuthority` (string, optional)
- `expiryDate` (string, optional, ISO date format)

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Document uploaded successfully",
  "data": {
    "id": "string",
    "file_url": "string",
    "document_type": "string"
  }
}
```

---

### 5. Get Onboarding Progress

**Endpoint:** `GET /api/onboarding/progress`

**Description:** Get user onboarding progress.

**Query Parameters:**
- `organizationId` (string, optional)

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Progress retrieved successfully",
  "data": {
    "progress": 75,
    "steps": [
      {
        "step_name": "STAKEHOLDER",
        "completed": true
      },
      {
        "step_name": "BUSINESS",
        "completed": true
      },
      {
        "step_name": "PAYMENT_METHODS",
        "completed": false
      },
      {
        "step_name": "DOCUMENTS",
        "completed": false
      }
    ]
  }
}
```

---

### 6. Get Organization Onboarding Progress

**Endpoint:** `GET /api/onboarding/organizations/:organizationId/progress`

**Description:** Get organization onboarding progress.

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Progress retrieved successfully",
  "data": {
    "progress": 75,
    "steps": []
  }
}
```

---

### 7. Get Documents

**Endpoint:** `GET /api/onboarding/documents`

**Description:** Get user uploaded documents.

**Query Parameters:**
- `organizationId` (string, optional)

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Documents retrieved successfully",
  "data": []
}
```

---

### 8. Get Organization Documents

**Endpoint:** `GET /api/onboarding/organizations/:organizationId/documents`

**Description:** Get organization uploaded documents.

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Documents retrieved successfully",
  "data": []
}
```

---

### 9. Delete Document

**Endpoint:** `DELETE /api/onboarding/documents/:id`

**Description:** Delete document.

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Document deleted successfully",
  "data": {}
}
```

---

## Reports

**Base Path:** `/api/reports`

**Authentication:** Bearer Token or Token Header

---

### 1. Get Payment Report

**Endpoint:** `GET /api/reports/payments`

**Description:** Generate payment report.

**Query Parameters:**
- `startDate` (string, ISO date, optional)
- `endDate` (string, ISO date, optional)
- `status` (string, optional)
- `format` (enum: "JSON" | "CSV" | "XLSX" | "PDF", default: "JSON")

**Response (JSON format):**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Payment report generated successfully",
  "data": {
    "payments": [],
    "summary": {
      "total": 0,
      "successful": 0,
      "failed": 0
    }
  }
}
```

**Response (File formats):** Returns file download with appropriate Content-Type header.

---

### 2. Get Transaction Report

**Endpoint:** `GET /api/reports/transactions`

**Description:** Generate transaction report.

**Query Parameters:**
- `startDate` (string, ISO date, optional)
- `endDate` (string, ISO date, optional)
- `type` (string, optional)
- `format` (enum: "JSON" | "CSV" | "XLSX" | "PDF", default: "JSON")

**Response:** Similar to payment report.

---

### 3. Get Financial Report

**Endpoint:** `GET /api/reports/financial`

**Description:** Generate financial report.

**Query Parameters:**
- `startDate` (string, ISO date, optional)
- `endDate` (string, ISO date, optional)
- `currency` (string, optional)
- `format` (enum: "JSON" | "CSV" | "XLSX" | "PDF", default: "JSON")

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Financial report generated successfully",
  "data": {
    "revenue": 0,
    "refunds": 0,
    "net": 0,
    "byCurrency": {}
  }
}
```

---

### 4. Export Payment Report

**Endpoint:** `GET /api/reports/payments/export`

**Description:** Export payment report as file.

**Query Parameters:**
- `startDate` (string, ISO date, optional)
- `endDate` (string, ISO date, optional)
- `status` (string, optional)
- `format` (enum: "CSV" | "XLSX" | "PDF", default: "CSV")

**Response:** File download.

---

### 5. Export Transaction Report

**Endpoint:** `GET /api/reports/transactions/export`

**Description:** Export transaction report as file.

**Query Parameters:** Same as transaction report.

**Response:** File download.

---

### 6. Export Financial Report

**Endpoint:** `GET /api/reports/financial/export`

**Description:** Export financial report as file.

**Query Parameters:** Same as financial report.

**Response:** File download.

---

## Bank Accounts

**Base Path:** `/api/bank-accounts`

**Authentication:** Bearer Token + x-api-key

---

### 1. Create Bank Account

**Endpoint:** `POST /api/bank-accounts`

**Description:** Create a new bank account.

**Request Body:**
```json
{
  "bankName": "string",
  "accountNumber": "string",
  "accountHolderName": "string",
  "swiftCode": "string (optional)",
  "iban": "string (optional)",
  "currency": "string"
}
```

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Bank account created successfully",
  "data": {
    "id": "string",
    "bankName": "string",
    "accountNumber": "string"
  }
}
```

---

### 2. List Bank Accounts

**Endpoint:** `GET /api/bank-accounts`

**Description:** List all user bank accounts.

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Bank accounts retrieved successfully",
  "data": []
}
```

---

### 3. Get Bank Account by ID

**Endpoint:** `GET /api/bank-accounts/:id`

**Description:** Get bank account details by ID.

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Bank account retrieved successfully",
  "data": {
    "id": "string",
    "bankName": "string",
    "accountNumber": "string",
    "isVerified": boolean
  }
}
```

---

### 4. Update Bank Account

**Endpoint:** `PUT /api/bank-accounts/:id`

**Description:** Update bank account.

**Request Body:**
```json
{
  "bankName": "string (optional)",
  "accountHolderName": "string (optional)",
  "swiftCode": "string (optional)",
  "iban": "string (optional)"
}
```

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Bank account updated successfully",
  "data": {}
}
```

---

### 5. Verify Bank Account

**Endpoint:** `PUT /api/bank-accounts/:id/verify`

**Description:** Verify bank account.

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Bank account verified successfully",
  "data": {}
}
```

---

## Chargebacks

**Base Path:** `/api/chargebacks`

**Authentication:** Bearer Token + x-api-key

---

### 1. Create Chargeback

**Endpoint:** `POST /api/chargebacks`

**Description:** Create a chargeback for a payment.

**Request Body:**
```json
{
  "payment_id": "string",
  "reason": "string",
  "description": "string (optional)",
  "evidence": "string (optional)"
}
```

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Chargeback created successfully",
  "data": {
    "id": "string",
    "status": "PENDING",
    "payment_id": "string"
  }
}
```

---

### 2. List Chargebacks

**Endpoint:** `GET /api/chargebacks`

**Description:** List all user chargebacks.

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Chargebacks retrieved successfully",
  "data": []
}
```

---

### 3. Get Chargeback by ID

**Endpoint:** `GET /api/chargebacks/:id`

**Description:** Get chargeback details by ID.

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Chargeback retrieved successfully",
  "data": {
    "id": "string",
    "status": "PENDING" | "DISPUTED" | "RESOLVED",
    "payment": {}
  }
}
```

---

### 4. Update Chargeback Status

**Endpoint:** `PUT /api/chargebacks/:id/status`

**Description:** Update chargeback status.

**Request Body:**
```json
{
  "status": "PENDING" | "DISPUTED" | "RESOLVED"
}
```

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Chargeback status updated successfully",
  "data": {}
}
```

---

## Admin

**Base Path:** `/api/admin`

**Authentication:** Token Header (Admin role required)

---

### Admin Logs

**Base Path:** `/api/admin/logs`

**Authentication:** Token Header (Admin role required)

---

### 1. Get Logs

**Endpoint:** `GET /api/admin/logs`

**Description:** Get all request logs with pagination (Admin only).

**Query Parameters:**
- `page` (number, required)
- `limit` (number, optional, default: 10)

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Logs found",
  "data": {
    "logs": [],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100
    }
  }
}
```

---

### 2. Get Log by ID

**Endpoint:** `GET /api/admin/logs/:id`

**Description:** Get specific log details by ID (Admin only).

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Log found",
  "data": {
    "id": "string",
    "request": {},
    "response": {},
    "executionTime": "string",
    "createdAt": "string"
  }
}
```

---

### Admin User Management

---

### 1. Register User

---

### 1. Register User

**Endpoint:** `POST /api/admin/register`

**Description:** Register a new internal user or service (Admin only).

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "firstName": "string (optional)",
  "lastName": "string (optional)",
  "role": "admin" | "user" | "service"
}
```

**Response:**
```json
{
  "status_code": 201,
  "status": "Created",
  "message": "User registered successfully",
  "data": {
    "id": "string",
    "username": "string",
    "email": "string",
    "role": "string"
  }
}
```

---

### 2. Change User Status

**Endpoint:** `PUT /api/admin/change-status`

**Description:** Change user status to Enabled or Disabled (Admin only).

**Request Body:**
```json
{
  "id": "string",
  "status": "ACTIVE" | "INACTIVE"
}
```

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "User status updated successfully",
  "data": {}
}
```

---

### 3. Create Provider

**Endpoint:** `POST /api/admin/created-provider`

**Description:** Create a new payment provider (Admin only).

**Request Body:**
```json
{
  "name": "string",
  "type": "string",
  "config": {}
}
```

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Provider created successfully",
  "data": {}
}
```

---

### 4. Activate Provider

**Endpoint:** `PUT /api/admin/activated-provider`

**Description:** Enable or disable a provider for a user (Admin only).

**Request Body:**
```json
{
  "user_id": "string",
  "provider_id": "string",
  "isActive": boolean
}
```

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Provider status updated successfully",
  "data": {}
}
```

---

### 5. Find User

**Endpoint:** `GET /api/admin/find`

**Description:** Find user by search criteria (Admin only).

**Query Parameters:**
- `username` (string, optional)
- `email` (string, optional)
- `id` (string, optional)

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Users retrieved successfully",
  "data": []
}
```

---

## Response Format

All API responses follow this standard format:

### Success Response
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Operation successful",
  "data": {}
}
```

### Error Response
```json
{
  "status_code": 400,
  "status": "Bad Request",
  "message": "Error message",
  "data": {}
}
```

### Common Status Codes
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Unprocessable Entity
- `500` - Internal Server Error

---

## Error Handling

All errors return a consistent format:

```json
{
  "status_code": number,
  "status": "string",
  "message": "string",
  "data": {} | null
}
```

Common error scenarios:
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: User doesn't have required permissions
- **404 Not Found**: Resource doesn't exist
- **409 Conflict**: Resource already exists (e.g., duplicate email)
- **422 Unprocessable Entity**: Validation errors

---

## Notes

1. **Authentication**: 
   - Most endpoints require authentication
   - Payment endpoints require both Bearer Token AND x-api-key
   - Admin endpoints require Token Header with admin role

2. **Pagination**: 
   - List endpoints support pagination via `page` and `limit` query parameters
   - Default: `page=1`, `limit=10`

3. **Date Formats**: 
   - All dates should be in ISO 8601 format: `YYYY-MM-DDTHH:mm:ss.sssZ`

4. **File Uploads**: 
   - Use `multipart/form-data` for file uploads
   - Maximum file size limits apply

5. **Rate Limiting**: 
   - API rate limits may apply (check with backend team)

6. **Webhooks**: 
   - Payment status updates may be sent via webhooks (separate documentation)

---

## Support

For API support and questions, contact the backend development team.

**Last Updated:** December 2025

