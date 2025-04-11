// src/app/core/models/email-template.model.ts
export interface EmailTemplate {
  id: string;
  name: string;
  description?: string;
  subject: string;
  htmlContent: string;
  plainContent?: string;
  category?: string;
  tags?: string[];
  variables?: string[];
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}
