/**
 * Edit Product Modal
 *
 * Edit existing product:
 * - Update basic info, pricing, inventory settings
 * - Change category
 * - Enable/disable inventory tracking
 * - Update reorder points
 */

import { useState } from 'react';
import { X, Package, AlertCircle } from 'lucide-react';
import { invoissAPI } from '@/lib/invoiss-api';
import type { Product, ProductCategory } from '@/types';

interface EditProductModalProps {
  product: Product;
  categories: ProductCategory[];
  onClose: () => void;
  onSaved: () => void;
}

export default function EditProductModal({
  product,
  categories,
  onClose,
  onSaved,
}: EditProductModalProps) {
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description || '');
  const [sku, setSku] = useState(product.sku || '');
  const [category, setCategory] = useState(product.category || '');
  const [contractorPrice, setContractorPrice] = useState(product.contractorPrice.toString());
  const [retailPrice, setRetailPrice] = useState(product.retailPrice?.toString() || '');
  const [unit, setUnit] = useState<'ton' | 'yard' | 'each'>(product.unit || 'yard');
  const [trackInventory, setTrackInventory] = useState(product.trackInventory || false);
  const [minStockLevel, setMinStockLevel] = useState((product.minStockLevel || 50).toString());
  const [inStock, setInStock] = useState(product.inStock);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !contractorPrice) {
      setError('Product name and contractor price are required');
      return;
    }

    const contractorPriceNum = parseFloat(contractorPrice);
    const retailPriceNum = retailPrice ? parseFloat(retailPrice) : undefined;

    if (isNaN(contractorPriceNum) || contractorPriceNum <= 0) {
      setError('Invalid contractor price');
      return;
    }

    if (retailPriceNum !== undefined && (isNaN(retailPriceNum) || retailPriceNum <= 0)) {
      setError('Invalid retail price');
      return;
    }

    setSaving(true);

    try {
      // Update product via API
      await invoissAPI.updateProduct(product.id, {
        name,
        description: description || undefined,
        sku: sku || undefined,
        category: category || undefined,
        contractorPrice: contractorPriceNum,
        retailPrice: retailPriceNum,
        unit,
        trackInventory,
        minStockLevel: trackInventory ? parseInt(minStockLevel) : undefined,
        inStock,
      });

      onSaved();
    } catch (error) {
      console.error('Error updating product:', error);
      setError('Failed to update product. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center">
            <Package className="w-6 h-6 text-primary mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Edit Product</h3>
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

          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Basic Information</h4>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="e.g., Premium Mulch - Dark Brown"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="Brief description of the product"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">
                  SKU
                </label>
                <input
                  id="sku"
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="e.g., MUL-001"
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                >
                  <option value="">Select category...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Pricing</h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="contractorPrice" className="block text-sm font-medium text-gray-700 mb-1">
                  Contractor Price * (per {unit})
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    id="contractorPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={contractorPrice}
                    onChange={(e) => setContractorPrice(e.target.value)}
                    className="block w-full pl-7 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="retailPrice" className="block text-sm font-medium text-gray-700 mb-1">
                  Retail Price (per {unit})
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    id="retailPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={retailPrice}
                    onChange={(e) => setRetailPrice(e.target.value)}
                    className="block w-full pl-7 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
                Unit Type
              </label>
              <select
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value as any)}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              >
                <option value="yard">Cubic Yard (volume)</option>
                <option value="ton">Ton (weight)</option>
                <option value="each">Each (fixed item)</option>
              </select>
            </div>
          </div>

          {/* Inventory Settings */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Inventory Settings</h4>

            <div className="flex items-center">
              <input
                id="trackInventory"
                type="checkbox"
                checked={trackInventory}
                onChange={(e) => setTrackInventory(e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="trackInventory" className="ml-2 block text-sm text-gray-900">
                Track inventory for this product
              </label>
            </div>

            {trackInventory && (
              <div>
                <label htmlFor="minStockLevel" className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Stock Level (reorder point)
                </label>
                <input
                  id="minStockLevel"
                  type="number"
                  min="0"
                  value={minStockLevel}
                  onChange={(e) => setMinStockLevel(e.target.value)}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="50"
                />
              </div>
            )}

            <div className="flex items-center">
              <input
                id="inStock"
                type="checkbox"
                checked={inStock}
                onChange={(e) => setInStock(e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="inStock" className="ml-2 block text-sm text-gray-900">
                Product is in stock
              </label>
            </div>
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
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
