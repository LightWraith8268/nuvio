# Clover Integration via Invoiss API

This document outlines how the POS system integrates with Clover through the Invoiss API for live production use.

## Overview

The Invoiss POS system is designed to sync all orders, payments, and customer data with Clover through the Invoiss API. The system is currently running in **mock mode** for development, but is fully prepared to switch to live API integration.

## API Configuration

### Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# API Mode: 'mock' (development) | 'dev' (staging) | 'prod' (production)
VITE_API_MODE=mock

# Invoiss API Key (get from Invoiss dashboard)
VITE_INVOISS_API_KEY=your_api_key_here

# Optional: Clover Merchant ID (if needed for direct integration)
VITE_CLOVER_MERCHANT_ID=your_merchant_id
```

### Switching to Live API

To enable live Clover sync via Invoiss:

1. Update `.env`:
   ```env
   VITE_API_MODE=prod
   VITE_INVOISS_API_KEY=your_production_api_key
   ```

2. Restart the development server:
   ```bash
   npm run dev
   ```

The system will automatically switch from mock API to live Invoiss API.

## Data Synchronization

### What Syncs with Clover

All the following operations will sync with Clover when using the live Invoiss API:

#### 1. **Orders**
- ✅ In-store orders (INVOICE type)
- ✅ Delivery orders (ORDER type)
- ✅ Order line items with quantities and pricing
- ✅ Order status updates (DRAFT → CONFIRMED → SCHEDULED → OUT_FOR_DELIVERY → DELIVERED)
- ✅ Order metadata (delivery info, timestamps, etc.)

**API Endpoint**: `POST /orders`

**Sync Behavior**: When `invoissAPI.createOrder()` is called, Invoiss will:
1. Create the order in Clover
2. Return the Clover order ID
3. Store order metadata for tracking
4. Enable real-time order status updates

#### 2. **Customers/Clients**
- ✅ Customer creation with name, email, phone
- ✅ Customer addresses for delivery
- ✅ Price book assignments (retail vs contractor pricing)
- ✅ House account balances

**API Endpoint**: `POST /clients`

**Sync Behavior**: When `invoissAPI.createClient()` is called, Invoiss will:
1. Create or update the customer in Clover
2. Sync contact information
3. Map price book to Clover pricing tiers
4. Store custom metadata (default client, etc.)

#### 3. **Payment Processing**
- ✅ Card payments via Clover terminal
- ✅ Saved payment methods (tokenized cards)
- ✅ House account payments
- ✅ Payment status tracking

**API Endpoints**:
- `POST /process-payment` - Process payment on Clover terminal
- `POST /request-payment` - Send payment request to Clover device
- `POST /clients/{id}/cards` - Save tokenized card

**Sync Behavior**: All payment operations go through Clover's payment gateway via Invoiss:
1. Payment requests sent to connected Clover device
2. Card tokenization for saved payment methods
3. Real-time payment status updates
4. Automatic reconciliation with Clover transactions

#### 4. **Products/Inventory**
- ✅ Product catalog with dual pricing (retail/contractor)
- ✅ Weight-based pricing for bulk materials
- ✅ Fixed-price items (delivery fees, services)
- ✅ Product availability status

**API Endpoint**: `GET /products`

**Sync Behavior**: Products are managed in Invoiss and synced to Clover:
1. Product catalog fetched from Invoiss
2. Pricing tiers mapped to Clover items
3. Inventory levels updated in real-time
4. Custom product metadata preserved

#### 5. **Employees**
- ✅ Employee authentication with PIN
- ✅ Role-based permissions (cashier, manager, admin)
- ✅ Employee activity tracking

**API Endpoint**: `POST /auth/employee`

**Sync Behavior**: Employee data managed separately from Clover:
1. PIN authentication for sensitive operations
2. Permission checks before order modifications
3. Activity logging for compliance

## Order Flow with Live API

### Creating an Order

```typescript
// 1. User creates order in POS
const order = await invoissAPI.createOrder({
  clientId: 'client-123',
  type: 'ORDER',
  lineItems: [
    { name: 'Premium Mulch', quantity: 2, price: 65.00 }
  ],
  metadata: {
    orderType: 'delivery',
    delivery: {
      scheduledDate: '2025-01-15T10:00:00Z',
      address: { street: '123 Main St', city: 'Springfield', ... }
    }
  }
});

// 2. Invoiss API creates order in Clover
// 3. Returns order with Clover order ID
// Order is now visible in Clover dashboard
```

### Processing Payment

```typescript
// 1. Request payment on Clover terminal
const paymentRequest = await invoissAPI.requestPayment({
  orderId: order.id,
  amount: order.grandTotal,
  method: 'clover_terminal'
});

// 2. Payment request sent to Clover device
// 3. Customer completes payment on terminal
// 4. Payment status updates automatically
// 5. Order marked as PAID in both systems
```

### Delivery Tracking

```typescript
// 1. Driver marks order as out for delivery
await invoissAPI.updateOrder(order.id, {
  status: 'OUT_FOR_DELIVERY'
});

// 2. Status syncs to Clover
// 3. Driver completes delivery with photo
await invoissAPI.updateOrder(order.id, {
  status: 'DELIVERED',
  metadata: {
    delivery: {
      completedAt: new Date().toISOString(),
      proofPhoto: photoDataUrl
    }
  }
});

// 4. Delivery completion syncs to Clover
// 5. Customer receives notification (if configured)
```

## Payment Integration Details

### Clover Terminal Integration

When using the live API, payment requests are sent directly to the Clover terminal:

1. **Employee Action**: Cashier clicks "Process Payment" in POS
2. **API Call**: `invoissAPI.requestPayment()` sends request to Invoiss
3. **Clover Device**: Payment prompt appears on Clover terminal
4. **Customer Action**: Customer inserts/taps card or uses digital wallet
5. **Processing**: Clover processes payment and returns result
6. **Sync**: Order status updated to PAID in both systems
7. **Receipt**: Digital receipt sent via Clover (optional)

### Saved Payment Methods

Cards are tokenized and saved securely:

```typescript
// Save card after successful payment
const savedCard = await invoissAPI.saveCard(clientId, {
  last4: '4242',
  brand: 'visa',
  expiryMonth: '12',
  expiryYear: '26',
  isDefault: true
});

// Use saved card for future orders
const payment = await invoissAPI.processPayment(orderId, amount, {
  method: 'card_on_file',
  cardId: savedCard.id
});
```

### House Accounts

House accounts are tracked in Invoiss and reconciled with Clover:

```typescript
// Charge to house account
const payment = await invoissAPI.processPayment(orderId, amount, {
  method: 'house_account'
});

// House account balance updated
// Payment marked for later settlement
// Statement generated at end of billing period
```

## Data Model Mapping

### POS Order → Clover Order

| POS Field | Clover Field | Notes |
|-----------|--------------|-------|
| `id` | `id` | Unique identifier |
| `number` | `orderNumber` | Sequential order number |
| `type` (INVOICE/ORDER) | `orderType` | In-store vs delivery |
| `client` | `customer` | Customer object |
| `lineItems` | `lineItems` | Array of items |
| `subTotal` | `subtotal` | Pre-tax total |
| `taxTotal` | `tax` | Tax amount |
| `grandTotal` | `total` | Final total |
| `status` | `state` | Order status |
| `metadata.delivery` | Custom field | Delivery details |

### POS Client → Clover Customer

| POS Field | Clover Field | Notes |
|-----------|--------------|-------|
| `id` | `id` | Unique identifier |
| `name` | `name` | Customer name |
| `email` | `emailAddresses[0]` | Primary email |
| `phone` | `phoneNumbers[0]` | Primary phone |
| `addresses` | `addresses` | Array of addresses |
| `priceBook` | Custom metadata | Pricing tier |
| `hasCardOnFile` | `cards` length > 0 | Has saved cards |

## Testing the Integration

### Development Testing (Mock Mode)

Current setup allows full testing without live API:

```bash
# Already configured for mock mode
npm run dev
```

All operations work identically to live API but data is stored locally.

### Staging Testing (Dev API)

Test with Invoiss staging environment:

```env
VITE_API_MODE=dev
VITE_INVOISS_API_KEY=your_dev_api_key
```

### Production Deployment

When ready for live Clover sync:

1. Set environment variables:
   ```env
   VITE_API_MODE=prod
   VITE_INVOISS_API_KEY=your_prod_api_key
   ```

2. Build for production:
   ```bash
   npm run build
   ```

3. Deploy built files to your hosting service

4. All orders and payments will now sync with Clover in real-time

## Monitoring & Troubleshooting

### API Mode Indicator

The Dashboard shows current API mode:

- 🔧 **Mock API (Development)** - No Clover sync
- 🚀 **Invoiss Dev API** - Testing with staging Clover
- ✅ **Invoiss Production API** - Live Clover sync

### Common Issues

**Issue**: Orders not appearing in Clover
- Check `VITE_API_MODE` is set to `prod` or `dev`
- Verify `VITE_INVOISS_API_KEY` is correct
- Check browser console for API errors
- Verify Clover merchant account is connected to Invoiss

**Issue**: Payment terminal not responding
- Ensure Clover device is connected and online
- Check Clover device is paired with merchant account
- Verify network connectivity
- Check Invoiss dashboard for device status

**Issue**: Customer data not syncing
- Verify customer has required fields (name)
- Check email/phone format is valid
- Ensure Clover customer limits not exceeded
- Review Invoiss API logs

## API Endpoints Reference

### Orders
- `POST /orders` - Create new order
- `GET /orders` - List all orders
- `GET /orders/{id}` - Get order details
- `PATCH /orders/{id}` - Update order
- `POST /process-payment` - Process payment
- `POST /request-payment` - Request payment on terminal

### Clients
- `POST /clients` - Create new client
- `GET /clients` - List all clients
- `GET /clients/{id}` - Get client details
- `PATCH /clients/{id}` - Update client
- `POST /clients/{id}/cards` - Save payment method

### Products
- `GET /products` - List products
- `GET /products/{id}` - Get product details
- `PATCH /products/{id}` - Update product

### Employees
- `POST /auth/employee` - Authenticate employee
- `GET /employees` - List employees
- `POST /employees` - Create employee
- `PATCH /employees/{id}` - Update employee

## Security Considerations

1. **API Keys**: Never commit API keys to version control
2. **Environment Variables**: Use `.env` files (already in `.gitignore`)
3. **Employee PINs**: Encrypted in transit, hashed at rest
4. **Payment Data**: Never stored locally, tokenized by Clover
5. **HTTPS**: Always use HTTPS in production
6. **CORS**: Invoiss API has CORS configured for your domain

## Support

- **Invoiss Documentation**: https://docs.invoiss.com
- **Invoiss API Key**: Get from https://dashboard.invoiss.com
- **Clover Setup**: Contact Invoiss support for Clover connection
- **Technical Issues**: support@invoiss.com

---

**Current Status**: ✅ Ready for live API integration
**Last Updated**: January 2025
**System Version**: 1.0.0
