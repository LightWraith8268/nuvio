import { useState } from 'react';
import { X, Edit2, CreditCard, MapPin, DollarSign, Save, Star, ShieldCheck, Building2 } from 'lucide-react';
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
  const [isTaxExempt, setIsTaxExempt] = useState(client.isTaxExempt || false);
  const [taxExemptCertificateNumber, setTaxExemptCertificateNumber] = useState(
    client.taxExemptCertificate?.number || ''
  );
  const [taxExemptExpirationDate, setTaxExemptExpirationDate] = useState(
    client.taxExemptCertificate?.expirationDate || ''
  );
  const [taxExemptIssuingState, setTaxExemptIssuingState] = useState(
    client.taxExemptCertificate?.issuingState || ''
  );
  const [isCommercial, setIsCommercial] = useState(client.commercialSetup?.isCommercial || false);
  const [companyName, setCompanyName] = useState(client.commercialSetup?.companyName || '');
  const [taxId, setTaxId] = useState(client.commercialSetup?.taxId || '');
  const [creditLimit, setCreditLimit] = useState(
    client.commercialSetup?.creditLimit?.toString() || ''
  );
  const [paymentTerms, setPaymentTerms] = useState<'net_15' | 'net_30' | 'net_60' | 'net_90' | 'due_on_receipt'>(
    client.commercialSetup?.paymentTerms || 'net_30'
  );
  const [commercialPriceBook, setCommercialPriceBook] = useState(
    client.commercialSetup?.commercialPriceBook || ''
  );
  const [accountManager, setAccountManager] = useState(client.commercialSetup?.accountManager || '');
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
      // Build tax exemption certificate if applicable
      const taxExemptCertificate = isTaxExempt && taxExemptCertificateNumber
        ? {
            number: taxExemptCertificateNumber,
            expirationDate: taxExemptExpirationDate,
            issuingState: taxExemptIssuingState
          }
        : undefined;

      // Build commercial setup if applicable
      const commercialSetup = isCommercial
        ? {
            isCommercial: true,
            companyName,
            taxId,
            creditLimit: creditLimit ? parseFloat(creditLimit) : undefined,
            paymentTerms,
            commercialPriceBook: commercialPriceBook || undefined,
            accountManager: accountManager || undefined
          }
        : undefined;

      const updatedClient = await invoissAPI.updateClient(client.id, {
        name,
        email,
        phone,
        priceBook,
        billing: billingAddress,
        shipping: shippingAddress,
        isTaxExempt,
        taxExemptCertificate,
        commercialSetup
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
    setIsTaxExempt(client.isTaxExempt || false);
    setTaxExemptCertificateNumber(client.taxExemptCertificate?.number || '');
    setTaxExemptExpirationDate(client.taxExemptCertificate?.expirationDate || '');
    setTaxExemptIssuingState(client.taxExemptCertificate?.issuingState || '');
    setIsCommercial(client.commercialSetup?.isCommercial || false);
    setCompanyName(client.commercialSetup?.companyName || '');
    setTaxId(client.commercialSetup?.taxId || '');
    setCreditLimit(client.commercialSetup?.creditLimit?.toString() || '');
    setPaymentTerms(client.commercialSetup?.paymentTerms || 'net_30');
    setCommercialPriceBook(client.commercialSetup?.commercialPriceBook || '');
    setAccountManager(client.commercialSetup?.accountManager || '');
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

          {/* Tax Exemption */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Tax Exemption
            </h4>

            {isEditing ? (
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isTaxExempt"
                    checked={isTaxExempt}
                    onChange={(e) => setIsTaxExempt(e.target.checked)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="isTaxExempt" className="ml-2 block text-sm font-medium text-gray-700">
                    Tax Exempt
                  </label>
                </div>
                <p className="text-xs text-gray-500 ml-6">
                  Mark this client as tax-exempt (no sales tax will be charged)
                </p>

                {isTaxExempt && (
                  <div className="ml-6 space-y-3 p-3 bg-gray-50 rounded border border-gray-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Certificate Number (Optional)
                      </label>
                      <input
                        type="text"
                        value={taxExemptCertificateNumber}
                        onChange={(e) => setTaxExemptCertificateNumber(e.target.value)}
                        placeholder="e.g., TX-123456789"
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Expiration Date (Optional)
                        </label>
                        <input
                          type="date"
                          value={taxExemptExpirationDate}
                          onChange={(e) => setTaxExemptExpirationDate(e.target.value)}
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Issuing State (Optional)
                        </label>
                        <input
                          type="text"
                          value={taxExemptIssuingState}
                          onChange={(e) => setTaxExemptIssuingState(e.target.value)}
                          placeholder="e.g., TX"
                          maxLength={2}
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary uppercase"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {client.isTaxExempt ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded font-medium flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4" />
                        Tax Exempt
                      </span>
                    </div>
                    {client.taxExemptCertificate && (
                      <div className="ml-6 text-sm space-y-1">
                        {client.taxExemptCertificate.number && (
                          <p className="text-gray-700">
                            <span className="font-medium">Certificate:</span> {client.taxExemptCertificate.number}
                          </p>
                        )}
                        {client.taxExemptCertificate.expirationDate && (
                          <p className="text-gray-700">
                            <span className="font-medium">Expires:</span>{' '}
                            {new Date(client.taxExemptCertificate.expirationDate).toLocaleDateString()}
                          </p>
                        )}
                        {client.taxExemptCertificate.issuingState && (
                          <p className="text-gray-700">
                            <span className="font-medium">Issuing State:</span> {client.taxExemptCertificate.issuingState}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">Not tax exempt</p>
                )}
              </div>
            )}
          </div>

          {/* Commercial Setup */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Commercial Account
            </h4>

            {isEditing ? (
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isCommercial"
                    checked={isCommercial}
                    onChange={(e) => setIsCommercial(e.target.checked)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="isCommercial" className="ml-2 block text-sm font-medium text-gray-700">
                    Commercial Account
                  </label>
                </div>
                <p className="text-xs text-gray-500 ml-6">
                  Mark this client as a commercial account with special pricing and terms
                </p>

                {isCommercial && (
                  <div className="ml-6 space-y-3 p-3 bg-gray-50 rounded border border-gray-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g., ABC Construction Inc."
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tax ID (Optional)
                        </label>
                        <input
                          type="text"
                          value={taxId}
                          onChange={(e) => setTaxId(e.target.value)}
                          placeholder="e.g., 12-3456789"
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Credit Limit (Optional)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={creditLimit}
                          onChange={(e) => setCreditLimit(e.target.value)}
                          placeholder="e.g., 10000.00"
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Payment Terms
                        </label>
                        <select
                          value={paymentTerms}
                          onChange={(e) => setPaymentTerms(e.target.value as any)}
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                        >
                          <option value="due_on_receipt">Due on Receipt</option>
                          <option value="net_15">Net 15</option>
                          <option value="net_30">Net 30</option>
                          <option value="net_60">Net 60</option>
                          <option value="net_90">Net 90</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Commercial Price Book (Optional)
                        </label>
                        <input
                          type="text"
                          value={commercialPriceBook}
                          onChange={(e) => setCommercialPriceBook(e.target.value)}
                          placeholder="e.g., commercial-tier-1"
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Manager (Optional)
                      </label>
                      <input
                        type="text"
                        value={accountManager}
                        onChange={(e) => setAccountManager(e.target.value)}
                        placeholder="e.g., John Smith"
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {client.commercialSetup?.isCommercial ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded font-medium flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        Commercial Account
                      </span>
                    </div>
                    <div className="ml-6 text-sm space-y-1">
                      {client.commercialSetup.companyName && (
                        <p className="text-gray-700">
                          <span className="font-medium">Company:</span> {client.commercialSetup.companyName}
                        </p>
                      )}
                      {client.commercialSetup.taxId && (
                        <p className="text-gray-700">
                          <span className="font-medium">Tax ID:</span> {client.commercialSetup.taxId}
                        </p>
                      )}
                      {client.commercialSetup.creditLimit && (
                        <p className="text-gray-700">
                          <span className="font-medium">Credit Limit:</span> ${client.commercialSetup.creditLimit.toFixed(2)}
                        </p>
                      )}
                      {client.commercialSetup.paymentTerms && (
                        <p className="text-gray-700">
                          <span className="font-medium">Payment Terms:</span>{' '}
                          {client.commercialSetup.paymentTerms.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                      )}
                      {client.commercialSetup.commercialPriceBook && (
                        <p className="text-gray-700">
                          <span className="font-medium">Price Book:</span> {client.commercialSetup.commercialPriceBook}
                        </p>
                      )}
                      {client.commercialSetup.accountManager && (
                        <p className="text-gray-700">
                          <span className="font-medium">Account Manager:</span> {client.commercialSetup.accountManager}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Not a commercial account</p>
                )}
              </div>
            )}
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
