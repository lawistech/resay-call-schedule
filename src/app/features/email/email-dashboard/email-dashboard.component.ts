// src/app/features/email/email-dashboard/email-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EmailAccountService } from '../../../core/services/email-account.service';
import { EmailAccount } from '../../../core/models/email-account.model';

@Component({
  selector: 'app-email-dashboard',
  templateUrl: './email-dashboard.component.html',
  styleUrls: ['./email-dashboard.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class EmailDashboardComponent implements OnInit {
  accounts: EmailAccount[] = [];
  unreadCount = 0;
  totalMessages = 0;
  isLoading = true;

  constructor(
    private emailAccountService: EmailAccountService
  ) { }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;

    // Load email accounts
    this.emailAccountService.getEmailAccounts().subscribe({
      next: (accounts) => {
        this.accounts = accounts;
        if (accounts.length > 0) {
          this.loadInboxData(accounts[0].id);
        } else {
          this.isLoading = false;
        }
      },
      error: (error: any) => {
        console.error('Error loading email accounts:', error);
        this.isLoading = false;
      }
    });
  }

  loadInboxData(accountId: string): void {
    // Get messages from inbox to count unread and total
    // First find the inbox folder
    this.emailAccountService.getEmailFolders(accountId).subscribe({
      next: (folders) => {
        const inboxFolder = folders.find(folder => folder.type === 'inbox');
        if (inboxFolder) {
          this.unreadCount = inboxFolder.unreadCount || 0;
          this.totalMessages = inboxFolder.totalCount || 0;
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading folders:', error);
        this.isLoading = false;
      }
    });
  }
}
