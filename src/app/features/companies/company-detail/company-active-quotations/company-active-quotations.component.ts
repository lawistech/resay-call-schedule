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

  quotations: Quotation[] = [];
  filteredQuotations: Quotation[] = [];
  isLoading = true;

  // Filtering
  activeStatuses: Set<string> = new Set(['New', 'In Progress']);
  showStatusModal = false;
  selectedQuotation: Quotation | null = null;
  isUpdatingStatus = false;
  statusOptions: Array<'New' | 'In Progress' | 'Won' | 'Lost'> = ['New', 'In Progress', 'Won', 'Lost'];

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

    // Set default filter to show only New and In Progress quotations
    this.activeStatuses = new Set(['New', 'In Progress']);
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
        this.quotations = quotations;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading quotations:', error);
        this.notificationService.error('Failed to load quotations');
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    // If we have active statuses, filter by them
    if (this.activeStatuses.size > 0) {
      this.filteredQuotations = this.quotations.filter(q => this.activeStatuses.has(q.status));
    } else {
      // If no statuses are selected, show all quotations
      this.filteredQuotations = [...this.quotations];
    }
  }

  setFilter(status: 'New' | 'In Progress' | 'Won' | 'Lost' | 'all'): void {
    if (status === 'all') {
      // Show all statuses
      this.activeStatuses = new Set(['New', 'In Progress', 'Won', 'Lost']);
    } else if (this.isStatusActive(status)) {
      // If status is already active, remove it
      this.activeStatuses.delete(status);
      // If no statuses are left, add all back
      if (this.activeStatuses.size === 0) {
        this.activeStatuses = new Set(['New', 'In Progress', 'Won', 'Lost']);
      }
    } else {
      // Add the status to active statuses
      this.activeStatuses.add(status);
    }

    this.applyFilters();
  }

  // Check if a status is active
  isStatusActive(status: string): boolean {
    return this.activeStatuses.has(status);
  }

  formatDate(date?: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }

  formatDateTime(date?: string | Date): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  }

  formatCurrency(amount?: number): string {
    if (amount === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'New':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Won':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Lost':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
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

  openStatusChangeModal(quotation: Quotation, event: Event): void {
    event.stopPropagation();
    this.selectedQuotation = quotation;
    this.showStatusModal = true;
  }

  closeStatusModal(): void {
    this.showStatusModal = false;
    this.selectedQuotation = null;
  }

  updateQuotationStatus(status: 'New' | 'In Progress' | 'Won' | 'Lost'): void {
    if (!this.selectedQuotation || this.isUpdatingStatus) return;

    this.isUpdatingStatus = true;
    const updatedQuotation = { ...this.selectedQuotation, status };

    this.quotationService.updateQuotation(this.selectedQuotation.id, updatedQuotation)
      .subscribe({
        next: (updated) => {
          // Update the quotation in the local array
          const index = this.quotations.findIndex(q => q.id === updated.id);
          if (index !== -1) {
            this.quotations[index] = updated;
            this.applyFilters();
          }
          this.notificationService.success(`Quotation status updated to ${status}`);
          this.isUpdatingStatus = false;
          this.closeStatusModal();
        },
        error: (error) => {
          console.error('Error updating quotation status:', error);
          this.notificationService.error('Failed to update quotation status');
          this.isUpdatingStatus = false;
          this.closeStatusModal();
        }
      });
  }
}
