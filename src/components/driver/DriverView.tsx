import { useState, useEffect, useRef } from 'react';
import { Camera, MapPin, Phone, Package, CheckCircle, Clock, Navigation, X } from 'lucide-react';
import { invoissAPI } from '@/lib/invoiss-api';
import type { Order } from '@/types';

export default function DriverView() {
  const [deliveries, setDeliveries] = useState<Order[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    loadDeliveries();
  }, []);

  async function loadDeliveries() {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const allOrders = await invoissAPI.listOrders({ type: 'ORDER' });

      // Filter for today's deliveries assigned to this driver
      const driverDeliveries = allOrders.filter(order => {
        const isDelivery = order.metadata?.orderType === 'delivery';
        const scheduledDate = order.metadata?.delivery?.scheduledDate;
        const matchesDate = scheduledDate?.startsWith(today);
        const hasDriver = order.metadata?.delivery?.driverId; // In real app, filter by current driver ID

        return isDelivery && matchesDate && (order.status === 'SCHEDULED' || order.status === 'OUT_FOR_DELIVERY');
      });

      setDeliveries(driverDeliveries);
    } catch (error) {
      console.error('Failed to load deliveries:', error);
    } finally {
      setLoading(false);
    }
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use rear camera on mobile
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      setShowCamera(true);
    } catch (error) {
      console.error('Failed to access camera:', error);
      alert('Unable to access camera. Please check permissions.');
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  }

  function capturePhoto() {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0);
        const photoData = canvas.toDataURL('image/jpeg');
        setCapturedPhoto(photoData);
        stopCamera();
      }
    }
  }

  async function markAsDelivered() {
    if (!selectedDelivery || !capturedPhoto) return;

    try {
      await invoissAPI.updateOrder(selectedDelivery.id, {
        status: 'DELIVERED',
        metadata: {
          ...selectedDelivery.metadata,
          delivery: {
            ...selectedDelivery.metadata?.delivery,
            completedAt: new Date().toISOString(),
            proofPhoto: capturedPhoto
          }
        }
      });

      // Refresh deliveries
      await loadDeliveries();
      setSelectedDelivery(null);
      setCapturedPhoto(null);
    } catch (error) {
      console.error('Failed to mark as delivered:', error);
      alert('Failed to update delivery status');
    }
  }

  async function startDelivery(order: Order) {
    try {
      await invoissAPI.updateOrder(order.id, {
        status: 'OUT_FOR_DELIVERY',
        metadata: {
          ...order.metadata,
          delivery: {
            ...order.metadata?.delivery,
            startedAt: new Date().toISOString()
          }
        }
      });

      await loadDeliveries();
      setSelectedDelivery(order);
    } catch (error) {
      console.error('Failed to start delivery:', error);
    }
  }

  function getDirections(address: any) {
    if (!address) return;
    const addressString = `${address.street}, ${address.city}, ${address.state} ${address.zip}`;
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addressString)}`;
    window.open(mapsUrl, '_blank');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-gray-600">Loading deliveries...</div>
      </div>
    );
  }

  // Delivery Detail View
  if (selectedDelivery) {
    const delivery = selectedDelivery.metadata?.delivery;

    return (
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <div className="bg-primary text-white p-4 sticky top-0 z-10 shadow-md">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setSelectedDelivery(null);
                setCapturedPhoto(null);
                stopCamera();
              }}
              className="p-2 -ml-2"
            >
              <X className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold">Delivery #{selectedDelivery.number}</h1>
            <div className="w-10" />
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Customer Info */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold text-lg mb-3">{selectedDelivery.client.name}</h2>

            {delivery?.address && (
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-gray-700">
                  <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <div>{delivery.address.street}</div>
                    <div>{delivery.address.city}, {delivery.address.state} {delivery.address.zip}</div>
                  </div>
                </div>

                <button
                  onClick={() => getDirections(delivery.address)}
                  className="w-full mt-3 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-medium"
                >
                  <Navigation className="w-5 h-5" />
                  Get Directions
                </button>
              </div>
            )}

            {selectedDelivery.client.phone && (
              <div className="flex items-center gap-2 text-gray-700 mt-3 pt-3 border-t">
                <Phone className="w-5 h-5" />
                <a href={`tel:${selectedDelivery.client.phone}`} className="text-blue-600">
                  {selectedDelivery.client.phone}
                </a>
              </div>
            )}
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Items ({selectedDelivery.lineItems.length})
            </h3>
            <div className="space-y-2">
              {selectedDelivery.lineItems.map((item, index) => (
                <div key={index} className="flex justify-between py-2 border-b last:border-0">
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-600">
                      {item.quantity} × ${item.price.toFixed(2)}
                    </div>
                  </div>
                  <div className="font-semibold">${(item.quantity * item.price).toFixed(2)}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>${selectedDelivery.grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Delivery Notes */}
          {delivery?.notes && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Delivery Notes</h3>
              <p className="text-gray-700">{delivery.notes}</p>
            </div>
          )}

          {/* Photo Capture */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold mb-3">Proof of Delivery</h3>

            {!capturedPhoto && !showCamera && (
              <button
                onClick={startCamera}
                className="w-full flex items-center justify-center gap-2 bg-gray-100 border-2 border-dashed border-gray-300 py-12 rounded-lg"
              >
                <Camera className="w-8 h-8 text-gray-400" />
                <span className="text-gray-600">Take Photo</span>
              </button>
            )}

            {showCamera && (
              <div className="space-y-3">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-lg bg-black"
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="flex gap-2">
                  <button
                    onClick={stopCamera}
                    className="flex-1 py-3 border border-gray-300 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={capturePhoto}
                    className="flex-1 py-3 bg-primary text-white rounded-lg font-medium"
                  >
                    Capture
                  </button>
                </div>
              </div>
            )}

            {capturedPhoto && (
              <div className="space-y-3">
                <img src={capturedPhoto} alt="Proof of delivery" className="w-full rounded-lg" />
                <button
                  onClick={() => {
                    setCapturedPhoto(null);
                    startCamera();
                  }}
                  className="w-full py-2 text-primary border border-primary rounded-lg"
                >
                  Retake Photo
                </button>
              </div>
            )}
          </div>

          {/* Complete Delivery Button */}
          {capturedPhoto && (
            <button
              onClick={markAsDelivered}
              className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-4 rounded-lg font-semibold text-lg shadow-lg"
            >
              <CheckCircle className="w-6 h-6" />
              Complete Delivery
            </button>
          )}
        </div>
      </div>
    );
  }

  // Deliveries List View
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-primary text-white p-4 sticky top-0 z-10 shadow-md">
        <h1 className="text-2xl font-bold">My Deliveries</h1>
        <p className="text-primary-foreground/80 text-sm mt-1">
          {deliveries.length} deliveries today
        </p>
      </div>

      {/* Deliveries List */}
      <div className="p-4 space-y-3">
        {deliveries.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No deliveries scheduled for today</p>
          </div>
        ) : (
          deliveries.map((order) => {
            const delivery = order.metadata?.delivery;
            const isOutForDelivery = order.status === 'OUT_FOR_DELIVERY';

            return (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold text-lg">Order #{order.number}</div>
                      <div className="text-gray-600">{order.client.name}</div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      isOutForDelivery
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {isOutForDelivery ? 'In Progress' : 'Scheduled'}
                    </span>
                  </div>

                  {delivery?.address && (
                    <div className="flex items-start gap-2 text-gray-700 mb-3">
                      <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <div>{delivery.address.street}</div>
                        <div>{delivery.address.city}, {delivery.address.state}</div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <Package className="w-4 h-4" />
                    <span>{order.lineItems.length} items</span>
                    <span>•</span>
                    <span>${order.grandTotal.toFixed(2)}</span>
                    {delivery?.timeSlot && (
                      <>
                        <span>•</span>
                        <Clock className="w-4 h-4" />
                        <span>{delivery.timeSlot}</span>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => isOutForDelivery ? setSelectedDelivery(order) : startDelivery(order)}
                    className={`w-full py-3 rounded-lg font-medium ${
                      isOutForDelivery
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-900 border border-gray-300'
                    }`}
                  >
                    {isOutForDelivery ? 'View Details' : 'Start Delivery'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
