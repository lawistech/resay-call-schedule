// src/app/features/email/email-accounts/email-account-settings.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { EmailAccountService } from '../../../core/services/email-account.service';
import { EmailProviderService } from '../../../core/services/email-provider.service';
import { NotificationService } from '../../../core/services/notification.service';
import { EmailAccount } from '../../../core/models/email-account.model';

@Component({
  selector: 'app-email-account-settings',
  templateUrl: './email-account-settings.component.html',
  styleUrls: ['./email-account-settings.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule]
})
export class EmailAccountSettingsComponent implements OnInit {
  accounts: EmailAccount[] = [];
  isLoading = true;
  isAdding = false;
  isEditing = false;
  selectedAccount: EmailAccount | null = null;
  accountForm: FormGroup;
  providers = [
    { value: 'gmail', label: 'Gmail / Google Workspace' },
    { value: 'microsoft365', label: 'Microsoft 365 / Outlook' },
    { value: 'imap', label: 'IMAP/SMTP' },
    { value: 'exchange', label: 'Exchange' }
  ];

  constructor(
    private fb: FormBuilder,
    private emailAccountService: EmailAccountService,
    private emailProviderService: EmailProviderService,
    private notificationService: NotificationService
  ) {
    this.accountForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      provider: ['gmail', [Validators.required]],
      // IMAP/SMTP specific fields
      imapHost: [''],
      imapPort: [993],
      smtpHost: [''],
      smtpPort: [587],
      username: [''],
      password: ['']
    });
  }

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.isLoading = true;
    this.emailAccountService.getEmailAccounts().subscribe({
      next: (accounts) => {
        this.accounts = accounts;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading email accounts:', error);
        this.notificationService.error('Failed to load email accounts');
        this.isLoading = false;
      }
    });
  }

  startAddAccount(): void {
    this.isAdding = true;
    this.isEditing = false;
    this.selectedAccount = null;
    this.accountForm.reset({
      provider: 'gmail',
      imapPort: 993,
      smtpPort: 587
    });
  }

  editAccount(account: EmailAccount): void {
    this.isAdding = false;
    this.isEditing = true;
    this.selectedAccount = account;
    
    // Populate form with account details
    this.accountForm.patchValue({
      name: account.name,
      email: account.email,
      provider: account.provider
    });
    
    // If IMAP/SMTP provider, populate those fields
    if (account.provider === 'imap' && account.providerSettings) {
      this.accountForm.patchValue({
        imapHost: account.providerSettings.imapHost,
        imapPort: account.providerSettings.imapPort,
        smtpHost: account.providerSettings.smtpHost,
        smtpPort: account.providerSettings.smtpPort,
        username: account.providerSettings.username
      });
    }
  }

  cancelEdit(): void {
    this.isAdding = false;
    this.isEditing = false;
    this.selectedAccount = null;
    this.accountForm.reset();
  }

  saveAccount(): void {
    if (this.accountForm.invalid) {
      this.notificationService.error('Please fill in all required fields');
      return;
    }
    
    const formValues = this.accountForm.value;
    
    // Prepare account data
    const accountData: Partial<EmailAccount> = {
      name: formValues.name,
      email: formValues.email,
      provider: formValues.provider,
      isActive: true
    };
    
    // Add provider-specific settings
    if (formValues.provider === 'imap') {
      accountData.providerSettings = {
        imapHost: formValues.imapHost,
        imapPort: formValues.imapPort,
        smtpHost: formValues.smtpHost,
        smtpPort: formValues.smtpPort,
        username: formValues.username
      };
      
      // In a real implementation, we would securely handle the password
      if (formValues.password) {
        accountData.authCredentials = {
          password: formValues.password
        };
      }
    }
    
    if (this.isAdding) {
      this.addAccount(accountData);
    } else if (this.isEditing && this.selectedAccount) {
      this.updateAccount(this.selectedAccount.id, accountData);
    }
  }

  addAccount(accountData: Partial<EmailAccount>): void {
    this.emailAccountService.createEmailAccount(accountData).subscribe({
      next: (account) => {
        this.notificationService.success('Email account added successfully');
        this.accounts.push(account);
        this.isAdding = false;
        this.accountForm.reset();
        
        // If OAuth provider, initiate OAuth flow
        if (account.provider === 'gmail') {
          this.authenticateGmail(account);
        } else if (account.provider === 'microsoft365') {
          this.authenticateMicrosoft365(account);
        }
      },
      error: (error) => {
        console.error('Error adding email account:', error);
        this.notificationService.error('Failed to add email account');
      }
    });
  }

  updateAccount(id: string, accountData: Partial<EmailAccount>): void {
    this.emailAccountService.updateEmailAccount(id, accountData).subscribe({
      next: (account) => {
        this.notificationService.success('Email account updated successfully');
        const index = this.accounts.findIndex(a => a.id === id);
        if (index !== -1) {
          this.accounts[index] = account;
        }
        this.isEditing = false;
        this.selectedAccount = null;
        this.accountForm.reset();
      },
      error: (error) => {
        console.error('Error updating email account:', error);
        this.notificationService.error('Failed to update email account');
      }
    });
  }

  deleteAccount(account: EmailAccount): void {
    if (confirm(`Are you sure you want to delete the account "${account.name}"?`)) {
      this.emailAccountService.deleteEmailAccount(account.id).subscribe({
        next: () => {
          this.notificationService.success('Email account deleted successfully');
          this.accounts = this.accounts.filter(a => a.id !== account.id);
          if (this.selectedAccount?.id === account.id) {
            this.isEditing = false;
            this.selectedAccount = null;
            this.accountForm.reset();
          }
        },
        error: (error) => {
          console.error('Error deleting email account:', error);
          this.notificationService.error('Failed to delete email account');
        }
      });
    }
  }

  setDefaultAccount(account: EmailAccount): void {
    if (account.isDefault) return;
    
    this.emailAccountService.updateEmailAccount(account.id, { isDefault: true }).subscribe({
      next: () => {
        this.notificationService.success(`${account.name} set as default account`);
        this.accounts.forEach(a => {
          a.isDefault = a.id === account.id;
        });
      },
      error: (error) => {
        console.error('Error setting default account:', error);
        this.notificationService.error('Failed to set default account');
      }
    });
  }

  authenticateGmail(account: EmailAccount): void {
    this.emailProviderService.getGmailAuthUrl().subscribe({
      next: (url) => {
        // Open the OAuth URL in a new window
        window.open(url, 'gmailAuth', 'width=600,height=700');
      },
      error: (error) => {
        console.error('Error getting Gmail auth URL:', error);
        this.notificationService.error('Failed to authenticate with Gmail');
      }
    });
  }

  authenticateMicrosoft365(account: EmailAccount): void {
    this.emailProviderService.getMicrosoft365AuthUrl().subscribe({
      next: (url) => {
        // Open the OAuth URL in a new window
        window.open(url, 'microsoftAuth', 'width=600,height=700');
      },
      error: (error) => {
        console.error('Error getting Microsoft 365 auth URL:', error);
        this.notificationService.error('Failed to authenticate with Microsoft 365');
      }
    });
  }

  onProviderChange(): void {
    const provider = this.accountForm.get('provider')?.value;
    
    if (provider === 'imap') {
      this.accountForm.get('imapHost')?.setValidators([Validators.required]);
      this.accountForm.get('imapPort')?.setValidators([Validators.required]);
      this.accountForm.get('smtpHost')?.setValidators([Validators.required]);
      this.accountForm.get('smtpPort')?.setValidators([Validators.required]);
      this.accountForm.get('username')?.setValidators([Validators.required]);
      
      if (!this.isEditing) {
        this.accountForm.get('password')?.setValidators([Validators.required]);
      }
    } else {
      this.accountForm.get('imapHost')?.clearValidators();
      this.accountForm.get('imapPort')?.clearValidators();
      this.accountForm.get('smtpHost')?.clearValidators();
      this.accountForm.get('smtpPort')?.clearValidators();
      this.accountForm.get('username')?.clearValidators();
      this.accountForm.get('password')?.clearValidators();
    }
    
    this.accountForm.get('imapHost')?.updateValueAndValidity();
    this.accountForm.get('imapPort')?.updateValueAndValidity();
    this.accountForm.get('smtpHost')?.updateValueAndValidity();
    this.accountForm.get('smtpPort')?.updateValueAndValidity();
    this.accountForm.get('username')?.updateValueAndValidity();
    this.accountForm.get('password')?.updateValueAndValidity();
  }
}
