// Invoiss API Client
// Supports: Mock API (dev) | Invoiss Dev API | Invoiss Production API

import { mockInvoissAPI } from './mock-invoiss-api';
import type { Client, Order, LineItem, SavedCard, Product, Employee } from '@/types';

// API Configuration
const API_MODE = import.meta.env.VITE_API_MODE || 'mock'; // 'mock' | 'dev' | 'prod'
const INVOISS_DEV_URL = 'https://api-dev.invoiss.com/';
const INVOISS_PROD_URL = 'https://api.invoiss.com/';
const API_KEY = import.meta.env.VITE_INVOISS_API_KEY || '';

const BASE_URL = API_MODE === 'prod'
  ? INVOISS_PROD_URL
  : API_MODE === 'dev'
    ? INVOISS_DEV_URL
    : '';

class InvoissAPI {
  private async fetch(endpoint: string, options: RequestInit = {}) {
    // Use mock API if in mock mode
    if (API_MODE === 'mock') {
      return this.handleMockRequest(endpoint, options);
    }

    // Real API request
    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  private async handleMockRequest(endpoint: string, options: RequestInit) {
    // Route to mock API methods
    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body as string) : null;

    if (endpoint.startsWith('clients')) {
      if (method === 'POST') return mockInvoissAPI.createClient(body);
      if (method === 'GET' && endpoint.includes('/')) {
        const id = endpoint.split('/')[1];
        return mockInvoissAPI.getClient(id);
      }
      return mockInvoissAPI.listClients();
    }

    if (endpoint.startsWith('orders')) {
      if (method === 'POST') return mockInvoissAPI.createOrder({
        clientId: body.client,
        type: body.type,
        lineItems: body.lineItems,
        metadata: body.metadata
      });
      if (method === 'GET' && endpoint.includes('/')) {
        const id = endpoint.split('/')[1];
        return mockInvoissAPI.getOrder(id);
      }
      return mockInvoissAPI.listOrders();
    }

    if (endpoint === 'process-payment') {
      return mockInvoissAPI.processPayment(body.orderId, body.amount);
    }

    if (endpoint === 'request-payment') {
      return mockInvoissAPI.requestPayment(body);
    }

    if (endpoint.startsWith('products')) {
      if (method === 'GET' && endpoint.includes('/')) {
        const id = endpoint.split('/')[1];
        return mockInvoissAPI.getProduct(id);
      }
      return mockInvoissAPI.listProducts();
    }

    if (endpoint === 'auth/employee') {
      return mockInvoissAPI.authenticateEmployee(body.employeeId, body.pin);
    }

    if (endpoint.startsWith('employees')) {
      if (method === 'POST') return mockInvoissAPI.createEmployee(body);
      if (method === 'GET' && endpoint.includes('/')) {
        const id = endpoint.split('/')[1];
        return mockInvoissAPI.getEmployee(id);
      }
      return mockInvoissAPI.listEmployees();
    }

    throw new Error(`Mock endpoint not implemented: ${endpoint}`);
  }

  // Client Management
  async createClient(data: Partial<Client>): Promise<Client> {
    return this.fetch('clients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getClient(id: string): Promise<Client> {
    return this.fetch(`clients/${id}`);
  }

  async listClients(): Promise<Client[]> {
    const response = await this.fetch('clients');
    return response.items || response;
  }

  async updateClient(id: string, data: Partial<Client>): Promise<Client> {
    return this.fetch(`clients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Order Management
  async createOrder(data: {
    clientId: string;
    type: 'INVOICE' | 'ORDER';
    lineItems: LineItem[];
    metadata?: any;
  }): Promise<Order> {
    return this.fetch('orders', {
      method: 'POST',
      body: JSON.stringify({
        client: data.clientId,
        type: data.type,
        lineItems: data.lineItems,
        metadata: data.metadata,
      }),
    });
  }

  async getOrder(id: string): Promise<Order> {
    return this.fetch(`orders/${id}`);
  }

  async listOrders(filters?: {
    clientId?: string;
    status?: string;
    type?: string;
  }): Promise<Order[]> {
    const params = new URLSearchParams(filters as any);
    const response = await this.fetch(`orders?${params}`);
    return response.items || response;
  }

  async updateOrder(id: string, data: Partial<Order>): Promise<Order> {
    return this.fetch(`orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Payment Processing
  async processPayment(orderId: string, amount: number): Promise<{
    success: boolean;
    transactionId: string;
    message: string;
  }> {
    return this.fetch('process-payment', {
      method: 'POST',
      body: JSON.stringify({ orderId, amount }),
    });
  }

  async requestPayment(data: {
    orderId: string;
    amount: number;
    method?: string;
  }): Promise<{ success: boolean; paymentUrl?: string }> {
    return this.fetch('request-payment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Card Management
  async saveCard(clientId: string, cardData: Partial<SavedCard>): Promise<SavedCard> {
    return this.fetch(`clients/${clientId}/cards`, {
      method: 'POST',
      body: JSON.stringify(cardData),
    });
  }

  // Product Catalog
  async listProducts(filters?: {
    category?: string;
    inStock?: boolean;
  }): Promise<Product[]> {
    const params = new URLSearchParams(filters as any);
    const response = await this.fetch(`products?${params}`);
    return response.items || response;
  }

  async getProduct(id: string): Promise<Product> {
    return this.fetch(`products/${id}`);
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    return this.fetch(`products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Employee Management
  async authenticateEmployee(employeeId: string, pin?: string): Promise<Employee | null> {
    return this.fetch('auth/employee', {
      method: 'POST',
      body: JSON.stringify({ employeeId, pin }),
    });
  }

  async listEmployees(): Promise<Employee[]> {
    const response = await this.fetch('employees');
    return response.items || response;
  }

  async getEmployee(id: string): Promise<Employee> {
    return this.fetch(`employees/${id}`);
  }

  async createEmployee(data: Partial<Employee>): Promise<Employee> {
    return this.fetch('employees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEmployee(id: string, data: Partial<Employee>): Promise<Employee> {
    return this.fetch(`employees/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}

// Export singleton instance
export const invoissAPI = new InvoissAPI();

// Export API mode for display
export const API_MODE_DISPLAY = API_MODE === 'mock'
  ? '🔧 Mock API (Development)'
  : API_MODE === 'dev'
    ? '🚀 Invoiss Dev API'
    : '✅ Invoiss Production API';
