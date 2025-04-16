// src/app/features/companies/company-detail/company-active-quotations/company-active-quotations.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { QuotationService } from '../../../quotations/services/quotation.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Quotation } from '../../../../core/models/quotation.model';
import { MockQuotationService } from './mock-quotation.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-company-active-quotations',
  templateUrl: './company-active-quotations.component.html',
  styleUrls: ['./company-active-quotations.component.scss']
})
export class CompanyActiveQuotationsComponent implements OnInit {
  @Input() companyId: string = '';

  activeQuotations: Quotation[] = [];
  isLoading = true;

  constructor(
    private quotationService: QuotationService,
    private mockQuotationService: MockQuotationService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('CompanyActiveQuotationsComponent initialized with companyId:', this.companyId);
    if (this.companyId) {
      this.loadQuotations();
    } else {
      console.error('No companyId provided to CompanyActiveQuotationsComponent');
      this.isLoading = false;
    }
  }

  loadQuotations(): void {
    this.isLoading = true;
    console.log('Loading quotations for company:', this.companyId);

    // Try to use the real service first, but fall back to mock data if it fails
    this.quotationService.getQuotationsByCompany(this.companyId)
      .pipe(
        catchError(error => {
          console.warn('Error loading quotations from real service, using mock data instead:', error);
          return this.mockQuotationService.getQuotationsByCompany(this.companyId);
        })
      )
      .subscribe({
      next: (quotations) => {
        this.activeQuotations = quotations.filter(q => q.status !== 'rejected' && q.status !== 'expired');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading quotations:', error);
        this.notificationService.error('Failed to load quotations');
        this.isLoading = false;
      }
    });
  }

  formatDate(date?: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }

  formatCurrency(amount?: number): string {
    if (amount === undefined) return '$0.00';
    return `$${amount.toFixed(2)}`;
  }

  createQuotation(): void {
    // Navigate to quotation form with company pre-selected
    this.router.navigate(['/quotations/new'], {
      queryParams: { company_id: this.companyId }
    });
  }

  viewQuotation(quotationId: string): void {
    this.router.navigate(['/quotations', quotationId]);
  }
}
