// Core types for the POS system

export type OrderType = 'INVOICE' | 'ORDER' | 'ESTIMATE';
export type OrderStatus = 'DRAFT' | 'ESTIMATE' | 'CONFIRMED' | 'SCHEDULED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'AUTHORIZED' | 'PAID' | 'FAILED' | 'REFUNDED';
export type PaymentMethodType = 'card_on_file' | 'cash' | 'check' | 'clover_terminal';

export type PriceBook = 'retail' | 'contractor';

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  addresses?: Address[];
  hasCardOnFile?: boolean;
  savedPaymentMethods?: SavedCard[];
  houseAccount?: HouseAccount;
  priceBook?: PriceBook; // Defaults to 'retail'
  // Tax exemption
  isTaxExempt?: boolean;
  taxExemptCertificate?: {
    number: string;
    expirationDate: string;
    issuingState: string;
  };
  // Commercial setup
  commercialSetup?: CommercialSetup;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface HouseAccount {
  id: string;
  clientId: string;
  balance: number; // Current balance (negative = owes money)
  creditLimit: number; // Maximum credit allowed
  availableCredit: number; // creditLimit - abs(balance)
  terms: 'net_15' | 'net_30' | 'net_60' | 'net_90' | 'due_on_receipt';
  status: 'active' | 'suspended' | 'closed';
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HouseAccountTransaction {
  id: string;
  accountId: string;
  type: 'charge' | 'payment' | 'credit' | 'adjustment';
  amount: number;
  balanceAfter: number;
  description: string;
  orderId?: string;
  referenceNumber?: string;
  createdBy?: string;
  createdAt: string;
}

export interface AccountStatement {
  id: string;
  accountId: string;
  clientId: string;
  period: string; // e.g., "2025-01" for January 2025
  startDate: string;
  endDate: string;
  openingBalance: number;
  closingBalance: number;
  totalCharges: number;
  totalPayments: number;
  transactions: HouseAccountTransaction[];
  dueDate?: string;
  sentDate?: string;
  sentMethod?: 'email' | 'print' | 'portal';
  status: 'draft' | 'sent' | 'viewed' | 'paid';
  pdfUrl?: string;
  createdAt: string;
}

export interface StatementSettings {
  autoSend: boolean;
  sendDay: number; // Day of month (1-31)
  emailTemplate?: string;
  ccEmails?: string[];
  includeAgingSummary: boolean;
  includePaymentInstructions: boolean;
  customMessage?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  latitude?: number;
  longitude?: number;
}

export interface SavedCard {
  id: string;
  last4: string;
  brand: 'visa' | 'mastercard' | 'amex' | 'discover';
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  parentCategoryId?: string; // For subcategories
  sortOrder?: number;
  isActive: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  contractorPrice: number; // Base contractor price
  retailPrice?: number; // Base retail price
  // Additional price books for commercial/special customers
  priceBooks?: Record<string, number>; // { 'commercial': 45.00, 'preferred': 40.00 }
  priceType: 'fixed' | 'per_unit'; // 'per_unit' for materials sold by TON or YARD
  unit?: 'ton' | 'yard' | 'each'; // 'ton' for weight-based, 'yard' for volume-based (cubic yard), 'each' for fixed items
  categoryId?: string; // Reference to ProductCategory
  category?: string; // Category name for backwards compatibility
  inStock: boolean;
  // Inventory settings
  trackInventory?: boolean; // Whether to track inventory for this product
  minStockLevel?: number; // Minimum stock level before reorder
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface LineItem {
  id?: string;
  productId?: string; // Reference to Product from Invoiss
  name: string;
  description?: string;
  quantity: number; // Number of units (tons, yards, or items)
  price: number; // Price per unit (calculated based on priceBook or override)
  originalPrice?: number; // Original price before override
  priceOverride?: {
    overriddenBy: string; // Employee ID who approved override
    reason: 'manager_approval' | 'special_customer' | 'damaged_goods' | 'promotion' | 'other';
    reasonNote?: string; // Free-text explanation
    overriddenAt: string; // Timestamp
  };
  priceType?: 'fixed' | 'per_unit';
  unit?: 'ton' | 'yard' | 'each';
  metadata?: {
    // Tare and Gross weight: ONLY for TON-based materials (unit === 'ton')
    // Products sold by YARD (cubic yard) do NOT have weight measurements
    // Examples: Mulch, Screen Top Soil, Planters Mix, Dairy Compost, Class 1 Compost
    grossWeight?: number; // Total weight including container (TON materials only)
    tareWeight?: number; // Container weight (TON materials only)
    netWeight?: number; // Actual product weight (grossWeight - tareWeight, TON materials only)
    contractorPrice?: number;
    retailPrice?: number;
  };
}

export interface Order {
  id: string;
  number: string;
  type: OrderType; // INVOICE = in-store, ORDER = delivery
  client: Client;
  lineItems: LineItem[];
  subTotal: number;
  taxTotal: number;
  grandTotal: number;
  paidTotal: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  serviceDate?: string;
  dueDate?: string;
  metadata?: {
    orderType?: 'in_store' | 'delivery';
    delivery?: DeliveryInfo;
    payment?: PaymentInfo;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryInfo {
  scheduledDate: string;
  timeSlot: string;
  address: Address;
  deliveryFee: number;
  status?: OrderStatus;
  photoUrl?: string;
  notes?: string;
  driverId?: string;
  routeId?: string;
}

export interface PaymentInfo {
  method: PaymentMethodType;
  cardToken?: string;
  last4?: string;
  chargeDate?: string;
  chargedAt?: string;
}

export interface Driver {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  vehicleType?: string;
  isActive: boolean;
}

export interface DeliveryRoute {
  id: string;
  driverId: string;
  driverName: string;
  deliveryDate: string;
  timeWindow: 'morning' | 'afternoon' | 'evening';
  deliveries: Order[];
  totalStops: number;
  estimatedDuration: string;
  optimizedOrder: string[];
  status: 'assigned' | 'in_progress' | 'completed';
}

export interface WeightCalculation {
  grossWeight: number;
  tareWeight: number;
  netWeight: number;
  pricePerUnit: number;
  totalPrice: number;
  unit: 'lbs' | 'kg' | 'oz';
}

export type EmployeeRole = 'cashier' | 'manager' | 'admin';

export interface Employee {
  id: string;
  employeeId: string; // Used for login (e.g., "1001", "2045")
  name: string;
  role: EmployeeRole;
  pin?: string; // Optional numeric PIN for manager/admin roles
  permissions: EmployeePermissions;
  isActive: boolean;
  createdAt: string;
}

export interface EmployeePermissions {
  // Order permissions
  createOrders: boolean;
  viewOrders: boolean;
  editOrders: boolean;
  deleteOrders: boolean;
  applyDiscounts: boolean;
  overridePrices: boolean;
  processRefunds: boolean;
  createEstimates: boolean;
  approveEstimates: boolean; // Convert estimate to order

  // Client permissions
  createClients: boolean;
  viewClients: boolean;
  editClients: boolean;
  deleteClients: boolean;
  setDefaultClient: boolean; // Admin only

  // Product permissions
  createProducts: boolean;
  editProducts: boolean;
  viewProducts: boolean;
  manageProducts: boolean; // Edit base prices/catalog

  // House account permissions
  createHouseAccounts: boolean;
  viewHouseAccounts: boolean;
  editHouseAccounts: boolean;
  chargeHouseAccounts: boolean;
  processHouseAccountPayments: boolean;

  // Inventory permissions
  viewInventory: boolean;
  adjustInventory: boolean;
  transferInventory: boolean;

  // Purchase permissions
  createPurchaseOrders: boolean;
  viewPurchaseOrders: boolean;
  approvePurchaseOrders: boolean;
  receivePurchaseOrders: boolean;
  manageVendors: boolean;

  // Location permissions
  viewLocations: boolean;
  manageLocations: boolean; // Admin only

  // System permissions
  viewReports: boolean;
  manageEmployees: boolean; // Admin only
  accessSettings: boolean; // Admin only
}

// Default permission sets by role
export const DEFAULT_PERMISSIONS: Record<EmployeeRole, EmployeePermissions> = {
  cashier: {
    createOrders: true,
    viewOrders: true,
    editOrders: false,
    deleteOrders: false,
    applyDiscounts: false,
    overridePrices: false,
    processRefunds: false,
    createEstimates: true,
    approveEstimates: false,
    createClients: true,
    viewClients: true,
    editClients: false,
    deleteClients: false,
    setDefaultClient: false,
    createProducts: false,
    editProducts: false,
    viewProducts: true,
    manageProducts: false,
    createHouseAccounts: false,
    viewHouseAccounts: true,
    editHouseAccounts: false,
    chargeHouseAccounts: true,
    processHouseAccountPayments: false,
    viewInventory: true,
    adjustInventory: false,
    transferInventory: false,
    createPurchaseOrders: false,
    viewPurchaseOrders: false,
    approvePurchaseOrders: false,
    receivePurchaseOrders: false,
    manageVendors: false,
    viewLocations: true,
    manageLocations: false,
    viewReports: false,
    manageEmployees: false,
    accessSettings: false,
  },
  manager: {
    createOrders: true,
    viewOrders: true,
    editOrders: true,
    deleteOrders: true,
    applyDiscounts: true,
    overridePrices: true,
    processRefunds: true,
    createEstimates: true,
    approveEstimates: true,
    createClients: true,
    viewClients: true,
    editClients: true,
    deleteClients: false,
    setDefaultClient: false,
    createProducts: true,
    editProducts: true,
    viewProducts: true,
    manageProducts: false,
    createHouseAccounts: true,
    viewHouseAccounts: true,
    editHouseAccounts: true,
    chargeHouseAccounts: true,
    processHouseAccountPayments: true,
    viewInventory: true,
    adjustInventory: true,
    transferInventory: true,
    createPurchaseOrders: true,
    viewPurchaseOrders: true,
    approvePurchaseOrders: true,
    receivePurchaseOrders: true,
    manageVendors: true,
    viewLocations: true,
    manageLocations: false,
    viewReports: true,
    manageEmployees: false,
    accessSettings: false,
  },
  admin: {
    createOrders: true,
    viewOrders: true,
    editOrders: true,
    deleteOrders: true,
    applyDiscounts: true,
    overridePrices: true,
    processRefunds: true,
    createEstimates: true,
    approveEstimates: true,
    createClients: true,
    viewClients: true,
    editClients: true,
    deleteClients: true,
    setDefaultClient: true,
    createProducts: true,
    editProducts: true,
    viewProducts: true,
    manageProducts: true,
    createHouseAccounts: true,
    viewHouseAccounts: true,
    editHouseAccounts: true,
    chargeHouseAccounts: true,
    processHouseAccountPayments: true,
    viewInventory: true,
    adjustInventory: true,
    transferInventory: true,
    createPurchaseOrders: true,
    viewPurchaseOrders: true,
    approvePurchaseOrders: true,
    receivePurchaseOrders: true,
    manageVendors: true,
    viewLocations: true,
    manageLocations: true,
    viewReports: true,
    manageEmployees: true,
    accessSettings: true,
  },
};

// ========================================
// Location & Inventory Types
// ========================================

export interface Location {
  id: string;
  name: string;
  type: 'warehouse' | 'yard' | 'store' | 'other';
  address?: Address;
  isActive: boolean;
  isPrimary?: boolean; // Default location for operations
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  productId: string;
  locationId: string;
  quantityOnHand: number; // Current quantity at this location
  unit: 'ton' | 'yard' | 'each';
  reorderPoint?: number; // Trigger for low stock alerts
  reorderQuantity?: number; // Quantity to reorder
  costBasis?: number; // Average cost per unit
  lastCountDate?: string; // Last physical inventory count
  metadata?: Record<string, any>;
  updatedAt: string;
}

export type InventoryTransactionType = 'purchase' | 'sale' | 'transfer_in' | 'transfer_out' | 'adjustment' | 'return';

export interface InventoryTransaction {
  id: string;
  type: InventoryTransactionType;
  productId: string;
  locationId: string;
  quantity: number; // Positive for increases, negative for decreases
  unit: 'ton' | 'yard' | 'each';
  balanceAfter: number; // Quantity on hand after this transaction
  reference?: {
    type: 'order' | 'purchase_order' | 'transfer' | 'adjustment';
    id: string;
    number?: string;
  };
  reason?: string; // For adjustments
  employeeId?: string;
  createdAt: string;
}

// ========================================
// Vendor & Purchase Order Types
// ========================================

export interface Vendor {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: Address;
  paymentTerms?: 'net_15' | 'net_30' | 'net_60' | 'net_90' | 'due_on_receipt' | 'prepaid';
  accountNumber?: string; // Vendor's account number for your business
  taxId?: string; // Vendor's tax ID/EIN
  isActive: boolean;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export type PurchaseOrderStatus = 'draft' | 'submitted' | 'approved' | 'partially_received' | 'received' | 'cancelled';

export interface PurchaseOrder {
  id: string;
  number: string; // PO number (e.g., "PO-2025-001")
  vendorId: string;
  vendor: Vendor;
  locationId: string; // Where inventory will be received
  status: PurchaseOrderStatus;
  lineItems: PurchaseOrderLineItem[];
  subTotal: number;
  taxTotal: number;
  shippingCost: number;
  grandTotal: number;
  expectedDeliveryDate?: string;
  submittedDate?: string;
  approvedDate?: string;
  approvedBy?: string; // Employee ID
  receivedDate?: string; // Fully received date
  notes?: string;
  internalNotes?: string; // Not shared with vendor
  metadata?: Record<string, any>;
  createdBy: string; // Employee ID
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderLineItem {
  id?: string;
  productId: string;
  product?: Product; // Populated product info
  description?: string;
  quantityOrdered: number;
  quantityReceived: number;
  unit: 'ton' | 'yard' | 'each';
  unitCost: number; // Cost per unit from vendor
  totalCost: number; // quantityOrdered * unitCost
  receivingHistory?: {
    date: string;
    quantity: number;
    receivedBy: string; // Employee ID
    notes?: string;
  }[];
}

// ========================================
// Transfer Types
// ========================================

export type TransferStatus = 'pending' | 'approved' | 'in_transit' | 'partially_received' | 'received' | 'cancelled';

export interface Transfer {
  id: string;
  number: string; // Transfer number (e.g., "TRN-2025-001")
  fromLocationId: string;
  toLocationId: string;
  fromLocation?: Location;
  toLocation?: Location;
  status: TransferStatus;
  lineItems: TransferLineItem[];
  requestedDate: string;
  requestedBy: string; // Employee ID
  approvedDate?: string;
  approvedBy?: string; // Employee ID
  shippedDate?: string;
  driverId?: string;
  vehicleInfo?: string;
  receivedDate?: string;
  receivedBy?: string; // Employee ID
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface TransferLineItem {
  id?: string;
  productId: string;
  product?: Product;
  quantityRequested: number;
  quantityShipped: number;
  quantityReceived: number;
  unit: 'ton' | 'yard' | 'each';
  notes?: string;
}

// ========================================
// Commercial Client Types
// ========================================

export interface CommercialSetup {
  isCommercial: boolean;
  companyName?: string;
  taxId?: string; // EIN or tax ID
  billingAddress?: Address;
  creditLimit?: number;
  paymentTerms?: 'net_15' | 'net_30' | 'net_60' | 'net_90' | 'due_on_receipt';
  // Commercial-specific pricing
  commercialPriceBook?: string; // Custom price book ID
  volumeDiscounts?: {
    minQuantity: number;
    discountPercent: number;
  }[];
  preferredVendor?: boolean; // Gets best pricing
  accountManager?: string; // Employee ID
  notes?: string;
}
