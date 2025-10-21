/**
 * Reports Page
 *
 * Main interface for accessing all reporting features:
 * - Sales Report: Revenue, top products/clients, order statistics
 * - Inventory Report: Stock levels, low stock alerts, inventory value
 * - Tab navigation between reports
 */

import { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import SalesReport from './SalesReport';
import InventoryReport from './InventoryReport';

type ReportTab = 'sales' | 'inventory';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('sales');

  const tabs = [
    { id: 'sales' as ReportTab, name: 'Sales Report', icon: BarChart3 },
    { id: 'inventory' as ReportTab, name: 'Inventory Report', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center">
        <BarChart3 className="w-6 h-6 text-primary mr-2" />
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm inline-flex items-center
                    ${activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Report Content */}
      <div>
        {activeTab === 'sales' && <SalesReport />}
        {activeTab === 'inventory' && <InventoryReport />}
      </div>
    </div>
  );
}
