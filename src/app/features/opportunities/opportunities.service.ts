// src/app/features/opportunities/opportunities.service.ts
import { Injectable } from '@angular/core';
import { Observable, from, map, catchError, throwError } from 'rxjs';
import { SupabaseService } from '../../core/services/supabase.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { Opportunity } from '../../core/models/company.model';

@Injectable({
  providedIn: 'root'
})
export class OpportunitiesService {
  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  getOpportunities(): Observable<Opportunity[]> {
    return from(this.supabaseService.supabaseClient
      .from('opportunities')
      .select(`
        *,
        company:companies(id, name)
      `)
      .order('created_at', { ascending: false })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        
        // Format the data to match our Opportunity model
        return response.data.map(opp => this.formatOpportunityFromDatabase(opp));
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch opportunities: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  getOpportunityById(id: string): Observable<Opportunity> {
    return from(this.supabaseService.supabaseClient
      .from('opportunities')
      .select(`
        *,
        company:companies(id, name)
      `)
      .eq('id', id)
      .single()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return this.formatOpportunityFromDatabase(response.data);
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch opportunity: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  addOpportunity(opportunity: Partial<Opportunity>): Observable<Opportunity> {
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser) {
      return throwError(() => new Error('User must be logged in to create opportunities'));
    }
    
    // Clean up data to prevent empty UUIDs
    const cleanedOpp = { ...opportunity };
    
    // Remove empty UUID fields
    if (!cleanedOpp.companyId) delete cleanedOpp.companyId;
    
    const formattedOpp = {
      ...this.formatOpportunityForDatabase(cleanedOpp),
      created_by: currentUser.id,
      created_at: new Date().toISOString()
    };

    return from(this.supabaseService.supabaseClient
      .from('opportunities')
      .insert(formattedOpp)
      .select(`
        *,
        company:companies(id, name)
      `)
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        this.notificationService.success('Opportunity created successfully');
        return this.formatOpportunityFromDatabase(response.data[0]);
      }),
      catchError(error => {
        this.notificationService.error(`Failed to create opportunity: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  updateOpportunity(id: string, opportunity: Partial<Opportunity>): Observable<Opportunity> {
    // Clean up data to prevent empty UUIDs
    const cleanedOpp = { ...opportunity };
    
    // Remove empty UUID fields
    if (!cleanedOpp.companyId) delete cleanedOpp.companyId;
    
    const formattedOpp = {
      ...this.formatOpportunityForDatabase(cleanedOpp),
      updated_at: new Date().toISOString()
    };

    return from(this.supabaseService.supabaseClient
      .from('opportunities')
      .update(formattedOpp)
      .eq('id', id)
      .select(`
        *,
        company:companies(id, name)
      `)
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        this.notificationService.success('Opportunity updated successfully');
        return this.formatOpportunityFromDatabase(response.data[0]);
      }),
      catchError(error => {
        this.notificationService.error(`Failed to update opportunity: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  deleteOpportunity(id: string): Observable<void> {
    return from(this.supabaseService.supabaseClient
      .from('opportunities')
      .delete()
      .eq('id', id)
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        this.notificationService.success('Opportunity deleted successfully');
        return;
      }),
      catchError(error => {
        this.notificationService.error(`Failed to delete opportunity: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  // Helper functions to format data
  private formatOpportunityFromDatabase(data: any): Opportunity {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      status: data.status,
      probability: data.probability,
      expectedCloseDate: data.expected_close_date,
      amount: data.amount,
      companyId: data.company_id,
      stage: data.stage,
      value: data.amount, // For consistency (amount and value are the same)
      closeDate: data.expected_close_date, // For consistency (closeDate and expectedCloseDate are the same)
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  private formatOpportunityForDatabase(opp: Partial<Opportunity>): any {
    // Map our model fields to the database fields
    const result: any = {};
    
    if (opp.title !== undefined) result.title = opp.title;
    if (opp.description !== undefined) result.description = opp.description;
    if (opp.status !== undefined) result.status = opp.status;
    if (opp.probability !== undefined) result.probability = opp.probability;
    
    if (opp.expectedCloseDate !== undefined) {
      result.expected_close_date = opp.expectedCloseDate instanceof Date 
        ? opp.expectedCloseDate.toISOString() 
        : opp.expectedCloseDate;
    }
    
    if (opp.amount !== undefined) result.amount = opp.amount;
    
    // Only include company_id if it's a non-empty string
    if (opp.companyId && typeof opp.companyId === 'string' && opp.companyId.trim() !== '') {
      result.company_id = opp.companyId;
    }
    
    if (opp.stage !== undefined) result.stage = opp.stage;
    if (opp.notes !== undefined) result.notes = opp.notes;
    
    return result;
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
}