/**
 * Delivery Fee Calculator Service
 *
 * Calculates delivery fees using:
 * 1. Supabase Edge Functions (zone-lookup API) - Primary method
 * 2. Local zone calculation - Fallback method
 *
 * Zone-based pricing:
 * - Zones 1-12: Fixed trailer fees ($95-$260)
 * - Pattern continues beyond Zone 12: +5 miles per zone, +$15 per zone
 * - Tandem fees: Calculated dynamically based on distance
 */

import { deliveryApi, quoteApi } from './api-clients/calendar-api';
import { calculateTrailerFee, calculateTandemFee, calculateDeliveryCost } from './delivery-zones';
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

  private readonly BASE_FEE = 10; // Base delivery fee (fallback only)

  /**
   * Calculate delivery fee for an order
   *
   * Vehicle type is determined by material-specific thresholds (handled at order level):
   * - TON materials: Over 7 tons = Tandem
   * - Soil/Compost (YARD): Over 10 cubic yards = Tandem
   * - Mulch (YARD): Over 12 cubic yards = Tandem
   */
  async calculateDeliveryFee(
    deliveryAddress: Address,
    orderSubtotal: number,
    orderWeight?: number, // Not used - kept for API compatibility
    orderLineItems?: any[] // Not used here - vehicle type determined at order level
  ): Promise<DeliveryFeeCalculation> {
    try {
      // Try to use the full calculate-quote API first (most comprehensive)
      const quote = await this.calculateQuote(deliveryAddress, orderSubtotal);
      if (quote) {
        return quote;
      }

      // Fallback: Use zone-lookup (vehicle type determined separately)
      const fallback = await this.calculateWithZoneLookup(deliveryAddress);
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
   * Calculate using zone-lookup API (Primary method)
   * Returns both trailer and tandem fees
   * Vehicle type is determined at the order level based on actual quantities
   */
  private async calculateWithZoneLookup(
    deliveryAddress: Address
  ): Promise<DeliveryFeeCalculation | null> {
    try {
      // Get zone information from API
      const zoneResponse = await deliveryApi.lookupZone(deliveryAddress);

      if (zoneResponse?.data && zoneResponse.data.fees) {
        const { zone, distance, fees } = zoneResponse.data;

        // Return trailer fee by default
        // Actual vehicle type and fee selection happens at order creation
        console.log('✓ Zone lookup API successful:', {
          zone,
          distance,
          trailerFee: fees.trailer,
          tandemFee: fees.tandem,
        });

        return {
          fee: fees.trailer, // Default to trailer
          zone,
          distance,
          freeDelivery: false,
          vehicleType: 'trailer', // Default, will be overridden at order level
          breakdown: {
            baseFee: fees.trailer,
            distanceFee: 0,
            zoneFee: 0,
            total: fees.trailer,
          },
        };
      }

      // API didn't return valid data, fall back to local calculation
      console.warn('Zone lookup API returned invalid data, using fallback calculation');
      return this.calculateWithLocalZones(deliveryAddress);
    } catch (error) {
      console.warn('Zone lookup API failed, using fallback calculation:', error);
      return this.calculateWithLocalZones(deliveryAddress);
    }
  }

  /**
   * Calculate using local zone configuration (Fallback method)
   * Uses hardcoded zone definitions and fee structure
   */
  private async calculateWithLocalZones(
    deliveryAddress: Address
  ): Promise<DeliveryFeeCalculation | null> {
    try {
      // Calculate distance using API
      const distanceResponse = await deliveryApi.calculateDistance(
        this.storeAddress,
        deliveryAddress
      );

      if (!distanceResponse?.data?.distance) {
        console.warn('Unable to calculate distance for local zone lookup');
        return null;
      }

      const distance = distanceResponse.data.distance;

      // Calculate fees using local zone configuration (trailer by default)
      const deliveryCost = calculateDeliveryCost(distance, 'trailer');

      console.log('✓ Local zone calculation:', {
        zone: deliveryCost.zone,
        distance: deliveryCost.distance,
        trailerFee: deliveryCost.trailerFee,
        tandemFee: deliveryCost.tandemFee,
      });

      return {
        fee: deliveryCost.trailerFee, // Default to trailer
        zone: deliveryCost.zone,
        distance: deliveryCost.distance,
        freeDelivery: false,
        vehicleType: 'trailer', // Default, will be overridden at order level
        breakdown: {
          baseFee: deliveryCost.trailerFee,
          distanceFee: 0,
          zoneFee: 0,
          total: deliveryCost.trailerFee,
        },
      };
    } catch (error) {
      console.warn('Local zone calculation failed:', error);
      return null;
    }
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
   * Note: Free delivery is not currently offered
   */
  async checkFreeDelivery(
    deliveryAddress: Address,
    orderSubtotal: number
  ): Promise<boolean> {
    // Free delivery is not available
    return false;
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
