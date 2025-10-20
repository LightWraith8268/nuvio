import { useState, useEffect } from 'react';
import { Calendar, MapPin, Package, Truck, Clock, Search, Filter } from 'lucide-react';
import { invoissAPI } from '@/lib/invoiss-api';
import type { Order, DeliveryRoute } from '@/types';

export default function DeliveryList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'out_for_delivery' | 'delivered'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadDeliveries();
  }, [selectedDate, filterStatus]);

  async function loadDeliveries() {
    try {
      setLoading(true);
      const allOrders = await invoissAPI.listOrders({ type: 'ORDER' });

      // Filter delivery orders for the selected date
      const deliveryOrders = allOrders.filter(order => {
        const isDelivery = order.metadata?.orderType === 'delivery';
        const scheduledDate = order.metadata?.delivery?.scheduledDate;
        const matchesDate = scheduledDate?.startsWith(selectedDate);

        if (filterStatus === 'all') {
          return isDelivery && matchesDate;
        }

        const statusMap = {
          'scheduled': 'SCHEDULED',
          'out_for_delivery': 'OUT_FOR_DELIVERY',
          'delivered': 'DELIVERED'
        };

        return isDelivery && matchesDate && order.status === statusMap[filterStatus];
      });

      setOrders(deliveryOrders);

      // Group into routes (simplified for now)
      // In real implementation, this would come from the API
      const groupedRoutes: DeliveryRoute[] = [];
      setRoutes(groupedRoutes);
    } catch (error) {
      console.error('Failed to load deliveries:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      order.number.toLowerCase().includes(searchLower) ||
      order.client.name?.toLowerCase().includes(searchLower) ||
      order.metadata?.delivery?.address.street?.toLowerCase().includes(searchLower)
    );
  });

  // Group orders by status
  const scheduledOrders = filteredOrders.filter(o => o.status === 'SCHEDULED');
  const outForDeliveryOrders = filteredOrders.filter(o => o.status === 'OUT_FOR_DELIVERY');
  const deliveredOrders = filteredOrders.filter(o => o.status === 'DELIVERED');

  function getStatusColor(status: string) {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800';
      case 'OUT_FOR_DELIVERY': return 'bg-yellow-100 text-yellow-800';
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'SCHEDULED': return 'Scheduled';
      case 'OUT_FOR_DELIVERY': return 'Out for Delivery';
      case 'DELIVERED': return 'Delivered';
      default: return status;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading deliveries...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Deliveries</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage scheduled deliveries and routes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary text-sm"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-lg shadow-sm border">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by order number, client, or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Deliveries
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {filteredOrders.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Scheduled
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {scheduledOrders.length}
                  </dd>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Out for Delivery
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {outForDeliveryOrders.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-6 w-6 text-green-400">✓</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Delivered
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {deliveredOrders.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deliveries List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {filteredOrders.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            {searchTerm ? 'No deliveries found matching your search.' : `No deliveries scheduled for ${selectedDate}`}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredOrders.map((order) => {
              const delivery = order.metadata?.delivery;

              return (
                <li key={order.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-medium text-primary">
                            Order #{order.number}
                          </p>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusColor(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {delivery?.timeSlot || 'No time set'}
                        </div>
                      </div>

                      <div className="flex items-start gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 flex-shrink-0" />
                          <span className="font-medium text-gray-900">{order.client.name}</span>
                        </div>

                        {delivery?.address && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span>
                              {delivery.address.street}, {delivery.address.city}, {delivery.address.state} {delivery.address.zip}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                        <span>{order.lineItems.length} items</span>
                        <span>•</span>
                        <span>${order.grandTotal.toFixed(2)}</span>
                        {delivery?.driverId && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Truck className="w-3 h-3" />
                              Driver assigned
                            </span>
                          </>
                        )}
                        {delivery?.notes && (
                          <>
                            <span>•</span>
                            <span className="italic">{delivery.notes}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="ml-4 flex-shrink-0">
                      <button className="text-sm text-primary hover:text-primary/80 font-medium">
                        View Details →
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Route Planning Section */}
      {filteredOrders.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Truck className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900">
                Route Optimization Available
              </h3>
              <p className="mt-1 text-sm text-blue-700">
                {scheduledOrders.length} deliveries are ready to be assigned to drivers and optimized for efficient routing.
              </p>
              <button className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700">
                Create Delivery Routes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
