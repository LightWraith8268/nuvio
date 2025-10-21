/**
 * Purchase Order Detail Modal
 *
 * View, approve, and receive purchase orders:
 * - View full PO details
 * - Approve PO (manager/admin)
 * - Receive inventory (partial or full)
 * - Track receiving history
 * - Update inventory when receiving
 */

import { useState } from 'react';
import { X, FileText, CheckCircle, Package, AlertCircle } from 'lucide-react';
import * as mockInventory from '@/lib/mock-inventory';
import type { PurchaseOrder, PurchaseOrderLineItem } from '@/types';

interface PurchaseOrderDetailModalProps {
  purchaseOrder: PurchaseOrder;
  onClose: () => void;
  onUpdated: () => void;
}

interface ReceivingInput {
  lineItemId: string;
  quantityToReceive: number;
}

export default function PurchaseOrderDetailModal({
  purchaseOrder,
  onClose,
  onUpdated,
}: PurchaseOrderDetailModalProps) {
  const [receivingMode, setReceivingMode] = useState(false);
  const [receivingInputs, setReceivingInputs] = useState<ReceivingInput[]>([]);
  const [receivingNotes, setReceivingNotes] = useState('');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const canApprove = purchaseOrder.status === 'draft' || purchaseOrder.status === 'submitted';
  const canReceive = purchaseOrder.status === 'approved' || purchaseOrder.status === 'partially_received';

  const initializeReceivingInputs = () => {
    const inputs = purchaseOrder.lineItems.map(item => ({
      lineItemId: item.id || `item-${Math.random()}`,
      quantityToReceive: item.quantityOrdered - item.quantityReceived,
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

  const handleApprovePO = async () => {
    setError('');
    setProcessing(true);

    try {
      // TODO: Implement API call
      console.log('Approving PO:', purchaseOrder.id);

      // Update PO status
      const updatedPO = {
        ...purchaseOrder,
        status: 'approved' as const,
        approvedDate: new Date().toISOString(),
        approvedBy: 'current-employee-id', // TODO: Get from auth context
        updatedAt: new Date().toISOString(),
      };

      console.log('PO approved:', updatedPO);
      onUpdated();
    } catch (error) {
      console.error('Error approving PO:', error);
      setError('Failed to approve purchase order. Please try again.');
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

      const lineItem = purchaseOrder.lineItems.find(item =>
        (item.id || `item-${Math.random()}`) === input.lineItemId
      );
      if (lineItem && input.quantityToReceive > (lineItem.quantityOrdered - lineItem.quantityReceived)) {
        setError('Cannot receive more than ordered quantity');
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
      // Record inventory for each line item
      const receivingDate = new Date().toISOString();
      const receivedBy = 'current-employee-id'; // TODO: Get from auth context

      for (const input of receivingInputs) {
        if (input.quantityToReceive > 0) {
          const lineItem = purchaseOrder.lineItems.find(item =>
            (item.id || `item-${Math.random()}`) === input.lineItemId
          );

          if (lineItem) {
            // Record inventory transaction
            try {
              mockInventory.recordPurchase(
                lineItem.productId,
                purchaseOrder.locationId,
                input.quantityToReceive,
                lineItem.unit,
                purchaseOrder.id,
                purchaseOrder.number
              );

              console.log(`✓ Inventory received: ${lineItem.product?.name || lineItem.productId} (+${input.quantityToReceive} ${lineItem.unit})`);
            } catch (invError) {
              console.warn(`Failed to record inventory for ${lineItem.productId}:`, invError);
            }

            // Update line item receiving history
            if (!lineItem.receivingHistory) {
              lineItem.receivingHistory = [];
            }
            lineItem.receivingHistory.push({
              date: receivingDate,
              quantity: input.quantityToReceive,
              receivedBy,
              notes: receivingNotes || undefined,
            });

            // Update quantity received
            lineItem.quantityReceived += input.quantityToReceive;
          }
        }
      }

      // Determine new PO status
      const allFullyReceived = purchaseOrder.lineItems.every(item =>
        item.quantityReceived >= item.quantityOrdered
      );
      const anyReceived = purchaseOrder.lineItems.some(item =>
        item.quantityReceived > 0
      );

      const newStatus = allFullyReceived ? 'received' : (anyReceived ? 'partially_received' : 'approved');

      const updatedPO = {
        ...purchaseOrder,
        status: newStatus as any,
        receivedDate: allFullyReceived ? receivingDate : undefined,
        updatedAt: receivingDate,
      };

      console.log('Inventory received:', updatedPO);
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
            <FileText className="w-6 h-6 text-primary mr-2" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">Purchase Order {purchaseOrder.number}</h3>
              <p className="text-sm text-gray-500">Vendor: {purchaseOrder.vendor.name}</p>
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

          {/* PO Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500">Status</label>
              <div className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  purchaseOrder.status === 'received' ? 'bg-green-100 text-green-800' :
                  purchaseOrder.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                  purchaseOrder.status === 'partially_received' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {purchaseOrder.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500">Created Date</label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(purchaseOrder.createdAt).toLocaleDateString()}
              </p>
            </div>

            {purchaseOrder.expectedDeliveryDate && (
              <div>
                <label className="block text-xs font-medium text-gray-500">Expected Delivery</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(purchaseOrder.expectedDeliveryDate).toLocaleDateString()}
                </p>
              </div>
            )}

            {purchaseOrder.approvedDate && (
              <div>
                <label className="block text-xs font-medium text-gray-500">Approved Date</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(purchaseOrder.approvedDate).toLocaleDateString()}
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
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ordered</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Received</th>
                    {receivingMode && (
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Receiving</th>
                    )}
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Cost</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {purchaseOrder.lineItems.map((item, index) => {
                    const lineItemId = item.id || `item-${index}`;
                    const receivingInput = receivingInputs.find(input => input.lineItemId === lineItemId);
                    const remaining = item.quantityOrdered - item.quantityReceived;

                    return (
                      <tr key={lineItemId}>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.product?.name || item.productId}
                          {item.description && (
                            <div className="text-xs text-gray-500">{item.description}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {item.quantityOrdered} {item.unit}
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
                              onChange={(e) => updateReceivingQuantity(lineItemId, parseFloat(e.target.value) || 0)}
                              className="w-20 border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm text-right focus:outline-none focus:ring-primary focus:border-primary"
                            />
                          </td>
                        )}
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          ${item.unitCost.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                          ${item.totalCost.toFixed(2)}
                        </td>
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

          {/* Totals */}
          <div className="bg-gray-50 rounded-md p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium text-gray-900">${purchaseOrder.subTotal.toFixed(2)}</span>
            </div>
            {purchaseOrder.shippingCost > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping:</span>
                <span className="font-medium text-gray-900">${purchaseOrder.shippingCost.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span className="text-gray-900">Total:</span>
              <span className="text-gray-900">${purchaseOrder.grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Notes */}
          {purchaseOrder.notes && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-md p-3">{purchaseOrder.notes}</p>
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
                    onClick={handleApprovePO}
                    disabled={processing}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4 inline-block mr-2" />
                    {processing ? 'Approving...' : 'Approve PO'}
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
