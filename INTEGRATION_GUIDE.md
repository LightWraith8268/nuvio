# External Project Integration Guide

Complete guide for integrating capabilities from your other projects into the Invoiss POS system.

## Quick Start

### 1. Install Dependencies

Already installed with the project:
```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and configure your project APIs:

```env
# External Project APIs
VITE_AUTHORFLOW_API=http://localhost:3001
VITE_AUTHORFLOW_API_KEY=your_authorflow_key

VITE_LEDGERLY_API=http://localhost:3002
VITE_LEDGERLY_API_KEY=your_ledgerly_key

VITE_CALENDAR_API=http://localhost:3003
VITE_CALENDAR_API_KEY=your_calendar_key

VITE_NAUTILUS_API=http://localhost:4000
VITE_NAUTILUS_API_KEY=your_nautilus_key

# Tax Service (Optional - can use Nautilus or external service)
VITE_TAX_API_URL=http://localhost:4000/api/tax
VITE_TAX_API_KEY=your_tax_key
```

### 3. Use the Clients

Import and use the singleton clients in your code:

```typescript
import {
  authorFlowClient,
  ledgerlyClient,
  calendarClient,
  nautilusClient,
  checkAvailableServices
} from '@/services/api-clients/external-projects';

// Check which services are available
const services = await checkAvailableServices();
console.log('Available services:', services);

// Use the clients
if (services.ledgerly) {
  await ledgerlyClient.recordTransaction({
    type: 'revenue',
    amount: order.grandTotal,
    description: `Order #${order.number}`,
    orderId: order.id,
    date: new Date().toISOString(),
  });
}
```

## Available Clients

### AuthorFlowClient - Authentication & Authorization

**Purpose**: Enhanced user authentication, session management, and permissions

**Methods**:
```typescript
// Authenticate user
const session = await authorFlowClient.login(username, password);

// Validate session token
const user = await authorFlowClient.validateToken(token);

// Get user permissions
const permissions = await authorFlowClient.getUserPermissions(userId);

// Check specific permission
const hasPermission = await authorFlowClient.checkPermission(userId, 'orders.delete');
```

**Use Cases**:
- Replace or enhance the current PIN-based authentication
- Add role-based access control (RBAC)
- Session management across devices
- Granular permission checking

### LedgerlyClient - Accounting & Bookkeeping

**Purpose**: Automated accounting, financial reports, and bookkeeping

**Methods**:
```typescript
// Record order revenue
await ledgerlyClient.recordTransaction({
  type: 'revenue',
  amount: order.grandTotal,
  description: `Order #${order.number} - ${order.client.name}`,
  orderId: order.id,
  clientId: order.client.id,
  date: new Date().toISOString(),
});

// Get account balance
const account = await ledgerlyClient.getAccountBalance(accountId);

// Generate financial report
const report = await ledgerlyClient.generateReport(
  'income_statement',
  '2025-01-01',
  '2025-01-31'
);

// Get transactions for date range
const transactions = await ledgerlyClient.getTransactions(startDate, endDate);

// Reconcile order payment
await ledgerlyClient.reconcileOrderPayment(orderId, amount);
```

**Use Cases**:
- Automatic transaction recording when orders are created/paid
- Real-time financial reporting
- Cash drawer reconciliation
- End-of-day accounting
- Tax preparation data

### CalendarClient - Scheduling & Events

**Purpose**: Delivery scheduling, driver management, and event tracking

**Methods**:
```typescript
// Create calendar event
await calendarClient.createEvent({
  title: 'Delivery to John Doe',
  description: `Order #${order.number}`,
  startDate: order.metadata.delivery.scheduledDate,
  type: 'delivery',
  relatedEntityId: order.id,
  relatedEntityType: 'order',
  assignedTo: driverId,
  status: 'scheduled',
});

// Get events for date range
const events = await calendarClient.getEvents(startDate, endDate, 'delivery');

// Get available delivery slots
const slots = await calendarClient.getAvailableSlots('2025-01-20');

// Schedule delivery
const event = await calendarClient.scheduleDelivery(orderId, date, timeSlot);

// Update event status
await calendarClient.updateEventStatus(eventId, 'in_progress');

// Get driver schedule
const schedule = await calendarClient.getDriverSchedule(driverId, date);
```

**Use Cases**:
- Automatic delivery scheduling when order is created
- Driver route optimization
- Delivery slot management
- Driver workload balancing
- Customer delivery time preferences

### NautilusClient - Custom API Services

**Purpose**: Flexible integration point for any custom services

**Methods**:
```typescript
// Get available services
const services = await nautilusClient.getServices();

// Call generic service
const result = await nautilusClient.callService('custom-service', '/endpoint', data);

// Calculate tax based on address
const taxCalc = await nautilusClient.calculateTax(address, subtotal);

// Validate and normalize address
const validation = await nautilusClient.validateAddress(address);
```

**Use Cases**:
- Tax calculation for deliveries
- Address validation and normalization
- Custom business logic services
- Integration hub for third-party APIs

## Integration Patterns

### Pattern 1: Automatic Order Processing

Automatically record transactions and schedule deliveries when orders are created:

```typescript
// src/lib/mock-invoiss-api.ts (or real API handler)
import { ledgerlyClient, calendarClient } from '@/services/api-clients/external-projects';

async function createOrder(data: CreateOrderData) {
  // Create order in POS
  const order = await invoissAPI.createOrder(data);

  // Record revenue in Ledgerly (if available)
  try {
    await ledgerlyClient.recordTransaction({
      type: 'revenue',
      amount: order.grandTotal,
      description: `Order #${order.number} - ${order.client.name}`,
      orderId: order.id,
      clientId: order.client.id,
      date: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('Failed to record transaction in Ledgerly:', error);
    // Continue with order creation even if accounting fails
  }

  // Schedule delivery in Calendar (if delivery order)
  if (order.type === 'ORDER' && order.metadata?.delivery?.scheduledDate) {
    try {
      await calendarClient.scheduleDelivery(
        order.id,
        order.metadata.delivery.scheduledDate,
        order.metadata.delivery.timeSlot
      );
    } catch (error) {
      console.warn('Failed to schedule delivery in Calendar:', error);
    }
  }

  return order;
}
```

### Pattern 2: Address-Based Tax Calculation

Use Nautilus or external tax API for accurate tax rates:

```typescript
import { nautilusClient } from '@/services/api-clients/external-projects';
import { taxCalculator } from '@/services/tax-calculator';

async function calculateOrderTax(address: Address, subtotal: number) {
  try {
    // Try Nautilus first if configured
    if (import.meta.env.VITE_NAUTILUS_API) {
      const result = await nautilusClient.calculateTax(address, subtotal);
      return result.data.taxAmount;
    }

    // Fall back to tax calculator service
    const result = await taxCalculator.calculateTax(address, subtotal);
    return result.taxAmount;
  } catch (error) {
    console.error('Tax calculation failed:', error);
    // Fall back to default rate
    return subtotal * 0.08;
  }
}
```

### Pattern 3: Enhanced Authentication

Replace PIN authentication with AuthorFlow for better security:

```typescript
import { authorFlowClient } from '@/services/api-clients/external-projects';
import { useAuthStore } from '@/stores/authStore';

async function authenticateEmployee(username: string, password: string) {
  try {
    // Use AuthorFlow if configured
    if (import.meta.env.VITE_AUTHORFLOW_API) {
      const session = await authorFlowClient.login(username, password);

      // Store session in auth store
      useAuthStore.getState().setCurrentEmployee({
        id: session.user.id,
        name: session.user.username,
        pin: '', // Not used with AuthorFlow
        role: session.user.roles[0] || 'cashier',
        permissions: session.user.permissions,
      });

      return session.user;
    }

    // Fall back to local PIN authentication
    return await localAuthenticate(username, password);
  } catch (error) {
    console.error('Authentication failed:', error);
    throw error;
  }
}
```

### Pattern 4: Driver Schedule Management

Integrate driver schedules with the driver mobile view:

```typescript
import { calendarClient } from '@/services/api-clients/external-projects';

// In DriverView component
async function loadDriverDeliveries(driverId: string, date: string) {
  try {
    // Get scheduled deliveries from Calendar service
    const schedule = await calendarClient.getDriverSchedule(driverId, date);

    // Transform to local format
    return schedule.data.map(event => ({
      orderId: event.relatedEntityId,
      scheduledTime: event.startDate,
      status: event.status,
      // ... other fields
    }));
  } catch (error) {
    console.warn('Failed to load driver schedule from Calendar:', error);
    // Fall back to local deliveries
    return getLocalDeliveries(driverId, date);
  }
}
```

## Error Handling Best Practices

### 1. Graceful Degradation

Always provide fallbacks when external services fail:

```typescript
async function processOrder(order: Order) {
  // Core functionality (must succeed)
  const createdOrder = await createOrderInDatabase(order);

  // Enhanced functionality (nice to have, can fail gracefully)
  try {
    await ledgerlyClient.recordTransaction({...});
  } catch (error) {
    console.error('Ledgerly integration failed:', error);
    // Log for later manual reconciliation
    await logFailedIntegration('ledgerly', 'recordTransaction', order.id, error);
  }

  return createdOrder;
}
```

### 2. Service Health Checks

Check service availability before making critical operations:

```typescript
import { checkAvailableServices } from '@/services/api-clients/external-projects';

async function initializeApp() {
  const services = await checkAvailableServices();

  // Update UI to show which features are available
  if (services.calendar) {
    console.log('✓ Delivery scheduling enabled');
  } else {
    console.warn('✗ Delivery scheduling unavailable (using local scheduling)');
  }

  if (services.ledgerly) {
    console.log('✓ Automated accounting enabled');
  } else {
    console.warn('✗ Automated accounting unavailable (manual bookkeeping required)');
  }
}
```

### 3. Retry Logic

The BaseApiClient already handles retries with exponential backoff for 5xx errors. Configure retry behavior if needed:

```typescript
// Custom client with different retry config
const customClient = new BaseApiClient({
  baseUrl: 'http://localhost:3001',
  apiKey: 'key',
  retries: 5, // More retries for critical services
  timeout: 10000, // Longer timeout
});
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests once (CI mode)
npm run test:run

# Generate coverage report
npm run test:coverage
```

### Writing Integration Tests

See `src/tests/README.md` for detailed testing guide.

Example integration test:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { YourFeature } from './your-feature';
import { mockFetchSuccess } from '@/tests/setup';

describe('Order Creation with Ledgerly Integration', () => {
  it('should record transaction when order is created', async () => {
    // Mock successful transaction recording
    mockFetchSuccess({ id: 'txn_123', type: 'revenue', amount: 150 });

    const order = await createOrder({...});

    expect(order.id).toBeDefined();
    // Verify transaction was recorded
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/transactions'),
      expect.objectContaining({ method: 'POST' })
    );
  });
});
```

## Troubleshooting

### Service Not Connecting

1. **Check environment variables**: Ensure `.env` has correct URLs
2. **Verify service is running**: Check if the external project's dev server is running
3. **Check network/firewall**: Ensure localhost ports are accessible
4. **Review logs**: Check browser console and service logs for errors

### API Key Issues

```typescript
// Verify API key is configured
const hasKey = !!import.meta.env.VITE_LEDGERLY_API_KEY;
console.log('Ledgerly API key configured:', hasKey);
```

### CORS Errors

If running external services on different ports, ensure they have CORS headers:

```typescript
// Example: Express.js CORS configuration
app.use(cors({
  origin: 'http://localhost:5173', // Vite dev server
  credentials: true,
}));
```

### Timeout Issues

Increase timeout for slow services:

```typescript
const slowClient = new BaseApiClient({
  baseUrl: 'http://slow-service.local',
  timeout: 60000, // 60 second timeout
});
```

## Deployment

### Environment Configuration

Update `.env` for different environments:

```env
# Development
VITE_AUTHORFLOW_API=http://localhost:3001

# Staging
VITE_AUTHORFLOW_API=https://authorflow-staging.yourdomain.com

# Production
VITE_AUTHORFLOW_API=https://authorflow.yourdomain.com
```

### Feature Flags

Use environment variables to enable/disable integrations:

```typescript
const ENABLE_LEDGERLY = import.meta.env.VITE_ENABLE_LEDGERLY === 'true';

if (ENABLE_LEDGERLY) {
  await ledgerlyClient.recordTransaction({...});
}
```

## Additional Resources

- **Project Integration Documentation**: `PROJECT_INTEGRATION.md`
- **Testing Guide**: `src/tests/README.md`
- **Tax Calculator Service**: `src/services/tax-calculator.ts`
- **Clover Integration**: `CLOVER_INTEGRATION.md`

## Next Steps

1. **Deploy Your Project APIs**: Get your external project APIs running
2. **Configure Environment**: Set up `.env` with correct URLs and API keys
3. **Test Integration**: Run `npm test` to verify everything works
4. **Implement Features**: Start using the clients in your components
5. **Monitor Performance**: Watch for integration failures and optimize as needed

---

**Infrastructure Status**: ✅ Complete and Ready
- BaseApiClient with retry logic
- Four project clients (AuthorFlow, Ledgerly, Calendar, Nautilus)
- Comprehensive test suite (50+ tests)
- Mock utilities and test helpers
- Documentation and guides

**Waiting For**: Your external project APIs to be deployed

**Last Updated**: January 2025
