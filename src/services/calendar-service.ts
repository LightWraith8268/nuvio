/**
 * Calendar Service
 *
 * Manages calendar events for deliveries and appointments using Supabase Edge Functions
 */

import { calendarApi } from './api-clients/calendar-api';
import type { CalendarEvent } from './api-clients/calendar-api';
import type { Order } from '@/types';

class CalendarService {
  /**
   * Create a calendar event for a delivery order
   */
  async createDeliveryEvent(order: Order): Promise<CalendarEvent | null> {
    // Only create events for delivery orders
    if (order.type !== 'ORDER') {
      return null;
    }

    const delivery = order.metadata?.delivery;
    if (!delivery || !delivery.scheduledDate) {
      console.warn('Order missing delivery information, skipping calendar event');
      return null;
    }

    try {
      const event: CalendarEvent = {
        title: `Delivery: Order #${order.number}`,
        description: this.buildEventDescription(order),
        startDate: delivery.scheduledDate,
        endDate: delivery.scheduledDate, // Same day delivery
        location: this.formatAddress(delivery.address),
        metadata: {
          orderId: order.id,
          orderNumber: order.number,
          clientId: order.client.id,
          clientName: order.client.name,
          phone: order.client.phone,
          deliveryInstructions: delivery.instructions,
          timeSlot: delivery.timeSlot,
        },
      };

      const response = await calendarApi.createEvent(event);
      console.log('✓ Calendar event created:', response.data.id);

      return response.data;
    } catch (error) {
      console.error('Failed to create calendar event:', error);
      // Don't throw - calendar event is nice-to-have, not critical
      return null;
    }
  }

  /**
   * Create a calendar event for an appointment
   */
  async createAppointmentEvent(
    title: string,
    date: string,
    customer: string,
    notes?: string
  ): Promise<CalendarEvent | null> {
    try {
      const event: CalendarEvent = {
        title,
        description: notes || `Appointment with ${customer}`,
        startDate: date,
        metadata: {
          type: 'appointment',
          customer,
        },
      };

      const response = await calendarApi.createEvent(event);
      console.log('✓ Appointment event created:', response.data.id);

      return response.data;
    } catch (error) {
      console.error('Failed to create appointment event:', error);
      return null;
    }
  }

  /**
   * Build event description from order details
   */
  private buildEventDescription(order: Order): string {
    const parts = [
      `Customer: ${order.client.name}`,
      `Phone: ${order.client.phone || 'N/A'}`,
      `Order Total: $${order.grandTotal.toFixed(2)}`,
    ];

    const delivery = order.metadata?.delivery;
    if (delivery) {
      if (delivery.timeSlot) {
        parts.push(`Time Slot: ${delivery.timeSlot}`);
      }
      if (delivery.instructions) {
        parts.push(`Instructions: ${delivery.instructions}`);
      }
    }

    // Add line items summary
    if (order.lineItems.length > 0) {
      parts.push('\nItems:');
      order.lineItems.forEach(item => {
        parts.push(`- ${item.quantity}x ${item.description}`);
      });
    }

    return parts.join('\n');
  }

  /**
   * Format address for calendar location
   */
  private formatAddress(address: any): string {
    if (!address) return '';

    const parts = [
      address.street,
      address.city,
      address.state,
      address.zip,
    ].filter(Boolean);

    return parts.join(', ');
  }

  /**
   * Extract event information from text (using extract-event API)
   */
  async extractEventFromText(text: string): Promise<CalendarEvent | null> {
    try {
      const response = await calendarApi.extractEvent(text);
      return response.data;
    } catch (error) {
      console.error('Failed to extract event:', error);
      return null;
    }
  }

  /**
   * Split a multi-day event into individual events
   */
  async splitMultiDayEvent(event: CalendarEvent): Promise<CalendarEvent[]> {
    try {
      const response = await calendarApi.splitEvents(event);
      return response.data;
    } catch (error) {
      console.error('Failed to split event:', error);
      return [event]; // Return original event on error
    }
  }
}

// Export singleton instance
export const calendarService = new CalendarService();
