// src/app/core/services/email-provider.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { NotificationService } from './notification.service';
import { EmailAccount } from '../models/email-account.model';
import { EmailMessage, EmailThread, EmailAttachment } from '../models/email-message.model';

@Injectable({
  providedIn: 'root'
})
export class EmailProviderService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService
  ) {}

  // Gmail OAuth Authentication
  getGmailAuthUrl(): Observable<string> {
    return this.http.get<{ url: string }>(`${this.apiUrl}/email/auth/gmail/url`).pipe(
      map(response => response.url),
      catchError(error => {
        this.notificationService.error('Failed to get Gmail authentication URL');
        return throwError(() => error);
      })
    );
  }

  authenticateGmail(code: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/email/auth/gmail/callback`, { code }).pipe(
      catchError(error => {
        this.notificationService.error('Failed to authenticate with Gmail');
        return throwError(() => error);
      })
    );
  }

  // Microsoft 365 OAuth Authentication
  getMicrosoft365AuthUrl(): Observable<string> {
    return this.http.get<{ url: string }>(`${this.apiUrl}/email/auth/microsoft/url`).pipe(
      map(response => response.url),
      catchError(error => {
        this.notificationService.error('Failed to get Microsoft 365 authentication URL');
        return throwError(() => error);
      })
    );
  }

  authenticateMicrosoft365(code: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/email/auth/microsoft/callback`, { code }).pipe(
      catchError(error => {
        this.notificationService.error('Failed to authenticate with Microsoft 365');
        return throwError(() => error);
      })
    );
  }

  // IMAP/SMTP Authentication
  authenticateImap(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/email/auth/imap`, credentials).pipe(
      catchError(error => {
        this.notificationService.error('Failed to authenticate with IMAP server');
        return throwError(() => error);
      })
    );
  }

  // Email Operations
  syncEmailAccount(accountId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/email/accounts/${accountId}/sync`, {}).pipe(
      catchError(error => {
        this.notificationService.error('Failed to sync email account');
        return throwError(() => error);
      })
    );
  }

  getMessages(accountId: string, folderId: string, params: any = {}): Observable<EmailMessage[]> {
    return this.http.get<EmailMessage[]>(`${this.apiUrl}/email/accounts/${accountId}/folders/${folderId}/messages`, { params }).pipe(
      catchError(error => {
        this.notificationService.error('Failed to fetch email messages');
        return throwError(() => error);
      })
    );
  }

  getThreads(accountId: string, params: any = {}): Observable<EmailThread[]> {
    return this.http.get<EmailThread[]>(`${this.apiUrl}/email/accounts/${accountId}/threads`, { params }).pipe(
      catchError(error => {
        this.notificationService.error('Failed to fetch email threads');
        return throwError(() => error);
      })
    );
  }

  getMessage(accountId: string, messageId: string): Observable<EmailMessage> {
    return this.http.get<EmailMessage>(`${this.apiUrl}/email/accounts/${accountId}/messages/${messageId}`).pipe(
      catchError(error => {
        this.notificationService.error('Failed to fetch email message');
        return throwError(() => error);
      })
    );
  }

  getThread(accountId: string, threadId: string): Observable<EmailThread> {
    return this.http.get<EmailThread>(`${this.apiUrl}/email/accounts/${accountId}/threads/${threadId}`).pipe(
      catchError(error => {
        this.notificationService.error('Failed to fetch email thread');
        return throwError(() => error);
      })
    );
  }

  sendMessage(accountId: string, message: Partial<EmailMessage>): Observable<EmailMessage> {
    return this.http.post<EmailMessage>(`${this.apiUrl}/email/accounts/${accountId}/messages`, message).pipe(
      catchError(error => {
        this.notificationService.error('Failed to send email message');
        return throwError(() => error);
      })
    );
  }

  updateMessage(accountId: string, messageId: string, updates: Partial<EmailMessage>): Observable<EmailMessage> {
    return this.http.patch<EmailMessage>(`${this.apiUrl}/email/accounts/${accountId}/messages/${messageId}`, updates).pipe(
      catchError(error => {
        this.notificationService.error('Failed to update email message');
        return throwError(() => error);
      })
    );
  }

  deleteMessage(accountId: string, messageId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/email/accounts/${accountId}/messages/${messageId}`).pipe(
      catchError(error => {
        this.notificationService.error('Failed to delete email message');
        return throwError(() => error);
      })
    );
  }

  moveMessage(accountId: string, messageId: string, destinationFolderId: string): Observable<EmailMessage> {
    return this.http.post<EmailMessage>(
      `${this.apiUrl}/email/accounts/${accountId}/messages/${messageId}/move`,
      { destinationFolderId }
    ).pipe(
      catchError(error => {
        this.notificationService.error('Failed to move email message');
        return throwError(() => error);
      })
    );
  }

  addLabel(accountId: string, messageId: string, labelId: string): Observable<EmailMessage> {
    return this.http.post<EmailMessage>(
      `${this.apiUrl}/email/accounts/${accountId}/messages/${messageId}/labels/${labelId}`,
      {}
    ).pipe(
      catchError(error => {
        this.notificationService.error('Failed to add label to email message');
        return throwError(() => error);
      })
    );
  }

  removeLabel(accountId: string, messageId: string, labelId: string): Observable<EmailMessage> {
    return this.http.delete<EmailMessage>(
      `${this.apiUrl}/email/accounts/${accountId}/messages/${messageId}/labels/${labelId}`
    ).pipe(
      catchError(error => {
        this.notificationService.error('Failed to remove label from email message');
        return throwError(() => error);
      })
    );
  }

  getAttachment(accountId: string, messageId: string, attachmentId: string): Observable<EmailAttachment> {
    return this.http.get<EmailAttachment>(
      `${this.apiUrl}/email/accounts/${accountId}/messages/${messageId}/attachments/${attachmentId}`
    ).pipe(
      catchError(error => {
        this.notificationService.error('Failed to fetch email attachment');
        return throwError(() => error);
      })
    );
  }

  // Mock methods for development (remove in production)
  getMockMessages(accountId: string, folderId: string): Observable<EmailMessage[]> {
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
      snippet: `This is a test email message ${i}...`,
      isRead: i % 3 === 0,
      isStarred: i % 7 === 0,
      isImportant: i % 5 === 0,
      hasAttachments: i % 4 === 0,
      sentAt: new Date(Date.now() - i * 3600000).toISOString(),
      receivedAt: new Date(Date.now() - i * 3600000 + 10000).toISOString()
    }));

    return of(mockMessages);
  }

  getMockThreads(accountId: string): Observable<EmailThread[]> {
    // Generate mock email threads for development
    const mockThreads: EmailThread[] = Array(7).fill(0).map((_, i) => ({
      id: `thread-${i}`,
      accountId,
      subject: `Thread Subject ${i}`,
      snippet: `Latest message in thread ${i}...`,
      participants: ['user@example.com', `sender${i % 5}@example.com`],
      messageCount: 3,
      unreadCount: i % 3,
      isStarred: i % 5 === 0,
      isImportant: i % 4 === 0,
      hasAttachments: i % 3 === 0,
      latestMessageAt: new Date(Date.now() - i * 7200000).toISOString()
    }));

    return of(mockThreads);
  }
}
