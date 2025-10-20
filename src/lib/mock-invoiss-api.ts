// Mock Invoiss API for development
// This will be replaced with real API when you get your key

import type { Client, Order, LineItem, SavedCard, Product, Employee } from '@/types';
import { DEFAULT_PERMISSIONS } from '@/types';

class MockInvoissAPI {
  private clients: Map<string, Client> = new Map();
  private orders: Map<string, Order> = new Map();
  private products: Map<string, Product> = new Map();
  private employees: Map<string, Employee> = new Map();
  private orderCounter = 1000;

  constructor() {
    // Seed with some test data
    this.seedTestData();
  }

  private seedTestData() {
    // Add test products (from Invoiss catalog)
    const testProducts: Product[] = [
      {
        id: 'prod-1',
        name: 'Premium Mulch - Dark Brown',
        description: 'High-quality hardwood mulch',
        sku: 'MUL-001',
        contractorPrice: 45.00, // From Invoiss
        retailPrice: 65.00, // Custom added
        priceType: 'per_weight',
        weightUnit: 'lbs',
        category: 'Mulch',
        inStock: true,
      },
      {
        id: 'prod-2',
        name: 'Premium Mulch - Red',
        description: 'Premium colored mulch',
        sku: 'MUL-002',
        contractorPrice: 50.00,
        retailPrice: 70.00,
        priceType: 'per_weight',
        weightUnit: 'lbs',
        category: 'Mulch',
        inStock: true,
      },
      {
        id: 'prod-3',
        name: 'Topsoil - Premium Grade',
        description: 'Screened topsoil for gardens',
        sku: 'SOIL-001',
        contractorPrice: 35.00,
        retailPrice: 50.00,
        priceType: 'per_weight',
        weightUnit: 'lbs',
        category: 'Soil',
        inStock: true,
      },
      {
        id: 'prod-4',
        name: 'River Rock - Small',
        description: '1-2 inch decorative river rock',
        sku: 'ROCK-001',
        contractorPrice: 60.00,
        retailPrice: 85.00,
        priceType: 'per_weight',
        weightUnit: 'lbs',
        category: 'Stone',
        inStock: true,
      },
      {
        id: 'prod-5',
        name: 'Delivery Fee - Standard',
        description: 'Standard delivery within 10 miles',
        sku: 'SVC-001',
        contractorPrice: 75.00,
        retailPrice: 95.00,
        priceType: 'fixed',
        category: 'Services',
        inStock: true,
      },
      {
        id: 'prod-6',
        name: 'Compost - Organic',
        description: 'Organic compost blend',
        sku: 'COMP-001',
        contractorPrice: 40.00,
        priceType: 'per_weight',
        weightUnit: 'lbs',
        category: 'Soil',
        inStock: true,
      },
    ];

    testProducts.forEach(product => this.products.set(product.id, product));

    // Add test clients
    const testClients: Client[] = [
      {
        id: 'client-default',
        name: 'Walk-In Customer',
        email: 'walkin@store.local',
        phone: '(555) 000-0000',
        hasCardOnFile: false,
        priceBook: 'retail',
        metadata: { isDefault: true }, // Mark as default client
        createdAt: new Date().toISOString()
      },
      {
        id: 'client-1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '(555) 123-4567',
        hasCardOnFile: true,
        priceBook: 'contractor', // John is a contractor client
        savedPaymentMethods: [
          {
            id: 'card-1',
            last4: '4242',
            brand: 'visa',
            expiryMonth: '12',
            expiryYear: '26',
            isDefault: true
          }
        ],
        addresses: [
          {
            street: '123 Elm St',
            city: 'Springfield',
            state: 'IL',
            zip: '62701',
            latitude: 39.7817,
            longitude: -89.6501
          }
        ],
        createdAt: new Date().toISOString()
      },
      {
        id: 'client-2',
        name: 'Sarah Smith',
        email: 'sarah@example.com',
        phone: '(555) 987-6543',
        hasCardOnFile: false,
        priceBook: 'retail', // Sarah is a retail client (default)
        createdAt: new Date().toISOString()
      }
    ];

    testClients.forEach(client => this.clients.set(client.id, client));

    // Add test employees
    const testEmployees: Employee[] = [
      {
        id: 'emp-1',
        employeeId: '1001',
        name: 'John (Cashier)',
        role: 'cashier',
        permissions: DEFAULT_PERMISSIONS.cashier,
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'emp-2',
        employeeId: '2001',
        name: 'Sarah (Manager)',
        role: 'manager',
        pin: '1234', // Manager PIN
        permissions: DEFAULT_PERMISSIONS.manager,
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'emp-3',
        employeeId: '9999',
        name: 'Admin User',
        role: 'admin',
        pin: '0000', // Admin PIN
        permissions: DEFAULT_PERMISSIONS.admin,
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ];

    testEmployees.forEach(employee => this.employees.set(employee.id, employee));
  }

  // Client Management
  async createClient(data: Partial<Client>): Promise<Client> {
    const client: Client = {
      id: `client-${Date.now()}`,
      name: data.name || '',
      email: data.email,
      phone: data.phone,
      addresses: data.addresses || [],
      hasCardOnFile: false,
      createdAt: new Date().toISOString()
    };

    this.clients.set(client.id, client);
    return client;
  }

  async getClient(id: string): Promise<Client | null> {
    return this.clients.get(id) || null;
  }

  async listClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }

  async updateClient(id: string, data: Partial<Client>): Promise<Client> {
    const existing = this.clients.get(id);
    if (!existing) throw new Error('Client not found');

    const updated = { ...existing, ...data };
    this.clients.set(id, updated);
    return updated;
  }

  // Order Management
  async createOrder(data: {
    clientId: string;
    type: 'INVOICE' | 'ORDER';
    lineItems: LineItem[];
    metadata?: any;
  }): Promise<Order> {
    const client = this.clients.get(data.clientId);
    if (!client) throw new Error('Client not found');

    const subTotal = data.lineItems.reduce(
      (sum, item) => sum + (item.price * item.quantity),
      0
    );
    const taxTotal = subTotal * 0.08; // 8% tax
    const grandTotal = subTotal + taxTotal;

    const order: Order = {
      id: `order-${Date.now()}`,
      number: `${this.orderCounter++}`,
      type: data.type,
      client,
      lineItems: data.lineItems,
      subTotal,
      taxTotal,
      grandTotal,
      paidTotal: 0,
      status: 'DRAFT',
      paymentStatus: 'PENDING',
      metadata: data.metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.orders.set(order.id, order);
    return order;
  }

  async getOrder(id: string): Promise<Order | null> {
    return this.orders.get(id) || null;
  }

  async listOrders(filters?: {
    clientId?: string;
    status?: string;
    type?: string;
  }): Promise<Order[]> {
    let orders = Array.from(this.orders.values());

    if (filters?.clientId) {
      orders = orders.filter(o => o.client.id === filters.clientId);
    }
    if (filters?.status) {
      orders = orders.filter(o => o.status === filters.status);
    }
    if (filters?.type) {
      orders = orders.filter(o => o.type === filters.type);
    }

    return orders;
  }

  async updateOrder(id: string, data: Partial<Order>): Promise<Order> {
    const existing = this.orders.get(id);
    if (!existing) throw new Error('Order not found');

    const updated = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString()
    };
    this.orders.set(id, updated);
    return updated;
  }

  // Payment Processing
  async processPayment(orderId: string, amount: number): Promise<{
    success: boolean;
    transactionId: string;
    message: string;
  }> {
    const order = this.orders.get(orderId);
    if (!order) throw new Error('Order not found');

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update order
    order.paymentStatus = 'PAID';
    order.paidTotal = amount;
    order.status = 'CONFIRMED';
    this.orders.set(orderId, order);

    return {
      success: true,
      transactionId: `txn-${Date.now()}`,
      message: 'Payment processed successfully'
    };
  }

  async requestPayment(data: {
    orderId: string;
    amount: number;
    method?: string;
  }): Promise<{ success: boolean; paymentUrl?: string }> {
    // Simulate sending payment request to Clover
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      success: true,
      paymentUrl: `https://mock-clover.example.com/pay/${data.orderId}`
    };
  }

  // Card Management
  async saveCard(clientId: string, cardData: Partial<SavedCard>): Promise<SavedCard> {
    const client = this.clients.get(clientId);
    if (!client) throw new Error('Client not found');

    const card: SavedCard = {
      id: `card-${Date.now()}`,
      last4: cardData.last4 || '0000',
      brand: cardData.brand || 'visa',
      expiryMonth: cardData.expiryMonth || '12',
      expiryYear: cardData.expiryYear || '25',
      isDefault: cardData.isDefault || false
    };

    if (!client.savedPaymentMethods) {
      client.savedPaymentMethods = [];
    }

    client.savedPaymentMethods.push(card);
    client.hasCardOnFile = true;
    this.clients.set(clientId, client);

    return card;
  }

  // Product Catalog
  async listProducts(filters?: {
    category?: string;
    inStock?: boolean;
  }): Promise<Product[]> {
    let products = Array.from(this.products.values());

    if (filters?.category) {
      products = products.filter(p => p.category === filters.category);
    }
    if (filters?.inStock !== undefined) {
      products = products.filter(p => p.inStock === filters.inStock);
    }

    return products;
  }

  async getProduct(id: string): Promise<Product | null> {
    return this.products.get(id) || null;
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    const existing = this.products.get(id);
    if (!existing) throw new Error('Product not found');

    const updated = { ...existing, ...data };
    this.products.set(id, updated);
    return updated;
  }

  // Employee Management
  async authenticateEmployee(employeeId: string, pin?: string): Promise<Employee | null> {
    const employees = Array.from(this.employees.values());
    const employee = employees.find(e => e.employeeId === employeeId && e.isActive);

    if (!employee) return null;

    // If employee has a PIN (manager/admin), verify it
    if (employee.pin) {
      // If PIN is not provided, return employee so UI can prompt for PIN
      if (!pin) {
        return employee;
      }
      // If PIN is provided but incorrect, return null
      if (pin !== employee.pin) {
        return null;
      }
    }

    return employee;
  }

  async listEmployees(): Promise<Employee[]> {
    return Array.from(this.employees.values()).filter(e => e.isActive);
  }

  async getEmployee(id: string): Promise<Employee | null> {
    return this.employees.get(id) || null;
  }

  async createEmployee(data: Partial<Employee>): Promise<Employee> {
    const employee: Employee = {
      id: `emp-${Date.now()}`,
      employeeId: data.employeeId || '',
      name: data.name || '',
      role: data.role || 'cashier',
      pin: data.pin,
      permissions: data.permissions || DEFAULT_PERMISSIONS[data.role || 'cashier'],
      isActive: true,
      createdAt: new Date().toISOString()
    };

    this.employees.set(employee.id, employee);
    return employee;
  }

  async updateEmployee(id: string, data: Partial<Employee>): Promise<Employee> {
    const existing = this.employees.get(id);
    if (!existing) throw new Error('Employee not found');

    const updated = { ...existing, ...data };
    this.employees.set(id, updated);
    return updated;
  }
}

// Export singleton instance
export const mockInvoissAPI = new MockInvoissAPI();
