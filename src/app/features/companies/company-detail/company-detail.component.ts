// src/app/features/companies/company-detail/company-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CompanyService } from '../services/company.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Company } from '../../../core/models/company.model';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-company-detail',
  templateUrl: './company-detail.component.html',
  styleUrls: ['./company-detail.component.scss'],
  providers: [DatePipe]
})
export class CompanyDetailComponent implements OnInit {
  company: Company | null = null;
  isLoading = true;
  activeTab: 'overview' | 'people' | 'communication' | 'opportunities' = 'overview';
  companyId: string = '';

  constructor(
    private companyService: CompanyService,
    private route: ActivatedRoute,
    private router: Router,
    private notificationService: NotificationService,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    console.log('CompanyDetailComponent initialized');
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.companyId = id;
        console.log('Company ID set in CompanyDetailComponent:', this.companyId);
        this.loadCompany(id);
      } else {
        console.error('No company ID found in route params');
        this.router.navigate(['/companies']);
      }
    });

    // Check if there's a tab in the URL
    this.route.queryParamMap.subscribe(params => {
      const tab = params.get('tab');
      if (tab) {
        this.setActiveTab(tab as any);
      }
    });
  }

  loadCompany(id: string): void {
    this.isLoading = true;
    this.companyService.getCompanyById(id).subscribe({
      next: (company) => {
        this.company = company;

        // Load company metrics
        this.companyService.calculateCompanyMetrics(id).subscribe({
          next: (metrics) => {
            if (this.company) {
              this.company.metrics = metrics;
            }
            this.isLoading = false;
          },
          error: () => {
            this.isLoading = false;
          }
        });
      },
      error: (error) => {
        this.notificationService.error('Failed to load company details');
        this.isLoading = false;
        this.router.navigate(['/companies']);
      }
    });
  }

  setActiveTab(tab: 'overview' | 'people' | 'communication' | 'opportunities'): void {
    console.log('Setting active tab:', tab);
    this.activeTab = tab;

    // Update URL without navigation
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge',
      skipLocationChange: false
    });
  }

  editCompany(): void {
    this.router.navigate(['/companies', this.companyId, 'edit']);
  }

  deleteCompany(): void {
    if (confirm('Are you sure you want to delete this company?')) {
      this.companyService.deleteCompany(this.companyId).subscribe({
        next: () => {
          this.notificationService.success('Company deleted successfully');
          this.router.navigate(['/companies']);
        },
        error: (error) => {
          this.notificationService.error('Failed to delete company');
        }
      });
    }
  }

  // Format date from ISO string to a readable format
  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A';

    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) return 'N/A';

      // Format: Apr 12, 2025 10:00 AM
      return this.datePipe.transform(date, 'MMM d, y h:mm a') || 'N/A';
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  }
}
