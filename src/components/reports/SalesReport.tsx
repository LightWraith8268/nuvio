/**
 * Sales Report
 *
 * Comprehensive sales analytics:
 * - Date range filtering
 * - Revenue breakdown by type (in-store vs delivery)
 * - Top products by revenue and quantity
 * - Top clients by revenue
 * - Sales trends visualization
 * - Order statistics
 */

import { useState, useEffect } from 'react';
import { Calendar, DollarSign, Package, TrendingUp, Users, Truck, Store } from 'lucide-react';
import { invoissAPI } from '@/lib/invoiss-api';
import type { Order, Product, Client } from '@/types';

interface DateRange {
  startDate: string;
  endDate: string;
}

interface SalesMetrics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  inStoreRevenue: number;
  deliveryRevenue: number;
  inStoreOrders: number;
  deliveryOrders: number;
}

interface TopProduct {
  product: Product;
  quantity: number;
  revenue: number;
}

interface TopClient {
  client: Client;
  orderCount: number;
  revenue: number;
}

export default function SalesReport() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0], // Today
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersData, productsData, clientsData] = await Promise.all([
        invoissAPI.listOrders(),
        invoissAPI.listProducts(),
        invoissAPI.listClients(),
      ]);

      setOrders(ordersData);
      setProducts(productsData);
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter orders by date range
  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
    return orderDate >= dateRange.startDate && orderDate <= dateRange.endDate;
  });

  // Calculate metrics
  const metrics: SalesMetrics = filteredOrders.reduce((acc, order) => {
    const isDelivery = order.type === 'delivery';
    return {
      totalRevenue: acc.totalRevenue + order.total,
      totalOrders: acc.totalOrders + 1,
      averageOrderValue: 0, // Will calculate after
      inStoreRevenue: acc.inStoreRevenue + (isDelivery ? 0 : order.total),
      deliveryRevenue: acc.deliveryRevenue + (isDelivery ? order.total : 0),
      inStoreOrders: acc.inStoreOrders + (isDelivery ? 0 : 1),
      deliveryOrders: acc.deliveryOrders + (isDelivery ? 1 : 0),
    };
  }, {
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    inStoreRevenue: 0,
    deliveryRevenue: 0,
    inStoreOrders: 0,
    deliveryOrders: 0,
  });

  metrics.averageOrderValue = metrics.totalOrders > 0 ? metrics.totalRevenue / metrics.totalOrders : 0;

  // Calculate top products
  const productSales = new Map<string, { quantity: number; revenue: number }>();
  filteredOrders.forEach(order => {
    order.lineItems.forEach(item => {
      if (item.productId) {
        const existing = productSales.get(item.productId) || { quantity: 0, revenue: 0 };
        productSales.set(item.productId, {
          quantity: existing.quantity + item.quantity,
          revenue: existing.revenue + (item.quantity * item.price),
        });
      }
    });
  });

  const topProducts: TopProduct[] = Array.from(productSales.entries())
    .map(([productId, sales]) => ({
      product: products.find(p => p.id === productId)!,
      quantity: sales.quantity,
      revenue: sales.revenue,
    }))
    .filter(tp => tp.product)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Calculate top clients
  const clientSales = new Map<string, { orderCount: number; revenue: number }>();
  filteredOrders.forEach(order => {
    if (order.clientId) {
      const existing = clientSales.get(order.clientId) || { orderCount: 0, revenue: 0 };
      clientSales.set(order.clientId, {
        orderCount: existing.orderCount + 1,
        revenue: existing.revenue + order.total,
      });
    }
  });

  const topClients: TopClient[] = Array.from(clientSales.entries())
    .map(([clientId, sales]) => ({
      client: clients.find(c => c.id === clientId)!,
      orderCount: sales.orderCount,
      revenue: sales.revenue,
    }))
    .filter(tc => tc.client)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading sales data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <TrendingUp className="w-6 h-6 text-primary mr-2" />
          <h2 className="text-2xl font-bold text-gray-900">Sales Report</h2>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center space-x-4">
          <Calendar className="w-5 h-5 text-gray-400" />
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              />
            </div>
          </div>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                  <dd className="text-lg font-medium text-gray-900">${metrics.totalRevenue.toFixed(2)}</dd>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
                  <dd className="text-lg font-medium text-gray-900">{metrics.totalOrders}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg Order Value</dt>
                  <dd className="text-lg font-medium text-gray-900">${metrics.averageOrderValue.toFixed(2)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Truck className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Delivery Orders</dt>
                  <dd className="text-lg font-medium text-gray-900">{metrics.deliveryOrders}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Breakdown</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Store className="w-5 h-5 text-blue-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">In-Store Sales</span>
              </div>
              <span className="text-sm font-medium text-gray-900">${metrics.inStoreRevenue.toFixed(2)}</span>
            </div>
            <div className="text-xs text-gray-500">{metrics.inStoreOrders} orders</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${metrics.totalRevenue > 0 ? (metrics.inStoreRevenue / metrics.totalRevenue) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Truck className="w-5 h-5 text-yellow-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Delivery Sales</span>
              </div>
              <span className="text-sm font-medium text-gray-900">${metrics.deliveryRevenue.toFixed(2)}</span>
            </div>
            <div className="text-xs text-gray-500">{metrics.deliveryOrders} orders</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-yellow-500 h-2 rounded-full"
                style={{ width: `${metrics.totalRevenue > 0 ? (metrics.deliveryRevenue / metrics.totalRevenue) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">Top Products by Revenue</h3>
        </div>
        {topProducts.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No product data available for this date range
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity Sold</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topProducts.map((tp, index) => (
                  <tr key={tp.product.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{tp.product.name}</div>
                      <div className="text-sm text-gray-500">{tp.product.sku}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {tp.quantity} {tp.product.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                      ${tp.revenue.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top Clients */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">Top Clients by Revenue</h3>
        </div>
        {topClients.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No client data available for this date range
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Orders</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topClients.map((tc, index) => (
                  <tr key={tc.client.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{tc.client.name}</div>
                      <div className="text-sm text-gray-500">{tc.client.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {tc.orderCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                      ${tc.revenue.toFixed(2)}
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
