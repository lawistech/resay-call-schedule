// src/app/core/services/email.service.ts
import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { NotificationService } from './notification.service';
import { AuthService } from './auth.service';
import { EmailTemplate } from '../models/email-template.model';
import { EmailCampaign } from '../models/email-campaign.model';
import { EmailRecipient } from '../models/email-recipient.model';
import { EmailSignature } from '../models/email-signature.model';
import { EmailSequence, EmailSequenceStep } from '../models/email-sequence.model';

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  // Email Template Methods
  getEmailTemplates(): Observable<EmailTemplate[]> {
    return from(this.supabaseService.supabaseClient
      .from('email_templates')
      .select('*')
      .order('created_at', { ascending: false })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;

        // Convert snake_case to camelCase for frontend use
        return response.data.map(template => this.formatTemplateFromDatabase(template));
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch email templates: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  getEmailTemplateById(id: string): Observable<EmailTemplate> {
    return from(this.supabaseService.supabaseClient
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .single()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return this.formatTemplateFromDatabase(response.data);
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch email template: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  createEmailTemplate(template: Partial<EmailTemplate>): Observable<EmailTemplate> {
    // Convert camelCase to snake_case for database storage
    const dbTemplate = this.formatTemplateForDatabase(template);

    const user = this.authService.getCurrentUser();
    if (!user) {
      return throwError(() => new Error('User not authenticated'));
    }

    const templateWithUser = {
      ...dbTemplate,
      created_by: user.id
    };

    return from(this.supabaseService.supabaseClient
      .from('email_templates')
      .insert(templateWithUser)
      .select()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        this.notificationService.success('Email template created successfully');
        return this.formatTemplateFromDatabase(response.data[0]);
      }),
      catchError(error => {
        this.notificationService.error(`Failed to create email template: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  updateEmailTemplate(id: string, template: Partial<EmailTemplate>): Observable<EmailTemplate> {
    // Convert camelCase to snake_case for database storage
    const dbTemplate = this.formatTemplateForDatabase(template);

    return from(this.supabaseService.supabaseClient
      .from('email_templates')
      .update(dbTemplate)
      .eq('id', id)
      .select()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        this.notificationService.success('Email template updated successfully');
        return this.formatTemplateFromDatabase(response.data[0]);
      }),
      catchError(error => {
        this.notificationService.error(`Failed to update email template: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  deleteEmailTemplate(id: string): Observable<void> {
    return from(this.supabaseService.supabaseClient
      .from('email_templates')
      .delete()
      .eq('id', id)
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        this.notificationService.success('Email template deleted successfully');
      }),
      catchError(error => {
        this.notificationService.error(`Failed to delete email template: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  // Email Campaign Methods
  getEmailCampaigns(): Observable<EmailCampaign[]> {
    return from(this.supabaseService.supabaseClient
      .from('email_campaigns')
      .select(`
        *,
        template:email_templates(*)
      `)
      .order('created_at', { ascending: false })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;

        // Convert snake_case to camelCase for frontend use
        return response.data.map(campaign => this.formatCampaignFromDatabase(campaign));
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch email campaigns: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  // Email Signature Methods
  getEmailSignatures(): Observable<EmailSignature[]> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      return throwError(() => new Error('User not authenticated'));
    }

    return from(this.supabaseService.supabaseClient
      .from('email_signatures')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;

        // Convert snake_case to camelCase for frontend use
        return response.data.map((signature: any) => this.formatSignatureFromDatabase(signature));
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch email signatures: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  // Helper methods for data formatting
  private formatTemplateFromDatabase(dbTemplate: any): EmailTemplate {
    return {
      id: dbTemplate.id,
      name: dbTemplate.name,
      description: dbTemplate.description,
      subject: dbTemplate.subject,
      htmlContent: dbTemplate.html_content,
      plainContent: dbTemplate.plain_content,
      category: dbTemplate.category,
      tags: dbTemplate.tags,
      variables: dbTemplate.variables,
      createdBy: dbTemplate.created_by,
      createdAt: dbTemplate.created_at,
      updatedAt: dbTemplate.updated_at
    };
  }

  private formatTemplateForDatabase(template: Partial<EmailTemplate>): any {
    const dbTemplate: any = {};

    if (template.name !== undefined) dbTemplate.name = template.name;
    if (template.description !== undefined) dbTemplate.description = template.description;
    if (template.subject !== undefined) dbTemplate.subject = template.subject;
    if (template.htmlContent !== undefined) dbTemplate.html_content = template.htmlContent;
    if (template.plainContent !== undefined) dbTemplate.plain_content = template.plainContent;
    if (template.category !== undefined) dbTemplate.category = template.category;
    if (template.tags !== undefined) dbTemplate.tags = template.tags;
    if (template.variables !== undefined) dbTemplate.variables = template.variables;

    return dbTemplate;
  }

  private formatCampaignFromDatabase(dbCampaign: any): EmailCampaign {
    return {
      id: dbCampaign.id,
      name: dbCampaign.name,
      description: dbCampaign.description,
      templateId: dbCampaign.template_id,
      template: dbCampaign.template ? this.formatTemplateFromDatabase(dbCampaign.template) : undefined,
      status: dbCampaign.status,
      scheduledAt: dbCampaign.scheduled_at,
      sentAt: dbCampaign.sent_at,
      targetAudience: dbCampaign.target_audience,
      abTestEnabled: dbCampaign.a_b_test_enabled,
      abTestData: dbCampaign.a_b_test_data,
      createdBy: dbCampaign.created_by,
      createdAt: dbCampaign.created_at,
      updatedAt: dbCampaign.updated_at
    };
  }

  private formatSignatureFromDatabase(dbSignature: any): EmailSignature {
    return {
      id: dbSignature.id,
      userId: dbSignature.user_id,
      name: dbSignature.name,
      isDefault: dbSignature.is_default,
      content: dbSignature.content,
      createdAt: dbSignature.created_at,
      updatedAt: dbSignature.updated_at
    };
  }
}
