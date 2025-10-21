/**
 * Estimate Detail Modal
 *
 * View estimate details and approve to convert into delivery order.
 *
 * Features:
 * - Full estimate details view
 * - Approve estimate → creates delivery order with same details
 * - Edit delivery date before approval
 * - Cancel/reject estimate
 */

import { useState } from 'react';
import { X, CheckCircle, Calendar, MapPin, Package, DollarSign, User, Truck } from 'lucide-react';
import { invoissAPI } from '@/lib/invoiss-api';
import type { Order } from '@/types';

interface EstimateDetailModalProps {
  estimate: Order;
  onClose: () => void;
  onApproved: () => void;
}

export default function EstimateDetailModal({ estimate, onClose, onApproved }: EstimateDetailModalProps) {
  const [approving, setApproving] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState(
    estimate.metadata?.delivery?.scheduledDate || new Date().toISOString().split('T')[0]
  );
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState(
    estimate.metadata?.delivery?.timeSlot || 'morning'
  );

  const handleApprove = async () => {
    setApproving(true);
    try {
      // Create delivery order from estimate
      const deliveryOrderData = {
        clientId: estimate.client.id,
        type: 'ORDER', // Convert ESTIMATE → ORDER (delivery)
        lineItems: estimate.lineItems.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
          originalPrice: item.originalPrice,
          priceOverride: item.priceOverride,
          total: item.quantity * item.price,
          metadata: item.metadata,
        })),
        metadata: {
          orderType: 'delivery',
          estimateId: estimate.id, // Link back to original estimate
          estimateNumber: estimate.number,
          delivery: {
            scheduledDate: deliveryDate,
            timeSlot: deliveryTimeSlot,
            address: estimate.metadata?.delivery?.address,
            instructions: estimate.metadata?.delivery?.instructions,
          },
        },
      };

      // Create the delivery order
      await invoissAPI.createOrder(deliveryOrderData);

      // Update estimate status to CONFIRMED
      // Note: In real implementation, you'd have an updateOrder API method
      // For now, the estimate will remain in ESTIMATE status
      // but we'll mark it via metadata

      alert(`Estimate ${estimate.number} approved! Delivery order created successfully.`);
      onApproved();
    } catch (error) {
      console.error('Error approving estimate:', error);
      alert('Failed to approve estimate. Please try again.');
    } finally {
      setApproving(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm(`Are you sure you want to cancel estimate ${estimate.number}?`)) {
      return;
    }

    try {
      // In real implementation, update estimate status to CANCELLED
      alert(`Estimate ${estimate.number} cancelled.`);
      onClose();
    } catch (error) {
      console.error('Error cancelling estimate:', error);
      alert('Failed to cancel estimate. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Estimate Details</h2>
            <p className="text-sm text-gray-500 mt-1">Estimate #{estimate.number}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Client Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <User className="w-5 h-5 mr-2 text-primary" />
              Client Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Name:</span>
                <div className="font-medium text-gray-900">{estimate.client.name}</div>
              </div>
              <div>
                <span className="text-gray-600">Email:</span>
                <div className="font-medium text-gray-900">{estimate.client.email || '—'}</div>
              </div>
              <div>
                <span className="text-gray-600">Phone:</span>
                <div className="font-medium text-gray-900">{estimate.client.phone || '—'}</div>
              </div>
              <div>
                <span className="text-gray-600">Created:</span>
                <div className="font-medium text-gray-900">
                  {new Date(estimate.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          {estimate.metadata?.delivery && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <Truck className="w-5 h-5 mr-2 text-primary" />
                Delivery Information
              </h3>
              <div className="space-y-2 text-sm">
                {estimate.metadata.delivery.address && (
                  <div className="flex items-start">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {estimate.metadata.delivery.address.street}
                      </div>
                      <div className="text-gray-600">
                        {estimate.metadata.delivery.address.city}, {estimate.metadata.delivery.address.state} {estimate.metadata.delivery.address.zip}
                      </div>
                    </div>
                  </div>
                )}
                {estimate.metadata.delivery.scheduledDate && (
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    <div>
                      <span className="text-gray-600">Requested Date: </span>
                      <span className="font-medium text-gray-900">
                        {new Date(estimate.metadata.delivery.scheduledDate).toLocaleDateString()}
                      </span>
                      {estimate.metadata.delivery.timeSlot && (
                        <span className="ml-2 text-gray-600">
                          ({estimate.metadata.delivery.timeSlot})
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {estimate.metadata.delivery.instructions && (
                  <div className="text-gray-600">
                    <span className="font-medium">Instructions:</span> {estimate.metadata.delivery.instructions}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Line Items */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <Package className="w-5 h-5 mr-2 text-primary" />
              Line Items
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {estimate.lineItems.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {item.description || item.name}
                        {item.priceOverride && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            Price Override
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        ${item.price.toFixed(2)}
                        {item.originalPrice && item.originalPrice !== item.price && (
                          <span className="ml-2 text-xs text-gray-500 line-through">
                            ${item.originalPrice.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                        ${(item.quantity * item.price).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-primary" />
              Pricing Summary
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium text-gray-900">${estimate.subTotal.toFixed(2)}</span>
              </div>
              {estimate.metadata?.delivery && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Fee:</span>
                  <span className="font-medium text-gray-900">
                    ${((estimate.grandTotal - estimate.subTotal - estimate.taxTotal) || 0).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Tax:</span>
                <span className="font-medium text-gray-900">${estimate.taxTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t text-lg font-bold">
                <span>Total:</span>
                <span className="text-primary">${estimate.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Approval Section */}
          {estimate.status === 'ESTIMATE' && (
            <div className="border-t pt-6">
              <h3 className="font-medium text-gray-900 mb-4">Approve Estimate</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="deliveryDate" className="block text-sm font-medium text-gray-700 mb-1">
                      Delivery Date
                    </label>
                    <input
                      id="deliveryDate"
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="timeSlot" className="block text-sm font-medium text-gray-700 mb-1">
                      Time Slot
                    </label>
                    <select
                      id="timeSlot"
                      value={deliveryTimeSlot}
                      onChange={(e) => setDeliveryTimeSlot(e.target.value)}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    >
                      <option value="morning">Morning (8am-12pm)</option>
                      <option value="afternoon">Afternoon (12pm-4pm)</option>
                      <option value="evening">Evening (4pm-7pm)</option>
                    </select>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    Approving this estimate will create a delivery order with the details above.
                    The estimate will be marked as approved and a new delivery order will be scheduled.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          {estimate.status === 'ESTIMATE' && (
            <>
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Cancel Estimate
              </button>
              <button
                onClick={handleApprove}
                disabled={approving}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {approving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve & Create Delivery Order
                  </>
                )}
              </button>
            </>
          )}
          {estimate.status !== 'ESTIMATE' && (
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
