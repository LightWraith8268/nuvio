import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { invoissAPI } from '@/lib/invoiss-api';
import type { Client } from '@/types';

interface NewAccountModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewAccountModal({ onClose, onSuccess }: NewAccountModalProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [formData, setFormData] = useState({
    creditLimit: '5000',
    terms: 'net_30' as 'net_15' | 'net_30' | 'net_60' | 'net_90' | 'due_on_receipt',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    try {
      const data = await invoissAPI.listClients();
      // Filter out clients that already have house accounts
      const clientsWithoutAccounts = data.filter(c => !c.houseAccount);
      setClients(clientsWithoutAccounts);
    } catch (error) {
      console.error('Failed to load clients:', error);
    }
  }

  const filteredClients = clients.filter(client =>
    client.name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.email?.toLowerCase().includes(clientSearch.toLowerCase())
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedClient) {
      alert('Please select a client');
      return;
    }

    const creditLimit = parseFloat(formData.creditLimit);
    if (!creditLimit || creditLimit <= 0) {
      alert('Please enter a valid credit limit');
      return;
    }

    setSaving(true);

    try {
      // In real implementation, would call API to create house account
      // For now, just simulate success
      await new Promise(resolve => setTimeout(resolve, 500));

      onSuccess();
    } catch (error) {
      console.error('Failed to create house account:', error);
      alert('Failed to create house account. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Create House Account</h3>
            <p className="text-sm text-gray-500 mt-1">Set up a new house account for a client</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Client Selection */}
            {!selectedClient ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Client
                </label>
                <input
                  type="text"
                  placeholder="Search clients by name or email..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm mb-3"
                />

                {clients.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                    <p>All clients already have house accounts</p>
                    <p className="text-sm mt-2">Create a new client first to add a house account</p>
                  </div>
                ) : (
                  <div className="border rounded-md max-h-64 overflow-y-auto">
                    {filteredClients.map(client => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => setSelectedClient(client)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{client.name}</p>
                          {client.email && (
                            <p className="text-sm text-gray-500">{client.email}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Selected Client Display */}
                <div className="bg-primary/5 border border-primary rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-600">Selected Client</p>
                      <p className="font-medium text-gray-900 mt-1">{selectedClient.name}</p>
                      {selectedClient.email && (
                        <p className="text-sm text-gray-500">{selectedClient.email}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedClient(null)}
                      className="text-sm text-primary hover:text-primary/80"
                    >
                      Change
                    </button>
                  </div>
                </div>

                {/* Account Settings */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Credit Limit *
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.creditLimit}
                        onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                        className="block w-full pl-7 pr-12 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                        placeholder="5000.00"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Maximum credit this client can use
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Payment Terms *
                    </label>
                    <select
                      value={formData.terms}
                      onChange={(e) => setFormData({ ...formData, terms: e.target.value as any })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    >
                      <option value="due_on_receipt">Due on Receipt</option>
                      <option value="net_15">Net 15 Days</option>
                      <option value="net_30">Net 30 Days</option>
                      <option value="net_60">Net 60 Days</option>
                      <option value="net_90">Net 90 Days</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Payment due date after invoice
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Notes (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                      placeholder="Internal notes about this account..."
                    />
                  </div>
                </div>

                {/* Account Summary Preview */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Account Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Starting Balance:</span>
                      <span className="font-medium text-gray-900">$0.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Credit Limit:</span>
                      <span className="font-medium text-gray-900">
                        ${parseFloat(formData.creditLimit || '0').toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Available Credit:</span>
                      <span className="font-medium text-green-600">
                        ${parseFloat(formData.creditLimit || '0').toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-gray-600">Payment Terms:</span>
                      <span className="font-medium text-gray-900 capitalize">
                        {formData.terms.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </form>
        </div>

        {/* Footer */}
        {selectedClient && (
          <div className="flex gap-3 p-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create House Account'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
