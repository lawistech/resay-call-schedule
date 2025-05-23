import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { Company } from '../../../core/models/company.model';
import { Contact } from '../../../core/models/contact.model';
import { CompanyService } from '../../companies/services/company.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-lead-wizard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './lead-wizard.component.html',
  styleUrls: ['./lead-wizard.component.scss']
})
export class LeadWizardComponent implements OnInit {
  @Output() wizardComplete = new EventEmitter<{company: Company, contact: Contact}>();
  @Output() wizardCancel = new EventEmitter<void>();

  currentStep = 1;
  totalSteps = 2;

  // Step 1: Company Search/Creation
  companySearchForm!: FormGroup;
  companyForm!: FormGroup;
  isSearchingCompany = false;
  companySearchResults: Company[] = [];
  showCompanySearchResults = false;
  selectedCompany: Company | null = null;
  showNewCompanyForm = false;
  isCreatingCompany = false;

  // Step 2: Contact Creation
  contactForm!: FormGroup;
  isCreatingContact = false;

  // Source options
  sourceOptions = [
    { value: 'barcodesforbusiness', label: 'BCB' },
    { value: 'resay', label: 'Resay' },
    { value: 'androidepos', label: 'AE' },
    { value: 'sumup', label: 'Sumup' }
  ];

  constructor(
    private fb: FormBuilder,
    private companyService: CompanyService,
    private supabaseService: SupabaseService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.setupCompanySearch();
  }

  initForms(): void {
    // Company search form
    this.companySearchForm = this.fb.group({
      searchTerm: ['', [Validators.required, Validators.minLength(2)]]
    });

    // Company creation form
    this.companyForm = this.fb.group({
      name: ['', [Validators.required]],
      industry: [''],
      website: [''],
      address: [''],
      notes: [''],
      source: ['', [Validators.required]]
    });

    // Contact creation form
    this.contactForm = this.fb.group({
      first_name: ['', [Validators.required]],
      last_name: ['', [Validators.required]],
      email: ['', [Validators.email]],
      phone: [''],
      job_title: [''],
      notes: ['']
    });
  }

  setupCompanySearch(): void {
    this.companySearchForm.get('searchTerm')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(searchTerm => {
          if (searchTerm && searchTerm.length >= 2) {
            this.isSearchingCompany = true;
            return this.companyService.searchCompanies(searchTerm);
          }
          return of([]);
        })
      )
      .subscribe({
        next: (companies) => {
          this.companySearchResults = companies;
          this.showCompanySearchResults = companies.length > 0;
          this.isSearchingCompany = false;

          // If no results found, suggest creating new company
          if (companies.length === 0 && this.companySearchForm.get('searchTerm')?.value) {
            this.showNewCompanyForm = true;
            this.companyForm.patchValue({
              name: this.companySearchForm.get('searchTerm')?.value
            });
          } else {
            this.showNewCompanyForm = false;
          }
        },
        error: (error) => {
          console.error('Error searching companies:', error);
          this.isSearchingCompany = false;
          this.showCompanySearchResults = false;
        }
      });
  }

  selectExistingCompany(company: Company): void {
    this.selectedCompany = company;
    this.showCompanySearchResults = false;
    this.showNewCompanyForm = false;
    this.companySearchForm.patchValue({
      searchTerm: company.name
    });
  }

  createNewCompany(): void {
    if (this.companyForm.invalid) {
      this.markFormGroupTouched(this.companyForm);
      return;
    }

    this.isCreatingCompany = true;
    const companyData = this.companyForm.value;

    this.companyService.createCompany(companyData).subscribe({
      next: (company) => {
        this.selectedCompany = company;
        this.isCreatingCompany = false;
        this.notificationService.success('Company created successfully');
        this.nextStep();
      },
      error: (error) => {
        console.error('Error creating company:', error);
        this.isCreatingCompany = false;
        this.notificationService.error('Failed to create company');
      }
    });
  }

  nextStep(): void {
    if (this.currentStep === 1) {
      if (!this.selectedCompany) {
        this.notificationService.error('Please select or create a company first');
        return;
      }
      this.currentStep = 2;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  createContact(): void {
    if (this.contactForm.invalid) {
      this.markFormGroupTouched(this.contactForm);
      return;
    }

    if (!this.selectedCompany) {
      this.notificationService.error('No company selected');
      return;
    }

    this.isCreatingContact = true;
    const contactData = {
      ...this.contactForm.value,
      company_id: this.selectedCompany.id,
      lead_source: this.companyForm.get('source')?.value
    };

    this.supabaseService.createContact(contactData).then(response => {
      if (response.error) {
        throw response.error;
      }

      this.isCreatingContact = false;
      this.notificationService.success('Contact created successfully');
      this.wizardComplete.emit({
        company: this.selectedCompany!,
        contact: response.data[0]
      });
    }).catch((error: any) => {
      console.error('Error creating contact:', error);
      this.isCreatingContact = false;
      this.notificationService.error('Failed to create contact');
    });
  }

  cancel(): void {
    this.wizardCancel.emit();
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Helper methods for template
  isFieldInvalid(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['email']) return 'Please enter a valid email';
      if (field.errors['minlength']) return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
    }
    return '';
  }
}
