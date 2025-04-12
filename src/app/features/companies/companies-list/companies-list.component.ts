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

    // For testing purposes, add a button to add a test scheduled activity
    setTimeout(() => {
      console.log('Adding test button for scheduled activities');
      const container = document.querySelector('.container');
      if (container) {
        const testButton = document.createElement('button');
        testButton.textContent = 'Add Test Scheduled Activity';
        testButton.className = 'btn-primary mt-4';
        testButton.addEventListener('click', () => this.addTestScheduledActivity());
        container.prepend(testButton);
      }
    }, 1000);
  }

  // Test function to add a scheduled activity
  addTestScheduledActivity(): void {
    if (this.companies.length === 0) {
      this.notificationService.error('No companies available');
      return;
    }

    // Get the first company
    const company = this.companies[0];
    console.log(`Adding test scheduled activity for company: ${company.name} (${company.id})`);

    // Update the scheduledActivitiesMap
    this.scheduledActivitiesMap[company.id] = (this.scheduledActivitiesMap[company.id] || 0) + 1;
    console.log('Updated scheduledActivitiesMap:', this.scheduledActivitiesMap);

    // Force a refresh of the component
    this.filteredCompanies = [...this.companies];
    this.notificationService.success(`Added test scheduled activity for ${company.name}`);
  }

  loadCompanies(): void {
    this.isLoading = true;
    this.companyService.getCompaniesWithScheduledCalls().subscribe({
      next: (data) => {
        this.companies = data.companies;
        this.scheduledActivitiesMap = data.scheduledActivitiesMap;
        this.filteredCompanies = [...this.companies];
        console.log('Companies loaded with scheduled activities:', this.scheduledActivitiesMap);

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
    const hasActivities = !!this.scheduledActivitiesMap[companyId];
    console.log(`Checking if company ${companyId} has activities: ${hasActivities}`);
    return hasActivities;
  }

  // Get the number of scheduled activities for a company
  getScheduledActivitiesCount(companyId: string): number {
    const count = this.scheduledActivitiesMap[companyId] || 0;
    console.log(`Getting activity count for company ${companyId}: ${count}`);
    return count;
  }
}
