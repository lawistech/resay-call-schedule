// src/app/core/models/email-sequence.model.ts
export interface EmailSequence {
  id: string;
  name: string;
  description?: string;
  triggerType: 'new_contact' | 'status_change' | 'deal_stage' | 'manual';
  triggerData?: any; // JSON object with trigger configuration
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  steps?: EmailSequenceStep[];
}

export interface EmailSequenceStep {
  id: string;
  sequenceId: string;
  templateId: string;
  template?: any; // Will be populated with the template data when needed
  stepOrder: number;
  delayDays: number;
  delayHours: number;
  condition?: string;
  createdAt?: string;
  updatedAt?: string;
}
