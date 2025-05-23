// src/app/core/services/email-account.service.ts
import { Injectable } from '@angular/core';
import { Observable, from, throwError, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { NotificationService } from './notification.service';
import { AuthService } from './auth.service';
import { EmailAccount, EmailFolder, EmailLabel, EmailAccess, EmailFilter } from '../models/email-account.model';
import { EmailMessage, EmailAttachment } from '../models/email-message.model';

@Injectable({
  providedIn: 'root'
})
export class EmailAccountService {
  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  // Email Account Methods
  getEmailAccounts(): Observable<EmailAccount[]> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      return throwError(() => new Error('User not authenticated'));
    }

    return from(this.supabaseService.supabaseClient
      .from('email_accounts')
      .select('*')
      .or(`user_id.eq.${user.id},id.in.(${this.getSharedAccountsQuery()})`)
      .order('created_at', { ascending: false })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data.map(account => this.formatAccountFromDatabase(account));
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch email accounts: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  getEmailAccountById(id: string): Observable<EmailAccount> {
    return from(this.supabaseService.supabaseClient
      .from('email_accounts')
      .select('*')
      .eq('id', id)
      .single()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return this.formatAccountFromDatabase(response.data);
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch email account: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  createEmailAccount(account: Partial<EmailAccount>): Observable<EmailAccount> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      return throwError(() => new Error('User not authenticated'));
    }

    const dbAccount = this.formatAccountForDatabase({
      ...account,
      userId: user.id
    });

    return from(this.supabaseService.supabaseClient
      .from('email_accounts')
      .insert(dbAccount)
      .select()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        this.notificationService.success('Email account created successfully');
        return this.formatAccountFromDatabase(response.data[0]);
      }),
      catchError(error => {
        this.notificationService.error(`Failed to create email account: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  updateEmailAccount(id: string, account: Partial<EmailAccount>): Observable<EmailAccount> {
    const dbAccount = this.formatAccountForDatabase(account);

    return from(this.supabaseService.supabaseClient
      .from('email_accounts')
      .update(dbAccount)
      .eq('id', id)
      .select()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        this.notificationService.success('Email account updated successfully');
        return this.formatAccountFromDatabase(response.data[0]);
      }),
      catchError(error => {
        this.notificationService.error(`Failed to update email account: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  deleteEmailAccount(id: string): Observable<void> {
    return from(this.supabaseService.supabaseClient
      .from('email_accounts')
      .delete()
      .eq('id', id)
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        this.notificationService.success('Email account deleted successfully');
      }),
      catchError(error => {
        this.notificationService.error(`Failed to delete email account: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  // Email Folder Methods
  getEmailFolders(accountId: string): Observable<EmailFolder[]> {
    return from(this.supabaseService.supabaseClient
      .from('email_folders')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data.map(folder => this.formatFolderFromDatabase(folder));
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch email folders: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  // Email Label Methods
  getEmailLabels(accountId: string): Observable<EmailLabel[]> {
    return from(this.supabaseService.supabaseClient
      .from('email_labels')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data.map(label => this.formatLabelFromDatabase(label));
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch email labels: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  // Email Access Methods
  getEmailAccess(accountId: string): Observable<EmailAccess[]> {
    return from(this.supabaseService.supabaseClient
      .from('email_access')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data.map(access => this.formatAccessFromDatabase(access));
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch email access: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  // Email Filter Methods
  getEmailFilters(accountId: string): Observable<EmailFilter[]> {
    return from(this.supabaseService.supabaseClient
      .from('email_filters')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data.map(filter => this.formatFilterFromDatabase(filter));
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch email filters: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  // Email Message Methods
  getMessages(accountId: string, folderId: string, params: any = {}): Observable<EmailMessage[]> {
    return from(this.supabaseService.supabaseClient
      .from('email_messages')
      .select('*')
      .eq('account_id', accountId)
      .eq('folder_id', folderId)
      .order('received_at', { ascending: false })
      .range(params.start || 0, (params.start || 0) + (params.limit || 20) - 1)
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data.map(message => this.formatMessageFromDatabase(message));
      }),
      catchError(error => {
        console.error('Error fetching messages:', error);
        // Fall back to mock data for development
        return of(this.generateMockMessages(accountId, folderId));
      })
    );
  }

  getMessage(accountId: string, messageId: string): Observable<EmailMessage> {
    return from(this.supabaseService.supabaseClient
      .from('email_messages')
      .select(`
        *,
        attachments:email_attachments(*)
      `)
      .eq('account_id', accountId)
      .eq('id', messageId)
      .single()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return this.formatMessageFromDatabase(response.data);
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch email message: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  sendEmail(accountId: string, message: Partial<EmailMessage>): Observable<EmailMessage> {
    // In a real implementation, this would call the email provider API
    // For now, we'll just save it to the database
    const user = this.authService.getCurrentUser();
    if (!user) {
      return throwError(() => new Error('User not authenticated'));
    }

    return this.getEmailFolders(accountId).pipe(
      switchMap(folders => {
        const sentFolder = folders.find(folder => folder.type === 'sent');
        if (!sentFolder) {
          throw new Error('Sent folder not found');
        }

        const dbMessage = this.formatMessageForDatabase({
          ...message,
          accountId,
          folderId: sentFolder.id,
          isRead: true,
          sentAt: new Date().toISOString()
        });

        return from(this.supabaseService.supabaseClient
          .from('email_messages')
          .insert(dbMessage)
          .select()
        );
      }),
      map(response => {
        if (response.error) throw response.error;
        this.notificationService.success('Email sent successfully');
        return this.formatMessageFromDatabase(response.data[0]);
      }),
      catchError(error => {
        this.notificationService.error(`Failed to send email: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  // Helper Methods
  private getSharedAccountsQuery(): string {
    const user = this.authService.getCurrentUser();
    if (!user) return '';

    return `SELECT account_id FROM email_access WHERE user_id = '${user.id}'`;
  }

  private formatMessageFromDatabase(data: any): EmailMessage {
    return {
      id: data.id,
      accountId: data.account_id,
      folderId: data.folder_id,
      threadId: data.thread_id,
      providerId: data.provider_id,
      messageId: data.message_id,
      inReplyTo: data.in_reply_to,
      references: data.references,
      fromAddress: data.from_address,
      fromName: data.from_name,
      toAddresses: data.to_addresses || [],
      ccAddresses: data.cc_addresses || [],
      bccAddresses: data.bcc_addresses || [],
      subject: data.subject,
      htmlBody: data.html_body,
      plainBody: data.plain_body,
      isRead: data.is_read,
      isStarred: data.is_starred,
      isImportant: data.is_important,
      hasAttachments: data.has_attachments,
      sentAt: data.sent_at,
      receivedAt: data.received_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      attachments: data.attachments ? data.attachments.map((att: any) => this.formatAttachmentFromDatabase(att)) : undefined
    };
  }

  private formatMessageForDatabase(data: Partial<EmailMessage>): any {
    const result: any = {};

    if (data.accountId !== undefined) result.account_id = data.accountId;
    if (data.folderId !== undefined) result.folder_id = data.folderId;
    if (data.threadId !== undefined) result.thread_id = data.threadId;
    if (data.providerId !== undefined) result.provider_id = data.providerId;
    if (data.messageId !== undefined) result.message_id = data.messageId;
    if (data.inReplyTo !== undefined) result.in_reply_to = data.inReplyTo;
    if (data.references !== undefined) result.references = data.references;
    if (data.fromAddress !== undefined) result.from_address = data.fromAddress;
    if (data.fromName !== undefined) result.from_name = data.fromName;
    if (data.toAddresses !== undefined) result.to_addresses = data.toAddresses;
    if (data.ccAddresses !== undefined) result.cc_addresses = data.ccAddresses;
    if (data.bccAddresses !== undefined) result.bcc_addresses = data.bccAddresses;
    if (data.subject !== undefined) result.subject = data.subject;
    if (data.htmlBody !== undefined) result.html_body = data.htmlBody;
    if (data.plainBody !== undefined) result.plain_body = data.plainBody;
    if (data.isRead !== undefined) result.is_read = data.isRead;
    if (data.isStarred !== undefined) result.is_starred = data.isStarred;
    if (data.isImportant !== undefined) result.is_important = data.isImportant;
    if (data.hasAttachments !== undefined) result.has_attachments = data.hasAttachments;
    if (data.sentAt !== undefined) result.sent_at = data.sentAt;
    if (data.receivedAt !== undefined) result.received_at = data.receivedAt;

    return result;
  }

  private formatAttachmentFromDatabase(data: any): EmailAttachment {
    return {
      id: data.id,
      messageId: data.message_id,
      filename: data.filename,
      contentType: data.content_type,
      size: data.size,
      contentId: data.content_id,
      storagePath: data.storage_path,
      createdAt: data.created_at,
      url: data.url
    };
  }

  // Authentication methods
  getGmailAuthUrl(): Observable<string> {
    // In a real implementation, this would call an API
    // For now, we'll just return a mock URL
    return of('https://accounts.google.com/o/oauth2/auth?mock=true');
  }

  getMicrosoft365AuthUrl(): Observable<string> {
    // In a real implementation, this would call an API
    // For now, we'll just return a mock URL
    return of('https://login.microsoftonline.com/common/oauth2/v2.0/authorize?mock=true');
  }

  // Generate mock data for development
  private generateMockMessages(accountId: string, folderId: string): EmailMessage[] {
    // Generate mock email messages for development
    const mockMessages: EmailMessage[] = Array(20).fill(0).map((_, i) => ({
      id: `msg-${i}`,
      accountId,
      folderId,
      threadId: `thread-${Math.floor(i / 3)}`, // Group messages into threads
      fromAddress: `sender${i % 5}@example.com`,
      fromName: `Sender ${i % 5}`,
      toAddresses: ['user@example.com'],
      subject: `Test Email ${i}`,
      plainBody: `This is a test email message ${i}...`,
      isRead: i % 3 === 0,
      isStarred: i % 7 === 0,
      isImportant: i % 5 === 0,
      hasAttachments: i % 4 === 0,
      sentAt: new Date(Date.now() - i * 3600000).toISOString(),
      receivedAt: new Date(Date.now() - i * 3600000 + 10000).toISOString()
    }));

    return mockMessages;
  }

  // Mark message as read
  markMessageAsRead(accountId: string, messageId: string): Observable<void> {
    return from(this.supabaseService.supabaseClient
      .from('email_messages')
      .update({ is_read: true })
      .eq('account_id', accountId)
      .eq('id', messageId)
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return;
      }),
      catchError(error => {
        console.error('Error marking message as read:', error);
        return throwError(() => error);
      })
    );
  }

  private formatAccountFromDatabase(data: any): EmailAccount {
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      email: data.email,
      provider: data.provider,
      providerSettings: data.provider_settings,
      authCredentials: data.auth_credentials,
      isActive: data.is_active,
      isDefault: data.is_default,
      syncStatus: data.sync_status,
      lastSyncAt: data.last_sync_at,
      errorMessage: data.error_message,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  private formatAccountForDatabase(data: Partial<EmailAccount>): any {
    const result: any = {};

    if (data.userId !== undefined) result.user_id = data.userId;
    if (data.name !== undefined) result.name = data.name;
    if (data.email !== undefined) result.email = data.email;
    if (data.provider !== undefined) result.provider = data.provider;
    if (data.providerSettings !== undefined) result.provider_settings = data.providerSettings;
    if (data.authCredentials !== undefined) result.auth_credentials = data.authCredentials;
    if (data.isActive !== undefined) result.is_active = data.isActive;
    if (data.isDefault !== undefined) result.is_default = data.isDefault;
    if (data.syncStatus !== undefined) result.sync_status = data.syncStatus;
    if (data.lastSyncAt !== undefined) result.last_sync_at = data.lastSyncAt;
    if (data.errorMessage !== undefined) result.error_message = data.errorMessage;

    return result;
  }

  private formatFolderFromDatabase(data: any): EmailFolder {
    return {
      id: data.id,
      accountId: data.account_id,
      name: data.name,
      providerId: data.provider_id,
      type: data.type,
      isSystem: data.is_system,
      parentId: data.parent_id,
      unreadCount: data.unread_count,
      totalCount: data.total_count,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  private formatLabelFromDatabase(data: any): EmailLabel {
    return {
      id: data.id,
      accountId: data.account_id,
      name: data.name,
      color: data.color,
      providerId: data.provider_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  private formatAccessFromDatabase(data: any): EmailAccess {
    return {
      id: data.id,
      accountId: data.account_id,
      userId: data.user_id,
      permissionLevel: data.permission_level,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  private formatFilterFromDatabase(data: any): EmailFilter {
    return {
      id: data.id,
      accountId: data.account_id,
      name: data.name,
      conditions: data.conditions,
      actions: data.actions,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }
}
