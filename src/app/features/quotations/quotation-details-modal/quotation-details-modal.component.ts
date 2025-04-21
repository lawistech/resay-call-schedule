// src/app/features/quotations/quotation-details-modal/quotation-details-modal.component.ts
import { Component, Input, Output, EventEmitter, OnChanges, OnInit, SimpleChanges, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Quotation } from '../../../core/models/quotation.model';
import { QuotationService } from '../services/quotation.service';
import { NotificationService } from '../../../core/services/notification.service';

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

  statuses: Array<'New' | 'In Progress' | 'Won' | 'Lost'> = ['New', 'In Progress', 'Won', 'Lost'];
  isUpdating = false;

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
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('Quotation details modal initialized');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['quotation'] && this.quotation) {
      console.log('Quotation details loaded:', this.quotation);
    }
  }

  close() {
    this.closeEvent.emit(false);
  }

  closeAllDropdowns() {
    this.showStatusDropdown = false;
  }

  toggleStatusDropdown(event: Event) {
    event.stopPropagation();
    this.showStatusDropdown = !this.showStatusDropdown;
  }

  updateStatus(status: 'New' | 'In Progress' | 'Won' | 'Lost', event: Event) {
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

  formatDate(date?: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }

  formatCurrency(amount?: number): string {
    if (amount === undefined) return '$0.00';
    return `$${amount.toFixed(2)}`;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'New':
        return 'bg-blue-100 text-blue-800';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Won':
        return 'bg-green-100 text-green-800';
      case 'Lost':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}
