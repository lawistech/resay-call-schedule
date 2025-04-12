// src/app/features/companies/companies-list/companies-list.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CompanyService } from '../services/company.service';
import { Company } from '../../../core/models/company.model';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-companies-list',
  templateUrl: './companies-list.component.html',
  styleUrls: ['./companies-list.component.scss']
})
export class CompaniesListComponent implements OnInit {
  companies: Company[] = [];
  filteredCompanies: Company[] = [];
  isLoading = true;
  searchTerm = '';
  selectedIndustry = '';

  // View mode toggle
  viewMode: 'grid' | 'table' = 'grid';

  // Scheduled activities tracking
  scheduledActivitiesMap: {[companyId: string]: number} = {};

  constructor(
    private companyService: CompanyService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadCompanies();
  }

  loadCompanies(): void {
    this.isLoading = true;
    this.companyService.getCompaniesWithScheduledCalls().subscribe({
      next: (data) => {
        this.companies = data.companies;
        this.scheduledActivitiesMap = data.scheduledActivitiesMap;
        this.filteredCompanies = [...this.companies];
        console.log('Companies loaded with scheduled activities:', this.scheduledActivitiesMap);
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
        error: (error) => {
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
}
