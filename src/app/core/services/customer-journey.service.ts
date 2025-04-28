// src/app/core/services/customer-journey.service.ts
import { Injectable } from '@angular/core';
import { Observable, from, throwError, forkJoin, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { NotificationService } from './notification.service';
import { AuthService } from './auth.service';
import { CustomerJourney, CustomerTouchpoint, JourneyStage, JourneyAnalytics } from '../models/customer-journey.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerJourneyService {
  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  /**
   * Get all customer journeys
   */
  getCustomerJourneys(): Observable<CustomerJourney[]> {
    return from(this.supabaseService.supabaseClient
      .from('customer_journeys')
      .select(`
        *,
        customer:contacts(id, first_name, last_name),
        company:companies(id, name)
      `)
      .order('last_updated', { ascending: false })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data.map(journey => this.formatJourneyFromDatabase(journey));
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch customer journeys: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get a specific customer journey by ID
   */
  getCustomerJourneyById(id: string): Observable<CustomerJourney> {
    return from(this.supabaseService.supabaseClient
      .from('customer_journeys')
      .select(`
        *,
        customer:contacts(id, first_name, last_name),
        company:companies(id, name)
      `)
      .eq('id', id)
      .single()
    ).pipe(
      switchMap(response => {
        if (response.error) throw response.error;
        const journey = this.formatJourneyFromDatabase(response.data);
        
        // Fetch touchpoints for this journey
        return this.getTouchpointsByJourneyId(id).pipe(
          map(touchpoints => {
            // Group touchpoints by stage
            const touchpointsByStage: { [stageId: string]: CustomerTouchpoint[] } = {};
            touchpoints.forEach(touchpoint => {
              const stageId = touchpoint.metadata?.stageId || 'unknown';
              if (!touchpointsByStage[stageId]) {
                touchpointsByStage[stageId] = [];
              }
              touchpointsByStage[stageId].push(touchpoint);
            });
            
            // Add touchpoints to each stage
            journey.stages.forEach(stage => {
              stage.touchpoints = touchpointsByStage[stage.id] || [];
            });
            
            return journey;
          })
        );
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch customer journey: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get touchpoints for a specific journey
   */
  getTouchpointsByJourneyId(journeyId: string): Observable<CustomerTouchpoint[]> {
    return from(this.supabaseService.supabaseClient
      .from('customer_touchpoints')
      .select('*')
      .eq('journey_id', journeyId)
      .order('timestamp', { ascending: true })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data.map(touchpoint => this.formatTouchpointFromDatabase(touchpoint));
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch touchpoints: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get touchpoints for a specific customer
   */
  getTouchpointsByCustomerId(customerId: string): Observable<CustomerTouchpoint[]> {
    return from(this.supabaseService.supabaseClient
      .from('customer_touchpoints')
      .select('*')
      .eq('customer_id', customerId)
      .order('timestamp', { ascending: true })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data.map(touchpoint => this.formatTouchpointFromDatabase(touchpoint));
      }),
      catchError(error => {
        this.notificationService.error(`Failed to fetch touchpoints: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Create a new customer journey
   */
  createCustomerJourney(journey: Partial<CustomerJourney>): Observable<CustomerJourney> {
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser) {
      return throwError(() => new Error('User must be logged in to create customer journeys'));
    }
    
    const formattedJourney = {
      ...this.formatJourneyForDatabase(journey),
      created_by: currentUser.id,
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString()
    };

    return from(this.supabaseService.supabaseClient
      .from('customer_journeys')
      .insert(formattedJourney)
      .select()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        this.notificationService.success('Customer journey created successfully');
        return this.formatJourneyFromDatabase(response.data[0]);
      }),
      catchError(error => {
        this.notificationService.error(`Failed to create customer journey: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update an existing customer journey
   */
  updateCustomerJourney(id: string, journey: Partial<CustomerJourney>): Observable<CustomerJourney> {
    const formattedJourney = {
      ...this.formatJourneyForDatabase(journey),
      last_updated: new Date().toISOString()
    };

    return from(this.supabaseService.supabaseClient
      .from('customer_journeys')
      .update(formattedJourney)
      .eq('id', id)
      .select()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        this.notificationService.success('Customer journey updated successfully');
        return this.formatJourneyFromDatabase(response.data[0]);
      }),
      catchError(error => {
        this.notificationService.error(`Failed to update customer journey: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Add a touchpoint to a customer journey
   */
  addTouchpoint(touchpoint: Partial<CustomerTouchpoint>): Observable<CustomerTouchpoint> {
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser) {
      return throwError(() => new Error('User must be logged in to add touchpoints'));
    }
    
    const formattedTouchpoint = {
      ...this.formatTouchpointForDatabase(touchpoint),
      created_by: currentUser.id,
      created_at: new Date().toISOString()
    };

    return from(this.supabaseService.supabaseClient
      .from('customer_touchpoints')
      .insert(formattedTouchpoint)
      .select()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        this.notificationService.success('Touchpoint added successfully');
        return this.formatTouchpointFromDatabase(response.data[0]);
      }),
      catchError(error => {
        this.notificationService.error(`Failed to add touchpoint: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get journey analytics
   */
  getJourneyAnalytics(): Observable<JourneyAnalytics> {
    // In a real implementation, this would fetch analytics data from the database
    // For now, we'll return mock data
    return of({
      totalJourneys: 125,
      activeJourneys: 78,
      averageJourneyDuration: 45, // days
      conversionRates: [
        { stageName: 'Lead', rate: 65 },
        { stageName: 'Qualified Lead', rate: 48 },
        { stageName: 'Opportunity', rate: 35 },
        { stageName: 'Proposal', rate: 22 },
        { stageName: 'Closed Won', rate: 15 }
      ],
      dropOffPoints: [
        { stageName: 'Lead to Qualified Lead', dropOffRate: 35 },
        { stageName: 'Qualified Lead to Opportunity', dropOffRate: 28 },
        { stageName: 'Opportunity to Proposal', dropOffRate: 18 },
        { stageName: 'Proposal to Closed Won', dropOffRate: 32 }
      ],
      channelEffectiveness: [
        { channel: 'Email', effectiveness: 72 },
        { channel: 'Phone', effectiveness: 85 },
        { channel: 'In Person', effectiveness: 92 },
        { channel: 'Web', effectiveness: 64 },
        { channel: 'Social', effectiveness: 58 }
      ]
    });
  }

  /**
   * Generate a customer journey from existing data
   */
  generateJourneyForCustomer(customerId: string): Observable<CustomerJourney> {
    // This would analyze existing customer data and create a journey
    // For now, we'll create a basic journey structure
    return forkJoin({
      calls: from(this.supabaseService.supabaseClient
        .from('calls')
        .select('*')
        .eq('contact_id', customerId)
        .order('scheduled_at', { ascending: true })),
      emails: from(this.supabaseService.supabaseClient
        .from('email_recipients')
        .select('*')
        .eq('contact_id', customerId)
        .order('sent_at', { ascending: true })),
      contact: from(this.supabaseService.supabaseClient
        .from('contacts')
        .select('*, company:companies(*)')
        .eq('id', customerId)
        .single())
    }).pipe(
      map(({ calls, emails, contact }) => {
        if (calls.error) throw calls.error;
        if (emails.error) throw emails.error;
        if (contact.error) throw contact.error;
        
        // Create touchpoints from calls and emails
        const touchpoints: Partial<CustomerTouchpoint>[] = [];
        
        // Add call touchpoints
        calls.data.forEach(call => {
          touchpoints.push({
            customerId,
            companyId: contact.data.company_id,
            type: 'call',
            channel: 'phone',
            sourceId: call.id,
            sourceType: 'calls',
            timestamp: call.scheduled_at,
            description: `Call: ${call.reason}`,
            outcome: call.status === 'completed' ? 'positive' : (call.status === 'missed' ? 'negative' : 'neutral'),
            notes: call.notes,
            metadata: {
              stageId: this.determineStageFromCall(call),
              duration: call.duration_minutes
            }
          });
        });
        
        // Add email touchpoints
        emails.data.forEach(email => {
          touchpoints.push({
            customerId,
            companyId: contact.data.company_id,
            type: 'email',
            channel: 'email',
            sourceId: email.id,
            sourceType: 'email_recipients',
            timestamp: email.sent_at,
            description: `Email: ${email.status}`,
            outcome: email.status === 'opened' || email.status === 'clicked' ? 'positive' : 
                    (email.status === 'bounced' ? 'negative' : 'neutral'),
            metadata: {
              stageId: this.determineStageFromEmail(email),
              emailStatus: email.status
            }
          });
        });
        
        // Sort touchpoints by timestamp
        touchpoints.sort((a, b) => {
          return new Date(a.timestamp!).getTime() - new Date(b.timestamp!).getTime();
        });
        
        // Create journey stages
        const stages: JourneyStage[] = [
          { id: 'lead', name: 'Lead', description: 'Initial contact or lead generation', order: 1 },
          { id: 'qualified', name: 'Qualified Lead', description: 'Lead has been qualified', order: 2 },
          { id: 'opportunity', name: 'Opportunity', description: 'Qualified lead has become an opportunity', order: 3 },
          { id: 'proposal', name: 'Proposal', description: 'Proposal has been sent', order: 4 },
          { id: 'negotiation', name: 'Negotiation', description: 'Negotiating terms', order: 5 },
          { id: 'closed', name: 'Closed Won', description: 'Deal has been closed', order: 6 }
        ];
        
        // Determine current stage based on touchpoints
        const currentStage = this.determineCurrentStage(touchpoints);
        
        // Create the journey
        const journey: Partial<CustomerJourney> = {
          customerId,
          customerName: `${contact.data.first_name} ${contact.data.last_name}`,
          companyId: contact.data.company_id,
          companyName: contact.data.company?.name,
          currentStage,
          stages,
          startDate: touchpoints.length > 0 ? touchpoints[0].timestamp! : new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          isActive: true,
          totalTouchpoints: touchpoints.length
        };
        
        return journey as CustomerJourney;
      }),
      catchError(error => {
        this.notificationService.error(`Failed to generate journey: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Helper method to determine stage from call data
   */
  private determineStageFromCall(call: any): string {
    // This would use more sophisticated logic in a real implementation
    if (call.status === 'completed' && call.notes?.toLowerCase().includes('proposal')) {
      return 'proposal';
    } else if (call.status === 'completed' && call.notes?.toLowerCase().includes('negotiat')) {
      return 'negotiation';
    } else if (call.status === 'completed' && call.notes?.toLowerCase().includes('closed') && 
               call.notes?.toLowerCase().includes('won')) {
      return 'closed';
    } else if (call.status === 'completed' && call.is_first_call) {
      return 'lead';
    } else if (call.status === 'completed') {
      return 'qualified';
    } else {
      return 'lead';
    }
  }

  /**
   * Helper method to determine stage from email data
   */
  private determineStageFromEmail(email: any): string {
    // This would use more sophisticated logic in a real implementation
    if (email.custom_variables?.type === 'proposal') {
      return 'proposal';
    } else if (email.custom_variables?.type === 'contract') {
      return 'negotiation';
    } else if (email.custom_variables?.type === 'welcome') {
      return 'closed';
    } else {
      return 'lead';
    }
  }

  /**
   * Helper method to determine current stage from touchpoints
   */
  private determineCurrentStage(touchpoints: Partial<CustomerTouchpoint>[]): string {
    // This would use more sophisticated logic in a real implementation
    // For now, we'll use the stage of the most recent touchpoint
    if (touchpoints.length === 0) {
      return 'lead';
    }
    
    const latestTouchpoint = touchpoints[touchpoints.length - 1];
    return latestTouchpoint.metadata?.stageId || 'lead';
  }

  /**
   * Format journey data from database
   */
  private formatJourneyFromDatabase(data: any): CustomerJourney {
    return {
      id: data.id,
      customerId: data.customer_id,
      customerName: data.customer ? `${data.customer.first_name} ${data.customer.last_name}` : undefined,
      companyId: data.company_id,
      companyName: data.company?.name,
      currentStage: data.current_stage,
      stages: data.stages || [],
      startDate: data.start_date,
      lastUpdated: data.last_updated,
      isActive: data.is_active,
      totalTouchpoints: data.total_touchpoints,
      journeyScore: data.journey_score,
      bottlenecks: data.bottlenecks
    };
  }

  /**
   * Format journey data for database
   */
  private formatJourneyForDatabase(journey: Partial<CustomerJourney>): any {
    return {
      customer_id: journey.customerId,
      company_id: journey.companyId,
      current_stage: journey.currentStage,
      stages: journey.stages,
      start_date: journey.startDate,
      last_updated: journey.lastUpdated,
      is_active: journey.isActive,
      total_touchpoints: journey.totalTouchpoints,
      journey_score: journey.journeyScore,
      bottlenecks: journey.bottlenecks
    };
  }

  /**
   * Format touchpoint data from database
   */
  private formatTouchpointFromDatabase(data: any): CustomerTouchpoint {
    return {
      id: data.id,
      customerId: data.customer_id,
      companyId: data.company_id,
      type: data.type,
      subtype: data.subtype,
      channel: data.channel,
      sourceId: data.source_id,
      sourceType: data.source_type,
      timestamp: data.timestamp,
      description: data.description,
      outcome: data.outcome,
      notes: data.notes,
      metadata: data.metadata,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  /**
   * Format touchpoint data for database
   */
  private formatTouchpointForDatabase(touchpoint: Partial<CustomerTouchpoint>): any {
    return {
      customer_id: touchpoint.customerId,
      company_id: touchpoint.companyId,
      type: touchpoint.type,
      subtype: touchpoint.subtype,
      channel: touchpoint.channel,
      source_id: touchpoint.sourceId,
      source_type: touchpoint.sourceType,
      timestamp: touchpoint.timestamp,
      description: touchpoint.description,
      outcome: touchpoint.outcome,
      notes: touchpoint.notes,
      metadata: touchpoint.metadata
    };
  }
}
