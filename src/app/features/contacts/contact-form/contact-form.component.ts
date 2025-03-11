// src/app/features/contacts/contact-form/contact-form.component.ts
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Contact } from '../../../core/models/contact.model';
import { Company } from '../../../core/models/company.model';
import { SupabaseService } from '../../../core/services/supabase.service';
import { NotificationService } from '../../../core/services/notification.service';

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
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initContactForm();
    this.initCompanyForm();
  }

  initContactForm(): void {
    this.contactForm = this.formBuilder.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', [Validators.email]],
      phone: [''],
      company_id: [''],
      notes: [''],
      lead_source: [''] // New field for lead source
    });

    if (this.isEditing && this.contact) {
      this.contactForm.patchValue({
        first_name: this.contact.first_name,
        last_name: this.contact.last_name,
        email: this.contact.email || '',
        phone: this.contact.phone || '',
        company_id: this.contact.company_id || '',
        notes: this.contact.notes || '',
        lead_source: this.contact.lead_source || ''
      });
    }
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