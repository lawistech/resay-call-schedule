// src/app/features/email/email-compose/email-compose.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EmailAccountService } from '../../../core/services/email-account.service';
import { NotificationService } from '../../../core/services/notification.service';
import { EmailAccount } from '../../../core/models/email-account.model';
import { EmailMessage } from '../../../core/models/email-message.model';

@Component({
  selector: 'app-email-compose',
  templateUrl: './email-compose.component.html',
  styleUrls: ['./email-compose.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule]
})
export class EmailComposeComponent implements OnInit {
  accounts: EmailAccount[] = [];
  selectedAccount: EmailAccount | null = null;
  composeForm: FormGroup;
  isLoading = false;
  isSending = false;
  mode: 'new' | 'reply' | 'forward' = 'new';
  originalMessage: EmailMessage | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private emailAccountService: EmailAccountService,
    private notificationService: NotificationService
  ) {
    this.composeForm = this.fb.group({
      to: ['', [Validators.required]],
      cc: [''],
      bcc: [''],
      subject: ['', [Validators.required]],
      body: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadAccounts();

    // Check if we're replying to or forwarding an email
    this.route.queryParams.subscribe(params => {
      if (params['mode']) {
        this.mode = params['mode'] as 'new' | 'reply' | 'forward';
      }

      if (params['messageId'] && params['accountId']) {
        this.loadOriginalMessage(params['accountId'], params['messageId']);
      }
    });
  }

  loadAccounts(): void {
    this.isLoading = true;
    this.emailAccountService.getEmailAccounts().subscribe({
      next: (accounts) => {
        this.accounts = accounts;
        if (accounts.length > 0) {
          this.selectedAccount = accounts.find(a => a.isDefault) || accounts[0];
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading email accounts:', error);
        this.notificationService.error('Failed to load email accounts');
        this.isLoading = false;
      }
    });
  }

  loadOriginalMessage(accountId: string, messageId: string): void {
    this.isLoading = true;
    this.emailAccountService.getMessage(accountId, messageId).subscribe({
      next: (message) => {
        this.originalMessage = message;
        this.prepareForm();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading original message:', error);
        this.notificationService.error('Failed to load original message');
        this.isLoading = false;
      }
    });
  }

  prepareForm(): void {
    if (!this.originalMessage) return;

    if (this.mode === 'reply') {
      // Set recipient to the original sender
      this.composeForm.patchValue({
        to: this.originalMessage.fromAddress,
        subject: `Re: ${this.originalMessage.subject}`,
        body: this.getReplyBody()
      });
    } else if (this.mode === 'forward') {
      // Leave recipient empty
      this.composeForm.patchValue({
        subject: `Fwd: ${this.originalMessage.subject}`,
        body: this.getForwardBody()
      });
    }
  }

  getReplyBody(): string {
    if (!this.originalMessage) return '';

    const originalDate = this.originalMessage.sentAt || this.originalMessage.receivedAt || '';
    const formattedDate = originalDate ? new Date(originalDate).toLocaleString() : '';

    return `\n\n\n-------- Original Message --------
From: ${this.originalMessage.fromName || this.originalMessage.fromAddress}
Date: ${formattedDate}
Subject: ${this.originalMessage.subject}

${this.originalMessage.plainBody || ''}`;
  }

  getForwardBody(): string {
    if (!this.originalMessage) return '';

    const originalDate = this.originalMessage.sentAt || this.originalMessage.receivedAt || '';
    const formattedDate = originalDate ? new Date(originalDate).toLocaleString() : '';

    return `\n\n\n-------- Forwarded Message --------
From: ${this.originalMessage.fromName || this.originalMessage.fromAddress}
Date: ${formattedDate}
Subject: ${this.originalMessage.subject}
To: ${this.originalMessage.toAddresses.join(', ')}
${this.originalMessage.ccAddresses && this.originalMessage.ccAddresses.length > 0 ? `Cc: ${this.originalMessage.ccAddresses.join(', ')}` : ''}

${this.originalMessage.plainBody || ''}`;
  }

  sendEmail(): void {
    if (this.composeForm.invalid) {
      this.notificationService.error('Please fill in all required fields');
      return;
    }

    if (!this.selectedAccount) {
      this.notificationService.error('Please select an email account');
      return;
    }

    this.isSending = true;

    const formValues = this.composeForm.value;

    // Parse recipients
    const toAddresses = formValues.to.split(',').map((email: string) => email.trim());
    const ccAddresses = formValues.cc ? formValues.cc.split(',').map((email: string) => email.trim()) : [];
    const bccAddresses = formValues.bcc ? formValues.bcc.split(',').map((email: string) => email.trim()) : [];

    const message: Partial<EmailMessage> = {
      fromAddress: this.selectedAccount.email,
      fromName: this.selectedAccount.name,
      toAddresses,
      ccAddresses,
      bccAddresses,
      subject: formValues.subject,
      plainBody: formValues.body,
      // In a real implementation, we would convert the plain text to HTML
      htmlBody: `<div>${formValues.body.replace(/\n/g, '<br>')}</div>`,
      hasAttachments: false
    };

    this.emailAccountService.sendEmail(this.selectedAccount.id, message).subscribe({
      next: () => {
        this.notificationService.success('Email sent successfully');
        this.isSending = false;
        this.router.navigate(['/email']);
      },
      error: (error) => {
        console.error('Error sending email:', error);
        this.notificationService.error('Failed to send email');
        this.isSending = false;
      }
    });
  }

  discardEmail(): void {
    if (confirm('Are you sure you want to discard this email?')) {
      this.router.navigate(['/email']);
    }
  }
}
