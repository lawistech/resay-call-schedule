// src/app/core/models/email-account.model.ts
export interface EmailAccount {
  id: string;
  userId: string;
  name: string;
  email: string;
  provider: 'gmail' | 'microsoft365' | 'imap' | 'smtp' | 'exchange';
  providerSettings?: any; // Provider-specific settings
  authCredentials?: any; // Encrypted credentials or OAuth tokens
  isActive: boolean;
  isDefault: boolean;
  syncStatus: 'not_synced' | 'syncing' | 'synced' | 'error';
  lastSyncAt?: string;
  errorMessage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmailFolder {
  id: string;
  accountId: string;
  name: string;
  providerId?: string; // ID used by the email provider
  type: 'inbox' | 'sent' | 'drafts' | 'trash' | 'spam' | 'custom';
  isSystem: boolean; // System folders cannot be deleted
  parentId?: string; // For nested folders
  unreadCount: number;
  totalCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmailLabel {
  id: string;
  accountId: string;
  name: string;
  color?: string;
  providerId?: string; // ID used by the email provider
  createdAt?: string;
  updatedAt?: string;
}

export interface EmailAccess {
  id: string;
  accountId: string;
  userId: string;
  permissionLevel: 'read' | 'write' | 'admin';
  createdAt?: string;
  updatedAt?: string;
}

export interface EmailFilter {
  id: string;
  accountId: string;
  name: string;
  conditions: any; // Filter conditions
  actions: any; // Actions to take when conditions match
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}
