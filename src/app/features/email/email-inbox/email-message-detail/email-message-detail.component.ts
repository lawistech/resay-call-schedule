// src/app/features/email/email-inbox/email-message-detail/email-message-detail.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EmailThread, EmailMessage } from '../../../../core/models/email-message.model';

@Component({
  selector: 'app-email-message-detail',
  templateUrl: './email-message-detail.component.html',
  styleUrls: ['./email-message-detail.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class EmailMessageDetailComponent {
  @Input() thread: EmailThread | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() reply = new EventEmitter<EmailMessage>();
  @Output() forward = new EventEmitter<EmailMessage>();
  @Output() downloadAttach = new EventEmitter<any>();

  constructor() {}

  closeDetail(): void {
    this.close.emit();
  }

  replyToEmail(): void {
    if (this.thread && this.thread.messages && this.thread.messages.length > 0) {
      this.reply.emit(this.thread.messages[this.thread.messages.length - 1]);
    }
  }

  forwardEmail(): void {
    if (this.thread && this.thread.messages && this.thread.messages.length > 0) {
      this.forward.emit(this.thread.messages[this.thread.messages.length - 1]);
    }
  }

  downloadAttachment(attachment: any): void {
    this.downloadAttach.emit(attachment);
  }
}
