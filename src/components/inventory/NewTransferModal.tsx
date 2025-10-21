/**
 * New Transfer Modal
 *
 * Create inventory transfer between locations:
 * - Select source and destination locations
 * - Add products with quantities
 * - Track available inventory at source
 * - Add notes
 */

import { useState, useEffect } from 'react';
import { X, ArrowRightLeft, Plus, Trash2, AlertCircle } from 'lucide-react';
import { invoissAPI } from '@/lib/invoiss-api';
import * as mockInventory from '@/lib/mock-inventory';
import type { Location, Product, TransferLineItem } from '@/types';

interface NewTransferModalProps {
  locations: Location[];
  onClose: () => void;
  onSaved: () => void;
}

interface LineItemInput extends Omit<TransferLineItem, 'id' | 'product'> {
  id: string;
  availableQuantity?: number;
}

export default function NewTransferModal({
  locations,
  onClose,
  onSaved,
}: NewTransferModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [fromLocationId, setFromLocationId] = useState('');
  const [toLocationId, setToLocationId] = useState('');
  const [lineItems, setLineItems] = useState<LineItemInput[]>([]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const productData = await invoissAPI.listProducts();
      // Filter to only products that track inventory
      const trackedProducts = productData.filter(p => p.trackInventory);
      setProducts(trackedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const addLineItem = () => {
    const newItem: LineItemInput = {
      id: `item-${Date.now()}`,
      productId: '',
      quantityRequested: 1,
      quantityShipped: 0,
      quantityReceived: 0,
      unit: 'yard',
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
    if (product && fromLocationId) {
      // Get available quantity at source location
      const inventoryItem = mockInventory.getInventoryItem(productId, fromLocationId);
      const availableQuantity = inventoryItem?.quantityOnHand || 0;

      updateLineItem(itemId, {
        productId,
        unit: product.unit || 'yard',
        availableQuantity,
      });
    }
  };

  const handleFromLocationChange = (locationId: string) => {
    setFromLocationId(locationId);

    // Update available quantities for all line items
    const updatedItems = lineItems.map(item => {
      if (item.productId && locationId) {
        const inventoryItem = mockInventory.getInventoryItem(item.productId, locationId);
        return {
          ...item,
          availableQuantity: inventoryItem?.quantityOnHand || 0,
        };
      }
      return item;
    });
    setLineItems(updatedItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fromLocationId) {
      setError('Please select a source location');
      return;
    }

    if (!toLocationId) {
      setError('Please select a destination location');
      return;
    }

    if (fromLocationId === toLocationId) {
      setError('Source and destination locations must be different');
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
      if (item.quantityRequested <= 0) {
        setError('All quantities must be greater than 0');
        return;
      }
      if (item.availableQuantity !== undefined && item.quantityRequested > item.availableQuantity) {
        setError(`Cannot request more than available quantity (${item.availableQuantity} ${item.unit})`);
        return;
      }
    }

    setSaving(true);

    try {
      // TODO: Implement API call
      const transferNumber = `TRN-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
      const fromLocation = locations.find(l => l.id === fromLocationId);
      const toLocation = locations.find(l => l.id === toLocationId);

      const newTransfer = {
        id: `transfer-${Date.now()}`,
        number: transferNumber,
        fromLocationId,
        toLocationId,
        fromLocation,
        toLocation,
        status: 'pending' as const,
        lineItems: lineItems.map(item => ({
          id: item.id,
          productId: item.productId,
          quantityRequested: item.quantityRequested,
          quantityShipped: 0,
          quantityReceived: 0,
          unit: item.unit,
        })),
        requestedDate: new Date().toISOString(),
        requestedBy: 'current-employee-id', // TODO: Get from auth context
        notes: notes || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log('Creating transfer:', newTransfer);
      onSaved();
    } catch (error) {
      console.error('Error creating transfer:', error);
      setError('Failed to create transfer. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center">
            <ArrowRightLeft className="w-6 h-6 text-primary mr-2" />
            <h3 className="text-lg font-medium text-gray-900">New Inventory Transfer</h3>
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

          {/* Location Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="fromLocation" className="block text-sm font-medium text-gray-700 mb-1">
                From Location *
              </label>
              <select
                id="fromLocation"
                value={fromLocationId}
                onChange={(e) => handleFromLocationChange(e.target.value)}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                required
              >
                <option value="">Select source location...</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id} disabled={location.id === toLocationId}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="toLocation" className="block text-sm font-medium text-gray-700 mb-1">
                To Location *
              </label>
              <select
                id="toLocation"
                value={toLocationId}
                onChange={(e) => setToLocationId(e.target.value)}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                required
              >
                <option value="">Select destination location...</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id} disabled={location.id === fromLocationId}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900">Items to Transfer</h4>
              <button
                type="button"
                onClick={addLineItem}
                disabled={!fromLocationId}
                className="px-3 py-1 border border-transparent rounded-md text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50"
              >
                <Plus className="w-4 h-4 inline-block mr-1" />
                Add Item
              </button>
            </div>

            {!fromLocationId && (
              <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-md">
                Select a source location first to add items.
              </div>
            )}

            {fromLocationId && lineItems.length === 0 && (
              <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-md">
                No items added yet. Click "Add Item" to get started.
              </div>
            )}

            {lineItems.length > 0 && (
              <div className="space-y-3">
                {lineItems.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-md p-4">
                    <div className="grid grid-cols-12 gap-3">
                      <div className="col-span-5">
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
                          Available
                        </label>
                        <div className="text-sm text-gray-900 py-2">
                          {item.availableQuantity !== undefined ? `${item.availableQuantity} ${item.unit}` : '—'}
                        </div>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Quantity
                        </label>
                        <input
                          type="number"
                          min="0.1"
                          step="0.1"
                          max={item.availableQuantity}
                          value={item.quantityRequested}
                          onChange={(e) => updateLineItem(item.id, { quantityRequested: parseFloat(e.target.value) || 0 })}
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary text-sm"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Unit
                        </label>
                        <div className="text-sm text-gray-900 py-2">
                          {item.unit}
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
              {saving ? 'Creating...' : 'Create Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
