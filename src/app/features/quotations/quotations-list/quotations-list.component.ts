// src/app/features/quotations/quotations-list/quotations-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { QuotationService } from '../services/quotation.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Quotation } from '../../../core/models/quotation.model';
import { QuotationFormComponent } from '../quotation-form/quotation-form.component';
import { QuotationDetailsModalComponent } from '../quotation-details-modal/quotation-details-modal.component';

@Component({
  selector: 'app-quotations-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    QuotationFormComponent,
    QuotationDetailsModalComponent
  ],
  templateUrl: './quotations-list.component.html',
  styleUrls: ['./quotations-list.component.scss']
})
export class QuotationsListComponent implements OnInit {
  quotations: Quotation[] = [];
  filteredQuotations: Quotation[] = [];
  isLoading = true;

  // Filtering
  searchTerm = '';
  activeStatuses: Set<string> = new Set(['draft', 'sent']);

  // View mode
  viewMode: 'grid' | 'table' = 'grid';

  // Modal state
  showQuotationForm = false;
  showDetailsModal = false;
  selectedQuotation: Quotation | null = null;
  isSaving = false;

  constructor(
    private quotationService: QuotationService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadQuotations();
  }

  loadQuotations(): void {
    this.isLoading = true;
    this.quotationService.getQuotations().subscribe({
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
    let filtered = this.quotations;

    // Apply search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(quotation =>
        (quotation.title?.toLowerCase() || '').includes(term) ||
        (quotation.notes?.toLowerCase() || '').includes(term)
      );
    }

    // Apply status filter
    if (this.activeStatuses.size > 0) {
      filtered = filtered.filter(quotation => this.activeStatuses.has(quotation.status));
    }

    this.filteredQuotations = filtered;
  }

  toggleStatus(status: string): void {
    if (this.activeStatuses.has(status)) {
      this.activeStatuses.delete(status);
    } else {
      this.activeStatuses.add(status);
    }
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.activeStatuses = new Set(['draft', 'sent']);
    this.applyFilters();
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'grid' ? 'table' : 'grid';
  }

  createQuotation(): void {
    this.selectedQuotation = null;
    this.showQuotationForm = true;
  }

  editQuotation(quotation: Quotation, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.router.navigate(['/quotations', quotation.id, 'edit']);
  }

  viewQuotation(quotation: Quotation): void {
    this.selectedQuotation = quotation;
    this.showDetailsModal = true;
  }

  closeQuotationForm(): void {
    this.showQuotationForm = false;
    this.selectedQuotation = null;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedQuotation = null;
  }

  handleSaveQuotation(quotationData: Partial<Quotation>): void {
    this.isSaving = true;

    if (quotationData.id) {
      // Update existing quotation
      this.quotationService.updateQuotation(quotationData.id, quotationData).subscribe({
        next: (updatedQuotation) => {
          // Update local array
          const index = this.quotations.findIndex(q => q.id === updatedQuotation.id);
          if (index !== -1) {
            this.quotations[index] = updatedQuotation;
            this.applyFilters();
            this.notificationService.success('Quotation updated successfully');
          }
          this.isSaving = false;
          this.closeQuotationForm();
        },
        error: (err) => {
          console.error('Error updating quotation:', err);
          this.notificationService.error('Failed to update quotation');
          this.isSaving = false;
        }
      });
    } else {
      // Create new quotation
      this.quotationService.createQuotation(quotationData).subscribe({
        next: (newQuotation) => {
          this.quotations.unshift(newQuotation); // Add to beginning of array
          this.applyFilters();
          this.notificationService.success('Quotation created successfully');
          this.isSaving = false;
          this.closeQuotationForm();
        },
        error: (err) => {
          console.error('Error creating quotation:', err);
          this.notificationService.error('Failed to create quotation');
          this.isSaving = false;
        }
      });
    }
  }

  handleStatusChange(quotation: Quotation): void {
    // Update the quotation in the local array
    const index = this.quotations.findIndex(q => q.id === quotation.id);
    if (index !== -1) {
      this.quotations[index] = quotation;
      this.applyFilters();
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'draft':
        return 'bg-blue-100 text-blue-800';
      case 'sent':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(date?: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }

  formatCurrency(amount?: number): string {
    if (amount === undefined) return '£0.00';
    return `£${amount.toFixed(2)}`;
  }
}
