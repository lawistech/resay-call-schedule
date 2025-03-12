// src/app/features/schedule/schedule.component.ts
import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../../core/services/supabase.service';
import { NotificationService } from '../../core/services/notification.service';
import { Call } from '../../core/models/call.model';
import { Contact } from '../../core/models/contact.model';
import { 
  format, 
  isToday, 
  isTomorrow, 
  startOfToday, 
  endOfToday, 
  startOfTomorrow, 
  endOfTomorrow, 
  startOfWeek, 
  endOfWeek, 
  parseISO 
} from 'date-fns';
import { CallStateService } from '../../core/services/call-state.service';

@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.scss'] // You may need to create this file
})
export class ScheduleComponent implements OnInit {
  upcomingCalls: Call[] = [];
  scheduledContacts: Contact[] = [];
  combinedEvents: any[] = [];
  isLoading = true;
  showCallModal = false;
  showPostCallModal = false;
  selectedCall: Call | null = null;
  selectedContact: Contact | null = null;
  filterView: 'all' | 'today' | 'tomorrow' | 'week' = 'today'; // Default to today's view
  
  // Grouping
  groupedEvents: { [key: string]: any[] } = {};
  dateKeys: string[] = [];
  
  // Search and filters
  searchTerm = '';
  selectedStatus = '';
  selectedMethod = '';

  constructor(
    private supabaseService: SupabaseService,
    private notificationService: NotificationService,
    private callStateService: CallStateService
  ) {}

  ngOnInit(): void {
    this.loadScheduleData();
    
    // Check if there's an active call that needs a post-call modal
    const activeCall = this.callStateService.getActiveCall();
    if (activeCall && this.callStateService.shouldShowPostCallModal()) {
      this.selectedCall = activeCall;
      this.showPostCallModal = true;
    }
  }

  async loadScheduleData(): Promise<void> {
    try {
      this.isLoading = true;
      
      // Get all calls from Supabase
      const { data: calls, error: callsError } = await this.supabaseService.getCalls();
      
      if (callsError) {
        throw callsError;
      }
      
      // Filter for upcoming calls (status = scheduled)
      this.upcomingCalls = (calls || [])
        .filter(call => call.status === 'scheduled')
        .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
      
      // Get contacts with schedule dates
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Get contacts scheduled for today onwards
      const { data: contacts, error: contactsError } = 
        await this.supabaseService.getContactsWithScheduleForDate(dateStr);
      
      if (contactsError) {
        throw contactsError;
      }
      
      this.scheduledContacts = contacts || [];
      
      // Combine both data sources into a unified timeline
      this.combineEvents();
      
      // Apply the initial filter (default view)
      this.applyFilters();
      
    } catch (error: any) {
      this.notificationService.error('Failed to load schedule data: ' + error.message);
    } finally {
      this.isLoading = false;
    }
  }

  combineEvents(): void {
    // Clear the existing combined events
    this.combinedEvents = [];
  
    // Add upcoming calls to combined events
    for (const call of this.upcomingCalls) {
      try {
        const callDate = new Date(call.scheduled_at);
        
        // Only include calls with valid dates
        if (!isNaN(callDate.getTime())) {
          // Ensure all call data is correctly passed to the event
          this.combinedEvents.push({
            type: 'call',
            title: call.reason || 'Call',
            date: callDate,
            data: call,  // Pass the entire call object to ensure importance and is_first_call are available
            contact: call.contact
          });
        }
      } catch (e) {
        console.error('Error processing call:', e, call);
      }
    }
  
    // Sort all events by date
    this.combinedEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  applyFilters(): void {
    // Start with all combined events
    let filtered = [...this.combinedEvents];
    
    // Apply time filter
    if (this.filterView !== 'all') {
      const now = new Date();
      
      if (this.filterView === 'today') {
        filtered = filtered.filter(event => 
          event.date >= startOfToday() && event.date <= endOfToday()
        );
      } else if (this.filterView === 'tomorrow') {
        filtered = filtered.filter(event => 
          event.date >= startOfTomorrow() && event.date <= endOfTomorrow()
        );
      } else if (this.filterView === 'week') {
        filtered = filtered.filter(event => 
          event.date >= startOfWeek(now) && event.date <= endOfWeek(now)
        );
      }
    }
    
    // Apply search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(term) || 
        event.contact?.first_name?.toLowerCase().includes(term) ||
        event.contact?.last_name?.toLowerCase().includes(term) ||
        event.contact?.email?.toLowerCase().includes(term) ||
        event.contact?.company?.name?.toLowerCase().includes(term)
      );
    }
    
    // Apply status filter (only applies to calls)
    if (this.selectedStatus) {
      filtered = filtered.filter(event => 
        event.type !== 'call' || (event.data as Call).status === this.selectedStatus
      );
    }
    
    // Apply method filter (only applies to calls)
    if (this.selectedMethod) {
      filtered = filtered.filter(event => 
        event.type !== 'call' || (event.data as Call).method === this.selectedMethod
      );
    }
    
    // Group events by date
    this.groupEvents(filtered);
  }
  
  groupEvents(events: any[]): void {
    // Reset the grouping
    this.groupedEvents = {};
    
    // Group events by their date (day)
    events.forEach(event => {
      // Ensure we have a valid date before proceeding
      if (event.date instanceof Date && !isNaN(event.date.getTime())) {
        const dateKey = format(event.date, 'yyyy-MM-dd');
        
        if (!this.groupedEvents[dateKey]) {
          this.groupedEvents[dateKey] = [];
        }
        
        this.groupedEvents[dateKey].push(event);
      }
    });
    
    // Sort the keys by date
    this.dateKeys = Object.keys(this.groupedEvents).sort();
  }

  changeView(view: 'all' | 'today' | 'tomorrow' | 'week'): void {
    this.filterView = view;
    this.applyFilters();
  }

  formatEventDate(date: Date): string {
    if (isToday(date)) {
      return 'Today';
    } else if (isTomorrow(date)) {
      return 'Tomorrow';
    } else {
      return format(date, 'EEEE, MMMM d');
    }
  }

  formatEventTime(date: Date): string {
    return format(date, 'h:mm a');
  }
  
  // New method to format the short month name for date badges
  formatShortMonth(dateKey: string): string {
    return format(new Date(dateKey), 'MMM');
  }

  openCallModal(contact: Contact): void {
    this.selectedContact = contact;
    this.showCallModal = true;
  }

  closeCallModal(): void {
    this.showCallModal = false;
    this.selectedContact = null;
  }

  openPostCallModal(call: Call): void {
    this.selectedCall = call;
    this.showPostCallModal = true;
  }

  closePostCallModal(): void {
    this.showPostCallModal = false;
    this.selectedCall = null;
    this.callStateService.clearActiveCall();
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
      this.loadScheduleData(); // Refresh the data
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
      this.loadScheduleData(); // Refresh the data
    } catch (error: any) {
      this.notificationService.error('Failed to reschedule call: ' + error.message);
    } finally {
      this.closePostCallModal();
    }
  }

  handleCallSaved(): void {
    this.loadScheduleData(); // Refresh the data
    this.closeCallModal();
  }

  // Update initiateCall method with optional event parameter
  initiateCall(call: Call, event?: MouseEvent): void {
    if (!call.contact?.phone) {
      this.notificationService.warning('No phone number available for this contact');
      return;
    }
    
    // Save call state in the service before any navigation
    this.callStateService.setActiveCall(call);
    
    // Set local component state
    this.selectedCall = call;
    this.showPostCallModal = true;
    
    // If we have an event, prevent default behavior
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // For phone calls, use a different approach
    window.location.href = `tel:${call.contact.phone}`;
  }

  // Get date from key for date badge
  getDateFromKey(dateKey: string): number {
    return new Date(dateKey).getDate();
  }

  getFormattedEventDate(dateKey: string): string {
    return this.formatEventDate(new Date(dateKey));
  }

  // Helper method to safely get method from event data
  getEventMethod(event: any): string {
    return event.data?.method || '';
  }

  // Helper method to safely access notes
  getEventNotes(event: any): string {
    return event.data?.notes || '';
  }
  
  // Helper method to get importance label
  getImportanceLabel(value: number | undefined): string {
    switch(value) {
      case 1: return 'Very Low';
      case 2: return 'Low';
      case 3: return 'Medium';
      case 4: return 'High';
      case 5: return 'Critical';
      default: return 'Medium';
    }
  }
}