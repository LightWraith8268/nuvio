// Core types for the POS system

export type OrderType = 'INVOICE' | 'ORDER';
export type OrderStatus = 'DRAFT' | 'CONFIRMED' | 'SCHEDULED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
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

export interface Product {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  contractorPrice: number; // From Invoiss
  retailPrice?: number; // Custom added by us
  priceType: 'fixed' | 'per_weight';
  weightUnit?: 'lbs' | 'kg' | 'oz';
  category?: string;
  inStock: boolean;
  metadata?: Record<string, any>;
}

export interface LineItem {
  id?: string;
  productId?: string; // Reference to Product from Invoiss
  name: string;
  description?: string;
  quantity: number;
  price: number; // Calculated based on priceBook
  priceType?: 'fixed' | 'per_weight';
  weight?: number;
  weightUnit?: 'lbs' | 'kg' | 'oz';
  metadata?: {
    grossWeight?: number;
    tareWeight?: number;
    netWeight?: number;
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

  // House account permissions
  createHouseAccounts: boolean;
  viewHouseAccounts: boolean;
  editHouseAccounts: boolean;
  chargeHouseAccounts: boolean;
  processHouseAccountPayments: boolean;

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
    createClients: true,
    viewClients: true,
    editClients: false,
    deleteClients: false,
    setDefaultClient: false,
    createProducts: false,
    editProducts: false,
    viewProducts: true,
    createHouseAccounts: false,
    viewHouseAccounts: true,
    editHouseAccounts: false,
    chargeHouseAccounts: true,
    processHouseAccountPayments: false,
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
    createClients: true,
    viewClients: true,
    editClients: true,
    deleteClients: false,
    setDefaultClient: false,
    createProducts: true,
    editProducts: true,
    viewProducts: true,
    createHouseAccounts: true,
    viewHouseAccounts: true,
    editHouseAccounts: true,
    chargeHouseAccounts: true,
    processHouseAccountPayments: true,
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
    createClients: true,
    viewClients: true,
    editClients: true,
    deleteClients: true,
    setDefaultClient: true,
    createProducts: true,
    editProducts: true,
    viewProducts: true,
    createHouseAccounts: true,
    viewHouseAccounts: true,
    editHouseAccounts: true,
    chargeHouseAccounts: true,
    processHouseAccountPayments: true,
    viewReports: true,
    manageEmployees: true,
    accessSettings: true,
  },
};
