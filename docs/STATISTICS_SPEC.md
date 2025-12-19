# Statistics Page — Backend Spec

Purpose: provide a complete, actionable guide for the backend developer (NestJS + Postgres) to implement the Statistics feature used by the frontend `Statistics` page. This document lists UI features, functional logic, API endpoints, request/response shapes, database schema / indexes, aggregation queries, caching and background jobs, auth/permissions, testing notes and rollout recommendations.

---

## 1. High-level Goals
- Provide fast, accurate metrics and time-series charts for an organization.
- Support point-in-time queries (range + granularity) and breakdowns by dimensions (status, currency, product, payment method).
- Support event listing (paginated) for drilldowns.
- Keep queries performant for large datasets via indexes, pre-aggregations, and caching.

## 2. Required Metrics (frontend requests these)
Each metric should be available as a time-series (granularity: hour/day/month) and as an aggregated total for the selected period.

- total_volume: SUM(amount) of successful transactions (decimal)
- total_count: COUNT(transactions) total
- successful_count: COUNT(transactions WHERE status = 'SUCCESS')
- failed_count: COUNT(transactions WHERE status = 'FAILED')
- refunds_total: SUM(refunds.amount)
- chargebacks_total: SUM(chargebacks.amount)
- net_revenue: total_volume - refunds_total - chargebacks_total
- average_amount: AVG(amount) of successful transactions
- new_customers: COUNT(DISTINCT customer_id) (customers created in period)
- churned_customers: customers with cancellations in period (if applicable)

Additionally provide breakdowns by:
- currency
- payment_method (card, wallet, bank_transfer, etc.)
- product or sku (if applicable)

## 3. UI Features & Expected API Behavior

- Overview cards (totals for period)
  - Response: single aggregated object with metrics above.

- Time-series chart(s)
  - Query params: `startDate`, `endDate`, `granularity` (`hour|day|month`), `tz` (optional timezone), `metrics[]` (list)
  - Response: array of { ts: string, metricA: number, metricB: number, ... }

- Breakdown table (by payment method / currency / product)
  - Query params: same range + `groupBy` (e.g., `currency`, `payment_method`, `product_id`) + `limit` + `offset`
  - Response: array of { groupValue, total_volume, total_count, successful_count, failed_count }

- Events (paginated list of transactions / payments)
  - Query params: `startDate`, `endDate`, `cursor` or `page` + `pageSize`, filters (status, currency, minAmount, maxAmount, customerId, productId)
  - Response: paginated list of transactions with minimal fields required by UI (id, amount, currency, status, createdAt, customerId, productId, payment_method)

## 4. API Endpoints (recommended)
Base path: `/api/organizations/:orgId/statistics` (orgId optional if JWT contains org claim)

1) GET `/api/organizations/:orgId/statistics/overview`
- Purpose: single aggregated metrics for the given period
- Query params: `startDate` (ISO), `endDate` (ISO), `tz` (IANA timezone), `groupBy` (optional)
- Response example:

```json
{
  "success": true,
  "data": {
    "total_volume": 12345.67,
    "total_count": 234,
    "successful_count": 220,
    "failed_count": 14,
    "refunds_total": 120.00,
    "chargebacks_total": 0.00,
    "net_revenue": 121.67,
    "average_amount": 56.02,
    "new_customers": 12
  }
}
```

2) GET `/api/organizations/:orgId/statistics/timeseries`
- Purpose: time-series data for selected metrics and granularity
- Query params:
  - `startDate` (ISO)
  - `endDate` (ISO)
  - `granularity` = `hour|day|month` (default `day`)
  - `metrics` = comma-separated list or repeated `metrics=total_volume&metrics=total_count`
  - `tz` optional
  - filters: `currency`, `payment_method`, `productId`, `status`
- Response: array ordered ascending by timestamp

Example item:

```json
{ "ts": "2025-12-01T00:00:00Z", "total_volume": 123.45, "total_count": 3 }
```

3) GET `/api/organizations/:orgId/statistics/breakdown`
- Purpose: grouped aggregates
- Query params: `startDate`, `endDate`, `groupBy` (required), `limit`, `offset`, filters
- Response: array of groups with aggregates

4) GET `/api/organizations/:orgId/statistics/events`
- Purpose: paginated transaction/event list
- Query params: `startDate`, `endDate`, `page`, `pageSize` (or `cursor`), filter params
- Response: { items: Transaction[], nextCursor? }

5) POST `/api/organizations/:orgId/statistics/refresh` (admin only)
- Purpose: trigger manual rebuild of materialized views or pre-aggregations

## 5. Database: Tables & Indexes (Postgres)

Assumption: application already has core tables `payments` (or `transactions`), `refunds`, `chargebacks`, `orders`, `customers`, `invoices`.

If not present, create or confirm these columns at minimum:

- payments (transactions)
  - id: uuid (pk)
  - organization_id: uuid (indexed)
  - amount: numeric(14,2)
  - currency: text
  - status: text (e.g., SUCCESS, FAILED, PENDING)
  - payment_method: text
  - product_id: uuid (nullable)
  - customer_id: uuid (nullable)
  - created_at: timestamptz
  - updated_at: timestamptz
  - metadata: jsonb (optional)

- refunds
  - id, organization_id, payment_id, amount, currency, created_at

- chargebacks
  - id, organization_id, payment_id, amount, currency, created_at

- customers
  - id, organization_id, created_at, email, status, metadata

Indexes (minimum):

```sql
CREATE INDEX ON payments (organization_id, created_at DESC);
CREATE INDEX ON payments (organization_id, status);
CREATE INDEX ON payments (organization_id, currency);
CREATE INDEX ON payments (organization_id, product_id);
CREATE INDEX ON payments (organization_id, customer_id);

CREATE INDEX ON refunds (organization_id, created_at DESC);
CREATE INDEX ON chargebacks (organization_id, created_at DESC);
CREATE INDEX ON customers (organization_id, created_at DESC);
```

Consider a composite index for commonly-used filters, e.g. `(organization_id, status, created_at)`.

## 6. Aggregation Queries (examples)

- Total volume and counts for a period (single query):

```sql
SELECT
  SUM(CASE WHEN status = 'SUCCESS' THEN amount ELSE 0 END)::numeric(14,2) AS total_volume,
  COUNT(*) AS total_count,
  COUNT(*) FILTER (WHERE status = 'SUCCESS') AS successful_count,
  COUNT(*) FILTER (WHERE status = 'FAILED') AS failed_count,
  AVG(NULLIF(amount,0)) FILTER (WHERE status = 'SUCCESS') AS average_amount
FROM payments
WHERE organization_id = $1
  AND created_at >= $2
  AND created_at < $3;
```

- Time-series aggregation (granularity = day):

```sql
SELECT date_trunc('day', created_at AT TIME ZONE $tz) AS day,
  SUM(CASE WHEN status = 'SUCCESS' THEN amount ELSE 0 END) AS total_volume,
  COUNT(*) AS total_count
FROM payments
WHERE organization_id = $1
  AND created_at >= $2
  AND created_at < $3
GROUP BY day
ORDER BY day ASC;
```

- Breakdown by currency:

```sql
SELECT currency, SUM(amount) AS total_volume, COUNT(*) AS total_count
FROM payments
WHERE organization_id = $1
  AND created_at >= $2
  AND created_at < $3
GROUP BY currency
ORDER BY total_volume DESC
LIMIT 50;
```

Notes:
- Use `timestamptz` and apply `AT TIME ZONE` where appropriate to return time-series aligned with the user's timezone.
- For large volumes, use materialized views or summary tables (daily/hourly) and refresh them incrementally.

## 7. Pre-aggregation Strategy

- Create `statistics_daily` and `statistics_hourly` tables (organization_id, date, metric columns) populated by a background job.
- Refresh policy:
  - Real-time: compute on-demand for small orgs / short ranges.
  - Pre-aggregated: nightly job to summarize previous day and incremental job for recent window (last N hours).

Example migration for daily summary:

```sql
CREATE TABLE statistics_daily (
  organization_id uuid NOT NULL,
  date date NOT NULL,
  total_volume numeric(20,2) DEFAULT 0,
  total_count bigint DEFAULT 0,
  successful_count bigint DEFAULT 0,
  failed_count bigint DEFAULT 0,
  refunds_total numeric(20,2) DEFAULT 0,
  chargebacks_total numeric(20,2) DEFAULT 0,
  PRIMARY KEY (organization_id, date)
);
CREATE INDEX ON statistics_daily (organization_id, date);
```

Population job (sketch):
- hourly job aggregates payments created in the past hour and upserts into `statistics_hourly`.
- daily job computes daily metrics and upserts into `statistics_daily`.

## 8. NestJS Implementation Guidance

- Controller: `StatisticsController` with endpoints above. Use guards to validate org membership and permissions.
- Service: `StatisticsService` implements aggregation logic, uses repository/pg pool for queries.
- DTOs: validate `startDate`, `endDate`, `granularity`, `metrics`, `tz`, filters.

Example DTO (TypeScript):

```ts
export class StatsRangeDto {
  @IsISO8601()
  startDate: string;

  @IsISO8601()
  endDate: string;

  @IsOptional()
  @IsIn(['hour','day','month'])
  granularity?: 'hour' | 'day' | 'month';

  @IsOptional()
  metrics?: string; // comma-separated
}
```

Service stub:

```ts
async getTimeSeries(orgId: string, dto: StatsRangeDto) {
  // validate range size and granularity
  // if (range too large) -> use pre-aggregated tables
  // build SQL with params and filters
  // return rows mapped to { ts, ... }
}
```

## 9. Caching & Performance

- Use Redis for short-term caching of timeseries/overview queries keyed by orgId+params.
- Cache TTL: 30s–5m depending on freshness needs; longer for coarse granularity.
- For expensive ranges, return cached materialized view results and trigger an async refresh.
- Use prepared statements and parameterized queries.

## 10. Background Jobs

- Worker (BullMQ / Agenda / Nest + @nestjs/bull):
  - `hourly:aggregate-payments-hourly`
  - `daily:aggregate-payments-daily`
  - `refresh:materialized-views` (manual or scheduled)

Job responsibilities:
- Aggregate source tables into `statistics_hourly` / `statistics_daily`.
- Rebuild materialized views after schema changes.

## 11. Auth, Permissions & Rate Limits

- All endpoints require authentication and the org context.
- Apply RBAC: `statistics.read` scope for standard users, `statistics.admin` for refresh endpoints.
- Rate-limit queries per org or per token to prevent abuse (e.g., 60/min for heavy endpoints).

## 12. Error Handling & Response Format

- Always return `{ success: boolean, data?: any, error?: { code, message } }`.
- For query parameter errors return 400.
- For permissions return 403.

## 13. Tests & QA

- Unit tests for service logic (small ranges use direct queries; large ranges fallback to pre-aggregations).
- Integration tests that load a small dataset and validate totals/time-series.
- Load-test sample query across realistic data volume.

## 14. Rollout Plan

1. Implement endpoints using live queries with limits; add caching.
2. Add materialized views and background aggregation jobs.
3. Switch time-series endpoint to read pre-aggregated tables for large ranges (>31 days) or high-volume orgs.
4. Monitor query latencies and adjust TTLs and job cadence.

## 15. Useful SQL Snippets

- Upsert into daily summary (Postgres 13+):

```sql
INSERT INTO statistics_daily (organization_id, date, total_volume, total_count, successful_count)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (organization_id, date) DO UPDATE
SET total_volume = statistics_daily.total_volume + EXCLUDED.total_volume,
    total_count = statistics_daily.total_count + EXCLUDED.total_count,
    successful_count = statistics_daily.successful_count + EXCLUDED.successful_count;
```

## 16. Deliverables for Backend Dev

- Controller + routes for the endpoints listed in section 4.
- Service methods implementing SQL queries and pre-aggregation fallbacks.
- Migration(s) to add `statistics_daily` and optionally `statistics_hourly`.
- Background worker + cron jobs to populate pre-aggregations.
- Redis caching integration + cache invalidation strategy on write operations (payments/refunds/chargebacks creation).
- Tests (unit + integration) and a small load test script.

---

If you want, I can also generate a NestJS controller + service skeleton and example SQL migrations based on your existing schema — tell me which tables you already have and I'll scaffold the code.
