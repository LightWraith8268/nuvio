/**
 * Supabase Edge Functions Adapter
 *
 * Routes API requests to Supabase Edge Functions deployed at:
 * https://visvcsddzmnqlkkfyoww.supabase.co/functions/v1
 *
 * This adapter transforms the generic API client endpoints into
 * Supabase Edge Function names and handles the routing automatically.
 */

import { BaseApiClient, type ApiResponse } from './base-client';
import type { Address } from '@/types';
import type {
  AuthorFlowUser,
  AuthorFlowSession,
  LedgerlyTransaction,
  LedgerlyAccount,
  LedgerlyReport,
  CalendarEvent,
  CalendarSlot,
  NautilusService,
} from './external-projects';

// ============================================================================
// Supabase Configuration
// ============================================================================

const SUPABASE_FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL ||
  'https://visvcsddzmnqlkkfyoww.supabase.co/functions/v1';

const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpc3Zjc2Rkem1ucWxra2Z5b3d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTY4ODIsImV4cCI6MjA3NTY3Mjg4Mn0.f4KUc49fMYOliAiVtNMCG4gcEJd-__HA6soPCAFtiPQ';

// ============================================================================
// Edge Function Name Mapping
// ============================================================================

/**
 * Maps API endpoints to Supabase Edge Function names
 *
 * Example mapping:
 * POST /auth/login -> authorflow-auth (with action: "login")
 * GET /users/123/permissions -> authorflow-users (with action: "permissions", userId: "123")
 */

const FUNCTION_NAMES = {
  // AuthorFlow functions
  'authorflow-auth': 'authorflow-auth',
  'authorflow-users': 'authorflow-users',

  // Ledgerly functions
  'ledgerly-transactions': 'ledgerly-transactions',
  'ledgerly-accounts': 'ledgerly-accounts',
  'ledgerly-reports': 'ledgerly-reports',
  'ledgerly-reconciliation': 'ledgerly-reconciliation',

  // Calendar functions
  'calendar-events': 'calendar-events',
  'calendar-slots': 'calendar-slots',
  'calendar-deliveries': 'calendar-deliveries',
  'calendar-drivers': 'calendar-drivers',

  // Nautilus functions
  'nautilus-services': 'nautilus-services',
  'nautilus-tax': 'nautilus-tax',
  'nautilus-address': 'nautilus-address',
};

// ============================================================================
// Base Supabase Edge Function Client
// ============================================================================

class SupabaseEdgeFunctionClient extends BaseApiClient {
  constructor(functionName: string, customApiKey?: string) {
    super({
      baseUrl: `${SUPABASE_FUNCTIONS_URL}/${functionName}`,
      apiKey: customApiKey || SUPABASE_ANON_KEY,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY, // Supabase requires this header
      },
    });
  }

  /**
   * Override to use root path since function name is in baseUrl
   */
  protected async callFunction<T>(action: string, data?: any): Promise<ApiResponse<T>> {
    return this.post<T>('', { action, ...data });
  }
}

// ============================================================================
// AuthorFlow Edge Functions Client
// ============================================================================

export class AuthorFlowEdgeClient {
  private authClient: SupabaseEdgeFunctionClient;
  private usersClient: SupabaseEdgeFunctionClient;

  constructor() {
    const apiKey = import.meta.env.VITE_AUTHORFLOW_API_KEY;
    this.authClient = new SupabaseEdgeFunctionClient(FUNCTION_NAMES['authorflow-auth'], apiKey);
    this.usersClient = new SupabaseEdgeFunctionClient(FUNCTION_NAMES['authorflow-users'], apiKey);
  }

  async login(username: string, password: string): Promise<ApiResponse<AuthorFlowSession>> {
    return this.authClient['callFunction']('login', { username, password });
  }

  async validateToken(token: string): Promise<ApiResponse<AuthorFlowUser>> {
    return this.authClient['callFunction']('validate', { token });
  }

  async getUserPermissions(userId: string): Promise<ApiResponse<string[]>> {
    return this.usersClient['callFunction']('permissions', { userId });
  }

  async checkPermission(userId: string, permission: string): Promise<ApiResponse<boolean>> {
    return this.usersClient['callFunction']('check-permission', { userId, permission });
  }

  async healthCheck(): Promise<boolean> {
    return this.authClient.healthCheck();
  }
}

// ============================================================================
// Ledgerly Edge Functions Client
// ============================================================================

export class LedgerlyEdgeClient {
  private transactionsClient: SupabaseEdgeFunctionClient;
  private accountsClient: SupabaseEdgeFunctionClient;
  private reportsClient: SupabaseEdgeFunctionClient;
  private reconciliationClient: SupabaseEdgeFunctionClient;

  constructor() {
    const apiKey = import.meta.env.VITE_LEDGERLY_API_KEY;
    this.transactionsClient = new SupabaseEdgeFunctionClient(FUNCTION_NAMES['ledgerly-transactions'], apiKey);
    this.accountsClient = new SupabaseEdgeFunctionClient(FUNCTION_NAMES['ledgerly-accounts'], apiKey);
    this.reportsClient = new SupabaseEdgeFunctionClient(FUNCTION_NAMES['ledgerly-reports'], apiKey);
    this.reconciliationClient = new SupabaseEdgeFunctionClient(FUNCTION_NAMES['ledgerly-reconciliation'], apiKey);
  }

  async recordTransaction(transaction: LedgerlyTransaction): Promise<ApiResponse<LedgerlyTransaction>> {
    return this.transactionsClient['callFunction']('record', transaction);
  }

  async getAccountBalance(accountId: string): Promise<ApiResponse<LedgerlyAccount>> {
    return this.accountsClient['callFunction']('balance', { accountId });
  }

  async generateReport(
    type: LedgerlyReport['type'],
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<LedgerlyReport>> {
    return this.reportsClient['callFunction']('generate', { type, startDate, endDate });
  }

  async getTransactions(startDate: string, endDate: string): Promise<ApiResponse<LedgerlyTransaction[]>> {
    return this.transactionsClient['callFunction']('list', { startDate, endDate });
  }

  async reconcileOrderPayment(orderId: string, amount: number): Promise<ApiResponse<void>> {
    return this.reconciliationClient['callFunction']('order', { orderId, amount });
  }

  async healthCheck(): Promise<boolean> {
    return this.transactionsClient.healthCheck();
  }
}

// ============================================================================
// Calendar Edge Functions Client
// ============================================================================

export class CalendarEdgeClient {
  private eventsClient: SupabaseEdgeFunctionClient;
  private slotsClient: SupabaseEdgeFunctionClient;
  private deliveriesClient: SupabaseEdgeFunctionClient;
  private driversClient: SupabaseEdgeFunctionClient;

  constructor() {
    const apiKey = import.meta.env.VITE_CALENDAR_API_KEY;
    this.eventsClient = new SupabaseEdgeFunctionClient(FUNCTION_NAMES['calendar-events'], apiKey);
    this.slotsClient = new SupabaseEdgeFunctionClient(FUNCTION_NAMES['calendar-slots'], apiKey);
    this.deliveriesClient = new SupabaseEdgeFunctionClient(FUNCTION_NAMES['calendar-deliveries'], apiKey);
    this.driversClient = new SupabaseEdgeFunctionClient(FUNCTION_NAMES['calendar-drivers'], apiKey);
  }

  async createEvent(event: CalendarEvent): Promise<ApiResponse<CalendarEvent>> {
    return this.eventsClient['callFunction']('create', event);
  }

  async getEvents(startDate: string, endDate: string, type?: CalendarEvent['type']): Promise<ApiResponse<CalendarEvent[]>> {
    return this.eventsClient['callFunction']('list', { startDate, endDate, type });
  }

  async getAvailableSlots(date: string): Promise<ApiResponse<CalendarSlot[]>> {
    return this.slotsClient['callFunction']('available', { date });
  }

  async scheduleDelivery(orderId: string, date: string, timeSlot: string): Promise<ApiResponse<CalendarEvent>> {
    return this.deliveriesClient['callFunction']('schedule', { orderId, date, timeSlot });
  }

  async updateEventStatus(eventId: string, status: CalendarEvent['status']): Promise<ApiResponse<CalendarEvent>> {
    return this.eventsClient['callFunction']('update-status', { eventId, status });
  }

  async getDriverSchedule(driverId: string, date: string): Promise<ApiResponse<CalendarEvent[]>> {
    return this.driversClient['callFunction']('schedule', { driverId, date });
  }

  async healthCheck(): Promise<boolean> {
    return this.eventsClient.healthCheck();
  }
}

// ============================================================================
// Nautilus Edge Functions Client
// ============================================================================

export class NautilusEdgeClient {
  private servicesClient: SupabaseEdgeFunctionClient;
  private taxClient: SupabaseEdgeFunctionClient;
  private addressClient: SupabaseEdgeFunctionClient;

  constructor() {
    const apiKey = import.meta.env.VITE_NAUTILUS_API_KEY;
    this.servicesClient = new SupabaseEdgeFunctionClient(FUNCTION_NAMES['nautilus-services'], apiKey);
    this.taxClient = new SupabaseEdgeFunctionClient(FUNCTION_NAMES['nautilus-tax'], apiKey);
    this.addressClient = new SupabaseEdgeFunctionClient(FUNCTION_NAMES['nautilus-address'], apiKey);
  }

  async getServices(): Promise<ApiResponse<NautilusService[]>> {
    return this.servicesClient['callFunction']('list', {});
  }

  async callService<T>(serviceName: string, endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.servicesClient['callFunction']('call', { serviceName, endpoint, data });
  }

  async calculateTax(address: Address, amount: number): Promise<ApiResponse<{
    taxAmount: number;
    taxRate: number;
    breakdown: any;
  }>> {
    return this.taxClient['callFunction']('calculate', { address, amount });
  }

  async validateAddress(address: Address): Promise<ApiResponse<{
    valid: boolean;
    normalized?: Address;
    suggestions?: Address[];
  }>> {
    return this.addressClient['callFunction']('validate', { address });
  }

  async healthCheck(): Promise<boolean> {
    return this.servicesClient.healthCheck();
  }
}

// ============================================================================
// Export Singleton Instances
// ============================================================================

export const authorFlowEdgeClient = new AuthorFlowEdgeClient();
export const ledgerlyEdgeClient = new LedgerlyEdgeClient();
export const calendarEdgeClient = new CalendarEdgeClient();
export const nautilusEdgeClient = new NautilusEdgeClient();

// ============================================================================
// Integration Helper - Check which services are available
// ============================================================================

export async function checkAvailableEdgeServices() {
  const services = {
    authorFlow: false,
    ledgerly: false,
    calendar: false,
    nautilus: false,
  };

  try {
    services.authorFlow = await authorFlowEdgeClient.healthCheck();
  } catch {}

  try {
    services.ledgerly = await ledgerlyEdgeClient.healthCheck();
  } catch {}

  try {
    services.calendar = await calendarEdgeClient.healthCheck();
  } catch {}

  try {
    services.nautilus = await nautilusEdgeClient.healthCheck();
  } catch {}

  return services;
}

// ============================================================================
// Usage Example
// ============================================================================

/**
 * Using Supabase Edge Functions:
 *
 * import { ledgerlyEdgeClient } from '@/services/api-clients/supabase-edge-functions';
 *
 * async function recordOrderRevenue(order: Order) {
 *   try {
 *     const response = await ledgerlyEdgeClient.recordTransaction({
 *       type: 'revenue',
 *       amount: order.grandTotal,
 *       description: `Order #${order.number}`,
 *       orderId: order.id,
 *       date: new Date().toISOString(),
 *     });
 *     console.log('Transaction recorded:', response.data);
 *   } catch (error) {
 *     console.error('Failed to record transaction:', error);
 *   }
 * }
 */
