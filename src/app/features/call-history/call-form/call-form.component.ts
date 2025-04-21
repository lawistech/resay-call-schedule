// src/app/features/call-history/call-form/call-form.component.ts
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Call } from '../../../core/models/call.model';
import { Contact } from '../../../core/models/contact.model';
import { SupabaseService } from '../../../core/services/supabase.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ReminderService } from '../../../core/services/reminder.service';
import { CompanyRefreshService } from '../../../features/companies/services/company-refresh.service';
import { formatInTimeZone } from 'date-fns-tz';

@Component({
  selector: 'app-call-form',
  templateUrl: './call-form.component.html'
})
export class CallFormComponent implements OnInit {
  @Input() call: Call | null = null;
  @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<Call>();

  callForm!: FormGroup;
  contacts: Contact[] = [];
  isLoading = false;
  callMethods = [
    { value: 'webex', label: 'Webex' },
    { value: 'phone', label: 'Phone' },
    { value: 'teams', label: 'Microsoft Teams' },
    { value: 'zoom', label: 'Zoom' },
    { value: 'other', label: 'Other' }
  ];
  callStatuses = [
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'completed', label: 'Completed' },
    { value: 'missed', label: 'Missed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private supabaseService: SupabaseService,
    private notificationService: NotificationService,
    private reminderService: ReminderService,
    private companyRefreshService: CompanyRefreshService
  ) {}

  ngOnInit(): void {
    this.loadContacts();
    this.initForm();
  }

  async loadContacts(): Promise<void> {
    try {
      const { data, error } = await this.supabaseService.getContacts();

      if (error) {
        throw error;
      }

      this.contacts = data || [];
    } catch (error: any) {
      this.notificationService.error('Failed to load contacts: ' + error.message);
    }
  }

  // Format date for datetime-local input in the selected timezone
  formatDateForInput(date: Date): string {
    // Get the current timezone from the reminder service
    const timezone = this.reminderService.getTimezone();

    // Format the date in the specified timezone
    return formatInTimeZone(date, timezone, "yyyy-MM-dd'T'HH:mm");
  }

  // Convert a local datetime input value to UTC for storage
  convertToUTC(localDateTimeString: string): string {
    if (!localDateTimeString) return '';

    // Parse the local datetime string to a Date object
    const date = new Date(localDateTimeString);

    // Convert to UTC ISO string
    return date.toISOString();
  }

  initForm(): void {
    this.callForm = this.formBuilder.group({
      contact_id: ['', Validators.required],
      scheduled_at: [this.formatDateForInput(new Date()), Validators.required],
      method: ['phone', Validators.required],
      status: ['scheduled', Validators.required],
      reason: ['', Validators.required],
      notes: [''],
      duration_minutes: [0],
      completed_at: [''],
      follow_up_date: [''],
      recording_url: ['']
    });

    if (this.call) {
      // Format dates for datetime-local inputs using the timezone
      const scheduledAt = this.call.scheduled_at
        ? this.formatDateForInput(new Date(this.call.scheduled_at))
        : '';

      const completedAt = this.call.completed_at
        ? this.formatDateForInput(new Date(this.call.completed_at))
        : '';

      const followUpDate = this.call.follow_up_date
        ? this.formatDateForInput(new Date(this.call.follow_up_date))
        : '';

      this.callForm.patchValue({
        contact_id: this.call.contact_id,
        scheduled_at: scheduledAt,
        method: this.call.method || 'phone',
        status: this.call.status,
        reason: this.call.reason,
        notes: this.call.notes || '',
        duration_minutes: this.call.duration_minutes || 0,
        completed_at: completedAt,
        follow_up_date: followUpDate,
        recording_url: this.call.recording_url || ''
      });

      // If call has a contact, make sure it's in the contacts list
      if (this.call.contact && !this.contacts.some(c => c.id === this.call!.contact_id)) {
        this.contacts.push(this.call.contact);
      }
    }

    // Watch status changes to handle completed_at field
    this.callForm.get('status')?.valueChanges.subscribe(status => {
      if (status === 'completed' && !this.callForm.get('completed_at')?.value) {
        this.callForm.patchValue({
          completed_at: this.formatDateForInput(new Date())
        });
      }
    });
  }

  close(): void {
    this.closed.emit();
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
      let savedCall: Call;

      if (result.data && Array.isArray(result.data) && result.data.length > 0) {
        savedCall = result.data[0];
        this.saved.emit(savedCall);
      } else {
        // If no data returned, emit the original call or create a basic response
        savedCall = this.call || {
          id: 'temp-id',
          contact_id: formValues.contact_id,
          status: formValues.status,
          reason: formValues.reason,
          scheduled_at: formValues.scheduled_at
        } as Call;
        this.saved.emit(savedCall);
      }

      // Notify the company refresh service if this is a scheduled call
      if (savedCall.status === 'scheduled') {
        // Find the contact to get the company_id
        const contact = this.contacts.find(c => c.id === savedCall.contact_id);

        if (contact && contact.company_id) {
          console.log('Call form notifying company refresh service for company ID:', contact.company_id);
          // Make sure to notify the company refresh service
          setTimeout(() => {
            this.companyRefreshService.notifyCallScheduled(contact.company_id!);
          }, 0);
        } else {
          console.error('Cannot notify company refresh service: contact or company_id is missing', contact);
        }
      }

      this.close();
    } catch (error: any) {
      this.notificationService.error('Failed to save call: ' + error.message);
    } finally {
      this.isLoading = false;
    }
  }

  // Helper method to get contact name by ID for display
  getContactName(contactId: string): string {
    const contact = this.contacts.find(c => c.id === contactId);
    return contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown Contact';
  }
}