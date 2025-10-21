/**
 * New Purchase Order Modal
 *
 * Create a new purchase order with:
 * - Vendor selection
 * - Location selection (where inventory will be received)
 * - Line items (products, quantities, unit costs)
 * - Expected delivery date
 * - Notes
 */

import { useState, useEffect } from 'react';
import { X, FileText, Plus, Trash2, AlertCircle } from 'lucide-react';
import { invoissAPI } from '@/lib/invoiss-api';
import * as mockInventory from '@/lib/mock-inventory';
import type { Vendor, Product, Location, PurchaseOrderLineItem } from '@/types';

interface NewPurchaseOrderModalProps {
  onClose: () => void;
  onSaved: () => void;
}

interface LineItemInput extends Omit<PurchaseOrderLineItem, 'id' | 'product' | 'quantityReceived' | 'totalCost'> {
  id: string;
}

export default function NewPurchaseOrderModal({ onClose, onSaved }: NewPurchaseOrderModalProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<LineItemInput[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load vendors (mock data for now)
      const mockVendors: Vendor[] = [
        {
          id: 'vendor-1',
          name: 'ABC Mulch Supply',
          contactName: 'John Smith',
          email: 'john@abcmulch.com',
          phone: '555-1234',
          paymentTerms: 'net_30',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'vendor-2',
          name: 'Rock & Gravel Co',
          contactName: 'Jane Doe',
          email: 'jane@rockgravel.com',
          phone: '555-5678',
          paymentTerms: 'net_60',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      setVendors(mockVendors);

      // Load products
      const productData = await invoissAPI.listProducts();
      setProducts(productData);

      // Load locations
      const locationData = mockInventory.getActiveLocations();
      setLocations(locationData);

      // Set default location to primary
      const primaryLocation = mockInventory.getPrimaryLocation();
      if (primaryLocation) {
        setSelectedLocationId(primaryLocation.id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const addLineItem = () => {
    const newItem: LineItemInput = {
      id: `item-${Date.now()}`,
      productId: '',
      quantityOrdered: 1,
      unit: 'yard',
      unitCost: 0,
    };
    setLineItems([...lineItems, newItem]);
  };

  const updateLineItem = (id: string, updates: Partial<LineItemInput>) => {
    setLineItems(lineItems.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const handleProductChange = (itemId: string, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      updateLineItem(itemId, {
        productId,
        unit: product.unit || 'yard',
        unitCost: product.contractorPrice * 0.7, // Assume wholesale is 70% of contractor price
        description: product.description,
      });
    }
  };

  const calculateSubTotal = () => {
    return lineItems.reduce((sum, item) => {
      return sum + (item.quantityOrdered * item.unitCost);
    }, 0);
  };

  const calculateTotal = () => {
    // For now, just return subtotal (could add tax/shipping later)
    return calculateSubTotal();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedVendorId) {
      setError('Please select a vendor');
      return;
    }

    if (!selectedLocationId) {
      setError('Please select a receiving location');
      return;
    }

    if (lineItems.length === 0) {
      setError('Please add at least one line item');
      return;
    }

    // Validate all line items
    for (const item of lineItems) {
      if (!item.productId) {
        setError('All line items must have a product selected');
        return;
      }
      if (item.quantityOrdered <= 0) {
        setError('All quantities must be greater than 0');
        return;
      }
      if (item.unitCost <= 0) {
        setError('All unit costs must be greater than 0');
        return;
      }
    }

    setSaving(true);

    try {
      // TODO: Implement API call
      const vendor = vendors.find(v => v.id === selectedVendorId);
      const poNumber = `PO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

      const newPO = {
        id: `po-${Date.now()}`,
        number: poNumber,
        vendorId: selectedVendorId,
        vendor: vendor!,
        locationId: selectedLocationId,
        status: 'draft' as const,
        lineItems: lineItems.map(item => ({
          ...item,
          quantityReceived: 0,
          totalCost: item.quantityOrdered * item.unitCost,
        })),
        subTotal: calculateSubTotal(),
        taxTotal: 0,
        shippingCost: 0,
        grandTotal: calculateTotal(),
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        notes: notes || undefined,
        createdBy: 'current-employee-id', // TODO: Get from auth context
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log('Creating PO:', newPO);
      onSaved();
    } catch (error) {
      console.error('Error creating purchase order:', error);
      setError('Failed to create purchase order. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center">
            <FileText className="w-6 h-6 text-primary mr-2" />
            <h3 className="text-lg font-medium text-gray-900">New Purchase Order</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Header Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="vendor" className="block text-sm font-medium text-gray-700 mb-1">
                Vendor *
              </label>
              <select
                id="vendor"
                value={selectedVendorId}
                onChange={(e) => setSelectedVendorId(e.target.value)}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                required
              >
                <option value="">Select vendor...</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Receiving Location *
              </label>
              <select
                id="location"
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                required
              >
                <option value="">Select location...</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="expectedDelivery" className="block text-sm font-medium text-gray-700 mb-1">
                Expected Delivery Date
              </label>
              <input
                id="expectedDelivery"
                type="date"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900">Line Items</h4>
              <button
                type="button"
                onClick={addLineItem}
                className="px-3 py-1 border border-transparent rounded-md text-sm font-medium text-white bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 inline-block mr-1" />
                Add Item
              </button>
            </div>

            {lineItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-md">
                No items added yet. Click "Add Item" to get started.
              </div>
            ) : (
              <div className="space-y-3">
                {lineItems.map((item, index) => (
                  <div key={item.id} className="border border-gray-200 rounded-md p-4">
                    <div className="grid grid-cols-12 gap-3">
                      <div className="col-span-4">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Product
                        </label>
                        <select
                          value={item.productId}
                          onChange={(e) => handleProductChange(item.id, e.target.value)}
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary text-sm"
                        >
                          <option value="">Select product...</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Quantity
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={item.quantityOrdered}
                          onChange={(e) => updateLineItem(item.id, { quantityOrdered: parseFloat(e.target.value) || 0 })}
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary text-sm"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Unit
                        </label>
                        <select
                          value={item.unit}
                          onChange={(e) => updateLineItem(item.id, { unit: e.target.value as any })}
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary text-sm"
                        >
                          <option value="yard">Yard</option>
                          <option value="ton">Ton</option>
                          <option value="each">Each</option>
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Unit Cost
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                            <span className="text-gray-500 text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitCost}
                            onChange={(e) => updateLineItem(item.id, { unitCost: parseFloat(e.target.value) || 0 })}
                            className="block w-full pl-6 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary text-sm"
                          />
                        </div>
                      </div>

                      <div className="col-span-1 flex items-end">
                        <button
                          type="button"
                          onClick={() => removeLineItem(item.id)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="col-span-1 flex items-end justify-end">
                        <div className="text-sm font-medium text-gray-900">
                          ${(item.quantityOrdered * item.unitCost).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="Additional notes or special instructions..."
            />
          </div>

          {/* Totals */}
          {lineItems.length > 0 && (
            <div className="bg-gray-50 rounded-md p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium text-gray-900">${calculateSubTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span className="text-gray-900">Total:</span>
                <span className="text-gray-900">${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Purchase Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
