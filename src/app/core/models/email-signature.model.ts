// src/app/core/models/email-signature.model.ts
export interface EmailSignature {
  id: string;
  userId: string;
  name: string;
  isDefault: boolean;
  content: string;
  createdAt?: string;
  updatedAt?: string;
}
