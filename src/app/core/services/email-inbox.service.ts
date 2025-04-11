// src/app/core/services/email-inbox.service.ts
import { Injectable } from '@angular/core';
import { Observable, from, throwError, of, forkJoin } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { NotificationService } from './notification.service';
import { AuthService } from './auth.service';
import { EmailAccountService } from './email-account.service';
import { EmailProviderService } from './email-provider.service';
import { EmailMessage, EmailThread, EmailAttachment } from '../models/email-message.model';
import { EmailAccount, EmailFolder, EmailLabel } from '../models/email-account.model';

@Injectable({
  providedIn: 'root'
})
export class EmailInboxService {
  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private emailAccountService: EmailAccountService,
    private emailProviderService: EmailProviderService
  ) {}

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
        return this.emailProviderService.getMockMessages(accountId, folderId);
      })
    );
  }

  getThreads(accountId: string, params: any = {}): Observable<EmailThread[]> {
    return from(this.supabaseService.supabaseClient
      .from('email_threads')
      .select('*')
      .eq('account_id', accountId)
      .order('latest_message_at', { ascending: false })
      .range(params.start || 0, (params.start || 0) + (params.limit || 20) - 1)
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data.map(thread => this.formatThreadFromDatabase(thread));
      }),
      catchError(error => {
        console.error('Error fetching threads:', error);
        // Fall back to mock data for development
        return this.emailProviderService.getMockThreads(accountId);
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

  getThread(accountId: string, threadId: string): Observable<EmailThread> {
    return from(this.supabaseService.supabaseClient
      .from('email_threads')
      .select('*')
      .eq('id', threadId)
      .single()
    ).pipe(
      switchMap(threadResponse => {
        if (threadResponse.error) throw threadResponse.error;

        const thread = this.formatThreadFromDatabase(threadResponse.data);

        // Get all messages in this thread
        return from(this.supabaseService.supabaseClient
          .from('email_messages')
          .select(`
            *,
            attachments:email_attachments(*)
          `)
          .eq('thread_id', threadId)
          .order('received_at', { ascending: true })
        ).pipe(
          map(messagesResponse => {
            if (messagesResponse.error) throw messagesResponse.error;

            thread.messages = messagesResponse.data.map(message =>
              this.formatMessageFromDatabase(message)
            );

            return thread;
          })
        );
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch email thread: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  markMessageAsRead(accountId: string, messageId: string): Observable<EmailMessage> {
    return from(this.supabaseService.supabaseClient
      .from('email_messages')
      .update({ is_read: true })
      .eq('id', messageId)
      .select()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return this.formatMessageFromDatabase(response.data[0]);
      }),
      catchError(error => {
        this.notificationService.error(`Failed to mark message as read: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  markMessageAsUnread(accountId: string, messageId: string): Observable<EmailMessage> {
    return from(this.supabaseService.supabaseClient
      .from('email_messages')
      .update({ is_read: false })
      .eq('id', messageId)
      .select()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return this.formatMessageFromDatabase(response.data[0]);
      }),
      catchError(error => {
        this.notificationService.error(`Failed to mark message as unread: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  starMessage(accountId: string, messageId: string): Observable<EmailMessage> {
    return from(this.supabaseService.supabaseClient
      .from('email_messages')
      .update({ is_starred: true })
      .eq('id', messageId)
      .select()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return this.formatMessageFromDatabase(response.data[0]);
      }),
      catchError(error => {
        this.notificationService.error(`Failed to star message: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  unstarMessage(accountId: string, messageId: string): Observable<EmailMessage> {
    return from(this.supabaseService.supabaseClient
      .from('email_messages')
      .update({ is_starred: false })
      .eq('id', messageId)
      .select()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return this.formatMessageFromDatabase(response.data[0]);
      }),
      catchError(error => {
        this.notificationService.error(`Failed to unstar message: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  moveMessageToFolder(accountId: string, messageId: string, folderId: string): Observable<EmailMessage> {
    return from(this.supabaseService.supabaseClient
      .from('email_messages')
      .update({ folder_id: folderId })
      .eq('id', messageId)
      .select()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return this.formatMessageFromDatabase(response.data[0]);
      }),
      catchError(error => {
        this.notificationService.error(`Failed to move message: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  deleteMessage(accountId: string, messageId: string): Observable<void> {
    // First get the message to find its folder
    return this.getMessage(accountId, messageId).pipe(
      switchMap(message => {
        // Find the trash folder
        return this.emailAccountService.getEmailFolders(accountId).pipe(
          switchMap(folders => {
            const trashFolder = folders.find(folder => folder.type === 'trash');

            if (trashFolder) {
              // Move to trash instead of deleting
              return this.moveMessageToFolder(accountId, messageId, trashFolder.id);
            } else {
              // If no trash folder, delete permanently
              return from(this.supabaseService.supabaseClient
                .from('email_messages')
                .delete()
                .eq('id', messageId)
              );
            }
          }),
          map(response => {
            // Check if response is a PostgrestResponse with error property
            if (response && typeof response === 'object' && 'error' in response && response.error) {
              throw response.error;
            }
            return;
          })
        );
      }),
      catchError(error => {
        this.notificationService.error(`Failed to delete message: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  // Compose and Send Email
  sendEmail(accountId: string, message: Partial<EmailMessage>): Observable<EmailMessage> {
    // In a real implementation, this would call the email provider API
    // For now, we'll just save it to the database
    const user = this.authService.getCurrentUser();
    if (!user) {
      return throwError(() => new Error('User not authenticated'));
    }

    return this.emailAccountService.getEmailFolders(accountId).pipe(
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
      toAddresses: data.to_addresses,
      ccAddresses: data.cc_addresses,
      bccAddresses: data.bcc_addresses,
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
      attachments: data.attachments ? data.attachments.map((attachment: any) => this.formatAttachmentFromDatabase(attachment)) : undefined
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

  private formatThreadFromDatabase(data: any): EmailThread {
    return {
      id: data.id,
      accountId: data.account_id,
      subject: data.subject,
      snippet: data.snippet,
      participants: data.participants,
      messageCount: data.message_count,
      unreadCount: data.unread_count,
      isStarred: data.is_starred,
      isImportant: data.is_important,
      hasAttachments: data.has_attachments,
      latestMessageAt: data.latest_message_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
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
      createdAt: data.created_at
    };
  }
}
