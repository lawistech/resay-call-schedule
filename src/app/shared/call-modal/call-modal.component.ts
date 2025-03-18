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
  isFirstCall: boolean = false;
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
    this.setIsFirstCall()
  }

    async setIsFirstCall() {
    this.isFirstCall =  await this.checkIsFirstCall(this.contact!.id);
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
      // Only proceed if we have a valid contact ID
      if (!contactId) return false;
      
      const { data, error } = await this.supabaseService.supabaseClient
        .from('calls')
        .select('id')
        .eq('contact_id', contactId)
        .limit(1);
        
      if (error) {
        console.error('Error checking first call status:', error);
        return false;
      }
      
      // If no calls are found for this contact, it's the first call
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
  
    this.isLoading = true;
    
    try {
      const formValues = { ...this.callForm.value };
      
      // Convert date inputs from local timezone to UTC for storage
      if (formValues.scheduled_at) {
        formValues.scheduled_at = this.convertToUTC(formValues.scheduled_at);
      }
      
      if (formValues.completed_at) {
        formValues.completed_at = this.convertToUTC(formValues.completed_at);
      }
      
      if (formValues.follow_up_date) {
        formValues.follow_up_date = this.convertToUTC(formValues.follow_up_date);
      }
      
      // Get current user ID from auth service
      const currentUser = await this.supabaseService.supabaseClient.auth.getUser();
      if (currentUser.data && currentUser.data.user) {
        // Add user_id to ensure call is owned by current user
        formValues.user_id = currentUser.data.user.id;
      }
      
      let result;
      
      if (this.call) {
        // Update existing call
        result = await this.supabaseService.updateCall(this.call.id, formValues);
      } else {
        // Create new call
        result = await this.supabaseService.createCall(formValues);
      }
  
      if (result.error) {
        throw result.error;
      }
  
      this.notificationService.success(
        this.call ? 'Call updated successfully' : 'Call created successfully'
      );
      
      // Check if data exists and has at least one element before accessing it
      if (result.data && Array.isArray(result.data) && result.data.length > 0) {
        this.saved.emit(result.data[0]);
      } else {
        // If no data returned, emit the original call or create a basic response
        this.saved.emit(this.call || { 
          id: 'temp-id', 
          contact_id: formValues.contact_id,
          user_id: formValues.user_id,
          status: formValues.status,
          reason: formValues.reason,
          scheduled_at: formValues.scheduled_at
        } as Call);
      }
  
      this.close();
    } catch (error: any) {
      this.notificationService.error('Failed to save call: ' + error.message);
    } finally {
      this.isLoading = false;
    }
  }
  
  // Convert a local datetime input value to UTC for storage
  convertToUTC(localDateTimeString: string): string {
    if (!localDateTimeString) return '';
    
    // Parse the local datetime string to a Date object
    const date = new Date(localDateTimeString);
    
    // Convert to UTC ISO string
    return date.toISOString();
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