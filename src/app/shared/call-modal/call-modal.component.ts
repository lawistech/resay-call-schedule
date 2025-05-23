// src/app/shared/call-modal/call-modal.component.ts

import { Component, OnInit, OnChanges, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Contact } from '../../core/models/contact.model';
import { Call } from '../../core/models/call.model';
import { SupabaseService } from '../../core/services/supabase.service';
import { NotificationService } from '../../core/services/notification.service';
import { CompanyRefreshService } from '../../features/companies/services/company-refresh.service';

@Component({
  selector: 'app-call-modal',
  templateUrl: './call-modal.component.html'
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
    { value: 'webex', label: 'Webex' },
    { value: 'phone', label: 'Phone' },
    { value: 'teams', label: 'Microsoft Teams' },
    { value: 'zoom', label: 'Zoom' }
  ];

  minDate: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private supabaseService: SupabaseService,
    private notificationService: NotificationService,
    private companyRefreshService: CompanyRefreshService
  ) {}

  ngOnInit(): void {
    console.log('CallModalComponent initialized, isOpen:', this.isOpen);
    console.log('Contact:', this.contact);

    // Set minDate to current date/time for the datetime-local input
    const now = new Date();
    this.minDate = now.toISOString().slice(0, 16);

    this.initForm();
  }

  ngOnChanges(): void {
    console.log('CallModalComponent changes detected, isOpen:', this.isOpen);
    console.log('Contact:', this.contact);

    if (this.isOpen && this.contact) {
      this.initForm();
    }
  }

  initForm(): void {
    // Set default lead source based on contact
    let defaultLeadSource = this.contact?.lead_source || '';

    // For SumUp leads, ensure the lead source is set
    if (this.contact && this.contact.lead_source === 'sumup') {
      defaultLeadSource = 'sumup';
      console.log('Initializing form for SumUp lead');
    }

    // Set default values specific to SumUp leads
    let defaultImportance = 3; // Medium importance by default
    let defaultReason = '';

    // For SumUp leads, set higher importance and default reason
    if (defaultLeadSource === 'sumup') {
      defaultImportance = 4; // Higher importance for SumUp leads
      defaultReason = 'SumUp Lead Follow-up';
    }

    this.callForm = this.formBuilder.group({
      contact_id: [this.contact?.id || '', Validators.required],
      scheduled_at: [this.minDate, Validators.required],
      method: ['phone', Validators.required],
      reason: [defaultReason, Validators.required],
      notes: [''],
      importance: [defaultImportance],
      lead_source: [defaultLeadSource],
      follow_up_date: ['']
    });

    if (this.isEditing && this.call) {
      // Format dates for the form
      const scheduledAt = this.call.scheduled_at
        ? new Date(this.call.scheduled_at).toISOString().slice(0, 16)
        : '';

      const followUpDate = this.call.follow_up_date
        ? new Date(this.call.follow_up_date).toISOString().slice(0, 16)
        : '';

      this.callForm.patchValue({
        scheduled_at: scheduledAt,
        method: this.call.method || 'phone',
        reason: this.call.reason,
        notes: this.call.notes || '',
        importance: this.call.importance || 3,
        lead_source: this.call.lead_source || '',
        follow_up_date: followUpDate
      });
    }
  }

  close(): void {
    this.isOpen = false;
    this.closed.emit(false);
  }

  async saveCall(): Promise<void> {
    if (this.callForm.invalid) {
      return;
    }

    // Check if we have a valid contact ID
    if (this.contact && !this.contact.id) {
      this.notificationService.warning('Please select a contact before scheduling a call');
      return;
    }

    this.isLoading = true;

    try {
      const formValues = { ...this.callForm.value };

      // Always set the status to scheduled for new calls
      if (!this.isEditing) {
        formValues.status = 'scheduled';
      }

      // Set contact_id if we have a contact
      if (this.contact && !formValues.contact_id) {
        formValues.contact_id = this.contact.id;
      }

      // Ensure lead_source is set for SumUp leads
      if (this.contact && this.contact.lead_source === 'sumup') {
        formValues.lead_source = 'sumup';

        // For SumUp leads, ensure we have a reason if not provided
        if (!formValues.reason || formValues.reason.trim() === '') {
          formValues.reason = 'SumUp Lead Follow-up';
        }

        // For SumUp leads, set a higher importance if not already set
        if (!formValues.importance || formValues.importance < 3) {
          formValues.importance = 4;
        }

        console.log('Saving SumUp lead');
      }

      // Check if this is the first call for the contact
      const isFirstCall = await this.checkIsFirstCall(formValues.contact_id);
      formValues.is_first_call = isFirstCall;

      let result;

      if (this.isEditing && this.call) {
        // Update existing call
        result = await this.supabaseService.updateCall(this.call.id, formValues);
      } else {
        // Create new call
        result = await this.supabaseService.createCall(formValues);
      }

      if (result.error) {
        throw result.error;
      }

      // Show appropriate success message based on lead source
      if (formValues.lead_source === 'sumup') {
        this.notificationService.success(
          this.isEditing ? 'SumUp lead updated successfully' : 'SumUp lead added successfully'
        );
      } else {
        this.notificationService.success(
          this.isEditing ? 'Call updated successfully' : 'Call scheduled successfully'
        );
      }

      // Check if data exists and has at least one element before accessing it
      if (result.data && Array.isArray(result.data) && result.data.length > 0) {
        const savedCall = result.data[0];
        this.saved.emit(savedCall);

        // Notify that a call has been scheduled for this company
        if (this.contact && this.contact.company_id) {
          console.log('Notifying company refresh service for company ID:', this.contact.company_id);
          // Make sure to notify the company refresh service
          setTimeout(() => {
            this.companyRefreshService.notifyCallScheduled(this.contact!.company_id!);
          }, 0);
        } else {
          console.error('Cannot notify company refresh service: contact or company_id is missing', this.contact);
        }
      } else {
        // If no data returned, emit a basic response
        const basicCall = {
          id: this.call?.id || 'temp-id',
          contact_id: formValues.contact_id,
          status: 'scheduled',
          reason: formValues.reason,
          scheduled_at: formValues.scheduled_at,
          method: formValues.method
        } as Call;

        this.saved.emit(basicCall);

        // Notify that a call has been scheduled for this company
        if (this.contact && this.contact.company_id) {
          console.log('Notifying company refresh service for company ID:', this.contact.company_id);
          // Make sure to notify the company refresh service
          setTimeout(() => {
            this.companyRefreshService.notifyCallScheduled(this.contact!.company_id!);
          }, 0);
        } else {
          console.error('Cannot notify company refresh service: contact or company_id is missing', this.contact);
        }
      }

      this.close();
    } catch (error: any) {
      this.notificationService.error('Failed to schedule call: ' + error.message);
    } finally {
      this.isLoading = false;
    }
  }

  async checkIsFirstCall(contactId: string): Promise<boolean> {
    try {
      // Only check if this is a new call (not editing)
      if (this.isEditing) return false;

      const { data, error } = await this.supabaseService.supabaseClient
        .from('calls')
        .select('id')
        .eq('contact_id', contactId)
        .limit(1);

      if (error) {
        console.error('Error checking first call status:', error);
        return false;
      }

      // If no calls found, it's the first call
      return !data || data.length === 0;
    } catch (error) {
      console.error('Error checking first call status:', error);
      return false;
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