import { useState, useEffect } from 'react';
import { X, Plus, Trash2, CreditCard, Calendar, MapPin, Search } from 'lucide-react';
import { invoissAPI } from '@/lib/invoiss-api';
import type { Client, LineItem, SavedCard, Address, Product } from '@/types';

interface NewOrderModalProps {
  onClose: () => void;
  onSuccess: () => void;
  preselectedClient?: Client; // Optional: skip client selection if provided
}

type OrderType = 'in-store' | 'delivery';

interface LineItemInput {
  id: string;
  productId?: string; // Reference to Product
  name: string;
  description?: string;
  unit: 'tons' | 'yard' | 'each';
  quantity: number;
  pricePerUnit: number;
  // Weight fields for tons
  tareWeight?: number;
  grossWeight?: number;
}

export default function NewOrderModal({ onClose, onSuccess, preselectedClient }: NewOrderModalProps) {
  // If preselectedClient is provided, skip to order type selection, otherwise start at type
  const [step, setStep] = useState<'type' | 'client' | 'items' | 'delivery' | 'review'>(
    preselectedClient ? 'type' : 'type'
  );
  const [orderType, setOrderType] = useState<OrderType>('in-store');

  // Client selection
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(preselectedClient || null);
  const [clientSearch, setClientSearch] = useState('');

  // Product catalog
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [showProductSelector, setShowProductSelector] = useState(false);

  // Line items
  const [lineItems, setLineItems] = useState<LineItemInput[]>([]);

  // Delivery info (for delivery orders)
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState('');
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [deliveryFee, setDeliveryFee] = useState(50); // Default delivery fee
  const [selectedCard, setSelectedCard] = useState<SavedCard | null>(null);

  // Payment method selection
  const [paymentMethod, setPaymentMethod] = useState<'card_on_file' | 'new_card' | 'house_account' | null>(null);

  // New card input (for clients without card on file)
  const [showNewCardForm, setShowNewCardForm] = useState(false);
  const [newCardData, setNewCardData] = useState({
    cardNumber: '',
    expirationDate: '',
    cvv: '',
    zipCode: '',
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadClients();
    loadProducts();
  }, []);

  async function loadClients() {
    try {
      const data = await invoissAPI.listClients();
      setClients(data);
    } catch (error) {
      console.error('Failed to load clients:', error);
    }
  }

  async function loadProducts() {
    try {
      const data = await invoissAPI.listProducts({ inStock: true });
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  }

  // Normalize phone numbers by removing all non-digit characters for search comparison
  function normalizePhone(phone?: string): string {
    return phone?.replace(/\D/g, '') || '';
  }

  const normalizedSearchTerm = normalizePhone(clientSearch);

  // Separate default client from others
  const defaultClient = clients.find(client => client.metadata?.isDefault);
  const nonDefaultClients = clients.filter(client => !client.metadata?.isDefault);

  // Filter non-default clients
  const filteredNonDefaultClients = nonDefaultClients.filter(client =>
    client.name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.email?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    (clientSearch && normalizePhone(client.phone).includes(normalizedSearchTerm))
  );

  // Pin default client at top if no search term, or include it if it matches search
  const filteredClients = !clientSearch && defaultClient
    ? [defaultClient, ...filteredNonDefaultClients]
    : defaultClient && (
        defaultClient.name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
        defaultClient.email?.toLowerCase().includes(clientSearch.toLowerCase()) ||
        normalizePhone(defaultClient.phone).includes(normalizedSearchTerm)
      )
    ? [defaultClient, ...filteredNonDefaultClients]
    : filteredNonDefaultClients;

  // Filter products by search term
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.description?.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.sku?.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.category?.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Get price based on client's price book
  function getProductPrice(product: Product): number {
    const priceBook = selectedClient?.priceBook || 'retail';
    if (priceBook === 'contractor') {
      return product.contractorPrice;
    }
    // Retail price - use custom retail price if available, otherwise contractor price
    return product.retailPrice || product.contractorPrice;
  }

  // Add product from selector
  function addProductToOrder(product: Product) {
    const price = getProductPrice(product);
    const newItem: LineItemInput = {
      id: `item-${Date.now()}`,
      productId: product.id,
      name: product.name,
      description: product.description,
      unit: product.priceType === 'per_weight' ? 'tons' : 'each',
      quantity: 0,
      pricePerUnit: price,
      tareWeight: 0,
      grossWeight: 0,
    };
    setLineItems([...lineItems, newItem]);
    setShowProductSelector(false);
    setProductSearch('');
  }

  function removeLineItem(id: string) {
    setLineItems(lineItems.filter(item => item.id !== id));
  }

  function updateLineItem(id: string, updates: Partial<LineItemInput>) {
    setLineItems(lineItems.map(item => {
      if (item.id !== id) return item;

      const updated = { ...item, ...updates };

      // Auto-calculate quantity for tons based on tare/gross weight
      if (updated.unit === 'tons' && updated.tareWeight !== undefined && updated.grossWeight !== undefined) {
        const netWeightLbs = updated.grossWeight - updated.tareWeight;
        const netWeightTons = netWeightLbs / 2000; // Convert lbs to tons
        updated.quantity = Math.max(0, parseFloat(netWeightTons.toFixed(4)));
      }

      return updated;
    }));
  }

  function calculateSubtotal(): number {
    return lineItems.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0);
  }

  function calculateTotal(): number {
    const subtotal = calculateSubtotal();
    return orderType === 'delivery' ? subtotal + deliveryFee : subtotal;
  }

  async function handleSubmit() {
    if (!selectedClient) {
      alert('Please select a client');
      return;
    }

    if (lineItems.length === 0) {
      alert('Please add at least one line item');
      return;
    }

    if (orderType === 'delivery' && (!deliveryDate || !deliveryTimeSlot || !selectedAddress)) {
      alert('Please complete delivery information');
      return;
    }

    setSaving(true);

    try {
      const orderData: any = {
        clientId: selectedClient?.id,
        type: orderType === 'in-store' ? 'INVOICE' : 'ORDER',
        lineItems: lineItems.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          pricePerUnit: item.pricePerUnit,
          total: item.quantity * item.pricePerUnit,
          metadata: item.unit === 'tons' ? {
            tareWeight: item.tareWeight,
            grossWeight: item.grossWeight,
            netWeight: item.grossWeight! - item.tareWeight!,
          } : undefined,
        })),
        metadata: {
          orderType: orderType,
        },
      };

      // Add delivery metadata for delivery orders
      if (orderType === 'delivery') {
        orderData.metadata.delivery = {
          scheduledDate: deliveryDate,
          timeSlot: deliveryTimeSlot,
          address: selectedAddress,
          deliveryFee: deliveryFee,
        };

        // Add payment method - house account, saved card, or new card
        if (paymentMethod === 'house_account') {
          orderData.metadata.payment = {
            method: 'house_account',
          };
        } else if (paymentMethod === 'card_on_file' && selectedCard) {
          orderData.metadata.payment = {
            method: 'card_on_file',
            cardId: selectedCard.id,
          };
        } else if (paymentMethod === 'new_card' && newCardData.cardNumber) {
          // Include new card data for Clover tokenization via Invoiss
          orderData.metadata.payment = {
            method: 'new_card',
            cardData: {
              cardNumber: newCardData.cardNumber.replace(/\s/g, ''), // Remove spaces
              expirationDate: newCardData.expirationDate,
              cvv: newCardData.cvv,
              zipCode: newCardData.zipCode,
            },
          };
        }
      }

      await invoissAPI.createOrder(orderData);
      onSuccess();
    } catch (error) {
      console.error('Failed to create order:', error);
      alert('Failed to create order. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            Create New Order - {step === 'type' ? 'Select Type' :
              step === 'client' ? 'Select Client' :
              step === 'items' ? 'Add Items' :
              step === 'delivery' ? 'Delivery Details' :
              'Review Order'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Order Type */}
          {step === 'type' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Select the type of order you want to create:</p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setOrderType('in-store');
                    setStep(preselectedClient ? 'items' : 'client');
                  }}
                  className="relative block p-8 border-2 border-gray-300 rounded-lg hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <div className="text-center">
                    <div className="mx-auto h-12 w-12 text-primary mb-4">💰</div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">In-Store Order</h4>
                    <p className="text-sm text-gray-500">
                      Immediate payment (INVOICE type)
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setOrderType('delivery');
                    setStep(preselectedClient ? 'items' : 'client');
                  }}
                  className="relative block p-8 border-2 border-gray-300 rounded-lg hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <div className="text-center">
                    <div className="mx-auto h-12 w-12 text-primary mb-4">🚚</div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Delivery Order</h4>
                    <p className="text-sm text-gray-500">
                      Scheduled delivery (ORDER type)
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Client Selection */}
          {step === 'client' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search for client
                </label>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>

              <div className="border rounded-md max-h-96 overflow-y-auto">
                {filteredClients.map(client => {
                  const isDefault = client.metadata?.isDefault;
                  return (
                    <button
                      key={client.id}
                      onClick={() => {
                        setSelectedClient(client);
                        setStep('items');
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 ${
                        isDefault ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">{client.name}</p>
                            {isDefault && (
                              <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded font-medium">
                                Default
                              </span>
                            )}
                          </div>
                          {client.email && (
                            <p className="text-sm text-gray-500">{client.email}</p>
                          )}
                        </div>
                        {client.hasCardOnFile && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                            Card on File
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Line Items */}
          {step === 'items' && (
            <div className="space-y-4">
              {/* Client Info and Add Item Button */}
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">
                    Selected Client: <span className="font-medium">{selectedClient?.name}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Price Book: <span className="font-medium capitalize">{selectedClient?.priceBook || 'retail'}</span>
                  </p>
                </div>
                <button
                  onClick={() => setShowProductSelector(true)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-primary hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Product
                </button>
              </div>

              {/* Product Selector Modal */}
              {showProductSelector && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between p-4 border-b">
                      <h4 className="text-lg font-medium text-gray-900">Select Product</h4>
                      <button
                        onClick={() => {
                          setShowProductSelector(false);
                          setProductSearch('');
                        }}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="p-4 border-b">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          placeholder="Search products by name, SKU, or category..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                          autoFocus
                        />
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                      {filteredProducts.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                          {productSearch ? 'No products found matching your search.' : 'No products available.'}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {filteredProducts.map(product => {
                            const price = getProductPrice(product);
                            const priceBook = selectedClient?.priceBook || 'retail';
                            return (
                              <button
                                key={product.id}
                                onClick={() => addProductToOrder(product)}
                                className="w-full text-left px-4 py-3 border rounded-lg hover:bg-gray-50 hover:border-primary transition-colors"
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium text-gray-900">{product.name}</p>
                                      {product.category && (
                                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                                          {product.category}
                                        </span>
                                      )}
                                    </div>
                                    {product.description && (
                                      <p className="text-sm text-gray-500 mt-1">{product.description}</p>
                                    )}
                                    {product.sku && (
                                      <p className="text-xs text-gray-400 mt-1">SKU: {product.sku}</p>
                                    )}
                                  </div>
                                  <div className="ml-4 text-right">
                                    <p className="text-lg font-bold text-gray-900">
                                      ${price.toFixed(2)}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {priceBook === 'contractor' ? 'Contractor' : 'Retail'}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                      per {product.priceType === 'per_weight' ? 'ton' : 'unit'}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Line Items List */}
              {lineItems.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-gray-500">No items yet. Click "Add Product" to start.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {lineItems.map((item, index) => (
                    <div key={item.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.name}</p>
                          {item.description && (
                            <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => removeLineItem(item.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700">Price per {item.unit}</label>
                          <div className="mt-1 flex items-center text-sm font-medium text-gray-900">
                            ${item.pricePerUnit.toFixed(2)}
                            <span className="text-xs text-gray-500 ml-2">/{item.unit}</span>
                          </div>
                        </div>

                        <div></div>

                        {/* Weight Calculator for Tons */}
                        {item.unit === 'tons' ? (
                          <>
                            <div>
                              <label className="block text-xs font-medium text-gray-700">Tare Weight (lbs)</label>
                              <input
                                type="number"
                                step="0.01"
                                value={item.tareWeight}
                                onChange={(e) => updateLineItem(item.id, { tareWeight: parseFloat(e.target.value) || 0 })}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-primary focus:border-primary"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700">Gross Weight (lbs)</label>
                              <input
                                type="number"
                                step="0.01"
                                value={item.grossWeight}
                                onChange={(e) => updateLineItem(item.id, { grossWeight: parseFloat(e.target.value) || 0 })}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-primary focus:border-primary"
                              />
                            </div>

                            <div className="col-span-2 bg-blue-50 border border-blue-200 rounded p-3">
                              <p className="text-xs text-blue-800">
                                Net Weight: {((item.grossWeight || 0) - (item.tareWeight || 0)).toFixed(2)} lbs
                              </p>
                              <p className="text-sm font-medium text-blue-900 mt-1">
                                Quantity: {item.quantity.toFixed(4)} tons
                              </p>
                            </div>
                          </>
                        ) : (
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-700">Quantity</label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) => updateLineItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-primary focus:border-primary"
                            />
                          </div>
                        )}

                        <div className="col-span-2 text-right">
                          <span className="text-sm font-medium text-gray-700">
                            Line Total: ${(item.quantity * item.pricePerUnit).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-medium">
                      <span>Subtotal:</span>
                      <span>${calculateSubtotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Delivery Details (for delivery orders only) */}
          {step === 'delivery' && orderType === 'delivery' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Delivery Date</label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Time Slot</label>
                  <select
                    value={deliveryTimeSlot}
                    onChange={(e) => setDeliveryTimeSlot(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  >
                    <option value="">Select time slot</option>
                    <option value="8:00 AM - 10:00 AM">8:00 AM - 10:00 AM</option>
                    <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</option>
                    <option value="12:00 PM - 2:00 PM">12:00 PM - 2:00 PM</option>
                    <option value="2:00 PM - 4:00 PM">2:00 PM - 4:00 PM</option>
                    <option value="4:00 PM - 6:00 PM">4:00 PM - 6:00 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Address
                </label>
                {selectedClient?.addresses && selectedClient.addresses.length > 0 ? (
                  <div className="space-y-2">
                    {selectedClient.addresses.map((address, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedAddress(address)}
                        className={`w-full text-left p-3 border rounded-md ${
                          selectedAddress === address
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <MapPin className="inline w-4 h-4 mr-2" />
                        {address.street}, {address.city}, {address.state} {address.zip}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No addresses on file for this client</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Delivery Fee</label>
                <input
                  type="number"
                  step="0.01"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>

              {/* Payment Method Section */}
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CreditCard className="inline w-4 h-4 mr-2" />
                  Payment Method (Optional - charge manually later)
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Select payment method: saved card, new card, or house account
                </p>

                <div className="space-y-2 mb-3">
                  {/* House Account Option */}
                  <button
                    onClick={() => {
                      setPaymentMethod('house_account');
                      setShowNewCardForm(false);
                      setSelectedCard(null);
                    }}
                    className={`w-full text-left p-3 border rounded-md ${
                      paymentMethod === 'house_account'
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">🏠</span>
                        <div>
                          <p className="font-medium text-gray-900">House Account</p>
                          <p className="text-xs text-gray-500">Bill to client's house account via Invoiss</p>
                        </div>
                      </div>
                      {paymentMethod === 'house_account' && (
                        <span className="text-primary">✓</span>
                      )}
                    </div>
                  </button>

                  {/* Show saved cards if available */}
                  {selectedClient?.hasCardOnFile && (
                    <button
                      onClick={() => {
                        setPaymentMethod('card_on_file');
                        setSelectedCard({ id: 'card-1', last4: '4242', brand: 'Visa' } as SavedCard);
                        setShowNewCardForm(false);
                      }}
                      className={`w-full text-left p-3 border rounded-md ${
                        paymentMethod === 'card_on_file'
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <CreditCard className="w-5 h-5 mr-3 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">Visa ending in 4242</p>
                            <p className="text-xs text-gray-500">Saved card on file</p>
                          </div>
                        </div>
                        {paymentMethod === 'card_on_file' && (
                          <span className="text-primary">✓</span>
                        )}
                      </div>
                    </button>
                  )}
                </div>

                {/* Add New Card Button/Form Toggle */}
                {paymentMethod !== 'new_card' ? (
                  <button
                    onClick={() => {
                      setPaymentMethod('new_card');
                      setShowNewCardForm(true);
                      setSelectedCard(null);
                    }}
                    className="w-full text-left p-3 border-2 border-dashed border-gray-300 rounded-md hover:border-primary text-sm text-gray-600 hover:text-primary"
                  >
                    <Plus className="inline w-4 h-4 mr-2" />
                    Add New Card
                  </button>
                ) : (
                  <div className="border border-primary rounded-lg p-4 space-y-4 bg-primary/5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-900">New Card Details</span>
                      <button
                        onClick={() => {
                          setShowNewCardForm(false);
                          setPaymentMethod(null);
                        }}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700">Card Number</label>
                      <input
                        type="text"
                        placeholder="4242 4242 4242 4242"
                        maxLength={19}
                        value={newCardData.cardNumber}
                        onChange={(e) => {
                          // Format card number with spaces
                          const value = e.target.value.replace(/\s/g, '');
                          const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
                          setNewCardData({ ...newCardData, cardNumber: formatted });
                        }}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-primary focus:border-primary"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Exp. Date</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          maxLength={5}
                          value={newCardData.expirationDate}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, '');
                            if (value.length >= 2) {
                              value = value.slice(0, 2) + '/' + value.slice(2, 4);
                            }
                            setNewCardData({ ...newCardData, expirationDate: value });
                          }}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-primary focus:border-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700">CVV</label>
                        <input
                          type="text"
                          placeholder="123"
                          maxLength={4}
                          value={newCardData.cvv}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            setNewCardData({ ...newCardData, cvv: value });
                          }}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-primary focus:border-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700">ZIP Code</label>
                        <input
                          type="text"
                          placeholder="12345"
                          maxLength={10}
                          value={newCardData.zipCode}
                          onChange={(e) => setNewCardData({ ...newCardData, zipCode: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-primary focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                      <p className="text-xs text-blue-800">
                        💳 Card will be tokenized via Invoiss → Clover and stored securely
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {step === 'review' && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-gray-900">Order Summary</h4>
                <div className="text-sm space-y-1">
                  <p><span className="text-gray-600">Type:</span> {orderType === 'in-store' ? 'In-Store (INVOICE)' : 'Delivery (ORDER)'}</p>
                  <p><span className="text-gray-600">Client:</span> {selectedClient?.name}</p>
                  <p><span className="text-gray-600">Items:</span> {lineItems.length}</p>
                  {orderType === 'delivery' && (
                    <>
                      <p><span className="text-gray-600">Delivery Date:</span> {deliveryDate}</p>
                      <p><span className="text-gray-600">Time Slot:</span> {deliveryTimeSlot}</p>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">${calculateSubtotal().toFixed(2)}</span>
                </div>
                {orderType === 'delivery' && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Fee:</span>
                    <span className="font-medium">${deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t">
          {step !== 'type' && (
            <button
              onClick={() => {
                if (step === 'client') setStep('type');
                else if (step === 'items') setStep('client');
                else if (step === 'delivery') setStep('items');
                else if (step === 'review') setStep(orderType === 'delivery' ? 'delivery' : 'items');
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Back
            </button>
          )}

          {step === 'items' && (
            <button
              onClick={() => setStep(orderType === 'delivery' ? 'delivery' : 'review')}
              disabled={lineItems.length === 0}
              className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50"
            >
              Continue
            </button>
          )}

          {step === 'delivery' && (
            <button
              onClick={() => setStep('review')}
              disabled={!deliveryDate || !deliveryTimeSlot || !selectedAddress}
              className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50"
            >
              Review Order
            </button>
          )}

          {step === 'review' && (
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Order'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
