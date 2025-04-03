// src/app/core/services/lead.service.ts
import { Injectable } from '@angular/core';
import { Observable, from, map, catchError, throwError } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { Lead } from '../models/lead.model';

@Injectable({
  providedIn: 'root'
})
export class LeadService {
  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  getLeads(): Observable<Lead[]> {
    return from(this.supabaseService.supabaseClient
      .from('leads')
      .select(`
        *,
        company:companies(id, name)
      `)
      .order('created_at', { ascending: false })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        
        // Format the data to match our Lead model
        return response.data.map(lead => this.formatLeadFromDatabase(lead));
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch leads: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  getLeadById(id: string): Observable<Lead> {
    return from(this.supabaseService.supabaseClient
      .from('leads')
      .select(`
        *,
        company:companies(id, name)
      `)
      .eq('id', id)
      .single()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return this.formatLeadFromDatabase(response.data);
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch lead: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  createLead(lead: Partial<Lead>): Observable<Lead> {
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser) {
      return throwError(() => new Error('User must be logged in to create leads'));
    }
    
    // Clean up the lead data to prevent empty UUIDs
    const cleanedLead = { ...lead };
    
    // Remove empty UUID fields
    if (!cleanedLead.company_id) delete cleanedLead.company_id;
    if (!cleanedLead.assigned_to) delete cleanedLead.assigned_to;
    
    const formattedLead = {
      ...this.formatLeadForDatabase(cleanedLead),
      created_by: currentUser.id,
      created_at: new Date().toISOString()
    };

    return from(this.supabaseService.supabaseClient
      .from('leads')
      .insert(formattedLead)
      .select(`
        *,
        company:companies(id, name)
      `)
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        this.notificationService.success('Lead created successfully');
        return this.formatLeadFromDatabase(response.data[0]);
      }),
      catchError(error => {
        this.notificationService.error(`Failed to create lead: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  updateLead(id: string, lead: Partial<Lead>): Observable<Lead> {
    // Clean up the lead data to prevent empty UUIDs
    const cleanedLead = { ...lead };
    
    // Remove empty UUID fields
    if (!cleanedLead.company_id) delete cleanedLead.company_id;
    if (!cleanedLead.assigned_to) delete cleanedLead.assigned_to;
    
    const formattedLead = {
      ...this.formatLeadForDatabase(cleanedLead),
      updated_at: new Date().toISOString()
    };

    return from(this.supabaseService.supabaseClient
      .from('leads')
      .update(formattedLead)
      .eq('id', id)
      .select(`
        *,
        company:companies(id, name)
      `)
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        this.notificationService.success('Lead updated successfully');
        return this.formatLeadFromDatabase(response.data[0]);
      }),
      catchError(error => {
        this.notificationService.error(`Failed to update lead: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  deleteLead(id: string): Observable<void> {
    return from(this.supabaseService.supabaseClient
      .from('leads')
      .delete()
      .eq('id', id)
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        this.notificationService.success('Lead deleted successfully');
        return;
      }),
      catchError(error => {
        this.notificationService.error(`Failed to delete lead: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  // Get companies for dropdown
  getCompanies(): Observable<{id: string, name: string}[]> {
    return from(this.supabaseService.supabaseClient
      .from('companies')
      .select('id, name')
      .order('name', { ascending: true })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data;
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch companies: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  // Get users for assigned_to dropdown
  getUsers(): Observable<{id: string, email: string, full_name: string}[]> {
    return from(this.supabaseService.supabaseClient
      .from('profiles')
      .select('id, full_name')  // Removed 'email' from the selection
      .order('full_name', { ascending: true })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        
        // Join with auth.users data to get email or use a fallback
        return response.data.map(profile => ({
          id: profile.id,
          full_name: profile.full_name || '',
          email: ''
        }));
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch users: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  private formatLeadFromDatabase(data: any): Lead {
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      company_id: data.company_id,
      company_name: data.company?.name,
      status: data.status,
      lead_source: data.lead_source,
      notes: data.notes,
      assigned_to: data.assigned_to,
      value: data.value,
      probability: data.probability,
      expected_close_date: data.expected_close_date,
      created_by: data.created_by,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }

  private formatLeadForDatabase(lead: Partial<Lead>): any {
    // Map our model fields to the database fields
    const result: any = {};
    
    if (lead.name !== undefined) result.name = lead.name;
    if (lead.email !== undefined) result.email = lead.email;
    if (lead.phone !== undefined) result.phone = lead.phone;
    
    // Only include company_id if it's a non-empty string
    if (lead.company_id && typeof lead.company_id === 'string' && lead.company_id.trim() !== '') {
      result.company_id = lead.company_id;
    }
    
    if (lead.status !== undefined) result.status = lead.status;
    if (lead.lead_source !== undefined) result.lead_source = lead.lead_source;
    if (lead.notes !== undefined) result.notes = lead.notes;
    
    // Only include assigned_to if it's a non-empty string
    if (lead.assigned_to && typeof lead.assigned_to === 'string' && lead.assigned_to.trim() !== '') {
      result.assigned_to = lead.assigned_to;
    }
    
    if (lead.value !== undefined) result.value = lead.value;
    if (lead.probability !== undefined) result.probability = lead.probability;
    if (lead.expected_close_date !== undefined) result.expected_close_date = lead.expected_close_date;
    
    return result;
  }
}