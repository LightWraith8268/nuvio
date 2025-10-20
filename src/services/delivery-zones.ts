/**
 * Delivery Zone Configuration
 *
 * Defines delivery zones with distance thresholds and fees
 * Based on Windsor, CO hub location
 */

export interface DeliveryZone {
  zone: number;
  minMiles: number;
  maxMiles: number;
  trailerFee: number;
}

/**
 * Delivery zone definitions
 * Zones 1-12 with defined thresholds
 * Pattern continues beyond Zone 12: +5 miles per zone, +$15 per zone
 */
export const DELIVERY_ZONES: DeliveryZone[] = [
  { zone: 1, minMiles: 0, maxMiles: 12.00, trailerFee: 95 },
  { zone: 2, minMiles: 12.01, maxMiles: 17.00, trailerFee: 110 },
  { zone: 3, minMiles: 17.01, maxMiles: 22.00, trailerFee: 125 },
  { zone: 4, minMiles: 22.01, maxMiles: 27.00, trailerFee: 140 },
  { zone: 5, minMiles: 27.01, maxMiles: 32.00, trailerFee: 155 },
  { zone: 6, minMiles: 32.01, maxMiles: 37.00, trailerFee: 170 },
  { zone: 7, minMiles: 37.01, maxMiles: 42.00, trailerFee: 185 },
  { zone: 8, minMiles: 42.01, maxMiles: 47.00, trailerFee: 200 },
  { zone: 9, minMiles: 47.01, maxMiles: 52.00, trailerFee: 215 },
  { zone: 10, minMiles: 52.01, maxMiles: 57.00, trailerFee: 230 },
  { zone: 11, minMiles: 57.01, maxMiles: 62.00, trailerFee: 245 },
  { zone: 12, minMiles: 62.01, maxMiles: 67.00, trailerFee: 260 },
];

/**
 * Calculate trailer fee for any distance
 * Uses defined zones 1-12, then continues pattern: +5 miles per zone, +$15 per zone
 */
export function calculateTrailerFee(distance: number): { zone: number; fee: number } {
  // Check if distance falls within defined zones (1-12)
  for (const zone of DELIVERY_ZONES) {
    if (distance >= zone.minMiles && distance <= zone.maxMiles) {
      return { zone: zone.zone, fee: zone.trailerFee };
    }
  }

  // For distances beyond Zone 12, continue the pattern
  // Pattern: Each zone is 5 miles, fee increases by $15
  const MILES_PER_ZONE = 5;
  const FEE_INCREMENT = 15;
  const ZONE_12_MAX_MILES = 67.00;
  const ZONE_12_FEE = 260;

  if (distance > ZONE_12_MAX_MILES) {
    const milesAfterZone12 = distance - ZONE_12_MAX_MILES;
    const additionalZones = Math.ceil(milesAfterZone12 / MILES_PER_ZONE);
    const zone = 12 + additionalZones;
    const fee = ZONE_12_FEE + (additionalZones * FEE_INCREMENT);

    return { zone, fee };
  }

  // Fallback: default to Zone 1 (should not reach here)
  return { zone: 1, fee: 95 };
}

/**
 * Calculate tandem fee based on distance
 * Formula: ((distance × 2) ÷ 45 + 0.5) × 85 + 30
 * Minimum fee: $115
 */
export function calculateTandemFee(distance: number): number {
  const calculatedFee = ((distance * 2) / 45 + 0.5) * 85 + 30;
  return Math.max(calculatedFee, 115);
}

/**
 * Get zone information for a given distance
 */
export function getZoneForDistance(distance: number): {
  zone: number;
  minMiles: number;
  maxMiles: number;
  trailerFee: number;
  tandemFee: number;
} {
  const { zone, fee: trailerFee } = calculateTrailerFee(distance);
  const tandemFee = calculateTandemFee(distance);

  // Find zone boundaries
  let minMiles = 0;
  let maxMiles = 0;

  if (zone <= 12) {
    const zoneData = DELIVERY_ZONES[zone - 1];
    minMiles = zoneData.minMiles;
    maxMiles = zoneData.maxMiles;
  } else {
    // Calculate boundaries for zones beyond 12
    const MILES_PER_ZONE = 5;
    const ZONE_12_MAX_MILES = 67.00;
    const zonesAfter12 = zone - 12;

    minMiles = ZONE_12_MAX_MILES + ((zonesAfter12 - 1) * MILES_PER_ZONE) + 0.01;
    maxMiles = ZONE_12_MAX_MILES + (zonesAfter12 * MILES_PER_ZONE);
  }

  return {
    zone,
    minMiles,
    maxMiles,
    trailerFee,
    tandemFee,
  };
}

/**
 * Format zone information for display
 */
export function formatZoneInfo(zone: number, distance: number): string {
  const zoneInfo = getZoneForDistance(distance);
  return `Zone ${zone} (${zoneInfo.minMiles.toFixed(2)}-${zoneInfo.maxMiles.toFixed(2)} miles)`;
}

/**
 * Get all zones with their information (for display/documentation)
 */
export function getAllZones(): DeliveryZone[] {
  return DELIVERY_ZONES;
}

/**
 * Calculate total delivery cost based on distance and vehicle type
 */
export function calculateDeliveryCost(
  distance: number,
  vehicleType: 'trailer' | 'tandem'
): {
  zone: number;
  distance: number;
  trailerFee: number;
  tandemFee: number;
  selectedFee: number;
  vehicleType: 'trailer' | 'tandem';
} {
  const { zone, trailerFee, tandemFee } = getZoneForDistance(distance);
  const selectedFee = vehicleType === 'trailer' ? trailerFee : tandemFee;

  return {
    zone,
    distance,
    trailerFee,
    tandemFee,
    selectedFee,
    vehicleType,
  };
}
