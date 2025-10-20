/**
 * External Project API Clients Tests
 *
 * Tests for AuthorFlow, Ledgerly, Calendar, and Nautilus clients
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  AuthorFlowClient,
  LedgerlyClient,
  CalendarClient,
  NautilusClient,
  checkAvailableServices,
  type AuthorFlowSession,
  type LedgerlyTransaction,
  type CalendarEvent,
} from './external-projects';
import { mockFetch, mockFetchSuccess, mockFetchError } from '@/tests/setup';
import type { Address } from '@/types';

describe('AuthorFlowClient', () => {
  let client: AuthorFlowClient;

  beforeEach(() => {
    client = new AuthorFlowClient();
    mockFetch.mockClear();
  });

  describe('login', () => {
    it('should authenticate user successfully', async () => {
      const mockSession: AuthorFlowSession = {
        token: 'auth_token_123',
        user: {
          id: 'user_1',
          username: 'testuser',
          email: 'test@example.com',
          roles: ['cashier'],
          permissions: ['orders.create', 'orders.read'],
        },
        expiresAt: '2025-12-31T23:59:59Z',
      };

      mockFetchSuccess(mockSession);

      const response = await client.login('testuser', 'password123');

      expect(response.data).toEqual(mockSession);
      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ username: 'testuser', password: 'password123' }),
        })
      );
    });

    it('should handle authentication failure', async () => {
      mockFetchError(401, 'Invalid credentials');

      await expect(client.login('testuser', 'wrong_password')).rejects.toMatchObject({
        message: 'Invalid credentials',
        status: 401,
      });
    });
  });

  describe('validateToken', () => {
    it('should validate session token', async () => {
      const mockUser = {
        id: 'user_1',
        username: 'testuser',
        email: 'test@example.com',
        roles: ['manager'],
        permissions: ['orders.create', 'orders.read', 'orders.update'],
      };

      mockFetchSuccess(mockUser);

      const response = await client.validateToken('auth_token_123');

      expect(response.data).toEqual(mockUser);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/validate'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ token: 'auth_token_123' }),
        })
      );
    });

    it('should reject invalid token', async () => {
      mockFetchError(401, 'Invalid token');

      await expect(client.validateToken('invalid_token')).rejects.toMatchObject({
        message: 'Invalid token',
        status: 401,
      });
    });
  });

  describe('getUserPermissions', () => {
    it('should fetch user permissions', async () => {
      const mockPermissions = ['orders.create', 'orders.read', 'clients.read'];
      mockFetchSuccess(mockPermissions);

      const response = await client.getUserPermissions('user_1');

      expect(response.data).toEqual(mockPermissions);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/user_1/permissions'),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('checkPermission', () => {
    it('should check if user has permission', async () => {
      mockFetchSuccess(true);

      const response = await client.checkPermission('user_1', 'orders.delete');

      expect(response.data).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/user_1/check-permission'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ permission: 'orders.delete' }),
        })
      );
    });
  });
});

describe('LedgerlyClient', () => {
  let client: LedgerlyClient;

  beforeEach(() => {
    client = new LedgerlyClient();
    mockFetch.mockClear();
  });

  describe('recordTransaction', () => {
    it('should record a transaction successfully', async () => {
      const transaction: LedgerlyTransaction = {
        type: 'revenue',
        amount: 150.00,
        description: 'Order #ORD-001 - John Doe',
        orderId: 'order_1',
        clientId: 'client_1',
        date: '2025-01-15T10:30:00Z',
        category: 'sales',
      };

      const mockResponse = { ...transaction, id: 'txn_123' };
      mockFetchSuccess(mockResponse);

      const response = await client.recordTransaction(transaction);

      expect(response.data).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/transactions'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(transaction),
        })
      );
    });

    it('should handle different transaction types', async () => {
      const expenseTransaction: LedgerlyTransaction = {
        type: 'expense',
        amount: 50.00,
        description: 'Office supplies',
        date: '2025-01-15T10:30:00Z',
      };

      mockFetchSuccess({ ...expenseTransaction, id: 'txn_124' });

      const response = await client.recordTransaction(expenseTransaction);

      expect(response.data.id).toBe('txn_124');
    });
  });

  describe('getAccountBalance', () => {
    it('should fetch account balance', async () => {
      const mockAccount = {
        id: 'acc_1',
        name: 'Cash Account',
        type: 'asset' as const,
        balance: 5000.00,
        currency: 'USD',
      };

      mockFetchSuccess(mockAccount);

      const response = await client.getAccountBalance('acc_1');

      expect(response.data).toEqual(mockAccount);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/accounts/acc_1'),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('generateReport', () => {
    it('should generate financial report', async () => {
      const mockReport = {
        type: 'income_statement' as const,
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        data: {
          revenue: 10000,
          expenses: 3000,
          netIncome: 7000,
        },
      };

      mockFetchSuccess(mockReport);

      const response = await client.generateReport(
        'income_statement',
        '2025-01-01',
        '2025-01-31'
      );

      expect(response.data).toEqual(mockReport);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/reports/generate'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            type: 'income_statement',
            startDate: '2025-01-01',
            endDate: '2025-01-31',
          }),
        })
      );
    });
  });

  describe('getTransactions', () => {
    it('should fetch transactions for date range', async () => {
      const mockTransactions: LedgerlyTransaction[] = [
        {
          id: 'txn_1',
          type: 'revenue',
          amount: 100,
          description: 'Sale',
          date: '2025-01-10T10:00:00Z',
        },
        {
          id: 'txn_2',
          type: 'expense',
          amount: 50,
          description: 'Purchase',
          date: '2025-01-11T11:00:00Z',
        },
      ];

      mockFetchSuccess(mockTransactions);

      const response = await client.getTransactions('2025-01-01', '2025-01-31');

      expect(response.data).toEqual(mockTransactions);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/transactions?startDate=2025-01-01&endDate=2025-01-31'),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('reconcileOrderPayment', () => {
    it('should reconcile order payment', async () => {
      mockFetchSuccess({});

      await client.reconcileOrderPayment('order_123', 150.00);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/reconciliation/order'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ orderId: 'order_123', amount: 150.00 }),
        })
      );
    });
  });
});

describe('CalendarClient', () => {
  let client: CalendarClient;

  beforeEach(() => {
    client = new CalendarClient();
    mockFetch.mockClear();
  });

  describe('createEvent', () => {
    it('should create calendar event', async () => {
      const event: CalendarEvent = {
        title: 'Delivery to John Doe',
        description: 'Order #ORD-001',
        startDate: '2025-01-20T14:00:00Z',
        endDate: '2025-01-20T15:00:00Z',
        type: 'delivery',
        relatedEntityId: 'order_1',
        relatedEntityType: 'order',
        assignedTo: 'driver_1',
        status: 'scheduled',
      };

      const mockResponse = { ...event, id: 'event_1' };
      mockFetchSuccess(mockResponse);

      const response = await client.createEvent(event);

      expect(response.data).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/events'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(event),
        })
      );
    });
  });

  describe('getEvents', () => {
    it('should fetch events for date range', async () => {
      const mockEvents: CalendarEvent[] = [
        {
          id: 'event_1',
          title: 'Delivery 1',
          startDate: '2025-01-20T10:00:00Z',
          type: 'delivery',
          status: 'scheduled',
        },
        {
          id: 'event_2',
          title: 'Delivery 2',
          startDate: '2025-01-20T14:00:00Z',
          type: 'delivery',
          status: 'scheduled',
        },
      ];

      mockFetchSuccess(mockEvents);

      const response = await client.getEvents('2025-01-20', '2025-01-20', 'delivery');

      expect(response.data).toEqual(mockEvents);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/events?startDate=2025-01-20&endDate=2025-01-20&type=delivery'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should fetch all event types when type not specified', async () => {
      mockFetchSuccess([]);

      await client.getEvents('2025-01-20', '2025-01-20');

      const callUrl = mockFetch.mock.calls[0][0] as string;
      expect(callUrl).not.toContain('type=');
    });
  });

  describe('getAvailableSlots', () => {
    it('should fetch available delivery slots', async () => {
      const mockSlots = [
        { date: '2025-01-20', timeSlot: '09:00-11:00', available: true, capacity: 5, booked: 2 },
        { date: '2025-01-20', timeSlot: '11:00-13:00', available: true, capacity: 5, booked: 3 },
        { date: '2025-01-20', timeSlot: '13:00-15:00', available: false, capacity: 5, booked: 5 },
      ];

      mockFetchSuccess(mockSlots);

      const response = await client.getAvailableSlots('2025-01-20');

      expect(response.data).toEqual(mockSlots);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/slots/available?date=2025-01-20'),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('scheduleDelivery', () => {
    it('should schedule a delivery', async () => {
      const mockEvent: CalendarEvent = {
        id: 'event_1',
        title: 'Delivery for Order #ORD-001',
        startDate: '2025-01-20T10:00:00Z',
        type: 'delivery',
        relatedEntityId: 'order_1',
        status: 'scheduled',
      };

      mockFetchSuccess(mockEvent);

      const response = await client.scheduleDelivery('order_1', '2025-01-20', '09:00-11:00');

      expect(response.data).toEqual(mockEvent);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/deliveries/schedule'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            orderId: 'order_1',
            date: '2025-01-20',
            timeSlot: '09:00-11:00',
          }),
        })
      );
    });
  });

  describe('updateEventStatus', () => {
    it('should update event status', async () => {
      const mockEvent: CalendarEvent = {
        id: 'event_1',
        title: 'Delivery',
        startDate: '2025-01-20T10:00:00Z',
        type: 'delivery',
        status: 'in_progress',
      };

      mockFetchSuccess(mockEvent);

      const response = await client.updateEventStatus('event_1', 'in_progress');

      expect(response.data.status).toBe('in_progress');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/events/event_1'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ status: 'in_progress' }),
        })
      );
    });
  });

  describe('getDriverSchedule', () => {
    it('should fetch driver schedule', async () => {
      const mockSchedule: CalendarEvent[] = [
        {
          id: 'event_1',
          title: 'Delivery 1',
          startDate: '2025-01-20T10:00:00Z',
          type: 'delivery',
          assignedTo: 'driver_1',
          status: 'scheduled',
        },
      ];

      mockFetchSuccess(mockSchedule);

      const response = await client.getDriverSchedule('driver_1', '2025-01-20');

      expect(response.data).toEqual(mockSchedule);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/drivers/driver_1/schedule?date=2025-01-20'),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });
});

describe('NautilusClient', () => {
  let client: NautilusClient;

  beforeEach(() => {
    client = new NautilusClient();
    mockFetch.mockClear();
  });

  describe('getServices', () => {
    it('should fetch available services', async () => {
      const mockServices = [
        { name: 'tax-service', version: '1.0.0', endpoints: ['/calculate', '/rates'], status: 'online' as const },
        { name: 'address-service', version: '1.0.0', endpoints: ['/validate', '/normalize'], status: 'online' as const },
      ];

      mockFetchSuccess(mockServices);

      const response = await client.getServices();

      expect(response.data).toEqual(mockServices);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/services'),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('callService', () => {
    it('should call generic service endpoint', async () => {
      const mockResponse = { result: 'success' };
      mockFetchSuccess(mockResponse);

      const response = await client.callService('custom-service', '/process', { data: 'test' });

      expect(response.data).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/services/custom-service/process'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ data: 'test' }),
        })
      );
    });
  });

  describe('calculateTax', () => {
    it('should calculate tax for address', async () => {
      const address: Address = {
        street: '123 Main St',
        city: 'Springfield',
        state: 'IL',
        zip: '62701',
      };

      const mockTaxResult = {
        taxAmount: 12.50,
        taxRate: 0.0825,
        breakdown: {
          state: 0.0625,
          county: 0.01,
          city: 0.01,
        },
      };

      mockFetchSuccess(mockTaxResult);

      const response = await client.calculateTax(address, 150.00);

      expect(response.data).toEqual(mockTaxResult);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/tax/calculate'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ address, amount: 150.00 }),
        })
      );
    });
  });

  describe('validateAddress', () => {
    it('should validate and normalize address', async () => {
      const address: Address = {
        street: '123 main st',
        city: 'springfield',
        state: 'il',
        zip: '62701',
      };

      const mockValidation = {
        valid: true,
        normalized: {
          street: '123 Main St',
          city: 'Springfield',
          state: 'IL',
          zip: '62701',
        },
      };

      mockFetchSuccess(mockValidation);

      const response = await client.validateAddress(address);

      expect(response.data.valid).toBe(true);
      expect(response.data.normalized).toBeDefined();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/address/validate'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ address }),
        })
      );
    });

    it('should return suggestions for invalid address', async () => {
      const address: Address = {
        street: '123 Fake St',
        city: 'Nowhere',
        state: 'XX',
        zip: '00000',
      };

      const mockValidation = {
        valid: false,
        suggestions: [
          { street: '123 Real St', city: 'Somewhere', state: 'IL', zip: '62701' },
        ],
      };

      mockFetchSuccess(mockValidation);

      const response = await client.validateAddress(address);

      expect(response.data.valid).toBe(false);
      expect(response.data.suggestions).toBeDefined();
      expect(response.data.suggestions?.length).toBeGreaterThan(0);
    });
  });
});

describe('checkAvailableServices', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should check all services availability', async () => {
    // Mock health checks - all services online
    mockFetchSuccess({ status: 'healthy' }); // AuthorFlow
    mockFetchSuccess({ status: 'healthy' }); // Ledgerly
    mockFetchSuccess({ status: 'healthy' }); // Calendar
    mockFetchSuccess({ status: 'healthy' }); // Nautilus

    const services = await checkAvailableServices();

    expect(services).toEqual({
      authorFlow: true,
      ledgerly: true,
      calendar: true,
      nautilus: true,
    });
    expect(mockFetch).toHaveBeenCalledTimes(4);
  });

  it('should handle partial service availability', async () => {
    // AuthorFlow online
    mockFetchSuccess({ status: 'healthy' });
    // Ledgerly offline
    mockFetchError(503, 'Service Unavailable');
    // Calendar online
    mockFetchSuccess({ status: 'healthy' });
    // Nautilus offline
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const services = await checkAvailableServices();

    expect(services).toEqual({
      authorFlow: true,
      ledgerly: false,
      calendar: true,
      nautilus: false,
    });
  });

  it('should handle all services offline', async () => {
    // All services fail
    mockFetchError(503, 'Service Unavailable');
    mockFetchError(503, 'Service Unavailable');
    mockFetchError(503, 'Service Unavailable');
    mockFetchError(503, 'Service Unavailable');

    const services = await checkAvailableServices();

    expect(services).toEqual({
      authorFlow: false,
      ledgerly: false,
      calendar: false,
      nautilus: false,
    });
  });
});
