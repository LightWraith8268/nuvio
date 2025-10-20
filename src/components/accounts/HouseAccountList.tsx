import { useState, useEffect } from 'react';
import { Search, Plus, DollarSign, AlertTriangle, CheckCircle, XCircle, TrendingUp, TrendingDown, Calendar, FileText } from 'lucide-react';
import { invoissAPI } from '@/lib/invoiss-api';
import type { Client, HouseAccount, HouseAccountTransaction } from '@/types';
import AccountDetailModal from './AccountDetailModal';
import NewAccountModal from './NewAccountModal';

export default function HouseAccountList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended' | 'overdue'>('all');
  const [selectedAccount, setSelectedAccount] = useState<Client | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showNewAccountModal, setShowNewAccountModal] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    try {
      setLoading(true);
      const data = await invoissAPI.listClients();
      setClients(data);
    } catch (error) {
      console.error('Failed to load accounts:', error);
    } finally {
      setLoading(false);
    }
  }

  const clientsWithAccounts = clients.filter(c => c.houseAccount);

  // Normalize phone numbers by removing all non-digit characters for search comparison
  function normalizePhone(phone?: string): string {
    return phone?.replace(/\D/g, '') || '';
  }

  const normalizedSearchTerm = normalizePhone(searchTerm);

  const filteredAccounts = clientsWithAccounts.filter(client => {
    const account = client.houseAccount!;
    const matchesSearch =
      client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (searchTerm && normalizePhone(client.phone).includes(normalizedSearchTerm));

    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'overdue' && account.balance < 0 && account.status === 'active') ||
      account.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  // Calculate statistics
  const stats = {
    totalAccounts: clientsWithAccounts.length,
    activeAccounts: clientsWithAccounts.filter(c => c.houseAccount?.status === 'active').length,
    totalOutstanding: clientsWithAccounts.reduce((sum, c) => sum + Math.abs(Math.min(c.houseAccount?.balance || 0, 0)), 0),
    totalAvailableCredit: clientsWithAccounts.reduce((sum, c) => sum + (c.houseAccount?.availableCredit || 0), 0),
    overdueAccounts: clientsWithAccounts.filter(c => {
      const account = c.houseAccount;
      return account && account.balance < 0 && account.status === 'active';
    }).length,
  };

  function getAccountStatusColor(account: HouseAccount) {
    if (account.status === 'suspended') return 'text-red-600 bg-red-100';
    if (account.status === 'closed') return 'text-gray-600 bg-gray-100';
    if (account.balance < 0) return 'text-orange-600 bg-orange-100';
    return 'text-green-600 bg-green-100';
  }

  function getAccountStatusIcon(account: HouseAccount) {
    if (account.status === 'suspended') return <XCircle className="w-4 h-4" />;
    if (account.status === 'closed') return <XCircle className="w-4 h-4" />;
    if (account.balance < 0) return <AlertTriangle className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  }

  function getTermsLabel(terms: string) {
    const termsMap: Record<string, string> = {
      net_15: 'Net 15',
      net_30: 'Net 30',
      net_60: 'Net 60',
      net_90: 'Net 90',
      due_on_receipt: 'Due on Receipt',
    };
    return termsMap[terms] || terms;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading house accounts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">House Accounts</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage client house accounts, credit limits, and payment terms
          </p>
        </div>
        <button
          onClick={() => setShowNewAccountModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Account
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Accounts
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalAccounts}
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
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Accounts
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.activeAccounts}
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
                <TrendingDown className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Outstanding
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ${stats.totalOutstanding.toFixed(2)}
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
                <TrendingUp className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Available Credit
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ${stats.totalAvailableCredit.toFixed(2)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search accounts by client name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="overdue">Overdue</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Overdue Alert */}
      {stats.overdueAccounts > 0 && (
        <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-orange-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-orange-700">
                <span className="font-medium">{stats.overdueAccounts} account{stats.overdueAccounts > 1 ? 's' : ''}</span> with outstanding balances requiring attention.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Accounts Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Balance
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Credit Limit
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Available
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Terms
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAccounts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  {searchTerm || filterStatus !== 'all'
                    ? 'No accounts found matching your filters.'
                    : 'No house accounts yet. Create your first account!'}
                </td>
              </tr>
            ) : (
              filteredAccounts.map((client) => {
                const account = client.houseAccount!;
                return (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {client.name}
                        </div>
                        {client.email && (
                          <div className="text-sm text-gray-500">{client.email}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full ${getAccountStatusColor(account)}`}>
                        {getAccountStatusIcon(account)}
                        {account.status === 'active' && account.balance < 0 ? 'Overdue' : account.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className={`text-sm font-medium ${account.balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ${Math.abs(account.balance).toFixed(2)}
                        {account.balance < 0 && <span className="text-xs ml-1">(owes)</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      ${account.creditLimit.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-gray-900">
                        ${account.availableCredit.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {((account.availableCredit / account.creditLimit) * 100).toFixed(0)}% available
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {getTermsLabel(account.terms)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedAccount(client);
                          setShowDetailModal(true);
                        }}
                        className="text-primary hover:text-primary/80"
                      >
                        View Details →
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showDetailModal && selectedAccount && (
        <AccountDetailModal
          client={selectedAccount}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedAccount(null);
          }}
          onUpdate={() => {
            loadAccounts();
          }}
        />
      )}

      {showNewAccountModal && (
        <NewAccountModal
          onClose={() => setShowNewAccountModal(false)}
          onSuccess={() => {
            setShowNewAccountModal(false);
            loadAccounts();
          }}
        />
      )}
    </div>
  );
}
