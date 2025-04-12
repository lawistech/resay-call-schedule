// src/app/features/opportunities/opportunities.service.ts
import { Injectable } from '@angular/core';
import { Observable, from, map, catchError, throwError, switchMap, of, forkJoin } from 'rxjs';
import { SupabaseService } from '../../core/services/supabase.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { Opportunity } from '../../core/models/company.model';
import { OpportunityHistoryService } from './opportunity-history.service';
import { OpportunityHistory } from '../../core/models/opportunity-history.model';

@Injectable({
  providedIn: 'root'
})
export class OpportunitiesService {
  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private opportunityHistoryService: OpportunityHistoryService
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
        company:companies(id, name),
        products:opportunity_products(*)
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

    // First get the current opportunity to compare changes
    return this.getOpportunityById(id).pipe(
      switchMap(currentOpportunity => {
        // Prepare history entries for changed fields
        const historyEntries: Partial<OpportunityHistory>[] = [];

        // Check for status change
        if (cleanedOpp.status && cleanedOpp.status !== currentOpportunity.status) {
          historyEntries.push({
            opportunityId: id,
            field: 'status',
            oldValue: currentOpportunity.status,
            newValue: cleanedOpp.status
          });
        }

        // Check for stage change
        if (cleanedOpp.stage && cleanedOpp.stage !== currentOpportunity.stage) {
          historyEntries.push({
            opportunityId: id,
            field: 'stage',
            oldValue: currentOpportunity.stage || '',
            newValue: cleanedOpp.stage
          });
        }

        // Check for probability change
        if (cleanedOpp.probability !== undefined && cleanedOpp.probability !== currentOpportunity.probability) {
          historyEntries.push({
            opportunityId: id,
            field: 'probability',
            oldValue: String(currentOpportunity.probability || 0),
            newValue: String(cleanedOpp.probability)
          });
        }

        // Check for amount change
        if (cleanedOpp.amount !== undefined && cleanedOpp.amount !== currentOpportunity.amount) {
          historyEntries.push({
            opportunityId: id,
            field: 'amount',
            oldValue: String(currentOpportunity.amount || 0),
            newValue: String(cleanedOpp.amount)
          });
        }

        // Update the opportunity
        return from(this.supabaseService.supabaseClient
          .from('opportunities')
          .update(formattedOpp)
          .eq('id', id)
          .select(`
            *,
            company:companies(id, name)
          `)
        ).pipe(
          switchMap(response => {
            if (response.error) throw response.error;

            const updatedOpportunity = this.formatOpportunityFromDatabase(response.data[0]);

            // If there are history entries to record
            if (historyEntries.length > 0) {
              // Create an observable for each history entry
              const historyObservables = historyEntries.map(entry =>
                this.opportunityHistoryService.addHistoryEntry(entry)
              );

              // Execute all history entry observables and then return the updated opportunity
              return forkJoin(historyObservables).pipe(
                map(() => updatedOpportunity),
                catchError(error => {
                  console.error('Error recording history:', error);
                  // Still return the updated opportunity even if history recording fails
                  return of(updatedOpportunity);
                })
              );
            }

            // If no history entries, just return the updated opportunity
            return of(updatedOpportunity);
          }),
          map(updatedOpportunity => {
            this.notificationService.success('Opportunity updated successfully');
            return updatedOpportunity;
          }),
          catchError(error => {
            this.notificationService.error(`Failed to update opportunity: ${error.message}`);
            return throwError(() => error);
          })
        );
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
    const opportunity: Opportunity = {
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

    // Add products if they exist
    if (data.products && Array.isArray(data.products)) {
      opportunity.products = data.products.map((product: any) => ({
        id: product.id,
        opportunityId: product.opportunity_id,
        productId: product.product_id,
        productName: product.product_name,
        quantity: product.quantity,
        price: product.price,
        total: product.total,
        notes: product.notes
      }));
    }

    return opportunity;
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