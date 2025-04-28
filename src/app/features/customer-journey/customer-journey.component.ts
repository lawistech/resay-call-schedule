// src/app/features/customer-journey/customer-journey.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerJourneyService } from '../../core/services/customer-journey.service';
import { NotificationService } from '../../core/services/notification.service';
import { CustomerJourney, CustomerTouchpoint, JourneyStage } from '../../core/models/customer-journey.model';
import { Contact } from '../../core/models/contact.model';
import { SupabaseService } from '../../core/services/supabase.service';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { format } from 'date-fns';

@Component({
  selector: 'app-customer-journey',
  templateUrl: './customer-journey.component.html',
  styleUrls: ['./customer-journey.component.scss']
})
export class CustomerJourneyComponent implements OnInit {
  // View states
  isLoading = true;
  activeTab: 'journey' | 'analytics' = 'journey';
  showTouchpointModal = false;
  isEditingTouchpoint = false;

  // Data
  journeys: CustomerJourney[] = [];
  selectedJourney: CustomerJourney | null = null;
  selectedStage: JourneyStage | null = null;
  selectedTouchpoint: CustomerTouchpoint | null = null;
  contacts: Contact[] = [];

  // Filter options
  searchTerm = '';
  stageFilter = '';

  constructor(
    private customerJourneyService: CustomerJourneyService,
    private supabaseService: SupabaseService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Load initial data
    this.loadData();

    // Check for query parameters
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.activeTab = params['tab'] as 'journey' | 'analytics';
      }

      if (params['journeyId']) {
        this.loadJourneyDetails(params['journeyId']);
      }
    });
  }

  loadData(): void {
    this.isLoading = true;

    // Load journeys and contacts in parallel
    forkJoin({
      journeys: this.customerJourneyService.getCustomerJourneys().pipe(
        catchError(error => {
          console.error('Error loading journeys:', error);
          return of([]);
        })
      ),
      contacts: of(this.contacts).pipe(
        catchError(error => {
          console.error('Error loading contacts:', error);
          return of([]);
        })
      )
    }).subscribe({
      next: ({ journeys, contacts }) => {
        this.journeys = journeys;
        this.contacts = contacts;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.notificationService.error('Failed to load data. Please try again.');
        this.isLoading = false;
      }
    });
  }

  loadJourneyDetails(journeyId: string): void {
    this.isLoading = true;

    this.customerJourneyService.getCustomerJourneyById(journeyId).subscribe({
      next: (journey) => {
        this.selectedJourney = journey;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading journey details:', error);
        this.notificationService.error('Failed to load journey details. Please try again.');
        this.isLoading = false;
      }
    });
  }

  selectJourney(journey: CustomerJourney): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { journeyId: journey.id },
      queryParamsHandling: 'merge'
    });
  }

  selectStage(stage: JourneyStage): void {
    this.selectedStage = stage;
  }

  selectTouchpoint(touchpoint: CustomerTouchpoint): void {
    this.selectedTouchpoint = touchpoint;
    this.showTouchpointModal = true;
    this.isEditingTouchpoint = false;
  }

  createNewJourney(contactId: string): void {
    this.isLoading = true;

    this.customerJourneyService.generateJourneyForCustomer(contactId).pipe(
      switchMap(journey => this.customerJourneyService.createCustomerJourney(journey))
    ).subscribe({
      next: (journey) => {
        this.notificationService.success('Customer journey created successfully');
        this.journeys.unshift(journey);
        this.selectJourney(journey);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error creating journey:', error);
        this.notificationService.error('Failed to create journey. Please try again.');
        this.isLoading = false;
      }
    });
  }

  addTouchpoint(): void {
    if (!this.selectedJourney || !this.selectedStage) {
      this.notificationService.error('Please select a journey and stage first');
      return;
    }

    this.selectedTouchpoint = null;
    this.showTouchpointModal = true;
    this.isEditingTouchpoint = true;
  }

  editTouchpoint(touchpoint: CustomerTouchpoint): void {
    this.selectedTouchpoint = touchpoint;
    this.showTouchpointModal = true;
    this.isEditingTouchpoint = true;
  }

  saveTouchpoint(event: any): void {
    if (!this.selectedJourney) {
      this.notificationService.error('No journey selected');
      return;
    }

    this.isLoading = true;

    // Convert event to CustomerTouchpoint if needed
    const touchpoint: Partial<CustomerTouchpoint> = event;

    // Add journey ID to the touchpoint metadata
    if (!touchpoint.metadata) {
      touchpoint.metadata = {};
    }
    touchpoint.metadata.journeyId = this.selectedJourney.id;

    this.customerJourneyService.addTouchpoint(touchpoint).subscribe({
      next: (savedTouchpoint) => {
        this.notificationService.success('Touchpoint saved successfully');

        // Refresh journey details
        this.loadJourneyDetails(this.selectedJourney!.id);

        this.showTouchpointModal = false;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error saving touchpoint:', error);
        this.notificationService.error('Failed to save touchpoint. Please try again.');
        this.isLoading = false;
      }
    });
  }

  closeTouchpointModal(): void {
    this.showTouchpointModal = false;
  }

  changeTab(tab: 'journey' | 'analytics'): void {
    this.activeTab = tab;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge'
    });
  }

  // Filter journeys based on search term and stage filter
  get filteredJourneys(): CustomerJourney[] {
    return this.journeys.filter(journey => {
      const matchesSearch = !this.searchTerm ||
        journey.customerName?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        journey.companyName?.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesStage = !this.stageFilter || journey.currentStage === this.stageFilter;

      return matchesSearch && matchesStage;
    });
  }

  // Get all unique stages from journeys
  get uniqueStages(): { id: string, name: string }[] {
    const stages = new Map<string, string>();

    this.journeys.forEach(journey => {
      journey.stages.forEach(stage => {
        stages.set(stage.id, stage.name);
      });
    });

    return Array.from(stages.entries()).map(([id, name]) => ({ id, name }));
  }

  // Format date for display
  formatDate(date: string): string {
    return format(new Date(date), 'MMM d, yyyy');
  }

  // Helper method to find stage by ID
  findStageById(stageId: string, journey: CustomerJourney): JourneyStage | undefined {
    if (!journey || !journey.stages) {
      return undefined;
    }
    return journey.stages.find(stage => stage.id === stageId);
  }

  // Helper method to get stage name by ID
  getStageNameById(stageId: string, journey: CustomerJourney): string {
    const stage = this.findStageById(stageId, journey);
    return stage?.name || 'Unknown';
  }
}
