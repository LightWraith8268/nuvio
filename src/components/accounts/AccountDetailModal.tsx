import { useState, useEffect } from 'react';
import { X, DollarSign, Plus, Minus, FileText, Calendar, TrendingUp, AlertCircle, Mail, Download, Send, Clock } from 'lucide-react';
import type { Client, HouseAccountTransaction, AccountStatement } from '@/types';

interface AccountDetailModalProps {
  client: Client;
  onClose: () => void;
  onUpdate: () => void;
}

export default function AccountDetailModal({ client, onClose, onUpdate }: AccountDetailModalProps) {
  const account = client.houseAccount!;
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'statements' | 'settings'>('overview');
  const [transactions, setTransactions] = useState<HouseAccountTransaction[]>([]);
  const [statements, setStatements] = useState<AccountStatement[]>([]);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showStatementSettings, setShowStatementSettings] = useState(false);
  const [transactionForm, setTransactionForm] = useState({
    type: 'payment' as 'charge' | 'payment' | 'credit' | 'adjustment',
    amount: '',
    description: '',
    referenceNumber: '',
  });
  const [statementSettings, setStatementSettings] = useState({
    autoSend: true,
    sendDay: 1,
    includeAgingSummary: true,
    includePaymentInstructions: true,
    customMessage: '',
    ccEmails: [] as string[],
  });

  // Mock data for now
  useEffect(() => {
    const mockTransactions: HouseAccountTransaction[] = [
      {
        id: 'txn-1',
        accountId: account.id,
        type: 'charge',
        amount: -250.00,
        balanceAfter: -250.00,
        description: 'Order #1234 - Topsoil delivery',
        orderId: 'order-1234',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'txn-2',
        accountId: account.id,
        type: 'payment',
        amount: 100.00,
        balanceAfter: -150.00,
        description: 'Payment received - Check #5678',
        referenceNumber: 'CHK-5678',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
    setTransactions(mockTransactions);

    // Mock statements
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const mockStatements: AccountStatement[] = [
      {
        id: 'stmt-1',
        accountId: account.id,
        clientId: client.id,
        period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
        startDate: thisMonth.toISOString(),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString(),
        openingBalance: -150.00,
        closingBalance: -150.00,
        totalCharges: 0,
        totalPayments: 0,
        transactions: [],
        status: 'draft',
        createdAt: thisMonth.toISOString(),
      },
      {
        id: 'stmt-2',
        accountId: account.id,
        clientId: client.id,
        period: `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`,
        startDate: lastMonth.toISOString(),
        endDate: new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0).toISOString(),
        openingBalance: 0,
        closingBalance: -150.00,
        totalCharges: 250.00,
        totalPayments: 100.00,
        transactions: mockTransactions,
        dueDate: new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 15).toISOString(),
        sentDate: new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 1).toISOString(),
        sentMethod: 'email',
        status: 'sent',
        pdfUrl: '/statements/stmt-2.pdf',
        createdAt: lastMonth.toISOString(),
      },
    ];
    setStatements(mockStatements);
  }, [account.id, client.id]);

  function handleAddTransaction() {
    const amount = parseFloat(transactionForm.amount);
    if (!amount || !transactionForm.description) {
      alert('Please fill in all required fields');
      return;
    }

    const newTransaction: HouseAccountTransaction = {
      id: `txn-${Date.now()}`,
      accountId: account.id,
      type: transactionForm.type,
      amount: transactionForm.type === 'charge' ? -Math.abs(amount) : Math.abs(amount),
      balanceAfter: account.balance + (transactionForm.type === 'charge' ? -Math.abs(amount) : Math.abs(amount)),
      description: transactionForm.description,
      referenceNumber: transactionForm.referenceNumber || undefined,
      createdAt: new Date().toISOString(),
    };

    setTransactions([newTransaction, ...transactions]);
    setShowAddTransaction(false);
    setTransactionForm({
      type: 'payment',
      amount: '',
      description: '',
      referenceNumber: '',
    });

    // In real implementation, would call API to save transaction
    onUpdate();
  }

  function getTransactionIcon(type: string) {
    switch (type) {
      case 'charge':
        return <Minus className="w-4 h-4 text-red-600" />;
      case 'payment':
        return <Plus className="w-4 h-4 text-green-600" />;
      case 'credit':
        return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case 'adjustment':
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      default:
        return <DollarSign className="w-4 h-4 text-gray-600" />;
    }
  }

  function getTransactionColor(type: string) {
    switch (type) {
      case 'charge':
        return 'text-red-600';
      case 'payment':
        return 'text-green-600';
      case 'credit':
        return 'text-blue-600';
      case 'adjustment':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  }

  const utilizationPercent = ((account.creditLimit - account.availableCredit) / account.creditLimit) * 100;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-lg font-medium text-gray-900">House Account Details</h3>
            <p className="text-sm text-gray-500 mt-1">{client.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'transactions'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => setActiveTab('statements')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'statements'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Statements
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Settings
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Account Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">Current Balance</div>
                  <div className={`text-2xl font-bold ${account.balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ${Math.abs(account.balance).toFixed(2)}
                    {account.balance < 0 && <span className="text-sm ml-2">(owes)</span>}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">Credit Limit</div>
                  <div className="text-2xl font-bold text-gray-900">
                    ${account.creditLimit.toFixed(2)}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">Available Credit</div>
                  <div className="text-2xl font-bold text-blue-600">
                    ${account.availableCredit.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Credit Utilization Bar */}
              <div>
                <div className="flex justify-between text-sm text-gray-700 mb-2">
                  <span>Credit Utilization</span>
                  <span className="font-medium">{utilizationPercent.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      utilizationPercent > 90 ? 'bg-red-500' :
                      utilizationPercent > 70 ? 'bg-orange-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
                  />
                </div>
              </div>

              {/* Account Info */}
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-gray-900">Account Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className="ml-2 font-medium capitalize">{account.status}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Terms:</span>
                    <span className="ml-2 font-medium">{account.terms.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Last Payment:</span>
                    <span className="ml-2 font-medium">
                      {account.lastPaymentDate
                        ? new Date(account.lastPaymentDate).toLocaleDateString()
                        : 'No payments yet'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Last Amount:</span>
                    <span className="ml-2 font-medium">
                      {account.lastPaymentAmount ? `$${account.lastPaymentAmount.toFixed(2)}` : 'N/A'}
                    </span>
                  </div>
                </div>
                {account.notes && (
                  <div className="pt-3 border-t">
                    <span className="text-gray-500 text-sm">Notes:</span>
                    <p className="mt-1 text-sm text-gray-900">{account.notes}</p>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setTransactionForm({ ...transactionForm, type: 'payment' });
                    setShowAddTransaction(true);
                    setActiveTab('transactions');
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
                >
                  <Plus className="inline w-4 h-4 mr-2" />
                  Record Payment
                </button>
                <button
                  onClick={() => {
                    setTransactionForm({ ...transactionForm, type: 'charge' });
                    setShowAddTransaction(true);
                    setActiveTab('transactions');
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
                >
                  <Minus className="inline w-4 h-4 mr-2" />
                  Add Charge
                </button>
              </div>
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-gray-900">Transaction History</h4>
                {!showAddTransaction && (
                  <button
                    onClick={() => setShowAddTransaction(true)}
                    className="px-3 py-1.5 text-sm bg-primary text-white rounded-md hover:bg-primary/90"
                  >
                    <Plus className="inline w-4 h-4 mr-1" />
                    Add Transaction
                  </button>
                )}
              </div>

              {/* Add Transaction Form */}
              {showAddTransaction && (
                <div className="border border-primary rounded-lg p-4 bg-primary/5 space-y-4">
                  <div className="flex justify-between items-center">
                    <h5 className="font-medium text-gray-900">New Transaction</h5>
                    <button
                      onClick={() => setShowAddTransaction(false)}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Type</label>
                      <select
                        value={transactionForm.type}
                        onChange={(e) => setTransactionForm({ ...transactionForm, type: e.target.value as any })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                      >
                        <option value="payment">Payment</option>
                        <option value="charge">Charge</option>
                        <option value="credit">Credit</option>
                        <option value="adjustment">Adjustment</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        value={transactionForm.amount}
                        onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                        placeholder="0.00"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <input
                        type="text"
                        value={transactionForm.description}
                        onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
                        placeholder="e.g., Payment received - Check #1234"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Reference Number (Optional)</label>
                      <input
                        type="text"
                        value={transactionForm.referenceNumber}
                        onChange={(e) => setTransactionForm({ ...transactionForm, referenceNumber: e.target.value })}
                        placeholder="e.g., Check #1234, Order #5678"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleAddTransaction}
                    className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 font-medium"
                  >
                    Add Transaction
                  </button>
                </div>
              )}

              {/* Transactions List */}
              <div className="space-y-3">
                {transactions.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No transactions yet
                  </div>
                ) : (
                  transactions.map((txn) => (
                    <div key={txn.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="mt-1">{getTransactionIcon(txn.type)}</div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-gray-900 capitalize">{txn.type}</p>
                              <span className={`text-lg font-bold ${getTransactionColor(txn.type)}`}>
                                {txn.amount > 0 ? '+' : ''}${txn.amount.toFixed(2)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{txn.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span>
                                <Calendar className="inline w-3 h-3 mr-1" />
                                {new Date(txn.createdAt).toLocaleDateString()}
                              </span>
                              {txn.referenceNumber && (
                                <span>
                                  <FileText className="inline w-3 h-3 mr-1" />
                                  {txn.referenceNumber}
                                </span>
                              )}
                              <span className="ml-auto">
                                Balance: ${txn.balanceAfter.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Statements Tab */}
          {activeTab === 'statements' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-gray-900">Monthly Statements</h4>
                <button
                  onClick={() => setShowStatementSettings(!showStatementSettings)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Statement Settings
                </button>
              </div>

              {/* Statement Settings Panel */}
              {showStatementSettings && (
                <div className="border border-blue-200 rounded-lg p-4 bg-blue-50 space-y-4">
                  <div className="flex justify-between items-center">
                    <h5 className="font-medium text-gray-900">Automatic Statement Settings</h5>
                    <button
                      onClick={() => setShowStatementSettings(false)}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Close
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={statementSettings.autoSend}
                          onChange={(e) => setStatementSettings({ ...statementSettings, autoSend: e.target.checked })}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="ml-2 text-sm text-gray-700">Automatically send monthly statements</span>
                      </label>
                    </div>

                    {statementSettings.autoSend && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Send on Day of Month</label>
                          <select
                            value={statementSettings.sendDay}
                            onChange={(e) => setStatementSettings({ ...statementSettings, sendDay: parseInt(e.target.value) })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                          >
                            {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                              <option key={day} value={day}>{day}</option>
                            ))}
                          </select>
                        </div>

                        <div className="col-span-2">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={statementSettings.includeAgingSummary}
                              onChange={(e) => setStatementSettings({ ...statementSettings, includeAgingSummary: e.target.checked })}
                              className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span className="ml-2 text-sm text-gray-700">Include aging summary</span>
                          </label>
                        </div>

                        <div className="col-span-2">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={statementSettings.includePaymentInstructions}
                              onChange={(e) => setStatementSettings({ ...statementSettings, includePaymentInstructions: e.target.checked })}
                              className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span className="ml-2 text-sm text-gray-700">Include payment instructions</span>
                          </label>
                        </div>

                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700">Custom Message (Optional)</label>
                          <textarea
                            rows={3}
                            value={statementSettings.customMessage}
                            onChange={(e) => setStatementSettings({ ...statementSettings, customMessage: e.target.value })}
                            placeholder="Add a custom message to appear on statements..."
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setShowStatementSettings(false);
                      // Save settings via API
                      alert('Statement settings saved!');
                    }}
                    className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 font-medium"
                  >
                    Save Settings
                  </button>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => alert('Generating statement for current month...')}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 font-medium"
                >
                  <FileText className="inline w-4 h-4 mr-2" />
                  Generate Current Month
                </button>
                <button
                  onClick={() => alert('Sending all pending statements...')}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 font-medium"
                >
                  <Mail className="inline w-4 h-4 mr-2" />
                  Send Pending
                </button>
              </div>

              {/* Statements List */}
              <div className="space-y-3">
                {statements.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                    No statements generated yet
                  </div>
                ) : (
                  statements.map((stmt) => (
                    <div key={stmt.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-gray-400" />
                              <div>
                                <p className="font-medium text-gray-900">
                                  {new Date(stmt.startDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(stmt.startDate).toLocaleDateString()} - {new Date(stmt.endDate).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              stmt.status === 'sent' ? 'bg-green-100 text-green-800' :
                              stmt.status === 'viewed' ? 'bg-blue-100 text-blue-800' :
                              stmt.status === 'paid' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {stmt.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-4 gap-4 mt-3 text-sm">
                            <div>
                              <p className="text-gray-500">Opening Balance</p>
                              <p className={`font-medium ${stmt.openingBalance < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                ${Math.abs(stmt.openingBalance).toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Charges</p>
                              <p className="font-medium text-red-600">${stmt.totalCharges.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Payments</p>
                              <p className="font-medium text-green-600">${stmt.totalPayments.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Closing Balance</p>
                              <p className={`font-medium ${stmt.closingBalance < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                ${Math.abs(stmt.closingBalance).toFixed(2)}
                              </p>
                            </div>
                          </div>

                          {stmt.sentDate && (
                            <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                              <span>
                                <Send className="inline w-3 h-3 mr-1" />
                                Sent: {new Date(stmt.sentDate).toLocaleDateString()}
                              </span>
                              {stmt.dueDate && (
                                <span>
                                  <Clock className="inline w-3 h-3 mr-1" />
                                  Due: {new Date(stmt.dueDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex gap-2 mt-3">
                            {stmt.pdfUrl ? (
                              <button className="text-sm text-primary hover:text-primary/80 font-medium">
                                <Download className="inline w-4 h-4 mr-1" />
                                Download PDF
                              </button>
                            ) : (
                              <button className="text-sm text-gray-400 cursor-not-allowed">
                                <FileText className="inline w-4 h-4 mr-1" />
                                PDF Not Generated
                              </button>
                            )}
                            {stmt.status === 'draft' && (
                              <>
                                <span className="text-gray-300">|</span>
                                <button
                                  onClick={() => alert(`Sending statement ${stmt.id} via email...`)}
                                  className="text-sm text-primary hover:text-primary/80 font-medium"
                                >
                                  <Mail className="inline w-4 h-4 mr-1" />
                                  Send via Email
                                </button>
                              </>
                            )}
                            {stmt.status === 'sent' && (
                              <>
                                <span className="text-gray-300">|</span>
                                <button className="text-sm text-primary hover:text-primary/80 font-medium">
                                  <Mail className="inline w-4 h-4 mr-1" />
                                  Resend
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Automatic Statements</p>
                    <p className="mt-1">
                      {statementSettings.autoSend
                        ? `Statements will be automatically generated and sent on day ${statementSettings.sendDay} of each month to ${client.email || 'the client\'s email'}.`
                        : 'Automatic statements are currently disabled. Enable them in statement settings to send monthly statements automatically.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Account Settings</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Credit Limit</label>
                    <input
                      type="number"
                      defaultValue={account.creditLimit}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Terms</label>
                    <select
                      defaultValue={account.terms}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    >
                      <option value="due_on_receipt">Due on Receipt</option>
                      <option value="net_15">Net 15</option>
                      <option value="net_30">Net 30</option>
                      <option value="net_60">Net 60</option>
                      <option value="net_90">Net 90</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Account Status</label>
                    <select
                      defaultValue={account.status}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                      defaultValue={account.notes}
                      rows={4}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                      placeholder="Internal notes about this account..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 font-medium">
                  Save Changes
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
