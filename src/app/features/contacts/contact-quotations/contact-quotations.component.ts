// src/app/features/contacts/contact-quotations/contact-quotations.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { QuotationService } from '../../quotations/services/quotation.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Quotation } from '../../../core/models/quotation.model';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-contact-quotations',
  templateUrl: './contact-quotations.component.html',
  styleUrls: ['./contact-quotations.component.css']
})
export class ContactQuotationsComponent implements OnInit {
  @Input() contactId: string = '';
  
  quotations: Quotation[] = [];
  filteredQuotations: Quotation[] = [];
  isLoading = false;
  selectedQuotation: Quotation | null = null;
  showDetailsModal = false;

  // Filter properties
  statusFilter: string = 'all';
  searchTerm: string = '';

  constructor(
    private quotationService: QuotationService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.contactId) {
      this.loadQuotations();
    }
  }

  loadQuotations(): void {
    this.isLoading = true;
    console.log('Loading quotations for contact:', this.contactId);

    this.quotationService.getQuotationsByContact(this.contactId)
      .pipe(
        catchError(error => {
          console.warn('Error loading quotations from service:', error);
          return of([]);
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
    let filtered = [...this.quotations];

    // Apply status filter
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(q => q.status === this.statusFilter);
    }

    // Apply search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(q =>
        q.title.toLowerCase().includes(term) ||
        q.company?.name.toLowerCase().includes(term) ||
        q.notes?.toLowerCase().includes(term)
      );
    }

    this.filteredQuotations = filtered;
  }

  onStatusFilterChange(): void {
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
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
      }
    });
  }

  editQuotation(quotationId: string): void {
    this.router.navigate(['/quotations', quotationId, 'edit']);
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedQuotation = null;
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-GB');
  }
}
