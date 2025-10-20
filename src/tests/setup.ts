/**
 * Vitest Test Setup
 *
 * Global test configuration and utilities
 */

import { afterEach, beforeEach, vi } from 'vitest';

// Mock environment variables for testing
beforeEach(() => {
  vi.stubEnv('VITE_API_MODE', 'mock');
  vi.stubEnv('VITE_INVOISS_API_KEY', 'test_api_key_123');
  vi.stubEnv('VITE_AUTHORFLOW_API', 'http://localhost:3001');
  vi.stubEnv('VITE_LEDGERLY_API', 'http://localhost:3002');
  vi.stubEnv('VITE_CALENDAR_API', 'http://localhost:3003');
  vi.stubEnv('VITE_NAUTILUS_API', 'http://localhost:3004');
  vi.stubEnv('VITE_TAX_API_URL', 'http://localhost:4000/api/tax');
  vi.stubEnv('VITE_TAX_API_KEY', 'test_tax_key');
});

// Cleanup after each test
afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

// Global fetch mock
global.fetch = vi.fn();

// Export test utilities
export const mockFetch = global.fetch as ReturnType<typeof vi.fn>;

export function mockFetchSuccess<T>(data: T, status = 200) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status,
    statusText: 'OK',
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => data,
    text: async () => JSON.stringify(data),
  } as Response);
}

export function mockFetchError(status: number, message: string) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    statusText: message,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => ({ message, code: `ERROR_${status}` }),
    text: async () => JSON.stringify({ message, code: `ERROR_${status}` }),
  } as Response);
}

export function mockFetchTimeout() {
  mockFetch.mockImplementationOnce(() =>
    new Promise((_, reject) => {
      setTimeout(() => reject(new DOMException('Aborted', 'AbortError')), 100);
    })
  );
}
