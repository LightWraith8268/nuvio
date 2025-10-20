import { X, Package, Truck, MapPin, Calendar, Clock, User, Phone, Mail, CreditCard } from 'lucide-react';
import type { Order } from '@/types';

interface OrderDetailModalProps {
  order: Order;
  onClose: () => void;
}

export default function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
  const isDelivery = order.type === 'ORDER';
  const delivery = order.metadata?.delivery;
  const payment = order.metadata?.payment;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Order #{order.number}</h3>
            <div className="flex items-center gap-3 mt-2">
              {order.type === 'INVOICE' ? (
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  In-Store
                </span>
              ) : (
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 flex items-center gap-1">
                  <Truck className="w-3 h-3" />
                  Delivery
                </span>
              )}
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                order.status === 'OUT_FOR_DELIVERY' ? 'bg-yellow-100 text-yellow-800' :
                order.status === 'SCHEDULED' ? 'bg-purple-100 text-purple-800' :
                order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {order.status}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Customer Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <User className="w-5 h-5" />
              Customer Information
            </h4>
            <div className="space-y-2">
              <div className="text-lg font-medium">{order.client.name}</div>
              {order.client.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  {order.client.email}
                </div>
              )}
              {order.client.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  {order.client.phone}
                </div>
              )}
              {order.client.priceBook && (
                <div className="mt-2">
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                    {order.client.priceBook === 'contractor' ? 'Contractor Pricing' : 'Retail Pricing'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Information */}
          {isDelivery && delivery && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Delivery Information
              </h4>
              <div className="space-y-3">
                {delivery.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <div>{delivery.address.street}</div>
                      <div>{delivery.address.city}, {delivery.address.state} {delivery.address.zip}</div>
                    </div>
                  </div>
                )}
                {delivery.scheduledDate && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    {new Date(delivery.scheduledDate).toLocaleDateString()}
                  </div>
                )}
                {delivery.timeSlot && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-5 h-5 text-gray-400" />
                    {delivery.timeSlot}
                  </div>
                )}
                {delivery.notes && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <div className="text-sm font-medium text-yellow-800">Delivery Notes:</div>
                    <div className="text-sm text-yellow-900 mt-1">{delivery.notes}</div>
                  </div>
                )}
                {delivery.deliveryFee && (
                  <div className="text-sm text-gray-600">
                    Delivery Fee: ${delivery.deliveryFee.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Information */}
          {payment && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Information
              </h4>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Method: </span>
                  {payment.method === 'house_account' && 'House Account'}
                  {payment.method === 'card_on_file' && 'Card on File'}
                  {payment.method === 'new_card' && 'New Card'}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Status: </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                    order.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {order.paymentStatus}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Line Items */}
          <div className="bg-white border rounded-lg">
            <div className="p-4 border-b bg-gray-50">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Items ({order.lineItems.length})
              </h4>
            </div>
            <div className="divide-y">
              {order.lineItems.map((item, index) => (
                <div key={index} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{item.name}</div>
                      {item.description && (
                        <div className="text-sm text-gray-500 mt-1">{item.description}</div>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <div className="font-semibold text-gray-900">
                        ${((item.quantity || 0) * (item.price || 0)).toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Quantity: {item.quantity || 0}</span>
                    <span>×</span>
                    <span>${(item.price || 0).toFixed(2)} each</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Totals */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">${(order.subTotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax:</span>
                <span className="font-medium">${(order.taxTotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Grand Total:</span>
                <span>${(order.grandTotal || 0).toFixed(2)}</span>
              </div>
              {(order.paidTotal || 0) > 0 && (
                <div className="flex justify-between text-sm text-green-600 pt-2">
                  <span>Paid:</span>
                  <span className="font-medium">${(order.paidTotal || 0).toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="text-xs text-gray-500 space-y-1">
            <div>Created: {new Date(order.createdAt).toLocaleString()}</div>
            <div>Last Updated: {new Date(order.updatedAt).toLocaleString()}</div>
            <div>Order ID: {order.id}</div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
