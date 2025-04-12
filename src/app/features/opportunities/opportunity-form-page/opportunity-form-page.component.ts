// src/app/features/opportunities/opportunity-form-page/opportunity-form-page.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { OpportunitiesService } from '../opportunities.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Opportunity } from '../../../core/models/company.model';
import { OpportunityFormComponent } from '../opportunity-form/opportunity-form.component';

@Component({
  selector: 'app-opportunity-form-page',
  standalone: true,
  imports: [
    CommonModule,
    OpportunityFormComponent
  ],
  template: `
    <div class="container mx-auto px-4 py-6">
      <div class="flex justify-between items-center mb-6">
        <div class="flex items-center">
          <button (click)="goBack()" class="mr-4 text-gray-600 hover:text-gray-900">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 class="text-2xl font-bold text-gray-800">{{ isEditMode ? 'Edit Opportunity' : 'Create Opportunity' }}</h1>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-md p-6">
        <app-opportunity-form
          [opportunity]="opportunity"
          [isSaving]="isSaving"
          [preselectedCompanyId]="companyId"
          (close)="goBack()"
          (formSubmitted)="handleSaveOpportunity($event)">
        </app-opportunity-form>
      </div>
    </div>
  `,
  styles: []
})
export class OpportunityFormPageComponent implements OnInit {
  opportunity: Opportunity | null = null;
  isLoading = false;
  isSaving = false;
  opportunityId: string | null = null;
  isEditMode = false;
  companyId: string | null = null;

  constructor(
    private opportunitiesService: OpportunitiesService,
    private route: ActivatedRoute,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Check if we're in edit mode
    this.route.paramMap.subscribe(params => {
      this.opportunityId = params.get('id');
      this.isEditMode = !!this.opportunityId;

      if (this.isEditMode && this.opportunityId) {
        this.loadOpportunity(this.opportunityId);
      }
    });

    // Check for company_id in query params (for creating from company page)
    this.route.queryParamMap.subscribe(params => {
      const companyId = params.get('company_id');
      if (companyId) {
        this.companyId = companyId;
      }
    });
  }

  loadOpportunity(id: string): void {
    this.isLoading = true;
    this.opportunitiesService.getOpportunityById(id).subscribe({
      next: (opportunity) => {
        this.opportunity = opportunity;
        this.isLoading = false;
      },
      error: () => {
        this.notificationService.error('Failed to load opportunity');
        this.isLoading = false;
        this.router.navigate(['/opportunities']);
      }
    });
  }

  handleSaveOpportunity(opportunityData: Partial<Opportunity>): void {
    this.isSaving = true;

    if (this.isEditMode && this.opportunityId) {
      // Update existing opportunity
      this.opportunitiesService.updateOpportunity(this.opportunityId, opportunityData).subscribe({
        next: () => {
          this.notificationService.success('Opportunity updated successfully');
          this.isSaving = false;
          this.router.navigate(['/opportunities']);
        },
        error: (err) => {
          console.error('Error updating opportunity:', err);
          this.notificationService.error('Failed to update opportunity');
          this.isSaving = false;
        }
      });
    } else {
      // Create new opportunity
      this.opportunitiesService.addOpportunity(opportunityData).subscribe({
        next: () => {
          this.notificationService.success('Opportunity created successfully');
          this.isSaving = false;
          this.router.navigate(['/opportunities']);
        },
        error: (err) => {
          console.error('Error adding opportunity:', err);
          this.notificationService.error('Failed to create opportunity');
          this.isSaving = false;
        }
      });
    }
  }

  goBack(): void {
    if (this.companyId) {
      this.router.navigate(['/companies', this.companyId], { queryParams: { tab: 'opportunities' } });
    } else {
      this.router.navigate(['/opportunities']);
    }
  }
}
