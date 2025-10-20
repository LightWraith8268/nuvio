/**
 * Purchase Order List & Management
 *
 * Features:
 * - View all purchase orders
 * - Create new POs
 * - Filter by status, vendor
 * - Search by PO number
 * - Approve POs
 * - Receive inventory
 */

import { useState, useEffect } from 'react';
import { FileText, Plus, Search, Filter, Eye, CheckCircle, Clock, Package } from 'lucide-react';
import type { PurchaseOrder, PurchaseOrderStatus } from '@/types';
import NewPurchaseOrderModal from './NewPurchaseOrderModal';
import PurchaseOrderDetailModal from './PurchaseOrderDetailModal';

export default function PurchaseOrderList() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | 'all'>('all');
  const [showNewPOModal, setShowNewPOModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  useEffect(() => {
    loadPurchaseOrders();
  }, []);

  const loadPurchaseOrders = async () => {
    try {
      // TODO: Implement API call
      // For now, create mock POs
      const mockPOs: PurchaseOrder[] = [];
      setPurchaseOrders(mockPOs);
    } catch (error) {
      console.error('Error loading purchase orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPO = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setShowDetailModal(true);
  };

  const handlePOSaved = () => {
    loadPurchaseOrders();
    setShowNewPOModal(false);
    setShowDetailModal(false);
    setSelectedPO(null);
  };

  // Filter POs
  const filteredPOs = purchaseOrders.filter(po => {
    const matchesSearch = !searchTerm ||
      po.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.vendor.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || po.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Get status badge
  const getStatusBadge = (status: PurchaseOrderStatus) => {
    const badges = {
      draft: { color: 'gray', icon: Clock, label: 'Draft' },
      submitted: { color: 'blue', icon: FileText, label: 'Submitted' },
      approved: { color: 'green', icon: CheckCircle, label: 'Approved' },
      partially_received: { color: 'yellow', icon: Package, label: 'Partially Received' },
      received: { color: 'green', icon: CheckCircle, label: 'Received' },
      cancelled: { color: 'red', icon: Clock, label: 'Cancelled' },
    };

    const badge = badges[status];
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${badge.color}-100 text-${badge.color}-800`}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading purchase orders...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <FileText className="w-6 h-6 text-primary mr-2" />
          <h2 className="text-2xl font-bold text-gray-900">Purchase Orders</h2>
        </div>
        <button
          onClick={() => setShowNewPOModal(true)}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 inline-block mr-2" />
          New Purchase Order
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by PO number or vendor..."
              className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="partially_received">Partially Received</option>
              <option value="received">Received</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Purchase Orders Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {filteredPOs.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {purchaseOrders.length === 0
                ? 'No purchase orders yet. Create your first PO to get started.'
                : 'No purchase orders found matching your filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PO Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPOs.map((po) => (
                  <tr key={po.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{po.number}</div>
                      {po.expectedDeliveryDate && (
                        <div className="text-sm text-gray-500">
                          Expected: {new Date(po.expectedDeliveryDate).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{po.vendor.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(po.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${po.grandTotal.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(po.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewPO(po)}
                        className="text-primary hover:text-primary/90"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showNewPOModal && (
        <NewPurchaseOrderModal
          onClose={() => setShowNewPOModal(false)}
          onSaved={handlePOSaved}
        />
      )}

      {showDetailModal && selectedPO && (
        <PurchaseOrderDetailModal
          purchaseOrder={selectedPO}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedPO(null);
          }}
          onUpdated={handlePOSaved}
        />
      )}
    </div>
  );
}
