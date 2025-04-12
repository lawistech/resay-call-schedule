// src/app/features/quotations/quotation-form/quotation-form.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { QuotationService } from '../services/quotation.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Quotation } from '../../../core/models/quotation.model';

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
        <p class="text-center text-gray-600 my-8">
          Quotation form is under development. This feature will be available soon.
        </p>
        <div class="flex justify-center">
          <button (click)="goBack()" class="btn-secondary">
            Go Back
          </button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class QuotationFormComponent implements OnInit {
  quotationForm!: FormGroup;
  isLoading = false;
  isSubmitting = false;
  quotationId: string | null = null;
  isEditMode = false;
  companyId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private quotationService: QuotationService,
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
      notes: ['']
    });
  }

  ngOnInit(): void {
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

  patchFormWithQuotation(quotation: Quotation): void {
    this.quotationForm.patchValue({
      title: quotation.title,
      companyId: quotation.companyId,
      contactId: quotation.contactId,
      status: quotation.status,
      validUntil: quotation.validUntil ? new Date(quotation.validUntil).toISOString().split('T')[0] : '',
      notes: quotation.notes
    });
  }

  onSubmit(): void {
    if (this.quotationForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    const formData = this.quotationForm.value;

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
}
