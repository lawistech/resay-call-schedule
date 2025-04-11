// src/app/core/services/email-account.service.ts
import { Injectable } from '@angular/core';
import { Observable, from, throwError, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { NotificationService } from './notification.service';
import { AuthService } from './auth.service';
import { EmailAccount, EmailFolder, EmailLabel, EmailAccess, EmailFilter } from '../models/email-account.model';

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

  // Helper Methods
  private getSharedAccountsQuery(): string {
    const user = this.authService.getCurrentUser();
    if (!user) return '';

    return `SELECT account_id FROM email_access WHERE user_id = '${user.id}'`;
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
