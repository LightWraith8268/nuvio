/**
 * Estimate List Component
 *
 * View and manage estimates (quotes) with ability to approve them into delivery orders.
 *
 * Features:
 * - List all estimates with search and filtering
 * - View estimate details
 * - Approve estimate → convert to delivery order
 * - Edit estimate before approval
 * - Cancel/reject estimates
 */

import { useState, useEffect } from 'react';
import { FileText, Search, Calendar, DollarSign, CheckCircle, XCircle, Edit } from 'lucide-react';
import { invoissAPI } from '@/lib/invoiss-api';
import type { Order } from '@/types';
import EstimateDetailModal from './EstimateDetailModal';

export default function EstimateList() {
  const [estimates, setEstimates] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEstimate, setSelectedEstimate] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadEstimates();
  }, []);

  const loadEstimates = async () => {
    setLoading(true);
    try {
      const allOrders = await invoissAPI.listOrders();
      // Filter to only show estimates
      const estimateOrders = allOrders.filter(order => order.type === 'ESTIMATE');
      setEstimates(estimateOrders);
    } catch (error) {
      console.error('Error loading estimates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewEstimate = (estimate: Order) => {
    setSelectedEstimate(estimate);
    setShowDetailModal(true);
  };

  const handleEstimateApproved = () => {
    loadEstimates(); // Reload list after approval
    setShowDetailModal(false);
  };

  // Filter estimates by search term
  const filteredEstimates = estimates.filter(estimate => {
    const searchLower = searchTerm.toLowerCase();
    return (
      estimate.number.toLowerCase().includes(searchLower) ||
      estimate.client.name.toLowerCase().includes(searchLower) ||
      estimate.client.email?.toLowerCase().includes(searchLower)
    );
  });

  // Separate estimates by status
  const activeEstimates = filteredEstimates.filter(e => e.status === 'ESTIMATE');
  const approvedEstimates = filteredEstimates.filter(e => e.status === 'CONFIRMED');
  const cancelledEstimates = filteredEstimates.filter(e => e.status === 'CANCELLED');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading estimates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <FileText className="w-6 h-6 text-primary mr-2" />
          <h1 className="text-2xl font-bold text-gray-900">Estimates</h1>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Estimates</dt>
                  <dd className="text-lg font-medium text-gray-900">{activeEstimates.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Approved</dt>
                  <dd className="text-lg font-medium text-gray-900">{approvedEstimates.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Value</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ${activeEstimates.reduce((sum, e) => sum + e.grandTotal, 0).toFixed(2)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center">
          <Search className="w-5 h-5 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search estimates by number, client name, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 border-0 focus:ring-0 text-sm"
          />
        </div>
      </div>

      {/* Estimates Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">Pending Estimates</h3>
        </div>
        {activeEstimates.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No pending estimates found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estimate #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivery Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activeEstimates.map((estimate) => (
                  <tr
                    key={estimate.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleViewEstimate(estimate)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">
                      {estimate.number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{estimate.client.name}</div>
                      <div className="text-sm text-gray-500">{estimate.client.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {estimate.metadata?.delivery?.scheduledDate ? (
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                          {new Date(estimate.metadata.delivery.scheduledDate).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                      ${estimate.grandTotal.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(estimate.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <FileText className="w-3 h-3 mr-1" />
                        Estimate
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewEstimate(estimate);
                        }}
                        className="text-primary hover:text-primary-dark"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Approved Estimates */}
      {approvedEstimates.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="text-lg font-medium text-gray-900">Approved Estimates</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estimate #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approved</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {approvedEstimates.map((estimate) => (
                  <tr
                    key={estimate.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleViewEstimate(estimate)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">
                      {estimate.number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{estimate.client.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                      ${estimate.grandTotal.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(estimate.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Approved
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedEstimate && (
        <EstimateDetailModal
          estimate={selectedEstimate}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedEstimate(null);
          }}
          onApproved={handleEstimateApproved}
        />
      )}
    </div>
  );
}
