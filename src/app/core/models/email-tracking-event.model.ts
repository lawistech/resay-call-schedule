// src/app/core/models/email-tracking-event.model.ts
export interface EmailTrackingEvent {
  id: string;
  recipientId: string;
  eventType: 'open' | 'click' | 'bounce' | 'unsubscribe';
  eventData?: any; // JSON object with additional data
  ipAddress?: string;
  userAgent?: string;
  createdAt?: string;
}
