// src/app/features/dashboard/dashboard.component.ts
import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';
import { NotificationService } from '../../core/services/notification.service';
import { Call } from '../../core/models/call.model';
import { Contact } from '../../core/models/contact.model';
import { CallStats } from '../../core/models/call-stats.model';
import { CallStateService } from '../../core/services/call-state.service';
import { format, isToday } from 'date-fns';
import { QuotationService } from '../quotations/services/quotation.service';
import { Quotation } from '../../core/models/quotation.model';
import { CompanyService } from '../companies/services/company.service';
import { Company } from '../../core/models/company.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  isLoading = true;
  calls: Call[] = [];
  scheduledCalls: Call[] = []; // Changed from scheduledContacts to scheduledCalls
  callStats: CallStats = {
    todayCalls: 0,
    completedCalls: 0,
    completionRate: 0,
    callsByMethod: [],
    callsByStatus: []
  };
  showCallModal = false;
  selectedContact: Contact | null = null;
  syncInProgress = false;
  showPostCallModal = false;
  selectedCall: Call | null = null;
  postCallInitialAction: 'complete' | 'reschedule' = 'complete';

  // Dashboard view mode (classic, new, or sumup)
  dashboardView: 'classic' | 'new' | 'sumup' = 'classic'; // Set classic as default

  // Call tabs
  activeCallTab: 'all' | 'sumup' = 'all'; // Default to all calls
  sumupLeads: Call[] = []; // Array to store SumUp leads specifically

  // SumUp view state
  activeMoreActionsCallId: string | null = null;
  activeNotesCallId: string | null = null;
  noteText: string = '';

  // Quotations data
  activeQuotations: Quotation[] = [];

  // Companies data
  companiesWithScheduledCalls: Company[] = [];
  companiesWithActiveQuotations: Company[] = [];
  companiesNeedingAttention: any[] = []; // Companies that need attention (combined metric)
  scheduledActivitiesMap: {[companyId: string]: number} = {};
  activeQuotationsMap: {[companyId: string]: number} = {};

  // Selected items for modals
  selectedQuotation: Quotation | null = null;
  selectedCompany: Company | null = null;
  showQuotationDetailsModal = false;

  constructor(
    private supabaseService: SupabaseService,
    private notificationService: NotificationService,
    private callStateService: CallStateService,
    private router: Router,
    private quotationService: QuotationService,
    private companyService: CompanyService
  ) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    // Close dropdowns when clicking outside
    this.activeMoreActionsCallId = null;
  }

  ngOnInit(): void {
    this.loadDashboardData();

    // Check if there's an active call that needs a post-call modal
    const activeCall = this.callStateService.getActiveCall();
    if (activeCall && this.callStateService.shouldShowPostCallModal()) {
      this.selectedCall = activeCall;
      this.showPostCallModal = true;
    }

    // Load saved dashboard view preference
    const savedView = localStorage.getItem('dashboardView');
    if (savedView && (savedView === 'classic' || savedView === 'new' || savedView === 'sumup')) {
      this.dashboardView = savedView as 'classic' | 'new' | 'sumup';
    }
  }

  // In dashboard.component.ts
  async loadDashboardData(): Promise<void> {
    try {
      this.isLoading = true;

      // Fetch calls data
      const { data: calls, error: callsError } = await this.supabaseService.getCalls();

      if (callsError) {
        throw callsError;
      }

      this.calls = calls || [];

      // Calculate call stats
      this.calculateCallStats();

      // Get today's date as string (YYYY-MM-DD)
      const today = new Date().toISOString().split('T')[0];

      // Filter for today's scheduled calls and overdue calls
      this.scheduledCalls = this.calls.filter(call => {
        const callDate = new Date(call.scheduled_at);
        const now = new Date();

        // Include if:
        // 1. Scheduled for today
        // 2. Status is 'scheduled'
        // 3. OR it's overdue (past date with status still 'scheduled')
        const isForToday = call.scheduled_at.startsWith(today);
        const isOverdue = callDate < now && call.status === 'scheduled';

        return (isForToday || isOverdue) && call.status === 'scheduled';
      }).sort((a, b) => {
        // Sort by scheduled time
        return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
      });

      // Add an 'isOverdue' property to identify overdue calls
      this.scheduledCalls = this.scheduledCalls.map(call => {
        const callDate = new Date(call.scheduled_at);
        const now = new Date();
        call.isOverdue = callDate < now;
        return call;
      });

      // Filter SumUp leads from all calls (show all statuses for SumUp leads)
      this.sumupLeads = this.calls.filter(call =>
        call.lead_source === 'sumup'
      ).sort((a, b) => {
        // Sort by most recent first for SumUp leads
        return new Date(b.created_at || b.scheduled_at).getTime() -
               new Date(a.created_at || a.scheduled_at).getTime();
      });

      // Debug logging
      console.log('Total calls loaded:', this.calls.length);
      console.log('SumUp leads found:', this.sumupLeads.length);
      console.log('All lead sources in calls:', [...new Set(this.calls.map(call => call.lead_source))]);
      console.log('All calls with lead sources:', this.calls.map(call => ({ id: call.id, lead_source: call.lead_source, contact: call.contact?.first_name + ' ' + call.contact?.last_name })));
      if (this.sumupLeads.length > 0) {
        console.log('SumUp leads:', this.sumupLeads);
      } else {
        console.log('No SumUp leads found. Checking if any calls have lead_source = sumup...');
        const sumupCalls = this.calls.filter(call => call.lead_source === 'sumup');
        console.log('Calls with lead_source = sumup:', sumupCalls);
      }

      // Add isOverdue property to SumUp leads as well
      this.sumupLeads = this.sumupLeads.map(call => {
        const callDate = new Date(call.scheduled_at);
        const now = new Date();
        call.isOverdue = callDate < now;
        return call;
      });

      // Load quotations and companies data
      this.loadQuotationsAndCompanies();

    } catch (error: any) {
      this.notificationService.error('Failed to load dashboard data: ' + error.message);
    } finally {
      this.isLoading = false;
    }
  }

  calculateCallStats(): void {
    const today = new Date().toISOString().split('T')[0]; // Get YYYY-MM-DD format

    // Calculate today's calls
    const todayCalls = this.calls.filter(call =>
      call.scheduled_at.startsWith(today)
    );

    this.callStats.todayCalls = todayCalls.length;

    // Calculate completed calls
    const completedCalls = this.calls.filter(call =>
      call.status === 'completed'
    );

    this.callStats.completedCalls = completedCalls.length;

    // Calculate completion rate
    this.callStats.completionRate = this.calls.length > 0
      ? Math.round((completedCalls.length / this.calls.length) * 100)
      : 0;

    // Calculate calls by method
    const methodCounts: {[key: string]: number} = {};

    this.calls.forEach(call => {
      const method = call.method || 'phone';
      methodCounts[method] = (methodCounts[method] || 0) + 1;
    });

    this.callStats.callsByMethod = Object.entries(methodCounts)
      .map(([method, count]) => ({ method, count }))
      .sort((a, b) => b.count - a.count);

    // Calculate calls by status
    const statusCounts: {[key: string]: number} = {};

    this.calls.forEach(call => {
      statusCounts[call.status] = (statusCounts[call.status] || 0) + 1;
    });

    this.callStats.callsByStatus = Object.entries(statusCounts)
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);
  }

  // Format time helper for scheduled calls
  formatTime(dateString: string): string {
    return format(new Date(dateString), 'h:mm a');
  }

  // Get scheduled calls count
  getScheduledCallsCount(): number {
    if (!this.calls) return 0;
    return this.calls.filter(call => call.status === 'scheduled').length;
  }

  async markCallAsCompleted(callId: string): Promise<void> {
    // Find the call index
    const callIndex = this.calls.findIndex(call => call.id === callId);

    if (callIndex === -1) {
      return;
    }

    try {
      // Update call in the database
      const { error } = await this.supabaseService.updateCall(callId, {
        status: 'completed',
        completed_at: new Date().toISOString()
      });

      if (error) {
        throw error;
      }

      // Update call status in the local state
      this.calls[callIndex] = {
        ...this.calls[callIndex],
        status: 'completed',
        completed_at: new Date().toISOString()
      };

      // Recalculate stats
      this.calculateCallStats();

      // Show a notification
      this.notificationService.success('Call marked as completed');
    } catch (error: any) {
      this.notificationService.error('Failed to mark call as completed: ' + error.message);
    }
  }

  // Now this will open the call detail view
  viewCallDetails(callId: string): void {
    this.router.navigate(['/call-history', callId]);
  }

  // For initiating calls
  initiateCall(call: Call): void {
    console.log('Dashboard: initiateCall called with call:', call);
    this.notificationService.info('Initiating call... (Demo feature)');

    // Check if we have a company ID to navigate to
    const companyId = call.contact?.company_id;

    if (companyId) {
      // Store the call in the service with flag to navigate to company details
      this.callStateService.setActiveCall(call, true);

      // In a real implementation, this would use a native dialer or VoIP service
      if (call.contact?.phone) {
        // Initiate the call
        window.location.href = `tel:${call.contact.phone}`;
      } else {
        this.notificationService.warning('No phone number available for this contact');
      }

      // Navigate to the company details page with the scheduled-calls tab active
      this.router.navigate(['/companies', companyId], {
        queryParams: { tab: 'scheduled-calls' }
      });
    } else {
      // If no company ID, fall back to showing the modal on the dashboard
      this.selectedCall = call;
      this.showPostCallModal = true;

      // Store the call in the service without navigation flag
      this.callStateService.setActiveCall(call, false);

      console.log('Dashboard: Post-call modal should be visible now. showPostCallModal =', this.showPostCallModal);
      console.log('Dashboard: selectedCall =', this.selectedCall);

      // In a real implementation, this would use a native dialer or VoIP service
      if (call.contact?.phone) {
        // Initiate the call
        window.location.href = `tel:${call.contact.phone}`;
      } else {
        this.notificationService.warning('No phone number available for this contact');
      }
    }
  }

  // Add these methods to handle the post-call modal
  closePostCallModal(): void {
    console.log('Dashboard: closePostCallModal called');
    this.showPostCallModal = false;
    this.selectedCall = null;
    this.callStateService.clearActiveCall();
    // Reset the initialAction to default
    this.postCallInitialAction = 'complete';
    console.log('Dashboard: Post-call modal closed. showPostCallModal =', this.showPostCallModal);
  }

  async handleCallCompleted(data: {callId: string, notes: string}): Promise<void> {
    try {
      const { error } = await this.supabaseService.updateCall(data.callId, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        notes: data.notes
      });

      if (error) {
        throw error;
      }

      this.notificationService.success('Call marked as completed');
      this.loadDashboardData(); // Refresh the data
    } catch (error: any) {
      this.notificationService.error('Failed to update call: ' + error.message);
    } finally {
      this.closePostCallModal();
    }
  }

  async handleCallRescheduled(data: {callId: string, scheduledAt: string, notes: string}): Promise<void> {
    try {
      const { error } = await this.supabaseService.updateCall(data.callId, {
        scheduled_at: data.scheduledAt,
        notes: data.notes
      });

      if (error) {
        throw error;
      }

      this.notificationService.success('Call rescheduled successfully');
      this.loadDashboardData(); // Refresh the data
    } catch (error: any) {
      this.notificationService.error('Failed to reschedule call: ' + error.message);
    } finally {
      this.closePostCallModal();
    }
  }

  // Handle contact schedule actions
  viewContact(contactId: string): void {
    this.router.navigate(['/contacts', contactId]);
  }

  scheduleCall(contact: Contact): void {
    this.selectedContact = contact;
    this.showCallModal = true;
  }

  closeCallModal(): void {
    this.showCallModal = false;
    this.selectedContact = null;
  }

  handleCallSaved(): void {
    // Refresh data
    this.loadDashboardData();

    // If we're on the SumUp tab, show a success message
    if (this.activeCallTab === 'sumup' && this.selectedContact?.lead_source === 'sumup') {
      this.notificationService.success('SumUp lead saved successfully');
    }

    this.closeCallModal();
  }

  // Sync contacts with external systems
  async syncContacts(): Promise<void> {
    if (this.syncInProgress) {
      return;
    }

    try {
      this.syncInProgress = true;
      this.notificationService.info('Syncing contacts with external systems...');

      // Call your sync service method here
      // For demo purposes, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate successful sync
      this.notificationService.success('Contacts synced successfully');
      this.loadDashboardData(); // Refresh the data
    } catch (error: any) {
      this.notificationService.error('Failed to sync contacts: ' + error.message);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Opens the reschedule modal for a call
   * @param call The call to be rescheduled
   */
  openRescheduleModal(call: Call): void {
    // Store the call in the service
    this.callStateService.setActiveCall(call);

    // Set the selected call and show the modal
    this.selectedCall = call;
    this.showPostCallModal = true;

    // Set the initialAction property to 'reschedule'
    // This will be passed to the post-call-modal component
    this.postCallInitialAction = 'reschedule';

    console.log('Dashboard: openRescheduleModal called for call:', call);
    console.log('Dashboard: showPostCallModal =', this.showPostCallModal);
    console.log('Dashboard: postCallInitialAction =', this.postCallInitialAction);
  }

  /**
   * Toggle between dashboard views (classic, new, sumup)
   */
  toggleDashboardView(view?: 'classic' | 'new' | 'sumup'): void {
    if (view) {
      // If a specific view is provided, set it directly
      this.dashboardView = view;
    } else {
      // Otherwise cycle through views: classic -> new -> sumup -> classic
      if (this.dashboardView === 'classic') {
        this.dashboardView = 'new';
      } else if (this.dashboardView === 'new') {
        this.dashboardView = 'sumup';
      } else {
        this.dashboardView = 'classic';
      }
    }
    // Save preference to localStorage
    localStorage.setItem('dashboardView', this.dashboardView);
  }

  /**
   * Switch between call tabs (all calls or specific lead source)
   */
  switchCallTab(tab: 'all' | 'sumup'): void {
    this.activeCallTab = tab;
  }

  /**
   * Create a new call with a specific lead source
   * @param leadSource The lead source to pre-select in the call modal
   */
  createCallWithLeadSource(leadSource: string): void {
    // For SumUp leads, redirect to contacts page to select a contact to schedule
    if (leadSource === 'sumup') {
      this.notificationService.info('Select a SumUp contact to schedule a call with.');
      this.router.navigate(['/contacts'], {
        queryParams: {
          lead_source: 'sumup'
        }
      });
      return;
    }

    // Create a temporary contact to open the call modal for other lead sources
    const tempContact: Contact = {
      id: '', // This will be filled in by the user selecting a contact
      first_name: '',
      last_name: '',
      lead_source: leadSource
    };

    // For regular calls (no specific lead source)
    if (!leadSource) {
      this.notificationService.info('Creating a new call. Please select a contact and fill in the details.');
      // Switch to the All tab if not already there
      this.switchCallTab('all');
    }

    this.selectedContact = tempContact;
    this.showCallModal = true;
  }

  /**
   * Get calls filtered by the active tab
   */
  getFilteredCalls(): Call[] {
    if (this.activeCallTab === 'all') {
      return this.scheduledCalls;
    } else {
      // Return the dedicated sumupLeads array instead of filtering scheduledCalls
      return this.sumupLeads;
    }
  }

  /**
   * Get the number of completed calls in the last 7 days
   */
  getRecentCompletedCallsCount(): number {
    if (!this.calls) return 0;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return this.calls.filter(call => {
      return call.status === 'completed' &&
             call.completed_at &&
             new Date(call.completed_at) >= sevenDaysAgo;
    }).length;
  }

  /**
   * Get the number of upcoming calls in the next 7 days
   */
  getUpcomingCallsCount(): number {
    if (!this.calls) return 0;

    const now = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    return this.calls.filter(call => {
      if (call.status !== 'scheduled') return false;

      const callDate = new Date(call.scheduled_at);
      return callDate >= now && callDate <= sevenDaysLater;
    }).length;
  }

  /**
   * Load quotations and companies data
   */
  loadQuotationsAndCompanies(): void {
    console.log('Loading quotations and companies data...');
    // Create an observable that combines both API calls
    forkJoin({
      quotations: this.quotationService.getQuotations(),
      companies: this.companyService.getCompaniesWithScheduledCalls()
    }).subscribe({
      next: (result) => {
        console.log('Data received:', result);
        // Process quotations
        this.activeQuotations = result.quotations.filter(q =>
          q.status === 'draft' || q.status === 'sent'
        ).sort((a, b) => {
          // Sort by most recent first
          return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
        });
        console.log('Active quotations:', this.activeQuotations);

        // Process companies
        this.scheduledActivitiesMap = result.companies.scheduledActivitiesMap;
        this.activeQuotationsMap = result.companies.activeQuotationsMap;
        console.log('Scheduled activities map:', this.scheduledActivitiesMap);
        console.log('Active quotations map:', this.activeQuotationsMap);

        // Get companies with scheduled calls
        this.companiesWithScheduledCalls = result.companies.companies.filter(company =>
          this.scheduledActivitiesMap[company.id] && this.scheduledActivitiesMap[company.id] > 0
        ).sort((a, b) => {
          // Sort by most scheduled activities first
          return (this.scheduledActivitiesMap[b.id] || 0) - (this.scheduledActivitiesMap[a.id] || 0);
        });
        console.log('Companies with scheduled calls:', this.companiesWithScheduledCalls);

        // Get companies with active quotations
        this.companiesWithActiveQuotations = result.companies.companies.filter(company =>
          this.activeQuotationsMap[company.id] && this.activeQuotationsMap[company.id] > 0
        ).sort((a, b) => {
          // Sort by most active quotations first
          return (this.activeQuotationsMap[b.id] || 0) - (this.activeQuotationsMap[a.id] || 0);
        });
        console.log('Companies with active quotations:', this.companiesWithActiveQuotations);

        // Combine companies that need attention (have both scheduled calls and active quotations)
        const companiesNeedingAttention = new Map();

        // Add companies with scheduled calls
        this.companiesWithScheduledCalls.forEach(company => {
          companiesNeedingAttention.set(company.id, {
            ...company,
            scheduledCalls: this.scheduledActivitiesMap[company.id] || 0,
            activeQuotations: this.activeQuotationsMap[company.id] || 0,
            attentionScore: (this.scheduledActivitiesMap[company.id] || 0) * 2 // Weight scheduled calls higher
          });
        });

        // Add or update companies with active quotations
        this.companiesWithActiveQuotations.forEach(company => {
          if (companiesNeedingAttention.has(company.id)) {
            // Update existing entry
            const existingCompany = companiesNeedingAttention.get(company.id);
            existingCompany.attentionScore += (this.activeQuotationsMap[company.id] || 0);
            companiesNeedingAttention.set(company.id, existingCompany);
          } else {
            // Add new entry
            companiesNeedingAttention.set(company.id, {
              ...company,
              scheduledCalls: this.scheduledActivitiesMap[company.id] || 0,
              activeQuotations: this.activeQuotationsMap[company.id] || 0,
              attentionScore: this.activeQuotationsMap[company.id] || 0
            });
          }
        });

        // Convert map to array and sort by attention score
        this.companiesNeedingAttention = Array.from(companiesNeedingAttention.values())
          .sort((a, b) => b.attentionScore - a.attentionScore)
          .slice(0, 10); // Limit to top 10 companies needing attention
      },
      error: (error) => {
        console.error('Error loading quotations and companies:', error);
        this.notificationService.error('Failed to load quotations and companies data');
      }
    });
  }

  /**
   * View quotation details
   */
  viewQuotationDetails(quotationId: string): void {
    this.quotationService.getQuotationById(quotationId).subscribe({
      next: (quotation) => {
        this.selectedQuotation = quotation;
        this.showQuotationDetailsModal = true;
      },
      error: (error) => {
        console.error('Error loading quotation details:', error);
        this.notificationService.error('Failed to load quotation details');
        // Fallback to navigation
        this.router.navigate(['/quotations', quotationId]);
      }
    });
  }

  /**
   * Close quotation details modal
   */
  closeQuotationDetailsModal(): void {
    this.showQuotationDetailsModal = false;
    this.selectedQuotation = null;
  }

  /**
   * Navigate to company details
   * If coming from the "Companies with Scheduled Calls" section,
   * automatically navigate to the scheduled-calls tab
   *
   * Note: This method should only navigate to the company details page
   * and not show any modals on the dashboard. The company details page
   * will handle showing any necessary modals.
   */
  viewCompanyDetails(companyId: string): void {
    // Get the active call if there is one
    const activeCall = this.callStateService.getActiveCall();

    // If there's an active call and it's for this company, set the flag to navigate to company details
    if (activeCall && activeCall.contact?.company_id === companyId) {
      // Update the call state to indicate we're navigating to company details
      this.callStateService.setActiveCall(activeCall, true);
    } else {
      // Clear any selected call to prevent the call modal from showing on the dashboard
      this.selectedCall = null;
      this.showPostCallModal = false;
      this.callStateService.clearActiveCall();
    }

    // Navigate to the company details page with the scheduled-calls tab
    this.router.navigate(['/companies', companyId], {
      queryParams: { tab: 'scheduled-calls' }
    });
  }

  /**
   * Get the number of scheduled activities for a company
   */
  getScheduledActivitiesCount(companyId: string): number {
    return this.scheduledActivitiesMap[companyId] || 0;
  }

  /**
   * Get the number of active quotations for a company
   */
  getActiveQuotationsCount(companyId: string): number {
    return this.activeQuotationsMap[companyId] || 0;
  }

  /**
   * Format currency
   */
  formatCurrency(amount?: number): string {
    if (amount === undefined || amount === null) return '£0.00';
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);
  }

  /**
   * Format date
   */
  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'dd MMM yyyy');
  }

  /**
   * Format date with relative display (Today, Tomorrow, etc.)
   */
  formatRelativeDate(dateString?: string): string {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    const today = new Date();

    // Today
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }

    // Tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }

    // Yesterday
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    // This week - use day name
    const diffInDays = Math.abs((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffInDays <= 7) {
      return format(date, 'EEEE'); // Day name (Monday, Tuesday, etc.)
    }

    // Older dates - use short format
    return format(date, 'dd MMM');
  }

  /**
   * Add or update notes for a SumUp lead
   * @param data Object containing callId and note
   */
  async addNoteToSumUpLead(data: {callId: string, note: string}): Promise<void> {
    try {
      // Find the call in the sumupLeads array
      const callIndex = this.sumupLeads.findIndex(call => call.id === data.callId);

      if (callIndex === -1) {
        this.notificationService.error('Call not found');
        return;
      }

      // Update the call in the database
      const { error } = await this.supabaseService.updateCall(data.callId, {
        notes: data.note
      });

      if (error) {
        throw error;
      }

      // Update the call in the local state
      this.sumupLeads[callIndex] = {
        ...this.sumupLeads[callIndex],
        notes: data.note
      };

      // Also update in the main calls array if it exists there
      const mainCallIndex = this.calls.findIndex(call => call.id === data.callId);
      if (mainCallIndex !== -1) {
        this.calls[mainCallIndex] = {
          ...this.calls[mainCallIndex],
          notes: data.note
        };
      }

      this.notificationService.success('Notes updated successfully');
    } catch (error: any) {
      this.notificationService.error('Failed to update notes: ' + error.message);
    }
  }

  /**
   * Get the count of completed SumUp calls
   */
  getCompletedSumUpCallsCount(): number {
    if (!this.calls) return 0;
    return this.calls.filter(call =>
      call.lead_source === 'sumup' && call.status === 'completed'
    ).length;
  }

  /**
   * Get the count of scheduled SumUp calls
   */
  getScheduledSumUpCallsCount(): number {
    if (!this.calls) return 0;
    return this.calls.filter(call =>
      call.lead_source === 'sumup' && call.status === 'scheduled'
    ).length;
  }

  /**
   * Get the completion rate for SumUp calls
   */
  getCompletionRate(): number {
    if (!this.calls || this.sumupLeads.length === 0) return 0;
    const completedCount = this.getCompletedSumUpCallsCount();
    const totalCount = this.sumupLeads.length;
    return Math.round((completedCount / totalCount) * 100);
  }

  /**
   * Check if the current dashboard view is SumUp
   */
  isSumUpView(): boolean {
    return this.dashboardView === 'sumup';
  }

  /**
   * Toggle more actions dropdown for a specific call
   */
  toggleMoreActions(callId: string, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.activeMoreActionsCallId === callId) {
      this.activeMoreActionsCallId = null;
    } else {
      this.activeMoreActionsCallId = callId;
    }
  }

  /**
   * Toggle notes editor for a specific call
   */
  toggleNotesEditor(callId: string, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    // Close more actions dropdown
    this.activeMoreActionsCallId = null;

    if (this.activeNotesCallId === callId) {
      this.activeNotesCallId = null;
      this.noteText = '';
    } else {
      this.activeNotesCallId = callId;
      // Pre-populate with existing notes if available
      const call = this.sumupLeads.find(c => c.id === callId);
      this.noteText = call?.notes || '';
    }
  }

  /**
   * Save notes for a call
   */
  async saveNotes(callId: string, event: MouseEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    if (this.noteText.trim()) {
      await this.addNoteToSumUpLead({ callId, note: this.noteText });
    }

    this.activeNotesCallId = null;
    this.noteText = '';
  }

  /**
   * Handle call actions from the simplified view
   */
  onViewCallDetails(callId: string, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    // Close any open dropdowns
    this.activeMoreActionsCallId = null;

    this.viewCallDetails(callId);
  }

  onInitiateCall(call: Call, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    // Close any open dropdowns
    this.activeMoreActionsCallId = null;

    this.initiateCall(call);
  }

  onCompleteCall(callId: string, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    // Close any open dropdowns
    this.activeMoreActionsCallId = null;

    this.markCallAsCompleted(callId);
  }

  onRescheduleCall(call: Call, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    // Close any open dropdowns
    this.activeMoreActionsCallId = null;

    this.openRescheduleModal(call);
  }


}