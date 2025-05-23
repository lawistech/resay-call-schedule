// src/app/features/leads/lead-creation-page/lead-creation-page.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';
import { LeadWizardComponent } from '../lead-wizard/lead-wizard.component';
import { Company } from '../../../core/models/company.model';
import { Contact } from '../../../core/models/contact.model';

@Component({
  selector: 'app-lead-creation-page',
  standalone: true,
  imports: [
    CommonModule,
    LeadWizardComponent
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
          <h1 class="text-2xl font-bold text-gray-800">Create New Lead</h1>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-md">
        <app-lead-wizard
          [isStandalonePage]="true"
          (wizardComplete)="handleWizardComplete($event)"
          (wizardCancel)="goBack()">
        </app-lead-wizard>
      </div>
    </div>
  `,
  styles: []
})
export class LeadCreationPageComponent implements OnInit {
  companyId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Check for company_id in query params (for creating from company page)
    this.route.queryParamMap.subscribe(params => {
      const companyId = params.get('company_id');
      if (companyId) {
        this.companyId = companyId;
      }
    });
  }

  handleWizardComplete(result: {company: Company, contact: Contact}): void {
    this.notificationService.success('Lead created successfully');
    
    // Navigate back to leads list
    if (this.companyId) {
      this.router.navigate(['/companies', this.companyId], { queryParams: { tab: 'contacts' } });
    } else {
      this.router.navigate(['/leads']);
    }
  }

  goBack(): void {
    if (this.companyId) {
      this.router.navigate(['/companies', this.companyId], { queryParams: { tab: 'contacts' } });
    } else {
      this.router.navigate(['/leads']);
    }
  }
}
