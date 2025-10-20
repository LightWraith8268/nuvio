/**
 * PIN Verification Modal
 *
 * Used for secure authorization of sensitive operations:
 * - Price overrides
 * - Refunds
 * - Large discounts
 * - Setting default clients
 *
 * Validates manager/admin PIN before allowing the operation.
 */

import { useState } from 'react';
import { X, Shield, AlertCircle } from 'lucide-react';
import { invoissAPI } from '@/lib/invoiss-api';
import type { Employee } from '@/types';

interface PinVerificationModalProps {
  onClose: () => void;
  onSuccess: (authorizedEmployee: Employee) => void;
  operation: string; // Description of the operation requiring authorization
  requireRole?: 'manager' | 'admin'; // Minimum role required (defaults to manager)
}

export default function PinVerificationModal({
  onClose,
  onSuccess,
  operation,
  requireRole = 'manager'
}: PinVerificationModalProps) {
  const [employeeId, setEmployeeId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!employeeId || !pin) {
      setError('Please enter both Employee ID and PIN');
      return;
    }

    setVerifying(true);

    try {
      // Authenticate employee with PIN
      const employee = await invoissAPI.authenticateEmployee(employeeId, pin);

      if (!employee) {
        setError('Invalid Employee ID or PIN');
        setVerifying(false);
        return;
      }

      // Check role requirement
      if (requireRole === 'admin' && employee.role !== 'admin') {
        setError('This operation requires admin authorization');
        setVerifying(false);
        return;
      }

      if (requireRole === 'manager' && employee.role === 'cashier') {
        setError('This operation requires manager or admin authorization');
        setVerifying(false);
        return;
      }

      // Check if employee has required permission (price override)
      if (!employee.permissions.overridePrices) {
        setError('This employee does not have permission to override prices');
        setVerifying(false);
        return;
      }

      // Success - call onSuccess with the authorized employee
      onSuccess(employee);
    } catch (error) {
      console.error('PIN verification error:', error);
      setError('Verification failed. Please try again.');
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <Shield className="w-6 h-6 text-yellow-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Authorization Required</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-sm text-yellow-800">
              <strong>Operation:</strong> {operation}
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              {requireRole === 'admin' ? 'Admin' : 'Manager or Admin'} authorization required
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700 mb-1">
              Employee ID
            </label>
            <input
              id="employeeId"
              type="text"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="Enter employee ID"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-1">
              PIN
            </label>
            <input
              id="pin"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              maxLength={6}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="Enter PIN"
            />
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
              disabled={verifying}
              className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50"
            >
              {verifying ? 'Verifying...' : 'Authorize'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
