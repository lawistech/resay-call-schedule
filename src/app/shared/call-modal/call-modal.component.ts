import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Contact } from '../../core/models/contact.model';
import { Call } from '../../core/models/call.model';
import { SupabaseService } from '../../core/services/supabase.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-call-modal',
  templateUrl: './call-modal.component.html',
  // styleUrls: ['./call-modal.component.css']
})
export class CallModalComponent implements OnInit {
  @Input() isOpen: boolean = false;
  @Input() contact: Contact | null = null;
  @Input() call: Call | null = null;
  @Input() isEditing: boolean = false;
  @Output() closed = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<Call>();

  callForm!: FormGroup;
  isLoading = false;
  callMethods = [
    { value: 'webex', label: 'Open Webex' },
    { value: 'phone', label: 'Phone Dialer' },
    { value: 'teams', label: 'Microsoft Teams' },
    { value: 'zoom', label: 'Zoom Call' }
  ];

  minDate: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private supabaseService: SupabaseService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Set minDate to the current date and time in the required format
    const currentDate = new Date();
    this.minDate = currentDate.toISOString().slice(0, 16); // This ensures it includes both date and time in ISO format (YYYY-MM-DDTHH:mm)
    this.initForm();
  }
  

  initForm(): void {
    this.callForm = this.formBuilder.group({
      scheduled_at: [this.minDate, Validators.required], // Default to the current date and time
      reason: ['', Validators.required],
      method: ['webex', Validators.required],
      notes: [''],
      // Add lead source field with default from contact if available
      lead_source: [this.contact?.lead_source || '', Validators.required],
      follow_up_date: [''],
      importance: [3] // Default to medium importance (3)
    });
  
    if (this.isEditing && this.call) {
      // Format the date for the datetime-local input
      const scheduledAt = this.call.scheduled_at 
        ? new Date(this.call.scheduled_at).toISOString().slice(0, 16) 
        : '';
      
      const followUpDate = this.call.follow_up_date 
        ? new Date(this.call.follow_up_date).toISOString().slice(0, 16) 
        : '';
  
      this.callForm.patchValue({
        scheduled_at: scheduledAt,
        reason: this.call.reason,
        method: this.call.method || 'phone',
        notes: this.call.notes || '',
        lead_source: this.call.lead_source || this.contact?.lead_source || '',
        follow_up_date: followUpDate,
        importance: this.call.importance || 3 // Use existing importance or default to 3
      });
    }
  }

  close(): void {
    this.isOpen = false;
    this.closed.emit(false);
  }

  async checkIsFirstCall(contactId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseService.supabaseClient
        .from('calls')
        .select('id')
        .eq('contact_id', contactId)
        .limit(1);
        
      if (error) {
        throw error;
      }
      
      // If no calls found for this contact, it's the first call
      return !data || data.length === 0;
    } catch (error) {
      console.error('Error checking if first call:', error);
      return false; // Default to false if there's an error
    }
  }

  
  async saveCall(): Promise<void> {
    if (this.callForm.invalid) {
      return;
    }

    if (!this.contact) {
      this.notificationService.error('Contact information is missing');
      return;
    }

    this.isLoading = true;
    
    try {
      const formValues = this.callForm.value;
      let scheduledAt = formValues.scheduled_at;
      let followUpDate = formValues.follow_up_date || null;
      const isFirstCall = await this.checkIsFirstCall(this.contact.id);
      
      console.log("find first call");
      console.log(isFirstCall);
      const callData = {
        contact_id: this.contact.id,
        scheduled_at: scheduledAt,
        reason: formValues.reason,
        method: formValues.method,
        notes: formValues.notes,
        lead_source: formValues.lead_source,
        follow_up_date: followUpDate,
        status: 'scheduled',
        importance: formValues.importance,
        is_first_call: isFirstCall
      };

      let result: { data: any; error: any; } | null = null;
      
      if (this.isEditing && this.call) {
        // Update existing call
        result = await this.supabaseService.updateCall(this.call.id, callData);
      } else {
        // Create new call
        result = await this.supabaseService.createCall(callData);
      }

      if (result?.error) {
        throw new Error(result.error.message);
      }

      this.notificationService.success(
        this.isEditing ? 'Call updated successfully' : 'Call scheduled successfully'
      );
      
      // Check if result.data exists and has at least one item before accessing it
      if (result?.data && Array.isArray(result.data) && result.data.length > 0) {
        this.saved.emit(result.data[0] as Call);
      } else {
        // If no data is returned, emit a constructed call object
        const callToEmit = this.isEditing && this.call
          ? { ...this.call, ...callData }
          : { ...callData, id: 'temp_id' } as Call;
        this.saved.emit(callToEmit);
      }
      
      this.close();
    } catch (error: any) {
      this.notificationService.error('Failed to save call: ' + error.message);
    } finally {
      this.isLoading = false;
    }
  }

  startCall(): void {
    const method = this.callForm.get('method')?.value;
    
    switch (method) {
      case 'webex':
        // Logic to open Webex
        window.open('https://web.webex.com', '_blank');
        break;
      case 'teams':
        // Logic to open Microsoft Teams
        window.open('https://teams.microsoft.com', '_blank');
        break;
      case 'zoom':
        // Logic to open Zoom
        window.open('https://zoom.us/start', '_blank');
        break;
      default:
        // Default to phone dialer
        if (this.contact?.phone) {
          window.location.href = `tel:${this.contact.phone}`;
        } else {
          this.notificationService.warning('No phone number available for this contact');
        }
    }
  }

  setImportance(value: number): void {
    this.callForm.patchValue({ importance: value });
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
}