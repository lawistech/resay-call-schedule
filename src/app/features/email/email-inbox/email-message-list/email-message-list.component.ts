// src/app/features/email/email-inbox/email-message-list/email-message-list.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EmailThread } from '../../../../core/models/email-message.model';

@Component({
  selector: 'app-email-message-list',
  templateUrl: './email-message-list.component.html',
  styleUrls: ['./email-message-list.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class EmailMessageListComponent {
  @Input() threads: EmailThread[] = [];
  @Input() isLoading = false;
  @Input() selectedThread: EmailThread | null = null;
  @Output() threadSelected = new EventEmitter<EmailThread>();

  selectThread(thread: EmailThread): void {
    this.threadSelected.emit(thread);
  }
}
