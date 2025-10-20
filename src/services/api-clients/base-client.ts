/**
 * Base API Client
 *
 * Provides a standardized way to interact with external project APIs
 * with built-in retry logic, error handling, and request/response interceptors.
 */

export interface ApiClientConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

export class BaseApiClient {
  protected config: Required<ApiClientConfig>;

  constructor(config: ApiClientConfig) {
    this.config = {
      baseUrl: config.baseUrl,
      apiKey: config.apiKey || '',
      timeout: config.timeout || 30000,
      retries: config.retries || 3,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    };
  }

  /**
   * Make a GET request
   */
  protected async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, params);
  }

  /**
   * Make a POST request
   */
  protected async post<T>(endpoint: string, data?: any, params?: Record<string, any>): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, data, params);
  }

  /**
   * Make a PUT request
   */
  protected async put<T>(endpoint: string, data?: any, params?: Record<string, any>): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, data, params);
  }

  /**
   * Make a PATCH request
   */
  protected async patch<T>(endpoint: string, data?: any, params?: Record<string, any>): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, data, params);
  }

  /**
   * Make a DELETE request
   */
  protected async delete<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, undefined, params);
  }

  /**
   * Core request method with retry logic
   */
  private async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    params?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, params);
    const options = this.buildRequestOptions(method, data);

    let lastError: ApiError | null = null;

    // Retry logic
    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url, options);

        if (!response.ok) {
          throw await this.handleErrorResponse(response);
        }

        const responseData = await this.parseResponse<T>(response);

        return {
          data: responseData,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        };
      } catch (error) {
        lastError = this.normalizeError(error);

        // Don't retry on client errors (4xx)
        if (lastError.status && lastError.status >= 400 && lastError.status < 500) {
          throw lastError;
        }

        // Wait before retry (exponential backoff)
        if (attempt < this.config.retries) {
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw lastError || new Error('Request failed after all retries');
  }

  /**
   * Build full URL with query parameters
   */
  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    const url = new URL(endpoint, this.config.baseUrl);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  /**
   * Build request options
   */
  private buildRequestOptions(method: string, data?: any): RequestInit {
    const headers: Record<string, string> = { ...this.config.headers };

    // Add API key if configured
    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    const options: RequestInit = {
      method,
      headers,
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    return options;
  }

  /**
   * Fetch with timeout
   */
  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Parse response body
   */
  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      return await response.json();
    }

    const text = await response.text();
    return text as unknown as T;
  }

  /**
   * Handle error response
   */
  private async handleErrorResponse(response: Response): Promise<ApiError> {
    let details;
    try {
      details = await response.json();
    } catch {
      details = await response.text();
    }

    return {
      message: details?.message || response.statusText || 'Request failed',
      status: response.status,
      code: details?.code,
      details,
    };
  }

  /**
   * Normalize error to ApiError format
   */
  private normalizeError(error: any): ApiError {
    if (error.name === 'AbortError') {
      return {
        message: 'Request timeout',
        code: 'TIMEOUT',
      };
    }

    if (error.message) {
      return {
        message: error.message,
        status: error.status,
        code: error.code,
        details: error.details,
      };
    }

    return {
      message: 'Unknown error occurred',
      details: error,
    };
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if the API is reachable
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
