/**
 * Vendor List & Management
 *
 * Features:
 * - View all vendors
 * - Create new vendors
 * - Edit existing vendors
 * - Filter active/inactive vendors
 * - Search by name, contact, email
 */

import { useState, useEffect } from 'react';
import { Building2, Plus, Edit, Search, CheckCircle, XCircle } from 'lucide-react';
import type { Vendor } from '@/types';
import NewVendorModal from './NewVendorModal';
import EditVendorModal from './EditVendorModal';

export default function VendorList() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [showNewVendorModal, setShowNewVendorModal] = useState(false);
  const [showEditVendorModal, setShowEditVendorModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      // TODO: Implement API call
      // For now, create mock vendors
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
    } catch (error) {
      console.error('Error loading vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setShowEditVendorModal(true);
  };

  const handleVendorSaved = () => {
    loadVendors();
    setShowNewVendorModal(false);
    setShowEditVendorModal(false);
    setSelectedVendor(null);
  };

  // Filter vendors
  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = !searchTerm ||
      vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && vendor.isActive) ||
      (statusFilter === 'inactive' && !vendor.isActive);

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading vendors...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Building2 className="w-6 h-6 text-primary mr-2" />
          <h2 className="text-2xl font-bold text-gray-900">Vendors</h2>
        </div>
        <button
          onClick={() => setShowNewVendorModal(true)}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 inline-block mr-2" />
          New Vendor
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
              placeholder="Search vendors..."
              className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            >
              <option value="active">Active Vendors</option>
              <option value="inactive">Inactive Vendors</option>
              <option value="all">All Vendors</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {filteredVendors.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No vendors found matching your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Terms
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
                {filteredVendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{vendor.name}</div>
                      {vendor.accountNumber && (
                        <div className="text-sm text-gray-500">Account: {vendor.accountNumber}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{vendor.contactName || '—'}</div>
                      <div className="text-sm text-gray-500">{vendor.email || '—'}</div>
                      {vendor.phone && (
                        <div className="text-sm text-gray-500">{vendor.phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {vendor.paymentTerms ? vendor.paymentTerms.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {vendor.isActive ? (
                        <span className="inline-flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                          <span className="text-sm text-green-700">Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center">
                          <XCircle className="w-4 h-4 text-red-500 mr-1" />
                          <span className="text-sm text-red-700">Inactive</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditVendor(vendor)}
                        className="text-primary hover:text-primary/90"
                      >
                        <Edit className="w-4 h-4" />
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
      {showNewVendorModal && (
        <NewVendorModal
          onClose={() => setShowNewVendorModal(false)}
          onSaved={handleVendorSaved}
        />
      )}

      {showEditVendorModal && selectedVendor && (
        <EditVendorModal
          vendor={selectedVendor}
          onClose={() => {
            setShowEditVendorModal(false);
            setSelectedVendor(null);
          }}
          onSaved={handleVendorSaved}
        />
      )}
    </div>
  );
}
