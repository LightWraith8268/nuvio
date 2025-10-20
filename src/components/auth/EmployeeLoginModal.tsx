import { useState } from 'react';
import { X, LogIn, Lock } from 'lucide-react';
import { invoissAPI } from '@/lib/invoiss-api';
import { useAuth } from '@/contexts/AuthContext';

interface EmployeeLoginModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function EmployeeLoginModal({ onClose, onSuccess }: EmployeeLoginModalProps) {
  const { login } = useAuth();
  const [employeeId, setEmployeeId] = useState('');
  const [pin, setPin] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);
  const [error, setError] = useState('');
  const [authenticating, setAuthenticating] = useState(false);

  async function handleEmployeeIdSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setAuthenticating(true);

    try {
      // Try authenticating without PIN first
      const employee = await invoissAPI.authenticateEmployee(employeeId);

      if (!employee) {
        setError('Employee ID not found');
        setAuthenticating(false);
        return;
      }

      // Check if PIN is required (manager/admin)
      if (employee.pin) {
        setShowPinInput(true);
        setAuthenticating(false);
        return;
      }

      // No PIN required, log in directly
      login(employee);
      onSuccess();
    } catch (err) {
      setError('Authentication failed. Please try again.');
      setAuthenticating(false);
    }
  }

  async function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setAuthenticating(true);

    try {
      const employee = await invoissAPI.authenticateEmployee(employeeId, pin);

      if (!employee) {
        setError('Incorrect PIN');
        setAuthenticating(false);
        return;
      }

      login(employee);
      onSuccess();
    } catch (err) {
      setError('Authentication failed. Please try again.');
      setAuthenticating(false);
    }
  }

  function handleBack() {
    setShowPinInput(false);
    setPin('');
    setError('');
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <LogIn className="w-6 h-6 text-primary" />
            <h3 className="text-lg font-medium text-gray-900">
              {showPinInput ? 'Enter PIN' : 'Employee Login'}
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        {!showPinInput ? (
          <form onSubmit={handleEmployeeIdSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee ID
              </label>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="Enter your employee ID"
                required
                autoFocus
                className="block w-full border border-gray-300 rounded-md shadow-sm py-3 px-4 text-lg focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded text-sm">
              <p className="font-medium mb-2">Test Employee IDs:</p>
              <ul className="space-y-1 text-xs">
                <li>• <strong>1001</strong> - Cashier (no PIN required)</li>
                <li>• <strong>2001</strong> - Manager (PIN: 1234)</li>
                <li>• <strong>9999</strong> - Admin (PIN: 0000)</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={authenticating}
              className="w-full px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50"
            >
              {authenticating ? 'Authenticating...' : 'Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="w-4 h-4 inline mr-1" />
                PIN Required
              </label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter your PIN"
                required
                autoFocus
                maxLength={6}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-3 px-4 text-lg tracking-widest focus:outline-none focus:ring-primary focus:border-primary"
              />
              <p className="mt-2 text-sm text-gray-500">
                This employee requires a PIN to log in
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={authenticating}
                className="flex-1 px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50"
              >
                {authenticating ? 'Verifying...' : 'Login'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
