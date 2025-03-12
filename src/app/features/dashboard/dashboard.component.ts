// src/app/features/dashboard/dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';
import { NotificationService } from '../../core/services/notification.service';
import { Call } from '../../core/models/call.model';
import { Contact } from '../../core/models/contact.model';
import { CallStats } from '../../core/models/call-stats.model';
import { CallStateService } from '../../core/services/call-state.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'] // Add this if you decide to use SCSS styling
})
export class DashboardComponent implements OnInit {
  isLoading = true;
  calls: Call[] = [];
  scheduledContacts: Contact[] = [];
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

  constructor(
    private supabaseService: SupabaseService,
    private notificationService: NotificationService,
    private callStateService: CallStateService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
    
    // Check if there's an active call that needs a post-call modal
    const activeCall = this.callStateService.getActiveCall();
    if (activeCall && this.callStateService.shouldShowPostCallModal()) {
      this.selectedCall = activeCall;
      this.showPostCallModal = true;
    }
  }


  // Modify the initiateCall method
  initiateCall(call: Call): void {
    this.notificationService.info('Initiating call... (Demo feature)');
    
    // In a real implementation, this would use a native dialer or VoIP service
    if (call.contact?.phone) {
      if (call.method === 'webex') {
        window.open('https://web.webex.com', '_blank');
      } else if (call.method === 'teams') {
        window.open('https://teams.microsoft.com', '_blank');
      } else if (call.method === 'zoom') {
        window.open('https://zoom.us/start', '_blank');
      } else {
        window.location.href = `tel:${call.contact.phone}`;
      }
      
      // After initiating the call, open the post-call modal
      this.selectedCall = call;
      this.showPostCallModal = true;
    } else {
      this.notificationService.warning('No phone number available for this contact');
    }
  }

  // Add these methods to handle the post-call modal
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
      
      // Load scheduled contacts for today and upcoming days
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0]; // Get YYYY-MM-DD format
      
      const { data: contacts, error: contactsError } = 
        await this.supabaseService.getContactsWithScheduleForDate(dateStr);
      
      if (contactsError) {
        throw contactsError;
      }
      
      this.scheduledContacts = contacts || [];
      
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

  // Added helper method to safely get the count of scheduled calls
  getScheduledCallsCount(): number {
    if (!this.calls) return 0;
    return this.calls.filter(call => call.status === 'scheduled').length;
  }

  markCallAsCompleted(callId: string): void {
    // Find the call index
    const callIndex = this.calls.findIndex(call => call.id === callId);
    
    if (callIndex === -1) {
      return;
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
    this.loadDashboardData(); // Refresh data
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
}