/**
 * Delivery Fee Calculator Service
 *
 * Calculates delivery fees using Supabase Edge Functions:
 * - zone-lookup: Get delivery zone info
 * - calculate-distance: Get distance and duration
 * - calculate-quote: Get complete delivery quote with pricing
 */

import { deliveryApi, quoteApi } from './api-clients/calendar-api';
import type { Address } from '@/types';

export interface DeliveryFeeCalculation {
  fee: number;
  zone?: number;
  distance?: number;
  duration?: number;
  freeDelivery: boolean;
  vehicleType?: 'trailer' | 'tandem';
  breakdown: {
    baseFee: number;
    distanceFee: number;
    zoneFee: number;
    total: number;
  };
}

class DeliveryCalculatorService {
  private storeAddress: Address = {
    street: '123 Main St', // TODO: Get from store settings
    city: 'Springfield',
    state: 'IL',
    zip: '62701',
  };

  private readonly FREE_DELIVERY_THRESHOLD = 200; // Free delivery over $200
  private readonly BASE_FEE = 10; // Base delivery fee
  private readonly TANDEM_WEIGHT_THRESHOLD = 10000; // 10,000 lbs requires tandem truck

  /**
   * Calculate delivery fee for an order
   */
  async calculateDeliveryFee(
    deliveryAddress: Address,
    orderSubtotal: number,
    orderWeight?: number
  ): Promise<DeliveryFeeCalculation> {
    try {
      // Check if order qualifies for free delivery
      if (orderSubtotal >= this.FREE_DELIVERY_THRESHOLD) {
        return {
          fee: 0,
          freeDelivery: true,
          breakdown: {
            baseFee: 0,
            distanceFee: 0,
            zoneFee: 0,
            total: 0,
          },
        };
      }

      // Try to use the full calculate-quote API first (most comprehensive)
      const quote = await this.calculateQuote(deliveryAddress, orderSubtotal);
      if (quote) {
        return quote;
      }

      // Fallback: Use zone-lookup
      const fallback = await this.calculateWithZoneLookup(deliveryAddress, orderWeight);
      if (fallback) {
        return fallback;
      }

      // Final fallback: Use base fee
      return this.getDefaultDeliveryFee();
    } catch (error) {
      console.error('Delivery fee calculation failed:', error);
      return this.getDefaultDeliveryFee();
    }
  }

  /**
   * Calculate quote using the complete calculate-quote API
   */
  private async calculateQuote(
    deliveryAddress: Address,
    orderSubtotal: number
  ): Promise<DeliveryFeeCalculation | null> {
    try {
      const response = await quoteApi.calculateQuote({
        origin: this.storeAddress,
        destination: deliveryAddress,
        weight: 0, // Weight not available at quote time
      });

      const { price, zone, distance } = response.data;

      return {
        fee: price,
        zone,
        distance,
        freeDelivery: false,
        breakdown: {
          baseFee: this.BASE_FEE,
          distanceFee: price - this.BASE_FEE,
          zoneFee: 0,
          total: price,
        },
      };
    } catch (error) {
      console.warn('calculate-quote API failed, trying fallback:', error);
      return null;
    }
  }

  /**
   * Calculate using zone-lookup API
   * The zone-lookup API returns comprehensive data including:
   * - Zone number (1-12)
   * - Distance from Windsor hub
   * - Fees object with trailer and tandem prices
   * - Tax info with rate and jurisdiction
   *
   * Tandem fee is calculated dynamically based on distance:
   * Formula: max((distance * 2 / 45 + 0.5) * 85 + 30, 115)
   * This ensures tandem fee increases with distance and has a minimum of $115
   */
  private async calculateWithZoneLookup(
    deliveryAddress: Address,
    orderWeight?: number
  ): Promise<DeliveryFeeCalculation | null> {
    try {
      // Get zone information from API
      const zoneResponse = await deliveryApi.lookupZone(deliveryAddress);

      if (!zoneResponse?.data) {
        console.warn('No zone data returned from API');
        return null;
      }

      const { zone, distance, fees } = zoneResponse.data;

      if (!fees || (!fees.trailer && !fees.tandem)) {
        console.warn('No fee information in zone lookup response');
        return null;
      }

      // Determine vehicle type based on order weight
      // Tandem trucks are required for orders over 10,000 lbs
      const vehicleType = this.determineVehicleType(orderWeight);
      const deliveryFee = vehicleType === 'trailer' ? fees.trailer : fees.tandem;

      console.log('Vehicle type determination:', {
        orderWeight,
        vehicleType,
        zone,
        distance,
        trailerFee: fees.trailer,
        tandemFee: fees.tandem,
        selectedFee: deliveryFee,
      });

      return {
        fee: deliveryFee,
        zone,
        distance,
        freeDelivery: false,
        vehicleType,
        breakdown: {
          baseFee: deliveryFee, // Zone fee is the complete fee
          distanceFee: 0, // Already included in zone fee
          zoneFee: 0, // Already included in base fee
          total: deliveryFee,
        },
      };
    } catch (error) {
      console.warn('Zone lookup failed:', error);
      return null;
    }
  }

  /**
   * Determine vehicle type based on order weight
   *
   * Vehicle capacity:
   * - Trailer: Up to 10,000 lbs (standard loads)
   * - Tandem: Over 10,000 lbs (heavy loads)
   *
   * Common materials and weights:
   * - Mulch: ~800-1,000 lbs per cubic yard
   * - Topsoil: ~2,000-2,200 lbs per cubic yard
   * - River rock: ~2,500-3,000 lbs per cubic yard
   * - Gravel: ~2,700-3,000 lbs per cubic yard
   */
  private determineVehicleType(orderWeight?: number): 'trailer' | 'tandem' {
    if (!orderWeight || orderWeight === 0) {
      // Default to trailer if weight not specified
      return 'trailer';
    }

    // Tandem truck required for loads over 10,000 lbs
    if (orderWeight > this.TANDEM_WEIGHT_THRESHOLD) {
      return 'tandem';
    }

    return 'trailer';
  }

  /**
   * Get default delivery fee when APIs are unavailable
   */
  private getDefaultDeliveryFee(): DeliveryFeeCalculation {
    return {
      fee: this.BASE_FEE,
      freeDelivery: false,
      breakdown: {
        baseFee: this.BASE_FEE,
        distanceFee: 0,
        zoneFee: 0,
        total: this.BASE_FEE,
      },
    };
  }

  /**
   * Check if address qualifies for free delivery
   */
  async checkFreeDelivery(
    deliveryAddress: Address,
    orderSubtotal: number
  ): Promise<boolean> {
    if (orderSubtotal >= this.FREE_DELIVERY_THRESHOLD) {
      return true;
    }

    // Check if address is in a free delivery zone
    try {
      const zoneResponse = await deliveryApi.lookupZone(deliveryAddress);
      const zone = zoneResponse.data.zone;

      // Example: Zone 1 always gets free delivery
      return zone?.toLowerCase() === 'zone-1';
    } catch {
      return false;
    }
  }

  /**
   * Get delivery estimate (fee + tax)
   */
  async getDeliveryEstimate(
    deliveryAddress: Address,
    orderSubtotal: number
  ): Promise<{
    deliveryFee: number;
    freeDelivery: boolean;
    zone?: string;
    distance?: number;
  }> {
    const calculation = await this.calculateDeliveryFee(deliveryAddress, orderSubtotal);

    return {
      deliveryFee: calculation.fee,
      freeDelivery: calculation.freeDelivery,
      zone: calculation.zone,
      distance: calculation.distance,
    };
  }
}

// Export singleton instance
export const deliveryCalculator = new DeliveryCalculatorService();
