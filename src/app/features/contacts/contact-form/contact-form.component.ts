// src/app/features/contacts/contact-form/contact-form.component.ts
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Contact } from '../../../core/models/contact.model';
import { Company } from '../../../core/models/company.model';
import { SupabaseService } from '../../../core/services/supabase.service';
import { NotificationService } from '../../../core/services/notification.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

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

  // Search functionality
  searchResults: Contact[] = [];
  isSearching = false;
  showSearchResults = false;

  // Duplicate confirmation
  showDuplicateWarning = false;
  duplicateContacts: Contact[] = [];
  duplicateWarningMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private supabaseService: SupabaseService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initContactForm();
    this.initCompanyForm();
    this.setupFormListeners();
  }

  setupFormListeners(): void {
    // Listen for changes to the name fields to search for existing contacts
    const nameControl = this.contactForm.get('first_name');
    if (nameControl) {
      nameControl.valueChanges
        .pipe(
          debounceTime(300),
          distinctUntilChanged()
        )
        .subscribe(value => {
          if (value && value.length > 2) {
            this.searchContacts(value);
          } else {
            this.searchResults = [];
            this.showSearchResults = false;
          }
        });
    }

    // Also listen for changes to the phone and email fields to check for duplicates
    const phoneControl = this.contactForm.get('phone');
    const emailControl = this.contactForm.get('email');

    if (phoneControl) {
      phoneControl.valueChanges
        .pipe(
          debounceTime(300),
          distinctUntilChanged()
        )
        .subscribe(value => {
          if (value && value.length > 5) {
            this.checkForDuplicatePhone(value);
          }
        });
    }

    if (emailControl) {
      emailControl.valueChanges
        .pipe(
          debounceTime(300),
          distinctUntilChanged()
        )
        .subscribe(value => {
          if (value && value.includes('@')) {
            this.checkForDuplicateEmail(value);
          }
        });
    }
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

  // Search for contacts by name
  async searchContacts(searchTerm: string): Promise<void> {
    if (this.isEditing) return; // Don't search when editing

    this.isSearching = true;

    try {
      const { data, error } = await this.supabaseService.searchContacts(searchTerm);

      if (error) throw error;

      if (data && data.length > 0) {
        this.searchResults = data;
        this.showSearchResults = true;
      } else {
        this.searchResults = [];
        this.showSearchResults = false;
      }
    } catch (error: any) {
      console.error('Error searching contacts:', error);
    } finally {
      this.isSearching = false;
    }
  }

  // Check for duplicate phone
  async checkForDuplicatePhone(phone: string): Promise<void> {
    if (this.isEditing) return; // Don't check when editing
    if (!phone || phone.length < 5) return;

    try {
      const { data, error } = await this.supabaseService.checkDuplicateContact(phone, '');

      if (error) throw error;

      if (data && data.length > 0) {
        console.log('Found duplicate phone:', data);
        // Store for later validation during form submission
        this.duplicateContacts = data;
      }
    } catch (error: any) {
      console.error('Error checking duplicate phone:', error);
    }
  }

  // Check for duplicate email
  async checkForDuplicateEmail(email: string): Promise<void> {
    if (this.isEditing) return; // Don't check when editing
    if (!email || !email.includes('@')) return;

    try {
      const { data, error } = await this.supabaseService.checkDuplicateContact('', email);

      if (error) throw error;

      if (data && data.length > 0) {
        console.log('Found duplicate email:', data);
        // Store for later validation during form submission
        this.duplicateContacts = data;
      }
    } catch (error: any) {
      console.error('Error checking duplicate email:', error);
    }
  }

  // Select a contact from search results
  selectContact(contact: Contact): void {
    // Fill the form with the selected contact's data
    this.contactForm.patchValue({
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email || '',
      phone: contact.phone || '',
      company_id: contact.company_id || '',
      notes: contact.notes || '',
      lead_source: contact.lead_source || ''
    });

    // Hide search results
    this.showSearchResults = false;

    // Show notification
    this.notificationService.info(`Selected existing contact: ${contact.first_name} ${contact.last_name}`);
  }

  // Handle duplicate confirmation
  confirmDuplicate(confirmed: boolean): void {
    this.showDuplicateWarning = false;

    if (confirmed) {
      // User confirmed to save despite duplicate
      this.saveContactToDatabase();
    }
  }

  // Check for duplicates before saving
  async checkForDuplicatesBeforeSaving(): Promise<boolean> {
    const formValues = this.contactForm.value;

    if (!formValues.phone && !formValues.email) {
      return true; // No phone or email to check
    }

    try {
      const { data, error } = await this.supabaseService.checkDuplicateContact(
        formValues.phone || '',
        formValues.email || ''
      );

      if (error) throw error;

      if (data && data.length > 0) {
        // Filter out the current contact if editing
        const duplicates = this.isEditing && this.contact
          ? data.filter(c => c.id !== this.contact?.id)
          : data;

        if (duplicates.length > 0) {
          this.duplicateContacts = duplicates;
          const contactNames = duplicates.map(c => `${c.first_name} ${c.last_name}`).join(', ');
          this.duplicateWarningMessage = `Found existing contact(s) with the same phone or email: ${contactNames}. Do you still want to save this contact?`;
          this.showDuplicateWarning = true;
          return false; // Don't proceed with saving
        }
      }

      return true; // No duplicates found, proceed with saving
    } catch (error: any) {
      console.error('Error checking duplicates:', error);
      return true; // Proceed with saving in case of error
    }
  }

  // Save contact to database
  async saveContactToDatabase(): Promise<void> {
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

  async saveContact(): Promise<void> {
    if (this.contactForm.invalid) {
      return;
    }

    // Check for duplicates first
    const canProceed = await this.checkForDuplicatesBeforeSaving();
    if (!canProceed) {
      return; // Stop if duplicates found and waiting for user confirmation
    }

    // If no duplicates or user confirmed, proceed with saving
    await this.saveContactToDatabase();
  }
}