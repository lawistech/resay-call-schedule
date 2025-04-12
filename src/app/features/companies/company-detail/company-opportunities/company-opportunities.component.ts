// src/app/features/companies/company-detail/company-opportunities/company-opportunities.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CompanyService } from '../../services/company.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Opportunity, ProductInterest } from '../../../../core/models/company.model';
import { Router } from '@angular/router';
import { ProductCatalogService } from '../../../ecommerce/services/product-catalog.service';
import { ProductCatalog } from '../../../ecommerce/models/product-catalog.model';
import { ProductAttachmentService, ProductAttachment } from '../../../ecommerce/services/product-attachment.service';
import { QuotationService } from '../../../quotations/services/quotation.service';
import { Quotation } from '../../../../core/models/quotation.model';
import { OpportunitiesService } from '../../../opportunities/opportunities.service';

@Component({
  selector: 'app-company-opportunities',
  templateUrl: './company-opportunities.component.html',
  styleUrls: ['./company-opportunities.component.scss']
})
export class CompanyOpportunitiesComponent implements OnInit {
  @Input() companyId: string = '';

  opportunities: Opportunity[] = [];
  isLoading = true;

  // For filtering
  filterStatus: 'all' | 'New' | 'In Progress' | 'Won' | 'Lost' = 'all';

  // Product interests
  productInterests: ProductInterest[] = [];

  // Products from catalog
  products: ProductCatalog[] = [];

  // Product attachments (for quotations)
  productAttachments: ProductAttachment[] = [];

  // Active quotations
  activeQuotations: Quotation[] = [];
  isLoadingQuotations = false;

  // Order history
  orderHistory: any[] = [];
  isLoadingOrders = false;

  // For opportunity status change
  showStatusModal = false;
  selectedOpportunity: Opportunity | null = null;
  isUpdatingStatus = false;
  statusOptions: Array<'New' | 'In Progress' | 'Won' | 'Lost'> = ['New', 'In Progress', 'Won', 'Lost'];

  constructor(
    private companyService: CompanyService,
    private notificationService: NotificationService,
    private router: Router,
    private productCatalogService: ProductCatalogService,
    private productAttachmentService: ProductAttachmentService,
    private quotationService: QuotationService,
    private opportunitiesService: OpportunitiesService
  ) {}

  ngOnInit(): void {
    this.loadOpportunities();
    this.loadProductInterests();
    this.loadProducts();
    this.loadQuotations();
    this.loadOrders();
  }

  loadOpportunities(): void {
    this.isLoading = true;
    this.companyService.getCompanyOpportunities(this.companyId).subscribe({
      next: (opportunities) => {
        this.opportunities = opportunities;
        this.isLoading = false;
      },
      error: (error) => {
        this.notificationService.error('Failed to load opportunities');
        this.isLoading = false;
      }
    });
  }

  loadProductInterests(): void {
    // In a real implementation, this would fetch from a database
    // For now, we'll create some data based on the company ID
    this.productInterests = [
      {
        id: '1',
        companyId: this.companyId,
        productId: 'prod-1',
        lastViewed: new Date().toISOString(),
        notes: 'Customer showed interest in our premium plan',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        companyId: this.companyId,
        productId: 'prod-2',
        lastViewed: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        notes: 'Requested a demo of the enterprise solution',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString()
      }
    ];
  }

  loadProducts(): void {
    this.productCatalogService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.notificationService.error('Failed to load products');
      }
    });
  }

  loadQuotations(): void {
    this.isLoadingQuotations = true;
    this.quotationService.getQuotationsByCompany(this.companyId).subscribe({
      next: (quotations) => {
        this.activeQuotations = quotations.filter(q => q.status !== 'rejected' && q.status !== 'expired');
        this.isLoadingQuotations = false;
      },
      error: (error) => {
        console.error('Error loading quotations:', error);
        this.notificationService.error('Failed to load quotations');
        this.isLoadingQuotations = false;
      }
    });
  }

  loadOrders(): void {
    this.isLoadingOrders = true;
    // In a real implementation, this would fetch from a database
    // For now, we'll set an empty array
    this.orderHistory = [];
    this.isLoadingOrders = false;
  }

  filterOpportunities(): Opportunity[] {
    if (this.filterStatus === 'all') {
      return this.opportunities;
    }
    return this.opportunities.filter(opp => opp.status === this.filterStatus);
  }

  setFilter(status: 'all' | 'New' | 'In Progress' | 'Won' | 'Lost'): void {
    this.filterStatus = status;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'New':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'In Progress':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Won':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Lost':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }

  formatCurrency(amount: number | undefined): string {
    if (amount === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }

  createOpportunity(): void {
    // Navigate to opportunity form with company pre-selected
    this.router.navigate(['/opportunities/new'], {
      queryParams: { company_id: this.companyId }
    });
  }

  viewOpportunity(id: string): void {
    this.router.navigate(['/opportunities', id]);
  }

  openStatusChangeModal(opportunity: Opportunity): void {
    this.selectedOpportunity = opportunity;
    this.showStatusModal = true;
  }

  closeStatusModal(): void {
    this.showStatusModal = false;
    this.selectedOpportunity = null;
  }

  updateOpportunityStatus(status: 'New' | 'In Progress' | 'Won' | 'Lost'): void {
    if (!this.selectedOpportunity || this.isUpdatingStatus) return;

    this.isUpdatingStatus = true;
    const updatedOpportunity = { ...this.selectedOpportunity, status };

    // If status is Won and stage is not Closed-Won, update stage too
    if (status === 'Won' && updatedOpportunity.stage !== 'Closed-Won') {
      updatedOpportunity.stage = 'Closed-Won';
      updatedOpportunity.probability = 100;
    }

    // If status is Lost, set probability to 0
    if (status === 'Lost') {
      updatedOpportunity.probability = 0;
    }

    this.opportunitiesService.updateOpportunity(this.selectedOpportunity.id, updatedOpportunity)
      .subscribe({
        next: (updated) => {
          // Update the opportunity in the local array
          const index = this.opportunities.findIndex(o => o.id === updated.id);
          if (index !== -1) {
            this.opportunities[index] = updated;
          }
          this.notificationService.success(`Opportunity status updated to ${status}`);
          this.isUpdatingStatus = false;
          this.closeStatusModal();
        },
        error: (error) => {
          console.error('Error updating opportunity status:', error);
          this.notificationService.error('Failed to update opportunity status');
          this.isUpdatingStatus = false;
        }
      });
  }

  // Get product name from the products array
  getProductName(productId: string): string {
    // First check if it's in our loaded products
    const product = this.products.find(p => p.id === productId);
    if (product) {
      return product.name;
    }

    // Fallback for mock data
    const mockProducts: {[key: string]: string} = {
      'prod-1': 'Premium CRM Package',
      'prod-2': 'Enterprise Solution'
    };
    return mockProducts[productId] || 'Unknown Product';
  }

  createQuotation(): void {
    // Navigate to quotation form with company pre-selected
    this.router.navigate(['/quotations/new'], {
      queryParams: { company_id: this.companyId }
    });
  }
}
