// src/app/features/call-history/call-list/call-list.component.ts
import { Component, OnInit } from '@angular/core';
import { formatDistance } from 'date-fns';
import { SupabaseService } from '../../../core/services/supabase.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Call } from '../../../core/models/call.model';

@Component({
  selector: 'app-call-list',
  templateUrl: './call-list.component.html',
 // styleUrls: ['./call-list.component.css']
})
export class CallListComponent implements OnInit {
  calls: Call[] = [];
  filteredCalls: Call[] = [];
  isLoading = true;
  
  // Filters
  searchTerm = '';
  selectedStatus = '';
  selectedMethod = '';
  dateRange = {
    start: '',
    end: ''
  };
  
  // Call modal state
  showCallModal = false;
  selectedCall: Call | null = null;
  isEditingCall = false;

  constructor(
    private supabaseService: SupabaseService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadCalls();
  }

  async loadCalls(): Promise<void> {
    try {
      this.isLoading = true;
      
      const { data, error } = await this.supabaseService.getCalls();
      
      if (error) {
        throw error;
      }
      
      this.calls = data || [];
      this.applyFilters();
      
    } catch (error: any) {
      this.notificationService.error('Failed to load calls: ' + error.message);
    } finally {
      this.isLoading = false;
    }
  }

  applyFilters(): void {
    this.filteredCalls = this.calls.filter(call => {
      // Search term filter
      const searchMatch = this.searchTerm === '' || 
        (call.contact && 
          (`${call.contact.first_name} ${call.contact.last_name}`.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
           (call.contact.email && call.contact.email.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
           (call.contact.phone && call.contact.phone.includes(this.searchTerm)))) ||
        call.reason.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (call.notes && call.notes.toLowerCase().includes(this.searchTerm.toLowerCase()));
      
      // Status filter
      const statusMatch = this.selectedStatus === '' || call.status === this.selectedStatus;
      
      // Method filter
      const methodMatch = this.selectedMethod === '' || call.method === this.selectedMethod;
      
      // Date range filter
      let dateMatch = true;
      if (this.dateRange.start) {
        const startDate = new Date(this.dateRange.start);
        const callDate = new Date(call.scheduled_at);
        dateMatch = dateMatch && callDate >= startDate;
      }
      if (this.dateRange.end) {
        const endDate = new Date(this.dateRange.end);
        const callDate = new Date(call.scheduled_at);
        dateMatch = dateMatch && callDate <= endDate;
      }
      
      return searchMatch && statusMatch && methodMatch && dateMatch;
    });
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.selectedMethod = '';
    this.dateRange = {
      start: '',
      end: ''
    };
    this.applyFilters();
  }

  getTimeAgo(date: string): string {
    return formatDistance(new Date(date), new Date(), { addSuffix: true });
  }

  openEditCallModal(call: Call): void {
    this.selectedCall = call;
    this.isEditingCall = true;
    this.showCallModal = true;
  }

  closeCallModal(): void {
    this.showCallModal = false;
    this.selectedCall = null;
    this.isEditingCall = false;
  }

  handleCallSaved(): void {
    this.loadCalls();
    this.closeCallModal();
  }

  async updateCallStatus(callId: string, status: string): Promise<void> {
    try {
      const { error } = await this.supabaseService.updateCall(callId, {
        status,
        completed_at: status === 'completed' ? new Date().toISOString() : undefined
      });
      
      if (error) {
        throw error;
      }
      
      this.notificationService.success(`Call marked as ${status}`);
      this.loadCalls();
    } catch (error: any) {
      this.notificationService.error('Failed to update call: ' + error.message);
    }
  }

  async deleteCall(callId: string): Promise<void> {
    if (!confirm('Are you sure you want to delete this call?')) {
      return;
    }
    
    try {
      const { error } = await this.supabaseService.deleteCall(callId);
      
      if (error) {
        throw error;
      }
      
      this.notificationService.success('Call deleted successfully');
      this.loadCalls();
    } catch (error: any) {
      this.notificationService.error('Failed to delete call: ' + error.message);
    }
  }
}