// src/app/core/models/email-message.model.ts
export interface EmailMessage {
  id: string;
  accountId: string;
  folderId?: string;
  threadId?: string;
  providerId?: string; // ID used by the email provider
  messageId?: string; // RFC 5322 Message-ID
  inReplyTo?: string; // RFC 5322 In-Reply-To
  references?: string[]; // RFC 5322 References
  fromAddress: string;
  fromName?: string;
  toAddresses: string[];
  ccAddresses?: string[];
  bccAddresses?: string[];
  subject?: string;
  htmlBody?: string;
  plainBody?: string;
  isRead: boolean;
  isStarred: boolean;
  isImportant: boolean;
  hasAttachments: boolean;
  sentAt?: string;
  receivedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  attachments?: EmailAttachment[];
  labels?: EmailLabel[];
}

export interface EmailThread {
  id: string;
  accountId: string;
  subject?: string;
  snippet?: string; // Short preview of the latest message
  participants?: string[]; // All email addresses involved
  messageCount: number;
  unreadCount: number;
  isStarred: boolean;
  isImportant: boolean;
  hasAttachments: boolean;
  latestMessageAt?: string;
  createdAt?: string;
  updatedAt?: string;
  messages?: EmailMessage[];
}

export interface EmailAttachment {
  id: string;
  messageId: string;
  filename: string;
  contentType?: string;
  size?: number;
  contentId?: string; // For inline attachments
  storagePath?: string; // Path in storage bucket
  createdAt?: string;
  url?: string; // Generated URL for download
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
