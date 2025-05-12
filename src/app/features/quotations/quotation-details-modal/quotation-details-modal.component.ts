// src/app/features/quotations/quotation-details-modal/quotation-details-modal.component.ts
import { Component, Input, Output, EventEmitter, OnChanges, OnInit, SimpleChanges, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Quotation, QuotationItem } from '../../../core/models/quotation.model';
import { QuotationService } from '../services/quotation.service';
import { NotificationService } from '../../../core/services/notification.service';
import { QuotationPdfService } from '../../../core/services/quotation-pdf.service';

@Component({
  selector: 'app-quotation-details-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './quotation-details-modal.component.html',
  styleUrls: ['./quotation-details-modal.component.scss']
})
export class QuotationDetailsModalComponent implements OnChanges, OnInit {
  @Input() show: boolean = false;
  @Input() quotation: Quotation | null = null;
  @Output() closeEvent = new EventEmitter<boolean>();
  @Output() statusChanged = new EventEmitter<Quotation>();

  statuses: Array<'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'> = ['draft', 'sent', 'accepted', 'rejected', 'expired'];
  isUpdating = false;

  // Product details modal
  showProductDetailsModal = false;
  selectedProduct: QuotationItem | null = null;

  // Dropdown toggles
  showStatusDropdown = false;

  // Document click handler
  @HostListener('document:click')
  onDocumentClick() {
    // Close dropdowns when clicking outside
    this.closeAllDropdowns();
  }

  constructor(
    private quotationService: QuotationService,
    private notificationService: NotificationService,
    private router: Router,
    private quotationPdfService: QuotationPdfService
  ) {}

  ngOnInit(): void {
    console.log('Quotation details modal initialized');
  }

  ngOnChanges(changes: SimpleChanges): void {
    // This method is called when input properties change
  }

  close() {
    this.closeEvent.emit(false);
  }

  closeAllDropdowns() {
    this.showStatusDropdown = false;
  }

  // Product details methods
  viewProductDetails(item: QuotationItem) {
    this.selectedProduct = item;
    this.showProductDetailsModal = true;
  }

  closeProductDetailsModal() {
    this.showProductDetailsModal = false;
    this.selectedProduct = null;
  }

  // Helper methods for template
  hasItems(): boolean {
    return !!this.quotation?.items && Array.isArray(this.quotation.items) && this.quotation.items.length > 0;
  }

  noItems(): boolean {
    return !this.hasItems();
  }

  hasTags(product: QuotationItem): boolean {
    return !!product?.product?.tags && product.product.tags.length > 0;
  }

  toggleStatusDropdown(event: Event) {
    event.stopPropagation();
    this.showStatusDropdown = !this.showStatusDropdown;
  }

  updateStatus(status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired', event: Event) {
    event.stopPropagation();
    this.showStatusDropdown = false;

    if (!this.quotation || this.quotation.status === status) {
      return;
    }

    this.isUpdating = true;
    const updatedQuotation: Partial<Quotation> = {
      ...this.quotation,
      status
    };

    this.quotationService.updateQuotation(this.quotation.id, updatedQuotation)
      .subscribe({
        next: (updated) => {
          this.quotation = updated;
          this.notificationService.success(`Quotation status updated to ${status}`);
          this.statusChanged.emit(updated);
          this.isUpdating = false;
        },
        error: (error) => {
          console.error('Error updating quotation status:', error);
          this.notificationService.error('Failed to update quotation status');
          this.isUpdating = false;
        }
      });
  }

  editQuotation() {
    if (this.quotation) {
      this.router.navigate(['/quotations', this.quotation.id, 'edit']);
      this.close();
    }
  }

  /**
   * Generate a PDF for the quotation
   */
  generatePdf() {
    if (!this.quotation) {
      this.notificationService.error('No quotation data available');
      return;
    }

    try {
      this.notificationService.info('Generating PDF...');

      // Get contact information if available
      if (this.quotation.contactId) {
        // In a real implementation, you would fetch the contact details
        // For now, we'll just pass the quotation to the PDF service
        this.quotationPdfService.generatePdf(this.quotation)
          .then(() => {
            this.notificationService.success('PDF generated successfully');
          })
          .catch(error => {
            console.error('Error generating PDF:', error);
            this.notificationService.error('Failed to generate PDF');
          });
      } else {
        // No contact associated, just generate with quotation data
        this.quotationPdfService.generatePdf(this.quotation)
          .then(() => {
            this.notificationService.success('PDF generated successfully');
          })
          .catch(error => {
            console.error('Error generating PDF:', error);
            this.notificationService.error('Failed to generate PDF');
          });
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      this.notificationService.error('Failed to generate PDF');
    }
  }

  formatDate(date?: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }

  formatCurrency(amount?: number | null): string {
    if (amount === undefined || amount === null) return '£0.00';
    return `£${amount.toFixed(2)}`;
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
}
