/**
 * Calendar & Logistics API Client
 *
 * Client for your actual Supabase Edge Functions:
 * - Calendar event management
 * - Delivery scheduling and tracking
 * - Freight and load management
 * - Tax and quote calculations
 * - Material management
 */

import { BaseApiClient, type ApiResponse } from './base-client';
import type { Address } from '@/types';

// ============================================================================
// Configuration
// ============================================================================

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://visvcsddzmnqlkkfyoww.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const FUNCTIONS_BASE = `${SUPABASE_URL}/functions/v1`;

// ============================================================================
// Type Definitions
// ============================================================================

export interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  attendees?: string[];
  metadata?: Record<string, any>;
}

export interface DeliverySchedule {
  id?: string;
  orderId: string;
  scheduledDate: string;
  timeWindow?: string;
  address: Address;
  driver?: string;
  status: 'scheduled' | 'in_transit' | 'delivered' | 'cancelled';
  estimatedArrival?: string;
}

export interface FreightQuote {
  weight: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  origin: Address;
  destination: Address;
  price: number;
  zone?: string;
  distance?: number;
  tax?: number;
}

export interface Load {
  id?: string;
  orderId: string;
  weight: number;
  materials: Material[];
  origin: Address;
  destination: Address;
  status: 'pending' | 'in_transit' | 'delivered';
  scheduledDate?: string;
}

export interface Material {
  id: string;
  name: string;
  weight: number;
  quantity: number;
  description?: string;
}

export interface TaxCalculation {
  amount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  jurisdiction?: string;
}

export interface WeatherConditions {
  temperature: number;
  conditions: string;
  precipitation: number;
  windSpeed: number;
  visibility: number;
}

// ============================================================================
// Calendar & Event Management Client
// ============================================================================

export class CalendarApiClient extends BaseApiClient {
  constructor() {
    super({
      baseUrl: FUNCTIONS_BASE,
      apiKey: SUPABASE_ANON_KEY,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY!,
      },
    });
  }

  /**
   * Create a calendar event
   */
  async createEvent(event: CalendarEvent): Promise<ApiResponse<CalendarEvent>> {
    return this.post<CalendarEvent>('/create-calendar-event', event);
  }

  /**
   * Extract event from text/description
   */
  async extractEvent(text: string): Promise<ApiResponse<CalendarEvent>> {
    return this.post<CalendarEvent>('/extract-event', { text });
  }

  /**
   * Split a multi-day event into individual day events
   */
  async splitEvents(event: CalendarEvent): Promise<ApiResponse<CalendarEvent[]>> {
    return this.post<CalendarEvent[]>('/split-events', event);
  }
}

// ============================================================================
// Delivery & Logistics Client
// ============================================================================

export class DeliveryApiClient extends BaseApiClient {
  constructor() {
    super({
      baseUrl: FUNCTIONS_BASE,
      apiKey: SUPABASE_ANON_KEY,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY!,
      },
    });
  }

  /**
   * Get scheduled deliveries
   */
  async getScheduledDeliveries(date?: string): Promise<ApiResponse<DeliverySchedule[]>> {
    return this.get<DeliverySchedule[]>('/scheduled-deliveries', date ? { date } : undefined);
  }

  /**
   * Get delivery outlook/forecast
   */
  async getDeliveryOutlook(date: string): Promise<ApiResponse<{
    deliveries: DeliverySchedule[];
    weather: WeatherConditions;
    recommendations: string[];
  }>> {
    return this.get('/delivery-outlook', { date });
  }

  /**
   * Calculate distance between two addresses
   */
  async calculateDistance(origin: Address, destination: Address): Promise<ApiResponse<{
    distance: number;
    duration: number;
    route?: any;
  }>> {
    return this.post('/calculate-distance', { origin, destination });
  }

  /**
   * Look up delivery zone for address
   * Returns zone info with fees, distance, and tax information
   */
  async lookupZone(address: Address): Promise<ApiResponse<{
    address: string; // Formatted address from Google Maps
    coordinates: { lat: number; lng: number };
    distance: number; // Miles from Windsor hub
    zone: number; // Zone number (1-12)
    fees: {
      trailer: number; // Trailer delivery fee for this zone
      tandem: number; // Tandem truck delivery fee for this zone
    };
    taxInfo: {
      rate: number; // Tax rate percentage (e.g., 2.9 for Colorado)
      jurisdiction: string; // Tax jurisdiction (e.g., "Colorado")
    };
  }>> {
    return this.post('/zone-lookup', { address });
  }
}

// ============================================================================
// Freight & Load Management Client
// ============================================================================

export class FreightApiClient extends BaseApiClient {
  constructor() {
    super({
      baseUrl: FUNCTIONS_BASE,
      apiKey: SUPABASE_ANON_KEY,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY!,
      },
    });
  }

  /**
   * Validate weight measurements
   */
  async validateWeight(weight: number, unit: 'lbs' | 'kg' = 'lbs'): Promise<ApiResponse<{
    valid: boolean;
    weight: number;
    unit: string;
    warnings?: string[];
  }>> {
    return this.post('/validate-weight', { weight, unit });
  }

  /**
   * Get freight pricing for shipment
   */
  async getFreightPricing(quote: Omit<FreightQuote, 'price'>): Promise<ApiResponse<FreightQuote>> {
    return this.post<FreightQuote>('/freight-pricing', quote);
  }

  /**
   * Detect if shipment requires freight handling
   */
  async detectFreight(weight: number, dimensions?: FreightQuote['dimensions']): Promise<ApiResponse<{
    isFreight: boolean;
    reason?: string;
    recommendation?: string;
  }>> {
    return this.post('/detect-freight', { weight, dimensions });
  }

  /**
   * Get available materials
   */
  async getMaterials(): Promise<ApiResponse<Material[]>> {
    return this.get<Material[]>('/get-materials');
  }

  /**
   * Search materials by query
   */
  async searchMaterials(query: string): Promise<ApiResponse<Material[]>> {
    return this.get<Material[]>('/search-materials', { q: query });
  }

  /**
   * Get loads
   */
  async getLoads(filters?: {
    status?: Load['status'];
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<Load[]>> {
    return this.get<Load[]>('/get-loads', filters);
  }

  /**
   * Create a new load
   */
  async createLoad(load: Omit<Load, 'id'>): Promise<ApiResponse<Load>> {
    return this.post<Load>('/create-load', load);
  }

  /**
   * Get load statistics
   */
  async getLoadStats(period?: 'day' | 'week' | 'month'): Promise<ApiResponse<{
    totalLoads: number;
    totalWeight: number;
    averageWeight: number;
    byStatus: Record<Load['status'], number>;
  }>> {
    return this.get('/load-stats', period ? { period } : undefined);
  }
}

// ============================================================================
// Quote & Pricing Client
// ============================================================================

export class QuoteApiClient extends BaseApiClient {
  constructor() {
    super({
      baseUrl: FUNCTIONS_BASE,
      apiKey: SUPABASE_ANON_KEY,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY!,
      },
    });
  }

  /**
   * Calculate quote for delivery
   */
  async calculateQuote(params: {
    origin: Address;
    destination: Address;
    weight: number;
    materials?: Material[];
    deliveryDate?: string;
  }): Promise<ApiResponse<FreightQuote>> {
    return this.post<FreightQuote>('/calculate-quote', params);
  }

  /**
   * Look up tax rate for address
   */
  async lookupTax(address: Address, amount: number): Promise<ApiResponse<TaxCalculation>> {
    return this.post<TaxCalculation>('/tax-lookup', { address, amount });
  }
}

// ============================================================================
// Data Processing Client
// ============================================================================

export class DataApiClient extends BaseApiClient {
  constructor() {
    super({
      baseUrl: FUNCTIONS_BASE,
      apiKey: SUPABASE_ANON_KEY,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY!,
      },
    });
  }

  /**
   * Process CSV file
   */
  async processCSV(csvData: string, options?: {
    delimiter?: string;
    hasHeader?: boolean;
  }): Promise<ApiResponse<{
    rows: any[];
    headers?: string[];
    errors?: string[];
  }>> {
    return this.post('/process-csv', { csvData, ...options });
  }

  /**
   * Generate report
   */
  async generateReport(reportType: string, params: Record<string, any>): Promise<ApiResponse<{
    reportId: string;
    data: any;
    generatedAt: string;
  }>> {
    return this.post('/generate-report', { reportType, ...params });
  }
}

// ============================================================================
// Weather Client
// ============================================================================

export class WeatherApiClient extends BaseApiClient {
  constructor() {
    super({
      baseUrl: FUNCTIONS_BASE,
      apiKey: SUPABASE_ANON_KEY,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY!,
      },
    });
  }

  /**
   * Get current weather for location
   */
  async getCurrentWeather(location: { lat: number; lon: number } | string): Promise<ApiResponse<WeatherConditions>> {
    return this.post<WeatherConditions>('/current-weather', { location });
  }
}

// ============================================================================
// Export Singleton Instances
// ============================================================================

export const calendarApi = new CalendarApiClient();
export const deliveryApi = new DeliveryApiClient();
export const freightApi = new FreightApiClient();
export const quoteApi = new QuoteApiClient();
export const dataApi = new DataApiClient();
export const weatherApi = new WeatherApiClient();

// ============================================================================
// Integration Helper - Check Service Health
// ============================================================================

export async function checkApiHealth() {
  const services = {
    calendar: false,
    delivery: false,
    freight: false,
    quote: false,
    data: false,
    weather: false,
  };

  try {
    services.calendar = await calendarApi.healthCheck();
  } catch {}

  try {
    services.delivery = await deliveryApi.healthCheck();
  } catch {}

  try {
    services.freight = await freightApi.healthCheck();
  } catch {}

  try {
    services.quote = await quoteApi.healthCheck();
  } catch {}

  try {
    services.data = await dataApi.healthCheck();
  } catch {}

  try {
    services.weather = await weatherApi.healthCheck();
  } catch {}

  return services;
}

// ============================================================================
// Usage Examples
// ============================================================================

/**
 * Example: Calculate delivery quote with tax
 *
 * import { quoteApi, deliveryApi } from '@/services/api-clients/calendar-api';
 *
 * async function getDeliveryQuote(order: Order) {
 *   // Calculate quote
 *   const quote = await quoteApi.calculateQuote({
 *     origin: storeAddress,
 *     destination: order.deliveryAddress,
 *     weight: order.totalWeight,
 *     materials: order.items,
 *     deliveryDate: order.requestedDeliveryDate,
 *   });
 *
 *   // Calculate tax
 *   const tax = await quoteApi.lookupTax(order.deliveryAddress, quote.data.price);
 *
 *   return {
 *     subtotal: quote.data.price,
 *     tax: tax.data.taxAmount,
 *     total: tax.data.total,
 *   };
 * }
 */

/**
 * Example: Schedule delivery with calendar event
 *
 * import { deliveryApi, calendarApi } from '@/services/api-clients/calendar-api';
 *
 * async function scheduleOrderDelivery(order: Order) {
 *   // Check delivery zone and availability
 *   const zone = await deliveryApi.lookupZone(order.deliveryAddress);
 *
 *   // Create calendar event
 *   await calendarApi.createEvent({
 *     title: `Delivery: Order #${order.number}`,
 *     description: `Customer: ${order.client.name}`,
 *     startDate: order.deliveryDate,
 *     location: `${order.deliveryAddress.street}, ${order.deliveryAddress.city}`,
 *     metadata: {
 *       orderId: order.id,
 *       zone: zone.data.zone,
 *     },
 *   });
 * }
 */

/**
 * Example: Check freight requirements
 *
 * import { freightApi } from '@/services/api-clients/calendar-api';
 *
 * async function checkIfFreightRequired(order: Order) {
 *   const detection = await freightApi.detectFreight(
 *     order.totalWeight,
 *     order.dimensions
 *   );
 *
 *   if (detection.data.isFreight) {
 *     // Get freight pricing
 *     const pricing = await freightApi.getFreightPricing({
 *       weight: order.totalWeight,
 *       dimensions: order.dimensions,
 *       origin: storeAddress,
 *       destination: order.deliveryAddress,
 *     });
 *
 *     return pricing.data.price;
 *   }
 *
 *   return null; // Standard delivery
 * }
 */
