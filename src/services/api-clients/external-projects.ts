/**
 * API Clients for External Projects
 *
 * Ready-to-use clients for integrating with your other projects.
 * Just configure the base URLs in .env and start using!
 */

import { BaseApiClient, type ApiResponse } from './base-client';
import type { Address } from '@/types';

// ============================================================================
// AuthorFlow Client - Authentication & Authorization
// ============================================================================

export interface AuthorFlowUser {
  id: string;
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
}

export interface AuthorFlowSession {
  token: string;
  user: AuthorFlowUser;
  expiresAt: string;
}

export class AuthorFlowClient extends BaseApiClient {
  constructor() {
    super({
      baseUrl: import.meta.env.VITE_AUTHORFLOW_API || 'http://localhost:3001',
      apiKey: import.meta.env.VITE_AUTHORFLOW_API_KEY,
    });
  }

  /**
   * Authenticate user
   */
  async login(username: string, password: string): Promise<ApiResponse<AuthorFlowSession>> {
    return this.post<AuthorFlowSession>('/auth/login', {
      username,
      password,
    });
  }

  /**
   * Validate session token
   */
  async validateToken(token: string): Promise<ApiResponse<AuthorFlowUser>> {
    return this.post<AuthorFlowUser>('/auth/validate', { token });
  }

  /**
   * Get user permissions
   */
  async getUserPermissions(userId: string): Promise<ApiResponse<string[]>> {
    return this.get<string[]>(`/users/${userId}/permissions`);
  }

  /**
   * Check if user has specific permission
   */
  async checkPermission(userId: string, permission: string): Promise<ApiResponse<boolean>> {
    return this.post<boolean>(`/users/${userId}/check-permission`, { permission });
  }
}

// ============================================================================
// Ledgerly Client - Accounting & Bookkeeping
// ============================================================================

export interface LedgerlyTransaction {
  id?: string;
  type: 'revenue' | 'expense' | 'payment' | 'refund';
  amount: number;
  description: string;
  category?: string;
  orderId?: string;
  clientId?: string;
  date: string;
  metadata?: Record<string, any>;
}

export interface LedgerlyAccount {
  id: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  balance: number;
  currency: string;
}

export interface LedgerlyReport {
  type: 'balance_sheet' | 'income_statement' | 'cash_flow';
  startDate: string;
  endDate: string;
  data: any;
}

export class LedgerlyClient extends BaseApiClient {
  constructor() {
    super({
      baseUrl: import.meta.env.VITE_LEDGERLY_API || 'http://localhost:3002',
      apiKey: import.meta.env.VITE_LEDGERLY_API_KEY,
    });
  }

  /**
   * Record a transaction
   */
  async recordTransaction(transaction: LedgerlyTransaction): Promise<ApiResponse<LedgerlyTransaction>> {
    return this.post<LedgerlyTransaction>('/transactions', transaction);
  }

  /**
   * Get account balance
   */
  async getAccountBalance(accountId: string): Promise<ApiResponse<LedgerlyAccount>> {
    return this.get<LedgerlyAccount>(`/accounts/${accountId}`);
  }

  /**
   * Generate financial report
   */
  async generateReport(
    type: LedgerlyReport['type'],
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<LedgerlyReport>> {
    return this.post<LedgerlyReport>('/reports/generate', {
      type,
      startDate,
      endDate,
    });
  }

  /**
   * Get transactions for a date range
   */
  async getTransactions(startDate: string, endDate: string): Promise<ApiResponse<LedgerlyTransaction[]>> {
    return this.get<LedgerlyTransaction[]>('/transactions', {
      startDate,
      endDate,
    });
  }

  /**
   * Reconcile order payment with accounting
   */
  async reconcileOrderPayment(orderId: string, amount: number): Promise<ApiResponse<void>> {
    return this.post<void>('/reconciliation/order', {
      orderId,
      amount,
    });
  }
}

// ============================================================================
// Calendar Client - Scheduling & Events
// ============================================================================

export interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  type: 'delivery' | 'appointment' | 'reminder' | 'other';
  relatedEntityId?: string; // Order ID, Client ID, etc.
  relatedEntityType?: 'order' | 'client' | 'employee';
  assignedTo?: string; // Employee ID or Driver ID
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  metadata?: Record<string, any>;
}

export interface CalendarSlot {
  date: string;
  timeSlot: string;
  available: boolean;
  capacity: number;
  booked: number;
}

export class CalendarClient extends BaseApiClient {
  constructor() {
    super({
      baseUrl: import.meta.env.VITE_CALENDAR_API || 'http://localhost:3003',
      apiKey: import.meta.env.VITE_CALENDAR_API_KEY,
    });
  }

  /**
   * Create a calendar event
   */
  async createEvent(event: CalendarEvent): Promise<ApiResponse<CalendarEvent>> {
    return this.post<CalendarEvent>('/events', event);
  }

  /**
   * Get events for a date range
   */
  async getEvents(startDate: string, endDate: string, type?: CalendarEvent['type']): Promise<ApiResponse<CalendarEvent[]>> {
    return this.get<CalendarEvent[]>('/events', {
      startDate,
      endDate,
      type,
    });
  }

  /**
   * Get available delivery slots
   */
  async getAvailableSlots(date: string): Promise<ApiResponse<CalendarSlot[]>> {
    return this.get<CalendarSlot[]>('/slots/available', { date });
  }

  /**
   * Schedule a delivery
   */
  async scheduleDelivery(orderId: string, date: string, timeSlot: string): Promise<ApiResponse<CalendarEvent>> {
    return this.post<CalendarEvent>('/deliveries/schedule', {
      orderId,
      date,
      timeSlot,
    });
  }

  /**
   * Update event status
   */
  async updateEventStatus(eventId: string, status: CalendarEvent['status']): Promise<ApiResponse<CalendarEvent>> {
    return this.patch<CalendarEvent>(`/events/${eventId}`, { status });
  }

  /**
   * Get events for a specific driver
   */
  async getDriverSchedule(driverId: string, date: string): Promise<ApiResponse<CalendarEvent[]>> {
    return this.get<CalendarEvent[]>(`/drivers/${driverId}/schedule`, { date });
  }
}

// ============================================================================
// Nautilus Client - Custom API Services
// ============================================================================

export interface NautilusService {
  name: string;
  version: string;
  endpoints: string[];
  status: 'online' | 'offline' | 'degraded';
}

export class NautilusClient extends BaseApiClient {
  constructor() {
    super({
      baseUrl: import.meta.env.VITE_NAUTILUS_API || 'http://localhost:3004',
      apiKey: import.meta.env.VITE_NAUTILUS_API_KEY,
    });
  }

  /**
   * Get available services
   */
  async getServices(): Promise<ApiResponse<NautilusService[]>> {
    return this.get<NautilusService[]>('/services');
  }

  /**
   * Generic request to Nautilus service
   */
  async callService<T>(serviceName: string, endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.post<T>(`/services/${serviceName}${endpoint}`, data);
  }

  /**
   * Tax calculation via Nautilus (if you implement it there)
   */
  async calculateTax(address: Address, amount: number): Promise<ApiResponse<{
    taxAmount: number;
    taxRate: number;
    breakdown: any;
  }>> {
    return this.post('/tax/calculate', {
      address,
      amount,
    });
  }

  /**
   * Address validation via Nautilus
   */
  async validateAddress(address: Address): Promise<ApiResponse<{
    valid: boolean;
    normalized?: Address;
    suggestions?: Address[];
  }>> {
    return this.post('/address/validate', { address });
  }
}

// ============================================================================
// Export Singleton Instances
// ============================================================================

export const authorFlowClient = new AuthorFlowClient();
export const ledgerlyClient = new LedgerlyClient();
export const calendarClient = new CalendarClient();
export const nautilusClient = new NautilusClient();

// ============================================================================
// Integration Helper - Check which services are available
// ============================================================================

export async function checkAvailableServices() {
  const services = {
    authorFlow: false,
    ledgerly: false,
    calendar: false,
    nautilus: false,
  };

  try {
    services.authorFlow = await authorFlowClient.healthCheck();
  } catch {}

  try {
    services.ledgerly = await ledgerlyClient.healthCheck();
  } catch {}

  try {
    services.calendar = await calendarClient.healthCheck();
  } catch {}

  try {
    services.nautilus = await nautilusClient.healthCheck();
  } catch {}

  return services;
}

// ============================================================================
// Usage Examples
// ============================================================================

/**
 * Example: Record order payment in Ledgerly
 *
 * import { ledgerlyClient } from '@/services/api-clients/external-projects';
 *
 * async function recordOrderRevenue(order: Order) {
 *   try {
 *     const response = await ledgerlyClient.recordTransaction({
 *       type: 'revenue',
 *       amount: order.grandTotal,
 *       description: `Order #${order.number} - ${order.client.name}`,
 *       orderId: order.id,
 *       clientId: order.client.id,
 *       date: new Date().toISOString(),
 *     });
 *     console.log('Transaction recorded:', response.data);
 *   } catch (error) {
 *     console.error('Failed to record transaction:', error);
 *   }
 * }
 */

/**
 * Example: Schedule delivery in Calendar
 *
 * import { calendarClient } from '@/services/api-clients/external-projects';
 *
 * async function scheduleOrderDelivery(order: Order) {
 *   try {
 *     const response = await calendarClient.scheduleDelivery(
 *       order.id,
 *       order.metadata.delivery.scheduledDate,
 *       order.metadata.delivery.timeSlot
 *     );
 *     console.log('Delivery scheduled:', response.data);
 *   } catch (error) {
 *     console.error('Failed to schedule delivery:', error);
 *   }
 * }
 */

/**
 * Example: Calculate tax via Nautilus
 *
 * import { nautilusClient } from '@/services/api-clients/external-projects';
 *
 * async function calculateOrderTax(address: Address, subtotal: number) {
 *   try {
 *     const response = await nautilusClient.calculateTax(address, subtotal);
 *     return response.data.taxAmount;
 *   } catch (error) {
 *     console.error('Tax calculation failed:', error);
 *     return subtotal * 0.08; // Fallback to 8%
 *   }
 * }
 */
