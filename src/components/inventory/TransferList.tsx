/**
 * Inventory Transfer List & Management
 *
 * Features:
 * - View all inventory transfers
 * - Create new transfers
 * - Filter by status, location
 * - Approve transfers
 * - Track transfer status
 * - Receive transfers at destination
 */

import { useState, useEffect } from 'react';
import { ArrowRightLeft, Plus, Search, Filter, Eye, Truck, Package } from 'lucide-react';
import * as mockInventory from '@/lib/mock-inventory';
import type { Transfer, TransferStatus, Location } from '@/types';
import NewTransferModal from './NewTransferModal';
import TransferDetailModal from './TransferDetailModal';

export default function TransferList() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TransferStatus | 'all'>('all');
  const [showNewTransferModal, setShowNewTransferModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      // Load locations
      const locationData = mockInventory.getLocations();
      setLocations(locationData);

      // TODO: Load transfers from API
      // For now, create empty array
      const mockTransfers: Transfer[] = [];
      setTransfers(mockTransfers);
    } catch (error) {
      console.error('Error loading transfers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewTransfer = (transfer: Transfer) => {
    setSelectedTransfer(transfer);
    setShowDetailModal(true);
  };

  const handleTransferSaved = () => {
    loadData();
    setShowNewTransferModal(false);
    setShowDetailModal(false);
    setSelectedTransfer(null);
  };

  // Filter transfers
  const filteredTransfers = transfers.filter(transfer => {
    const matchesSearch = !searchTerm ||
      transfer.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.fromLocation?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.toLocation?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || transfer.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Get status badge
  const getStatusBadge = (status: TransferStatus) => {
    const badges = {
      pending: { color: 'gray', icon: Package, label: 'Pending' },
      approved: { color: 'blue', icon: Package, label: 'Approved' },
      in_transit: { color: 'yellow', icon: Truck, label: 'In Transit' },
      partially_received: { color: 'yellow', icon: Package, label: 'Partially Received' },
      received: { color: 'green', icon: Package, label: 'Received' },
      cancelled: { color: 'red', icon: Package, label: 'Cancelled' },
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
        <div className="text-gray-500">Loading transfers...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <ArrowRightLeft className="w-6 h-6 text-primary mr-2" />
          <h2 className="text-2xl font-bold text-gray-900">Inventory Transfers</h2>
        </div>
        <button
          onClick={() => setShowNewTransferModal(true)}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 inline-block mr-2" />
          New Transfer
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
              placeholder="Search by transfer number or location..."
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
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="in_transit">In Transit</option>
              <option value="partially_received">Partially Received</option>
              <option value="received">Received</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transfers Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {filteredTransfers.length === 0 ? (
          <div className="p-12 text-center">
            <ArrowRightLeft className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {transfers.length === 0
                ? 'No transfers yet. Create your first transfer to move inventory between locations.'
                : 'No transfers found matching your filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transfer #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    From Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    To Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
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
                {filteredTransfers.map((transfer) => (
                  <tr key={transfer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{transfer.number}</div>
                      <div className="text-sm text-gray-500">
                        {transfer.lineItems.length} item{transfer.lineItems.length !== 1 ? 's' : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transfer.fromLocation?.name || transfer.fromLocationId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transfer.toLocation?.name || transfer.toLocationId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transfer.requestedDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(transfer.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewTransfer(transfer)}
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
      {showNewTransferModal && (
        <NewTransferModal
          locations={locations}
          onClose={() => setShowNewTransferModal(false)}
          onSaved={handleTransferSaved}
        />
      )}

      {showDetailModal && selectedTransfer && (
        <TransferDetailModal
          transfer={selectedTransfer}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedTransfer(null);
          }}
          onUpdated={handleTransferSaved}
        />
      )}
    </div>
  );
}
