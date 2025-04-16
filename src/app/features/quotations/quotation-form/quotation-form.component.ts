// src/app/features/quotations/quotation-form/quotation-form.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { QuotationService } from '../services/quotation.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Quotation } from '../../../core/models/quotation.model';
import { CompanyService } from '../../companies/services/company.service';
import { Observable, Subscription, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-quotation-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="container mx-auto px-4 py-6">
      <div class="flex justify-between items-center mb-6">
        <div class="flex items-center">
          <button (click)="goBack()" class="mr-4 text-gray-600 hover:text-gray-900">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 class="text-2xl font-bold text-gray-800">{{ isEditMode ? 'Edit Quotation' : 'Create Quotation' }}</h1>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-md p-6">
        <!-- Loading State -->
        <div *ngIf="isLoading" class="flex justify-center items-center py-12">
          <svg class="animate-spin h-8 w-8 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>

        <!-- Quotation Form -->
        <form *ngIf="!isLoading" [formGroup]="quotationForm" (ngSubmit)="onSubmit()" class="space-y-6">
          <!-- Title -->
          <div>
            <label for="title" class="block text-sm font-medium text-gray-700">Quotation Title</label>
            <input type="text" id="title" formControlName="title"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
            <p *ngIf="quotationForm.get('title')?.invalid && quotationForm.get('title')?.touched"
              class="mt-1 text-sm text-red-600">Title is required</p>
          </div>

          <!-- Company -->
          <div>
            <label for="companyId" class="block text-sm font-medium text-gray-700">Company</label>
            <select id="companyId" formControlName="companyId"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              [attr.disabled]="companyId ? true : null">
              <option value="" disabled>Select a company</option>
              <option *ngFor="let company of companies" [value]="company.id">{{ company.name }}</option>
            </select>
            <p *ngIf="quotationForm.get('companyId')?.invalid && quotationForm.get('companyId')?.touched"
              class="mt-1 text-sm text-red-600">Company is required</p>
          </div>

          <!-- Contact -->
          <div>
            <label for="contactId" class="block text-sm font-medium text-gray-700">Contact (Optional)</label>
            <select id="contactId" formControlName="contactId"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
              <option value="">None</option>
              <option *ngFor="let contact of contacts" [value]="contact.id">{{ contact.first_name }} {{ contact.last_name }}</option>
            </select>
          </div>

          <!-- Status -->
          <div>
            <label for="status" class="block text-sm font-medium text-gray-700">Status</label>
            <select id="status" formControlName="status"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <!-- Valid Until -->
          <div>
            <label for="validUntil" class="block text-sm font-medium text-gray-700">Valid Until (Optional)</label>
            <input type="date" id="validUntil" formControlName="validUntil"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
          </div>

          <!-- Total Amount -->
          <div>
            <label for="total" class="block text-sm font-medium text-gray-700">Total Amount</label>
            <div class="mt-1 relative rounded-md shadow-sm">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span class="text-gray-500 sm:text-sm">$</span>
              </div>
              <input type="number" id="total" formControlName="total" min="0" step="0.01"
                class="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
            </div>
          </div>

          <!-- Notes -->
          <div>
            <label for="notes" class="block text-sm font-medium text-gray-700">Notes (Optional)</label>
            <textarea id="notes" formControlName="notes" rows="4"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"></textarea>
          </div>

          <!-- Form Actions -->
          <div class="flex justify-end space-x-3">
            <button type="button" (click)="goBack()" class="btn-secondary">
              Cancel
            </button>
            <button type="submit" [disabled]="quotationForm.invalid || isSubmitting" class="btn-primary">
              <span *ngIf="isSubmitting" class="inline-block mr-2">
                <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
              {{ isEditMode ? 'Update' : 'Create' }} Quotation
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: []
})
export class QuotationFormComponent implements OnInit, OnDestroy {
  quotationForm!: FormGroup;
  isLoading = false;
  isSubmitting = false;
  quotationId: string | null = null;
  isEditMode = false;
  companyId: string | null = null;

  // Data for dropdowns
  companies: {id: string, name: string}[] = [];
  contacts: {id: string, first_name: string, last_name: string}[] = [];

  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private quotationService: QuotationService,
    private companyService: CompanyService,
    private route: ActivatedRoute,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.quotationForm = this.fb.group({
      title: ['', Validators.required],
      companyId: ['', Validators.required],
      contactId: [''],
      status: ['draft', Validators.required],
      validUntil: [''],
      total: [0, [Validators.required, Validators.min(0)]],
      notes: ['']
    });
  }

  ngOnInit(): void {
    // Load companies for dropdown
    this.loadCompanies();
    // Check if we're in edit mode
    this.route.paramMap.subscribe(params => {
      this.quotationId = params.get('id');
      this.isEditMode = !!this.quotationId;

      if (this.isEditMode && this.quotationId) {
        this.loadQuotation(this.quotationId);
      }
    });

    // Check for company_id in query params (for creating from company page)
    this.route.queryParamMap.subscribe(params => {
      const companyId = params.get('company_id');
      if (companyId) {
        this.companyId = companyId;
        this.quotationForm.patchValue({ companyId });

        // Load contacts for this company
        this.loadContacts(companyId);
      }
    });
  }

  loadQuotation(id: string): void {
    this.isLoading = true;
    this.quotationService.getQuotationById(id).subscribe({
      next: (quotation) => {
        this.patchFormWithQuotation(quotation);
        this.isLoading = false;
      },
      error: (error) => {
        this.notificationService.error('Failed to load quotation');
        this.isLoading = false;
        this.router.navigate(['/quotations']);
      }
    });
  }

  loadCompanies(): void {
    const subscription = this.companyService.getCompanies()
      .pipe(
        catchError(error => {
          console.error('Error loading companies:', error);
          this.notificationService.error('Failed to load companies');
          return of([]);
        })
      )
      .subscribe(companies => {
        this.companies = companies;
      });

    this.subscriptions.push(subscription);
  }

  loadContacts(companyId: string): void {
    const subscription = this.companyService.getCompanyContacts(companyId)
      .pipe(
        catchError(error => {
          console.error('Error loading contacts:', error);
          this.notificationService.error('Failed to load contacts');
          return of([]);
        })
      )
      .subscribe(contacts => {
        this.contacts = contacts;
      });

    this.subscriptions.push(subscription);
  }

  patchFormWithQuotation(quotation: Quotation): void {
    this.quotationForm.patchValue({
      title: quotation.title,
      companyId: quotation.companyId,
      contactId: quotation.contactId,
      status: quotation.status,
      validUntil: quotation.validUntil ? new Date(quotation.validUntil).toISOString().split('T')[0] : '',
      total: quotation.total,
      notes: quotation.notes
    });
  }

  onSubmit(): void {
    if (this.quotationForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.quotationForm.controls).forEach(key => {
        const control = this.quotationForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;

    // Get form values and prepare data for submission
    const formValues = this.quotationForm.value;

    // Create a clean data object for submission
    const formData: Partial<Quotation> = {
      title: formValues.title,
      companyId: formValues.companyId,
      status: formValues.status || 'draft',
      total: parseFloat(formValues.total) || 0
    };

    // Only add optional fields if they have values
    if (formValues.contactId) {
      formData.contactId = formValues.contactId;
    }

    if (formValues.notes) {
      formData.notes = formValues.notes;
    }

    // Handle the date field properly
    if (formValues.validUntil) {
      // Convert to ISO string for database
      formData.validUntil = new Date(formValues.validUntil).toISOString();
    }

    if (this.isEditMode && this.quotationId) {
      // Update existing quotation
      this.quotationService.updateQuotation(this.quotationId, formData).subscribe({
        next: () => {
          this.notificationService.success('Quotation updated successfully');
          this.router.navigate(['/quotations', this.quotationId]);
          this.isSubmitting = false;
        },
        error: (error) => {
          this.notificationService.error('Failed to update quotation');
          this.isSubmitting = false;
        }
      });
    } else {
      // Create new quotation
      this.quotationService.createQuotation(formData).subscribe({
        next: (quotation) => {
          this.notificationService.success('Quotation created successfully');
          this.router.navigate(['/quotations', quotation.id]);
          this.isSubmitting = false;
        },
        error: (error) => {
          this.notificationService.error('Failed to create quotation');
          this.isSubmitting = false;
        }
      });
    }
  }

  goBack(): void {
    if (this.isEditMode && this.quotationId) {
      this.router.navigate(['/quotations', this.quotationId]);
    } else if (this.companyId) {
      this.router.navigate(['/companies', this.companyId], { queryParams: { tab: 'opportunities' } });
    } else {
      this.router.navigate(['/quotations']);
    }
  }

  ngOnDestroy(): void {
    // Clean up subscriptions to prevent memory leaks
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
