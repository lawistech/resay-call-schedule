// src/app/features/quotations/quotation-form-page/quotation-form-page.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { QuotationService } from '../services/quotation.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Quotation } from '../../../core/models/quotation.model';
import { QuotationFormComponent } from '../quotation-form/quotation-form.component';

@Component({
  selector: 'app-quotation-form-page',
  standalone: true,
  imports: [
    CommonModule,
    QuotationFormComponent
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

      <div class="p-6">
        <app-quotation-form
          [quotation]="quotation"
          [isSaving]="isSaving"
          [preselectedCompanyId]="companyId"
          (close)="goBack()"
          (formSubmitted)="handleSaveQuotation($event)">
        </app-quotation-form>
      </div>
    </div>
  `,
  styles: []
})
export class QuotationFormPageComponent implements OnInit {
  quotation: Quotation | null = null;
  isLoading = false;
  isSaving = false;
  quotationId: string | null = null;
  isEditMode = false;
  companyId: string | null = null;

  constructor(
    private quotationService: QuotationService,
    private route: ActivatedRoute,
    private router: Router,
    private notificationService: NotificationService
  ) {}

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
      }
    });
  }

  loadQuotation(id: string): void {
    this.isLoading = true;
    this.quotationService.getQuotationById(id).subscribe({
      next: (quotation) => {
        this.quotation = quotation;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading quotation:', error);
        this.notificationService.error('Failed to load quotation');
        this.isLoading = false;
        this.router.navigate(['/quotations']);
      }
    });
  }

  handleSaveQuotation(quotationData: Partial<Quotation>): void {
    this.isSaving = true;

    if (this.isEditMode && this.quotationId) {
      // Update existing quotation
      this.quotationService.updateQuotation(this.quotationId, quotationData).subscribe({
        next: (updatedQuotation) => {
          this.notificationService.success('Quotation updated successfully');
          this.isSaving = false;
          this.router.navigate(['/quotations', this.quotationId]);
        },
        error: (error) => {
          console.error('Error updating quotation:', error);
          this.notificationService.error('Failed to update quotation');
          this.isSaving = false;
        }
      });
    } else {
      // Create new quotation
      this.quotationService.createQuotation(quotationData).subscribe({
        next: (newQuotation) => {
          this.notificationService.success('Quotation created successfully');
          this.isSaving = false;
          this.router.navigate(['/quotations', newQuotation.id]);
        },
        error: (error) => {
          console.error('Error creating quotation:', error);
          this.notificationService.error('Failed to create quotation');
          this.isSaving = false;
        }
      });
    }
  }

  goBack(): void {
    if (this.isEditMode && this.quotationId) {
      this.router.navigate(['/quotations', this.quotationId]);
    } else if (this.companyId) {
      this.router.navigate(['/companies', this.companyId], { queryParams: { tab: 'quotations' } });
    } else {
      this.router.navigate(['/quotations']);
    }
  }
}
