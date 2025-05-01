// src/app/features/companies/company-detail/company-scheduled-calls/company-scheduled-calls.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Call } from '../../../../core/models/call.model';
import { format } from 'date-fns';
import { CompanyRefreshService } from '../../services/company-refresh.service';
import { CallStateService } from '../../../../core/services/call-state.service';

@Component({
  selector: 'app-company-scheduled-calls',
  templateUrl: './company-scheduled-calls.component.html'
})
export class CompanyScheduledCallsComponent implements OnInit {
  @Input() companyId: string = '';

  scheduledCalls: Call[] = [];
  isLoading = true;
  showCallModal = false;
  showRescheduleModal = false;
  selectedCall: Call | null = null;

  constructor(
    private supabaseService: SupabaseService,
    private notificationService: NotificationService,
    private companyRefreshService: CompanyRefreshService,
    private callStateService: CallStateService
  ) {}

  ngOnInit(): void {
    this.loadScheduledCalls();

    // Check if there's an active call that needs to be displayed
    // This handles the case when navigating from the dashboard's "Companies with Scheduled Calls" section
    const activeCall = this.callStateService.getActiveCall();
    if (activeCall) {
      // Check if the call is related to this company
      if (activeCall.contact?.company_id === this.companyId) {
        console.log('Found active call for this company, showing call modal:', activeCall);
        this.selectedCall = activeCall;
        this.showRescheduleModal = true;

        // Clear the active call from the service to prevent it from showing again
        this.callStateService.clearActiveCall();
      }
    }
  }

  loadScheduledCalls(): void {
    if (!this.companyId) {
      this.isLoading = false;
      return;
    }

    this.isLoading = true;

    // Get all scheduled calls for contacts in this company
    this.supabaseService.supabaseClient
      .from('calls')
      .select(`
        *,
        contact:contacts(
          *,
          company:companies(*)
        )
      `)
      .eq('status', 'scheduled')
      .order('scheduled_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error('Error loading scheduled calls:', error);
          this.notificationService.error('Failed to load scheduled calls');
          this.isLoading = false;
          return;
        }

        // Filter calls for contacts in this company
        this.scheduledCalls = (data || []).filter(call =>
          call.contact && call.contact.company_id === this.companyId
        );

        console.log('Scheduled calls for company:', this.scheduledCalls);
        this.isLoading = false;
      });
  }

  formatDate(date: string): string {
    if (!date) return '';
    return format(new Date(date), 'MMM d, yyyy h:mm a');
  }

  formatTime(date: string): string {
    if (!date) return '';
    return format(new Date(date), 'h:mm a');
  }

  getCallMethodClass(method: string | undefined): string {
    switch (method) {
      case 'phone': return 'bg-green-100 text-green-800';
      case 'webex': return 'bg-blue-100 text-blue-800';
      case 'teams': return 'bg-purple-100 text-purple-800';
      case 'zoom': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  // Helper method to capitalize the first letter of a string
  capitalize(text: string | undefined): string {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  initiateCall(call: Call, event?: MouseEvent): void {
    if (!call.contact?.phone) {
      this.notificationService.warning('No phone number available for this contact');
      return;
    }

    // If we have an event, prevent default behavior
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // For phone calls, use a different approach
    window.location.href = `tel:${call.contact.phone}`;

    // After initiating the call, open the reschedule modal directly
    // This keeps the call summary on the company details page
    this.selectedCall = call;
    this.showRescheduleModal = true;
  }

  async markCallAsCompleted(callId: string): Promise<void> {
    try {
      const { error } = await this.supabaseService.updateCall(callId, {
        status: 'completed',
        completed_at: new Date().toISOString()
      });

      if (error) {
        throw error;
      }

      this.notificationService.success('Call marked as completed');
      this.loadScheduledCalls();
    } catch (error: any) {
      this.notificationService.error('Failed to mark call as completed: ' + error.message);
    }
  }

  openRescheduleModal(call: Call): void {
    this.selectedCall = call;
    this.showRescheduleModal = true;
  }

  closeRescheduleModal(): void {
    this.showRescheduleModal = false;
    this.selectedCall = null;
  }

  handleCallSaved(): void {
    this.loadScheduledCalls();
    this.closeRescheduleModal();
  }
}
