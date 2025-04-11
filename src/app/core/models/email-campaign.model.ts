// src/app/core/models/email-campaign.model.ts
export interface EmailCampaign {
  id: string;
  name: string;
  description?: string;
  templateId: string;
  template?: any; // Will be populated with the template data when needed
  status: 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduledAt?: string;
  sentAt?: string;
  targetAudience?: any; // JSON object with targeting criteria
  abTestEnabled?: boolean;
  abTestData?: any; // JSON object with A/B test configuration
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}
