// src/app/core/models/email-recipient.model.ts
export interface EmailRecipient {
  id: string;
  campaignId: string;
  contactId: string;
  email: string;
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed';
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  bouncedAt?: string;
  unsubscribedAt?: string;
  abVariant?: 'A' | 'B';
  customVariables?: any; // JSON object with personalized variables
  createdAt?: string;
  updatedAt?: string;
}
