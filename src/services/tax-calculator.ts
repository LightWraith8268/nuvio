/**
 * Tax Calculator Service
 *
 * Calculates sales tax based on delivery address using various tax rate providers.
 * Can integrate with external tax APIs or use local tax rate databases.
 */

import type { Address, Client } from '@/types';
import { quoteApi } from './api-clients/calendar-api';

export interface TaxRate {
  rate: number; // e.g., 0.08 for 8%
  state: string;
  county?: string;
  city?: string;
  district?: string;
  combinedRate: number; // Total combined rate
  breakdown: {
    state: number;
    county?: number;
    city?: number;
    district?: number;
  };
}

export interface TaxCalculation {
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  total: number;
  isTaxExempt?: boolean;
  exemptReason?: string;
  breakdown: TaxRate['breakdown'];
}

/**
 * Tax Calculator Service
 *
 * This service can be connected to:
 * 1. External Tax API (TaxJar, Avalara, etc.) - for real-time rates
 * 2. Local tax database - for offline calculation
 * 3. Custom tax service from another project
 */
class TaxCalculatorService {
  private taxApiUrl: string | null = null;
  private taxApiKey: string | null = null;

  constructor() {
    // Check for external tax API configuration
    this.taxApiUrl = import.meta.env.VITE_TAX_API_URL || null;
    this.taxApiKey = import.meta.env.VITE_TAX_API_KEY || null;
  }

  /**
   * Calculate tax for a given address and amount
   * @param address - Delivery/billing address
   * @param subtotal - Order subtotal before tax
   * @param client - Optional client to check for tax exemption
   */
  async calculateTax(address: Address, subtotal: number, client?: Client): Promise<TaxCalculation> {
    try {
      // Check if client is tax exempt
      if (client?.isTaxExempt) {
        console.log('✓ Client is tax exempt:', {
          clientId: client.id,
          clientName: client.name,
          certificate: client.taxExemptCertificate?.number,
        });

        return {
          subtotal,
          taxAmount: 0,
          taxRate: 0,
          total: subtotal,
          isTaxExempt: true,
          exemptReason: client.taxExemptCertificate?.number
            ? `Tax Exempt (Certificate: ${client.taxExemptCertificate.number})`
            : 'Tax Exempt',
          breakdown: {
            state: 0,
          },
        };
      }

      // Try Supabase tax-lookup API first
      try {
        const response = await quoteApi.lookupTax(address, subtotal);
        const { taxAmount, taxRate, total } = response.data;

        return {
          subtotal,
          taxAmount,
          taxRate,
          total,
          breakdown: {
            state: taxRate, // API provides combined rate
          },
        };
      } catch (apiError) {
        console.warn('Supabase tax-lookup failed, trying fallback:', apiError);
      }

      // Try external API if configured
      if (this.taxApiUrl && this.taxApiKey) {
        return await this.calculateTaxFromAPI(address, subtotal);
      }

      // Fall back to local calculation
      return await this.calculateTaxLocally(address, subtotal);
    } catch (error) {
      console.error('Tax calculation failed:', error);
      // Return default tax rate as fallback
      return this.getDefaultTaxCalculation(subtotal);
    }
  }

  /**
   * Get tax rate for an address (without calculating total)
   */
  async getTaxRate(address: Address): Promise<TaxRate> {
    try {
      if (this.taxApiUrl && this.taxApiKey) {
        return await this.getTaxRateFromAPI(address);
      }

      return await this.getTaxRateLocally(address);
    } catch (error) {
      console.error('Tax rate lookup failed:', error);
      return this.getDefaultTaxRate(address.state);
    }
  }

  /**
   * Calculate tax using external API (e.g., TaxJar, Avalara)
   */
  private async calculateTaxFromAPI(address: Address, subtotal: number): Promise<TaxCalculation> {
    const response = await fetch(`${this.taxApiUrl}/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.taxApiKey}`,
      },
      body: JSON.stringify({
        to_address: {
          street: address.street,
          city: address.city,
          state: address.state,
          zip: address.zip,
        },
        amount: subtotal,
      }),
    });

    if (!response.ok) {
      throw new Error('Tax API request failed');
    }

    const data = await response.json();

    return {
      subtotal,
      taxAmount: data.tax_amount || subtotal * data.rate,
      taxRate: data.rate,
      total: subtotal + (data.tax_amount || subtotal * data.rate),
      breakdown: data.breakdown || {
        state: data.rate,
      },
    };
  }

  /**
   * Get tax rate from external API
   */
  private async getTaxRateFromAPI(address: Address): Promise<TaxRate> {
    const response = await fetch(`${this.taxApiUrl}/rates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.taxApiKey}`,
      },
      body: JSON.stringify({
        street: address.street,
        city: address.city,
        state: address.state,
        zip: address.zip,
      }),
    });

    if (!response.ok) {
      throw new Error('Tax rate API request failed');
    }

    const data = await response.json();

    return {
      rate: data.rate,
      state: address.state,
      county: data.county,
      city: address.city,
      district: data.district,
      combinedRate: data.combined_rate || data.rate,
      breakdown: data.breakdown || {
        state: data.rate,
      },
    };
  }

  /**
   * Calculate tax using local tax rate database
   * This uses state-level rates as a starting point
   */
  private async calculateTaxLocally(address: Address, subtotal: number): Promise<TaxCalculation> {
    const taxRate = await this.getTaxRateLocally(address);
    const taxAmount = subtotal * taxRate.combinedRate;

    return {
      subtotal,
      taxAmount,
      taxRate: taxRate.combinedRate,
      total: subtotal + taxAmount,
      breakdown: taxRate.breakdown,
    };
  }

  /**
   * Get tax rate from local database
   *
   * TODO: This can be enhanced by:
   * 1. Loading tax rates from a local JSON file
   * 2. Connecting to a local SQLite database
   * 3. Importing tax data from another project
   */
  private async getTaxRateLocally(address: Address): Promise<TaxRate> {
    // State tax rates (2025 approximate rates)
    const stateTaxRates: Record<string, number> = {
      'AL': 0.04, // Alabama
      'AK': 0.00, // Alaska (no state sales tax)
      'AZ': 0.056, // Arizona
      'AR': 0.065, // Arkansas
      'CA': 0.0725, // California
      'CO': 0.029, // Colorado
      'CT': 0.0635, // Connecticut
      'DE': 0.00, // Delaware (no sales tax)
      'FL': 0.06, // Florida
      'GA': 0.04, // Georgia
      'HI': 0.04, // Hawaii
      'ID': 0.06, // Idaho
      'IL': 0.0625, // Illinois
      'IN': 0.07, // Indiana
      'IA': 0.06, // Iowa
      'KS': 0.065, // Kansas
      'KY': 0.06, // Kentucky
      'LA': 0.0445, // Louisiana
      'ME': 0.055, // Maine
      'MD': 0.06, // Maryland
      'MA': 0.0625, // Massachusetts
      'MI': 0.06, // Michigan
      'MN': 0.06875, // Minnesota
      'MS': 0.07, // Mississippi
      'MO': 0.04225, // Missouri
      'MT': 0.00, // Montana (no sales tax)
      'NE': 0.055, // Nebraska
      'NV': 0.0685, // Nevada
      'NH': 0.00, // New Hampshire (no sales tax)
      'NJ': 0.06625, // New Jersey
      'NM': 0.05125, // New Mexico
      'NY': 0.04, // New York
      'NC': 0.0475, // North Carolina
      'ND': 0.05, // North Dakota
      'OH': 0.0575, // Ohio
      'OK': 0.045, // Oklahoma
      'OR': 0.00, // Oregon (no sales tax)
      'PA': 0.06, // Pennsylvania
      'RI': 0.07, // Rhode Island
      'SC': 0.06, // South Carolina
      'SD': 0.045, // South Dakota
      'TN': 0.07, // Tennessee
      'TX': 0.0625, // Texas
      'UT': 0.0485, // Utah
      'VT': 0.06, // Vermont
      'VA': 0.053, // Virginia
      'WA': 0.065, // Washington
      'WV': 0.06, // West Virginia
      'WI': 0.05, // Wisconsin
      'WY': 0.04, // Wyoming
      'DC': 0.06, // Washington DC
    };

    const stateRate = stateTaxRates[address.state.toUpperCase()] || 0.08; // Default 8% if unknown

    // In a real implementation, you would also look up:
    // - County tax rates
    // - City tax rates
    // - Special district rates
    // These can be loaded from a local database or imported from another project

    return {
      rate: stateRate,
      state: address.state,
      city: address.city,
      combinedRate: stateRate, // Would include county + city + district
      breakdown: {
        state: stateRate,
        // county: 0,
        // city: 0,
        // district: 0,
      },
    };
  }

  /**
   * Get default tax rate (used as fallback)
   */
  private getDefaultTaxRate(state: string): TaxRate {
    return {
      rate: 0.08,
      state,
      combinedRate: 0.08,
      breakdown: {
        state: 0.08,
      },
    };
  }

  /**
   * Get default tax calculation (used as fallback)
   */
  private getDefaultTaxCalculation(subtotal: number): TaxCalculation {
    const taxRate = 0.08;
    const taxAmount = subtotal * taxRate;

    return {
      subtotal,
      taxAmount,
      taxRate,
      total: subtotal + taxAmount,
      breakdown: {
        state: taxRate,
      },
    };
  }

  /**
   * Validate an address for tax calculation
   */
  async validateAddress(address: Address): Promise<{
    valid: boolean;
    normalized?: Address;
    error?: string;
  }> {
    // Basic validation
    if (!address.street || !address.city || !address.state || !address.zip) {
      return {
        valid: false,
        error: 'Incomplete address',
      };
    }

    // TODO: Can integrate with address validation API
    // - USPS Address Validation
    // - Google Maps Geocoding API
    // - Custom address validation from another project

    return {
      valid: true,
      normalized: address,
    };
  }
}

// Export singleton instance
export const taxCalculator = new TaxCalculatorService();
