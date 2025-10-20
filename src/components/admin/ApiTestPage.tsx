/**
 * API Test Page
 *
 * Test all Supabase Edge Functions and Invoiss API integrations
 */

import { useState } from 'react';
import { deliveryApi, quoteApi, calendarApi } from '@/services/api-clients/calendar-api';
import { deliveryCalculator } from '@/services/delivery-calculator';
import { taxCalculator } from '@/services/tax-calculator';
import { calendarService } from '@/services/calendar-service';
import { invoissAPI } from '@/lib/invoiss-api';
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import type { Address } from '@/types';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  duration?: number;
  data?: any;
  error?: string;
}

export default function ApiTestPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Test address (Windsor, CO area)
  const testAddress: Address = {
    street: '1234 Main Street',
    city: 'Greeley',
    state: 'CO',
    zip: '80631',
  };

  const updateResult = (name: string, update: Partial<TestResult>) => {
    setResults(prev => {
      const existing = prev.find(r => r.name === name);
      if (existing) {
        return prev.map(r => r.name === name ? { ...r, ...update } : r);
      }
      return [...prev, { name, status: 'pending', ...update }];
    });
  };

  const runTest = async (name: string, testFn: () => Promise<any>) => {
    const startTime = performance.now();
    updateResult(name, { status: 'pending' });

    try {
      const data = await testFn();
      const duration = performance.now() - startTime;
      updateResult(name, {
        status: 'success',
        duration: Math.round(duration),
        data
      });
      return data;
    } catch (error: any) {
      const duration = performance.now() - startTime;
      updateResult(name, {
        status: 'error',
        duration: Math.round(duration),
        error: error.message || String(error)
      });
      throw error;
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);

    try {
      // Test 1: Zone Lookup API
      await runTest('Zone Lookup API', async () => {
        const response = await deliveryApi.lookupZone(testAddress);
        return response.data;
      });

      // Test 2: Tax Lookup API
      await runTest('Tax Lookup API', async () => {
        const response = await quoteApi.lookupTax(testAddress, 100);
        return response.data;
      });

      // Test 3: Delivery Fee Calculator (uses zone-lookup)
      await runTest('Delivery Fee Calculator', async () => {
        const result = await deliveryCalculator.calculateDeliveryFee(
          testAddress,
          150, // $150 subtotal
          8500 // 8,500 lbs (trailer)
        );
        return result;
      });

      // Test 4: Delivery Fee Calculator (tandem)
      await runTest('Delivery Fee Calculator (Tandem)', async () => {
        const result = await deliveryCalculator.calculateDeliveryFee(
          testAddress,
          150, // $150 subtotal
          12000 // 12,000 lbs (tandem required)
        );
        return result;
      });

      // Test 5: Tax Calculator
      await runTest('Tax Calculator', async () => {
        const result = await taxCalculator.calculateTax(testAddress, 100);
        return result;
      });

      // Test 6: Calendar Event Creation
      await runTest('Calendar Event API', async () => {
        const response = await calendarApi.createEvent({
          title: 'Test Delivery Event',
          description: 'API test event',
          startDate: new Date().toISOString(),
          location: `${testAddress.street}, ${testAddress.city}, ${testAddress.state}`,
          metadata: { test: true }
        });
        return response.data;
      });

      // Test 7: Invoiss API - List Clients
      await runTest('Invoiss API - List Clients', async () => {
        const clients = await invoissAPI.listClients();
        return { count: clients.length, clients: clients.slice(0, 3) };
      });

      // Test 8: Invoiss API - List Products
      await runTest('Invoiss API - List Products', async () => {
        const products = await invoissAPI.listProducts();
        return { count: products.length, products: products.slice(0, 3) };
      });

      console.log('✅ All API tests completed!');
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">API Test Suite</h1>
            <p className="text-sm text-gray-600 mt-1">
              Test all Supabase Edge Functions and Invoiss API integrations
            </p>
          </div>
          <button
            onClick={runAllTests}
            disabled={isRunning}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </button>
        </div>

        {/* Test Address */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Test Address</h3>
          <p className="text-sm text-gray-600">
            {testAddress.street}, {testAddress.city}, {testAddress.state} {testAddress.zip}
          </p>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {results.length === 0 && !isRunning && (
            <div className="text-center py-12 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>Click "Run All Tests" to start testing APIs</p>
            </div>
          )}

          {results.map((result) => (
            <div
              key={result.name}
              className={`p-4 rounded-lg border-2 ${
                result.status === 'success'
                  ? 'border-green-200 bg-green-50'
                  : result.status === 'error'
                  ? 'border-red-200 bg-red-50'
                  : 'border-blue-200 bg-blue-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{result.name}</h3>
                    {result.duration !== undefined && (
                      <p className="text-sm text-gray-600">
                        {result.duration}ms
                      </p>
                    )}

                    {result.error && (
                      <div className="mt-2 p-3 bg-red-100 rounded text-sm text-red-800">
                        <strong>Error:</strong> {result.error}
                      </div>
                    )}

                    {result.data && result.status === 'success' && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                          View Response Data
                        </summary>
                        <pre className="mt-2 p-3 bg-white rounded text-xs overflow-auto max-h-48">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        {results.length > 0 && !isRunning && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Test Summary</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {results.filter(r => r.status === 'success').length}
                </div>
                <div className="text-sm text-gray-600">Passed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {results.filter(r => r.status === 'error').length}
                </div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {results.length}
                </div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
