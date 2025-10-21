/**
 * Transfer Detail Modal
 *
 * View, approve, ship, and receive inventory transfers:
 * - View full transfer details
 * - Approve transfer (manager/admin)
 * - Ship transfer (mark as in transit)
 * - Receive inventory at destination (partial or full)
 * - Track transfer status progression
 * - Update inventory automatically when receiving
 */

import { useState } from 'react';
import { X, ArrowRightLeft, CheckCircle, Truck, Package, AlertCircle } from 'lucide-react';
import * as mockInventory from '@/lib/mock-inventory';
import type { Transfer, TransferLineItem } from '@/types';

interface TransferDetailModalProps {
  transfer: Transfer;
  onClose: () => void;
  onUpdated: () => void;
}

interface ReceivingInput {
  lineItemId: string;
  quantityToReceive: number;
}

export default function TransferDetailModal({
  transfer,
  onClose,
  onUpdated,
}: TransferDetailModalProps) {
  const [receivingMode, setReceivingMode] = useState(false);
  const [receivingInputs, setReceivingInputs] = useState<ReceivingInput[]>([]);
  const [receivingNotes, setReceivingNotes] = useState('');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const canApprove = transfer.status === 'pending';
  const canShip = transfer.status === 'approved';
  const canReceive = transfer.status === 'in_transit' || transfer.status === 'partially_received';

  const initializeReceivingInputs = () => {
    const inputs = transfer.lineItems.map(item => ({
      lineItemId: item.id,
      quantityToReceive: item.quantityShipped - item.quantityReceived,
    }));
    setReceivingInputs(inputs);
    setReceivingMode(true);
  };

  const updateReceivingQuantity = (lineItemId: string, quantity: number) => {
    setReceivingInputs(receivingInputs.map(input =>
      input.lineItemId === lineItemId
        ? { ...input, quantityToReceive: quantity }
        : input
    ));
  };

  const handleApproveTransfer = async () => {
    setError('');
    setProcessing(true);

    try {
      // TODO: Implement API call
      console.log('Approving transfer:', transfer.id);

      // Update transfer status
      const updatedTransfer = {
        ...transfer,
        status: 'approved' as const,
        approvedDate: new Date().toISOString(),
        approvedBy: 'current-employee-id', // TODO: Get from auth context
        updatedAt: new Date().toISOString(),
      };

      console.log('Transfer approved:', updatedTransfer);
      onUpdated();
    } catch (error) {
      console.error('Error approving transfer:', error);
      setError('Failed to approve transfer. Please try again.');
      setProcessing(false);
    }
  };

  const handleShipTransfer = async () => {
    setError('');
    setProcessing(true);

    try {
      // TODO: Implement API call
      console.log('Shipping transfer:', transfer.id);

      // Update transfer status and set shipped quantities to requested quantities
      const updatedTransfer = {
        ...transfer,
        status: 'in_transit' as const,
        shippedDate: new Date().toISOString(),
        shippedBy: 'current-employee-id', // TODO: Get from auth context
        lineItems: transfer.lineItems.map(item => ({
          ...item,
          quantityShipped: item.quantityRequested,
        })),
        updatedAt: new Date().toISOString(),
      };

      console.log('Transfer shipped:', updatedTransfer);
      onUpdated();
    } catch (error) {
      console.error('Error shipping transfer:', error);
      setError('Failed to ship transfer. Please try again.');
      setProcessing(false);
    }
  };

  const handleReceiveInventory = async () => {
    setError('');

    // Validate receiving quantities
    for (const input of receivingInputs) {
      if (input.quantityToReceive < 0) {
        setError('Receiving quantities cannot be negative');
        return;
      }

      const lineItem = transfer.lineItems.find(item => item.id === input.lineItemId);
      if (lineItem && input.quantityToReceive > (lineItem.quantityShipped - lineItem.quantityReceived)) {
        setError('Cannot receive more than shipped quantity');
        return;
      }
    }

    // Check if any quantity is being received
    const totalReceiving = receivingInputs.reduce((sum, input) => sum + input.quantityToReceive, 0);
    if (totalReceiving === 0) {
      setError('Please enter quantities to receive');
      return;
    }

    setProcessing(true);

    try {
      // Record inventory transfers for each line item
      const receivingDate = new Date().toISOString();
      const receivedBy = 'current-employee-id'; // TODO: Get from auth context

      for (const input of receivingInputs) {
        if (input.quantityToReceive > 0) {
          const lineItem = transfer.lineItems.find(item => item.id === input.lineItemId);

          if (lineItem) {
            // Record inventory transfer (out from source, in to destination)
            try {
              mockInventory.transferInventory(
                lineItem.productId,
                transfer.fromLocationId,
                transfer.toLocationId,
                input.quantityToReceive,
                lineItem.unit,
                receivedBy
              );

              console.log(`✓ Inventory transferred: ${lineItem.product?.name || lineItem.productId} (${input.quantityToReceive} ${lineItem.unit}) from ${transfer.fromLocation?.name} to ${transfer.toLocation?.name}`);
            } catch (invError) {
              console.warn(`Failed to record inventory transfer for ${lineItem.productId}:`, invError);
            }

            // Update line item receiving history (if needed)
            // Note: Transfer doesn't have receivingHistory in the type, but we could add it

            // Update quantity received
            lineItem.quantityReceived += input.quantityToReceive;
          }
        }
      }

      // Determine new transfer status
      const allFullyReceived = transfer.lineItems.every(item =>
        item.quantityReceived >= item.quantityShipped
      );
      const anyReceived = transfer.lineItems.some(item =>
        item.quantityReceived > 0
      );

      const newStatus = allFullyReceived ? 'received' : (anyReceived ? 'partially_received' : 'in_transit');

      const updatedTransfer = {
        ...transfer,
        status: newStatus as any,
        receivedDate: allFullyReceived ? receivingDate : undefined,
        receivedBy: allFullyReceived ? receivedBy : undefined,
        updatedAt: receivingDate,
      };

      console.log('Inventory received at destination:', updatedTransfer);
      onUpdated();
    } catch (error) {
      console.error('Error receiving inventory:', error);
      setError('Failed to receive inventory. Please try again.');
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center">
            <ArrowRightLeft className="w-6 h-6 text-primary mr-2" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">Transfer {transfer.number}</h3>
              <p className="text-sm text-gray-500">
                {transfer.fromLocation?.name || transfer.fromLocationId} → {transfer.toLocation?.name || transfer.toLocationId}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Transfer Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500">Status</label>
              <div className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  transfer.status === 'received' ? 'bg-green-100 text-green-800' :
                  transfer.status === 'in_transit' ? 'bg-yellow-100 text-yellow-800' :
                  transfer.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                  transfer.status === 'partially_received' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {transfer.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500">Requested Date</label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(transfer.requestedDate).toLocaleDateString()}
              </p>
            </div>

            {transfer.approvedDate && (
              <div>
                <label className="block text-xs font-medium text-gray-500">Approved Date</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(transfer.approvedDate).toLocaleDateString()}
                </p>
              </div>
            )}

            {transfer.shippedDate && (
              <div>
                <label className="block text-xs font-medium text-gray-500">Shipped Date</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(transfer.shippedDate).toLocaleDateString()}
                </p>
              </div>
            )}

            {transfer.receivedDate && (
              <div>
                <label className="block text-xs font-medium text-gray-500">Received Date</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(transfer.receivedDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* Line Items */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Line Items</h4>
            <div className="border border-gray-200 rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Requested</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Shipped</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Received</th>
                    {receivingMode && (
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Receiving</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transfer.lineItems.map((item) => {
                    const receivingInput = receivingInputs.find(input => input.lineItemId === item.id);
                    const remaining = item.quantityShipped - item.quantityReceived;

                    return (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.product?.name || item.productId}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {item.quantityRequested} {item.unit}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {item.quantityShipped} {item.unit}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {item.quantityReceived} {item.unit}
                        </td>
                        {receivingMode && (
                          <td className="px-4 py-3 text-right">
                            <input
                              type="number"
                              min="0"
                              max={remaining}
                              step="0.1"
                              value={receivingInput?.quantityToReceive || 0}
                              onChange={(e) => updateReceivingQuantity(item.id, parseFloat(e.target.value) || 0)}
                              className="w-20 border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm text-right focus:outline-none focus:ring-primary focus:border-primary"
                            />
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Receiving Notes */}
          {receivingMode && (
            <div>
              <label htmlFor="receivingNotes" className="block text-sm font-medium text-gray-700 mb-1">
                Receiving Notes
              </label>
              <textarea
                id="receivingNotes"
                value={receivingNotes}
                onChange={(e) => setReceivingNotes(e.target.value)}
                rows={2}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="Optional notes about this receiving..."
              />
            </div>
          )}

          {/* Notes */}
          {transfer.notes && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-md p-3">{transfer.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            {receivingMode ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setReceivingMode(false);
                    setReceivingInputs([]);
                    setReceivingNotes('');
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel Receiving
                </button>
                <button
                  onClick={handleReceiveInventory}
                  disabled={processing}
                  className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  <Package className="w-4 h-4 inline-block mr-2" />
                  {processing ? 'Receiving...' : 'Confirm Receipt'}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Close
                </button>
                {canApprove && (
                  <button
                    onClick={handleApproveTransfer}
                    disabled={processing}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4 inline-block mr-2" />
                    {processing ? 'Approving...' : 'Approve Transfer'}
                  </button>
                )}
                {canShip && (
                  <button
                    onClick={handleShipTransfer}
                    disabled={processing}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50"
                  >
                    <Truck className="w-4 h-4 inline-block mr-2" />
                    {processing ? 'Shipping...' : 'Ship Transfer'}
                  </button>
                )}
                {canReceive && (
                  <button
                    onClick={initializeReceivingInputs}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                  >
                    <Package className="w-4 h-4 inline-block mr-2" />
                    Receive Inventory
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
