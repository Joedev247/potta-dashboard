# Balance Page Transaction Tracking Implementation

## Overview
Updated the balance page to automatically track collection transactions made in the payment page and update the balance in real-time.

## Changes Made

### 1. **Created BalanceContext** (`contexts/BalanceContext.tsx`)
- New React Context to manage global balance state
- Provides hooks for:
  - `refreshBalance()` - Manually refresh balance from API
  - `notifyTransactionCompleted(transaction)` - Called when a transaction is made
  - Real-time balance updates: `{ available, pending, reserved, currency, lastUpdated }`
- Automatically loads balance on mount
- Listens for `balanceRefresh` events for cross-page synchronization

**Key Features:**
```typescript
- Auto-refreshes balance 500ms after a transaction is completed
- Event-based system for balance updates
- Handles both API calls and event listeners
```

### 2. **Updated Balance Page** (`app/balance/page.tsx`)
- Now imports and uses `BalanceContext`
- Syncs balance state from context via `useBalance()` hook
- Automatically updates when payment page makes a collection transaction
- Displays real-time balance without manual refresh

**Integration:**
```typescript
const { balance, loading, error, refreshBalance, notifyTransactionCompleted } = useBalance();

// Balance syncs automatically via:
useEffect(() => {
  if (contextBalance && contextBalance.available !== undefined) {
    setBalance(contextBalance);
  }
}, [contextBalance]);
```

### 3. **Updated Payment Page** (`app/payments/page.tsx`)
- Imports `BalanceContext` hook
- When a COLLECTION type payment succeeds:
  - Notifies balance context via `notifyTransactionCompleted()`
  - Passes transaction details including: `transaction_id`, `type`, `amount`, `currency`, `status`
- Balance page receives update automatically without page refresh

**Notification Logic:**
```typescript
if (makePaymentForm.type === 'COLLECTION' && response.data.transaction_id) {
  notifyTransactionCompleted({
    transaction_id: response.data.transaction_id,
    type: 'COLLECTION',
    amount: parseFloat(makePaymentForm.amount),
    currency: makePaymentForm.currency,
    status: response.data.status || 'pending',
    createdAt: new Date().toISOString(),
  });
}
```

### 4. **Updated Root Layout** (`app/layout.tsx`)
- Wrapped application with `BalanceProvider`
- Enables balance context across all pages
- Provider hierarchy: `AuthProvider > OrganizationProvider > BalanceProvider > LayoutWrapper`

## How It Works

1. **User makes a COLLECTION payment** on the Payments page
2. **Payment succeeds** → `handleMakePayment()` calls `notifyTransactionCompleted()`
3. **Balance context receives notification** → triggers `refreshBalance()`
4. **API fetches updated balance** (with 500ms delay to allow backend update)
5. **Balance state updates in context** → syncs to Balance page
6. **Balance page automatically displays** new balance without manual refresh

## Benefits

✅ Real-time balance updates between pages
✅ No page refresh required
✅ Automatic synchronization across tabs (via event system)
✅ Clean separation of concerns using React Context
✅ Graceful fallback if balance fetch fails
✅ Works for both COLLECTION and DEPOSIT transactions
✅ Extensible for future transaction types

## API Integration

The implementation uses existing APIs:
- `GET /api/balances` - Fetch current balance
- `GET /api/balances/transactions` - Fetch transaction history
- `POST /api/paiments/make-payment` - Make payment (with x-api-key header)

## Testing

To test the implementation:
1. Navigate to the Payments page
2. Make a COLLECTION type payment (type = 'COLLECTION')
3. On success, navigate to the Balance page
4. Balance should reflect the collected amount automatically

No browser refresh needed!
