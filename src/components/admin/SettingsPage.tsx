/**
 * Settings Page
 *
 * System configuration, API testing, and admin controls
 */

import { useState } from 'react';
import { Settings, TestTube, Database, Key, Users, Package } from 'lucide-react';
import ApiTestPage from './ApiTestPage';

type SettingsTab = 'general' | 'api-test' | 'database' | 'employees';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  const tabs = [
    { id: 'general' as SettingsTab, label: 'General', icon: Settings },
    { id: 'api-test' as SettingsTab, label: 'API Testing', icon: TestTube },
    { id: 'database' as SettingsTab, label: 'Database', icon: Database },
    { id: 'employees' as SettingsTab, label: 'Employees', icon: Users },
  ];

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Settings</h2>
        <p className="mt-2 text-sm text-gray-600">
          Manage system configuration, test APIs, and configure integrations
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white shadow-sm rounded-lg mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                    ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon
                    className={`
                      -ml-0.5 mr-2 h-5 w-5
                      ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                    `}
                  />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'general' && <GeneralSettings />}
        {activeTab === 'api-test' && <ApiTestPage />}
        {activeTab === 'database' && <DatabaseSettings />}
        {activeTab === 'employees' && <EmployeeSettings />}
      </div>
    </div>
  );
}

function GeneralSettings() {
  const apiMode = import.meta.env.VITE_API_MODE || 'mock';
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const hasInvoissKey = !!import.meta.env.VITE_INVOISS_API_KEY;

  return (
    <div className="space-y-6">
      {/* API Configuration */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Key className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">API Configuration</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">API Mode</label>
            <div className="mt-1">
              <div className="flex items-center">
                <span className={`
                  px-3 py-1 rounded-full text-sm font-medium
                  ${apiMode === 'mock' ? 'bg-yellow-100 text-yellow-800' : ''}
                  ${apiMode === 'dev' ? 'bg-blue-100 text-blue-800' : ''}
                  ${apiMode === 'prod' ? 'bg-green-100 text-green-800' : ''}
                `}>
                  {apiMode.toUpperCase()}
                </span>
                <span className="ml-3 text-sm text-gray-500">
                  {apiMode === 'mock' && 'Using local mock API (development)'}
                  {apiMode === 'dev' && 'Connected to Invoiss development API'}
                  {apiMode === 'prod' && 'Connected to Invoiss production API'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Invoiss API Key</label>
            <div className="mt-1 flex items-center">
              <span className={`
                px-3 py-1 rounded-full text-sm font-medium
                ${hasInvoissKey ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
              `}>
                {hasInvoissKey ? '✓ Configured' : '✗ Not Configured'}
              </span>
              {hasInvoissKey && (
                <span className="ml-3 text-sm text-gray-500">
                  Key: •••••••••••••{import.meta.env.VITE_INVOISS_API_KEY?.slice(-8)}
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Supabase URL</label>
            <div className="mt-1">
              <span className="text-sm text-gray-900">{supabaseUrl || 'Not configured'}</span>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-gray-500">
              To change API configuration, edit the <code className="px-1 py-0.5 bg-gray-100 rounded">.env</code> file
              in the project root and restart the development server.
            </p>
          </div>
        </div>
      </div>

      {/* Store Information */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Package className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Store Information</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Store Name</label>
            <input
              type="text"
              defaultValue="Invoiss POS"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Store Address</label>
            <input
              type="text"
              placeholder="123 Main St, Springfield, IL 62701"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              placeholder="(555) 123-4567"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              placeholder="store@invoiss.com"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div className="pt-4">
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Store Information
            </button>
          </div>
        </div>
      </div>

      {/* Delivery Settings */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Settings</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Base Delivery Fee</label>
            <div className="mt-1 flex items-center">
              <span className="text-gray-500 mr-2">$</span>
              <input
                type="number"
                defaultValue="10"
                className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Default delivery fee when all zone lookups fail (fallback only)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Vehicle Type Determination</label>
            <div className="mt-2 space-y-2 text-sm text-gray-600">
              <div className="flex items-start">
                <span className="font-medium w-32">TON materials:</span>
                <span>Trailer up to 7 tons (14,000 lbs), Tandem over 7 tons</span>
              </div>
              <div className="flex items-start">
                <span className="font-medium w-32">Soil/Compost:</span>
                <span>Trailer up to 10 cubic yards, Tandem over 10 yards</span>
              </div>
              <div className="flex items-start">
                <span className="font-medium w-32">Mulch:</span>
                <span>Trailer up to 12 cubic yards, Tandem over 12 yards</span>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Materials include: Screen Top Soil, Planters Mix, Dairy Compost, Class 1 Compost
            </p>
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-medium text-gray-900 mb-3">Delivery Zone Pricing</h4>
            <div className="grid grid-cols-2 gap-6">
              {/* Zone Distance Ranges */}
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Zone Distance Ranges</h5>
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Zone 1:</span>
                    <span>Up to 12.00 miles</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Zone 2:</span>
                    <span>12.01-17.00 miles</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Zone 3:</span>
                    <span>17.01-22.00 miles</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Zone 4:</span>
                    <span>22.01-27.00 miles</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Zone 5:</span>
                    <span>27.01-32.00 miles</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Zone 6:</span>
                    <span>32.01-37.00 miles</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Zone 7:</span>
                    <span>37.01-42.00 miles</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Zone 8:</span>
                    <span>42.01-47.00 miles</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Zone 9:</span>
                    <span>47.01-52.00 miles</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Zone 10:</span>
                    <span>52.01-57.00 miles</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Zone 11:</span>
                    <span>57.01-62.00 miles</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Zone 12:</span>
                    <span>62.01-67.00 miles</span>
                  </div>
                  <div className="flex justify-between text-gray-500 italic">
                    <span>Zone 13+:</span>
                    <span>+5 miles per zone</span>
                  </div>
                </div>
              </div>

              {/* Trailer Fees */}
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Trailer Fees</h5>
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Zone 1:</span>
                    <span className="font-medium">$95</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Zone 2:</span>
                    <span className="font-medium">$110</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Zone 3:</span>
                    <span className="font-medium">$125</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Zone 4:</span>
                    <span className="font-medium">$140</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Zone 5:</span>
                    <span className="font-medium">$155</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Zone 6:</span>
                    <span className="font-medium">$170</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Zone 7:</span>
                    <span className="font-medium">$185</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Zone 8:</span>
                    <span className="font-medium">$200</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Zone 9:</span>
                    <span className="font-medium">$215</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Zone 10:</span>
                    <span className="font-medium">$230</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Zone 11:</span>
                    <span className="font-medium">$245</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Zone 12:</span>
                    <span className="font-medium">$260</span>
                  </div>
                  <div className="flex justify-between text-gray-500 italic">
                    <span>Zone 13+:</span>
                    <span>+$15 per zone</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Tandem Fee Calculation</h5>
              <p className="text-xs text-gray-600">
                Tandem fees are calculated dynamically based on distance using the formula:
              </p>
              <code className="block mt-2 px-3 py-2 bg-gray-50 rounded text-xs text-gray-800">
                ((distance × 2) ÷ 45 + 0.5) × 85 + 30
              </code>
              <p className="mt-2 text-xs text-gray-600">
                Minimum tandem fee: <span className="font-medium">$115</span>
              </p>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Delivery Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DatabaseSettings() {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Status</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium text-gray-900">Mock Database</p>
              <p className="text-sm text-gray-500">In-memory development database</p>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              Active
            </span>
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium text-gray-900">Clients</p>
              <p className="text-sm text-gray-500">Customer records</p>
            </div>
            <span className="text-gray-900 font-medium">3</span>
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium text-gray-900">Orders</p>
              <p className="text-sm text-gray-500">Order history</p>
            </div>
            <span className="text-gray-900 font-medium">0</span>
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium text-gray-900">Products</p>
              <p className="text-sm text-gray-500">Product catalog</p>
            </div>
            <span className="text-gray-900 font-medium">6</span>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-900">Employees</p>
              <p className="text-sm text-gray-500">Staff accounts</p>
            </div>
            <span className="text-gray-900 font-medium">3</span>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Development Mode:</strong> All data is stored in memory and will be lost when
              the application restarts. Connect to Invoiss API for persistent storage.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h3>

        <div className="space-y-4">
          <div>
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Export Data
            </button>
            <p className="mt-2 text-sm text-gray-500">
              Download all data as JSON
            </p>
          </div>

          <div>
            <button
              type="button"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Import Data
            </button>
            <p className="mt-2 text-sm text-gray-500">
              Import data from JSON file
            </p>
          </div>

          <div className="pt-4 border-t">
            <button
              type="button"
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Reset Database
            </button>
            <p className="mt-2 text-sm text-gray-500">
              Clear all data and reset to default
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmployeeSettings() {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Employee Management</h3>
          <button
            type="button"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Employee
          </button>
        </div>

        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PIN Required
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
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  1001
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  John (Cashier)
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                    Cashier
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  No
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                    Active
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900 mr-4">Edit</button>
                  <button className="text-red-600 hover:text-red-900">Deactivate</button>
                </td>
              </tr>

              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  2001
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Sarah (Manager)
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                    Manager
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Yes (1234)
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                    Active
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900 mr-4">Edit</button>
                  <button className="text-red-600 hover:text-red-900">Deactivate</button>
                </td>
              </tr>

              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  9999
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Admin User
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                    Admin
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Yes (0000)
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                    Active
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900 mr-4">Edit</button>
                  <button className="text-gray-400 cursor-not-allowed">Protected</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Role Permissions</h3>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Cashier</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✓ Create orders</li>
              <li>✓ Process payments</li>
              <li>✓ View clients</li>
              <li>✗ Manage inventory</li>
              <li>✗ View reports</li>
              <li>✗ Manage employees</li>
            </ul>
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-medium text-gray-900 mb-2">Manager</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✓ All cashier permissions</li>
              <li>✓ Manage inventory</li>
              <li>✓ View reports</li>
              <li>✓ Manage discounts</li>
              <li>✗ Manage employees</li>
              <li>✗ System settings</li>
            </ul>
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-medium text-gray-900 mb-2">Admin</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✓ All manager permissions</li>
              <li>✓ Manage employees</li>
              <li>✓ System settings</li>
              <li>✓ API configuration</li>
              <li>✓ Database management</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
