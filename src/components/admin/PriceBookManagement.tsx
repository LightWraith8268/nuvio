/**
 * Price Book Management Component
 *
 * Features:
 * - View all products with contractor and retail prices
 * - Search products by name or SKU
 * - Edit individual product prices (contractor/retail)
 * - CSV upload for bulk price updates
 * - Admin/Manager only access
 */

import { useState, useEffect } from 'react';
import { Search, Upload, Edit2, Save, X, Download } from 'lucide-react';
import type { Product } from '@/types';

interface PriceBookManagementProps {
  products: Product[];
  onUpdateProduct: (productId: string, updates: Partial<Product>) => Promise<void>;
  onBulkUpdatePrices: (updates: Array<{ id: string; contractorPrice?: number; retailPrice?: number }>) => Promise<void>;
}

export default function PriceBookManagement({
  products,
  onUpdateProduct,
  onBulkUpdatePrices,
}: PriceBookManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ contractorPrice: number; retailPrice: number }>({ contractorPrice: 0, retailPrice: 0 });
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');

  // Filter products based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredProducts(products);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(term) ||
        product.sku?.toLowerCase().includes(term) ||
        product.category?.toLowerCase().includes(term)
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  const handleStartEdit = (product: Product) => {
    setEditingProduct(product.id);
    setEditValues({
      contractorPrice: product.contractorPrice,
      retailPrice: product.retailPrice || product.contractorPrice,
    });
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setEditValues({ contractorPrice: 0, retailPrice: 0 });
  };

  const handleSaveEdit = async (productId: string) => {
    try {
      await onUpdateProduct(productId, {
        contractorPrice: editValues.contractorPrice,
        retailPrice: editValues.retailPrice,
      });
      setEditingProduct(null);
    } catch (error) {
      console.error('Failed to update product:', error);
      alert('Failed to update product prices');
    }
  };

  const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    setUploadStatus('uploading');

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());

      // Expected CSV format: sku,contractor_price,retail_price
      // Or: id,contractor_price,retail_price
      const updates: Array<{ id: string; contractorPrice?: number; retailPrice?: number }> = [];

      for (let i = 1; i < lines.length; i++) { // Skip header
        const [identifier, contractorPrice, retailPrice] = lines[i].split(',').map(s => s.trim());

        // Find product by SKU or ID
        const product = products.find(p => p.sku === identifier || p.id === identifier);
        if (!product) {
          console.warn(`Product not found: ${identifier}`);
          continue;
        }

        const update: { id: string; contractorPrice?: number; retailPrice?: number } = { id: product.id };

        if (contractorPrice && !isNaN(parseFloat(contractorPrice))) {
          update.contractorPrice = parseFloat(contractorPrice);
        }

        if (retailPrice && !isNaN(parseFloat(retailPrice))) {
          update.retailPrice = parseFloat(retailPrice);
        }

        if (update.contractorPrice !== undefined || update.retailPrice !== undefined) {
          updates.push(update);
        }
      }

      if (updates.length === 0) {
        setUploadStatus('error');
        setUploadMessage('No valid price updates found in CSV');
        return;
      }

      await onBulkUpdatePrices(updates);
      setUploadStatus('success');
      setUploadMessage(`Successfully updated ${updates.length} products`);

      // Reset after 3 seconds
      setTimeout(() => {
        setUploadStatus('idle');
        setUploadMessage('');
        setCsvFile(null);
      }, 3000);
    } catch (error) {
      console.error('CSV upload error:', error);
      setUploadStatus('error');
      setUploadMessage('Failed to process CSV file');
    }
  };

  const handleDownloadTemplate = () => {
    // Generate CSV template with current products
    const csvContent = [
      'sku,contractor_price,retail_price',
      ...products.map(p => `${p.sku || p.id},${p.contractorPrice},${p.retailPrice || p.contractorPrice}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `price-book-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Price Book Management</h2>
          <p className="mt-1 text-sm text-gray-600">
            Manage contractor and retail pricing for all products
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Download Template */}
          <button
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            <Download className="w-4 h-4" />
            Download CSV Template
          </button>

          {/* CSV Upload */}
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer">
            <Upload className="w-4 h-4" />
            Upload CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Upload Status */}
      {uploadStatus !== 'idle' && (
        <div
          className={`p-4 rounded-md ${
            uploadStatus === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : uploadStatus === 'error'
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-blue-50 text-blue-800 border border-blue-200'
          }`}
        >
          {uploadStatus === 'uploading' ? 'Processing CSV...' : uploadMessage}
        </div>
      )}

      {/* CSV Format Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">CSV Format</h3>
        <p className="text-sm text-blue-800 mb-2">
          Upload a CSV file with the following columns:
        </p>
        <code className="block bg-white p-2 rounded text-xs text-gray-800 font-mono">
          sku,contractor_price,retail_price
        </code>
        <p className="text-xs text-blue-700 mt-2">
          Example: MUL-001,45.00,65.00
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search products by name, SKU, or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Products Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SKU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contractor Price
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Retail Price
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{product.name}</div>
                  <div className="text-xs text-gray-500">{product.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.sku || '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.category || '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {editingProduct === product.id ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editValues.contractorPrice}
                      onChange={(e) =>
                        setEditValues((prev) => ({
                          ...prev,
                          contractorPrice: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                    />
                  ) : (
                    <span className="text-sm text-gray-900">
                      ${product.contractorPrice.toFixed(2)}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {editingProduct === product.id ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editValues.retailPrice}
                      onChange={(e) =>
                        setEditValues((prev) => ({
                          ...prev,
                          retailPrice: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                    />
                  ) : (
                    <span className="text-sm text-gray-900">
                      ${(product.retailPrice || product.contractorPrice).toFixed(2)}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {editingProduct === product.id ? (
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleSaveEdit(product.id)}
                        className="p-1 text-green-600 hover:text-green-800"
                        title="Save"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStartEdit(product)}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="Edit Prices"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {searchTerm ? 'No products found matching your search' : 'No products available'}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <div className="text-sm text-gray-600">
          Showing {filteredProducts.length} of {products.length} products
        </div>
      </div>
    </div>
  );
}
