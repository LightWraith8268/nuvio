import { useState } from 'react';
import { X, Edit2, CreditCard, MapPin, DollarSign, Save, Star } from 'lucide-react';
import { invoissAPI } from '@/lib/invoiss-api';
import { useAuth } from '@/contexts/AuthContext';
import type { Client } from '@/types';

interface ClientDetailModalProps {
  client: Client;
  onClose: () => void;
  onUpdate: (updatedClient: Client) => void;
}

export default function ClientDetailModal({ client, onClose, onUpdate }: ClientDetailModalProps) {
  const { hasPermission } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [name, setName] = useState(client.name || '');
  const [email, setEmail] = useState(client.email || '');
  const [phone, setPhone] = useState(client.phone || '');
  const [priceBook, setPriceBook] = useState<'retail' | 'contractor'>(client.priceBook || 'retail');
  const [billingAddress, setBillingAddress] = useState({
    street: client.billing?.street || '',
    city: client.billing?.city || '',
    state: client.billing?.state || '',
    zip: client.billing?.zip || ''
  });
  const [shippingAddress, setShippingAddress] = useState({
    street: client.shipping?.street || '',
    city: client.shipping?.city || '',
    state: client.shipping?.state || '',
    zip: client.shipping?.zip || ''
  });

  async function handleSave() {
    if (!name || !email || !phone) {
      setError('Name, email, and phone are required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const updatedClient = await invoissAPI.updateClient(client.id, {
        name,
        email,
        phone,
        priceBook,
        billing: billingAddress,
        shipping: shippingAddress
      });

      onUpdate(updatedClient);
      setIsEditing(false);
    } catch (err) {
      setError('Failed to update client. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    // Reset form to original values
    setName(client.name || '');
    setEmail(client.email || '');
    setPhone(client.phone || '');
    setPriceBook(client.priceBook || 'retail');
    setBillingAddress({
      street: client.billing?.street || '',
      city: client.billing?.city || '',
      state: client.billing?.state || '',
      zip: client.billing?.zip || ''
    });
    setShippingAddress({
      street: client.shipping?.street || '',
      city: client.shipping?.city || '',
      state: client.shipping?.state || '',
      zip: client.shipping?.zip || ''
    });
    setIsEditing(false);
    setError('');
  }

  async function handleSetAsDefault() {
    if (!hasPermission('setDefaultClient')) {
      setError('You do not have permission to set the default client');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // First, remove default from all other clients
      const allClients = await invoissAPI.listClients();
      for (const c of allClients) {
        if (c.id !== client.id && c.metadata?.isDefault) {
          await invoissAPI.updateClient(c.id, {
            metadata: { ...c.metadata, isDefault: false }
          });
        }
      }

      // Set this client as default
      const updatedClient = await invoissAPI.updateClient(client.id, {
        metadata: { ...client.metadata, isDefault: true }
      });

      onUpdate(updatedClient);
    } catch (err) {
      setError('Failed to set as default. Please try again.');
    } finally {
      setSaving(false);
    }
  }


  const isDefault = client.metadata?.isDefault;
  const canEdit = hasPermission('editClients');
  const canSetDefault = hasPermission('setDefaultClient');

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-medium text-gray-900">
              {isEditing ? 'Edit Client' : 'Client Details'}
            </h3>
            {isDefault && (
              <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded font-medium flex items-center gap-1">
                <Star className="w-3 h-3 fill-current" />
                Default
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && canEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-1"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            )}
            {!isEditing && canSetDefault && !isDefault && (
              <button
                onClick={handleSetAsDefault}
                disabled={saving}
                className="px-3 py-1.5 text-sm text-white bg-yellow-500 rounded hover:bg-yellow-600 disabled:opacity-50 flex items-center gap-1"
              >
                <Star className="w-4 h-4" />
                Set as Default
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Basic Information</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                  />
                ) : (
                  <p className="text-gray-900">{client.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                  />
                ) : (
                  <p className="text-gray-900">{client.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                  />
                ) : (
                  <p className="text-gray-900">{client.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Price Book
                </label>
                {isEditing ? (
                  <select
                    value={priceBook}
                    onChange={(e) => setPriceBook(e.target.value as 'retail' | 'contractor')}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                  >
                    <option value="retail">Retail Pricing</option>
                    <option value="contractor">Contractor Pricing</option>
                  </select>
                ) : (
                  <p className="text-gray-900 capitalize">{client.priceBook || 'retail'} Pricing</p>
                )}
              </div>
            </div>
          </div>

          {/* Billing Address */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Billing Address
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={billingAddress.street}
                    onChange={(e) => setBillingAddress({ ...billingAddress, street: e.target.value })}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                  />
                ) : (
                  <p className="text-gray-900">{client.billing?.street || '-'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={billingAddress.city}
                    onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                  />
                ) : (
                  <p className="text-gray-900">{client.billing?.city || '-'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={billingAddress.state}
                    onChange={(e) => setBillingAddress({ ...billingAddress, state: e.target.value })}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                  />
                ) : (
                  <p className="text-gray-900">{client.billing?.state || '-'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={billingAddress.zip}
                    onChange={(e) => setBillingAddress({ ...billingAddress, zip: e.target.value })}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                  />
                ) : (
                  <p className="text-gray-900">{client.billing?.zip || '-'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Shipping Address
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={shippingAddress.street}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                  />
                ) : (
                  <p className="text-gray-900">{client.shipping?.street || '-'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                  />
                ) : (
                  <p className="text-gray-900">{client.shipping?.city || '-'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={shippingAddress.state}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                  />
                ) : (
                  <p className="text-gray-900">{client.shipping?.state || '-'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={shippingAddress.zip}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, zip: e.target.value })}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                  />
                ) : (
                  <p className="text-gray-900">{client.shipping?.zip || '-'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Saved Cards */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Saved Cards
            </h4>

            {client.savedCards && client.savedCards.length > 0 ? (
              <div className="space-y-2">
                {client.savedCards.map((card) => (
                  <div
                    key={card.id}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg"
                  >
                    <CreditCard className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {card.brand} •••• {card.last4}
                      </p>
                      <p className="text-xs text-gray-500">
                        Expires {card.expiryMonth}/{card.expiryYear}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No saved cards</p>
            )}
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
