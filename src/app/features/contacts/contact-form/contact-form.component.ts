// src/app/features/contacts/contact-form/contact-form.component.ts
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Contact } from '../../../core/models/contact.model';
import { Company } from '../../../core/models/company.model';
import { SupabaseService } from '../../../core/services/supabase.service';
import { NotificationService } from '../../../core/services/notification.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CompanyService } from '../../companies/services/company.service';

@Component({
  selector: 'app-contact-form',
  templateUrl: './contact-form.component.html',
})
export class ContactFormComponent implements OnInit {
  @Input() isOpen: boolean = false;
  @Input() contact: Contact | null = null;
  @Input() isEditing: boolean = false;
  @Input() companies: Company[] = [];
  @Input() preselectedLeadSource: string = '';
  @Output() closed = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<Contact>();

  contactForm!: FormGroup;
  isLoading = false;
  showNewCompanyForm = false;
  companyForm!: FormGroup;

  // Contact search functionality
  searchResults: Contact[] = [];
  isSearching = false;
  showSearchResults = false;

  // Company search functionality
  companySearchResults: Company[] = [];
  isSearchingCompany = false;
  showCompanySearchResults = false;
  companySearchTerm = '';
  selectedCompany: Company | null = null;

  // Duplicate confirmation
  showDuplicateWarning = false;
  duplicateContacts: Contact[] = [];
  duplicateWarningMessage = '';

  // Mode detection
  isModalMode = false;

  constructor(
    private formBuilder: FormBuilder,
    private supabaseService: SupabaseService,
    private notificationService: NotificationService,
    private companyService: CompanyService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Detect if we're in modal mode or route mode
    this.isModalMode = this.router.url.includes('/contacts/add-contact') ? false : true;

    this.initContactForm();
    this.initCompanyForm();
    this.setupFormListeners();
    this.handleRouteParameters();
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

    // We're handling company search directly in the onCompanySearchChange method

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
    // Use preselected lead source if provided, otherwise use contact's lead source or empty
    const defaultLeadSource = this.preselectedLeadSource || (this.contact?.lead_source || '');

    this.contactForm = this.formBuilder.group({
      first_name: ['', [Validators.required, Validators.minLength(2)]],
      last_name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.email]],
      phone: ['', [Validators.pattern(/^[\+]?[0-9\s\-\(\)]{7,15}$/)]],
      company_id: [''],
      notes: [''],
      lead_source: [defaultLeadSource] // Use the determined default lead source
    });

    if (this.isEditing && this.contact) {
      this.contactForm.patchValue({
        first_name: this.contact.first_name,
        last_name: this.contact.last_name,
        email: this.contact.email || '',
        phone: this.contact.phone || '',
        company_id: this.contact.company_id || '',
        notes: this.contact.notes || '',
        lead_source: this.contact.lead_source || defaultLeadSource
      });

      // If the contact has a company, set the selectedCompany
      if (this.contact && this.contact.company_id) {
        const companyId = this.contact.company_id; // Store in a variable to avoid null check issues
        const company = this.companies.find(c => c.id === companyId);
        if (company) {
          this.selectedCompany = company;
        }
      }
    } else if (this.preselectedLeadSource) {
      // If we have a preselected lead source and we're not editing, show a helpful message
      console.log('Contact form initialized with preselected lead source:', this.preselectedLeadSource);

      // Add a note for SumUp leads
      if (this.preselectedLeadSource === 'sumup') {
        this.contactForm.patchValue({
          notes: 'SumUp lead created on ' + new Date().toLocaleDateString()
        });
      }
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

  handleRouteParameters(): void {
    // Check for company_id in query params (for creating from company page)
    this.route.queryParamMap.subscribe(params => {
      const companyId = params.get('company_id');
      if (companyId) {
        console.log('Contact form: Found company_id in query params:', companyId);

        // Set the company_id in the form
        this.contactForm.patchValue({ company_id: companyId });

        // Load the company details to show the selected company
        this.loadCompanyDetails(companyId);
      }
    });
  }

  loadCompanyDetails(companyId: string): void {
    this.companyService.getCompanyById(companyId).subscribe({
      next: (company) => {
        this.selectedCompany = company;
        this.companySearchTerm = company.name;
        console.log('Contact form: Loaded company details:', company.name);
        this.notificationService.info(`Creating contact for: ${company.name}`);
      },
      error: (error) => {
        console.error('Error loading company details:', error);
        this.notificationService.error('Failed to load company details');
      }
    });
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

  // Handle company search input changes
  onCompanySearchChange(value: string): void {
    this.companySearchTerm = value;
    this.selectedCompany = null; // Clear selected company when search term changes
    this.contactForm.patchValue({ company_id: '' }); // Clear the company_id in the form

    if (value && value.length > 1) {
      this.searchCompanies(value);
    } else {
      this.companySearchResults = [];
      this.showCompanySearchResults = false;
    }
  }

  // Clear company search
  clearCompanySearch(): void {
    this.companySearchTerm = '';
    this.selectedCompany = null;
    this.companySearchResults = [];
    this.showCompanySearchResults = false;
    this.contactForm.patchValue({ company_id: '' });
  }

  // Search for companies
  searchCompanies(searchTerm: string): void {
    this.isSearchingCompany = true;

    this.companyService.searchCompanies(searchTerm).subscribe({
      next: (companies) => {
        this.companySearchResults = companies;
        this.showCompanySearchResults = companies.length > 0;
        this.isSearchingCompany = false;

        // If there's an exact match, select it automatically
        const exactMatch = companies.find(c =>
          c.name.toLowerCase() === searchTerm.toLowerCase());
        if (exactMatch) {
          this.selectCompany(exactMatch);
        }
      },
      error: (error) => {
        console.error('Error searching companies:', error);
        this.isSearchingCompany = false;
      }
    });
  }

  // Select a company from search results
  selectCompany(company: Company): void {
    this.selectedCompany = company;

    // Update the form with the selected company ID
    this.contactForm.patchValue({
      company_id: company.id
    });

    // Hide search results
    this.showCompanySearchResults = false;

    // Show notification
    this.notificationService.info(`Selected company: ${company.name}`);
  }

  // Create a new company from the search term
  createNewCompany(): void {
    if (!this.companySearchTerm || this.companySearchTerm.trim().length < 2) {
      this.notificationService.error('Please enter a valid company name');
      return;
    }

    // Check if a company with this name already exists
    this.companyService.checkDuplicateCompany(this.companySearchTerm).subscribe({
      next: (companies) => {
        if (companies.length > 0) {
          // Company already exists, ask user to select it
          this.notificationService.warning(`A company named "${companies[0].name}" already exists. Please select it from the list.`);
          this.companySearchResults = companies;
          this.showCompanySearchResults = true;
        } else {
          // Create new company
          this.companyForm.patchValue({
            name: this.companySearchTerm
          });
          this.toggleNewCompanyForm();
        }
      },
      error: (error) => {
        console.error('Error checking duplicate company:', error);
        this.notificationService.error('Error checking for existing companies');
      }
    });
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

      // Handle navigation based on context
      this.handlePostSaveNavigation(formValues);
    } catch (error: any) {
      this.notificationService.error('Failed to save contact: ' + error.message);
    } finally {
      this.isLoading = false;
    }
  }

  handlePostSaveNavigation(formValues: any): void {
    // Check if we're in route mode (not modal mode)
    const isRouteMode = this.router.url.includes('/contacts/add-contact');

    if (isRouteMode) {
      // If we have a company_id, navigate back to the company details page
      if (formValues.company_id) {
        this.router.navigate(['/companies', formValues.company_id], {
          queryParams: { tab: 'people' }
        });
      } else {
        // Otherwise, navigate to the contacts list
        this.router.navigate(['/contacts']);
      }
    } else {
      // In modal mode, just close the modal
      this.close();
    }
  }

  handleCancel(): void {
    // Check if we're in route mode (not modal mode)
    const isRouteMode = this.router.url.includes('/contacts/add-contact');

    if (isRouteMode) {
      // Get the company_id from query params to navigate back
      this.route.queryParamMap.subscribe(params => {
        const companyId = params.get('company_id');
        if (companyId) {
          this.router.navigate(['/companies', companyId], {
            queryParams: { tab: 'people' }
          });
        } else {
          this.router.navigate(['/contacts']);
        }
      }).unsubscribe(); // Immediately unsubscribe since we only need it once
    } else {
      // In modal mode, just close the modal
      this.close();
    }
  }

  async saveContact(): Promise<void> {
    if (this.contactForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.contactForm.controls).forEach(key => {
        this.contactForm.get(key)?.markAsTouched();
      });

      this.notificationService.error('Please fix the validation errors before saving');
      return;
    }

    // Validate that at least email or phone is provided
    const email = this.contactForm.get('email')?.value;
    const phone = this.contactForm.get('phone')?.value;

    if (!email && !phone) {
      this.notificationService.error('Please provide at least an email or phone number');
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