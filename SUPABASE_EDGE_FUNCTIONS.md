# Supabase Edge Functions Integration Guide

This guide shows how to deploy your external project APIs as Supabase Edge Functions and integrate them with the Invoiss POS system.

## Overview

Your Supabase project is configured at:
- **Project URL**: `https://visvcsddzmnqlkkfyoww.supabase.co`
- **Functions URL**: `https://visvcsddzmnqlkkfyoww.supabase.co/functions/v1`
- **Anon Key**: (configured in `.env.example`)

## Edge Function Structure

Each of your external projects (AuthorFlow, Ledgerly, Calendar, Nautilus) will be deployed as multiple Supabase Edge Functions organized by domain:

```
supabase/functions/
├── authorflow-auth/          # Authentication endpoints
│   └── index.ts
├── authorflow-users/         # User management endpoints
│   └── index.ts
├── ledgerly-transactions/    # Transaction endpoints
│   └── index.ts
├── ledgerly-accounts/        # Account endpoints
│   └── index.ts
├── ledgerly-reports/         # Report generation
│   └── index.ts
├── ledgerly-reconciliation/  # Reconciliation endpoints
│   └── index.ts
├── calendar-events/          # Event management
│   └── index.ts
├── calendar-slots/           # Time slot management
│   └── index.ts
├── calendar-deliveries/      # Delivery scheduling
│   └── index.ts
├── calendar-drivers/         # Driver schedules
│   └── index.ts
├── nautilus-services/        # Service discovery
│   └── index.ts
├── nautilus-tax/             # Tax calculation
│   └── index.ts
└── nautilus-address/         # Address validation
    └── index.ts
```

## Edge Function Template

Each Edge Function receives requests with an `action` parameter to route to the correct handler:

```typescript
// supabase/functions/authorflow-auth/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

interface LoginRequest {
  action: 'login' | 'validate';
  username?: string;
  password?: string;
  token?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, ...data }: LoginRequest = await req.json();

    switch (action) {
      case 'login':
        return await handleLogin(data.username!, data.password!);

      case 'validate':
        return await handleValidateToken(data.token!);

      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleLogin(username: string, password: string) {
  // Your login logic here
  const session = {
    token: 'generated_token',
    user: {
      id: 'user_1',
      username,
      email: `${username}@example.com`,
      roles: ['cashier'],
      permissions: ['orders.create', 'orders.read'],
    },
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  return new Response(
    JSON.stringify(session),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleValidateToken(token: string) {
  // Your token validation logic here
  const user = {
    id: 'user_1',
    username: 'testuser',
    email: 'test@example.com',
    roles: ['cashier'],
    permissions: ['orders.create', 'orders.read'],
  };

  return new Response(
    JSON.stringify(user),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

## Shared CORS Configuration

Create a shared CORS config used by all functions:

```typescript
// supabase/functions/_shared/cors.ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

## Deploying Edge Functions

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Login to Supabase

```bash
supabase login
```

### 3. Link Your Project

```bash
supabase link --project-ref visvcsddzmnqlkkfyoww
```

### 4. Deploy a Function

```bash
# Deploy a single function
supabase functions deploy authorflow-auth

# Deploy all functions
supabase functions deploy
```

### 5. Test the Function

```bash
# Invoke locally
supabase functions serve authorflow-auth

# Test with curl
curl -X POST https://visvcsddzmnqlkkfyoww.supabase.co/functions/v1/authorflow-auth \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "login", "username": "testuser", "password": "password123"}'
```

## Function Implementations

### AuthorFlow Functions

#### `authorflow-auth` (Authentication)
Actions:
- `login`: Authenticate user
- `validate`: Validate session token

#### `authorflow-users` (User Management)
Actions:
- `permissions`: Get user permissions
- `check-permission`: Check if user has specific permission

### Ledgerly Functions

#### `ledgerly-transactions`
Actions:
- `record`: Record a transaction
- `list`: Get transactions for date range

#### `ledgerly-accounts`
Actions:
- `balance`: Get account balance

#### `ledgerly-reports`
Actions:
- `generate`: Generate financial report

#### `ledgerly-reconciliation`
Actions:
- `order`: Reconcile order payment

### Calendar Functions

#### `calendar-events`
Actions:
- `create`: Create calendar event
- `list`: Get events for date range
- `update-status`: Update event status

#### `calendar-slots`
Actions:
- `available`: Get available delivery slots

#### `calendar-deliveries`
Actions:
- `schedule`: Schedule a delivery

#### `calendar-drivers`
Actions:
- `schedule`: Get driver schedule

### Nautilus Functions

#### `nautilus-services`
Actions:
- `list`: Get available services
- `call`: Call generic service

#### `nautilus-tax`
Actions:
- `calculate`: Calculate tax for address

#### `nautilus-address`
Actions:
- `validate`: Validate and normalize address

## Environment Variables

Set secrets for your Edge Functions:

```bash
# Set API keys
supabase secrets set AUTHORFLOW_SECRET_KEY=your_secret_key
supabase secrets set LEDGERLY_API_KEY=your_ledgerly_key
supabase secrets set CALENDAR_API_KEY=your_calendar_key
supabase secrets set NAUTILUS_API_KEY=your_nautilus_key

# List secrets
supabase secrets list
```

Access secrets in your functions:

```typescript
const secretKey = Deno.env.get('AUTHORFLOW_SECRET_KEY');
```

## Using Edge Functions from Invoiss POS

The Invoiss POS already has clients configured to use your Edge Functions:

```typescript
import {
  authorFlowEdgeClient,
  ledgerlyEdgeClient,
  calendarEdgeClient,
  nautilusEdgeClient,
  checkAvailableEdgeServices,
} from '@/services/api-clients/supabase-edge-functions';

// Check which services are available
const services = await checkAvailableEdgeServices();
console.log('Available Edge Functions:', services);

// Use the clients
if (services.ledgerly) {
  const response = await ledgerlyEdgeClient.recordTransaction({
    type: 'revenue',
    amount: 150.00,
    description: 'Order #ORD-001',
    orderId: 'order_1',
    date: new Date().toISOString(),
  });
  console.log('Transaction recorded:', response.data);
}
```

## Configuration

Update your `.env` file:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://visvcsddzmnqlkkfyoww.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpc3Zjc2Rkem1ucWxra2Z5b3d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTY4ODIsImV4cCI6MjA3NTY3Mjg4Mn0.f4KUc49fMYOliAiVtNMCG4gcEJd-__HA6soPCAFtiPQ

# Edge Functions URL
VITE_SUPABASE_FUNCTIONS_URL=https://visvcsddzmnqlkkfyoww.supabase.co/functions/v1

# Optional: API keys for each service
VITE_AUTHORFLOW_API_KEY=your_optional_key
VITE_LEDGERLY_API_KEY=your_optional_key
VITE_CALENDAR_API_KEY=your_optional_key
VITE_NAUTILUS_API_KEY=your_optional_key
```

## Monitoring

### View Function Logs

```bash
supabase functions logs authorflow-auth
```

### View All Functions

```bash
supabase functions list
```

### Monitor Invocations

Check the Supabase Dashboard:
- Project: https://supabase.com/dashboard/project/visvcsddzmnqlkkfyoww
- Functions → Edge Functions → [function-name] → Invocations

## Security Best Practices

### 1. Validate Input

```typescript
function validateLoginInput(username: string, password: string) {
  if (!username || username.length < 3) {
    throw new Error('Invalid username');
  }
  if (!password || password.length < 6) {
    throw new Error('Invalid password');
  }
}
```

### 2. Use API Keys

```typescript
function validateApiKey(req: Request) {
  const apiKey = req.headers.get('x-api-key');
  const validKey = Deno.env.get('AUTHORFLOW_API_KEY');

  if (apiKey !== validKey) {
    throw new Error('Unauthorized');
  }
}
```

### 3. Rate Limiting

Supabase automatically provides rate limiting, but you can add custom limits:

```typescript
// Store in Supabase Database or KV
const rateLimitKey = `rate_limit:${userId}`;
const count = await incrementCounter(rateLimitKey);

if (count > 100) {
  throw new Error('Rate limit exceeded');
}
```

## Testing Edge Functions

### Local Testing

```bash
# Start local Supabase
supabase start

# Serve function locally
supabase functions serve authorflow-auth

# Test with curl
curl -X POST http://localhost:54321/functions/v1/authorflow-auth \
  -H "Content-Type: application/json" \
  -d '{"action": "login", "username": "test", "password": "test123"}'
```

### Unit Testing

Create test files alongside your functions:

```typescript
// supabase/functions/authorflow-auth/test.ts
import { assertEquals } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import { handleLogin } from './index.ts';

Deno.test('login with valid credentials', async () => {
  const result = await handleLogin('testuser', 'password123');
  assertEquals(result.user.username, 'testuser');
});
```

Run tests:

```bash
deno test supabase/functions/authorflow-auth/test.ts
```

## Migration from Local APIs

If you already have local APIs running, you can gradually migrate:

1. **Deploy one function at a time**
2. **Test thoroughly before moving to next**
3. **Keep local APIs running as fallback**
4. **Use feature flags to toggle between local and Edge Functions**

```typescript
const USE_EDGE_FUNCTIONS = import.meta.env.VITE_USE_EDGE_FUNCTIONS === 'true';

if (USE_EDGE_FUNCTIONS) {
  await ledgerlyEdgeClient.recordTransaction({...});
} else {
  await ledgerlyClient.recordTransaction({...});
}
```

## Troubleshooting

### Function Not Found

```bash
# Verify function is deployed
supabase functions list

# Redeploy if needed
supabase functions deploy function-name
```

### CORS Errors

Ensure all functions include CORS headers:

```typescript
return new Response(json, {
  headers: {
    ...corsHeaders,
    'Content-Type': 'application/json',
  },
});
```

### Authentication Errors

Verify the anon key is correct:

```bash
# Get project settings
supabase projects api-keys --project-ref visvcsddzmnqlkkfyoww
```

### Timeout Errors

Increase function timeout (max 60 seconds):

```bash
# In function config
# supabase/functions/function-name/config.toml
[function]
timeout = 60
```

## Resources

- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [Deno Documentation](https://deno.land/manual)
- [Edge Functions Examples](https://github.com/supabase/supabase/tree/master/examples/edge-functions)

## Next Steps

1. **Create Edge Functions**: Use the templates above to create your functions
2. **Deploy**: Deploy each function to your Supabase project
3. **Test**: Verify each function works correctly
4. **Integrate**: The Invoiss POS clients are already configured and ready to use
5. **Monitor**: Watch logs and performance in Supabase Dashboard

---

**Project Configuration**: ✅ Complete
**Edge Function Clients**: ✅ Ready to use
**Waiting For**: Your Edge Functions to be deployed

**Last Updated**: January 2025
