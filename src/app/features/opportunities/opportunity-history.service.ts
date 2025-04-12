// src/app/features/opportunities/opportunity-history.service.ts
import { Injectable } from '@angular/core';
import { Observable, from, map, catchError, throwError } from 'rxjs';
import { SupabaseService } from '../../core/services/supabase.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { OpportunityHistory } from '../../core/models/opportunity-history.model';

@Injectable({
  providedIn: 'root'
})
export class OpportunityHistoryService {
  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  getOpportunityHistory(opportunityId: string): Observable<OpportunityHistory[]> {
    return from(this.supabaseService.supabaseClient
      .from('opportunity_history')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .order('changed_at', { ascending: false })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data.map(history => this.formatHistoryFromDatabase(history));
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch opportunity history: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  addHistoryEntry(entry: Partial<OpportunityHistory>): Observable<OpportunityHistory> {
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser) {
      return throwError(() => new Error('User must be logged in to record history'));
    }
    
    const formattedEntry = {
      opportunity_id: entry.opportunityId,
      field: entry.field,
      old_value: entry.oldValue,
      new_value: entry.newValue,
      changed_by: currentUser.id,
      changed_at: new Date().toISOString()
    };

    return from(this.supabaseService.supabaseClient
      .from('opportunity_history')
      .insert(formattedEntry)
      .select()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return this.formatHistoryFromDatabase(response.data[0]);
      }),
      catchError(error => {
        this.notificationService.error(`Failed to record history: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  // Helper functions to format data
  private formatHistoryFromDatabase(data: any): OpportunityHistory {
    return {
      id: data.id,
      opportunityId: data.opportunity_id,
      field: data.field,
      oldValue: data.old_value,
      newValue: data.new_value,
      changedBy: data.changed_by,
      changedAt: data.changed_at
    };
  }
}
