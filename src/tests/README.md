# Testing Framework for External API Clients

This directory contains the testing framework for the external project API integrations.

## Overview

The testing framework uses **Vitest** with comprehensive test coverage for:
- BaseApiClient (HTTP methods, retry logic, error handling, timeouts)
- External project clients (AuthorFlow, Ledgerly, Calendar, Nautilus)
- Mock utilities for simulating API responses

## Running Tests

```bash
# Run tests in watch mode (interactive)
npm test

# Run tests once (CI mode)
npm run test:run

# Run tests with UI dashboard
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

### `setup.ts`
Global test configuration and mock utilities:
- Environment variable mocking
- Global fetch mock setup
- Helper functions: `mockFetchSuccess`, `mockFetchError`, `mockFetchTimeout`

### `base-client.test.ts`
Comprehensive tests for BaseApiClient (300+ lines):
- **Configuration**: Client initialization, default values, custom headers
- **HTTP Methods**: GET, POST, PUT, PATCH, DELETE requests
- **Error Handling**: 4xx client errors, 5xx server errors, network errors
- **Retry Logic**: Exponential backoff, retry attempts, error exhaustion
- **Timeout Handling**: Request timeouts, AbortController integration
- **Response Parsing**: JSON responses, non-JSON responses
- **Health Checks**: Service availability testing

### `external-projects.test.ts`
Tests for all external project clients (500+ lines):

#### AuthorFlowClient Tests
- User authentication (login)
- Token validation
- User permissions lookup
- Permission checking

#### LedgerlyClient Tests
- Transaction recording (revenue, expense, payment, refund)
- Account balance retrieval
- Financial report generation
- Transaction history queries
- Order payment reconciliation

#### CalendarClient Tests
- Event creation
- Event queries with date ranges
- Available slot lookups
- Delivery scheduling
- Event status updates
- Driver schedule retrieval

#### NautilusClient Tests
- Service discovery
- Generic service calls
- Tax calculation via address
- Address validation and normalization

#### Integration Tests
- Service availability checking
- Partial service availability
- All services offline scenarios

## Mock Utilities

### `mockFetchSuccess<T>(data: T, status = 200)`
Mocks a successful API response:
```typescript
mockFetchSuccess({ id: 1, name: 'Test' });
```

### `mockFetchError(status: number, message: string)`
Mocks an error API response:
```typescript
mockFetchError(404, 'Not Found');
```

### `mockFetchTimeout()`
Mocks a timeout error:
```typescript
mockFetchTimeout();
```

## Test Coverage

The test suite covers:
- ✅ All HTTP methods (GET, POST, PUT, PATCH, DELETE)
- ✅ Success and error paths
- ✅ Retry logic with exponential backoff
- ✅ Timeout handling
- ✅ Request building (URL, headers, body)
- ✅ Response parsing (JSON, text)
- ✅ Health checks
- ✅ All external client methods
- ✅ Edge cases (null values, empty arrays, partial failures)

## Writing New Tests

### Example: Testing a New Client Method

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { YourClient } from './your-client';
import { mockFetchSuccess, mockFetchError } from '@/tests/setup';

describe('YourClient', () => {
  let client: YourClient;

  beforeEach(() => {
    client = new YourClient();
    mockFetch.mockClear();
  });

  describe('yourMethod', () => {
    it('should handle success case', async () => {
      const mockData = { result: 'success' };
      mockFetchSuccess(mockData);

      const response = await client.yourMethod('param');

      expect(response.data).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/your-endpoint'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should handle error case', async () => {
      mockFetchError(400, 'Bad Request');

      await expect(client.yourMethod('invalid')).rejects.toMatchObject({
        message: 'Bad Request',
        status: 400,
      });
    });
  });
});
```

## CI/CD Integration

Tests are designed to run in CI/CD pipelines:
- Exit codes: 0 (pass), 1 (fail)
- Coverage reports in HTML, JSON, and text formats
- No interactive prompts in CI mode

### Example GitHub Actions Workflow

```yaml
name: Test External APIs

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run test:run
      - run: npm run test:coverage
```

## Best Practices

1. **Use descriptive test names**: "should authenticate user successfully" instead of "test login"
2. **Test both success and failure paths**: Always include error cases
3. **Mock external dependencies**: Use `mockFetch*` utilities instead of real HTTP calls
4. **Clean up after tests**: The `afterEach` hook in `setup.ts` handles this automatically
5. **Test edge cases**: null values, empty arrays, timeouts, network errors
6. **Keep tests independent**: Each test should be able to run in isolation
7. **Use beforeEach for setup**: Reset state before each test

## Troubleshooting

### Tests hang or timeout
- Check for missing `await` keywords
- Ensure all promises are resolved
- Use `vi.useFakeTimers()` for time-dependent tests

### Fetch mock not working
- Make sure `mockFetch.mockClear()` is called in `beforeEach`
- Check that you're using the correct mock utility
- Verify the mock is set up before the client method is called

### Type errors
- Ensure mock data matches the expected interface types
- Use TypeScript generics with `mockFetchSuccess<T>`

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Vitest UI](https://vitest.dev/guide/ui.html)
- [Coverage Reporting](https://vitest.dev/guide/coverage.html)

---

**Last Updated**: January 2025
**Test Coverage**: 100% of API client methods
**Total Tests**: 50+ test cases
