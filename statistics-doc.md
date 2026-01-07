# Statistics API Documentation

## Overview

The Statistics API provides comprehensive analytics and metrics for organizations, including overview statistics, time-series data, breakdowns by various dimensions, and paginated event listings. All endpoints require authentication and are scoped to a specific organization.

## Base URL

```
/api/organizations/{orgId}/statistics
```

## Authentication

All endpoints require Bearer token authentication. Include the token in the `Authorization` header:

```
Authorization: Bearer {your-token}
```

The token should be a Base64-encoded string in the format: `api_user:api_password`

## Response Format

All endpoints return a consistent response structure:

### Success Response
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Success message",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "status_code": 400,
  "status": "ERROR",
  "message": "Error message",
  "data": { /* error details */ }
}
```

## Endpoints

### 1. Get Overview Statistics

Get aggregated statistics for a given time period.

**Endpoint:** `GET /api/organizations/{orgId}/statistics/overview`

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `startDate` | string | Yes | Start date in ISO 8601 format | `2025-01-01T00:00:00Z` |
| `endDate` | string | Yes | End date in ISO 8601 format | `2025-01-31T23:59:59Z` |
| `tz` | string | No | IANA timezone (default: `UTC`) | `America/New_York` |

**Example Request:**
```bash
curl -X GET "https://api.example.com/api/organizations/123e4567-e89b-12d3-a456-426614174000/statistics/overview?startDate=2025-01-01T00:00:00Z&endDate=2025-01-31T23:59:59Z&tz=UTC" \
  -H "Authorization: Bearer {token}"
```

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Statistics retrieved successfully",
  "data": {
    "total_volume": 12345.67,
    "total_count": 234,
    "successful_count": 220,
    "failed_count": 14,
    "refunds_total": 120.00,
    "chargebacks_total": 0.00,
    "net_revenue": 12225.67,
    "average_amount": 56.12,
    "new_customers": 12
  }
}
```

**Metrics Explained:**
- `total_volume`: Sum of successful payment amounts
- `total_count`: Total number of payments
- `successful_count`: Number of successful payments
- `failed_count`: Number of failed payments
- `refunds_total`: Sum of all refund amounts
- `chargebacks_total`: Sum of all chargeback amounts
- `net_revenue`: total_volume - refunds_total - chargebacks_total
- `average_amount`: Average amount of successful payments
- `new_customers`: Count of new customers created in the period

---

### 2. Get Time-Series Data

Get time-series data for selected metrics with configurable granularity.

**Endpoint:** `GET /api/organizations/{orgId}/statistics/timeseries`

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `startDate` | string | Yes | Start date in ISO 8601 format | `2025-01-01T00:00:00Z` |
| `endDate` | string | Yes | End date in ISO 8601 format | `2025-01-31T23:59:59Z` |
| `granularity` | string | No | Time granularity: `hour`, `day`, `month` (default: `day`) | `day` |
| `metrics` | string[] | No | Comma-separated list of metrics (default: all) | `total_volume,total_count` |
| `tz` | string | No | IANA timezone (default: `UTC`) | `America/New_York` |
| `currency` | string | No | Filter by currency | `USD` |
| `payment_method` | string | No | Filter by payment method | `card` |
| `productId` | string | No | Filter by product ID (UUID) | `123e4567-e89b-12d3-a456-426614174000` |
| `status` | string | No | Filter by status: `SUCCESS`, `FAILED`, `PENDING` | `SUCCESS` |

**Available Metrics:**
- `total_volume`: Sum of successful payment amounts
- `total_count`: Total number of payments
- `successful_count`: Number of successful payments
- `failed_count`: Number of failed payments

**Example Request:**
```bash
curl -X GET "https://api.example.com/api/organizations/123e4567-e89b-12d3-a456-426614174000/statistics/timeseries?startDate=2025-01-01T00:00:00Z&endDate=2025-01-31T23:59:59Z&granularity=day&metrics=total_volume,total_count&status=SUCCESS" \
  -H "Authorization: Bearer {token}"
```

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Time-series data retrieved successfully",
  "data": [
    {
      "ts": "2025-01-01T00:00:00.000Z",
      "total_volume": 1234.56,
      "total_count": 23
    },
    {
      "ts": "2025-01-02T00:00:00.000Z",
      "total_volume": 2345.67,
      "total_count": 45
    },
    {
      "ts": "2025-01-03T00:00:00.000Z",
      "total_volume": 3456.78,
      "total_count": 67
    }
  ]
}
```

**Notes:**
- For date ranges > 31 days, the API automatically uses pre-aggregated data for better performance
- Timestamps are returned in ISO 8601 format
- Metrics can be passed as comma-separated string or array: `metrics=total_volume,total_count` or `metrics[]=total_volume&metrics[]=total_count`

---

### 3. Get Breakdown Statistics

Get statistics grouped by a specific dimension (currency, payment method, product, or status).

**Endpoint:** `GET /api/organizations/{orgId}/statistics/breakdown`

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `startDate` | string | Yes | Start date in ISO 8601 format | `2025-01-01T00:00:00Z` |
| `endDate` | string | Yes | End date in ISO 8601 format | `2025-01-31T23:59:59Z` |
| `groupBy` | string | Yes | Group by: `currency`, `payment_method`, `product_id`, `status` | `currency` |
| `limit` | number | No | Limit results (default: 50, max: 100) | `20` |
| `offset` | number | No | Offset for pagination (default: 0) | `0` |
| `currency` | string | No | Filter by currency | `USD` |
| `payment_method` | string | No | Filter by payment method | `card` |
| `productId` | string | No | Filter by product ID (UUID) | `123e4567-e89b-12d3-a456-426614174000` |
| `status` | string | No | Filter by status: `SUCCESS`, `FAILED`, `PENDING` | `SUCCESS` |

**Example Request:**
```bash
curl -X GET "https://api.example.com/api/organizations/123e4567-e89b-12d3-a456-426614174000/statistics/breakdown?startDate=2025-01-01T00:00:00Z&endDate=2025-01-31T23:59:59Z&groupBy=currency&limit=10" \
  -H "Authorization: Bearer {token}"
```

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Breakdown data retrieved successfully",
  "data": [
    {
      "groupValue": "USD",
      "total_volume": 12345.67,
      "total_count": 150,
      "successful_count": 145,
      "failed_count": 5
    },
    {
      "groupValue": "EUR",
      "total_volume": 9876.54,
      "total_count": 120,
      "successful_count": 118,
      "failed_count": 2
    }
  ]
}
```

**Notes:**
- Results are sorted by `total_volume` in descending order
- `groupValue` contains the value of the dimension you're grouping by
- Use `offset` and `limit` for pagination

---

### 4. Get Payment Events

Get a paginated list of payment events (transactions) with filtering options.

**Endpoint:** `GET /api/organizations/{orgId}/statistics/events`

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `startDate` | string | Yes | Start date in ISO 8601 format | `2025-01-01T00:00:00Z` |
| `endDate` | string | Yes | End date in ISO 8601 format | `2025-01-31T23:59:59Z` |
| `page` | number | No | Page number (default: 1) | `1` |
| `pageSize` | number | No | Items per page (default: 20, max: 100) | `20` |
| `status` | string | No | Filter by status: `SUCCESS`, `FAILED`, `PENDING` | `SUCCESS` |
| `currency` | string | No | Filter by currency | `USD` |
| `minAmount` | number | No | Minimum amount filter | `10.00` |
| `maxAmount` | number | No | Maximum amount filter | `1000.00` |
| `customerId` | string | No | Filter by customer ID (UUID) | `123e4567-e89b-12d3-a456-426614174000` |
| `productId` | string | No | Filter by product ID (UUID) | `123e4567-e89b-12d3-a456-426614174000` |

**Example Request:**
```bash
curl -X GET "https://api.example.com/api/organizations/123e4567-e89b-12d3-a456-426614174000/statistics/events?startDate=2025-01-01T00:00:00Z&endDate=2025-01-31T23:59:59Z&page=1&pageSize=20&status=SUCCESS&minAmount=10" \
  -H "Authorization: Bearer {token}"
```

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Events retrieved successfully",
  "data": {
    "items": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "amount": 99.99,
        "currency": "USD",
        "status": "SUCCESS",
        "createdAt": "2025-01-15T10:30:00.000Z",
        "customerId": "456e7890-e89b-12d3-a456-426614174000",
        "productId": "789e0123-e89b-12d3-a456-426614174000",
        "payment_method": "card"
      },
      {
        "id": "234e5678-e89b-12d3-a456-426614174000",
        "amount": 149.50,
        "currency": "USD",
        "status": "SUCCESS",
        "createdAt": "2025-01-15T11:45:00.000Z",
        "customerId": "567e8901-e89b-12d3-a456-426614174000",
        "productId": "890e1234-e89b-12d3-a456-426614174000",
        "payment_method": "wallet"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

**Notes:**
- Results are sorted by `createdAt` in descending order (newest first)
- `payment_method` may be `unknown` if not specified
- `customerId` and `productId` may be `null` if not associated

---

### 5. Refresh Statistics (Admin Only)

Manually trigger a refresh of pre-aggregated statistics for a date range. This endpoint requires admin role.

**Endpoint:** `POST /api/organizations/{orgId}/statistics/refresh`

**Authentication:** Requires admin role (use JWT token with admin role)

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `startDate` | string | Yes | Start date in ISO 8601 format | `2025-01-01T00:00:00Z` |
| `endDate` | string | Yes | End date in ISO 8601 format | `2025-01-31T23:59:59Z` |

**Example Request:**
```bash
curl -X POST "https://api.example.com/api/organizations/123e4567-e89b-12d3-a456-426614174000/statistics/refresh?startDate=2025-01-01T00:00:00Z&endDate=2025-01-31T23:59:59Z" \
  -H "Authorization: Bearer {admin-token}"
```

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Statistics refreshed successfully",
  "data": {
    "daysProcessed": 31
  }
}
```

**Notes:**
- Date range cannot exceed 365 days
- This operation may take some time for large date ranges
- Use this endpoint when you need to rebuild statistics after data corrections

---

## Error Handling

### Common Error Codes

| Status Code | Description |
|-------------|-------------|
| `400` | Bad Request - Invalid parameters or validation errors |
| `401` | Unauthorized - Missing or invalid authentication token |
| `403` | Forbidden - Insufficient permissions |
| `500` | Internal Server Error - Server-side error |

### Error Response Example

```json
{
  "status_code": 400,
  "status": "ERROR",
  "message": "Start date must be before end date",
  "data": null
}
```

### Common Validation Errors

- **Invalid date format**: Dates must be in ISO 8601 format (e.g., `2025-01-01T00:00:00Z`)
- **Date range too large**: Date ranges cannot exceed 365 days
- **Invalid granularity**: Must be one of: `hour`, `day`, `month`
- **Invalid groupBy**: Must be one of: `currency`, `payment_method`, `product_id`, `status`
- **Invalid page size**: Must be between 1 and 100

---

## Best Practices

### 1. Date Ranges
- Keep date ranges reasonable for better performance
- For large ranges (>31 days), the API automatically uses pre-aggregated data
- Use timezone parameter (`tz`) to align data with user's local timezone

### 2. Caching
- Responses are cached for 5 minutes
- Cache keys are based on query parameters, so identical queries will return cached results
- For real-time data, consider shorter cache TTLs or manual refresh

### 3. Pagination
- Use appropriate `pageSize` values (20-50 is recommended)
- For large datasets, implement infinite scroll or "Load More" patterns

### 4. Metrics Selection
- Only request metrics you need to reduce payload size
- Default metrics include: `total_volume`, `total_count`, `successful_count`, `failed_count`

### 5. Error Handling
- Always handle error responses gracefully
- Display user-friendly error messages
- Implement retry logic for 500 errors

---

## Frontend Integration Examples

### JavaScript/TypeScript (Fetch API)

```typescript
interface OverviewStats {
  total_volume: number;
  total_count: number;
  successful_count: number;
  failed_count: number;
  refunds_total: number;
  chargebacks_total: number;
  net_revenue: number;
  average_amount: number;
  new_customers: number;
}

async function getOverviewStats(
  orgId: string,
  startDate: string,
  endDate: string,
  token: string
): Promise<OverviewStats> {
  const url = new URL(
    `/api/organizations/${orgId}/statistics/overview`,
    'https://api.example.com'
  );
  url.searchParams.set('startDate', startDate);
  url.searchParams.set('endDate', endDate);
  url.searchParams.set('tz', 'UTC');

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch statistics');
  }

  const data = await response.json();
  return data.data;
}
```

### React Hook Example

```typescript
import { useState, useEffect } from 'react';

function useStatistics(orgId: string, startDate: string, endDate: string) {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        const data = await getOverviewStats(orgId, startDate, endDate, token);
        setStats(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        setStats(null);
      } finally {
        setLoading(false);
      }
    }

    if (orgId && startDate && endDate) {
      fetchStats();
    }
  }, [orgId, startDate, endDate]);

  return { stats, loading, error };
}
```

### Axios Example

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://api.example.com',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Get time-series data
async function getTimeSeries(
  orgId: string,
  params: {
    startDate: string;
    endDate: string;
    granularity?: 'hour' | 'day' | 'month';
    metrics?: string[];
  }
) {
  const response = await apiClient.get(
    `/api/organizations/${orgId}/statistics/timeseries`,
    { params }
  );
  return response.data.data;
}
```

---

## Rate Limiting

Currently, there are no strict rate limits, but we recommend:
- Maximum 60 requests per minute per organization
- Implement client-side throttling for dashboard auto-refresh
- Use WebSocket or Server-Sent Events for real-time updates (if available)

---

## Support

For questions or issues, please contact the backend team or refer to the main API documentation.

---

## Changelog

### Version 1.0.0 (2025-01-19)
- Initial release
- Overview statistics endpoint
- Time-series endpoint
- Breakdown endpoint
- Events endpoint
- Admin refresh endpoint

