// src/app/features/companies/services/company.service.ts
import { Injectable } from '@angular/core';
import { Observable, from, throwError, map, catchError, switchMap } from 'rxjs';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  Company,
  CompanyContact,
  CompanyCommunication,
  ProductInterest,
  Opportunity
} from '../../../core/models/company.model';
import { Contact } from '../../../core/models/contact.model';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  // Company CRUD operations
  getCompanies(): Observable<Company[]> {
    return from(this.supabaseService.supabaseClient
      .from('companies')
      .select('*')
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

  // Get companies with scheduled calls
  getCompaniesWithScheduledCalls(): Observable<{companies: Company[], scheduledCallsMap: {[companyId: string]: number}}> {
    // First get all companies
    return this.getCompanies().pipe(
      switchMap(companies => {
        // Then get all scheduled calls
        return from(this.supabaseService.supabaseClient
          .from('calls')
          .select(`
            *,
            contact:contacts(id, company_id)
          `)
          .eq('status', 'scheduled')
          .gte('scheduled_at', new Date().toISOString())
        ).pipe(
          map(response => {
            if (response.error) throw response.error;

            // Create a map of company IDs to call counts
            const scheduledCallsMap: {[companyId: string]: number} = {};

            // Count scheduled calls for each company
            response.data.forEach(call => {
              if (call.contact && call.contact.company_id) {
                const companyId = call.contact.company_id;
                scheduledCallsMap[companyId] = (scheduledCallsMap[companyId] || 0) + 1;
              }
            });

            // Sort companies by scheduled calls (companies with calls first)
            const sortedCompanies = [...companies].sort((a, b) => {
              const aHasCalls = scheduledCallsMap[a.id] ? 1 : 0;
              const bHasCalls = scheduledCallsMap[b.id] ? 1 : 0;

              // First sort by whether they have calls
              if (aHasCalls !== bHasCalls) {
                return bHasCalls - aHasCalls;
              }

              // If both have calls, sort by number of calls
              if (aHasCalls && bHasCalls) {
                return scheduledCallsMap[b.id] - scheduledCallsMap[a.id];
              }

              // If neither has calls, sort alphabetically
              return a.name.localeCompare(b.name);
            });

            return {
              companies: sortedCompanies,
              scheduledCallsMap
            };
          }),
          catchError(error => {
            this.notificationService.error(`Failed to fetch scheduled calls: ${error.message}`);
            return throwError(() => error);
          })
        );
      })
    );
  }

  getCompanyById(id: string): Observable<Company> {
    return from(this.supabaseService.supabaseClient
      .from('companies')
      .select('*')
      .eq('id', id)
      .single()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data;
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch company: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  createCompany(company: Partial<Company>): Observable<Company> {
    return from(this.supabaseService.supabaseClient
      .from('companies')
      .insert(company)
      .select()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        this.notificationService.success('Company created successfully');
        return response.data[0];
      }),
      catchError(error => {
        this.notificationService.error(`Failed to create company: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  updateCompany(id: string, company: Partial<Company>): Observable<Company> {
    return from(this.supabaseService.supabaseClient
      .from('companies')
      .update(company)
      .eq('id', id)
      .select()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        this.notificationService.success('Company updated successfully');
        return response.data[0];
      }),
      catchError(error => {
        this.notificationService.error(`Failed to update company: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  deleteCompany(id: string): Observable<void> {
    return from(this.supabaseService.supabaseClient
      .from('companies')
      .delete()
      .eq('id', id)
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        this.notificationService.success('Company deleted successfully');
      }),
      catchError(error => {
        this.notificationService.error(`Failed to delete company: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  // Company Contacts operations
  getCompanyContacts(companyId: string): Observable<Contact[]> {
    console.log('Getting contacts for company ID:', companyId);

    return from(this.supabaseService.supabaseClient
      .from('contacts')
      .select('*')
      .eq('company_id', companyId)
      .order('first_name', { ascending: true })
    ).pipe(
      map(response => {
        console.log('Contacts response:', response);
        if (response.error) throw response.error;
        return response.data;
      }),
      catchError(error => {
        console.error('Error fetching contacts:', error);
        this.notificationService.error(`Failed to fetch company contacts: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  // Company Communications operations
  getCompanyCommunications(companyId: string): Observable<CompanyCommunication[]> {
    // This would need a new table in the database
    // For now, we'll simulate with calls and other data
    return from(this.supabaseService.supabaseClient
      .from('calls')
      .select(`
        *,
        contact:contacts(id, first_name, last_name, company_id)
      `)
      .eq('contact.company_id', companyId)
      .order('scheduled_at', { ascending: false })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;

        // Convert call data to CompanyCommunication format
        return response.data.map(call => ({
          id: call.id,
          companyId: call.contact.company_id,
          type: 'call' as 'email' | 'call' | 'meeting' | 'note',
          date: call.scheduled_at,
          summary: call.notes || `Call with ${call.contact.first_name} ${call.contact.last_name}`,
          contactId: call.contact_id,
          userId: call.user_id,
          followUpDate: call.follow_up_date,
          created_at: call.created_at,
          updated_at: call.updated_at
        }));
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch company communications: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  // Company Opportunities operations
  getCompanyOpportunities(companyId: string): Observable<Opportunity[]> {
    return from(this.supabaseService.supabaseClient
      .from('opportunities')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;

        // Format the data to match our Opportunity model
        return response.data.map(opp => ({
          id: opp.id,
          title: opp.title,
          description: opp.description,
          status: opp.status,
          probability: opp.probability,
          expectedCloseDate: opp.expected_close_date,
          amount: opp.amount,
          companyId: opp.company_id,
          stage: opp.stage,
          value: opp.amount,
          closeDate: opp.expected_close_date,
          notes: opp.notes,
          createdAt: opp.created_at,
          updatedAt: opp.updated_at
        }));
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch company opportunities: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  // Calculate company metrics
  calculateCompanyMetrics(companyId: string): Observable<Company['metrics']> {
    // This would involve multiple queries to calculate metrics
    // For now, we'll return a placeholder implementation
    return this.getCompanyContacts(companyId).pipe(
      map(contacts => {
        return {
          totalOrderValue: 0, // Would need to sum from orders table
          activeQuotations: 0, // Would need to count from quotations table
          contactCount: contacts.length,
          lastContactDate: new Date().toISOString() // Would need to get from communications
        };
      })
    );
  }
}
