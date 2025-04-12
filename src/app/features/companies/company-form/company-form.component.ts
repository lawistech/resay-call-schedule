// src/app/features/companies/company-form/company-form.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CompanyService } from '../services/company.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Company } from '../../../core/models/company.model';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-company-form',
  templateUrl: './company-form.component.html',
  styleUrls: ['./company-form.component.scss']
})
export class CompanyFormComponent implements OnInit {
  companyForm!: FormGroup;
  isLoading = false;
  isSubmitting = false;
  companyId: string | null = null;
  isEditMode = false;

  // Search functionality
  searchResults: Company[] = [];
  isSearching = false;
  showSearchResults = false;

  // Duplicate confirmation
  showDuplicateWarning = false;
  duplicateCompanies: Company[] = [];
  duplicateWarningMessage = '';

  // Industry options
  industries = [
    'Technology',
    'Healthcare',
    'Finance',
    'Education',
    'Manufacturing',
    'Retail',
    'Hospitality',
    'Construction',
    'Transportation',
    'Energy',
    'Agriculture',
    'Entertainment',
    'Other'
  ];

  constructor(
    private formBuilder: FormBuilder,
    private companyService: CompanyService,
    private route: ActivatedRoute,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.companyId = this.route.snapshot.paramMap.get('id');

    if (this.companyId) {
      this.isEditMode = true;
      this.loadCompany(this.companyId);
    }

    this.setupFormListeners();
  }

  setupFormListeners(): void {
    // Listen for changes to the name field to search for existing companies
    const nameControl = this.companyForm.get('name');
    if (nameControl) {
      nameControl.valueChanges
        .pipe(
          debounceTime(300),
          distinctUntilChanged()
        )
        .subscribe(value => {
          if (value && value.length > 2 && !this.isEditMode) {
            this.searchCompanies(value);
            this.checkForDuplicateCompany(value);
          } else {
            this.searchResults = [];
            this.showSearchResults = false;
          }
        });
    }
  }

  initForm(): void {
    this.companyForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      industry: [''],
      website: [''],
      address: [''],
      notes: ['']
    });
  }

  loadCompany(id: string): void {
    this.isLoading = true;
    this.companyService.getCompanyById(id).subscribe({
      next: (company) => {
        this.companyForm.patchValue({
          name: company.name,
          industry: company.industry,
          website: company.website,
          address: company.address,
          notes: company.notes
        });
        this.isLoading = false;
      },
      error: (error) => {
        this.notificationService.error('Failed to load company details');
        this.isLoading = false;
      }
    });
  }

  // Search for companies by name
  searchCompanies(searchTerm: string): void {
    if (this.isEditMode) return; // Don't search when editing

    this.isSearching = true;

    this.companyService.searchCompanies(searchTerm).subscribe({
      next: (companies) => {
        this.searchResults = companies;
        this.showSearchResults = companies.length > 0;
        this.isSearching = false;
      },
      error: (error) => {
        console.error('Error searching companies:', error);
        this.isSearching = false;
      }
    });
  }

  // Check for duplicate company by name
  checkForDuplicateCompany(name: string): void {
    if (this.isEditMode) return; // Don't check when editing

    this.companyService.checkDuplicateCompany(name).subscribe({
      next: (companies) => {
        this.duplicateCompanies = companies;
        // We don't show the warning yet, only when submitting
      },
      error: (error) => {
        console.error('Error checking duplicate company:', error);
      }
    });
  }

  // Select a company from search results
  selectCompany(company: Company): void {
    // Fill the form with the selected company's data
    this.companyForm.patchValue({
      name: company.name,
      industry: company.industry || '',
      website: company.website || '',
      address: company.address || '',
      notes: company.notes || ''
    });

    // Hide search results
    this.showSearchResults = false;

    // Show notification
    this.notificationService.info(`Selected existing company: ${company.name}`);

    // Navigate to the company detail page
    this.router.navigate(['/companies', company.id]);
  }

  // Handle duplicate confirmation
  confirmDuplicate(confirmed: boolean): void {
    this.showDuplicateWarning = false;

    if (confirmed) {
      // User confirmed to save despite duplicate
      this.saveCompany();
    }
  }

  // Check for duplicates before saving
  checkForDuplicatesBeforeSaving(): boolean {
    const companyName = this.companyForm.value.name;

    if (this.duplicateCompanies.length > 0) {
      // Filter out the current company if editing
      const duplicates = this.isEditMode && this.companyId
        ? this.duplicateCompanies.filter(c => c.id !== this.companyId)
        : this.duplicateCompanies;

      if (duplicates.length > 0) {
        const companyNames = duplicates.map(c => c.name).join(', ');
        this.duplicateWarningMessage = `Found existing company/companies with a similar name: ${companyNames}. Do you still want to save this company?`;
        this.showDuplicateWarning = true;
        return false; // Don't proceed with saving
      }
    }

    return true; // No duplicates found, proceed with saving
  }

  // Save company to database
  saveCompany(): void {
    this.isSubmitting = true;

    const companyData = this.companyForm.value;

    if (this.isEditMode && this.companyId) {
      this.companyService.updateCompany(this.companyId, companyData).subscribe({
        next: (company) => {
          this.notificationService.success('Company updated successfully');
          this.router.navigate(['/companies', company.id]);
          this.isSubmitting = false;
        },
        error: (error) => {
          this.notificationService.error('Failed to update company');
          this.isSubmitting = false;
        }
      });
    } else {
      this.companyService.createCompany(companyData).subscribe({
        next: (company) => {
          this.notificationService.success('Company created successfully');
          this.router.navigate(['/companies', company.id]);
          this.isSubmitting = false;
        },
        error: (error) => {
          this.notificationService.error('Failed to create company');
          this.isSubmitting = false;
        }
      });
    }
  }

  onSubmit(): void {
    if (this.companyForm.invalid) {
      this.markFormGroupTouched(this.companyForm);
      return;
    }

    // Check for duplicates first
    if (!this.checkForDuplicatesBeforeSaving()) {
      return; // Stop if duplicates found and waiting for user confirmation
    }

    // If no duplicates or user confirmed, proceed with saving
    this.saveCompany();
  }

  cancel(): void {
    if (this.isEditMode && this.companyId) {
      this.router.navigate(['/companies', this.companyId]);
    } else {
      this.router.navigate(['/companies']);
    }
  }

  // Helper method to mark all form controls as touched
  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
