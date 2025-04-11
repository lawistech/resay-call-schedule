// src/app/features/email/email-inbox/email-message-detail/email-message-detail.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmailThread, EmailMessage } from '../../../../core/models/email-message.model';
import { EmailInboxService } from '../../../../core/services/email-inbox.service';

@Component({
  selector: 'app-email-message-detail',
  templateUrl: './email-message-detail.component.html',
  styleUrls: ['./email-message-detail.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class EmailMessageDetailComponent {
  @Input() thread: EmailThread | null = null;
  @Output() close = new EventEmitter<void>();

  constructor(private emailInboxService: EmailInboxService) {}

  closeDetail(): void {
    this.close.emit();
  }

  replyToEmail(): void {
    // Implement reply functionality
  }

  forwardEmail(): void {
    // Implement forward functionality
  }

  downloadAttachment(attachment: any): void {
    // Implement attachment download
  }
}
