// src/app/features/contacts/contact-form/contact-form.component.ts
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Contact } from '../../../core/models/contact.model';
import { Company } from '../../../core/models/company.model';
import { SupabaseService } from '../../../core/services/supabase.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ReminderService } from '../../../core/services/reminder.service';
import { parseISO, format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

@Component({
  selector: 'app-contact-form',
  templateUrl: './contact-form.component.html',
})
export class ContactFormComponent implements OnInit {
  @Input() isOpen: boolean = false;
  @Input() contact: Contact | null = null;
  @Input() isEditing: boolean = false;
  @Input() companies: Company[] = [];
  @Output() closed = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<Contact>();

  contactForm!: FormGroup;
  isLoading = false;
  showNewCompanyForm = false;
  companyForm!: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private supabaseService: SupabaseService,
    private notificationService: NotificationService,
    private reminderService: ReminderService
  ) {}

  ngOnInit(): void {
    this.initContactForm();
    this.initCompanyForm();
  }

  initContactForm(): void {
    // Get tomorrow's date as the default, adjusted for the selected timezone
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Format the date according to the selected timezone
    const tomorrowInSelectedTimezone = this.formatDateForInput(tomorrow);

    this.contactForm = this.formBuilder.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', [Validators.email]],
      phone: [''],
      job_title: [''],
      company_id: [''],
      notes: [''],
      scheduleDate: [tomorrowInSelectedTimezone, Validators.required]
    });

    if (this.isEditing && this.contact) {
      // If editing an existing contact, format the stored schedule date according to the timezone
      const scheduleDate = this.contact.schedule 
        ? this.formatDateForInput(new Date(this.contact.schedule))
        : tomorrowInSelectedTimezone;

      this.contactForm.patchValue({
        first_name: this.contact.first_name,
        last_name: this.contact.last_name,
        email: this.contact.email || '',
        phone: this.contact.phone || '',
        job_title: this.contact.job_title || '',
        company_id: this.contact.company_id || '',
        notes: this.contact.notes || '',
        scheduleDate: scheduleDate
      });
    }
  }

  // Format date for datetime-local input in the selected timezone
  formatDateForInput(date: Date): string {
    // Get the current timezone from the reminder service
    const timezone = this.reminderService.getTimezone();
    
    // Format the date in the specified timezone - this returns a string like "2023-10-15T14:30:00"
    // which is what a datetime-local input expects
    return formatInTimeZone(date, timezone, "yyyy-MM-dd'T'HH:mm");
  }

  // Convert a local datetime input value to UTC for storage
  convertToUTC(localDateTimeString: string): string {
    // Parse the local datetime string to a Date object
    const date = new Date(localDateTimeString);
    
    // Convert to UTC ISO string
    return date.toISOString();
  }

  initCompanyForm(): void {
    this.companyForm = this.formBuilder.group({
      name: ['', Validators.required],
      website: [''],
      industry: [''],
      address: [''],
      notes: ['']
    });
  }

  toggleNewCompanyForm(): void {
    this.showNewCompanyForm = !this.showNewCompanyForm;
    if (!this.showNewCompanyForm) {
      this.companyForm.reset();
    }
  }

  async createCompany(): Promise<void> {
    if (this.companyForm.invalid) {
      return;
    }

    this.isLoading = true;

    try {
      const { data, error } = await this.supabaseService.supabaseClient
        .from('companies')
        .insert(this.companyForm.value)
        .select();

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        const newCompany = data[0] as Company;
        this.companies.push(newCompany);
        this.contactForm.patchValue({ company_id: newCompany.id });
        this.notificationService.success('Company created successfully');
        this.toggleNewCompanyForm();
      }
    } catch (error: any) {
      this.notificationService.error('Failed to create company: ' + error.message);
    } finally {
      this.isLoading = false;
    }
  }

  close(): void {
    this.isOpen = false;
    this.closed.emit(false);
  }

  async saveContact(): Promise<void> {
    if (this.contactForm.invalid) {
      return;
    }

    this.isLoading = true;

    try {
      const formValues = { ...this.contactForm.value };
      
      // Convert the scheduleDate from local timezone to UTC for storage
      formValues.schedule = this.convertToUTC(formValues.scheduleDate);
      
      // Remove the scheduleDate as it's not part of the contact model
      delete formValues.scheduleDate;

      let result: { data: any; error: any; } | null = null;

      if (this.isEditing && this.contact) {
        // Update existing contact
        result = await this.supabaseService.updateContact(this.contact.id, formValues);
      } else {
        // Create new contact
        result = await this.supabaseService.createContact(formValues);
      }

      if (result?.error) {
        throw result.error;
      }

      this.notificationService.success(
        this.isEditing ? 'Contact updated successfully' : 'Contact created successfully'
      );

      // Check if result.data exists and has at least one item before accessing the first element
      if (result?.data && Array.isArray(result.data) && result.data.length > 0) {
        this.saved.emit(result.data[0] as Contact);
      } else {
        // If no data is returned, emit the original contact for editing or the form values for creation
        const contactToEmit = this.isEditing && this.contact 
          ? { ...this.contact, ...formValues } 
          : { ...formValues, id: 'temp_id' } as Contact;
        this.saved.emit(contactToEmit);
      }
      
      this.close();
    } catch (error: any) {
      this.notificationService.error('Failed to save contact: ' + error.message);
    } finally {
      this.isLoading = false;
    }
  }
}