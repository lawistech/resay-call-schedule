// src/app/features/call-history/call-detail/call-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { formatDistance } from 'date-fns';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'; 
import { RouterModule } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Call } from '../../../core/models/call.model';

@Component({
  selector: 'app-call-detail',
  templateUrl: './call-detail.component.html',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  standalone: true
})
export class CallDetailComponent implements OnInit {
  callId: string = '';
  call: Call | null = null;
  isLoading = true;
  showEditDetailsModal = false;
  isSaving = false;
  editCallForm!: FormGroup;
  
  // Call methods for the dropdown
  callMethods = [
    { value: 'phone', label: 'Phone' },
    { value: 'webex', label: 'Webex' },
    { value: 'teams', label: 'Microsoft Teams' },
    { value: 'zoom', label: 'Zoom' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private supabaseService: SupabaseService,
    private notificationService: NotificationService,
    private formBuilder: FormBuilder
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
      this.initEditForm();
      
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

  // Initialize the form with call data
  initEditForm(): void {
    if (!this.call) return;

    // Format dates for the form
    const scheduledAt = this.call.scheduled_at 
      ? new Date(this.call.scheduled_at).toISOString().slice(0, 16)
      : '';
    
    const followUpDate = this.call.follow_up_date 
      ? new Date(this.call.follow_up_date).toISOString().slice(0, 16)
      : '';

    this.editCallForm = this.formBuilder.group({
      scheduled_at: [scheduledAt, Validators.required],
      method: [this.call.method || 'phone', Validators.required],
      reason: [this.call.reason, Validators.required],
      notes: [this.call.notes || ''],
      importance: [this.call.importance || 3],
      lead_source: [this.call.lead_source || ''],
      follow_up_date: [followUpDate],
      duration_minutes: [this.call.duration_minutes || 0]
    });
  }

  // Set importance level
  setImportance(value: number): void {
    this.editCallForm.get('importance')?.setValue(value);
  }

  // Open the custom edit modal
  openEditDetails(): void {
    if (!this.call) return;
    this.showEditDetailsModal = true;
    this.initEditForm(); // Reset form with current call data
  }

  // Close the custom edit modal
  closeEditDetailsModal(): void {
    this.showEditDetailsModal = false;
  }

  // Save the edited call details
  async saveCallDetails(): Promise<void> {
    if (this.editCallForm.invalid || !this.call) {
      return;
    }

    this.isSaving = true;
    
    try {
      const formValues = { ...this.editCallForm.value };
      
      // Handle empty date fields - convert empty strings to null
      if (formValues.scheduled_at === '') {
        formValues.scheduled_at = null;
      }
      
      if (formValues.follow_up_date === '') {
        formValues.follow_up_date = null;
      }
      
      // Handle duration_minutes - convert empty or 0 to null if needed
      if (formValues.duration_minutes === '' || formValues.duration_minutes === 0) {
        formValues.duration_minutes = null;
      }
      
      const { error } = await this.supabaseService.updateCall(this.callId, formValues);
      
      if (error) {
        throw error;
      }
      
      this.notificationService.success('Call updated successfully');
      this.loadCallData();
      this.closeEditDetailsModal();
    } catch (error: any) {
      this.notificationService.error('Failed to update call: ' + error.message);
    } finally {
      this.isSaving = false;
    }
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