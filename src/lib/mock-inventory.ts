/**
 * Mock Inventory System
 *
 * Provides in-memory inventory tracking per location with:
 * - Multi-location inventory management
 * - Transaction history
 * - Stock level tracking
 * - Transfer between locations
 * - Low stock alerts
 * - Automatic updates from orders/purchases
 */

import type {
  Location,
  InventoryItem,
  InventoryTransaction,
  InventoryTransactionType,
  Product,
} from '@/types';

// Mock data stores
let locations: Location[] = [];
let inventoryItems: InventoryItem[] = [];
let inventoryTransactions: InventoryTransaction[] = [];

// Initialize with default locations and inventory
export function initializeMockInventory(products: Product[]) {
  // Create default locations if empty
  if (locations.length === 0) {
    locations = [
      {
        id: 'loc-1',
        name: 'Main Warehouse',
        type: 'warehouse',
        isActive: true,
        isPrimary: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'loc-2',
        name: 'North Yard',
        type: 'yard',
        isActive: true,
        isPrimary: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'loc-3',
        name: 'South Yard',
        type: 'yard',
        isActive: true,
        isPrimary: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'loc-4',
        name: 'Retail Store',
        type: 'store',
        isActive: true,
        isPrimary: false,
        createdAt: new Date().toISOString(),
      },
    ];
  }

  // Create initial inventory items for products that track inventory
  if (inventoryItems.length === 0 && products.length > 0) {
    products.forEach((product) => {
      if (product.trackInventory) {
        // Add inventory at each location with random starting quantities
        locations.forEach((location) => {
          const randomQuantity = Math.floor(Math.random() * 500) + 100;
          const item: InventoryItem = {
            id: `inv-${product.id}-${location.id}`,
            productId: product.id,
            locationId: location.id,
            quantityOnHand: randomQuantity,
            unit: product.unit || 'each',
            reorderPoint: product.minStockLevel || 50,
            reorderQuantity: 200,
            costBasis: product.contractorPrice * 0.7, // Assume 30% markup
            lastCountDate: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          inventoryItems.push(item);

          // Create initial transaction
          const transaction: InventoryTransaction = {
            id: `txn-${Date.now()}-${product.id}-${location.id}`,
            type: 'adjustment',
            productId: product.id,
            locationId: location.id,
            quantity: randomQuantity,
            unit: item.unit,
            balanceAfter: randomQuantity,
            reason: 'Initial inventory setup',
            employeeId: 'system',
            createdAt: new Date().toISOString(),
          };
          inventoryTransactions.push(transaction);
        });
      }
    });
  }
}

// Get all locations
export function getLocations(): Location[] {
  return locations;
}

// Get active locations
export function getActiveLocations(): Location[] {
  return locations.filter((loc) => loc.isActive);
}

// Get primary location
export function getPrimaryLocation(): Location | null {
  return locations.find((loc) => loc.isPrimary) || null;
}

// Get location by ID
export function getLocation(id: string): Location | null {
  return locations.find((loc) => loc.id === id) || null;
}

// Get inventory for a product at a specific location
export function getInventoryItem(productId: string, locationId: string): InventoryItem | null {
  return inventoryItems.find(
    (item) => item.productId === productId && item.locationId === locationId
  ) || null;
}

// Get all inventory for a product across all locations
export function getProductInventory(productId: string): InventoryItem[] {
  return inventoryItems.filter((item) => item.productId === productId);
}

// Get all inventory at a location
export function getLocationInventory(locationId: string): InventoryItem[] {
  return inventoryItems.filter((item) => item.locationId === locationId);
}

// Get total quantity for a product across all locations
export function getTotalProductQuantity(productId: string): number {
  return inventoryItems
    .filter((item) => item.productId === productId)
    .reduce((total, item) => total + item.quantityOnHand, 0);
}

// Get low stock items (below reorder point)
export function getLowStockItems(locationId?: string): InventoryItem[] {
  let items = inventoryItems;

  if (locationId) {
    items = items.filter((item) => item.locationId === locationId);
  }

  return items.filter((item) => {
    const reorderPoint = item.reorderPoint || 0;
    return item.quantityOnHand <= reorderPoint;
  });
}

// Create inventory transaction and update quantity
function createTransaction(
  type: InventoryTransactionType,
  productId: string,
  locationId: string,
  quantity: number,
  unit: 'ton' | 'yard' | 'each',
  reference?: { type: string; id: string; number?: string },
  reason?: string,
  employeeId?: string
): InventoryTransaction {
  // Get or create inventory item
  let item = getInventoryItem(productId, locationId);

  if (!item) {
    // Create new inventory item if it doesn't exist
    item = {
      id: `inv-${productId}-${locationId}`,
      productId,
      locationId,
      quantityOnHand: 0,
      unit,
      updatedAt: new Date().toISOString(),
    };
    inventoryItems.push(item);
  }

  // Update quantity
  item.quantityOnHand += quantity;
  item.updatedAt = new Date().toISOString();

  // Create transaction record
  const transaction: InventoryTransaction = {
    id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    productId,
    locationId,
    quantity,
    unit,
    balanceAfter: item.quantityOnHand,
    reference,
    reason,
    employeeId,
    createdAt: new Date().toISOString(),
  };

  inventoryTransactions.push(transaction);
  return transaction;
}

// Record a sale (decrease inventory)
export function recordSale(
  productId: string,
  locationId: string,
  quantity: number,
  unit: 'ton' | 'yard' | 'each',
  orderId: string,
  orderNumber?: string
): InventoryTransaction {
  return createTransaction(
    'sale',
    productId,
    locationId,
    -quantity, // Negative for decrease
    unit,
    { type: 'order', id: orderId, number: orderNumber }
  );
}

// Record a purchase (increase inventory)
export function recordPurchase(
  productId: string,
  locationId: string,
  quantity: number,
  unit: 'ton' | 'yard' | 'each',
  purchaseOrderId: string,
  purchaseOrderNumber?: string
): InventoryTransaction {
  return createTransaction(
    'purchase',
    productId,
    locationId,
    quantity, // Positive for increase
    unit,
    { type: 'purchase_order', id: purchaseOrderId, number: purchaseOrderNumber }
  );
}

// Record an adjustment (manual change)
export function recordAdjustment(
  productId: string,
  locationId: string,
  quantity: number,
  unit: 'ton' | 'yard' | 'each',
  reason: string,
  employeeId: string
): InventoryTransaction {
  return createTransaction(
    'adjustment',
    productId,
    locationId,
    quantity, // Can be positive or negative
    unit,
    { type: 'adjustment', id: `adj-${Date.now()}` },
    reason,
    employeeId
  );
}

// Transfer inventory between locations
export function transferInventory(
  productId: string,
  fromLocationId: string,
  toLocationId: string,
  quantity: number,
  unit: 'ton' | 'yard' | 'each',
  employeeId: string
): { outTransaction: InventoryTransaction; inTransaction: InventoryTransaction } {
  const transferId = `transfer-${Date.now()}`;
  const transferNumber = `TRF-${Date.now().toString().slice(-6)}`;

  // Decrease from source location
  const outTransaction = createTransaction(
    'transfer_out',
    productId,
    fromLocationId,
    -quantity,
    unit,
    { type: 'transfer', id: transferId, number: transferNumber },
    `Transfer to ${getLocation(toLocationId)?.name || toLocationId}`,
    employeeId
  );

  // Increase at destination location
  const inTransaction = createTransaction(
    'transfer_in',
    productId,
    toLocationId,
    quantity,
    unit,
    { type: 'transfer', id: transferId, number: transferNumber },
    `Transfer from ${getLocation(fromLocationId)?.name || fromLocationId}`,
    employeeId
  );

  return { outTransaction, inTransaction };
}

// Get transaction history for a product
export function getProductTransactions(
  productId: string,
  locationId?: string,
  limit?: number
): InventoryTransaction[] {
  let transactions = inventoryTransactions.filter((txn) => txn.productId === productId);

  if (locationId) {
    transactions = transactions.filter((txn) => txn.locationId === locationId);
  }

  // Sort by date descending (newest first)
  transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (limit) {
    transactions = transactions.slice(0, limit);
  }

  return transactions;
}

// Get all transactions at a location
export function getLocationTransactions(
  locationId: string,
  limit?: number
): InventoryTransaction[] {
  let transactions = inventoryTransactions.filter((txn) => txn.locationId === locationId);

  // Sort by date descending
  transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (limit) {
    transactions = transactions.slice(0, limit);
  }

  return transactions;
}

// Get inventory value at a location
export function getLocationInventoryValue(locationId: string): number {
  return inventoryItems
    .filter((item) => item.locationId === locationId)
    .reduce((total, item) => {
      const costBasis = item.costBasis || 0;
      return total + (item.quantityOnHand * costBasis);
    }, 0);
}

// Get total inventory value across all locations
export function getTotalInventoryValue(): number {
  return inventoryItems.reduce((total, item) => {
    const costBasis = item.costBasis || 0;
    return total + (item.quantityOnHand * costBasis);
  }, 0);
}

// Export for testing/debugging
export function getInventoryData() {
  return {
    locations,
    inventoryItems,
    inventoryTransactions,
  };
}

// Reset inventory (for testing)
export function resetInventory() {
  locations = [];
  inventoryItems = [];
  inventoryTransactions = [];
}
