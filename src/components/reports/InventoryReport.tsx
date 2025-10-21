/**
 * Inventory Report
 *
 * Comprehensive inventory analytics:
 * - Stock levels by location
 * - Low stock alerts
 * - Inventory value by location
 * - Stock movement (last 30 days)
 * - Reorder recommendations
 */

import { useState, useEffect } from 'react';
import { Package, AlertTriangle, DollarSign, TrendingDown, TrendingUp } from 'lucide-react';
import { invoissAPI } from '@/lib/invoiss-api';
import * as mockInventory from '@/lib/mock-inventory';
import type { Product, Location, InventoryItem, InventoryTransaction } from '@/types';

interface LocationInventorySummary {
  location: Location;
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
}

interface LowStockProduct {
  product: Product;
  location: Location;
  quantityOnHand: number;
  minStockLevel: number;
  deficit: number;
}

export default function InventoryReport() {
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const productsData = await invoissAPI.listProducts();
      const locationsData = mockInventory.getLocations();
      const inventoryData = mockInventory.getAllInventoryItems();
      const transactionsData = mockInventory.getAllTransactions();

      setProducts(productsData);
      setLocations(locationsData);
      setInventoryItems(inventoryData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error loading inventory data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter inventory by location
  const filteredInventory = selectedLocation === 'all'
    ? inventoryItems
    : inventoryItems.filter(item => item.locationId === selectedLocation);

  // Calculate location summaries
  const locationSummaries: LocationInventorySummary[] = locations.map(location => {
    const locationItems = inventoryItems.filter(item => item.locationId === location.id);
    const totalValue = locationItems.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId);
      return sum + (item.quantityOnHand * (product?.contractorPrice || 0));
    }, 0);
    const lowStockItems = locationItems.filter(item => {
      const product = products.find(p => p.id === item.productId);
      return product && product.minStockLevel && item.quantityOnHand < product.minStockLevel;
    }).length;

    return {
      location,
      totalItems: locationItems.length,
      totalValue,
      lowStockItems,
    };
  });

  // Identify low stock products
  const lowStockProducts: LowStockProduct[] = filteredInventory
    .filter(item => {
      const product = products.find(p => p.id === item.productId);
      return product && product.minStockLevel && item.quantityOnHand < product.minStockLevel;
    })
    .map(item => {
      const product = products.find(p => p.id === item.productId)!;
      const location = locations.find(l => l.id === item.locationId)!;
      return {
        product,
        location,
        quantityOnHand: item.quantityOnHand,
        minStockLevel: product.minStockLevel!,
        deficit: product.minStockLevel! - item.quantityOnHand,
      };
    })
    .sort((a, b) => b.deficit - a.deficit);

  // Calculate recent stock movement (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentTransactions = transactions.filter(t =>
    new Date(t.createdAt) >= thirtyDaysAgo &&
    (selectedLocation === 'all' || t.locationId === selectedLocation)
  );

  const stockMovement = recentTransactions.reduce((acc, t) => {
    if (t.type === 'sale') {
      acc.sold += Math.abs(t.quantity);
    } else if (t.type === 'purchase') {
      acc.purchased += t.quantity;
    } else if (t.type === 'transfer_in') {
      acc.transferredIn += t.quantity;
    } else if (t.type === 'transfer_out') {
      acc.transferredOut += Math.abs(t.quantity);
    }
    return acc;
  }, { sold: 0, purchased: 0, transferredIn: 0, transferredOut: 0 });

  // Total inventory value
  const totalInventoryValue = filteredInventory.reduce((sum, item) => {
    const product = products.find(p => p.id === item.productId);
    return sum + (item.quantityOnHand * (product?.contractorPrice || 0));
  }, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading inventory data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Package className="w-6 h-6 text-primary mr-2" />
          <h2 className="text-2xl font-bold text-gray-900">Inventory Report</h2>
        </div>
      </div>

      {/* Location Filter */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center space-x-4">
          <label htmlFor="locationFilter" className="text-sm font-medium text-gray-700">
            Filter by Location:
          </label>
          <select
            id="locationFilter"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="block w-64 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          >
            <option value="all">All Locations</option>
            {locations.map(location => (
              <option key={location.id} value={location.id}>{location.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Value</dt>
                  <dd className="text-lg font-medium text-gray-900">${totalInventoryValue.toFixed(2)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Items</dt>
                  <dd className="text-lg font-medium text-gray-900">{filteredInventory.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Low Stock Items</dt>
                  <dd className="text-lg font-medium text-gray-900">{lowStockProducts.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingDown className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Sold (30d)</dt>
                  <dd className="text-lg font-medium text-gray-900">{stockMovement.sold.toFixed(1)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Location Summaries (when "All Locations" selected) */}
      {selectedLocation === 'all' && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="text-lg font-medium text-gray-900">Inventory by Location</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Items</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Value</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Low Stock</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {locationSummaries.map(summary => (
                  <tr key={summary.location.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{summary.location.name}</div>
                      <div className="text-sm text-gray-500">{summary.location.type}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {summary.totalItems}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                      ${summary.totalValue.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {summary.lowStockItems > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {summary.lowStockItems} items
                        </span>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Movement (Last 30 Days) */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Stock Movement (Last 30 Days)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="flex items-center">
              <TrendingDown className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">Sold</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stockMovement.sold.toFixed(1)}</div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <TrendingUp className="w-5 h-5 text-green-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">Purchased</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stockMovement.purchased.toFixed(1)}</div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <TrendingUp className="w-5 h-5 text-blue-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">Transferred In</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stockMovement.transferredIn.toFixed(1)}</div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <TrendingDown className="w-5 h-5 text-yellow-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">Transferred Out</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stockMovement.transferredOut.toFixed(1)}</div>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 border-b flex items-center">
          <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Low Stock Alerts</h3>
        </div>
        {lowStockProducts.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            All products are adequately stocked
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">On Hand</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Min Level</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Deficit</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lowStockProducts.map((lsp, index) => (
                  <tr key={`${lsp.product.id}-${lsp.location.id}`} className={index < 5 ? 'bg-yellow-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{lsp.product.name}</div>
                      <div className="text-sm text-gray-500">{lsp.product.sku}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {lsp.location.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {lsp.quantityOnHand} {lsp.product.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {lsp.minStockLevel} {lsp.product.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-red-600">
                      -{lsp.deficit} {lsp.product.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
