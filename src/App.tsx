import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Home, Package, Truck, Users, Settings, CreditCard, LogOut, User, Box, ArrowRightLeft, BarChart3, FileText } from 'lucide-react';
import ClientList, { NewClientModal } from './components/clients/ClientList';
import OrderList from './components/orders/OrderList';
import NewOrderModal from './components/orders/NewOrderModal';
import HouseAccountList from './components/accounts/HouseAccountList';
import DeliveryList from './components/delivery/DeliveryList';
import DriverView from './components/driver/DriverView';
import SettingsPage from './components/admin/SettingsPage';
import ProductList from './components/products/ProductList';
import TransferList from './components/inventory/TransferList';
import ReportsPage from './components/reports/ReportsPage';
import EstimateList from './components/estimates/EstimateList';
import EmployeeLoginModal from './components/auth/EmployeeLoginModal';
import { useAuth } from './contexts/AuthContext';

function App() {
  const { currentEmployee, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Show login modal if no employee is logged in
  useEffect(() => {
    if (!currentEmployee) {
      setShowLoginModal(true);
    }
  }, [currentEmployee]);

  // Don't render main app until employee is logged in
  if (!currentEmployee) {
    return (
      <>
        {showLoginModal && (
          <EmployeeLoginModal
            onClose={() => {}} // Can't close without logging in
            onSuccess={() => setShowLoginModal(false)}
          />
        )}
      </>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Navigation */}
        <nav className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-2xl font-bold text-primary">Invoiss POS</h1>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link
                    to="/"
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 dark:text-gray-100"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Dashboard
                  </Link>
                  <Link
                    to="/orders"
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Orders
                  </Link>
                  <Link
                    to="/deliveries"
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                  >
                    <Truck className="w-4 h-4 mr-2" />
                    Deliveries
                  </Link>
                  <Link
                    to="/estimates"
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Estimates
                  </Link>
                  <Link
                    to="/clients"
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Clients
                  </Link>
                  <Link
                    to="/products"
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                  >
                    <Box className="w-4 h-4 mr-2" />
                    Products
                  </Link>
                  <Link
                    to="/inventory"
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                  >
                    <ArrowRightLeft className="w-4 h-4 mr-2" />
                    Inventory
                  </Link>
                  <Link
                    to="/reports"
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Reports
                  </Link>
                  <Link
                    to="/accounts"
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Accounts
                  </Link>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-sm text-gray-700">
                  <User className="w-4 h-4 mr-2" />
                  <span className="font-medium">{currentEmployee.name}</span>
                  <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                    {currentEmployee.role}
                  </span>
                </div>
                <Link to="/settings" className="p-2 text-gray-400 hover:text-gray-500">
                  <Settings className="w-5 h-5" />
                </Link>
                <button
                  onClick={logout}
                  className="p-2 text-gray-400 hover:text-gray-500"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/orders" element={<OrderList />} />
            <Route path="/deliveries" element={<DeliveryList />} />
            <Route path="/estimates" element={<EstimateList />} />
            <Route path="/driver" element={<DriverView />} />
            <Route path="/clients" element={<ClientList />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/inventory" element={<TransferList />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/accounts" element={<HouseAccountList />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function Dashboard() {
  const [showInStoreOrderModal, setShowInStoreOrderModal] = useState(false);
  const [showDeliveryOrderModal, setShowDeliveryOrderModal] = useState(false);
  const [showNewClientModal, setShowNewClientModal] = useState(false);

  return (
    <div className="px-4 py-6 sm:px-0">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h2>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Stats Cards */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Orders
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    0
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
                <Truck className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Scheduled Deliveries
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    0
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
                <Users className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Clients
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    2
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
                <div className="h-6 w-6 text-green-400">$</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Revenue (Today)
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    $0.00
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <button
            onClick={() => setShowInStoreOrderModal(true)}
            className="relative block w-full border-2 border-gray-300 border-dashed rounded-lg p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <span className="mt-2 block text-sm font-medium text-gray-900">
              New In-Store Order
            </span>
          </button>

          <button
            onClick={() => setShowDeliveryOrderModal(true)}
            className="relative block w-full border-2 border-gray-300 border-dashed rounded-lg p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <Truck className="mx-auto h-12 w-12 text-gray-400" />
            <span className="mt-2 block text-sm font-medium text-gray-900">
              New Delivery Order
            </span>
          </button>

          <button
            onClick={() => setShowNewClientModal(true)}
            className="relative block w-full border-2 border-gray-300 border-dashed rounded-lg p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <span className="mt-2 block text-sm font-medium text-gray-900">
              New Client
            </span>
          </button>
        </div>
      </div>

      {/* System Info */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-blue-800">
              Development Mode
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Using mock Invoiss API. Connect your real API key when ready to go live.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showInStoreOrderModal && (
        <NewOrderModal
          onClose={() => setShowInStoreOrderModal(false)}
          onSuccess={() => {
            setShowInStoreOrderModal(false);
            // Optionally navigate to orders page or refresh stats
          }}
        />
      )}

      {showDeliveryOrderModal && (
        <NewOrderModal
          onClose={() => setShowDeliveryOrderModal(false)}
          onSuccess={() => {
            setShowDeliveryOrderModal(false);
            // Optionally navigate to orders page or refresh stats
          }}
        />
      )}

      {showNewClientModal && (
        <NewClientModal
          onClose={() => setShowNewClientModal(false)}
          onSuccess={() => {
            setShowNewClientModal(false);
            // Optionally navigate to clients page
          }}
        />
      )}
    </div>
  );
}

export default App;
