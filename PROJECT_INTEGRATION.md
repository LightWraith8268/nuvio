# Project Integration Framework

This document outlines how to integrate capabilities from other projects in your D:\Coding directory into the Invoiss POS system.

## Overview

The Invoiss POS system is designed to be modular and can leverage functionality from your other projects through various integration patterns:

1. **Shared Services** - Import utility functions and services directly
2. **API Integration** - Call REST APIs from other projects
3. **Database Sharing** - Connect to shared databases (Supabase, PostgreSQL, etc.)
4. **Package Imports** - Use npm/yarn workspaces or link local packages
5. **Microservice Architecture** - Deploy services independently and communicate via HTTP/WebSockets

## Current Integration Points

### 1. Tax Calculation Service

**Purpose**: Calculate sales tax based on delivery address

**Implementation**: `src/services/tax-calculator.ts`

**Integration Options**:

#### Option A: Use External Tax API
```env
# .env
VITE_TAX_API_URL=https://api.taxjar.com/v2
VITE_TAX_API_KEY=your_taxjar_api_key
```

Services that support this:
- TaxJar API
- Avalara AvaTax API
- TaxCloud API
- Custom tax service from another project

#### Option B: Import from Another Project

If you have a tax calculation service in another project (e.g., `D:\Coding\API\Nautilus`), you can:

**Method 1: Copy the service file**
```bash
# Copy tax service from another project
cp D:\Coding\other-project\src\services\tax-service.ts D:\Coding\invoiss-pos\src\services\external-tax-service.ts
```

**Method 2: Create a symlink (requires admin)**
```powershell
# Create symlink to shared services
New-Item -ItemType SymbolicLink -Path "D:\Coding\invoiss-pos\src\services\shared" -Target "D:\Coding\shared-services"
```

**Method 3: npm/yarn workspace** (recommended for TypeScript projects)
```json
// package.json in D:\Coding\invoiss-pos
{
  "workspaces": [
    ".",
    "../shared-services"
  ]
}
```

Then import directly:
```typescript
import { calculateTax } from '@shared/tax-service';
```

#### Option C: Use Local Tax Database

Create a local tax rate database:
```typescript
// src/data/tax-rates.json
{
  "rates": [
    {
      "state": "IL",
      "county": "Cook",
      "city": "Springfield",
      "zip": "62701",
      "rate": 0.0825
    }
  ]
}
```

Then load in tax calculator:
```typescript
import taxRates from '@/data/tax-rates.json';
```

### 2. Address Validation

**Current Status**: Placeholder in tax-calculator.ts

**Can integrate with**:
- USPS Address Validation API
- Google Maps Geocoding API
- Custom address service from your other projects

**Example Integration**:
```typescript
// src/services/address-validator.ts
import { validateAddress as externalValidate } from '@other-project/address-service';

export async function validateAddress(address: Address) {
  return await externalValidate(address);
}
```

## Projects You Can Integrate From

Based on your D:\Coding directory:

### AuthorFlow (D:\Coding\AuthorFlow)
**Potential Integrations**:
- User authentication/authorization system
- Session management
- Role-based access control enhancements

**How to integrate**:
1. If AuthorFlow has a backend API, configure the URL:
```env
VITE_AUTHORFLOW_API=http://localhost:3001
```

2. Create an API client:
```typescript
// src/services/authorflow-client.ts
export const authorFlowAPI = {
  async authenticate(username: string, password: string) {
    const response = await fetch(`${import.meta.env.VITE_AUTHORFLOW_API}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    return response.json();
  }
};
```

### Ledgerly (D:\Coding\Ledgerly)
**Potential Integrations**:
- Accounting/bookkeeping capabilities
- Financial reporting
- Invoice generation
- Expense tracking

**How to integrate**:
```typescript
// Connect to Ledgerly for accounting
import { recordTransaction } from '@ledgerly/accounting';

async function recordOrderPayment(order: Order) {
  await recordTransaction({
    type: 'revenue',
    amount: order.grandTotal,
    orderId: order.id,
    client: order.client.name
  });
}
```

### Website Projects (D:\Coding\website/*)
**Potential Integrations**:
- Calendar integration (D:\Coding\website\calendar) - Schedule deliveries
- Direct integration (D:\Coding\website\direct) - Unknown purpose, check for capabilities
- Books/Series Smith - Potentially author/product catalog systems

**Example: Calendar Integration for Delivery Scheduling**:
```typescript
// src/services/calendar-integration.ts
export async function scheduleDelivery(delivery: DeliveryInfo) {
  const response = await fetch('http://localhost:5173/api/calendar/events', {
    method: 'POST',
    body: JSON.stringify({
      title: `Delivery for ${order.client.name}`,
      date: delivery.scheduledDate,
      type: 'delivery'
    })
  });
  return response.json();
}
```

### API/Nautilus (D:\Coding\API\Nautilus)
**Potential Integrations**:
- Custom API services
- Data processing pipelines
- Business logic services

**How to integrate**:
Check what Nautilus provides, then connect via API calls or shared modules.

## Integration Architecture Patterns

### Pattern 1: Microservices via HTTP

```
┌─────────────────┐      HTTP      ┌──────────────────┐
│  Invoiss POS    │────────────────>│  Tax Service     │
│  (Frontend)     │                 │  (Another proj)  │
└─────────────────┘                 └──────────────────┘
```

**Setup**:
1. Run the other project as a separate service
2. Configure the API URL in `.env`
3. Create an API client in `src/services/`

### Pattern 2: Shared Database

```
┌─────────────────┐       ┌──────────────────┐
│  Invoiss POS    │       │  Ledgerly        │
└────────┬────────┘       └────────┬─────────┘
         │                         │
         └───────> Supabase <──────┘
```

**Setup**:
1. Both projects connect to the same Supabase database
2. Share table schemas
3. Use row-level security for isolation

### Pattern 3: npm Workspaces (Monorepo)

```
D:\Coding\
  ├── invoiss-pos/           (React app)
  ├── shared-services/       (Shared TypeScript modules)
  │   ├── tax-calculator/
  │   ├── address-validator/
  │   └── payment-processor/
  └── package.json           (Workspace root)
```

**Setup**:
```bash
# In D:\Coding
npm init -w shared-services
npm init -w invoiss-pos

# Install shared package in invoiss-pos
cd invoiss-pos
npm install @shared/tax-calculator
```

### Pattern 4: Git Submodules

```bash
# Add another project as a submodule
cd D:\Coding\invoiss-pos
git submodule add ../shared-services src/external/shared-services
```

## Step-by-Step: Integrating Tax Service from Another Project

### Scenario: You have a tax calculation API in another project

**Step 1**: Start the tax service
```bash
cd D:\Coding\your-tax-project
npm run dev  # Runs on http://localhost:3002
```

**Step 2**: Configure Invoiss POS to use it
```env
# .env
VITE_TAX_API_URL=http://localhost:3002/api/tax
VITE_TAX_API_KEY=dev_key_123
```

**Step 3**: The tax calculator will automatically use it
```typescript
// Already implemented in src/services/tax-calculator.ts
const taxCalc = await taxCalculator.calculateTax(address, subtotal);
```

**Step 4**: Update order creation to use real tax rates
```typescript
// src/lib/mock-invoiss-api.ts
import { taxCalculator } from '@/services/tax-calculator';

async createOrder(data) {
  const address = data.metadata?.delivery?.address;

  let taxTotal;
  if (address) {
    // Use address-based tax calculation
    const taxCalc = await taxCalculator.calculateTax(address, subTotal);
    taxTotal = taxCalc.taxAmount;
  } else {
    // Use default 8% for in-store orders
    taxTotal = subTotal * 0.08;
  }

  // ... rest of order creation
}
```

## Environment Variables for Integration

Add these to `.env` as needed:

```env
# Tax Service Integration
VITE_TAX_API_URL=
VITE_TAX_API_KEY=

# Address Validation
VITE_ADDRESS_VALIDATION_URL=
VITE_ADDRESS_VALIDATION_KEY=

# External Project APIs
VITE_AUTHORFLOW_API=
VITE_LEDGERLY_API=
VITE_CALENDAR_API=
VITE_NAUTILUS_API=

# Shared Database
VITE_SHARED_SUPABASE_URL=
VITE_SHARED_SUPABASE_KEY=

# Authentication Service
VITE_AUTH_SERVICE_URL=
VITE_AUTH_SERVICE_KEY=
```

## Creating Shared Services Module

To share code between projects effectively:

### Step 1: Create Shared Services Directory
```bash
mkdir D:\Coding\shared-services
cd D:\Coding\shared-services
npm init -y
```

### Step 2: Configure TypeScript
```json
// D:\Coding\shared-services\tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

### Step 3: Create Service Modules
```typescript
// D:\Coding\shared-services\src\tax\index.ts
export async function calculateTax(address: Address, amount: number) {
  // Shared tax calculation logic
}

// D:\Coding\shared-services\src\address\index.ts
export async function validateAddress(address: Address) {
  // Shared address validation logic
}
```

### Step 4: Use in Invoiss POS
```bash
cd D:\Coding\invoiss-pos
npm install ../shared-services
```

```typescript
// src/services/tax-calculator.ts
import { calculateTax } from '@shared-services/tax';
```

## Testing Integration

### Mock External Services in Development

```typescript
// src/services/__mocks__/external-tax-service.ts
export const calculateTax = async (address: Address, amount: number) => {
  return {
    taxAmount: amount * 0.08,
    taxRate: 0.08
  };
};
```

### Use Environment-Based Mocking

```typescript
const USE_MOCK = import.meta.env.VITE_USE_MOCK_SERVICES === 'true';

if (USE_MOCK) {
  return await mockTaxService.calculateTax(address, amount);
} else {
  return await realTaxService.calculateTax(address, amount);
}
```

## Benefits of Integration

1. **Code Reuse**: Don't duplicate tax calculation, address validation, etc.
2. **Single Source of Truth**: Tax rates maintained in one place
3. **Consistency**: Same logic across all your projects
4. **Easier Maintenance**: Update once, benefits all projects
5. **Separation of Concerns**: Each project focuses on its core functionality

## Next Steps

1. **Identify** which capabilities from other projects you want to use
2. **Choose** an integration pattern (API, shared modules, database)
3. **Implement** the integration using the examples above
4. **Test** thoroughly in development mode
5. **Document** any custom integrations you add

---

**Current Status**:
- ✅ Tax calculator service created with external API support
- ✅ Address validation placeholder ready
- ⏳ Waiting for specific project integrations to configure

**Last Updated**: January 2025
