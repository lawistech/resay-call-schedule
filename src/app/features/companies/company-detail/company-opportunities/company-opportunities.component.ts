// src/app/features/companies/company-detail/company-opportunities/company-opportunities.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CompanyService } from '../../services/company.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Opportunity, ProductInterest } from '../../../../core/models/company.model';
import { Router } from '@angular/router';

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
  
  // Mock product interests (would come from a real API in production)
  productInterests: ProductInterest[] = [];

  constructor(
    private companyService: CompanyService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadOpportunities();
    this.loadMockProductInterests();
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

  loadMockProductInterests(): void {
    // In a real implementation, this would call a service method
    // For now, we'll create some mock data
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

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString();
  }

  formatCurrency(amount: number): string {
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

  // Mock product data - in a real app, this would come from a service
  getProductName(productId: string): string {
    const products: {[key: string]: string} = {
      'prod-1': 'Premium CRM Package',
      'prod-2': 'Enterprise Solution'
    };
    return products[productId] || 'Unknown Product';
  }
}
