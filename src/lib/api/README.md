# Brand Dashboard API Client

This directory contains type-safe API client utility functions for the brand dashboard redesign feature.

## Overview

The API client provides a clean, type-safe interface for interacting with brand dashboard endpoints. All functions include:

- **Type safety**: Full TypeScript support with proper interfaces
- **Error handling**: Comprehensive error catching and logging
- **Logging**: Automatic request/response logging with timing
- **Authentication**: Automatic token management via the base API client

## Available Functions

### `fetchDashboardMetrics()`

Fetches dashboard metrics including active campaigns, total spent, auctions won, and wallet balance.

```typescript
import { fetchDashboardMetrics } from '@/lib/api';

const metrics = await fetchDashboardMetrics();
// Returns: { activeCampaigns, totalSpent, auctionsWon, walletBalance }
```

**Validates**: Requirements 6.2

---

### `fetchProducts()`

Fetches the brand's product catalog.

```typescript
import { fetchProducts } from '@/lib/api';

const products = await fetchProducts();
// Returns: Product[]
```

**Validates**: Requirements 8.1

---

### `fetchAuctions()`

Fetches active shelf space auctions.

```typescript
import { fetchAuctions } from '@/lib/api';

const auctions = await fetchAuctions();
// Returns: Auction[]
```

**Validates**: Requirements 10.1

---

### `fetchTransactions(brandId: string)`

Fetches wallet transaction history for a specific brand.

```typescript
import { fetchTransactions } from '@/lib/api';

const transactions = await fetchTransactions('brand-001');
// Returns: Transaction[]
```

**Validates**: Requirements 11.1

---

### `submitRecharge(request: RechargeRequest)`

Submits a wallet recharge request.

```typescript
import { submitRecharge } from '@/lib/api';

const result = await submitRecharge({
  brandId: 'brand-001',
  amount: 10000,
  paymentMethod: 'card',
});
// Returns: RechargeResponse with transaction details
```

**Validation**: Minimum amount is ₹1,000

**Validates**: Requirements 10.5, 11.8

---

### `submitBid(request: BidRequest)`

Submits a bid for an auction.

```typescript
import { submitBid } from '@/lib/api';

const result = await submitBid({
  auctionId: 'auc-001',
  amount: 300,
  productName: 'Diet Coke 330ml',
  brandName: 'Coca-Cola',
});
// Returns: BidResponse with bid confirmation
```

**Validates**: Requirements 15.3, 15.4, 15.5

---

## Error Handling

All functions throw `ApiError` on failure:

```typescript
import { fetchDashboardMetrics, ApiError } from '@/lib/api';

try {
  const metrics = await fetchDashboardMetrics();
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`API Error ${error.status}: ${error.message}`);
    // error.data contains additional error details
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Logging

All API calls are automatically logged with:
- Request details (method, endpoint, parameters)
- Response timing
- Error details with context

Logs are handled by the centralized logger utility (`src/lib/logger.ts`).

## Authentication

Authentication is handled automatically by the base `apiClient`. The client:
1. Retrieves stored auth tokens
2. Checks token expiration
3. Refreshes tokens if needed
4. Includes the token in request headers

No manual token management is required when using these functions.

## Testing

Unit tests are located in `__tests__/brand-dashboard.test.ts`. Run tests with:

```bash
npm test -- src/lib/api/__tests__/brand-dashboard.test.ts
```

## Type Definitions

All type definitions are in `src/types/brand-dashboard.ts`:

- `DashboardMetrics`
- `Product`
- `Auction`
- `Transaction`
- `RechargeRequest`
- `BidRequest`

## Usage Example

```typescript
import {
  fetchDashboardMetrics,
  fetchProducts,
  fetchAuctions,
  submitBid,
  ApiError,
} from '@/lib/api';

async function loadDashboard() {
  try {
    // Fetch all dashboard data
    const [metrics, products, auctions] = await Promise.all([
      fetchDashboardMetrics(),
      fetchProducts(),
      fetchAuctions(),
    ]);

    // Display data in UI
    console.log('Metrics:', metrics);
    console.log('Products:', products);
    console.log('Auctions:', auctions);

    // Submit a bid
    if (auctions.length > 0) {
      const bid = await submitBid({
        auctionId: auctions[0].id,
        amount: auctions[0].highestBid + 50,
        productName: products[0].name,
        brandName: products[0].brand,
      });
      console.log('Bid submitted:', bid);
    }
  } catch (error) {
    if (error instanceof ApiError) {
      // Handle API errors
      alert(`Error: ${error.message}`);
    } else {
      // Handle unexpected errors
      console.error('Unexpected error:', error);
    }
  }
}
```

## Related Files

- `src/lib/api-client.ts` - Base API client with authentication
- `src/lib/logger.ts` - Logging utility
- `src/types/brand-dashboard.ts` - Type definitions
- `src/lib/auth/client-auth.ts` - Authentication utilities
