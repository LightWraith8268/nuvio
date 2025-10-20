/**
 * BaseApiClient Tests
 *
 * Comprehensive test suite for the base API client including:
 * - HTTP methods (GET, POST, PUT, PATCH, DELETE)
 * - Retry logic with exponential backoff
 * - Timeout handling
 * - Error handling
 * - Health checks
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { BaseApiClient, type ApiClientConfig } from './base-client';
import { mockFetch, mockFetchSuccess, mockFetchError, mockFetchTimeout } from '@/tests/setup';

class TestApiClient extends BaseApiClient {
  constructor(config: ApiClientConfig) {
    super(config);
  }

  // Expose protected methods for testing
  public testGet<T>(endpoint: string, params?: Record<string, any>) {
    return this.get<T>(endpoint, params);
  }

  public testPost<T>(endpoint: string, data?: any, params?: Record<string, any>) {
    return this.post<T>(endpoint, data, params);
  }

  public testPut<T>(endpoint: string, data?: any, params?: Record<string, any>) {
    return this.put<T>(endpoint, data, params);
  }

  public testPatch<T>(endpoint: string, data?: any, params?: Record<string, any>) {
    return this.patch<T>(endpoint, data, params);
  }

  public testDelete<T>(endpoint: string, params?: Record<string, any>) {
    return this.delete<T>(endpoint, params);
  }
}

describe('BaseApiClient', () => {
  let client: TestApiClient;

  beforeEach(() => {
    client = new TestApiClient({
      baseUrl: 'http://localhost:3000',
      apiKey: 'test_api_key',
      timeout: 5000,
      retries: 2,
    });
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Configuration', () => {
    it('should initialize with provided config', () => {
      expect(client['config'].baseUrl).toBe('http://localhost:3000');
      expect(client['config'].apiKey).toBe('test_api_key');
      expect(client['config'].timeout).toBe(5000);
      expect(client['config'].retries).toBe(2);
    });

    it('should use default values for optional config', () => {
      const defaultClient = new TestApiClient({
        baseUrl: 'http://localhost:3000',
      });

      expect(defaultClient['config'].apiKey).toBe('');
      expect(defaultClient['config'].timeout).toBe(30000);
      expect(defaultClient['config'].retries).toBe(3);
    });

    it('should merge custom headers with defaults', () => {
      const customClient = new TestApiClient({
        baseUrl: 'http://localhost:3000',
        headers: {
          'X-Custom-Header': 'custom-value',
        },
      });

      expect(customClient['config'].headers['Content-Type']).toBe('application/json');
      expect(customClient['config'].headers['X-Custom-Header']).toBe('custom-value');
    });
  });

  describe('GET requests', () => {
    it('should make successful GET request', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockFetchSuccess(mockData);

      const response = await client.testGet('/users/1');

      expect(response.data).toEqual(mockData);
      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should append query parameters correctly', async () => {
      mockFetchSuccess({ results: [] });

      await client.testGet('/users', { page: 1, limit: 10 });

      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toContain('?page=1&limit=10');
    });

    it('should ignore null and undefined query parameters', async () => {
      mockFetchSuccess({ results: [] });

      await client.testGet('/users', { page: 1, search: null, filter: undefined });

      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toContain('?page=1');
      expect(callArgs[0]).not.toContain('search');
      expect(callArgs[0]).not.toContain('filter');
    });

    it('should include Authorization header when API key is set', async () => {
      mockFetchSuccess({});

      await client.testGet('/users');

      const callArgs = mockFetch.mock.calls[0];
      const headers = callArgs[1]?.headers as Record<string, string>;
      expect(headers['Authorization']).toBe('Bearer test_api_key');
    });
  });

  describe('POST requests', () => {
    it('should make successful POST request with data', async () => {
      const postData = { name: 'New User', email: 'test@example.com' };
      const mockResponse = { id: 1, ...postData };
      mockFetchSuccess(mockResponse);

      const response = await client.testPost('/users', postData);

      expect(response.data).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const callArgs = mockFetch.mock.calls[0];
      const body = callArgs[1]?.body as string;
      expect(JSON.parse(body)).toEqual(postData);
    });

    it('should include Content-Type header', async () => {
      mockFetchSuccess({});

      await client.testPost('/users', { name: 'Test' });

      const callArgs = mockFetch.mock.calls[0];
      const headers = callArgs[1]?.headers as Record<string, string>;
      expect(headers['Content-Type']).toBe('application/json');
    });
  });

  describe('PUT requests', () => {
    it('should make successful PUT request', async () => {
      const updateData = { name: 'Updated User' };
      mockFetchSuccess(updateData);

      const response = await client.testPut('/users/1', updateData);

      expect(response.data).toEqual(updateData);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('PATCH requests', () => {
    it('should make successful PATCH request', async () => {
      const patchData = { status: 'active' };
      mockFetchSuccess(patchData);

      const response = await client.testPatch('/users/1', patchData);

      expect(response.data).toEqual(patchData);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('DELETE requests', () => {
    it('should make successful DELETE request', async () => {
      mockFetchSuccess({ success: true });

      const response = await client.testDelete('/users/1');

      expect(response.data).toEqual({ success: true });
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle 4xx client errors without retry', async () => {
      mockFetchError(404, 'Not Found');

      await expect(client.testGet('/users/999')).rejects.toMatchObject({
        message: 'Not Found',
        status: 404,
      });

      // Should only attempt once (no retries for 4xx errors)
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should retry on 5xx server errors', async () => {
      vi.useFakeTimers();

      // Fail twice, then succeed
      mockFetchError(500, 'Internal Server Error');
      mockFetchError(500, 'Internal Server Error');
      mockFetchSuccess({ success: true });

      const promise = client.testGet('/users');

      // Fast-forward through retries
      await vi.runAllTimersAsync();

      const response = await promise;

      expect(response.data).toEqual({ success: true });
      // 1 initial + 2 retries = 3 attempts
      expect(mockFetch).toHaveBeenCalledTimes(3);

      vi.useRealTimers();
    });

    it('should use exponential backoff for retries', async () => {
      vi.useFakeTimers();
      const delaySpy = vi.spyOn(client as any, 'delay');

      mockFetchError(503, 'Service Unavailable');
      mockFetchError(503, 'Service Unavailable');
      mockFetchSuccess({});

      const promise = client.testGet('/users');
      await vi.runAllTimersAsync();
      await promise;

      // Exponential backoff: 2^0 * 1000 = 1000ms, 2^1 * 1000 = 2000ms
      expect(delaySpy).toHaveBeenCalledWith(1000);
      expect(delaySpy).toHaveBeenCalledWith(2000);

      vi.useRealTimers();
    });

    it('should throw error after all retries exhausted', async () => {
      vi.useFakeTimers();

      // Fail all attempts
      mockFetchError(503, 'Service Unavailable');
      mockFetchError(503, 'Service Unavailable');
      mockFetchError(503, 'Service Unavailable');

      const promise = client.testGet('/users');
      await vi.runAllTimersAsync();

      await expect(promise).rejects.toMatchObject({
        message: 'Service Unavailable',
        status: 503,
      });

      // 1 initial + 2 retries = 3 attempts
      expect(mockFetch).toHaveBeenCalledTimes(3);

      vi.useRealTimers();
    });

    it('should handle timeout errors', async () => {
      vi.useFakeTimers();
      mockFetchTimeout();

      const promise = client.testGet('/users');
      await vi.runAllTimersAsync();

      await expect(promise).rejects.toMatchObject({
        message: 'Request timeout',
        code: 'TIMEOUT',
      });

      vi.useRealTimers();
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(client.testGet('/users')).rejects.toMatchObject({
        message: 'Network error',
      });
    });

    it('should parse error response with JSON', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          message: 'Invalid input',
          code: 'VALIDATION_ERROR',
          details: { field: 'email' },
        }),
      } as Response);

      await expect(client.testGet('/users')).rejects.toMatchObject({
        message: 'Invalid input',
        status: 400,
        code: 'VALIDATION_ERROR',
      });
    });
  });

  describe('Response Parsing', () => {
    it('should parse JSON responses', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockFetchSuccess(mockData);

      const response = await client.testGet('/users/1');

      expect(response.data).toEqual(mockData);
    });

    it('should handle non-JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: async () => 'Plain text response',
      } as Response);

      const response = await client.testGet<string>('/health');

      expect(response.data).toBe('Plain text response');
    });
  });

  describe('Health Check', () => {
    it('should return true when health endpoint is reachable', async () => {
      mockFetchSuccess({ status: 'healthy' });

      const healthy = await client.healthCheck();

      expect(healthy).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/health',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should return false when health endpoint fails', async () => {
      mockFetchError(503, 'Service Unavailable');

      const healthy = await client.healthCheck();

      expect(healthy).toBe(false);
    });

    it('should return false on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const healthy = await client.healthCheck();

      expect(healthy).toBe(false);
    });

    it('should timeout health check after 5 seconds', async () => {
      vi.useFakeTimers();

      mockFetch.mockImplementationOnce(() =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ ok: true } as Response), 6000);
        })
      );

      const promise = client.healthCheck();
      await vi.runAllTimersAsync();
      const healthy = await promise;

      expect(healthy).toBe(false);

      vi.useRealTimers();
    });
  });

  describe('Request Building', () => {
    it('should build correct URL with endpoint', async () => {
      mockFetchSuccess({});

      await client.testGet('/users/1');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/users/1',
        expect.any(Object)
      );
    });

    it('should handle trailing slashes correctly', async () => {
      const slashClient = new TestApiClient({
        baseUrl: 'http://localhost:3000/',
      });
      mockFetchSuccess({});

      await slashClient.testGet('/users');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/users',
        expect.any(Object)
      );
    });

    it('should build correct request options for POST', async () => {
      mockFetchSuccess({});
      const postData = { name: 'Test' };

      await client.testPost('/users', postData);

      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[1]?.method).toBe('POST');
      expect(callArgs[1]?.body).toBe(JSON.stringify(postData));
    });
  });

  describe('Timeout Handling', () => {
    it('should abort request after timeout', async () => {
      vi.useFakeTimers();

      mockFetch.mockImplementationOnce((url, options) => {
        return new Promise((_, reject) => {
          const signal = options?.signal as AbortSignal;
          signal.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        });
      });

      const promise = client.testGet('/slow-endpoint');

      // Fast-forward past timeout
      await vi.advanceTimersByTimeAsync(6000);

      await expect(promise).rejects.toMatchObject({
        message: 'Request timeout',
        code: 'TIMEOUT',
      });

      vi.useRealTimers();
    });
  });
});
