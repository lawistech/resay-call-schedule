// src/app/features/companies/companies-list/companies-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CompanyService } from '../services/company.service';
import { Company } from '../../../core/models/company.model';
import { NotificationService } from '../../../core/services/notification.service';
import { CompanyRefreshService } from '../services/company-refresh.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-companies-list',
  templateUrl: './companies-list.component.html',
  styleUrls: ['./companies-list.component.scss']
})
export class CompaniesListComponent implements OnInit, OnDestroy {
  companies: Company[] = [];
  filteredCompanies: Company[] = [];
  isLoading = true;
  searchTerm = '';
  selectedIndustry = '';

  // View mode toggle
  viewMode: 'grid' | 'table' = 'grid';

  // Scheduled activities and active quotations tracking
  scheduledActivitiesMap: {[companyId: string]: number} = {};
  activeQuotationsMap: {[companyId: string]: number} = {};

  // Subscription to handle component cleanup
  private refreshSubscription: Subscription | null = null;

  constructor(
    private companyService: CompanyService,
    private router: Router,
    private notificationService: NotificationService,
    private companyRefreshService: CompanyRefreshService
  ) {}

  ngOnInit(): void {
    this.loadCompanies();

    // Subscribe to call scheduling events
    this.refreshSubscription = this.companyRefreshService.callScheduled$.subscribe(companyId => {
      console.log('Company list received notification of scheduled call for company:', companyId);
      // Reload companies to update the indicators
      setTimeout(() => {
        console.log('Reloading companies after call scheduling notification');
        this.loadCompanies();
      }, 100);
    });
  }

  ngOnDestroy(): void {
    // Clean up subscription when component is destroyed
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadCompanies(): void {
    this.isLoading = true;
    this.companyService.getCompaniesWithScheduledCalls().subscribe({
      next: (data) => {
        this.companies = data.companies;
        this.scheduledActivitiesMap = data.scheduledActivitiesMap;
        this.activeQuotationsMap = data.activeQuotationsMap;
        this.filteredCompanies = [...this.companies];
        console.log('Companies loaded with scheduled activities:', this.scheduledActivitiesMap);
        console.log('Companies loaded with active quotations:', this.activeQuotationsMap);

        // Log which companies have scheduled activities
        this.companies.forEach(company => {
          if (this.hasScheduledActivities(company.id)) {
            console.log(`Company ${company.name} (${company.id}) has ${this.getScheduledActivitiesCount(company.id)} scheduled activities`);
          }
        });

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading companies:', error);
        this.notificationService.error('Failed to load companies');
        this.isLoading = false;
      }
    });
  }

  filterCompanies(): void {
    this.filteredCompanies = this.companies.filter(company => {
      const matchesSearch = !this.searchTerm ||
        company.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        company.industry?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        company.website?.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesIndustry = !this.selectedIndustry ||
        company.industry === this.selectedIndustry;

      return matchesSearch && matchesIndustry;
    });
  }

  viewCompany(id: string): void {
    this.router.navigate(['/companies', id]);
  }

  editCompany(id: string, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/companies', id, 'edit']);
  }

  deleteCompany(id: string, event: Event): void {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this company?')) {
      this.companyService.deleteCompany(id).subscribe({
        next: () => {
          this.loadCompanies();
        },
        error: () => {
          this.notificationService.error('Failed to delete company');
        }
      });
    }
  }

  createCompany(): void {
    this.router.navigate(['/companies/new']);
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'grid' ? 'table' : 'grid';
  }

  getUniqueIndustries(): string[] {
    const industries = this.companies
      .map(company => company.industry || '')
      .filter(industry => industry !== '');

    return [...new Set(industries)].sort();
  }

  // Check if a company has scheduled activities
  hasScheduledActivities(companyId: string): boolean {
    return !!this.scheduledActivitiesMap[companyId];
  }

  // Get the number of scheduled activities for a company
  getScheduledActivitiesCount(companyId: string): number {
    return this.scheduledActivitiesMap[companyId] || 0;
  }

  // Check if a company has active quotations
  hasActiveQuotations(companyId: string): boolean {
    return !!this.activeQuotationsMap[companyId];
  }

  // Get the number of active quotations for a company
  getActiveQuotationsCount(companyId: string): number {
    return this.activeQuotationsMap[companyId] || 0;
  }

  // Get the CSS class for the company card based on its status
  getCompanyCardClass(company: Company): string {
    let classes = 'bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer ';

    if (this.hasActiveQuotations(company.id)) {
      classes += 'border-l-4 border-blue-500 shadow-lg bg-blue-50 ';
    } else if (this.hasScheduledActivities(company.id)) {
      classes += 'border-l-4 border-amber-500 shadow-md ';
    } else {
      classes += 'shadow-md ';
    }

    return classes;
  }

  // Get the CSS class for the company row in table view
  getCompanyRowClass(company: Company): string {
    let classes = 'hover:bg-gray-50 cursor-pointer ';

    if (this.hasActiveQuotations(company.id)) {
      classes += 'border-l-4 border-blue-500 bg-blue-50 ';
    } else if (this.hasScheduledActivities(company.id)) {
      classes += 'border-l-4 border-amber-500 ';
    }

    return classes;
  }
}
