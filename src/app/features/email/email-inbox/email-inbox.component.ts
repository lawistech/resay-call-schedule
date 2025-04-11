// src/app/features/email/email-inbox/email-inbox.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EmailAccountService } from '../../../core/services/email-account.service';
import { NotificationService } from '../../../core/services/notification.service';
import { EmailAccount, EmailFolder } from '../../../core/models/email-account.model';
import { EmailThread, EmailMessage } from '../../../core/models/email-message.model';
import { EmailMessageListComponent } from './email-message-list/email-message-list.component';
import { EmailMessageDetailComponent } from './email-message-detail/email-message-detail.component';

@Component({
  selector: 'app-email-inbox',
  templateUrl: './email-inbox.component.html',
  styleUrls: ['./email-inbox.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    EmailMessageListComponent,
    EmailMessageDetailComponent
  ]
})
export class EmailInboxComponent implements OnInit {
  accounts: EmailAccount[] = [];
  selectedAccount: EmailAccount | null = null;
  folders: EmailFolder[] = [];
  selectedFolder: EmailFolder | null = null;
  threads: EmailThread[] = [];
  selectedThread: EmailThread | null = null;
  isLoading = true;
  searchTerm = '';

  constructor(
    private emailAccountService: EmailAccountService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.isLoading = true;
    this.emailAccountService.getEmailAccounts().subscribe({
      next: (accounts) => {
        this.accounts = accounts;
        if (accounts.length > 0) {
          this.selectAccount(accounts.find(a => a.isDefault) || accounts[0]);
        } else {
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error loading email accounts:', error);
        this.notificationService.error('Failed to load email accounts');
        this.isLoading = false;
      }
    });
  }

  selectAccount(account: EmailAccount): void {
    this.selectedAccount = account;
    this.loadFolders(account.id);
  }

  loadFolders(accountId: string): void {
    this.emailAccountService.getEmailFolders(accountId).subscribe({
      next: (folders) => {
        this.folders = folders;
        const inboxFolder = folders.find(f => f.type === 'inbox');
        if (inboxFolder) {
          this.selectFolder(inboxFolder);
        } else if (folders.length > 0) {
          this.selectFolder(folders[0]);
        } else {
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error loading email folders:', error);
        this.notificationService.error('Failed to load email folders');
        this.isLoading = false;
      }
    });
  }

  selectFolder(folder: EmailFolder): void {
    this.selectedFolder = folder;
    this.selectedThread = null;
    if (this.selectedAccount) {
      this.loadThreads(this.selectedAccount.id, folder.id);
    }
  }

  loadThreads(accountId: string, folderId: string): void {
    this.isLoading = true;
    this.emailAccountService.getMessages(accountId, folderId).subscribe({
      next: (messages) => {
        // Group messages by thread
        const threadMap = new Map<string, EmailThread>();

        messages.forEach(message => {
          if (message.threadId) {
            if (!threadMap.has(message.threadId)) {
              threadMap.set(message.threadId, {
                id: message.threadId,
                accountId: message.accountId,
                subject: message.subject || '',
                snippet: message.plainBody?.substring(0, 100) || '',
                participants: [message.fromAddress, ...(message.toAddresses || [])],
                messageCount: 1,
                unreadCount: message.isRead ? 0 : 1,
                isStarred: message.isStarred,
                isImportant: message.isImportant,
                hasAttachments: message.hasAttachments,
                latestMessageAt: message.receivedAt || message.sentAt,
                messages: [message]
              });
            } else {
              const thread = threadMap.get(message.threadId)!;
              thread.messageCount++;
              if (!message.isRead) thread.unreadCount++;
              if (message.isStarred) thread.isStarred = true;
              if (message.isImportant) thread.isImportant = true;
              if (message.hasAttachments) thread.hasAttachments = true;

              // Update latest message timestamp
              const messageTime = message.receivedAt || message.sentAt;
              const threadTime = thread.latestMessageAt;

              if (messageTime && threadTime && new Date(messageTime) > new Date(threadTime)) {
                thread.latestMessageAt = messageTime;
                thread.snippet = message.plainBody?.substring(0, 100) || '';
              }

              thread.messages = [...(thread.messages || []), message];
            }
          }
        });

        this.threads = Array.from(threadMap.values()).sort((a, b) => {
          const dateA = a.latestMessageAt ? new Date(a.latestMessageAt).getTime() : 0;
          const dateB = b.latestMessageAt ? new Date(b.latestMessageAt).getTime() : 0;
          return dateB - dateA; // Sort by latest message, descending
        });

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading email threads:', error);
        this.notificationService.error('Failed to load emails');
        this.isLoading = false;
      }
    });
  }

  selectThread(thread: EmailThread): void {
    this.selectedThread = thread;

    // Mark thread as read if it has unread messages
    if (thread.unreadCount > 0 && thread.messages) {
      thread.messages.forEach(message => {
        if (!message.isRead && this.selectedAccount) {
          this.emailAccountService.markMessageAsRead(this.selectedAccount.id, message.id).subscribe();
        }
      });
      thread.unreadCount = 0;
    }
  }

  refreshInbox(): void {
    if (this.selectedAccount && this.selectedFolder) {
      this.loadThreads(this.selectedAccount.id, this.selectedFolder.id);
    }
  }

  searchEmails(): void {
    // Implement email search functionality
    if (!this.searchTerm.trim()) {
      this.refreshInbox();
      return;
    }

    // In a real implementation, this would call a search API
    // For now, we'll just filter the existing threads
    if (this.selectedAccount && this.selectedFolder) {
      this.isLoading = true;
      this.emailAccountService.getMessages(this.selectedAccount.id, this.selectedFolder.id).subscribe({
        next: (messages) => {
          const filteredMessages = messages.filter(message =>
            message.subject?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            message.plainBody?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            message.fromAddress.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            message.fromName?.toLowerCase().includes(this.searchTerm.toLowerCase())
          );

          // Group filtered messages by thread
          const threadMap = new Map<string, EmailThread>();

          filteredMessages.forEach(message => {
            if (message.threadId) {
              if (!threadMap.has(message.threadId)) {
                threadMap.set(message.threadId, {
                  id: message.threadId,
                  accountId: message.accountId,
                  subject: message.subject || '',
                  snippet: message.plainBody?.substring(0, 100) || '',
                  participants: [message.fromAddress, ...(message.toAddresses || [])],
                  messageCount: 1,
                  unreadCount: message.isRead ? 0 : 1,
                  isStarred: message.isStarred,
                  isImportant: message.isImportant,
                  hasAttachments: message.hasAttachments,
                  latestMessageAt: message.receivedAt || message.sentAt,
                  messages: [message]
                });
              } else {
                const thread = threadMap.get(message.threadId)!;
                thread.messageCount++;
                if (!message.isRead) thread.unreadCount++;
                if (message.isStarred) thread.isStarred = true;
                if (message.isImportant) thread.isImportant = true;
                if (message.hasAttachments) thread.hasAttachments = true;

                thread.messages = [...(thread.messages || []), message];
              }
            }
          });

          this.threads = Array.from(threadMap.values()).sort((a, b) => {
            const dateA = a.latestMessageAt ? new Date(a.latestMessageAt).getTime() : 0;
            const dateB = b.latestMessageAt ? new Date(b.latestMessageAt).getTime() : 0;
            return dateB - dateA; // Sort by latest message, descending
          });

          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error searching emails:', error);
          this.notificationService.error('Failed to search emails');
          this.isLoading = false;
        }
      });
    }
  }

  composeNewEmail(): void {
    this.router.navigate(['/email/compose']);
  }

  handleReply(message: EmailMessage): void {
    if (!this.selectedAccount) {
      this.notificationService.error('No email account selected');
      return;
    }
    // Navigate to compose with reply parameters
    this.router.navigate(['/email/compose'], {
      queryParams: {
        action: 'reply',
        accountId: this.selectedAccount.id,
        messageId: message.id
      }
    });
  }

  handleForward(message: EmailMessage): void {
    if (!this.selectedAccount) {
      this.notificationService.error('No email account selected');
      return;
    }
    // Navigate to compose with forward parameters
    this.router.navigate(['/email/compose'], {
      queryParams: {
        action: 'forward',
        accountId: this.selectedAccount.id,
        messageId: message.id
      }
    });
  }

  handleDownloadAttachment(attachment: any): void {
    // In a real implementation, this would download the attachment
    console.log('Downloading attachment:', attachment);
    this.notificationService.info(`Downloading ${attachment.filename}...`);
  }
}
