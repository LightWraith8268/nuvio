import { useState, useEffect } from 'react';
import { Search, Plus, CreditCard, MapPin, Phone, Mail, ShieldCheck } from 'lucide-react';
import { invoissAPI } from '@/lib/invoiss-api';
import ClientDetailModal from './ClientDetailModal';
import type { Client } from '@/types';

export default function ClientList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    try {
      setLoading(true);
      const data = await invoissAPI.listClients();
      setClients(data);
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setLoading(false);
    }
  }

  // Normalize phone numbers by removing all non-digit characters for search comparison
  function normalizePhone(phone?: string): string {
    return phone?.replace(/\D/g, '') || '';
  }

  const normalizedSearchTerm = normalizePhone(searchTerm);

  const filteredClients = clients.filter(client =>
    client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (searchTerm && normalizePhone(client.phone).includes(normalizedSearchTerm))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading clients...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your customer database and saved payment methods
          </p>
        </div>
        <button
          onClick={() => setShowNewClientModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Client
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search clients by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">👥</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Clients
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {clients.length}
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
                <CreditCard className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Cards on File
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {clients.filter(c => c.hasCardOnFile).length}
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
                <MapPin className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    With Addresses
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {clients.filter(c => c.addresses && c.addresses.length > 0).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Client List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredClients.length === 0 ? (
            <li className="px-6 py-12 text-center text-gray-500">
              {searchTerm ? 'No clients found matching your search.' : 'No clients yet. Create your first client!'}
            </li>
          ) : (
            filteredClients.map((client) => (
              <li key={client.id}>
                <div
                  onClick={() => {
                    setSelectedClient(client);
                    setShowDetailModal(true);
                  }}
                  className="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-primary truncate">
                            {client.name}
                          </p>
                          {client.metadata?.isDefault && (
                            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded font-medium">
                              Default
                            </span>
                          )}
                          {client.isTaxExempt && (
                            <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded font-medium flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              Tax Exempt
                            </span>
                          )}
                        </div>
                        {client.hasCardOnFile && (
                          <div className="ml-2 flex-shrink-0 flex">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              <CreditCard className="w-3 h-3 mr-1" />
                              Card on File
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="mt-2 flex">
                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                          {client.email && (
                            <span className="flex items-center">
                              <Mail className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                              {client.email}
                            </span>
                          )}
                          {client.phone && (
                            <span className="flex items-center">
                              <Phone className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                              {client.phone}
                            </span>
                          )}
                          {client.addresses && client.addresses.length > 0 && (
                            <span className="flex items-center">
                              <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                              {client.addresses.length} {client.addresses.length === 1 ? 'address' : 'addresses'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <button className="text-sm text-primary hover:text-primary/80 font-medium">
                        View Details →
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* New Client Modal */}
      {showNewClientModal && (
        <NewClientModal
          onClose={() => setShowNewClientModal(false)}
          onSuccess={() => {
            setShowNewClientModal(false);
            loadClients();
          }}
        />
      )}

      {/* Client Detail Modal */}
      {showDetailModal && selectedClient && (
        <ClientDetailModal
          client={selectedClient}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedClient(null);
          }}
          onUpdate={(updatedClient) => {
            // Update the client in the list
            setClients(clients.map(c => c.id === updatedClient.id ? updatedClient : c));
            setSelectedClient(updatedClient);
          }}
        />
      )}
    </div>
  );
}

export function NewClientModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    priceBook: 'retail' as 'retail' | 'contractor',
    street: '',
    city: '',
    state: '',
    zip: '',
    isTaxExempt: false,
    taxExemptCertificateNumber: '',
    taxExemptExpirationDate: '',
    taxExemptIssuingState: ''
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const addresses = formData.street ? [{
        street: formData.street,
        city: formData.city,
        state: formData.state,
        zip: formData.zip
      }] : [];

      // Build tax exemption certificate if applicable
      const taxExemptCertificate = formData.isTaxExempt && formData.taxExemptCertificateNumber
        ? {
            number: formData.taxExemptCertificateNumber,
            expirationDate: formData.taxExemptExpirationDate,
            issuingState: formData.taxExemptIssuingState
          }
        : undefined;

      await invoissAPI.createClient({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        priceBook: formData.priceBook,
        addresses,
        isTaxExempt: formData.isTaxExempt,
        taxExemptCertificate
      });

      onSuccess();
    } catch (error) {
      console.error('Failed to create client:', error);
      alert('Failed to create client. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Client</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Price Book</label>
            <select
              value={formData.priceBook}
              onChange={(e) => setFormData({ ...formData, priceBook: e.target.value as 'retail' | 'contractor' })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            >
              <option value="retail">Retail (Default)</option>
              <option value="contractor">Contractor</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Determines which pricing this client receives for products
            </p>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isTaxExempt"
                checked={formData.isTaxExempt}
                onChange={(e) => setFormData({ ...formData, isTaxExempt: e.target.checked })}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="isTaxExempt" className="ml-2 block text-sm font-medium text-gray-700">
                Tax Exempt
              </label>
            </div>
            <p className="mt-1 text-xs text-gray-500 ml-6">
              Mark this client as tax-exempt (no sales tax will be charged)
            </p>

            {formData.isTaxExempt && (
              <div className="mt-4 ml-6 space-y-3 p-3 bg-gray-50 rounded border border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Certificate Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.taxExemptCertificateNumber}
                    onChange={(e) => setFormData({ ...formData, taxExemptCertificateNumber: e.target.value })}
                    placeholder="e.g., TX-123456789"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Expiration Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={formData.taxExemptExpirationDate}
                      onChange={(e) => setFormData({ ...formData, taxExemptExpirationDate: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Issuing State (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.taxExemptIssuingState}
                      onChange={(e) => setFormData({ ...formData, taxExemptIssuingState: e.target.value })}
                      placeholder="e.g., TX"
                      maxLength={2}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm uppercase"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Address (Optional)</h4>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Street Address"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
                <input
                  type="text"
                  placeholder="State"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>

              <input
                type="text"
                placeholder="ZIP Code"
                value={formData.zip}
                onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
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
              {saving ? 'Creating...' : 'Create Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
