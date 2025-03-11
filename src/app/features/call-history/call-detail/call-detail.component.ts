// src/app/features/call-history/call-detail/call-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { formatDistance } from 'date-fns';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { RouterModule } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Call } from '../../../core/models/call.model';

@Component({
  selector: 'app-call-detail',
  templateUrl: './call-detail.component.html',
})
export class CallDetailComponent implements OnInit {
  callId: string = '';
  call: Call | null = null;
  isLoading = true;
  showEditModal = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private supabaseService: SupabaseService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.callId = this.route.snapshot.paramMap.get('id') || '';
    if (this.callId) {
      this.loadCallData();
    } else {
      this.router.navigate(['/call-history']);
    }
  }

  async loadCallData(): Promise<void> {
    try {
      this.isLoading = true;
      
      const { data: calls, error } = await this.supabaseService.supabaseClient
        .from('calls')
        .select('*, contacts(*)')
        .eq('id', this.callId)
        .single();
      
      if (error) {
        throw error;
      }
      
      if (!calls) {
        throw new Error('Call not found');
      }
      
      this.call = calls as unknown as Call;
      
    } catch (error: any) {
      this.notificationService.error('Failed to load call: ' + error.message);
      this.router.navigate(['/call-history']);
    } finally {
      this.isLoading = false;
    }
  }

  getTimeAgo(date: string): string {
    return formatDistance(new Date(date), new Date(), { addSuffix: true });
  }

  openEditModal(): void {
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
  }

  handleCallUpdated(): void {
    this.loadCallData();
    this.showEditModal = false;
  }

  async updateCallStatus(status: string): Promise<void> {
    if (!this.callId) return;
    
    try {
      const { error } = await this.supabaseService.updateCall(this.callId, {
        status,
        completed_at: status === 'completed' ? new Date().toISOString() : undefined
      });
      
      if (error) {
        throw error;
      }
      
      this.notificationService.success(`Call marked as ${status}`);
      this.loadCallData();
    } catch (error: any) {
      this.notificationService.error('Failed to update call: ' + error.message);
    }
  }

  async deleteCall(): Promise<void> {
    if (!confirm('Are you sure you want to delete this call?')) {
      return;
    }
    
    try {
      const { error } = await this.supabaseService.deleteCall(this.callId);
      
      if (error) {
        throw error;
      }
      
      this.notificationService.success('Call deleted successfully');
      this.router.navigate(['/call-history']);
    } catch (error: any) {
      this.notificationService.error('Failed to delete call: ' + error.message);
    }
  }

  // Add this method to the component class
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
  goBack(): void {
    this.router.navigate(['/call-history']);
  }
}