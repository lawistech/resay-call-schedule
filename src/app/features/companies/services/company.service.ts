// src/app/features/companies/services/company.service.ts
import { Injectable } from '@angular/core';
import { Observable, from, throwError, map, catchError, switchMap, of, combineLatest } from 'rxjs';
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

  // Search for companies by name, website, or industry
  searchCompanies(searchTerm: string): Observable<Company[]> {
    if (!searchTerm || searchTerm.trim().length < 2) {
      return of([]);
    }

    const term = searchTerm.toLowerCase().trim();

    return from(this.supabaseService.supabaseClient
      .from('companies')
      .select('*')
      .or(`name.ilike.%${term}%,website.ilike.%${term}%,industry.ilike.%${term}%`)
      .order('name', { ascending: true })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data;
      }),
      catchError(error => {
        console.error('Error searching companies:', error);
        return of([]);
      })
    );
  }

  // Check for duplicate company by name
  checkDuplicateCompany(name: string): Observable<Company[]> {
    if (!name || name.trim().length < 2) {
      return of([]);
    }

    const term = name.toLowerCase().trim();

    return from(this.supabaseService.supabaseClient
      .from('companies')
      .select('*')
      .ilike('name', term)
      .order('name', { ascending: true })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data;
      }),
      catchError(error => {
        console.error('Error checking duplicate company:', error);
        return of([]);
      })
    );
  }

  // Get companies with active quotations and scheduled activities
  getCompaniesWithScheduledCalls(): Observable<{companies: Company[], scheduledActivitiesMap: {[companyId: string]: number}, activeQuotationsMap: {[companyId: string]: number}}> {
    console.log('Getting companies with active quotations and scheduled calls');

    // First get all companies
    return this.getCompanies().pipe(
      switchMap(companies => {
        // Get active quotations (draft or sent status)
        const quotationsPromise = this.supabaseService.supabaseClient
          .from('quotations')
          .select('id, company_id, status')
          .in('status', ['draft', 'sent']);

        // Get scheduled calls - make sure to include all scheduled calls
        const callsPromise = this.supabaseService.supabaseClient
          .from('calls')
          .select(`
            *,
            contact:contacts(id, company_id)
          `)
          .eq('status', 'scheduled');
          // Removed the date filter to include all scheduled calls

        // Get contacts with scheduled status
        const contactsPromise = this.supabaseService.supabaseClient
          .from('contacts')
          .select('id, company_id, schedule, status')
          .eq('status', 'scheduled');

        // Combine all promises
        return from(Promise.all([quotationsPromise, callsPromise, contactsPromise])).pipe(
          map(([quotationsResponse, callsResponse, contactsResponse]) => {
            if (quotationsResponse.error) {
              console.error('Error fetching quotations:', quotationsResponse.error);
              throw quotationsResponse.error;
            }
            if (callsResponse.error) {
              console.error('Error fetching calls:', callsResponse.error);
              throw callsResponse.error;
            }
            if (contactsResponse.error) {
              console.error('Error fetching contacts:', contactsResponse.error);
              throw contactsResponse.error;
            }

            console.log('Active quotations data:', quotationsResponse.data);
            console.log('Scheduled calls data:', callsResponse.data);
            console.log('Scheduled contacts data:', contactsResponse.data);

            // Create maps for tracking
            const activeQuotationsMap: {[companyId: string]: number} = {};
            const scheduledActivitiesMap: {[companyId: string]: number} = {};

            // Process active quotations
            quotationsResponse.data.forEach(quotation => {
              if (quotation.company_id) {
                const companyId = quotation.company_id;
                activeQuotationsMap[companyId] = (activeQuotationsMap[companyId] || 0) + 1;
                console.log(`Company ${companyId} has ${activeQuotationsMap[companyId]} active quotation(s)`);
              }
            });

            // Process scheduled calls
            callsResponse.data.forEach(call => {
              if (call.contact && call.contact.company_id) {
                const companyId = call.contact.company_id;
                scheduledActivitiesMap[companyId] = (scheduledActivitiesMap[companyId] || 0) + 1;
                console.log(`Company ${companyId} has a scheduled call with contact ${call.contact.id}`);
              } else {
                // Try to get company_id from the contact_id
                if (call.contact_id) {
                  // Find the contact in the contacts response
                  const contact = contactsResponse.data.find(c => c.id === call.contact_id);
                  if (contact && contact.company_id) {
                    const companyId = contact.company_id;
                    scheduledActivitiesMap[companyId] = (scheduledActivitiesMap[companyId] || 0) + 1;
                    console.log(`Company ${companyId} has a scheduled call with contact ${call.contact_id} (found via contact_id)`);
                  } else {
                    console.log('Warning: Scheduled call without company_id and contact not found:', call);
                  }
                } else {
                  console.log('Warning: Scheduled call without company_id and contact_id:', call);
                }
              }
            });

            // Process contacts with scheduled status
            contactsResponse.data.forEach(contact => {
              if (contact.company_id) {
                const companyId = contact.company_id;
                scheduledActivitiesMap[companyId] = (scheduledActivitiesMap[companyId] || 0) + 1;
                console.log(`Company ${companyId} has a scheduled contact with id ${contact.id}`);
              } else {
                console.log('Warning: Scheduled contact without company_id:', contact);
              }
            });

            console.log('Active quotations map:', activeQuotationsMap);
            console.log('Scheduled activities map:', scheduledActivitiesMap);

            // Sort companies: first by active quotations, then by scheduled activities
            const sortedCompanies = [...companies].sort((a, b) => {
              // Check if companies have active quotations
              const aHasQuotations = !!activeQuotationsMap[a.id];
              const bHasQuotations = !!activeQuotationsMap[b.id];

              // If one has quotations and the other doesn't, prioritize the one with quotations
              if (aHasQuotations !== bHasQuotations) {
                return aHasQuotations ? -1 : 1;
              }

              // If both have quotations, sort by number of quotations
              if (aHasQuotations && bHasQuotations) {
                const quotationDiff = activeQuotationsMap[b.id] - activeQuotationsMap[a.id];
                if (quotationDiff !== 0) return quotationDiff;
              }

              // If tied on quotations, check scheduled activities
              const aHasActivities = !!scheduledActivitiesMap[a.id];
              const bHasActivities = !!scheduledActivitiesMap[b.id];

              if (aHasActivities !== bHasActivities) {
                return aHasActivities ? -1 : 1;
              }

              // If both have activities, sort by number of activities
              if (aHasActivities && bHasActivities) {
                const activityDiff = scheduledActivitiesMap[b.id] - scheduledActivitiesMap[a.id];
                if (activityDiff !== 0) return activityDiff;
              }

              // If still tied, sort alphabetically by name
              return a.name.localeCompare(b.name);
            });

            // Add metrics to companies
            sortedCompanies.forEach(company => {
              if (!company.metrics) {
                company.metrics = {};
              }
              company.metrics.activeQuotations = activeQuotationsMap[company.id] || 0;
              company.metrics.scheduledCalls = scheduledActivitiesMap[company.id] || 0;
            });

            return {
              companies: sortedCompanies,
              activeQuotationsMap,
              scheduledActivitiesMap
            };
          }),
          catchError(error => {
            console.error('Error processing company data:', error);
            this.notificationService.error(`Failed to load company data: ${error.message}`);
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
    console.log(`Getting communications for company ID: ${companyId}`);

    // First get all contacts for this company
    return this.getCompanyContacts(companyId).pipe(
      switchMap(contacts => {
        // Extract contact IDs
        const contactIds = contacts.map(contact => contact.id);
        console.log(`Found ${contactIds.length} contacts for company ID: ${companyId}`);

        if (contactIds.length === 0) {
          // No contacts, return empty array
          return of([]);
        }

        // Get all calls for these contacts
        return from(this.supabaseService.supabaseClient
          .from('calls')
          .select(`
            *,
            contact:contacts(id, first_name, last_name, company_id)
          `)
          .in('contact_id', contactIds)
          .order('scheduled_at', { ascending: false })
        ).pipe(
          map(response => {
            if (response.error) throw response.error;

            console.log(`Found ${response.data.length} calls for company ID: ${companyId}`);
            console.log('Call data:', response.data);

            // Convert call data to CompanyCommunication format
            return response.data.map(call => {
              // Determine the summary based on call status and notes
              let summary = '';
              if (call.notes) {
                summary = call.notes;
              } else if (call.contact) {
                const contactName = `${call.contact.first_name} ${call.contact.last_name}`;
                if (call.status === 'completed') {
                  summary = `Completed call with ${contactName}`;
                } else if (call.status === 'scheduled') {
                  summary = `Scheduled call with ${contactName}`;
                } else if (call.status === 'missed') {
                  summary = `Missed call with ${contactName}`;
                } else {
                  summary = `Call with ${contactName} (${call.status})`;
                }

                // Add reason if available
                if (call.reason) {
                  summary += ` - ${call.reason}`;
                }
              }

              return {
                id: call.id,
                companyId: companyId,
                type: 'call' as 'email' | 'call' | 'meeting' | 'note',
                date: call.scheduled_at,
                summary: summary,
                contactId: call.contact_id,
                userId: call.user_id,
                followUpDate: call.follow_up_date,
                created_at: call.created_at,
                updated_at: call.updated_at
              };
            });
          })
        );
      }),
      catchError(error => {
        console.error('Error fetching company communications:', error);
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
      .neq('status', 'Won') // Exclude opportunities with 'Won' status
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
    // Get contacts for this company
    const contactsPromise = this.getCompanyContacts(companyId).pipe(
      map(contacts => contacts.length)
    );

    // Get active quotations count
    const quotationsPromise = from(this.supabaseService.supabaseClient
      .from('quotations')
      .select('id')
      .eq('company_id', companyId)
      .in('status', ['draft', 'sent'])
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data.length;
      })
    );

    // Get scheduled calls count
    const scheduledCallsPromise = this.getCompanyContacts(companyId).pipe(
      switchMap(contacts => {
        if (contacts.length === 0) return of(0);

        const contactIds = contacts.map(contact => contact.id);
        return from(this.supabaseService.supabaseClient
          .from('calls')
          .select('id')
          .in('contact_id', contactIds)
          .eq('status', 'scheduled')
          .gte('scheduled_at', new Date().toISOString())
        ).pipe(
          map(response => {
            if (response.error) throw response.error;
            return response.data.length;
          })
        );
      })
    );

    // Combine all metrics
    return combineLatest([
      contactsPromise,
      quotationsPromise,
      scheduledCallsPromise
    ]).pipe(
      map(([contactCount, activeQuotations, scheduledCalls]) => {
        return {
          totalOrderValue: 0, // Would need to sum from orders table
          activeQuotations,
          scheduledCalls,
          contactCount,
          lastContactDate: new Date().toISOString() // Would need to get from communications
        };
      }),
      catchError(error => {
        console.error('Error calculating company metrics:', error);
        // Return default metrics on error
        return of({
          totalOrderValue: 0,
          activeQuotations: 0,
          scheduledCalls: 0,
          contactCount: 0,
          lastContactDate: new Date().toISOString()
        });
      })
    );
  }
}
