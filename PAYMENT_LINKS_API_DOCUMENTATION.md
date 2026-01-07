# Payment Links API Documentation

## Overview

The Payment Links API allows you to create, manage, and process payment links. Payment links are shareable URLs that enable customers to make payments without requiring direct API integration. This is useful for invoices, one-time payments, or scenarios where you need to send payment requests via email, SMS, or other channels.

## Base URL

```
Production: https://payments.prod.instanvi.com/api
Development: https://payments.dev.instanvi.com/api
```

## Authentication

Most endpoints require authentication using an API key in the `x-api-key` header. The API key is associated with an application and automatically provides user and organization context.

**Required Header:**
```
x-api-key: <your-api-key>
```

**Note:** The `GET /payment-links/:slug` endpoint is public and does not require authentication.

---

## Enums and Types

### PaymentLinkStatus
```typescript
enum PaymentLinkStatus {
  ACTIVE = 'ACTIVE',      // Link is active and can be used
  PAID = 'PAID',          // Payment has been completed
  EXPIRED = 'EXPIRED',    // Link has expired
  CANCELLED = 'CANCELLED' // Link has been cancelled
}
```

### PaymentProviders
```typescript
enum PaymentProviders {
  MTN_CAM = 'MTN_CAM',           // MTN Mobile Money Cameroon
  ORANGE_CAM = 'ORANGE_CAM'      // Orange Money Cameroon
}
```

### PaymentType
```typescript
enum PaymentType {
  DEPOSIT = 'DEPOSIT',           // Money coming into the system
  COLLECTION = 'COLLECTION'      // Money being collected (default)
}
```

### PaymentMode
```typescript
enum PaymentMode {
  LIVE = 'LIVE',                 // Live/production mode
  SANDBOX = 'SANDBOX'            // Sandbox/test mode (default)
}
```

---

## API Endpoints

### 1. Create Payment Link

Create a new payment link that can be shared with customers.

**Endpoint:** `POST /payment-links/create`

**Authentication:** Required (`x-api-key`)

**Request Body:**
```json
{
  "amount": 10000,                    // Required: Payment amount (minimum: 1)
  "currency": "XAF",                  // Optional: Currency code (default: "XAF")
  "description": "Payment for invoice #123",  // Optional: Description
  "expires_at": "2025-12-31T23:59:59Z",      // Optional: ISO 8601 expiration date
  "provider": "MTN_CAM",              // Optional: Preferred payment provider
  "type": "COLLECTION",               // Optional: Payment type (default: "COLLECTION")
  "max_uses": 1,                      // Optional: Maximum uses (1-100, default: 1)
  "metadata": {                       // Optional: Custom metadata object
    "invoice_id": "123",
    "customer_email": "customer@example.com"
  }
}
```

**Response (Success - 200):**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Payment link created successfully",
  "data": {
    "id": "uuid-here",
    "slug": "pay_abc123xyz",
    "url": "https://payments.dev.instanvi.com/pay/pay_abc123xyz",
    "amount": 10000,
    "currency": "XAF",
    "status": "ACTIVE",
    "expires_at": "2025-12-31T23:59:59.000Z",
    "max_uses": 1,
    "current_uses": 0
  }
}
```

**Response (Error - 400):**
```json
{
  "status_code": 400,
  "status": "BAD REQUEST",
  "message": "Invalid expiration date format",
  "data": {}
}
```

**Validation Rules:**
- `amount`: Required, must be >= 1
- `currency`: Optional, defaults to "XAF"
- `expires_at`: Must be a valid ISO 8601 date string, cannot be in the past
- `max_uses`: Must be between 1 and 100 (inclusive)
- `metadata`: Must be a valid JSON object

---

### 2. Get Payment Link by Slug (Public)

Retrieve payment link details by its slug. This endpoint is public and does not require authentication.

**Endpoint:** `GET /payment-links/:slug`

**Authentication:** Not required

**URL Parameters:**
- `slug` (string, required): The payment link slug (e.g., `pay_abc123xyz`)

**Response (Success - 200):**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Payment link found",
  "data": {
    "id": "uuid-here",
    "slug": "pay_abc123xyz",
    "amount": 10000,
    "currency": "XAF",
    "description": "Payment for invoice #123",
    "status": "ACTIVE",
    "expires_at": "2025-12-31T23:59:59.000Z",
    "metadata": {
      "invoice_id": "123",
      "customer_email": "customer@example.com"
    },
    "max_uses": 1,
    "current_uses": 0,
    "created_at": "2025-01-15T10:30:00.000Z"
  }
}
```

**Response (Error - 404):**
```json
{
  "status_code": 404,
  "status": "NOT FOUND",
  "message": "Payment link not found",
  "data": {}
}
```

**Response (Error - 410):**
```json
{
  "status_code": 410,
  "status": "GONE",
  "message": "Payment link has already been paid",
  "data": {}
}
```

**Possible 410 Errors:**
- "Payment link has already been paid"
- "Payment link has been cancelled"
- "Payment link has expired"
- "Payment link has reached maximum uses"

---

### 3. Redeem Payment Link

Process a payment using a payment link. This initiates the payment transaction.

**Endpoint:** `POST /payment-links/:slug/redeem`

**Authentication:** Not required (public endpoint)

**URL Parameters:**
- `slug` (string, required): The payment link slug

**Request Body:**
```json
{
  "phone_number": 671381152,        // Required: Customer phone number
  "provider": "MTN_CAM"              // Required: Payment provider to use
}
```

**Response (Success - 200):**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Payment link redeemed successfully",
  "data": {
    "payment_link": {
      "id": "uuid-here",
      "slug": "pay_abc123xyz",
      "status": "PAID",
      "current_uses": 1
    },
    "payment": {
      "id": "payment-uuid",
      "amount": 10000,
      "currency": "XAF",
      "status": "PENDING",
      "transaction_id": "pl_pay_abc123xyz_1234567890"
    }
  }
}
```

**Response (Error - 404):**
```json
{
  "status_code": 404,
  "status": "NOT FOUND",
  "message": "Payment link not found",
  "data": {}
}
```

**Response (Error - 410):**
```json
{
  "status_code": 410,
  "status": "GONE",
  "message": "Payment link has already been paid",
  "data": {}
}
```

**Possible 410 Errors:**
- "Payment link has already been paid"
- "Payment link has been cancelled"
- "Payment link has expired"
- "Payment link has reached maximum uses"
- "Payment link is no longer available"

**Response (Error - 400):**
```json
{
  "status_code": 400,
  "status": "BAD REQUEST",
  "message": "Payment initialization failed",
  "data": {}
}
```

---

### 4. List Payment Links

Retrieve a paginated list of payment links for the authenticated user/organization.

**Endpoint:** `GET /payment-links`

**Authentication:** Required (`x-api-key`)

**Query Parameters:**
- `status` (optional): Filter by status (`ACTIVE`, `PAID`, `EXPIRED`, `CANCELLED`)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, maximum: 200)

**Example Request:**
```
GET /payment-links?status=ACTIVE&page=1&limit=20
```

**Response (Success - 200):**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Payment links retrieved",
  "data": {
    "items": [
      {
        "id": "uuid-1",
        "slug": "pay_abc123xyz",
        "amount": 10000,
        "currency": "XAF",
        "status": "ACTIVE",
        "expires_at": "2025-12-31T23:59:59.000Z",
        "current_uses": 0,
        "max_uses": 1,
        "created_at": "2025-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "total_pages": 3
    }
  }
}
```

---

### 5. Get Payment Link by ID

Retrieve a specific payment link by its ID. Only accessible by the creator or organization.

**Endpoint:** `GET /payment-links/id/:id`

**Authentication:** Required (`x-api-key`)

**URL Parameters:**
- `id` (string, required): The payment link UUID

**Response (Success - 200):**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Payment link retrieved",
  "data": {
    "id": "uuid-here",
    "slug": "pay_abc123xyz",
    "amount": 10000,
    "currency": "XAF",
    "description": "Payment for invoice #123",
    "status": "ACTIVE",
    "expires_at": "2025-12-31T23:59:59.000Z",
    "metadata": {},
    "max_uses": 1,
    "current_uses": 0,
    "created_at": "2025-01-15T10:30:00.000Z",
    "updated_at": "2025-01-15T10:30:00.000Z"
  }
}
```

**Response (Error - 404):**
```json
{
  "status_code": 404,
  "status": "NOT FOUND",
  "message": "Payment link not found",
  "data": {}
}
```

---

### 6. Update Payment Link

Update an existing payment link. Cannot update paid or cancelled links.

**Endpoint:** `PATCH /payment-links/:id`

**Authentication:** Required (`x-api-key`)

**URL Parameters:**
- `id` (string, required): The payment link UUID

**Request Body:**
```json
{
  "description": "Updated description",           // Optional
  "expires_at": "2025-12-31T23:59:59Z",          // Optional: ISO 8601 date
  "status": "ACTIVE",                             // Optional: PaymentLinkStatus
  "max_uses": 5,                                  // Optional: 1-100, must be >= current_uses
  "metadata": {                                   // Optional: Merged with existing metadata
    "new_field": "value"
  }
}
```

**Response (Success - 200):**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Payment link updated successfully",
  "data": {
    "id": "uuid-here",
    "slug": "pay_abc123xyz"
  }
}
```

**Response (Error - 400):**
```json
{
  "status_code": 400,
  "status": "BAD REQUEST",
  "message": "Cannot update a paid or cancelled payment link",
  "data": {}
}
```

**Validation Rules:**
- Cannot update links with status `PAID` or `CANCELLED`
- `expires_at`: Must be a valid ISO 8601 date, cannot be in the past
- `max_uses`: Must be >= `current_uses`
- `metadata`: Merged with existing metadata (not replaced)

---

### 7. Cancel Payment Link

Cancel an active payment link. Cannot cancel paid or already cancelled links.

**Endpoint:** `POST /payment-links/:id/cancel`

**Authentication:** Required (`x-api-key`)

**URL Parameters:**
- `id` (string, required): The payment link UUID

**Response (Success - 200):**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Payment link cancelled successfully",
  "data": {
    "id": "uuid-here",
    "slug": "pay_abc123xyz",
    "status": "CANCELLED"
  }
}
```

**Response (Error - 400):**
```json
{
  "status_code": 400,
  "status": "BAD REQUEST",
  "message": "Cannot cancel a paid or already cancelled payment link",
  "data": {}
}
```

---

## Response Format

All API responses follow a consistent structure:

**Success Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Success message",
  "data": {}
}
```

**Error Response:**
```json
{
  "status_code": 400,
  "status": "BAD REQUEST",
  "message": "Error message",
  "data": {}
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors, invalid data)
- `401` - Unauthorized (missing or invalid API key)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict
- `410` - Gone (resource no longer available - expired, paid, cancelled)
- `422` - Unprocessable Entity
- `500` - Internal Server Error

---

## Error Handling

### Common Error Scenarios

1. **Invalid API Key (401)**
   - Missing `x-api-key` header
   - Invalid or inactive API key
   - Associated application is inactive

2. **Validation Errors (400)**
   - Invalid amount (must be >= 1)
   - Invalid date format
   - Date in the past
   - Invalid enum values
   - Max uses less than current uses

3. **Resource Not Found (404)**
   - Payment link doesn't exist
   - Payment link ID doesn't belong to user/organization

4. **Resource Gone (410)**
   - Payment link already paid
   - Payment link cancelled
   - Payment link expired
   - Maximum uses reached

5. **Business Logic Errors (400)**
   - Cannot update paid/cancelled links
   - Cannot cancel paid/cancelled links
   - Payment initialization failed

---

## Integration Flow

### Typical Integration Flow

1. **Create Payment Link**
   ```
   POST /payment-links/create
   → Returns payment link with URL
   ```

2. **Share Link with Customer**
   ```
   Share the URL: https://payments.dev.instanvi.com/pay/pay_abc123xyz
   ```

3. **Customer Views Payment Page** (Frontend)
   ```
   GET /payment-links/:slug (public)
   → Display payment details
   ```

4. **Customer Initiates Payment** (Frontend)
   ```
   POST /payment-links/:slug/redeem
   → Process payment
   ```

5. **Monitor Payment Status** (Backend)
   ```
   GET /payment-links/id/:id
   → Check status, payment details
   ```

### Frontend Integration Example

```javascript
// 1. Create payment link (backend)
const createPaymentLink = async (amount, description) => {
  const response = await fetch('https://payments.dev.instanvi.com/api/payment-links/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'your-api-key'
    },
    body: JSON.stringify({
      amount: amount,
      description: description,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      max_uses: 1
    })
  });
  
  const data = await response.json();
  return data.data.url; // Share this URL with customer
};

// 2. Get payment link details (public, no auth needed)
const getPaymentLink = async (slug) => {
  const response = await fetch(`https://payments.dev.instanvi.com/api/payment-links/${slug}`);
  const data = await response.json();
  return data.data;
};

// 3. Redeem payment link (public, no auth needed)
const redeemPaymentLink = async (slug, phoneNumber, provider) => {
  const response = await fetch(`https://payments.dev.instanvi.com/api/payment-links/${slug}/redeem`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      phone_number: phoneNumber,
      provider: provider
    })
  });
  
  const data = await response.json();
  return data.data;
};
```

---

## Best Practices

1. **Expiration Dates**: Always set reasonable expiration dates to prevent stale links
2. **Max Uses**: Set `max_uses` appropriately based on your use case (1 for one-time payments)
3. **Metadata**: Use metadata to store relevant business information (invoice IDs, customer info, etc.)
4. **Error Handling**: Always handle 410 (Gone) errors gracefully - these indicate the link is no longer usable
5. **Caching**: Payment links are cached for 10 minutes - consider this when checking status
6. **Security**: Never expose API keys in frontend code - use backend to create links
7. **Monitoring**: Regularly check payment link status to handle expired or cancelled links

---

## Rate Limiting

Rate limiting may apply. Check response headers for rate limit information:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when rate limit resets

---

## Support

For issues or questions, contact the API support team or refer to the main API documentation.

---

## Changelog

### Version 1.0.0
- Initial release of Payment Links API
- Support for creating, updating, and redeeming payment links
- Public endpoints for customer-facing payment pages
- Pagination support for listing payment links
- Caching for improved performance
