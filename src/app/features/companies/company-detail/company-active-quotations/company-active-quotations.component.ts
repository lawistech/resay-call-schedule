// src/app/features/companies/company-detail/company-active-quotations/company-active-quotations.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { QuotationService } from '../../../quotations/services/quotation.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Quotation } from '../../../../core/models/quotation.model';
import { MockQuotationService } from './mock-quotation.service';
import { catchError, of } from 'rxjs';
import { QuotationDetailsModalComponent } from '../../../quotations/quotation-details-modal/quotation-details-modal.component';
import { QuotationFormComponent } from '../../../quotations/quotation-form/quotation-form.component';
import { CompanyService } from '../../services/company.service';
import { ConfirmationDialogComponent } from '../../../../shared/confirmation-dialog/confirmation-dialog.component';

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
  activeStatuses: Set<string> = new Set(['draft', 'sent']);
  showStatusModal = false;
  selectedQuotation: Quotation | null = null;
  isUpdatingStatus = false;
  statusOptions: Array<'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'> = ['draft', 'sent', 'accepted', 'rejected', 'expired'];

  // Details modal
  showDetailsModal = false;

  // Confirmation dialog
  showConfirmationDialog = false;
  pendingStatusChange: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | null = null;

  // Quotation form modal
  showQuotationFormModal = false;
  selectedCompany: any = null;

  constructor(
    private quotationService: QuotationService,
    private mockQuotationService: MockQuotationService,
    private notificationService: NotificationService,
    private router: Router,
    private companyService: CompanyService
  ) {}

  ngOnInit(): void {
    console.log('CompanyActiveQuotationsComponent initialized with companyId:', this.companyId);
    if (this.companyId) {
      this.loadQuotations();
    } else {
      console.error('No companyId provided to CompanyActiveQuotationsComponent');
      this.isLoading = false;
    }

    // Set default filter to show only draft and sent quotations
    this.activeStatuses = new Set(['draft', 'sent']);
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

  setFilter(status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'all'): void {
    if (status === 'all') {
      // Show all statuses
      this.activeStatuses = new Set(['draft', 'sent', 'accepted', 'rejected', 'expired']);
    } else if (this.isStatusActive(status)) {
      // If status is already active, remove it
      this.activeStatuses.delete(status);
      // If no statuses are left, add all back
      if (this.activeStatuses.size === 0) {
        this.activeStatuses = new Set(['draft', 'sent', 'accepted', 'rejected', 'expired']);
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
    if (amount === undefined) return '£0.00';
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'draft':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'sent':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'expired':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  getStatusDescription(status: string): string {
    switch (status) {
      case 'draft':
        return 'Quotation is being prepared and not yet sent to client';
      case 'sent':
        return 'Quotation has been sent to client and awaiting response';
      case 'accepted':
        return 'Client has accepted the quotation';
      case 'rejected':
        return 'Client has declined the quotation';
      case 'expired':
        return 'Quotation validity period has ended';
      default:
        return '';
    }
  }

  createQuotation(): void {
    // Load company details first to pre-fill the form
    this.companyService.getCompanyById(this.companyId).subscribe({
      next: (company) => {
        this.selectedCompany = company;
        this.showQuotationFormModal = true;
      },
      error: (error) => {
        console.error('Error loading company details:', error);
        this.notificationService.error('Failed to load company details');

        // Fallback to navigation if modal approach fails
        this.router.navigate(['/quotations/new'], {
          queryParams: { company_id: this.companyId }
        });
      }
    });
  }

  viewQuotation(quotationId: string): void {
    // Show loading indicator
    this.notificationService.info('Loading quotation details...');

    // Get the full quotation details
    this.quotationService.getQuotationById(quotationId).subscribe({
      next: (quotation) => {
        this.selectedQuotation = quotation;
        this.showDetailsModal = true;
      },
      error: (error) => {
        console.error('Error loading quotation details:', error);
        this.notificationService.error('Failed to load quotation details. Please try again.');

        // Don't automatically navigate away - let the user decide what to do
        // Instead, show a more helpful error message
        setTimeout(() => {
          this.notificationService.info('You can try refreshing the page or viewing the quotation in a new tab.');
        }, 1000);
      }
    });
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedQuotation = null;
  }

  closeQuotationFormModal(): void {
    this.showQuotationFormModal = false;
    this.selectedCompany = null;
  }

  handleQuotationFormSubmitted(formData: Partial<Quotation>): void {
    // Create the quotation
    this.quotationService.createQuotation(formData).subscribe({
      next: (createdQuotation) => {
        this.notificationService.success('Quotation created successfully');
        this.closeQuotationFormModal();

        // Reload quotations to include the new one
        this.loadQuotations();
      },
      error: (error) => {
        console.error('Error creating quotation:', error);
        this.notificationService.error('Failed to create quotation');
      }
    });
  }

  handleStatusChange(updatedQuotation: Quotation): void {
    // Update the quotation in the local array
    const index = this.quotations.findIndex(q => q.id === updatedQuotation.id);
    if (index !== -1) {
      this.quotations[index] = updatedQuotation;
      this.applyFilters();
    }
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

  updateQuotationStatus(status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'): void {
    if (!this.selectedQuotation || this.isUpdatingStatus) return;

    // If status is being changed to 'accepted', show confirmation dialog
    if (status === 'accepted') {
      this.pendingStatusChange = status;
      this.showConfirmationDialog = true;
      return;
    }

    // For other statuses, proceed with the update
    this.processStatusUpdate(status);
  }

  handleConfirmation(confirmed: boolean): void {
    this.showConfirmationDialog = false;

    if (confirmed && this.pendingStatusChange) {
      this.processStatusUpdate(this.pendingStatusChange);
    }

    this.pendingStatusChange = null;
  }

  processStatusUpdate(status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'): void {
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
